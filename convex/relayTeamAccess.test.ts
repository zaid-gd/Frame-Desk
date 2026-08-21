/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";
import { describe, expect, test } from "vitest";
import schema from "./schema";
import type { Id } from "./_generated/dataModel";

const modules = import.meta.glob("./**/*.ts");
const updateSettings = makeFunctionReference<"mutation", { name: string; currencyCode: string; timeZone: string; defaultWorkflowTemplateId: string; editorsCanViewAll: boolean }, null>("relayTeamAccess:updateSettings");
const inviteMember = makeFunctionReference<"mutation", { email: string; name: string; role: "Editor" | "Viewer" }, { id: string }>("relayTeamAccess:inviteMember");
const transferOwnership = makeFunctionReference<"mutation", { memberId: string }, null>("relayTeamAccess:transferOwnership");
const removeMember = makeFunctionReference<"mutation", { memberId: string }, null>("relayTeamAccess:removeMember");
const leaveWorkspace = makeFunctionReference<"mutation", Record<string, never>, null>("relayTeamAccess:leaveWorkspace");
const acceptInvitation = makeFunctionReference<"mutation", Record<string, never>, boolean>("relayTeamAccess:acceptInvitation");
const prepareAccountDeletion = makeFunctionReference<"mutation", Record<string, never>, null>("relayTeamAccess:prepareAccountDeletion");
const createProject = makeFunctionReference<"mutation", { name: string; clientId: string; projectGroupId: string; templateId: string; dueDate: string; financialType: "nonBillable" }, { id: string }>("relayProjects:createProject");
const listProjects = makeFunctionReference<"query", Record<string, never>, Array<Record<string, unknown>>>("relayProjects:listProjects");

