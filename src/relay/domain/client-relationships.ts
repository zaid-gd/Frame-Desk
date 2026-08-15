import type { ClientProject, ClientProjectGroup } from "./client";
import type { WorkspaceProject } from "./workspace-project";

export function clientRelationships(projects: readonly WorkspaceProject[]): { projects: ClientProject[]; groups: ClientProjectGroup[] } {
  const relatedProjects = projects.map((project) => ({
    ...project,
    status: project.status ?? (project.tone === "delivered" ? "past" as const : "active" as const),
    outstandingAmount: project.outstandingAmount ?? 0,
  }));
  const groups = [...new Map(projects.filter((project) => project.projectGroupId && project.projectGroupName).map((project) => [project.projectGroupId!, { id: project.projectGroupId!, clientId: project.clientId, name: project.projectGroupName! }])).values()];
  return { projects: relatedProjects, groups };
}
