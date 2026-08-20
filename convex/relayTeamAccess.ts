import { makeFunctionReference } from "convex/server";
import { v } from "convex/values";
import { internalMutation, mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

const permissionValidator = v.object({ projects: v.boolean(), reviews: v.boolean(), portals: v.boolean(), finance: v.boolean() });
const ownerPermissions = { projects: true, reviews: true, portals: true, finance: true } as const;
const editorDefaults = { projects: true, reviews: true, portals: true, finance: false } as const;
const viewerDefaults = { projects: false, reviews: false, portals: false, finance: false } as const;
const assignmentBatchSize = 64;

type RelayCtx = QueryCtx | MutationCtx;
type Membership = { member: Doc<"relayTeamMembers">; workspace: Doc<"relayTeamWorkspaces"> };

async function identityOrThrow(ctx: RelayCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Sign in to manage this Workspace.");
  return identity;
}

async function membership(ctx: RelayCtx, userId: string): Promise<Membership | null> {
  const rows = await ctx.db.query("relayTeamMembers").withIndex("by_userId_and_status", (q) => q.eq("userId", userId).eq("status", "active")).take(2);
  for (const member of rows) {
    const workspace = await ctx.db.get(member.workspaceId);
    if (workspace) return { member, workspace };
  }
  return null;
}

async function ensureOwnedWorkspace(ctx: MutationCtx) {
  const identity = await identityOrThrow(ctx);
  const current = await membership(ctx, identity.tokenIdentifier);
  if (current) return { ...current, identity };
  const existing = await ctx.db.query("relayTeamWorkspaces").withIndex("by_currentOwnerUserId", (q) => q.eq("currentOwnerUserId", identity.tokenIdentifier)).unique();
  if (existing) throw new Error("Workspace ownership is inconsistent. Contact support before making Team changes.");
  const workspaceId = await ctx.db.insert("relayTeamWorkspaces", {
    dataOwnerUserId: identity.tokenIdentifier, currentOwnerUserId: identity.tokenIdentifier,
    name: "Production Desk", currencyCode: "USD", timeZone: "UTC", defaultWorkflowTemplateId: "template_default", editorsCanViewAll: false,
    createdAt: new Date().toISOString(),
  });
  const memberId = await ctx.db.insert("relayTeamMembers", {
    workspaceId, userId: identity.tokenIdentifier, email: identity.email ?? "", name: identity.name ?? "Workspace Owner", role: "Owner", status: "active",
    permissions: ownerPermissions, createdAt: new Date().toISOString(), joinedAt: new Date().toISOString(),
  });
  const workspace = await ctx.db.get(workspaceId);
  const member = await ctx.db.get(memberId);
  if (!workspace || !member) throw new Error("Workspace could not be created.");
  return { identity, workspace, member };
}

function requireOwner(member: Doc<"relayTeamMembers">) {
  if (member.role !== "Owner") throw new Error("Only the Workspace Owner can make this change.");
}

async function logActivity(ctx: MutationCtx, workspaceId: Id<"relayTeamWorkspaces">, actor: Doc<"relayTeamMembers">, kind: Doc<"relayTeamActivity">["kind"], message: string) {
  await ctx.db.insert("relayTeamActivity", { workspaceId, actorUserId: actor.userId, actorName: actor.name, kind, message, createdAt: new Date().toISOString() });
}

async function clearAssignmentBatch(ctx: MutationCtx, dataOwnerUserId: string, userId: string, cursor: string | null) {
  const page = await ctx.db.query("relayProjects").withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", dataOwnerUserId)).paginate({ numItems: assignmentBatchSize, cursor });
  for (const project of page.page) {
    if (project.status === "past" || project.completedAt) continue;
    const currentAssignees = project.assignees ?? [];
    const assignees = currentAssignees.filter((id) => id !== userId);
    const lead = project.lead === userId ? "Unassigned" : project.lead;
    if (lead !== project.lead || assignees.length !== currentAssignees.length) await ctx.db.patch(project._id, { lead, assignees });
  }
  if (!page.isDone) {
    const continuation = makeFunctionReference<"mutation", { dataOwnerUserId: string; userId: string; cursor: string }, null>("relayTeamAccess:cleanupMemberAssignments");
    await ctx.scheduler.runAfter(0, continuation, { dataOwnerUserId, userId, cursor: page.continueCursor });
  }
}

export const cleanupMemberAssignments = internalMutation({
  args: { dataOwnerUserId: v.string(), userId: v.string(), cursor: v.string() }, returns: v.null(),
  handler: async (ctx, args) => { await clearAssignmentBatch(ctx, args.dataOwnerUserId, args.userId, args.cursor); return null; },
});

export const getWorkspace = query({
  args: {},
  returns: v.union(v.null(), v.object({
    id: v.string(), name: v.string(), currencyCode: v.string(), timeZone: v.string(), defaultWorkflowTemplateId: v.string(), editorsCanViewAll: v.boolean(),
    currentMemberId: v.string(), role: v.union(v.literal("Owner"), v.literal("Editor"), v.literal("Viewer")),
    members: v.array(v.object({ id: v.string(), userId: v.string(), email: v.string(), name: v.string(), role: v.union(v.literal("Owner"), v.literal("Editor"), v.literal("Viewer")), status: v.union(v.literal("invited"), v.literal("active")), permissions: permissionValidator })),
  })),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const current = await membership(ctx, identity.tokenIdentifier);
    if (!current) return {
      id: "solo", name: "Production Desk", currencyCode: "USD", timeZone: "UTC", defaultWorkflowTemplateId: "template_default", editorsCanViewAll: false,
      currentMemberId: identity.tokenIdentifier, role: "Owner" as const,
      members: [{ id: "solo-owner", userId: identity.tokenIdentifier, email: identity.email ?? "", name: identity.name ?? "Workspace Owner", role: "Owner" as const, status: "active" as const, permissions: ownerPermissions }],
    };
    const members = await ctx.db.query("relayTeamMembers").withIndex("by_workspaceId", (q) => q.eq("workspaceId", current.workspace._id)).take(3);
    return {
      id: String(current.workspace._id), name: current.workspace.name, currencyCode: current.workspace.currencyCode, timeZone: current.workspace.timeZone, defaultWorkflowTemplateId: current.workspace.defaultWorkflowTemplateId, editorsCanViewAll: current.workspace.editorsCanViewAll,
      currentMemberId: current.member.userId, role: current.member.role,
      members: members.map((member) => ({ id: member.userId, userId: member.userId, email: member.email, name: member.name, role: member.role, status: member.status, permissions: member.role === "Owner" ? ownerPermissions : member.role === "Viewer" ? viewerDefaults : member.permissions })),
    };
  },
});

