import { deriveSalaryPlanProgress, markSalaryBatchReceived, salaryPlanSchema, type SalaryBatch, type SalaryPlan, type SalaryPlanInput, type SalaryProject } from "../domain/salary-plan";
import type { ProjectChoice } from "../domain/project";
import type { SalaryPlanPort } from "../ports/salary-plan-port";
import { readLocalWorkspaceState, RELAY_LOCAL_WORKSPACE_KEY, type LocalWorkspaceState } from "./local-workspace-state";

type SalaryStorage = Pick<Storage, "getItem" | "setItem">;

export function createLocalSalaryPlanPort(storage: SalaryStorage, clients: readonly ProjectChoice[], now = () => new Date().toISOString()): SalaryPlanPort {
  const state = (): LocalWorkspaceState => readLocalWorkspaceState(storage) ?? { clients: [], projects: [] };
  const save = (next: LocalWorkspaceState) => storage.setItem(RELAY_LOCAL_WORKSPACE_KEY, JSON.stringify(next));
  const projects = (): SalaryProject[] => state().projects.map((project) => ({ id: project.id, ...(project.salaryPlanId ? { salaryPlanId: project.salaryPlanId } : {}), ...(project.completedAt ? { completedAt: project.completedAt } : {}) }));
  const plans = () => state().salaryPlans ?? [];
  const batches = () => state().salaryBatches ?? [];
  const summaries = () => plans().map((plan) => ({ ...plan, ...deriveSalaryPlanProgress(plan, projects(), batches()) }));
  const validInput = (input: SalaryPlanInput) => {
    const parsed = salaryPlanSchema.safeParse(input);
    return parsed.success ? null : parsed.error.issues[0]?.message ?? "Enter valid Salary Plan details.";
  };
  const activeClient = (clientId: string) => clients.some((client) => client.id === clientId && !client.archived);
  return {
    planState: () => ({ kind: "ready" as const }),
    loadPlans: summaries,
    loadBatches: batches,
    async createPlan(input) {
      const error = validInput(input);
      if (error) return { ok: false, error: { kind: "invalid", message: error } };
      if (!activeClient(input.clientId)) return { ok: false, error: { kind: "invalid", message: "Choose an active Client for this Salary Plan." } };
      const id = `plan_${crypto.randomUUID()}`;
      try { save({ ...state(), salaryPlans: [...plans(), { id, archived: false, ...structuredClone(input) }] }); return { ok: true, value: { id } }; }
      catch { return { ok: false, error: { kind: "unavailable", message: "Browser storage refused the Salary Plan write." } }; }
    },
    async editPlan(id, input) {
      const error = validInput(input);
      if (error) return { ok: false, error: { kind: "invalid", message: error } };
      if (!activeClient(input.clientId)) return { ok: false, error: { kind: "invalid", message: "Choose an active Client for this Salary Plan." } };
      const existing = plans().find((plan) => plan.id === id);
      if (!existing) return { ok: false, error: { kind: "not-found", message: "Salary Plan not found." } };
      if (input.clientId !== existing.clientId && projects().some((project) => project.salaryPlanId === id)) return { ok: false, error: { kind: "invalid", message: "Move this Salary Plan's Projects before changing its Client." } };
      try { save({ ...state(), salaryPlans: plans().map((plan) => plan.id === id ? { ...plan, ...structuredClone(input) } : plan) }); return { ok: true, value: undefined }; }
      catch { return { ok: false, error: { kind: "unavailable", message: "Browser storage refused the Salary Plan write." } }; }
    },
    async setPlanArchived(id, archived) {
      if (!plans().some((plan) => plan.id === id)) return { ok: false, error: { kind: "not-found", message: "Salary Plan not found." } };
      try { save({ ...state(), salaryPlans: plans().map((plan) => plan.id === id ? { ...plan, archived } : plan) }); return { ok: true, value: undefined }; }
      catch { return { ok: false, error: { kind: "unavailable", message: "Browser storage refused the Salary Plan update." } }; }
    },
    async markBatchReceived(id, correctionNote) {
      const current = batches();
      const index = current.findIndex((batch) => batch.id === id);
      if (index < 0) return { ok: false, error: { kind: "not-found", message: "Salary Batch not found." } };
      if (current[index].receivedAt) return { ok: false, error: { kind: "invalid", message: "Salary Batch is already received." } };
      try { const next = [...current]; next[index] = markSalaryBatchReceived(next[index], now(), correctionNote); save({ ...state(), salaryBatches: next }); return { ok: true, value: undefined }; }
      catch { return { ok: false, error: { kind: "unavailable", message: "Browser storage refused the Salary Batch update." } }; }
    },
  };
}
