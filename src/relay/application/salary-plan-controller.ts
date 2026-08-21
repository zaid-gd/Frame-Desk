import { salaryPlanSchema, type SalaryPlanInput } from "../domain/salary-plan";
import type { ProjectChoice } from "../domain/project";
import type { SalaryPlanPort, SalaryPlanWriteResult } from "../ports/salary-plan-port";

function message<T>(result: SalaryPlanWriteResult<T>, success: string) {
  return result.ok ? { ok: true as const, message: success } : { ok: false as const, kind: result.error.kind, message: result.error.message };
}

export function createSalaryPlanController({ port, clients, canManage = true }: { port: SalaryPlanPort; clients: readonly ProjectChoice[]; canManage?: boolean }) {
  const clientNames = new Map(clients.map((client) => [client.id, client.name]));
  const activeClients = clients.filter(({ archived }) => !archived);
  const salaryPlans = port.loadPlans().map((plan) => ({ ...plan, clientName: clientNames.get(plan.clientId) ?? "Unknown Client" }));
  return {
    model: {
      canManage,
      planState: port.planState(),
      clients: activeClients.map(({ id: value, name: label }) => ({ value, label })),
      plans: salaryPlans,
      batches: port.loadBatches().map((batch) => ({ ...batch, clientName: clientNames.get(batch.clientId) ?? "Unknown Client" })),
    },
    actions: {
      clientName(id: string) { return clientNames.get(id) ?? "Unknown Client"; },
      plan(id: string) { return port.loadPlans().find((row) => row.id === id) ?? null; },
      async create(input: SalaryPlanInput) {
        const parsed = salaryPlanSchema.safeParse(input);
        if (!parsed.success) return { ok: false as const, kind: "invalid" as const, message: parsed.error.issues[0]?.message ?? "Enter valid Salary Plan details." };
        return message(await port.createPlan(parsed.data), "Salary Plan created.");
      },
      async edit(id: string, input: SalaryPlanInput) {
        const parsed = salaryPlanSchema.safeParse(input);
        if (!parsed.success) return { ok: false as const, kind: "invalid" as const, message: parsed.error.issues[0]?.message ?? "Enter valid Salary Plan details." };
        return message(await port.editPlan(id, parsed.data), "Salary Plan saved.");
      },
      async archive(id: string) { return message(await port.setPlanArchived(id, true), "Salary Plan archived."); },
      async restore(id: string) { return message(await port.setPlanArchived(id, false), "Salary Plan restored."); },
      async receive(id: string, correctionNote?: string) { return message(await port.markBatchReceived(id, correctionNote), "Salary Batch marked received."); },
    },
  };
}

export type SalaryPlanController = ReturnType<typeof createSalaryPlanController>;
