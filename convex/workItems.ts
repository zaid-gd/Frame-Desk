import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const items = await ctx.db
      .query("workItems")
      .withIndex("by_userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .take(500);
    return items.map((item) => ({
      id: item.id,
      profileId: item.profileId,
      title: item.title,
      client: item.client,
      status: item.status,
      workType: item.workType,
      startDate: item.startDate,
      dueDate: item.dueDate,
      earnings: item.earnings,
      notes: item.notes,
      createdAt: item.createdAt,
    }));
  },
});

export const replaceAll = mutation({
  args: {
    items: v.array(
      v.object({
        id: v.string(),
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
    const userId = identity.tokenIdentifier;
    const existing = await ctx.db
      .query("workItems")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(500);
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
