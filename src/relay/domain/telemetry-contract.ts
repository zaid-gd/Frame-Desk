import { z } from "zod";

const countedEvent = (name: "project_delivered" | "client_portal_opened" | "comment_created" | "salary_plan_used" | "salary_batch_created") => z.object({
  name: z.literal(name),
  count: z.number().int().positive().max(1_000),
});

export const analyticsEventSchema = z.discriminatedUnion("name", [
  z.object({ name: z.literal("activation"), milestone: z.enum(["local_workspace_opened", "cloud_workspace_opened", "first_project_created"]) }),
  z.object({ name: z.literal("weekly_return"), week: z.iso.date() }),
  countedEvent("project_delivered"),
  countedEvent("client_portal_opened"),
  countedEvent("comment_created"),
  countedEvent("salary_plan_used"),
  countedEvent("salary_batch_created"),
  z.object({ name: z.literal("storage_consumed"), bytes: z.number().int().nonnegative().max(200_000_000) }),
]);

export const telemetrySchema = z.discriminatedUnion("category", [
  z.object({ category: z.literal("analytics"), event: analyticsEventSchema }),
  z.object({ category: z.literal("essential_error"), error: z.object({ name: z.enum(["Error", "TypeError", "RangeError", "UnknownError"]), operation: z.string().regex(/^[a-z0-9_]{1,80}$/) }) }),
]);

export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;
export type TelemetryPayload = z.infer<typeof telemetrySchema>;
