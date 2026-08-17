"use client";

import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import type { NewProjectInput, ProjectChoice, ProjectGroup, ProjectGroupInput, ProjectRecord, ProjectTemplate } from "../domain/project";
import type { ProjectPort } from "../ports/project-port";

const refs = {
  groups: makeFunctionReference<"query", { includeArchived?: boolean }, ProjectGroup[]>("relayProjects:listGroups"),
  projects: makeFunctionReference<"query", Record<string, never>, Array<Omit<ProjectRecord, "progress" | "money"> & { progress: string; outstandingAmount?: number }>>("relayProjects:listProjects"),
  createProject: makeFunctionReference<"mutation", NewProjectInput, { id: string }>("relayProjects:createProject"),
  createGroup: makeFunctionReference<"mutation", ProjectGroupInput, { id: string }>("relayProjects:createGroup"),
  editGroup: makeFunctionReference<"mutation", ProjectGroupInput & { id: string }, null>("relayProjects:editGroup"),
  archiveGroup: makeFunctionReference<"mutation", { id: string; archived: boolean }, null>("relayProjects:setGroupArchived"),
};

export function useCloudProjectPort(enabled: boolean, clients: readonly ProjectChoice[], templates: readonly ProjectTemplate[]): ProjectPort {
  const groups = useQuery(refs.groups, enabled ? { includeArchived: true } : "skip");
  const projects = useQuery(refs.projects, enabled ? {} : "skip");
  const createProject = useMutation(refs.createProject);
  const createGroup = useMutation(refs.createGroup);
  const editGroup = useMutation(refs.editGroup);
  const archiveGroup = useMutation(refs.archiveGroup);
  return useMemo(() => ({
    loadClients: () => clients,
    loadTemplates: () => templates,
    loadGroups: () => groups ?? [],
    loadProjects: () => (projects ?? []).map((project) => ({ ...project, progress: Number.parseFloat(project.progress) || 0, money: project.outstandingAmount ?? 0 })),
    async createProject(input) { try { return { ok: true as const, value: await createProject(input) }; } catch (error) { return { ok: false as const, error: { kind: "invalid" as const, message: error instanceof Error ? error.message : "Project could not be created." } }; } },
    async createGroup(input) { try { return { ok: true as const, value: await createGroup(input) }; } catch (error) { return { ok: false as const, error: { kind: "invalid" as const, message: error instanceof Error ? error.message : "Project Group could not be created." } }; } },
    async editGroup(id, input) { try { await editGroup({ id, ...input }); return { ok: true as const, value: undefined }; } catch (error) { return { ok: false as const, error: { kind: "invalid" as const, message: error instanceof Error ? error.message : "Project Group could not be saved." } }; } },
    async setGroupArchived(id, archived) { try { await archiveGroup({ id, archived }); return { ok: true as const, value: undefined }; } catch (error) { return { ok: false as const, error: { kind: "invalid" as const, message: error instanceof Error ? error.message : "Project Group could not be archived." } }; } },
  }), [archiveGroup, clients, createGroup, createProject, editGroup, groups, projects, templates]);
}
