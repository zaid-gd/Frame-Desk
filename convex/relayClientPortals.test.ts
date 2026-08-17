/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";

const modules = import.meta.glob("./**/*.ts");
const { publish, setOpen, regenerateToken, publicView } = api.relayClientPortals;

describe("Relay Client Portal security", () => {
  test("returns only the selected client-safe current-version contract", async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity({ tokenIdentifier: "owner|portal" });
    const other = t.withIdentity({ tokenIdentifier: "other|portal" });
    await t.run(async (ctx) => {
      await ctx.db.insert("relayProjects", {
        ownerUserId: "owner|portal", importedAt: "2026-08-18T00:00:00.000Z", id: "project_safe", name: "Safe campaign",
        clientId: "client_private", stage: "Client Review", tone: "review", due: "2026-08-30", progress: "50%",
        outstandingAmount: 42_000, lead: "Private Lead", assignees: ["Private Editor"], financialType: "salaryPlan",
        completedAt: "2026-08-20T10:00:00.000Z",
      });
      await ctx.db.insert("relayProjectOutputs", { ownerUserId: "owner|portal", durableId: "output_shared", projectId: "project_safe", name: "Main film", reviewState: "in_review", archived: false, currentVersionId: "version_current" });
      await ctx.db.insert("relayProjectOutputs", { ownerUserId: "owner|portal", durableId: "output_private", projectId: "project_safe", name: "Private file", reviewState: "draft", archived: false, currentVersionId: "version_private" });
      await ctx.db.insert("relayMediaVersions", { ownerUserId: "owner|portal", durableId: "version_old", projectId: "project_safe", outputId: "output_shared", number: 1, provider: "link", normalizedUrl: "https://example.com/old", addedAt: "2026-08-10T00:00:00.000Z" });
      await ctx.db.insert("relayMediaVersions", { ownerUserId: "owner|portal", durableId: "version_current", projectId: "project_safe", outputId: "output_shared", number: 2, provider: "vimeo", providerId: "123", normalizedUrl: "https://vimeo.com/123", addedAt: "2026-08-18T00:00:00.000Z" });
      await ctx.db.insert("relayMediaVersions", { ownerUserId: "owner|portal", durableId: "version_private", projectId: "project_safe", outputId: "output_private", number: 1, provider: "link", normalizedUrl: "https://example.com/private", addedAt: "2026-08-18T00:00:00.000Z" });
      await ctx.db.insert("relayMediaComments", { ownerUserId: "owner|portal", durableId: "comment_internal", projectId: "project_safe", versionId: "version_old", body: "Internal review history", resolved: false });
    });

    await expect(other.mutation(publish, { projectId: "project_safe", publicNotes: "Public only", showDueDate: true, showCompletedDate: false, outputIds: ["output_shared"], expiresAt: null, pin: "2468", removePin: false })).rejects.toThrow("Project not found");
    const { token } = await owner.mutation(publish, { projectId: "project_safe", publicNotes: "Public only", showDueDate: true, showCompletedDate: false, outputIds: ["output_shared"], expiresAt: null, pin: "2468", removePin: false });
    await owner.mutation(publish, { projectId: "project_safe", publicNotes: "Updated safely", showDueDate: true, showCompletedDate: false, outputIds: ["output_shared"], expiresAt: null, pin: "", removePin: false });

    await expect(t.query(publicView, { token })).resolves.toEqual({ access: "pin-required" });
    await expect(t.query(publicView, { token, pin: "0000" })).resolves.toEqual({ access: "wrong-pin" });
    const result = await t.query(publicView, { token, pin: "2468" });
    expect(result).toEqual({
      access: "open",
      view: {
        branding: "relay",
        project: { name: "Safe campaign", stage: "Client Review", progress: 50, publicNotes: "Updated safely", dueDate: "2026-08-30", completedAt: null },
        outputs: [{ id: "output_shared", name: "Main film", reviewState: "in_review", currentVersion: { id: "version_current", source: { provider: "vimeo", providerId: "123", url: "https://vimeo.com/123" } } }],
      },
    });
    expect(JSON.stringify(result)).not.toMatch(/Private|42_000|version_old|salaryPlan|client_private/);

    await owner.mutation(setOpen, { projectId: "project_safe", open: false });
    await expect(t.query(publicView, { token, pin: "2468" })).resolves.toEqual({ access: "closed" });
    expect(await t.run(async (ctx) => ctx.db.query("relayMediaComments").collect())).toHaveLength(1);
    await owner.mutation(setOpen, { projectId: "project_safe", open: true });
    const next = await owner.mutation(regenerateToken, { projectId: "project_safe" });
    expect(next.token).not.toBe(token);
    await expect(t.query(publicView, { token, pin: "2468" })).resolves.toEqual({ access: "invalid" });
    expect(await t.run(async (ctx) => ctx.db.query("relayClientPortals").collect())).toHaveLength(1);
  });

  test("reports expired access without deleting portal history", async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity({ tokenIdentifier: "owner|expired" });
    await t.run(async (ctx) => {
      await ctx.db.insert("relayProjects", { ownerUserId: "owner|expired", importedAt: "2026-08-18T00:00:00.000Z", id: "project_expired", name: "Old portal", clientId: "client", stage: "Delivered", tone: "delivered", due: "2026-08-01", progress: "100%" });
    });
    const { token } = await owner.mutation(publish, { projectId: "project_expired", publicNotes: "", showDueDate: false, showCompletedDate: false, outputIds: [], expiresAt: "2020-01-01T00:00:00.000Z", pin: "", removePin: false });
    await expect(t.query(publicView, { token })).resolves.toEqual({ access: "expired" });
    expect(await t.run(async (ctx) => ctx.db.query("relayClientPortals").collect())).toHaveLength(1);
  });
});
