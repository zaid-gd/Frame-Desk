import type { RelayClient } from "../domain/client";
import type { WorkspaceProject } from "../domain/workspace-project";

export const RELAY_LOCAL_WORKSPACE_KEY = "relay:local-workspace:v2";
export type LocalWorkspaceState = { clients: RelayClient[]; projects: WorkspaceProject[] };

export function readLocalWorkspaceState(storage: Pick<Storage, "getItem">): LocalWorkspaceState | null {
  try {
    const value: unknown = JSON.parse(storage.getItem(RELAY_LOCAL_WORKSPACE_KEY) ?? "null");
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const state = value as LocalWorkspaceState;
    return Array.isArray(state.clients) && Array.isArray(state.projects) ? state : null;
  } catch { return null; }
}
