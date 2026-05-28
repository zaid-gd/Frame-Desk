import { v } from "convex/values";
import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("salaryBatches")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});

export const replaceAll = mutation({
  args: {
    batches: v.array(
      v.object({
        number: v.number(),
        completedDate: v.string(),
        archived: v.boolean(),
        archivedDate: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;
    const existing = await ctx.db
      .query("salaryBatches")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    await Promise.all(existing.map((batch) => ctx.db.delete(batch._id)));
    await Promise.all(
      args.batches.map((batch) =>
        ctx.db.insert("salaryBatches", {
          ...batch,
          id: "",
          userId,
        })
      )
    );
  },
});
