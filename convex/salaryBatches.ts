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
      amount: batch.amount,
      paid: batch.paid,
      paidDate: batch.paidDate,
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
        amount: v.optional(v.number()),
        paid: v.optional(v.boolean()),
        paidDate: v.optional(v.string()),
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
      args.batches.map((batch) => {
        const amount = batch.amount === undefined || !Number.isFinite(batch.amount)
          ? undefined
          : Math.max(0, batch.amount);
        return ctx.db.insert("salaryBatches", {
          ...batch,
          id: batch.id ?? `batch-${batch.number}`,
          ...(amount === undefined ? {} : { amount }),
          paid: batch.paid ?? false,
          paidDate: batch.paid ? (batch.paidDate ?? "") : "",
          userId,
        });
      })
    );
  },
});
