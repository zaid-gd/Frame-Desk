import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const resourceLinkSchema = v.object({
  id: v.string(),
  title: v.string(),
  url: v.string(),
  category: v.string(),
  projectId: v.string(),
  notes: v.string(),
  createdAt: v.string(),
  updatedAt: v.string(),
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("resourceLinks")
      .withIndex("by_userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .order("desc")
      .take(500);
  },
});

export const replaceAll = mutation({
  args: {
    resources: v.array(resourceLinkSchema),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.tokenIdentifier;
    const existing = await ctx.db
      .query("resourceLinks")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(500);

    await Promise.all(existing.map((resource) => ctx.db.delete(resource._id)));
    await Promise.all(args.resources.map((resource) => ctx.db.insert("resourceLinks", { ...resource, userId })));
  },
});
