import { ConvexError, v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { outputReviewStateValidator, projectOutputCountValidator, relayProjectOutputValidator } from "./relayWorkspaceValidators";
import { normalizeMediaSource } from "../src/relay/domain/project-output";
import { relayAccessForCurrentUser } from "./relayAccess";

const MAX_OUTPUTS = 100;
const MAX_VERSIONS_PER_PROJECT = 500;

async function ownerId(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError({ kind: "unauthorized", message: "Sign in to manage Project Outputs." });
  return identity.tokenIdentifier;
}

async function ownedOutput(ctx: QueryCtx | MutationCtx, ownerUserId: string, id: string) {
  return ctx.db.query("relayProjectOutputs").withIndex("by_ownerUserId_and_durableId", (q) => q.eq("ownerUserId", ownerUserId).eq("durableId", id)).unique();
}

function validName(name: string) {
  return name.trim().length > 0 && name.length <= 200;
}

function outputError(kind: "invalid" | "not-found" | "unavailable", message: string): never {
  throw new ConvexError({ kind, message });
}

export const listOutputs = query({
  args: { projectId: v.string() },
  returns: v.array(relayProjectOutputValidator),
  handler: async (ctx, args) => {
    const access = await relayAccessForCurrentUser(ctx);
    if (!access) return [];
    const ownerUserId = access.ownerUserId;
    const project = await ctx.db.query("relayProjects").withIndex("by_ownerUserId_and_id", (q) => q.eq("ownerUserId", ownerUserId).eq("id", args.projectId)).unique();
    if (!project) return [];
    const outputs = await ctx.db.query("relayProjectOutputs").withIndex("by_ownerUserId_and_projectId", (q) => q.eq("ownerUserId", ownerUserId).eq("projectId", args.projectId)).take(MAX_OUTPUTS);
    const versions = await ctx.db.query("relayMediaVersions").withIndex("by_ownerUserId_and_projectId", (q) => q.eq("ownerUserId", ownerUserId).eq("projectId", args.projectId)).take(MAX_VERSIONS_PER_PROJECT);
    const comments = await ctx.db.query("relayMediaComments").withIndex("by_ownerUserId_and_projectId", (q) => q.eq("ownerUserId", ownerUserId).eq("projectId", args.projectId)).take(1000);
    return outputs.map((output) => {
      const outputVersions = versions.filter(({ outputId }) => outputId === output.durableId).sort((left, right) => left.number - right.number);
      const unresolvedPreviousComments = comments.filter(({ versionId, resolved }) => versionId !== output.currentVersionId && !resolved && outputVersions.some(({ durableId }) => durableId === versionId)).length;
      return {
        id: output.durableId,
        projectId: output.projectId,
        name: output.name,
        reviewState: output.reviewState,
        archived: output.archived,
        roleId: output.roleId,
        relativeDeadlineDays: output.relativeDeadlineDays,
        currentVersionId: output.currentVersionId,
        unresolvedPreviousComments,
        versions: outputVersions.map((version) => ({
          id: version.durableId,
          number: version.number,
          source: { provider: version.provider, providerId: version.providerId ?? null, url: version.normalizedUrl },
          addedAt: version.addedAt,
          comments: comments.filter(({ versionId }) => versionId === version.durableId).map((comment) => ({ id: comment.durableId, authorName: comment.authorName ?? "Client", body: comment.body, resolved: comment.resolved, createdAt: comment.createdAt ?? new Date(comment._creationTime).toISOString() })),
        })),
      };
    });
  },
});

export const listOutputCounts = query({
  args: {},
  returns: v.array(projectOutputCountValidator),
  handler: async (ctx) => {
    const access = await relayAccessForCurrentUser(ctx);
    if (!access) return [];
    const ownerUserId = access.ownerUserId;
    const counts = new Map<string, number>();
    for await (const output of ctx.db.query("relayProjectOutputs").withIndex("by_ownerUserId_and_projectId", (q) => q.eq("ownerUserId", ownerUserId))) {
      counts.set(output.projectId, (counts.get(output.projectId) ?? 0) + 1);
    }
    return [...counts.entries()].map(([projectId, count]) => ({ projectId, count }));
  },
});

export const addOutput = mutation({
  args: { projectId: v.string(), name: v.string() },
  returns: v.object({ id: v.string() }),
  handler: async (ctx, args) => {
    const ownerUserId = await ownerId(ctx);
    if (!validName(args.name)) outputError("invalid", "Enter a Project Output name.");
    const project = await ctx.db.query("relayProjects").withIndex("by_ownerUserId_and_id", (q) => q.eq("ownerUserId", ownerUserId).eq("id", args.projectId)).unique();
    if (!project) outputError("not-found", "Project not found.");
    const outputs = await ctx.db.query("relayProjectOutputs").withIndex("by_ownerUserId_and_projectId", (q) => q.eq("ownerUserId", ownerUserId).eq("projectId", args.projectId)).take(MAX_OUTPUTS);
    if (outputs.length >= MAX_OUTPUTS) outputError("unavailable", "This Project has reached its Project Output safety limit.");
    const id = `output_${crypto.randomUUID()}`;
    await ctx.db.insert("relayProjectOutputs", { ownerUserId, durableId: id, projectId: args.projectId, name: args.name.trim(), reviewState: "draft", archived: false });
    return { id };
  },
});

export const editOutput = mutation({
  args: { id: v.string(), name: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerUserId = await ownerId(ctx);
    if (!validName(args.name)) outputError("invalid", "Enter a Project Output name.");
    const output = await ownedOutput(ctx, ownerUserId, args.id);
    if (!output) outputError("not-found", "Project Output not found.");
    await ctx.db.patch("relayProjectOutputs", output._id, { name: args.name.trim() });
    return null;
  },
});

export const setOutputArchived = mutation({
  args: { id: v.string(), archived: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerUserId = await ownerId(ctx);
    const output = await ownedOutput(ctx, ownerUserId, args.id);
    if (!output) outputError("not-found", "Project Output not found.");
    await ctx.db.patch("relayProjectOutputs", output._id, { archived: args.archived });
    return null;
  },
});

export const setOutputReviewState = mutation({
  args: { id: v.string(), reviewState: outputReviewStateValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerUserId = await ownerId(ctx);
    const output = await ownedOutput(ctx, ownerUserId, args.id);
    if (!output) outputError("not-found", "Project Output not found.");
    await ctx.db.patch("relayProjectOutputs", output._id, { reviewState: args.reviewState });
    return null;
  },
});

export const addMediaVersion = mutation({
  args: { outputId: v.string(), url: v.string() },
  returns: v.object({ id: v.string() }),
  handler: async (ctx, args) => {
    const ownerUserId = await ownerId(ctx);
    const output = await ownedOutput(ctx, ownerUserId, args.outputId);
    if (!output) outputError("not-found", "Project Output not found.");
    const source = normalizeMediaSource(args.url);
    if (!source) outputError("invalid", "Enter a valid HTTP, HTTPS, YouTube, or Vimeo URL.");
    const projectVersions = await ctx.db.query("relayMediaVersions").withIndex("by_ownerUserId_and_projectId", (q) => q.eq("ownerUserId", ownerUserId).eq("projectId", output.projectId)).take(MAX_VERSIONS_PER_PROJECT);
    if (projectVersions.length >= MAX_VERSIONS_PER_PROJECT) outputError("unavailable", "This Project has reached its Media Version safety limit.");
    const latest = await ctx.db.query("relayMediaVersions").withIndex("by_ownerUserId_and_outputId_and_number", (q) => q.eq("ownerUserId", ownerUserId).eq("outputId", output.durableId)).order("desc").first();
    const id = `version_${crypto.randomUUID()}`;
    await ctx.db.insert("relayMediaVersions", {
      ownerUserId, durableId: id, projectId: output.projectId, outputId: output.durableId, number: (latest?.number ?? 0) + 1,
      provider: source.provider, ...(source.providerId ? { providerId: source.providerId } : {}), normalizedUrl: source.url, addedAt: new Date().toISOString(), size: 0,
    });
    await ctx.db.patch("relayProjectOutputs", output._id, { currentVersionId: id, reviewState: "in_review" });
    return { id };
  },
});

export const resolveComment = mutation({
  args: { id: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerUserId = await ownerId(ctx);
    const comment = await ctx.db.query("relayMediaComments").withIndex("by_ownerUserId_and_durableId", (q) => q.eq("ownerUserId", ownerUserId).eq("durableId", args.id)).unique();
    if (!comment) outputError("not-found", "Comment not found.");
    await ctx.db.patch("relayMediaComments", comment._id, { resolved: true });
    return null;
  },
});
