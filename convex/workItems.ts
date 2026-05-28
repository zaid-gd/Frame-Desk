import { v } from "convex/values";
import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("workItems")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});

export const replaceAll = mutation({
  args: {
    items: v.array(
      v.object({
        profileId: v.string(),
        title: v.string(),
        client: v.optional(v.string()),
        status: v.string(),
        workType: v.string(),
        startDate: v.string(),
        dueDate: v.string(),
        earnings: v.number(),
        notes: v.string(),
        createdAt: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;
    const existing = await ctx.db
      .query("workItems")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    await Promise.all(existing.map((item) => ctx.db.delete(item._id)));
    await Promise.all(
      args.items.map((item) =>
        ctx.db.insert("workItems", {
          ...item,
          client: item.client ?? "",
          createdAt: item.createdAt ?? new Date().toISOString(),
          userId,
        })
      )
    );
  },
});
