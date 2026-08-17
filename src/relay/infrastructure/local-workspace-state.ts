import type { RelayClient } from "../domain/client";
import type { WorkspaceProject } from "../domain/workspace-project";
import type { WorkflowTemplate } from "../domain/workflow-template";
import type { ProjectGroup } from "../domain/project";

export const RELAY_LOCAL_WORKSPACE_KEY = "relay:local-workspace:v2";
export type LocalWorkspaceState = { clients: RelayClient[]; projects: WorkspaceProject[]; workflowTemplates?: WorkflowTemplate[]; projectGroups?: ProjectGroup[] };

export function readLocalWorkspaceState(storage: Pick<Storage, "getItem">): LocalWorkspaceState | null {
  try {
    const value: unknown = JSON.parse(storage.getItem(RELAY_LOCAL_WORKSPACE_KEY) ?? "null");
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const state = value as LocalWorkspaceState;
    return Array.isArray(state.clients) && Array.isArray(state.projects) && (state.workflowTemplates === undefined || Array.isArray(state.workflowTemplates)) && (state.projectGroups === undefined || Array.isArray(state.projectGroups)) ? state : null;
  } catch { return null; }
}
