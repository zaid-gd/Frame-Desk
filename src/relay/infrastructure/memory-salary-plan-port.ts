import { deriveSalaryPlanProgress, markSalaryBatchReceived, salaryPlanSchema, type SalaryBatch, type SalaryPlan, type SalaryPlanInput, type SalaryProject } from "../domain/salary-plan";
import type { SalaryPlanPort } from "../ports/salary-plan-port";

export function createMemorySalaryPlanPort({ plans = [], batches = [], projects = [], now = () => "1970-01-01T00:00:00.000Z", createId = (() => { let sequence = 0; return () => `plan_memory_${++sequence}`; })() }: { plans?: readonly SalaryPlan[]; batches?: readonly SalaryBatch[]; projects?: readonly SalaryProject[]; now?: () => string; createId?: () => string } = {}): SalaryPlanPort {
  const savedPlans = structuredClone([...plans]);
  const savedBatches = structuredClone([...batches]);
  const savedProjects = structuredClone([...projects]);
  const summaries = () => savedPlans.map((plan) => ({ ...plan, ...deriveSalaryPlanProgress(plan, savedProjects, savedBatches) }));
  const invalidInput = (input: SalaryPlanInput) => {
    const parsed = salaryPlanSchema.safeParse(input);
    return parsed.success ? null : parsed.error.issues[0]?.message ?? "Enter valid Salary Plan details.";
  };
  return {
    planState: () => ({ kind: "ready" as const }),
    loadPlans: summaries,
    loadBatches: () => savedBatches,
    async createPlan(input) {
      const error = invalidInput(input);
      if (error) return { ok: false, error: { kind: "invalid", message: error } };
      const id = createId();
      savedPlans.push({ id, archived: false, ...structuredClone(input) });
      return { ok: true, value: { id } };
    },
    async editPlan(id, input) {
      const error = invalidInput(input);
      if (error) return { ok: false, error: { kind: "invalid", message: error } };
      const plan = savedPlans.find((row) => row.id === id);
      if (!plan) return { ok: false, error: { kind: "not-found", message: "Salary Plan not found." } };
      if (input.clientId !== plan.clientId && savedProjects.some((project) => project.salaryPlanId === id)) return { ok: false, error: { kind: "invalid", message: "Move this Salary Plan's Projects before changing its Client." } };
      Object.assign(plan, structuredClone(input));
      return { ok: true, value: undefined };
    },
    async setPlanArchived(id, archived) {
      const plan = savedPlans.find((row) => row.id === id);
      if (!plan) return { ok: false, error: { kind: "not-found", message: "Salary Plan not found." } };
      plan.archived = archived;
      return { ok: true, value: undefined };
    },
    async markBatchReceived(id, correctionNote) {
      const index = savedBatches.findIndex((batch) => batch.id === id);
      if (index < 0) return { ok: false, error: { kind: "not-found", message: "Salary Batch not found." } };
      if (savedBatches[index].receivedAt) return { ok: false, error: { kind: "invalid", message: "Salary Batch is already received." } };
      savedBatches[index] = markSalaryBatchReceived(savedBatches[index], now(), correctionNote);
      return { ok: true, value: undefined };
    },
  };
}
