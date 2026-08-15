/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";
import { describe, expect, test } from "vitest";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

const project = {
  id: "project_launch",
  name: "Launch film",
  clientId: "client_acme",
  stage: "In review",
  tone: "review" as const,
  due: "Aug 22, 2026",
  progress: "80%",
};
const client = { id: "client_acme", name: "Acme", company: "Acme Films", contactName: "Ava", email: "ava@acme.test", phone: "555-0100", notes: "Retainer", archived: false };

type RelayProject = typeof project;
const importLocalWorkspace = makeFunctionReference<
  "mutation",
  { projects: RelayProject[]; clients: typeof client[] },
  { ok: true; imported: number } | { ok: false; error: string }
>("relayWorkspaceImport:importLocalWorkspace");
const listMine = makeFunctionReference<"query", Record<string, never>, RelayProject[]>("relayWorkspaceImport:listMine");
const list = makeFunctionReference<"query", { includeArchived?: boolean }, Array<typeof client>>("relayClients:list");

describe("Relay cloud Workspace import", () => {
  test("requires a signed-in identity", async () => {
    const t = convexTest(schema, modules);

    await expect(t.mutation(importLocalWorkspace, { projects: [project], clients: [client] }))
      .rejects.toThrow("Sign in to import a Local Mode backup.");
  });

  test("imports into an empty Workspace once and assigns every record to the server identity", async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity({ tokenIdentifier: "owner" });

    await expect(owner.mutation(importLocalWorkspace, { projects: [project], clients: [client] }))
      .resolves.toEqual({ ok: true, imported: 2 });
    await expect(owner.query(listMine, {})).resolves.toEqual([project]);
    const storedOwners = await t.run(async (ctx) => {
      const records = await ctx.db.query("relayProjects").withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", "owner")).take(2);
      return records.map((record) => record.ownerUserId);
    });
    expect(storedOwners).toEqual(["owner"]);
    const storedClients = await owner.query(list, { includeArchived: true });
    expect(storedClients).toMatchObject([{ name: "Acme", archived: false }]);

    await expect(owner.mutation(importLocalWorkspace, { projects: [project], clients: [client] }))
      .resolves.toEqual({
        ok: false,
        error: "This cloud Workspace already contains records. Relay did not change either source.",
      });
    await expect(owner.query(listMine, {})).resolves.toEqual([project]);
  });

  test("refuses a Relay cloud Workspace with existing work and leaves it unchanged", async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity({ tokenIdentifier: "owner" });
    await t.run(async (ctx) => {
      await ctx.db.insert("relayProjects", { ownerUserId: "owner", importedAt: "2026-08-01T00:00:00.000Z", ...project, name: "Existing cloud project" });
    });

    await expect(owner.mutation(importLocalWorkspace, { projects: [project], clients: [client] }))
      .resolves.toEqual({
        ok: false,
        error: "This cloud Workspace already contains records. Relay did not change either source.",
      });
    await expect(owner.query(listMine, {})).resolves.toEqual([{ ...project, name: "Existing cloud project" }]);
  });

  test("rejects an oversized record set before any write", async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity({ tokenIdentifier: "owner" });

    await expect(owner.mutation(importLocalWorkspace, {
      projects: Array.from({ length: 501 }, (_, index) => ({ ...project, name: `Project ${index}` })), clients: [],
    })).rejects.toThrow("A Relay backup can contain no more than 500 projects.");
    await expect(owner.query(listMine, {})).resolves.toEqual([]);
  });

  test("rejects unsafe project fields before any write", async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity({ tokenIdentifier: "owner" });

    await expect(owner.mutation(importLocalWorkspace, {
      projects: [{ ...project, name: `Unsafe${"x".repeat(200)}` }], clients: [],
    })).rejects.toThrow("The backup contains an invalid project record.");
    await expect(owner.query(listMine, {})).resolves.toEqual([]);
  });

  test("rejects Projects whose Client identifier is missing from the import", async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity({ tokenIdentifier: "owner" });
    await expect(owner.mutation(importLocalWorkspace, { projects: [project], clients: [] }))
      .rejects.toThrow("Every imported Project must refer to one imported Client identifier.");
    await expect(owner.query(listMine, {})).resolves.toEqual([]);
  });
});
