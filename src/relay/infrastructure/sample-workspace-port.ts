import { sampleWriteRefusal, type WorkspacePort, type WorkspaceProject } from "../ports/workspace-port";

const sampleProjects: readonly WorkspaceProject[] = [
  { name: "Demo Project Alpha", client: "Demo Client", stage: "In review", tone: "review", due: "Aug 15, 2026", progress: "60%" },
  { name: "Demo Project Beta", client: "Demo Client", stage: "Delivered", tone: "delivered", due: "Aug 29, 2026", progress: "100%" },
  { name: "Demo Project Delta", client: "Demo Client", stage: "Overdue", tone: "overdue", due: "Aug 18, 2026", progress: "40%" },
  { name: "Demo Project Gamma", client: "Demo Client", stage: "Planned", tone: "planned", due: "Aug 28, 2026", progress: "0%" },
];

export function createSampleWorkspacePort(): WorkspacePort {
  return {
    loadProjects() {
      return sampleProjects;
    },
    async requestNewProject() {
      return sampleWriteRefusal;
    },
  };
}
