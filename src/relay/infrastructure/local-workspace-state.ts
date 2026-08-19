import type { RelayClient } from "../domain/client";
import type { WorkspaceProject } from "../domain/workspace-project";
import type { WorkflowTemplate } from "../domain/workflow-template";
import type { ProjectGroup } from "../domain/project";
import type { ProjectOutput } from "../domain/project-output";
import type { SalaryBatch, SalaryPlan } from "../domain/salary-plan";

export const RELAY_LOCAL_WORKSPACE_KEY = "relay:local-workspace:v2";
export type LocalWorkspaceState = { clients: RelayClient[]; projects: WorkspaceProject[]; workflowTemplates?: WorkflowTemplate[]; projectGroups?: ProjectGroup[]; projectOutputs?: ProjectOutput[]; salaryPlans?: SalaryPlan[]; salaryBatches?: SalaryBatch[] };

export function readLocalWorkspaceState(storage: Pick<Storage, "getItem">): LocalWorkspaceState | null {
  try {
    const value: unknown = JSON.parse(storage.getItem(RELAY_LOCAL_WORKSPACE_KEY) ?? "null");
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const state = value as LocalWorkspaceState;
    return Array.isArray(state.clients) && Array.isArray(state.projects) && (state.workflowTemplates === undefined || Array.isArray(state.workflowTemplates)) && (state.projectGroups === undefined || Array.isArray(state.projectGroups)) && (state.projectOutputs === undefined || Array.isArray(state.projectOutputs)) && (state.salaryPlans === undefined || Array.isArray(state.salaryPlans)) && (state.salaryBatches === undefined || Array.isArray(state.salaryBatches)) ? state : null;
  } catch { return null; }
}
