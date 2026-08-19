import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export type RelayAccess = {
  ownerUserId: string;
  memberId: string;
  role: "owner" | "editor" | "viewer";
  canMarkPayments: boolean;
};

type RelayCtx = QueryCtx | MutationCtx;

function roleForMember(role: string): RelayAccess["role"] {
  return role === "Owner" ? "owner" : role === "Editor" ? "editor" : "viewer";
}

/** Relay records stay owned by the account that created the Workspace. Team members reach them through the existing team membership. */
export async function relayAccessForCurrentUser(ctx: RelayCtx): Promise<RelayAccess | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const memberships = await ctx.db.query("teamMembers").withIndex("by_userId_and_status", (q) => q.eq("userId", identity.tokenIdentifier).eq("status", "active")).take(10);
  for (const member of memberships) {
    const workspace = await ctx.db.get(member.teamId as Id<"teamWorkspaces">);
    if (workspace) {
      const role = roleForMember(member.role);
      return { ownerUserId: workspace.ownerUserId, memberId: identity.tokenIdentifier, role, canMarkPayments: role === "owner" || role === "editor" };
    }
  }
  return { ownerUserId: identity.tokenIdentifier, memberId: identity.tokenIdentifier, role: "owner", canMarkPayments: true };
}