export const updateSettings = mutation({
  args: { name: v.string(), currencyCode: v.string(), timeZone: v.string(), defaultWorkflowTemplateId: v.string(), editorsCanViewAll: v.boolean() }, returns: v.null(),
  handler: async (ctx, args) => {
    const { workspace, member } = await ensureOwnedWorkspace(ctx); requireOwner(member);
    const name = args.name.trim();
    if (!name || name.length > 80) throw new Error("Enter a Workspace name up to 80 characters.");
    if (!/^[A-Z]{3}$/.test(args.currencyCode)) throw new Error("Choose one three-letter currency code.");
    try { new Intl.DateTimeFormat("en", { timeZone: args.timeZone }); } catch { throw new Error("Choose a valid time zone."); }
    if (args.defaultWorkflowTemplateId !== "template_default") {
      const template = await ctx.db.query("relayWorkflowTemplates").withIndex("by_ownerUserId_and_durableId", (q) => q.eq("ownerUserId", workspace.dataOwnerUserId).eq("durableId", args.defaultWorkflowTemplateId)).unique();
      if (!template || template.archived) throw new Error("Choose an active Workflow Template from this Workspace.");
    }
    await ctx.db.patch(workspace._id, { ...args, name }); return null;
  },
});

export const inviteMember = mutation({
  args: { email: v.string(), name: v.string(), role: v.union(v.literal("Editor"), v.literal("Viewer")) }, returns: v.object({ id: v.string() }),
  handler: async (ctx, args) => {
    const { workspace, member } = await ensureOwnedWorkspace(ctx); requireOwner(member);
    const members = await ctx.db.query("relayTeamMembers").withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspace._id)).take(4);
    if (members.length >= 3) throw new Error("The free plan supports one Owner plus two invited members.");
    const email = args.email.trim().toLocaleLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");
    if (members.some((row) => row.email.toLocaleLowerCase() === email)) throw new Error("This person is already invited.");
    const id = await ctx.db.insert("relayTeamMembers", { workspaceId: workspace._id, userId: `invite:${email}`, email, name: args.name.trim() || email, role: args.role, status: "invited", permissions: args.role === "Editor" ? editorDefaults : viewerDefaults, createdAt: new Date().toISOString() });
    await logActivity(ctx, workspace._id, member, "member_invited", `${args.name.trim() || email} invited as ${args.role}.`); return { id: String(id) };
  },
});

