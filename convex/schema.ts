import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  workItems: defineTable({
    userId: v.string(),
    id: v.string(),
    teamId: v.optional(v.string()),
    ownerUserId: v.optional(v.string()),
    assigneeUserIds: v.optional(v.array(v.string())),
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
  })
    .index("by_userId", ["userId"])
    .index("by_workItemId", ["id"])
    .index("by_teamId", ["teamId"])
    .index("by_teamId_and_id", ["teamId", "id"]),

  clientPortals: defineTable({
    ownerUserId: v.string(),
    projectId: v.string(),
    token: v.string(),
    title: v.string(),
    clientName: v.string(),
    projectType: v.string(),
    status: v.string(),
    sourceStatus: v.string(),
    startDate: v.string(),
    dueDate: v.string(),
    progress: v.number(),
    clientSummary: v.string(),
    clientNotes: v.string(),
    estimatedCompletion: v.string(),
    revisionLimit: v.number(),
    published: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_projectId", ["projectId"])
    .index("by_token", ["token"]),

  portalDeliverables: defineTable({
    portalId: v.id("clientPortals"),
    title: v.string(),
    detail: v.string(),
    url: v.string(),
    status: v.string(),
    downloadable: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_portalId_and_createdAt", ["portalId", "createdAt"]),

  portalRevisions: defineTable({
    portalId: v.id("clientPortals"),
    clientName: v.string(),
    message: v.string(),
    status: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_portalId_and_createdAt", ["portalId", "createdAt"]),

  portalEvents: defineTable({
    portalId: v.id("clientPortals"),
    kind: v.string(),
    title: v.string(),
    body: v.string(),
    createdAt: v.string(),
  }).index("by_portalId_and_createdAt", ["portalId", "createdAt"]),

  projectActivity: defineTable({
    projectId: v.string(),
    ownerUserId: v.string(),
    teamId: v.optional(v.string()),
    actorUserId: v.string(),
    actorName: v.string(),
    kind: v.string(),
    message: v.string(),
    detail: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_projectId_and_createdAt", ["projectId", "createdAt"]),

  projectFiles: defineTable({
    projectId: v.string(),
    ownerUserId: v.string(),
    teamId: v.optional(v.string()),
    category: v.string(),
    title: v.string(),
    description: v.string(),
    status: v.string(),
    clientVisible: v.boolean(),
    downloadable: v.boolean(),
    createdByUserId: v.string(),
    createdByName: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_projectId_and_createdAt", ["projectId", "createdAt"]),

  projectFileVersions: defineTable({
    projectId: v.string(),
    projectFileId: v.id("projectFiles"),
    versionNumber: v.number(),
    provider: v.string(),
    storageId: v.optional(v.id("_storage")),
    externalUrl: v.optional(v.string()),
    externalId: v.optional(v.string()),
    fileName: v.string(),
    mimeType: v.string(),
    size: v.number(),
    uploadedByUserId: v.string(),
    uploadedByName: v.string(),
    uploadedAt: v.string(),
    notes: v.string(),
  })
    .index("by_projectFileId_and_versionNumber", ["projectFileId", "versionNumber"])
    .index("by_projectId_and_uploadedAt", ["projectId", "uploadedAt"]),

  teamWorkspaces: defineTable({
    ownerUserId: v.string(),
    name: v.string(),
    inviteCode: v.string(),
    createdAt: v.string(),
  })
    .index("by_ownerUserId", ["ownerUserId"])
    .index("by_inviteCode", ["inviteCode"]),

  teamMembers: defineTable({
    teamId: v.string(),
    userId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.string(),
    status: v.string(),
    permissions: v.record(v.string(), v.boolean()),
    createdAt: v.string(),
    joinedAt: v.optional(v.string()),
  })
    .index("by_teamId", ["teamId"])
    .index("by_userId", ["userId"])
    .index("by_teamId_and_userId", ["teamId", "userId"])
    .index("by_teamId_and_email", ["teamId", "email"]),

  teamActivity: defineTable({
    teamId: v.string(),
    actorUserId: v.string(),
    actorName: v.string(),
    kind: v.string(),
    projectId: v.optional(v.string()),
    message: v.string(),
    createdAt: v.string(),
  }).index("by_teamId_and_createdAt", ["teamId", "createdAt"]),

  teamChatMessages: defineTable({
    teamId: v.string(),
    authorUserId: v.string(),
    authorName: v.string(),
    body: v.string(),
    mentions: v.array(v.string()),
    createdAt: v.string(),
  }).index("by_teamId_and_createdAt", ["teamId", "createdAt"]),

  projectComments: defineTable({
    teamId: v.string(),
    projectId: v.string(),
    authorUserId: v.string(),
    authorName: v.string(),
    body: v.string(),
    mentions: v.array(v.string()),
    createdAt: v.string(),
  })
    .index("by_teamId_and_projectId", ["teamId", "projectId"])
    .index("by_teamId_and_createdAt", ["teamId", "createdAt"]),

  teamNotifications: defineTable({
    teamId: v.string(),
    userId: v.string(),
    kind: v.string(),
    projectId: v.optional(v.string()),
    message: v.string(),
    read: v.boolean(),
    createdAt: v.string(),
  })
    .index("by_userId_and_read", ["userId", "read"])
    .index("by_teamId_and_userId", ["teamId", "userId"])
    .index("by_teamId_and_userId_and_createdAt", ["teamId", "userId", "createdAt"]),

  publicProfiles: defineTable({
    ownerUserId: v.string(),
    slug: v.string(),
    studioName: v.string(),
    profileName: v.string(),
    profileUsername: v.string(),
    profileTitle: v.string(),
    profileBio: v.string(),
    profileLocation: v.string(),
    profileImageUrl: v.string(),
    publicActiveProjects: v.optional(v.number()),
    publicDeliveredEdits: v.optional(v.number()),
    publicTurnaroundDays: v.optional(v.number()),
    timeZone: v.string(),
    activeProjects: v.number(),
    deliveredEdits: v.number(),
    avgTurnaroundDays: v.number(),
    projects: v.array(v.object({
      title: v.string(),
      status: v.string(),
      workType: v.string(),
      dueDate: v.string(),
    })),
    updatedAt: v.string(),
  })
    .index("by_ownerUserId", ["ownerUserId"])
    .index("by_slug", ["slug"]),

  settings: defineTable({
    userId: v.string(),
    studioName: v.string(),
    profileName: v.string(),
    profileUsername: v.string(),
    profileTitle: v.string(),
    profileBio: v.string(),
    profileLocation: v.string(),
    profileImageUrl: v.string(),
    publicActiveProjects: v.optional(v.number()),
    publicDeliveredEdits: v.optional(v.number()),
    publicTurnaroundDays: v.optional(v.number()),
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

  resourceLinks: defineTable({
    userId: v.string(),
    id: v.string(),
    title: v.string(),
    url: v.string(),
    category: v.string(),
    projectId: v.string(),
    notes: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_userId", ["userId"]),
});
