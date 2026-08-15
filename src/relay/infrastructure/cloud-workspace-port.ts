import type { WorkspacePort } from "../ports/workspace-port";

export function createCloudWorkspacePort(): WorkspacePort {
  return {
    loadProjects() {
      return [];
    },
    async requestNewProject() {
      return { ok: false, error: { kind: "unavailable", message: "Cloud project creation is not part of this Relay shell ticket." } };
    },
  };
}
