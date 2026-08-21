import { describe, expect, test } from "vitest";
import { createSalaryPlanController } from "./salary-plan-controller";
import { createMemorySalaryPlanPort } from "../infrastructure/memory-salary-plan-port";

const input = {
  clientId: "client_acme",
  requiredProjectCount: 2,
  batchAmount: 6000,
  startDate: "2026-08-01",
  notes: "Launch work; keep client corrections here.",
};

describe("Salary Plan controller", () => {
  test("shows count-only progress and exposes archive actions", async () => {
    const port = createMemorySalaryPlanPort({
      projects: [
        { id: "project_one", salaryPlanId: "plan_existing", completedAt: "2026-08-02T10:00:00.000Z" },
      ],
      plans: [{ id: "plan_existing", archived: false, ...input }],
      now: () => "2026-08-03T10:00:00.000Z",
    });
    const controller = createSalaryPlanController({ port, clients: [{ id: "client_acme", name: "Acme", archived: false }] });

    expect(controller.model.plans[0]).toMatchObject({ deliveredProjectCount: 1, remainingProjectCount: 1, currentAmount: null, clientName: "Acme" });
    await expect(controller.actions.archive("plan_existing")).resolves.toEqual({ ok: true, message: "Salary Plan archived." });
    expect(port.loadPlans()[0].archived).toBe(true);
  });

  test("preserves correction notes when receiving a batch", async () => {
    const port = createMemorySalaryPlanPort({
      plans: [{ id: "plan_existing", archived: false, ...input }],
      batches: [{ id: "batch_existing", planId: "plan_existing", clientId: "client_acme", requiredProjectCount: 2, batchAmount: 6000, startDate: input.startDate, notes: input.notes, projectIds: ["project_one", "project_two"], completedAt: "2026-08-02T10:00:00.000Z", receivedAt: null }],
      now: () => "2026-08-03T10:00:00.000Z",
    });
    const controller = createSalaryPlanController({ port, clients: [{ id: "client_acme", name: "Acme", archived: false }] });

    await expect(controller.actions.receive("batch_existing", "Client corrected the invoice.")).resolves.toEqual({ ok: true, message: "Salary Batch marked received." });
    expect(port.loadBatches()[0]).toMatchObject({ receivedAt: "2026-08-03T10:00:00.000Z", correctionNote: "Client corrected the invoice.", notes: input.notes, batchAmount: input.batchAmount });
  });
});
