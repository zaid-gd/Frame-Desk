import { v } from "convex/values";

export const relayProjectValidator = v.object({
  name: v.string(),
  client: v.string(),
  stage: v.string(),
  tone: v.union(v.literal("review"), v.literal("delivered"), v.literal("overdue"), v.literal("planned")),
  due: v.string(),
  progress: v.string(),
});
