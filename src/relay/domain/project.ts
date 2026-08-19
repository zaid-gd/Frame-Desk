import { z } from "zod";
import type { ProjectSetup, WorkflowStage, WorkflowTemplate } from "./workflow-template";
import { isIsoCalendarDate } from "./calendar-date";
export type { ProjectGroup, ProjectGroupInput } from "./project-group";

export const financialTypes = ["projectValue", "salaryPlan", "nonBillable"] as const;
export type FinancialType = (typeof financialTypes)[number];

export const newProjectSchema = z.object({
  name: z.string().trim().min(1, "Enter a Project name.").max(200),
  clientId: z.string().min(1, "Choose a Client."),
  projectGroupId: z.string(),
  templateId: z.string().min(1, "Choose a Workflow Template."),
  dueDate: z.string().refine(isIsoCalendarDate, "Enter a valid due date."),
  financialType: z.enum(financialTypes),
  salaryPlanId: z.string().optional(),
}).strict();

export type NewProjectInput = z.infer<typeof newProjectSchema>;

export type ProjectRecord = {
  id: string;
  name: string;
  clientId: string;
  projectGroupId?: string;
  stage: string;
  dueDate: string;
  financialType: FinancialType;
  salaryPlanId?: string;
  lead: string;
  assignees: string[];
  progress: number;
  money: number;
  paymentState: "paid" | "unpaid" | "not-applicable";
  archived: boolean;
  workflowSetup: ProjectSetup;
  workflowStageId?: string;
  completedAt?: string;
};

export type ProjectStageEffect =
  | { kind: "projectValue"; amount: number }
  | { kind: "salaryPlan"; change: "added" | "removed"; batchId?: string }
  | { kind: "none" };

export type ProjectTone = "review" | "delivered" | "planned";

const progressByPurpose: Record<WorkflowStage["purpose"], number> = {
  planned: 0,
  editing: 25,
  clientReview: 50,
  revisions: 65,
  approved: 90,
  delivered: 100,
};

export function projectStageTransition(project: ProjectRecord, targetStageId: string, completedAt: string, confirmed: boolean) {
  const target = project.workflowSetup.stages.find(({ id }) => id === targetStageId);
  if (!target) return null;
  const current = project.workflowSetup.stages.find(({ id }) => id === project.workflowStageId)
    ?? project.workflowSetup.stages.find(({ label }) => label === project.stage);
  const wasDelivered = current?.purpose === "delivered" || project.completedAt !== undefined;
  const isDelivered = target.purpose === "delivered";
  if (isDelivered && !wasDelivered && !confirmed) return { kind: "confirmation-required" as const };
  const effect: ProjectStageEffect = isDelivered && !wasDelivered
    ? project.financialType === "projectValue" ? { kind: "projectValue", amount: project.money } : project.financialType === "salaryPlan" ? { kind: "salaryPlan", change: "added" } : { kind: "none" }
    : wasDelivered && !isDelivered && project.financialType === "salaryPlan" ? { kind: "salaryPlan", change: "removed" }
    : { kind: "none" };
  const tone: ProjectTone = isDelivered ? "delivered" : target.purpose === "clientReview" || target.purpose === "revisions" || target.purpose === "approved" ? "review" : "planned";
  return {
    kind: "ready" as const,
    project: { ...project, stage: target.label, workflowStageId: target.id, progress: progressByPurpose[target.purpose], ...(isDelivered ? { completedAt: project.completedAt ?? completedAt } : { completedAt: undefined }) },
    effect,
    tone,
  };
}

export type ProjectViewState = {
  query?: string;
  client?: string;
  stage?: string;
  payment?: ProjectRecord["paymentState"];
  salary?: "salary" | "other";
  sort?: "name" | "client" | "stage" | "due" | "payment";
  direction?: "asc" | "desc";
  view?: "table" | "board";
  archived?: "include";
};

export type ProjectChoice = { id: string; name: string; archived: boolean };
export type ProjectTemplate = Pick<WorkflowTemplate, "id" | "name" | "archived" | "stages" | "cancelledLabel" | "starterOutputs" | "roles" | "portalDefaults">;
