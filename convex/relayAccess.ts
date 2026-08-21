import type { QueryCtx, MutationCtx } from "./_generated/server";
import { buildTeamAccess, type TeamPermissionKey } from "../src/relay/domain/team-access";
import { canAccessProject } from "../src/relay/domain/team-access";

export type RelayAccess = {
  ownerUserId: string;
  memberId: string;
  role: "owner" | "editor" | "viewer";
  canMarkPayments: boolean;
  editorsCanViewAll: boolean;
  permissions: { projects: boolean; reviews: boolean; portals: boolean; finance: boolean };
  canWrite: boolean;
  canViewFinance: boolean;
  canManageSalaryPlans: boolean;
};

type RelayCtx = QueryCtx | MutationCtx;

function roleForMember(role: "Owner" | "Editor" | "Viewer"): RelayAccess["role"] {
  return role === "Owner" ? "owner" : role === "Editor" ? "editor" : "viewer";
}

/** Relay records stay in the creator's data namespace while Relay ownership may transfer to another member. */
export async function relayAccessForCurrentUser(ctx: RelayCtx): Promise<RelayAccess | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const memberships = await ctx.db.query("relayTeamMembers").withIndex("by_userId_and_status", (q) => q.eq("userId", identity.tokenIdentifier).eq("status", "active")).take(2);
  for (const member of memberships) {
    const workspace = await ctx.db.get(member.workspaceId);
    if (workspace) {
      const role = roleForMember(member.role);
      const resolved = buildTeamAccess({ role, memberId: identity.tokenIdentifier, editorsCanViewAll: workspace.editorsCanViewAll ?? false, permissions: { projects: Boolean(member.permissions.projects), reviews: Boolean(member.permissions.reviews), portals: Boolean(member.permissions.portals), finance: Boolean(member.permissions.finance) } });
      return { ownerUserId: workspace.dataOwnerUserId, ...resolved, canMarkPayments: resolved.canViewFinance && resolved.permissions.finance };
    }
  }
  const transferredWorkspace = await ctx.db.query("relayTeamWorkspaces").withIndex("by_dataOwnerUserId", (q) => q.eq("dataOwnerUserId", identity.tokenIdentifier)).unique();
  if (transferredWorkspace) return null;
  const resolved = buildTeamAccess({ role: "owner", memberId: identity.tokenIdentifier, editorsCanViewAll: true });
  return { ownerUserId: identity.tokenIdentifier, ...resolved, canMarkPayments: true };
}

export async function requireRelayPermission(ctx: RelayCtx, permission: TeamPermissionKey) {
  const access = await relayAccessForCurrentUser(ctx);
  if (!access || !access.canWrite || !access.permissions[permission]) throw new Error(`You do not have permission to manage ${permission}.`);
  return access;
}

export async function requireRelayOwner(ctx: RelayCtx) {
  const access = await relayAccessForCurrentUser(ctx);
  if (!access || access.role !== "owner") throw new Error("Only the Workspace Owner can make this change.");
  return access;
}

export function relayProjectVisible(access: RelayAccess, project: { lead?: string; assignees?: readonly string[] }) {
  return canAccessProject(access, { lead: project.lead ?? "Unassigned", assignees: project.assignees ?? [] });
}
