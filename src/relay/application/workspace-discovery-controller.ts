import type { RelayClient } from "../domain/client";
import type { ProjectGroup } from "../domain/project-group";
import type { ProjectRecord } from "../domain/project";
import type { ProjectOutput } from "../domain/project-output";
import type { ProjectFile } from "../ports/project-file-port";
import { buildWorkspaceCalendarEvents } from "../domain/workspace-calendar";

export type WorkspaceFileRow =
  | {
    kind: "stored-file";
    id: string;
    title: string;
    detail: string;
    projectName: string;
    ownerUrl: string;
    openUrl: string | null;
  }
  | {
    kind: "media-version";
    id: string;
    title: string;
    detail: string;
    projectName: string;
    ownerUrl: string;
    openUrl: string;
  };

export type WorkspaceSearchResult =
  | { kind: "client"; id: string; title: string; detail: string; href: string }
  | { kind: "project"; id: string; title: string; detail: string; href: string }
  | { kind: "project-group"; id: string; title: string; detail: string; href: string }
  | { kind: "project-output"; id: string; title: string; detail: string; href: string }
  | { kind: "action"; id: string; title: string; detail: string; href: string };

type DiscoveryFile = ProjectFile & { projectId: string };

type DiscoveryInput = {
  clients: readonly Pick<RelayClient, "id" | "name" | "archived">[];
  projects: readonly ProjectRecord[];
  groups: readonly Pick<ProjectGroup, "id" | "name" | "clientId" | "archived">[];
  outputs: readonly ProjectOutput[];
  files: readonly DiscoveryFile[];
  calendarFeedUrl: string | null;
};

function includesQuery(values: readonly string[], query: string) {
  return values.some((value) => value.toLocaleLowerCase().includes(query));
}

export function createWorkspaceDiscoveryController(input: DiscoveryInput) {
  const clients = input.clients.filter(({ archived }) => !archived);
  const clientNames = new Map(clients.map(({ id, name }) => [id, name]));
  const projects = input.projects.filter(({ archived, clientId }) => !archived && clientNames.has(clientId));
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const outputs = input.outputs.filter(({ archived, projectId }) => !archived && projectById.has(projectId));

  const calendarEvents = buildWorkspaceCalendarEvents({ projects, outputs });

  const storedFiles: WorkspaceFileRow[] = input.files.flatMap((file) => {
    const project = projectById.get(file.projectId);
    if (file.archived || !project) return [];
    return [{ kind: "stored-file", id: file.id, title: file.title, detail: `${file.fileName} · ${file.size.toLocaleString("en-US")} bytes`, projectName: project.name, ownerUrl: `/relay/projects/${project.id}#files`, openUrl: file.accessUrl }];
  });
  const mediaVersions: WorkspaceFileRow[] = outputs.flatMap((output) => {
    const project = projectById.get(output.projectId);
    if (!project) return [];
    return output.versions.map((version) => ({ kind: "media-version" as const, id: version.id, title: `${output.name} v${version.number}`, detail: `${version.source.provider === "link" ? "External link" : version.source.provider[0].toUpperCase() + version.source.provider.slice(1)} · added ${version.addedAt.slice(0, 10)}`, projectName: project.name, ownerUrl: `/relay/projects/${project.id}#outputs`, openUrl: version.source.url }));
  });
  const files = [...storedFiles, ...mediaVersions].sort((left, right) => left.title.localeCompare(right.title));

  const recordResults: WorkspaceSearchResult[] = [
    ...clients.map((client) => ({ kind: "client" as const, id: client.id, title: client.name, detail: "Client", href: `/relay/clients?client=${encodeURIComponent(client.id)}` })),
    ...projects.map((project) => ({ kind: "project" as const, id: project.id, title: project.name, detail: `${clientNames.get(project.clientId)} · ${project.stage}`, href: `/relay/projects/${project.id}` })),
    ...input.groups.filter(({ archived, clientId }) => !archived && clientNames.has(clientId)).map((group) => ({ kind: "project-group" as const, id: group.id, title: group.name, detail: `${clientNames.get(group.clientId)} · Project Group`, href: `/relay/clients?client=${encodeURIComponent(group.clientId)}` })),
    ...outputs.map((output) => ({ kind: "project-output" as const, id: output.id, title: output.name, detail: `${projectById.get(output.projectId)?.name} · Project Output`, href: `/relay/projects/${output.projectId}#outputs` })),
  ];
  const actionResults: WorkspaceSearchResult[] = [
    { kind: "action", id: "new-project", title: "New Project", detail: "Create work", href: "/relay/projects?new=true" },
    { kind: "action", id: "open-calendar", title: "Open Calendar", detail: "View dates", href: "/relay/calendar" },
    { kind: "action", id: "open-files", title: "Open Files", detail: "Find material", href: "/relay/files" },
    { kind: "action", id: "open-reports", title: "Open Reports", detail: "Review work and money", href: "/relay/reports" },
  ];

  return {
    model: { calendar: { events: calendarEvents, feedUrl: input.calendarFeedUrl }, files },
    actions: {
      searchFiles(query: string) {
        const normalized = query.trim().toLocaleLowerCase();
        return normalized ? files.filter((file) => includesQuery([file.title, file.detail, file.projectName], normalized)) : files;
      },
      search(query: string) {
        const normalized = query.trim().toLocaleLowerCase();
        if (!normalized) return actionResults;
        return [...recordResults, ...actionResults].filter((result) => includesQuery([result.title, result.detail], normalized));
      },
    },
  };
}

export type WorkspaceDiscoveryController = ReturnType<typeof createWorkspaceDiscoveryController>;
