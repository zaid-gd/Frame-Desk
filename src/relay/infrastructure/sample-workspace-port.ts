import { sampleWriteRefusal, type WorkspacePort, type WorkspaceProject } from "../ports/workspace-port";

const sampleProjects: readonly WorkspaceProject[] = [
  { id: "demo_alpha", name: "Demo Project Alpha", clientId: "client_demo", stage: "In review", tone: "review", due: "Aug 15, 2026", progress: "60%" },
  { id: "demo_beta", name: "Demo Project Beta", clientId: "client_demo", stage: "Delivered", tone: "delivered", due: "Aug 29, 2026", progress: "100%" },
  { id: "demo_delta", name: "Demo Project Delta", clientId: "client_demo", stage: "Overdue", tone: "overdue", due: "Aug 18, 2026", progress: "40%" },
  { id: "demo_gamma", name: "Demo Project Gamma", clientId: "client_demo", stage: "Planned", tone: "planned", due: "Aug 28, 2026", progress: "0%" },
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
