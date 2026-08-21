import { z } from "zod";
import { isIsoCalendarDate } from "./calendar-date";

export const MAX_SALARY_PLAN_PROJECTS = 500;

export const salaryPlanSchema = z.object({
  clientId: z.string().trim().min(1, "Choose a Client."),
  requiredProjectCount: z.number().int().min(1).max(MAX_SALARY_PLAN_PROJECTS),
  batchAmount: z.number().finite().nonnegative(),
  startDate: z.string().refine(isIsoCalendarDate, "Enter a valid Salary Plan start date."),
  notes: z.string().max(2000),
}).strict();

export type SalaryPlanInput = z.infer<typeof salaryPlanSchema>;
export type SalaryPlan = SalaryPlanInput & { id: string; archived: boolean };

export type SalaryBatch = {
  id: string;
  planId: string;
  clientId: string;
  requiredProjectCount: number;
  batchAmount: number;
  startDate: string;
  notes: string;
  projectIds: string[];
  completedAt: string;
  receivedAt: string | null;
  correctionNote?: string;
};

export type SalaryProject = {
  id: string;
  salaryPlanId?: string;
  completedAt?: string;
};

export type SalaryPlanProgress = {
  deliveredProjectIds: readonly string[];
  deliveredProjectCount: number;
  requiredProjectCount: number;
  remainingProjectCount: number;
  currentAmount: number | null;
};

export function deriveSalaryPlanProgress(plan: SalaryPlan, projects: readonly SalaryProject[], batches: readonly SalaryBatch[]): SalaryPlanProgress {
  const batchedProjectIds = new Set(
    batches.filter((batch) => batch.planId === plan.id).flatMap((batch) => batch.projectIds),
  );
  const deliveredProjectIds = projects
    .filter((project) => project.salaryPlanId === plan.id)
    .filter((project): project is SalaryProject & { completedAt: string } => typeof project.completedAt === "string" && project.completedAt.slice(0, 10) >= plan.startDate)
    .filter((project) => !batchedProjectIds.has(project.id))
    .sort((left, right) => left.completedAt.localeCompare(right.completedAt) || left.id.localeCompare(right.id))
    .map((project) => project.id);
  const deliveredProjectCount = deliveredProjectIds.length;
  return {
    deliveredProjectIds,
    deliveredProjectCount,
    requiredProjectCount: plan.requiredProjectCount,
    remainingProjectCount: Math.max(0, plan.requiredProjectCount - deliveredProjectCount),
    currentAmount: deliveredProjectCount >= plan.requiredProjectCount ? plan.batchAmount : null,
  };
}

export function markSalaryBatchReceived(batch: SalaryBatch, receivedAt: string, correctionNote?: string): SalaryBatch {
  const note = correctionNote?.trim();
  return {
    ...batch,
    receivedAt,
    ...(note ? { correctionNote: note } : {}),
  };
}
