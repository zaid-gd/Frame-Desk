"use client";

import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import type { NewProjectInput, ProjectChoice, ProjectGroup, ProjectGroupInput, ProjectRecord, ProjectStageEffect, ProjectTemplate } from "../domain/project";
import type { ProjectPort } from "../ports/project-port";

const refs = {
  groups: makeFunctionReference<"query", { includeArchived?: boolean }, ProjectGroup[]>("relayProjects:listGroups"),
  projects: makeFunctionReference<"query", Record<string, never>, Array<Omit<ProjectRecord, "progress" | "money" | "paymentState" | "archived"> & { progress: string; outstandingAmount?: number; status?: "active" | "past" }>>("relayProjects:listProjects"),
  createProject: makeFunctionReference<"mutation", NewProjectInput, { id: string }>("relayProjects:createProject"),
  createGroup: makeFunctionReference<"mutation", ProjectGroupInput, { id: string }>("relayProjects:createGroup"),
  editGroup: makeFunctionReference<"mutation", ProjectGroupInput & { id: string }, null>("relayProjects:editGroup"),
  archiveGroup: makeFunctionReference<"mutation", { id: string; archived: boolean }, null>("relayProjects:setGroupArchived"),
  archiveProject: makeFunctionReference<"mutation", { id: string; archived: boolean }, null>("relayProjects:setProjectArchived"),
  moveProjectStage: makeFunctionReference<"mutation", { id: string; targetStageId: string; confirmed: boolean }, { projectName: string; stage: string; effect: ProjectStageEffect }>("relayProjects:moveProjectStage"),
  deleteProject: makeFunctionReference<"mutation", { id: string }, null>("relayProjects:deleteProject"),
};

export function useCloudProjectPort(enabled: boolean, clients: readonly ProjectChoice[], templates: readonly ProjectTemplate[]): ProjectPort {
  const groups = useQuery(refs.groups, enabled ? { includeArchived: true } : "skip");
  const projects = useQuery(refs.projects, enabled ? {} : "skip");
  const createProject = useMutation(refs.createProject);
  const createGroup = useMutation(refs.createGroup);
  const editGroup = useMutation(refs.editGroup);
  const archiveGroup = useMutation(refs.archiveGroup);
  const archiveProject = useMutation(refs.archiveProject);
  const moveProjectStage = useMutation(refs.moveProjectStage);
  const deleteProject = useMutation(refs.deleteProject);
  return useMemo(() => ({
    projectState: () => ({ kind: projects === undefined ? "loading" as const : "ready" as const }),
    loadClients: () => clients,
    loadTemplates: () => templates,
    loadGroups: () => groups ?? [],
    loadProjects: () => (projects ?? []).map((project) => ({ ...project, progress: Number.parseFloat(project.progress) || 0, money: project.outstandingAmount ?? 0, archived: project.status === "past", paymentState: project.financialType === "nonBillable" ? "not-applicable" as const : (project.outstandingAmount ?? 0) > 0 ? "unpaid" as const : "paid" as const })),
    async createProject(input) { try { return { ok: true as const, value: await createProject(input) }; } catch (error) { return { ok: false as const, error: { kind: "invalid" as const, message: error instanceof Error ? error.message : "Project could not be created." } }; } },
    async createGroup(input) { try { return { ok: true as const, value: await createGroup(input) }; } catch (error) { return { ok: false as const, error: { kind: "invalid" as const, message: error instanceof Error ? error.message : "Project Group could not be created." } }; } },
    async editGroup(id, input) { try { await editGroup({ id, ...input }); return { ok: true as const, value: undefined }; } catch (error) { return { ok: false as const, error: { kind: "invalid" as const, message: error instanceof Error ? error.message : "Project Group could not be saved." } }; } },
    async setGroupArchived(id, archived) { try { await archiveGroup({ id, archived }); return { ok: true as const, value: undefined }; } catch (error) { return { ok: false as const, error: { kind: "invalid" as const, message: error instanceof Error ? error.message : "Project Group could not be archived." } }; } },
    async setProjectArchived(id, archived) { try { await archiveProject({ id, archived }); return { ok: true as const, value: undefined }; } catch (error) { return { ok: false as const, error: { kind: "invalid" as const, message: error instanceof Error ? error.message : "Project could not be archived." } }; } },
    async moveProjectStage(id, targetStageId, confirmed) { try { return { ok: true as const, value: await moveProjectStage({ id, targetStageId, confirmed }) }; } catch (error) { return { ok: false as const, error: { kind: "invalid" as const, message: error instanceof Error ? error.message : "Project stage could not be changed." } }; } },
    async deleteProject(id) { try { await deleteProject({ id }); return { ok: true as const, value: undefined }; } catch (error) { return { ok: false as const, error: { kind: "invalid" as const, message: error instanceof Error ? error.message : "Project could not be deleted." } }; } },
  }), [archiveGroup, archiveProject, clients, createGroup, createProject, deleteProject, editGroup, groups, moveProjectStage, projects, templates]);
}
