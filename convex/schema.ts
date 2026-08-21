import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  clientPortalStageValidator,
  fileCategoryValidator,
  fileProviderValidator,
  fileStatusValidator,
  memberStatusValidator,
  notificationKindValidator,
  portalEventKindValidator,
  projectActivityKindValidator,
  revisionStatusValidator,
  settingsTeamRoleValidator,
  storedDeliverableStatusValidator,
  storedFileStatusValidator,
  storedProjectStatusValidator,
  storedTeamRoleValidator,
  teamActivityKindValidator,
} from "./domainValidators";
import { projectGroupInputValidator, relayClientInputValidator, relayProjectValidator, salaryBatchValidator, salaryPlanInputValidator, workflowTemplateInputValidator } from "./relayWorkspaceValidators";
import { mediaProviderValidator, outputReviewStateValidator } from "./relayWorkspaceValidators";

export default defineSchema({
  relayTeamWorkspaces: defineTable({
    dataOwnerUserId: v.string(),
    currentOwnerUserId: v.string(),
    name: v.string(),
    currencyCode: v.string(),
    timeZone: v.string(),
    defaultWorkflowTemplateId: v.string(),
    editorsCanViewAll: v.boolean(),
    createdAt: v.string(),
  })
    .index("by_dataOwnerUserId", ["dataOwnerUserId"])
    .index("by_currentOwnerUserId", ["currentOwnerUserId"]),

  relayTeamMembers: defineTable({
    workspaceId: v.id("relayTeamWorkspaces"),
    userId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("Owner"), v.literal("Editor"), v.literal("Viewer")),
    status: memberStatusValidator,
    permissions: v.object({ projects: v.boolean(), reviews: v.boolean(), portals: v.boolean(), finance: v.boolean() }),
    createdAt: v.string(),
    joinedAt: v.optional(v.string()),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_userId_and_status", ["userId", "status"])
    .index("by_email_and_status", ["email", "status"])
    .index("by_workspaceId_and_userId", ["workspaceId", "userId"])
    .index("by_workspaceId_and_email", ["workspaceId", "email"]),

  relayTeamActivity: defineTable({
    workspaceId: v.id("relayTeamWorkspaces"),
    actorUserId: v.string(),
    actorName: v.string(),
    kind: v.union(v.literal("member_invited"), v.literal("member_joined"), v.literal("member_role_updated"), v.literal("member_removed"), v.literal("member_left")),
    message: v.string(),
    createdAt: v.string(),
  }).index("by_workspaceId_and_createdAt", ["workspaceId", "createdAt"]),

  relayWorkflowTemplates: defineTable({
    ownerUserId: v.string(),
    durableId: v.string(),
    order: v.number(),
    archived: v.boolean(),
    ...workflowTemplateInputValidator.fields,
  })
    .index("by_ownerUserId", ["ownerUserId"])
    .index("by_ownerUserId_and_durableId", ["ownerUserId", "durableId"]),

  relayClients: defineTable({
    ownerUserId: v.string(),
    durableId: v.string(),
    ...relayClientInputValidator.fields,
    archived: v.boolean(),
  })
    .index("by_ownerUserId", ["ownerUserId"])
    .index("by_ownerUserId_and_durableId", ["ownerUserId", "durableId"]),

  relaySalaryPlans: defineTable({
    ownerUserId: v.string(),
    durableId: v.string(),
    archived: v.boolean(),
    ...salaryPlanInputValidator.fields,
  })
    .index("by_ownerUserId", ["ownerUserId"])
    .index("by_ownerUserId_and_durableId", ["ownerUserId", "durableId"])
    .index("by_ownerUserId_and_clientId", ["ownerUserId", "clientId"]),

  relaySalaryBatches: defineTable({
    ownerUserId: v.string(),
    ...salaryBatchValidator.fields,
  })
    .index("by_ownerUserId", ["ownerUserId"])
    .index("by_ownerUserId_and_id", ["ownerUserId", "id"])
    .index("by_ownerUserId_and_planId", ["ownerUserId", "planId"]),

  relayProjectGroups: defineTable({
    ownerUserId: v.string(),
    durableId: v.string(),
    archived: v.boolean(),
    ...projectGroupInputValidator.fields,
  })
    .index("by_ownerUserId", ["ownerUserId"])
    .index("by_ownerUserId_and_durableId", ["ownerUserId", "durableId"]),

  relayProjects: defineTable({
    ownerUserId: v.string(),
    ...relayProjectValidator.fields,
    importedAt: v.string(),
  })
    .index("by_ownerUserId", ["ownerUserId"])
    .index("by_ownerUserId_and_id", ["ownerUserId", "id"])
    .index("by_ownerUserId_and_workflowTemplateId_and_workflowStageId", ["ownerUserId", "workflowTemplateId", "workflowStageId"])
    .index("by_ownerUserId_and_salaryPlanId", ["ownerUserId", "salaryPlanId"]),

  relayProjectOutputs: defineTable({
    ownerUserId: v.string(),
    durableId: v.string(),
    projectId: v.string(),
    name: v.string(),
    reviewState: outputReviewStateValidator,
    archived: v.boolean(),
    roleId: v.optional(v.string()),
    relativeDeadlineDays: v.optional(v.number()),
    currentVersionId: v.optional(v.string()),
  })
    .index("by_ownerUserId_and_durableId", ["ownerUserId", "durableId"])
    .index("by_ownerUserId_and_projectId", ["ownerUserId", "projectId"]),

  relayMediaVersions: defineTable({
    ownerUserId: v.string(),
    durableId: v.string(),
    projectId: v.string(),
    outputId: v.string(),
    number: v.number(),
    provider: mediaProviderValidator,
    providerId: v.optional(v.string()),
    normalizedUrl: v.string(),
    addedAt: v.string(),
    size: v.optional(v.number()),
  })
    .index("by_ownerUserId_and_outputId_and_number", ["ownerUserId", "outputId", "number"])
    .index("by_ownerUserId_and_projectId", ["ownerUserId", "projectId"]),

  relayProjectFiles: defineTable({
    ownerUserId: v.string(),
    durableId: v.string(),
    projectId: v.string(),
    storageId: v.id("_storage"),
    title: v.string(),
    fileName: v.string(),
    mimeType: v.string(),
    size: v.number(),
    archived: v.boolean(),
    portalVisible: v.boolean(),
    allowDownload: v.boolean(),
    createdAt: v.string(),
  })
    .index("by_ownerUserId_and_durableId", ["ownerUserId", "durableId"])
    .index("by_ownerUserId_and_projectId", ["ownerUserId", "projectId"])
    .index("by_storageId", ["storageId"]),

  relayStoragePolicy: defineTable({
    key: v.literal("service"),
    acceptsUploads: v.boolean(),
    remainingBytes: v.optional(v.number()),
    reserveBytes: v.optional(v.number()),
    heldBytes: v.optional(v.number()),
  }).index("by_key", ["key"]),

  relayUploadReservations: defineTable({
    ownerUserId: v.string(),
    projectId: v.string(),
    size: v.number(),
    declaredSize: v.number(),
    storageId: v.optional(v.id("_storage")),
    status: v.union(v.literal("pending"), v.literal("expired")),
    createdAt: v.string(),
    expiresAt: v.number(),
  }).index("by_ownerUserId_and_projectId", ["ownerUserId", "projectId"]),

  relayMediaComments: defineTable({
    ownerUserId: v.string(),
    durableId: v.string(),
    projectId: v.string(),
    versionId: v.string(),
    body: v.string(),
    resolved: v.boolean(),
    authorName: v.optional(v.string()),
    createdAt: v.optional(v.string()),
  })
    .index("by_ownerUserId_and_durableId", ["ownerUserId", "durableId"])
    .index("by_ownerUserId_and_versionId", ["ownerUserId", "versionId"])
    .index("by_ownerUserId_and_projectId", ["ownerUserId", "projectId"]),

  relayClientPortals: defineTable({
    ownerUserId: v.string(),
    projectId: v.string(),
    token: v.string(),
    status: v.union(v.literal("open"), v.literal("closed")),
    publicNotes: v.string(),
    showDueDate: v.boolean(),
    showCompletedDate: v.boolean(),
    outputIds: v.array(v.string()),
    expiresAt: v.union(v.string(), v.null()),
    pinHash: v.optional(v.string()),
    pinSalt: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_ownerUserId_and_projectId", ["ownerUserId", "projectId"])
    .index("by_token", ["token"]),

  relayWorkspaceImports: defineTable({
    ownerUserId: v.string(),
    importedAt: v.string(),
    recordCount: v.number(),
  }).index("by_ownerUserId", ["ownerUserId"]),

  workItems: defineTable({
    userId: v.string(),
    id: v.string(),
    teamId: v.optional(v.string()),
    ownerUserId: v.optional(v.string()),
    assigneeUserIds: v.optional(v.array(v.string())),
    profileId: v.string(),
    title: v.string(),
    client: v.optional(v.string()),
    status: storedProjectStatusValidator,
    workType: v.string(),
    startDate: v.string(),
    dueDate: v.string(),
    earnings: v.number(),
    paid: v.optional(v.boolean()),
    paidDate: v.optional(v.string()),
    notes: v.string(),
    templateId: v.optional(v.string()),
    templateProjectType: v.optional(v.string()),
    workflowStages: v.optional(v.array(v.string())),
    templateDeliverables: v.optional(v.array(v.object({
      title: v.string(),
      category: fileCategoryValidator,
      initialStatus: fileStatusValidator,
    }))),
    checklistItems: v.optional(v.array(v.string())),
    checklistCompleted: v.optional(v.record(v.string(), v.boolean())),
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
    .index("by_userId_and_teamId", ["userId", "teamId"])
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
    status: clientPortalStageValidator,
    sourceStatus: storedProjectStatusValidator,
    startDate: v.string(),
    dueDate: v.string(),
    progress: v.number(),
    clientSummary: v.string(),
    clientNotes: v.string(),
    estimatedCompletion: v.string(),
    revisionLimit: v.number(),
    published: v.boolean(),
    // Optional during the compatibility window. Legacy portals derive access from published.
    enabled: v.optional(v.boolean()),
    expiresAt: v.optional(v.string()),
    passwordHash: v.optional(v.string()),
    passwordSalt: v.optional(v.string()),
    passwordIterations: v.optional(v.number()),
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
    status: storedDeliverableStatusValidator,
    downloadable: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_portalId_and_createdAt", ["portalId", "createdAt"]),

  portalRevisions: defineTable({
    portalId: v.id("clientPortals"),
    clientName: v.string(),
    message: v.string(),
    timecode: v.optional(v.string()),
    status: revisionStatusValidator,
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_portalId_and_createdAt", ["portalId", "createdAt"]),

  portalEvents: defineTable({
    portalId: v.id("clientPortals"),
    kind: portalEventKindValidator,
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
    kind: projectActivityKindValidator,
    message: v.string(),
    detail: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_projectId_and_createdAt", ["projectId", "createdAt"]),

  projectFiles: defineTable({
    projectId: v.string(),
    ownerUserId: v.string(),
    teamId: v.optional(v.string()),
    category: fileCategoryValidator,
    title: v.string(),
    description: v.string(),
    status: storedFileStatusValidator,
    clientVisible: v.boolean(),
    downloadable: v.boolean(),
    createdByUserId: v.string(),
    createdByName: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_projectId_and_createdAt", ["projectId", "createdAt"])
    .index("by_projectId_and_category_and_clientVisible_and_createdAt", [
      "projectId",
      "category",
      "clientVisible",
      "createdAt",
    ]),

  projectFileVersions: defineTable({
    projectId: v.string(),
    projectFileId: v.id("projectFiles"),
    versionNumber: v.number(),
    status: v.optional(fileStatusValidator),
    provider: fileProviderValidator,
    storageId: v.optional(v.id("_storage")),
    r2Key: v.optional(v.string()),
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
    .index("by_projectId_and_uploadedAt", ["projectId", "uploadedAt"])
    .index("by_storageId", ["storageId"])
    .index("by_r2Key", ["r2Key"]),

  r2UploadSessions: defineTable({
    projectId: v.string(),
    projectFileId: v.optional(v.id("projectFiles")),
    key: v.string(),
    uploaderUserId: v.string(),
    status: v.union(v.literal("pending"), v.literal("completed")),
    createdAt: v.string(),
    expiresAt: v.number(),
  }).index("by_key", ["key"]),

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
    role: storedTeamRoleValidator,
    status: memberStatusValidator,
    permissions: v.record(v.string(), v.boolean()),
    createdAt: v.string(),
    joinedAt: v.optional(v.string()),
  })
    .index("by_teamId", ["teamId"])
    .index("by_userId_and_status", ["userId", "status"])
    .index("by_teamId_and_userId", ["teamId", "userId"])
    .index("by_teamId_and_email", ["teamId", "email"]),

  teamActivity: defineTable({
    teamId: v.string(),
    actorUserId: v.string(),
    actorName: v.string(),
    kind: teamActivityKindValidator,
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
    timecode: v.optional(v.string()),
    mentions: v.array(v.string()),
    createdAt: v.string(),
  })
    .index("by_teamId_and_projectId", ["teamId", "projectId"])
    .index("by_teamId_and_createdAt", ["teamId", "createdAt"]),

  teamNotifications: defineTable({
    teamId: v.string(),
    userId: v.string(),
    kind: notificationKindValidator,
    projectId: v.optional(v.string()),
    message: v.string(),
    read: v.boolean(),
    createdAt: v.string(),
  })
    .index("by_teamId_and_userId_and_createdAt", ["teamId", "userId", "createdAt"])
    .index("by_teamId_and_userId_and_read_and_createdAt", ["teamId", "userId", "read", "createdAt"]),

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
      status: storedProjectStatusValidator,
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
    customProjectTemplates: v.optional(v.array(v.object({
      id: v.string(),
      name: v.string(),
      description: v.string(),
      projectType: v.string(),
      workType: v.union(v.literal("channel"), v.literal("freelance")),
      durationDays: v.number(),
      workflowStages: v.array(v.string()),
      deliverables: v.array(v.object({
        title: v.string(),
        category: fileCategoryValidator,
        initialStatus: fileStatusValidator,
      })),
      checklistItems: v.array(v.string()),
      custom: v.optional(v.boolean()),
      updatedAt: v.optional(v.string()),
    }))),
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
    teamRole: settingsTeamRoleValidator,
    teamMembers: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        role: storedTeamRoleValidator,
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
    amount: v.optional(v.number()),
    paid: v.optional(v.boolean()),
    paidDate: v.optional(v.string()),
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
