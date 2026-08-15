import { v } from "convex/values";

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
