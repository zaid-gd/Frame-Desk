"use client";

import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import type { NewProjectInput, ProjectChoice, ProjectGroup, ProjectGroupInput, ProjectRecord, ProjectStageEffect, ProjectTemplate } from "../domain/project";
import type { ProjectPort } from "../ports/project-port";
import type { OutputReviewState, ProjectOutput } from "../domain/project-output";
import type { ProjectOutputPort } from "../ports/project-output-port";

const refs = {
  groups: makeFunctionReference<"query", { includeArchived?: boolean }, ProjectGroup[]>("relayProjects:listGroups"),
  projects: makeFunctionReference<"query", Record<string, never>, Array<Omit<ProjectRecord, "progress" | "money" | "paymentState" | "archived"> & { progress: string; outstandingAmount?: number; status?: "active" | "past" }>>("relayProjects:listProjects"),
  outputs: makeFunctionReference<"query", { projectId: string }, ProjectOutput[]>("relayProjectOutputs:listOutputs"),
  createProject: makeFunctionReference<"mutation", NewProjectInput, { id: string }>("relayProjects:createProject"),
  createGroup: makeFunctionReference<"mutation", ProjectGroupInput, { id: string }>("relayProjects:createGroup"),
  editGroup: makeFunctionReference<"mutation", ProjectGroupInput & { id: string }, null>("relayProjects:editGroup"),
  archiveGroup: makeFunctionReference<"mutation", { id: string; archived: boolean }, null>("relayProjects:setGroupArchived"),
  archiveProject: makeFunctionReference<"mutation", { id: string; archived: boolean }, null>("relayProjects:setProjectArchived"),
  moveProjectStage: makeFunctionReference<"mutation", { id: string; targetStageId: string; confirmed: boolean }, { projectName: string; stage: string; effect: ProjectStageEffect }>("relayProjects:moveProjectStage"),
  addOutput: makeFunctionReference<"mutation", { projectId: string; name: string }, { id: string }>("relayProjectOutputs:addOutput"),
  editOutput: makeFunctionReference<"mutation", { id: string; name: string }, null>("relayProjectOutputs:editOutput"),
  setOutputArchived: makeFunctionReference<"mutation", { id: string; archived: boolean }, null>("relayProjectOutputs:setOutputArchived"),
  setOutputReviewState: makeFunctionReference<"mutation", { id: string; reviewState: OutputReviewState }, null>("relayProjectOutputs:setOutputReviewState"),
  addMediaVersion: makeFunctionReference<"mutation", { outputId: string; url: string }, { id: string }>("relayProjectOutputs:addMediaVersion"),
  deleteProject: makeFunctionReference<"mutation", { id: string }, null>("relayProjects:deleteProject"),
};

function cloudWriteError(error: unknown, fallback: string) {
  const data = error && typeof error === "object" && "data" in error ? error.data : null;
  if (data && typeof data === "object" && "kind" in data && "message" in data
    && ["unauthorized", "forbidden", "not-found", "invalid", "unavailable"].includes(String(data.kind)) && typeof data.message === "string") {
    return { ok: false as const, error: { kind: data.kind as "unauthorized" | "forbidden" | "not-found" | "invalid" | "unavailable", message: data.message } };
  }
  return { ok: false as const, error: { kind: "transport" as const, message: error instanceof Error ? error.message : fallback } };
}

