import { v } from "convex/values";
import { query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import type { ProjectActivityKind } from "../src/lib/domain-values";

const MAX_PROJECT_EVENTS = 150;

async function requireProjectAccess(ctx: QueryCtx, projectId: string) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  const project = await ctx.db
    .query("workItems")
    .withIndex("by_workItemId", (q) => q.eq("id", projectId))
    .unique();
  if (!project) throw new Error("Project not found");
  if (!project.teamId) {
    if (project.userId !== identity.tokenIdentifier) throw new Error("Project access required");
    return project;
  }
  const membership = await ctx.db
    .query("teamMembers")
    .withIndex("by_teamId_and_userId", (q) =>
      q.eq("teamId", project.teamId as string).eq("userId", identity.tokenIdentifier)
    )
    .unique();
  if (!membership || membership.status !== "active" || !membership.permissions.viewProjects) {
    throw new Error("Project access required");
  }
  return project;
}

export async function recordProjectActivity(
  ctx: MutationCtx,
  args: {
    project: Pick<Doc<"workItems">, "id" | "userId" | "teamId">;
    actorUserId: string;
    actorName: string;
    kind: ProjectActivityKind;
    message: string;
    detail?: string;
    createdAt?: string;
  }
) {
  const existing = await ctx.db
    .query("projectActivity")
    .withIndex("by_projectId_and_createdAt", (q) => q.eq("projectId", args.project.id))
    .order("desc")
    .take(MAX_PROJECT_EVENTS);
  if (existing.length >= MAX_PROJECT_EVENTS) {
    await ctx.db.delete(existing[existing.length - 1]._id);
  }
  await ctx.db.insert("projectActivity", {
    projectId: args.project.id,
    ownerUserId: args.project.userId,
    teamId: args.project.teamId,
    actorUserId: args.actorUserId,
    actorName: args.actorName.trim().slice(0, 120) || "CutLab user",
    kind: args.kind,
    message: args.message.trim().slice(0, 500),
    detail: args.detail?.trim().slice(0, 1000),
    createdAt: args.createdAt ?? new Date().toISOString(),
  });
}

export async function deleteProjectActivity(ctx: MutationCtx, projectId: string) {
  while (true) {
    const events = await ctx.db
      .query("projectActivity")
      .withIndex("by_projectId_and_createdAt", (q) => q.eq("projectId", projectId))
      .take(100);
    if (!events.length) return;
    await Promise.all(events.map((event) => ctx.db.delete(event._id)));
  }
}

export const listForProject = query({
  args: { projectId: v.string() },
  handler: async (ctx, args) => {
    await requireProjectAccess(ctx, args.projectId);
    const events = await ctx.db
      .query("projectActivity")
      .withIndex("by_projectId_and_createdAt", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(MAX_PROJECT_EVENTS);
    return events.map((event) => ({
      _id: event._id,
      actorName: event.actorName,
      kind: event.kind,
      message: event.message,
      detail: event.detail,
      createdAt: event.createdAt,
    }));
  },
});