describe("Relay Team access", () => {
  test("stores Owner settings and caps the free Workspace at two invited members", async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity({ tokenIdentifier: "owner" });

    await owner.mutation(updateSettings, { name: "Production Desk", currencyCode: "AED", timeZone: "Asia/Dubai", defaultWorkflowTemplateId: "template_default", editorsCanViewAll: true });
    await owner.mutation(inviteMember, { email: "editor@example.com", name: "Editor", role: "Editor" });
    await owner.mutation(inviteMember, { email: "viewer@example.com", name: "Viewer", role: "Viewer" });
    await expect(owner.mutation(inviteMember, { email: "third@example.com", name: "Third", role: "Viewer" })).rejects.toThrow("two invited members");
    await expect(t.withIdentity({ tokenIdentifier: "editor", email: "editor@example.com", name: "Edi Tor" }).mutation(acceptInvitation, {})).resolves.toBe(true);

    await t.run(async (ctx) => {
      const workspace = await ctx.db.query("relayTeamWorkspaces").withIndex("by_dataOwnerUserId", (q) => q.eq("dataOwnerUserId", "owner")).unique();
      expect(workspace).toMatchObject({ name: "Production Desk", currencyCode: "AED", timeZone: "Asia/Dubai", defaultWorkflowTemplateId: "template_default", editorsCanViewAll: true });
      const editor = await ctx.db.query("relayTeamMembers").withIndex("by_workspaceId_and_email", (q) => q.eq("workspaceId", workspace!._id).eq("email", "editor@example.com")).unique();
      expect(editor).toMatchObject({ userId: "editor", name: "Edi Tor", role: "Editor", status: "active", permissions: { projects: true, reviews: true, portals: true, finance: false } });
      expect(await ctx.db.query("teamWorkspaces").collect()).toEqual([]);
      expect(await ctx.db.query("teamMembers").collect()).toEqual([]);
    });
  });

  test("requires ownership transfer before leaving and removes a member without removing work", async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity({ tokenIdentifier: "owner" });
    await owner.mutation(updateSettings, { name: "Desk", currencyCode: "USD", timeZone: "UTC", defaultWorkflowTemplateId: "template_default", editorsCanViewAll: false });
    const invited = await owner.mutation(inviteMember, { email: "next@example.com", name: "Next owner", role: "Editor" });
    await t.run(async (ctx) => {
      const member = await ctx.db.get(invited.id as Id<"relayTeamMembers">);
      await ctx.db.patch(member!._id, { userId: "next", status: "active", joinedAt: "2026-08-21T00:00:00.000Z" });
      await ctx.db.insert("relayClients", { ownerUserId: "owner", durableId: "client_1", name: "Client", company: "", contactName: "", email: "", phone: "", notes: "", archived: false });
    });
    const project = await owner.mutation(createProject, { name: "Project", clientId: "client_1", projectGroupId: "", templateId: "template_default", dueDate: "2026-09-01", financialType: "nonBillable" });
    await t.run(async (ctx) => {
      const row = await ctx.db.query("relayProjects").withIndex("by_ownerUserId_and_id", (q) => q.eq("ownerUserId", "owner").eq("id", project.id)).unique();
      await ctx.db.patch(row!._id, { lead: "owner", assignees: ["owner"] });
    });

    await expect(owner.mutation(leaveWorkspace, {})).rejects.toThrow("Transfer ownership");
    await owner.mutation(transferOwnership, { memberId: "next" });
    await expect(t.withIdentity({ tokenIdentifier: "next" }).mutation(prepareAccountDeletion, {})).rejects.toThrow("Transfer ownership");
    await expect(owner.mutation(updateSettings, { name: "Stolen", currencyCode: "USD", timeZone: "UTC", defaultWorkflowTemplateId: "template_default", editorsCanViewAll: true })).rejects.toThrow("Only the Workspace Owner");
    await t.withIdentity({ tokenIdentifier: "next" }).mutation(removeMember, { memberId: "owner" });
    await expect(owner.query(listProjects, {})).resolves.toEqual([]);

    await t.run(async (ctx) => {
      expect(await ctx.db.query("relayProjects").withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", "owner")).collect()).toMatchObject([{ id: project.id, lead: "Unassigned", assignees: [] }]);
      expect(await ctx.db.query("relayClients").withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", "owner")).collect()).toHaveLength(1);
      expect(await ctx.db.query("relayTeamActivity").collect()).not.toHaveLength(0);
      expect(await ctx.db.query("relayTeamWorkspaces").withIndex("by_dataOwnerUserId", (q) => q.eq("dataOwnerUserId", "owner")).unique()).toMatchObject({ currentOwnerUserId: "next" });
    });
  });

  test("clears only open assignments when a member leaves", async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity({ tokenIdentifier: "owner" });
    await owner.mutation(updateSettings, { name: "Desk", currencyCode: "USD", timeZone: "UTC", defaultWorkflowTemplateId: "template_default", editorsCanViewAll: false });
    const invited = await owner.mutation(inviteMember, { email: "editor@example.com", name: "Editor", role: "Editor" });
    await t.run(async (ctx) => {
      await ctx.db.patch(invited.id as Id<"relayTeamMembers">, { userId: "editor", status: "active" });
      for (const [id, status, completedAt] of [["open", "active", undefined], ["past", "past", "2026-08-01T00:00:00.000Z"]] as const) {
        await ctx.db.insert("relayProjects", { ownerUserId: "owner", importedAt: "2026-08-01", id, name: id, clientId: "client", stage: "Editing", tone: "planned", due: "2026-09-01", progress: "0%", status, lead: "editor", assignees: ["editor"], ...(completedAt ? { completedAt } : {}) });
      }
    });
    await owner.mutation(removeMember, { memberId: "editor" });
    await t.run(async (ctx) => {
      const rows = await ctx.db.query("relayProjects").withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", "owner")).collect();
      expect(rows.find(({ id }) => id === "open")).toMatchObject({ lead: "Unassigned", assignees: [] });
      expect(rows.find(({ id }) => id === "past")).toMatchObject({ lead: "editor", assignees: ["editor"] });
    });
  });
});
