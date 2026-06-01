import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  workItems: defineTable({
    userId: v.string(),
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
    integrationLinks: v.optional(v.record(
      v.string(),
      v.object({
        url: v.string(),
        label: v.string(),
        notes: v.string(),
        updatedAt: v.string(),
      })
    )),
    createdAt: v.optional(v.string()),
  }).index("by_userId", ["userId"]),

  settings: defineTable({
    userId: v.string(),
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
    customClients: v.optional(v.array(v.string())),
    projectTags: v.optional(v.array(v.string())),
    salaryWorkType: v.optional(v.string()),
    salaryBatchSize: v.optional(v.number()),
    salaryBatchAmount: v.optional(v.number()),
    projectStages: v.array(v.string()),
    notifications: v.record(v.string(), v.boolean()),
    integrations: v.record(v.string(), v.boolean()),
    integrationAccounts: v.record(v.string(), v.string()),
    integrationLinks: v.optional(v.record(
      v.string(),
      v.object({
        url: v.string(),
        label: v.string(),
        notes: v.string(),
        updatedAt: v.string(),
      })
    )),
    teamRole: v.string(),
    teamMembers: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        role: v.string(),
        email: v.string(),
      })
    ),
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
  }).index("by_userId", ["userId"]),

  salaryBatches: defineTable({
    userId: v.string(),
    id: v.string(),
    number: v.number(),
    completedDate: v.string(),
    archived: v.boolean(),
    archivedDate: v.string(),
  }).index("by_userId", ["userId"]),
});