export function useCloudProjectPort(enabled: boolean, clients: readonly ProjectChoice[], templates: readonly ProjectTemplate[], selectedProjectId?: string): ProjectPort & ProjectOutputPort {
  const groups = useQuery(refs.groups, enabled ? { includeArchived: true } : "skip");
  const projects = useQuery(refs.projects, enabled ? {} : "skip");
  const selectedOutputs = useQuery(refs.outputs, enabled && selectedProjectId ? { projectId: selectedProjectId } : "skip");
  const createProject = useMutation(refs.createProject);
  const createGroup = useMutation(refs.createGroup);
  const editGroup = useMutation(refs.editGroup);
  const archiveGroup = useMutation(refs.archiveGroup);
  const archiveProject = useMutation(refs.archiveProject);
  const moveProjectStage = useMutation(refs.moveProjectStage);
  const addOutput = useMutation(refs.addOutput);
  const editOutput = useMutation(refs.editOutput);
  const setOutputArchived = useMutation(refs.setOutputArchived);
  const setOutputReviewState = useMutation(refs.setOutputReviewState);
  const addMediaVersion = useMutation(refs.addMediaVersion);
  const deleteProject = useMutation(refs.deleteProject);
  return useMemo(() => ({
    projectId: selectedProjectId ?? "",
    projectState: () => ({ kind: projects === undefined ? "loading" as const : "ready" as const }),
    loadClients: () => clients,
    loadTemplates: () => templates,
    loadGroups: () => groups ?? [],
    loadProjects: () => (projects ?? []).map((project) => ({ ...project, progress: Number.parseFloat(project.progress) || 0, money: project.outstandingAmount ?? 0, archived: project.status === "past", paymentState: project.financialType === "nonBillable" ? "not-applicable" as const : (project.outstandingAmount ?? 0) > 0 ? "unpaid" as const : "paid" as const })),
    outputState: () => selectedProjectId && selectedOutputs === undefined ? { kind: "loading" as const } : { kind: "ready" as const },
    loadOutputs: () => selectedOutputs ?? [],
    async createProject(input) { try { return { ok: true as const, value: await createProject(input) }; } catch (error) { return { ok: false as const, error: { kind: "invalid" as const, message: error instanceof Error ? error.message : "Project could not be created." } }; } },
    async createGroup(input) { try { return { ok: true as const, value: await createGroup(input) }; } catch (error) { return { ok: false as const, error: { kind: "invalid" as const, message: error instanceof Error ? error.message : "Project Group could not be created." } }; } },
    async editGroup(id, input) { try { await editGroup({ id, ...input }); return { ok: true as const, value: undefined }; } catch (error) { return { ok: false as const, error: { kind: "invalid" as const, message: error instanceof Error ? error.message : "Project Group could not be saved." } }; } },
    async setGroupArchived(id, archived) { try { await archiveGroup({ id, archived }); return { ok: true as const, value: undefined }; } catch (error) { return { ok: false as const, error: { kind: "invalid" as const, message: error instanceof Error ? error.message : "Project Group could not be archived." } }; } },
    async setProjectArchived(id, archived) { try { await archiveProject({ id, archived }); return { ok: true as const, value: undefined }; } catch (error) { return { ok: false as const, error: { kind: "invalid" as const, message: error instanceof Error ? error.message : "Project could not be archived." } }; } },
    async moveProjectStage(id, targetStageId, confirmed) { try { return { ok: true as const, value: await moveProjectStage({ id, targetStageId, confirmed }) }; } catch (error) { return { ok: false as const, error: { kind: "invalid" as const, message: error instanceof Error ? error.message : "Project stage could not be changed." } }; } },
    async addOutput(input) { try { return { ok: true as const, value: await addOutput({ projectId: selectedProjectId ?? "", ...input }) }; } catch (error) { return cloudWriteError(error, "Project Output could not be added."); } },
    async editOutput(id, input) { try { await editOutput({ id, ...input }); return { ok: true as const, value: undefined }; } catch (error) { return cloudWriteError(error, "Project Output could not be saved."); } },
    async setOutputArchived(id, archived) { try { await setOutputArchived({ id, archived }); return { ok: true as const, value: undefined }; } catch (error) { return cloudWriteError(error, "Project Output could not be archived."); } },
    async setOutputReviewState(id, reviewState) { try { await setOutputReviewState({ id, reviewState }); return { ok: true as const, value: undefined }; } catch (error) { return cloudWriteError(error, "Project Output review state could not be saved."); } },
    async addMediaVersion(outputId, input) { try { return { ok: true as const, value: await addMediaVersion({ outputId, ...input }) }; } catch (error) { return cloudWriteError(error, "Media Version could not be added."); } },
    async deleteProject(id) { try { await deleteProject({ id }); return { ok: true as const, value: undefined }; } catch (error) { return { ok: false as const, error: { kind: "invalid" as const, message: error instanceof Error ? error.message : "Project could not be deleted." } }; } },
  }), [addMediaVersion, addOutput, archiveGroup, archiveProject, clients, createGroup, createProject, deleteProject, editGroup, editOutput, groups, moveProjectStage, projects, selectedOutputs, selectedProjectId, setOutputArchived, setOutputReviewState, templates]);
}
