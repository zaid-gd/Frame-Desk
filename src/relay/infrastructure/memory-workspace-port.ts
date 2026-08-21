import { sampleWriteRefusal, type WorkspacePort, type WorkspaceProject } from "../ports/workspace-port";
import { createWorkspaceProjectDraft } from "../domain/workspace-project";

export function createMemoryWorkspacePort({ readOnly = false, projects = [] }: { readOnly?: boolean; projects?: readonly WorkspaceProject[] } = {}): WorkspacePort {
  const records = [...projects];
  return {
    loadProjects() {
      return records;
    },
    async requestNewProject(setup) {
      if (readOnly) {
        return sampleWriteRefusal;
      }
      records.push(createWorkspaceProjectDraft(`project_${crypto.randomUUID()}`, "Untitled local project", setup));
      return { ok: true };
    },
  };
}
