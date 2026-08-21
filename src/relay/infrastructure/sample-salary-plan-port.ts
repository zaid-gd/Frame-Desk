import type { SalaryPlan } from "../domain/salary-plan";
import { createMemorySalaryPlanPort } from "./memory-salary-plan-port";
import { salaryPlanWriteRefusal, type SalaryPlanPort } from "../ports/salary-plan-port";

const plan: SalaryPlan = { id: "plan_demo", clientId: "client_demo", requiredProjectCount: 3, batchAmount: 9000, startDate: "2026-08-01", notes: "Sample Salary Plan", archived: false };

export function createSampleSalaryPlanPort(): SalaryPlanPort {
  const readOnly = createMemorySalaryPlanPort({ plans: [plan], projects: [{ id: "demo_alpha", salaryPlanId: plan.id, completedAt: "2026-08-10T10:00:00.000Z" }] });
  return {
    planState: readOnly.planState,
    loadPlans: readOnly.loadPlans,
    loadBatches: readOnly.loadBatches,
    async createPlan() { return salaryPlanWriteRefusal; },
    async editPlan() { return salaryPlanWriteRefusal; },
    async setPlanArchived() { return salaryPlanWriteRefusal; },
    async markBatchReceived() { return salaryPlanWriteRefusal; },
  };
}
