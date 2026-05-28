import { v } from "convex/values";
import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";

const teamMemberSchema = v.object({
  id: v.string(),
  name: v.string(),
  role: v.string(),
  email: v.string(),
});

export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const settings = await ctx.db
      .query("settings")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();
    return settings ?? null;
  },
});

export const upsert = mutation({
  args: {
    studioName: v.string(),
    profileName: v.string(),
    profileTitle: v.string(),
    profileBio: v.string(),
    profileLocation: v.string(),
    timeZone: v.string(),
    dateFormat: v.string(),
    weekStart: v.string(),
    projectStages: v.array(v.string()),
    notifications: v.record(v.string(), v.boolean()),
    integrations: v.record(v.string(), v.boolean()),
    integrationAccounts: v.record(v.string(), v.string()),
    teamRole: v.string(),
    teamMembers: v.array(teamMemberSchema),
    editorPermissions: v.record(v.string(), v.boolean()),
    theme: v.string(),
    accentColor: v.string(),
    density: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("settings", { ...args, userId });
    }
  },
});
