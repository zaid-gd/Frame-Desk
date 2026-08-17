import { v } from "convex/values";

export const workflowStagePurposeValidator = v.union(
  v.literal("planned"), v.literal("editing"), v.literal("clientReview"), v.literal("revisions"), v.literal("approved"), v.literal("delivered"),
);
export const workflowStageValidator = v.object({ id: v.string(), label: v.string(), purpose: workflowStagePurposeValidator });
export const workflowTemplateRoleValidator = v.object({ id: v.string(), label: v.string() });
export const starterProjectOutputValidator = v.object({ id: v.string(), name: v.string(), relativeDeadlineDays: v.number(), roleId: v.union(v.string(), v.null()) });
export const clientPortalDefaultsValidator = v.object({ enabled: v.boolean(), showDates: v.boolean(), showNotes: v.boolean(), allowComments: v.boolean() });
export const workflowTemplateInputValidator = v.object({
  name: v.string(),
  stages: v.array(workflowStageValidator),
  cancelledLabel: v.string(),
  starterOutputs: v.array(starterProjectOutputValidator),
  roles: v.array(workflowTemplateRoleValidator),
  portalDefaults: clientPortalDefaultsValidator,
});
export const workflowTemplateValidator = workflowTemplateInputValidator.extend({ id: v.string(), archived: v.boolean() });
export const projectSetupValidator = workflowTemplateInputValidator.extend({ templateId: v.string(), templateName: v.string() }).omit("name");

export const relayProjectValidator = v.object({
  id: v.string(),
  name: v.string(),
  clientId: v.string(),
  stage: v.string(),
  tone: v.union(v.literal("review"), v.literal("delivered"), v.literal("overdue"), v.literal("planned")),
  due: v.string(),
  progress: v.string(),
  status: v.optional(v.union(v.literal("active"), v.literal("past"))),
  outstandingAmount: v.optional(v.number()),
  projectGroupId: v.optional(v.string()),
  projectGroupName: v.optional(v.string()),
  portalUrl: v.optional(v.string()),
  workflowTemplateId: v.optional(v.string()),
  workflowStageId: v.optional(v.string()),
  workflowSetup: v.optional(projectSetupValidator),
  financialType: v.optional(v.union(v.literal("projectValue"), v.literal("salaryPlan"), v.literal("nonBillable"))),
  lead: v.optional(v.string()),
  assignees: v.optional(v.array(v.string())),
  completedAt: v.optional(v.string()),
});

export const projectStageEffectValidator = v.union(
  v.object({ kind: v.literal("projectValue"), amount: v.number() }),
  v.object({ kind: v.literal("salaryPlan"), change: v.union(v.literal("added"), v.literal("removed")) }),
  v.object({ kind: v.literal("none") }),
);

export const outputReviewStateValidator = v.union(
  v.literal("draft"), v.literal("in_review"), v.literal("changes_requested"), v.literal("approved"), v.literal("final_delivered"),
);
export const mediaProviderValidator = v.union(v.literal("youtube"), v.literal("vimeo"), v.literal("link"));
export const relayMediaCommentValidator = v.object({ id: v.string(), authorName: v.string(), body: v.string(), resolved: v.boolean(), createdAt: v.string() });
export const relayMediaSourceValidator = v.object({ provider: mediaProviderValidator, providerId: v.union(v.string(), v.null()), url: v.string() });
export const relayMediaVersionValidator = v.object({ id: v.string(), number: v.number(), source: relayMediaSourceValidator, addedAt: v.string(), comments: v.array(relayMediaCommentValidator) });
export const relayProjectOutputValidator = v.object({
  id: v.string(), projectId: v.string(), name: v.string(), reviewState: outputReviewStateValidator, archived: v.boolean(),
  roleId: v.optional(v.string()), relativeDeadlineDays: v.optional(v.number()), versions: v.array(relayMediaVersionValidator),
  currentVersionId: v.optional(v.string()), unresolvedPreviousComments: v.number(),
});

export const newProjectInputValidator = v.object({
  name: v.string(),
  clientId: v.string(),
  projectGroupId: v.string(),
  templateId: v.string(),
  dueDate: v.string(),
  financialType: v.union(v.literal("projectValue"), v.literal("salaryPlan"), v.literal("nonBillable")),
});

export const projectDetailValidator = relayProjectValidator.extend({
  dueDate: v.string(),
  lead: v.string(),
  assignees: v.array(v.string()),
  financialType: v.union(v.literal("projectValue"), v.literal("salaryPlan"), v.literal("nonBillable")),
});

export const relayClientInputValidator = v.object({
  name: v.string(),
  company: v.string(),
  contactName: v.string(),
  email: v.string(),
  phone: v.string(),
  notes: v.string(),
});

export const relayClientValidator = relayClientInputValidator.extend({
  id: v.string(),
  archived: v.boolean(),
});

export const projectGroupInputValidator = v.object({
  name: v.string(),
  clientId: v.string(),
  startDate: v.string(),
  endDate: v.string(),
  notes: v.string(),
});

export const projectGroupValidator = projectGroupInputValidator.extend({
  id: v.string(),
  archived: v.boolean(),
  projectCount: v.number(),
  progress: v.number(),
  money: v.number(),
});
