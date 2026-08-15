import { sampleWriteRefusal, type WorkspacePort, type WorkspaceProject } from "../ports/workspace-port";

export function createMemoryWorkspacePort({ readOnly = false, projects = [] }: { readOnly?: boolean; projects?: readonly WorkspaceProject[] } = {}): WorkspacePort {
  const records = [...projects];
  return {
    loadProjects() {
      return records;
    },
    async requestNewProject() {
      if (readOnly) {
        return sampleWriteRefusal;
      }
      records.push({ name: "Untitled local project", client: "No client", stage: "Planned", tone: "planned", due: "Not set", progress: "0%" });
      return { ok: true };
    },
  };
}
