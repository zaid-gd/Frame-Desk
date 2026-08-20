import { v } from "convex/values";
import { internalQuery, query } from "./_generated/server";
import { relayAccessForCurrentUser } from "./relayAccess";
import { createCalendarFeedUrl } from "./relayCalendarFeedAccess";
import { buildWorkspaceCalendarEvents } from "../src/relay/domain/workspace-calendar";

const feedEventValidator = v.object({ id: v.string(), date: v.string(), title: v.string(), href: v.string() });

export const feedUrl = query({
  args: { appOrigin: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const access = await relayAccessForCurrentUser(ctx);
    return access ? createCalendarFeedUrl(access.ownerUserId, args.appOrigin) : null;
  },
});

export const feedEvents = internalQuery({
  args: { ownerUserId: v.string() },
  returns: v.array(feedEventValidator),
  handler: async (ctx, args) => {
    const projectRows = await ctx.db.query("relayProjects").withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", args.ownerUserId)).collect();
    const outputRows = await ctx.db.query("relayProjectOutputs").withIndex("by_ownerUserId_and_projectId", (q) => q.eq("ownerUserId", args.ownerUserId)).collect();
    const versions = await ctx.db.query("relayMediaVersions").withIndex("by_ownerUserId_and_outputId_and_number", (q) => q.eq("ownerUserId", args.ownerUserId)).collect();
    const projects = projectRows.flatMap((project) => project.financialType ? [{ id: project.id, name: project.name, dueDate: project.due, financialType: project.financialType, paidAt: project.paidAt, archived: project.status === "past" }] : []);
    const outputs = outputRows.map((output) => ({ id: output.durableId, projectId: output.projectId, name: output.name, reviewState: output.reviewState, archived: output.archived, relativeDeadlineDays: output.relativeDeadlineDays, currentVersionId: output.currentVersionId, versions: versions.filter(({ outputId }) => outputId === output.durableId).map((version) => ({ id: version.durableId, number: version.number, source: { provider: version.provider, providerId: version.providerId ?? null, url: version.normalizedUrl }, addedAt: version.addedAt, comments: [] })) }));
    return buildWorkspaceCalendarEvents({ projects, outputs }).map(({ id, date, title, href }) => ({ id, date, title, href }));
  },
});
