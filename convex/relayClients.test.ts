/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";
import { describe, expect, test } from "vitest";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
const input = { name: "Acme", company: "Acme Films", contactName: "Ava", email: "ava@acme.test", phone: "555-0100", notes: "Retainer" };
const create = makeFunctionReference<"mutation", typeof input, { id: string }>("relayClients:create");
const list = makeFunctionReference<"query", { includeArchived?: boolean; search?: string }, Array<typeof input & { id: string; archived: boolean }>>("relayClients:list");
const edit = makeFunctionReference<"mutation", typeof input & { id: string }, null>("relayClients:edit");
const setArchived = makeFunctionReference<"mutation", { id: string; archived: boolean }, null>("relayClients:setArchived");

describe("Relay cloud Clients", () => {
  test("derives ownership, validates writes, searches, archives, and isolates Workspaces", async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity({ tokenIdentifier: "owner" });
    const other = t.withIdentity({ tokenIdentifier: "other" });
    await expect(owner.mutation(create, { ...input, email: "bad" })).rejects.toThrow("valid Client");
    const { id } = await owner.mutation(create, input);
    await expect(other.query(list, { includeArchived: true })).resolves.toEqual([]);
    await owner.mutation(edit, { id, ...input, notes: "Priority" });
    await expect(owner.query(list, { search: "priority" })).resolves.toMatchObject([{ id, notes: "Priority" }]);
    await owner.mutation(setArchived, { id, archived: true });
    await expect(owner.query(list, {})).resolves.toEqual([]);
    await expect(owner.query(list, { includeArchived: true })).resolves.toHaveLength(1);
    await expect(other.mutation(setArchived, { id, archived: false })).rejects.toThrow("Client not found");
  });
});
