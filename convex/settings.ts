import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
      .withIndex("by_userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .take(1);
    return settings[0] ?? null;
  },
});

export const upsert = mutation({
  args: {
    studioName: v.string(),
    profileName: v.string(),
    profileUsername: v.string(),
    profileTitle: v.string(),
    profileBio: v.string(),
    profileLocation: v.string(),
    profileImageUrl: v.string(),
    timeZone: v.string(),
    dateFormat: v.string(),
    weekStart: v.string(),
    currencyCode: v.string(),
    projectStages: v.array(v.string()),
    notifications: v.record(v.string(), v.boolean()),
    integrations: v.record(v.string(), v.boolean()),
    integrationAccounts: v.record(v.string(), v.string()),
    teamRole: v.string(),
    teamMembers: v.array(teamMemberSchema),
    editorPermissions: v.record(v.string(), v.boolean()),
    rolePermissions: v.record(v.string(), v.record(v.string(), v.boolean())),
    integrationConfigs: v.record(
      v.string(),
      v.object({
        connected: v.boolean(),
        account: v.string(),
        folder: v.string(),
        channel: v.string(),
        workspace: v.string(),
        webhookUrl: v.string(),
        connectedAt: v.string(),
        lastSyncAt: v.string(),
      })
    ),
    theme: v.string(),
    accentColor: v.string(),
    density: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.tokenIdentifier;
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(10);
    const [primary, ...duplicates] = existing;
    if (primary) {
      await ctx.db.patch(primary._id, args);
      await Promise.all(duplicates.map((row) => ctx.db.delete(row._id)));
    } else {
      await ctx.db.insert("settings", { ...args, userId });
    }
  },
});