export const acceptInvitation = mutation({
  args: {}, returns: v.boolean(),
  handler: async (ctx) => {
    const identity = await identityOrThrow(ctx); const email = identity.email?.trim().toLocaleLowerCase();
    if (!email) return false;
    const invitation = await ctx.db.query("relayTeamMembers").withIndex("by_email_and_status", (q) => q.eq("email", email).eq("status", "invited")).first();
    if (!invitation) return false;
    if (await membership(ctx, identity.tokenIdentifier)) throw new Error("Leave your current Workspace before joining another one.");
    const name = identity.name ?? invitation.name;
    await ctx.db.patch(invitation._id, { userId: identity.tokenIdentifier, name, status: "active", joinedAt: new Date().toISOString() });
    await logActivity(ctx, invitation.workspaceId, { ...invitation, userId: identity.tokenIdentifier, name, status: "active" }, "member_joined", `${name} joined the Team.`); return true;
  },
});

export const updateMember = mutation({
  args: { memberId: v.string(), role: v.union(v.literal("Editor"), v.literal("Viewer")), permissions: permissionValidator }, returns: v.null(),
  handler: async (ctx, args) => {
    const { workspace, member } = await ensureOwnedWorkspace(ctx); requireOwner(member);
    const target = await ctx.db.query("relayTeamMembers").withIndex("by_workspaceId_and_userId", (q) => q.eq("workspaceId", workspace._id).eq("userId", args.memberId)).unique();
    if (!target || target.role === "Owner") throw new Error("Team member not found.");
    await ctx.db.patch(target._id, { role: args.role, permissions: args.role === "Viewer" ? viewerDefaults : args.permissions });
    await logActivity(ctx, workspace._id, member, "member_role_updated", `${target.name}'s access updated.`); return null;
  },
});

export const transferOwnership = mutation({
  args: { memberId: v.string() }, returns: v.null(),
  handler: async (ctx, args) => {
    const { workspace, member } = await ensureOwnedWorkspace(ctx); requireOwner(member);
    const target = await ctx.db.query("relayTeamMembers").withIndex("by_workspaceId_and_userId", (q) => q.eq("workspaceId", workspace._id).eq("userId", args.memberId)).unique();
    if (!target || target.status !== "active" || target.role === "Owner") throw new Error("Choose an active Team member to become Owner.");
    await ctx.db.patch(member._id, { role: "Editor", permissions: editorDefaults });
    await ctx.db.patch(target._id, { role: "Owner", permissions: ownerPermissions });
    await ctx.db.patch(workspace._id, { currentOwnerUserId: target.userId });
    await logActivity(ctx, workspace._id, member, "member_role_updated", `Ownership transferred to ${target.name}.`); return null;
  },
});

export const removeMember = mutation({
  args: { memberId: v.string() }, returns: v.null(),
  handler: async (ctx, args) => {
    const { workspace, member } = await ensureOwnedWorkspace(ctx); requireOwner(member);
    const target = await ctx.db.query("relayTeamMembers").withIndex("by_workspaceId_and_userId", (q) => q.eq("workspaceId", workspace._id).eq("userId", args.memberId)).unique();
    if (!target || target.role === "Owner") throw new Error("Team member not found.");
    await clearAssignmentBatch(ctx, workspace.dataOwnerUserId, target.userId, null); await ctx.db.delete(target._id);
    await logActivity(ctx, workspace._id, member, "member_removed", `${target.name} removed from the Team.`); return null;
  },
});

async function leaveCurrentWorkspace(ctx: MutationCtx, accountDeletion: boolean) {
  const identity = await identityOrThrow(ctx); const current = await membership(ctx, identity.tokenIdentifier);
  if (!current) {
    if (accountDeletion) throw new Error("Transfer ownership before deleting your account.");
    return;
  }
  if (current.member.role === "Owner") throw new Error(accountDeletion ? "Transfer ownership before deleting your account." : "Transfer ownership before leaving or deleting your account.");
  await clearAssignmentBatch(ctx, current.workspace.dataOwnerUserId, current.member.userId, null); await ctx.db.delete(current.member._id);
  await logActivity(ctx, current.workspace._id, current.member, "member_left", accountDeletion ? `${current.member.name} left before deleting their account.` : `${current.member.name} left the Team.`);
}

export const leaveWorkspace = mutation({ args: {}, returns: v.null(), handler: async (ctx) => { await leaveCurrentWorkspace(ctx, false); return null; } });
export const prepareAccountDeletion = mutation({ args: {}, returns: v.null(), handler: async (ctx) => { await leaveCurrentWorkspace(ctx, true); return null; } });
