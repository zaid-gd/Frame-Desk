import { describe, expect, test } from "vitest";
import {
  deriveSalaryPlanProgress,
  markSalaryBatchReceived,
  salaryPlanSchema,
  type SalaryBatch,
  type SalaryPlan,
} from "./salary-plan";

const plan: SalaryPlan = {
  id: "plan_acme",
  clientId: "client_acme",
  requiredProjectCount: 3,
  batchAmount: 9000,
  startDate: "2026-08-01",
  notes: "Three launch edits.",
  archived: false,
};

const projects = [
  { id: "project_one", salaryPlanId: plan.id, completedAt: "2026-08-05T10:00:00.000Z" },
  { id: "project_two", salaryPlanId: plan.id, completedAt: "2026-08-06T10:00:00.000Z" },
  { id: "project_before_start", salaryPlanId: plan.id, completedAt: "2026-07-31T10:00:00.000Z" },
  { id: "other_plan_project", salaryPlanId: "plan_other", completedAt: "2026-08-06T10:00:00.000Z" },
];

describe("Salary Plan rules", () => {
  test("reports delivered count without partial money", () => {
    expect(deriveSalaryPlanProgress(plan, projects, [])).toEqual({
      deliveredProjectIds: ["project_one", "project_two"],
      deliveredProjectCount: 2,
      requiredProjectCount: 3,
      remainingProjectCount: 1,
      currentAmount: null,
    });
  });

  test("excludes Projects already captured by an immutable batch", () => {
    const batch: SalaryBatch = {
      id: "batch_acme_1",
      planId: plan.id,
      clientId: plan.clientId,
      requiredProjectCount: plan.requiredProjectCount,
      batchAmount: plan.batchAmount,
      startDate: plan.startDate,
      notes: plan.notes,
      projectIds: ["project_one", "project_two", "project_three"],
      completedAt: "2026-08-07T10:00:00.000Z",
      receivedAt: null,
    };

    expect(deriveSalaryPlanProgress(plan, [...projects, { id: "project_three", salaryPlanId: plan.id, completedAt: "2026-08-07T09:00:00.000Z" }], [batch])).toMatchObject({
      deliveredProjectIds: [],
      deliveredProjectCount: 0,
      currentAmount: null,
    });
  });

  test("keeps the plan snapshot when a received note is added", () => {
    const batch: SalaryBatch = {
      id: "batch_acme_1",
      planId: plan.id,
      clientId: plan.clientId,
      requiredProjectCount: plan.requiredProjectCount,
      batchAmount: plan.batchAmount,
      startDate: plan.startDate,
      notes: plan.notes,
      projectIds: ["project_one", "project_two", "project_three"],
      completedAt: "2026-08-07T10:00:00.000Z",
      receivedAt: null,
    };

    expect(markSalaryBatchReceived(batch, "2026-08-08T10:00:00.000Z", "Client corrected the invoice.")).toEqual({
      ...batch,
      receivedAt: "2026-08-08T10:00:00.000Z",
      correctionNote: "Client corrected the invoice.",
    });
    expect(batch).toEqual(expect.objectContaining({ notes: plan.notes, batchAmount: plan.batchAmount }));
  });

  test("requires a positive Project count and valid plan terms", () => {
    expect(salaryPlanSchema.safeParse({
      clientId: "client_acme",
      requiredProjectCount: 0,
      batchAmount: 9000,
      startDate: "2026-08-01",
      notes: "",
    }).success).toBe(false);
    expect(salaryPlanSchema.safeParse({
      clientId: "client_acme",
      requiredProjectCount: 3,
      batchAmount: 9000,
      startDate: "2026-08-01",
      notes: "",
    }).success).toBe(true);
  });
});
