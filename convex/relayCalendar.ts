import { v } from "convex/values";
import { internalQuery, query } from "./_generated/server";
import { relayAccessForCurrentUser } from "./relayAccess";
import { createCalendarFeedUrl } from "./relayCalendarFeedAccess";
import { buildWorkspaceCalendarEvents } from "../src/relay/domain/workspace-calendar";
import { buildTeamAccess } from "../src/relay/domain/team-access";
import { relayProjectVisible } from "./relayAccess";

const feedEventValidator = v.object({ id: v.string(), date: v.string(), title: v.string(), href: v.string() });

export const feedUrl = query({
  args: { appOrigin: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const access = await relayAccessForCurrentUser(ctx);
    return access ? createCalendarFeedUrl(access.ownerUserId, access.memberId, args.appOrigin) : null;
  },
});

export const feedEvents = internalQuery({
  args: { ownerUserId: v.string(), memberId: v.string() },
  returns: v.array(feedEventValidator),
  handler: async (ctx, args) => {
    const workspace = await ctx.db.query("relayTeamWorkspaces").withIndex("by_dataOwnerUserId", (q) => q.eq("dataOwnerUserId", args.ownerUserId)).unique();
    const member = workspace ? await ctx.db.query("relayTeamMembers").withIndex("by_workspaceId_and_userId", (q) => q.eq("workspaceId", workspace._id).eq("userId", args.memberId)).unique() : null;
    if (workspace && (!member || member.status !== "active")) return [];
    if (!workspace && args.memberId !== args.ownerUserId) return [];
    const access = buildTeamAccess(member ? { role: member.role.toLocaleLowerCase() as "owner" | "editor" | "viewer", memberId: member.userId, editorsCanViewAll: workspace!.editorsCanViewAll, permissions: member.permissions } : { role: "owner", memberId: args.ownerUserId, editorsCanViewAll: true });
    const projectRows = (await ctx.db.query("relayProjects").withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", args.ownerUserId)).take(500)).filter((project) => relayProjectVisible({ ownerUserId: args.ownerUserId, canMarkPayments: access.canViewFinance, ...access }, project));
    const visibleProjectIds = new Set(projectRows.map(({ id }) => id));
    const outputRows = (await ctx.db.query("relayProjectOutputs").withIndex("by_ownerUserId_and_projectId", (q) => q.eq("ownerUserId", args.ownerUserId)).take(500)).filter(({ projectId }) => visibleProjectIds.has(projectId));
    const versions = await ctx.db.query("relayMediaVersions").withIndex("by_ownerUserId_and_outputId_and_number", (q) => q.eq("ownerUserId", args.ownerUserId)).take(500);
    const projects = projectRows.flatMap((project) => project.financialType ? [{ id: project.id, name: project.name, dueDate: project.due, financialType: project.financialType, paidAt: project.paidAt, archived: project.status === "past" }] : []);
    const outputs = outputRows.map((output) => ({ id: output.durableId, projectId: output.projectId, name: output.name, reviewState: output.reviewState, archived: output.archived, relativeDeadlineDays: output.relativeDeadlineDays, currentVersionId: output.currentVersionId, versions: versions.filter(({ outputId }) => outputId === output.durableId).map((version) => ({ id: version.durableId, number: version.number, source: { provider: version.provider, providerId: version.providerId ?? null, url: version.normalizedUrl }, addedAt: version.addedAt, comments: [] })) }));
    return buildWorkspaceCalendarEvents({ projects, outputs }).map(({ id, date, title, href }) => ({ id, date, title, href }));
  },
});
