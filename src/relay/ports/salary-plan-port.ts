import type { SalaryBatch, SalaryPlan, SalaryPlanInput, SalaryPlanProgress } from "../domain/salary-plan";

export type SalaryPlanSummary = SalaryPlan & SalaryPlanProgress;
export type SalaryPlanState = { kind: "loading" | "ready" | "error"; message?: string };
export type SalaryPlanWriteResult<T = undefined> =
  | { ok: true; value: T }
  | { ok: false; error: { kind: "unauthorized" | "forbidden" | "invalid" | "not-found" | "transport" | "unavailable"; message: string } };

export type SalaryPlanPort = {
  planState(): SalaryPlanState;
  loadPlans(): readonly SalaryPlanSummary[];
  loadBatches(): readonly SalaryBatch[];
  createPlan(input: SalaryPlanInput): Promise<SalaryPlanWriteResult<{ id: string }>>;
  editPlan(id: string, input: SalaryPlanInput): Promise<SalaryPlanWriteResult>;
  setPlanArchived(id: string, archived: boolean): Promise<SalaryPlanWriteResult>;
  markBatchReceived(id: string, correctionNote?: string): Promise<SalaryPlanWriteResult>;
};

export const salaryPlanWriteRefusal: SalaryPlanWriteResult<never> = {
  ok: false,
  error: { kind: "forbidden", message: "Sample Workspace is read-only. Choose Local Mode or create an account to make changes." },
};
