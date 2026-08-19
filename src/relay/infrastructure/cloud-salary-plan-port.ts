"use client";

import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import type { SalaryPlanPort, SalaryPlanWriteResult } from "../ports/salary-plan-port";
import type { SalaryPlanInput } from "../domain/salary-plan";

const refs = {
  plans: makeFunctionReference<"query", { includeArchived?: boolean }, ReturnType<SalaryPlanPort["loadPlans"]>>("relaySalaryPlans:listPlans"),
  batches: makeFunctionReference<"query", Record<string, never>, ReturnType<SalaryPlanPort["loadBatches"]>>("relaySalaryPlans:listBatches"),
  createPlan: makeFunctionReference<"mutation", SalaryPlanInput, { id: string }>("relaySalaryPlans:createPlan"),
  editPlan: makeFunctionReference<"mutation", SalaryPlanInput & { id: string }, null>("relaySalaryPlans:editPlan"),
  archivePlan: makeFunctionReference<"mutation", { id: string; archived: boolean }, null>("relaySalaryPlans:setArchived"),
  receiveBatch: makeFunctionReference<"mutation", { id: string; correctionNote?: string }, null>("relaySalaryPlans:markBatchReceived"),
};

function writeError(error: unknown, fallback: string): SalaryPlanWriteResult<never> {
  const data = error && typeof error === "object" && "data" in error ? error.data : null;
  if (data && typeof data === "object" && "kind" in data && "message" in data
    && ["unauthorized", "forbidden", "invalid", "not-found", "transport", "unavailable"].includes(String(data.kind)) && typeof data.message === "string") {
    return { ok: false, error: { kind: data.kind as "unauthorized" | "forbidden" | "invalid" | "not-found" | "transport" | "unavailable", message: data.message } };
  }
  return { ok: false, error: { kind: "transport", message: error instanceof Error ? error.message : fallback } };
}

export function useCloudSalaryPlanPort(enabled: boolean): SalaryPlanPort {
  const plans = useQuery(refs.plans, enabled ? { includeArchived: true } : "skip");
  const batches = useQuery(refs.batches, enabled ? {} : "skip");
  const createPlan = useMutation(refs.createPlan);
  const editPlan = useMutation(refs.editPlan);
  const archivePlan = useMutation(refs.archivePlan);
  const receiveBatch = useMutation(refs.receiveBatch);
  return useMemo(() => ({
    planState: () => plans === undefined || batches === undefined ? { kind: "loading" as const } : { kind: "ready" as const },
    loadPlans: () => plans ?? [],
    loadBatches: () => batches ?? [],
    async createPlan(input) { try { return { ok: true as const, value: await createPlan(input) }; } catch (error) { return writeError(error, "Salary Plan could not be created."); } },
    async editPlan(id, input) { try { await editPlan({ id, ...input }); return { ok: true as const, value: undefined }; } catch (error) { return writeError(error, "Salary Plan could not be saved."); } },
    async setPlanArchived(id, archived) { try { await archivePlan({ id, archived }); return { ok: true as const, value: undefined }; } catch (error) { return writeError(error, "Salary Plan could not be archived."); } },
    async markBatchReceived(id, correctionNote) { try { await receiveBatch({ id, ...(correctionNote ? { correctionNote } : {}) }); return { ok: true as const, value: undefined }; } catch (error) { return writeError(error, "Salary Batch could not be updated."); } },
  }), [archivePlan, batches, createPlan, editPlan, plans, receiveBatch]);
}
