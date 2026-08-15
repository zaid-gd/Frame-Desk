import type { WorkspacePort, WorkspaceProject } from "../ports/workspace-port";

export const RELAY_LOCAL_PROJECTS_KEY = "relay:local-projects:v1";

function isWorkspaceProject(value: unknown): value is WorkspaceProject {
  if (!value || typeof value !== "object") return false;
  const project = value as Record<string, unknown>;
  return ["name", "client", "stage", "due", "progress"].every((key) => typeof project[key] === "string")
    && ["review", "delivered", "overdue", "planned"].includes(String(project.tone));
}

export function createLocalWorkspacePort(storage?: Pick<Storage, "getItem" | "setItem">): WorkspacePort {
  const browserStorage = () => storage ?? (typeof window === "undefined" ? undefined : window.localStorage);
  return {
    loadProjects() {
      const stored = browserStorage()?.getItem(RELAY_LOCAL_PROJECTS_KEY);
      if (!stored) return [];
      try {
        const projects: unknown = JSON.parse(stored);
        return Array.isArray(projects) && projects.every(isWorkspaceProject) ? projects : [];
      } catch {
        return [];
      }
    },
    async requestNewProject() {
      const target = browserStorage();
      if (!target) return { ok: false, error: { kind: "unavailable", message: "Browser storage is unavailable, so Relay could not save this local draft." } };
      const projects = this.loadProjects();
      const suffix = projects.length ? ` ${projects.length + 1}` : "";
      const draft: WorkspaceProject = { name: `Untitled local project${suffix}`, client: "No client", stage: "Planned", tone: "planned", due: "Not set", progress: "0%" };
      try {
        target.setItem(RELAY_LOCAL_PROJECTS_KEY, JSON.stringify([...projects, draft]));
        return { ok: true };
      } catch {
        return { ok: false, error: { kind: "unavailable", message: "Browser storage refused the write, so Relay could not save this local draft." } };
      }
    },
  };
}
