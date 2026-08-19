import { describe, expect, test } from "vitest";
import { buildWorkspaceReport, createReportPeriod } from "./reporting";

describe("Relay reporting", () => {
  test("uses delivered work and paid state for one consistent money ledger", () => {
    const period = createReportPeriod({ kind: "month", value: "2026-08" });
    const report = buildWorkspaceReport({
      period,
      currencyCode: "AED",
      clients: [
        { id: "client_acme", name: "Acme", company: "", contactName: "", email: "", phone: "", notes: "", archived: false },
        { id: "client_beta", name: "Beta", company: "", contactName: "", email: "", phone: "", notes: "", archived: false },
      ],
      projects: [
        {
          id: "project_paid", name: "Paid", clientId: "client_acme", stage: "Delivered", dueDate: "2026-08-09",
          financialType: "projectValue", paymentState: "paid", paidAt: "2026-08-12T09:00:00.000Z", agreedAmount: 1200,
          lead: "owner", assignees: [], progress: 100, money: 1200, archived: false, completedAt: "2026-08-10T09:00:00.000Z",
          createdAt: "2026-08-01T09:00:00.000Z", workflowSetup: { templateId: "template", templateName: "Template", stages: [], cancelledLabel: "Cancelled", starterOutputs: [], roles: [], portalDefaults: { enabled: false, showDates: false, showNotes: false, allowComments: false } },
          stageHistory: [
            { stageId: "editing", label: "Editing", purpose: "editing", enteredAt: "2026-08-03T09:00:00.000Z", exitedAt: "2026-08-08T09:00:00.000Z" },
            { stageId: "delivered", label: "Delivered", purpose: "delivered", enteredAt: "2026-08-08T09:00:00.000Z", exitedAt: "2026-08-10T09:00:00.000Z" },
          ],
        },
        {
          id: "project_unpaid", name: "Unpaid", clientId: "client_acme", stage: "Delivered", dueDate: "2026-08-12",
          financialType: "projectValue", paymentState: "unpaid", agreedAmount: 800,
          lead: "owner", assignees: [], progress: 100, money: 800, archived: false, completedAt: "2026-08-12T09:00:00.000Z",
          createdAt: "2026-08-04T09:00:00.000Z", workflowSetup: { templateId: "template", templateName: "Template", stages: [], cancelledLabel: "Cancelled", starterOutputs: [], roles: [], portalDefaults: { enabled: false, showDates: false, showNotes: false, allowComments: false } },
        },
        {
          id: "project_active", name: "Active", clientId: "client_beta", stage: "Editing", dueDate: "2026-08-20",
          financialType: "projectValue", paymentState: "unpaid", agreedAmount: 500,
          lead: "owner", assignees: [], progress: 30, money: 500, archived: false,
          workflowSetup: { templateId: "template", templateName: "Template", stages: [], cancelledLabel: "Cancelled", starterOutputs: [], roles: [], portalDefaults: { enabled: false, showDates: false, showNotes: false, allowComments: false } },
        },
      ],
      outputCounts: [
        { projectId: "project_paid", count: 2 },
        { projectId: "project_unpaid", count: 1 },
      ],
      salaryPlans: [{ id: "plan_beta", clientId: "client_beta", requiredProjectCount: 3, batchAmount: 3000, startDate: "2026-08-01", notes: "", archived: false }],
      salaryBatches: [
        { id: "batch_beta", planId: "plan_beta", clientId: "client_beta", requiredProjectCount: 3, batchAmount: 3000, startDate: "2026-08-01", notes: "", projectIds: ["salary_1", "salary_2", "salary_3"], completedAt: "2026-08-11T09:00:00.000Z", receivedAt: null },
        { id: "batch_beta_received", planId: "plan_beta", clientId: "client_beta", requiredProjectCount: 3, batchAmount: 1000, startDate: "2026-08-01", notes: "", projectIds: ["salary_4", "salary_5", "salary_6"], completedAt: "2026-08-13T09:00:00.000Z", receivedAt: "2026-09-01T09:00:00.000Z" },
      ],
      access: { canViewMoney: true, canViewSalary: true },
    });

    expect(report.work).toMatchObject({ completedProjectCount: 2, outputCount: 3, averageTurnaroundDays: 8.5 });
    if (!report.money) throw new Error("Money report should be visible");
    expect(report.money).toMatchObject({ earned: 6000, collected: 2200, outstanding: 3800 });
    expect(report.money.clientTotals).toEqual([
      { clientId: "client_acme", clientName: "Acme", earned: 2000, collected: 1200, outstanding: 800 },
      { clientId: "client_beta", clientName: "Beta", earned: 4000, collected: 1000, outstanding: 3000 },
    ]);
    expect(report.work.stageDelays).toEqual([
      expect.objectContaining({ stageId: "editing", label: "Editing", averageDays: 5, projectCount: 1 }),
    ]);
    expect(report.salary).toMatchObject({ completedBatchCount: 2, receivedBatchCount: 1, unpaidBatchCount: 1 });
  });

  test("returns a prior period and hides finance data when the reader lacks access", () => {
    const period = createReportPeriod({ kind: "quarter", value: "2026-Q3" });
    const report = buildWorkspaceReport({ period, currencyCode: "USD", clients: [], projects: [], outputCounts: [], salaryPlans: [], salaryBatches: [], access: { canViewMoney: false, canViewSalary: false } });

    expect(report.period).toMatchObject({ kind: "quarter", start: "2026-07-01", end: "2026-10-01" });
    expect(report.comparison).toMatchObject({ start: "2026-04-01", end: "2026-07-01" });
    expect(report.money).toBeNull();
    expect(report.salary).toBeNull();
  });
});
