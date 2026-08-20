import type { ProjectRecord } from "./project";
import type { ProjectOutput } from "./project-output";

export type WorkspaceCalendarEvent = {
  id: string;
  kind: "project" | "output" | "review" | "payment";
  date: string;
  title: string;
  projectName: string;
  href: string;
};

const kindOrder = { review: 0, output: 1, payment: 2, project: 3 } satisfies Record<WorkspaceCalendarEvent["kind"], number>;

function addDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function buildWorkspaceCalendarEvents({ projects, outputs }: { projects: readonly Pick<ProjectRecord, "id" | "name" | "dueDate" | "financialType" | "paidAt" | "archived">[]; outputs: readonly Pick<ProjectOutput, "id" | "projectId" | "name" | "reviewState" | "archived" | "relativeDeadlineDays" | "currentVersionId" | "versions">[] }) {
  const activeProjects = projects.filter(({ archived }) => !archived);
  const projectById = new Map(activeProjects.map((project) => [project.id, project]));
  const events: WorkspaceCalendarEvent[] = activeProjects.flatMap((project) => {
    const href = `/relay/projects/${project.id}`;
    const rows: WorkspaceCalendarEvent[] = [{ id: `project:${project.id}`, kind: "project", date: project.dueDate, title: `${project.name} due`, projectName: project.name, href }];
    if (project.financialType === "projectValue") rows.push({ id: `payment:${project.id}`, kind: "payment", date: project.paidAt?.slice(0, 10) ?? project.dueDate, title: `${project.name} payment ${project.paidAt ? "received" : "due"}`, projectName: project.name, href });
    return rows;
  });
  for (const output of outputs) {
    const project = projectById.get(output.projectId);
    if (output.archived || !project) continue;
    const href = `/relay/projects/${project.id}#outputs`;
    if (output.relativeDeadlineDays !== undefined) events.push({ id: `output:${output.id}`, kind: "output", date: addDays(project.dueDate, output.relativeDeadlineDays), title: `${output.name} due`, projectName: project.name, href });
    if (output.reviewState === "in_review" || output.reviewState === "changes_requested" || output.reviewState === "approved") {
      const current = output.versions.find(({ id }) => id === output.currentVersionId);
      if (current) events.push({ id: `review:${output.id}`, kind: "review", date: current.addedAt.slice(0, 10), title: `${output.name} review`, projectName: project.name, href });
    }
  }
  return events.sort((left, right) => left.date.localeCompare(right.date) || kindOrder[left.kind] - kindOrder[right.kind] || left.title.localeCompare(right.title));
}
