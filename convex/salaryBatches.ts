import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const batches = await ctx.db
      .query("salaryBatches")
      .withIndex("by_userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .take(500);
    return batches.map((batch) => ({
      id: batch.id,
      number: batch.number,
      completedDate: batch.completedDate,
      archived: batch.archived,
      archivedDate: batch.archivedDate,
    }));
  },
});

export const replaceAll = mutation({
  args: {
    batches: v.array(
      v.object({
        id: v.optional(v.string()),
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
    const userId = identity.tokenIdentifier;
    const existing = await ctx.db
      .query("salaryBatches")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(500);
    await Promise.all(existing.map((batch) => ctx.db.delete(batch._id)));
    await Promise.all(
      args.batches.map((batch) =>
        ctx.db.insert("salaryBatches", {
          ...batch,
          id: batch.id ?? `batch-${batch.number}`,
          userId,
        })
      )
    );
  },
});
