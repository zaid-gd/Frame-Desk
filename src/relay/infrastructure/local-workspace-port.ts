import type { WorkspacePort, WorkspaceProject } from "../ports/workspace-port";
import { isWorkspaceProject, MAX_RELAY_PROJECTS } from "../domain/workspace-project";
import { readLocalWorkspaceState, RELAY_LOCAL_WORKSPACE_KEY } from "./local-workspace-state";
import { isRelayClient } from "../domain/client";

export const RELAY_LOCAL_PROJECTS_KEY = "relay:local-projects:v1";

export function createLocalWorkspacePort(storage?: Pick<Storage, "getItem" | "setItem">): WorkspacePort {
  const browserStorage = () => storage ?? (typeof window === "undefined" ? undefined : window.localStorage);
  return {
    loadProjects() {
      const target = browserStorage();
      const state = target ? readLocalWorkspaceState(target) : null;
      const stored = state ? JSON.stringify(state.projects) : target?.getItem(RELAY_LOCAL_PROJECTS_KEY);
      if (!stored) return [];
      try {
        const projects: unknown = JSON.parse(stored);
        return Array.isArray(projects) && projects.length <= MAX_RELAY_PROJECTS && projects.every(isWorkspaceProject) ? projects : [];
      } catch {
        return [];
      }
    },
    async requestNewProject() {
      const target = browserStorage();
      if (!target) return { ok: false, error: { kind: "unavailable", message: "Browser storage is unavailable, so Relay could not save this local draft." } };
      const projects = this.loadProjects();
      if (projects.length >= MAX_RELAY_PROJECTS) {
        return { ok: false, error: { kind: "unavailable", message: "Local Mode supports up to 500 projects so every Workspace can be backed up safely." } };
      }
      const suffix = projects.length ? ` ${projects.length + 1}` : "";
      const clientId = "client_unassigned";
      const draft: WorkspaceProject = { id: `project_${crypto.randomUUID()}`, name: `Untitled local project${suffix}`, clientId, stage: "Planned", tone: "planned", due: "Not set", progress: "0%" };
      try {
        const state = readLocalWorkspaceState(target);
        const clients = state?.clients?.every(isRelayClient) ? state.clients : [];
        const nextClients = clients.some((client) => client.id === clientId) ? clients : [...clients, { id: clientId, name: "Unassigned Client", company: "", contactName: "", email: "", phone: "", notes: "Created for draft Projects that need a durable Client.", archived: false }];
        target.setItem(RELAY_LOCAL_WORKSPACE_KEY, JSON.stringify({ clients: nextClients, projects: [...projects, draft] }));
        return { ok: true };
      } catch {
        return { ok: false, error: { kind: "unavailable", message: "Browser storage refused the write, so Relay could not save this local draft." } };
      }
    },
  };
}
