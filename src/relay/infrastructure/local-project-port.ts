import { copyProjectSetup } from "../domain/workflow-template";
import { projectStageTransition, type NewProjectInput, type ProjectChoice, type ProjectGroup, type ProjectRecord, type ProjectTemplate } from "../domain/project";
import type { ProjectPort } from "../ports/project-port";
import { deriveProjectGroupTotals } from "../domain/project-group";
import { readLocalWorkspaceState, RELAY_LOCAL_WORKSPACE_KEY, type LocalWorkspaceState } from "./local-workspace-state";
import { addMediaVersion, projectOutputNameError } from "../domain/project-output";
import type { ProjectOutputPort } from "../ports/project-output-port";

function projectRecords(state: LocalWorkspaceState | null): ProjectRecord[] {
  return (state?.projects ?? []).flatMap((project) => project.workflowSetup && project.financialType
    ? [{ id: project.id, name: project.name, clientId: project.clientId, ...(project.projectGroupId ? { projectGroupId: project.projectGroupId } : {}), stage: project.stage, workflowStageId: project.workflowStageId, dueDate: project.due, financialType: project.financialType, paymentState: project.financialType === "nonBillable" ? "not-applicable" : (project.outstandingAmount ?? 0) > 0 ? "unpaid" : "paid", archived: project.status === "past", lead: project.lead ?? "Unassigned", assignees: project.assignees ?? [], progress: Number.parseFloat(project.progress) || 0, money: project.outstandingAmount ?? 0, workflowSetup: project.workflowSetup, completedAt: project.completedAt }]
    : []);
}

export function createLocalProjectPort({ storage, clients, templates, selectedProjectId = "" }: { storage: Pick<Storage, "getItem" | "setItem">; clients: readonly ProjectChoice[]; templates: readonly ProjectTemplate[]; selectedProjectId?: string }): ProjectPort & ProjectOutputPort {
  const state = () => readLocalWorkspaceState(storage) ?? { clients: [], projects: [] };
  const save = (next: LocalWorkspaceState) => storage.setItem(RELAY_LOCAL_WORKSPACE_KEY, JSON.stringify(next));
  return {
    loadClients: () => clients,
    loadTemplates: () => templates,
    loadGroups: () => {
      const current = state();
      const projects = projectRecords(current);
      return (current.projectGroups ?? []).map((group) => {
        return { ...group, ...deriveProjectGroupTotals(projects, group.id) };
      });
    },
    loadProjects: () => projectRecords(state()),
    projectId: selectedProjectId,
    outputState: () => ({ kind: "ready" }),
    loadOutputs: () => (state().projectOutputs ?? []).filter((output) => output.projectId === selectedProjectId),
    async createProject(input: NewProjectInput) {
      const current = state();
      const client = clients.find((row) => row.id === input.clientId && !row.archived);
      const group = input.projectGroupId ? current.projectGroups?.find((row) => row.id === input.projectGroupId && !row.archived) : undefined;
      const template = templates.find((row) => row.id === input.templateId && !row.archived);
      if (!client || !template || (input.projectGroupId && (!group || group.clientId !== input.clientId))) return { ok: false, error: { kind: "invalid", message: "Choose active Project setup options." } };
      const workflowSetup = copyProjectSetup(template);
      const id = `project_${crypto.randomUUID()}`;
      const project = { id, name: input.name.trim(), clientId: input.clientId, stage: workflowSetup.stages[0].label, tone: "planned" as const, due: input.dueDate, progress: "0%", status: "active" as const, ...(input.projectGroupId ? { projectGroupId: input.projectGroupId, projectGroupName: group!.name } : {}), workflowTemplateId: template.id, workflowStageId: workflowSetup.stages[0].id, workflowSetup, financialType: input.financialType, lead: "Unassigned", assignees: [] };
      const projectOutputs = workflowSetup.starterOutputs.map((starter) => ({
        id: `output_${crypto.randomUUID()}`,
        projectId: id,
        name: starter.name,
        reviewState: "draft" as const,
        archived: false,
        relativeDeadlineDays: starter.relativeDeadlineDays,
        ...(starter.roleId ? { roleId: starter.roleId } : {}),
        versions: [],
      }));
      try { save({ ...current, projects: [...current.projects, project], projectOutputs: [...(current.projectOutputs ?? []), ...projectOutputs] }); return { ok: true, value: { id } }; }
      catch { return { ok: false, error: { kind: "unavailable", message: "Browser storage refused the Project write." } }; }
    },
    async createGroup(input) {
      const current = state();
      if (!clients.some((client) => client.id === input.clientId && !client.archived)) return { ok: false, error: { kind: "invalid", message: "Choose an active Client." } };
      const id = `group_${crypto.randomUUID()}`;
      const group: ProjectGroup = { id, archived: false, projectCount: 0, progress: 0, money: 0, ...input };
      try { save({ ...current, projectGroups: [...(current.projectGroups ?? []), group] }); return { ok: true, value: { id } }; }
      catch { return { ok: false, error: { kind: "unavailable", message: "Browser storage refused the Project Group write." } }; }
    },
    async editGroup(id, input) {
      const current = state();
      const groups = current.projectGroups ?? [];
      const group = groups.find((row) => row.id === id);
      if (!group) return { ok: false, error: { kind: "unavailable", message: "Project Group not found." } };
      if (current.projects.some((project) => project.projectGroupId === id && project.clientId !== input.clientId)) return { ok: false, error: { kind: "invalid", message: "Move this Project Group's Projects before changing its Client." } };
      try { save({ ...current, projectGroups: groups.map((row) => row.id === id ? { ...row, ...input } : row) }); return { ok: true, value: undefined }; }
      catch { return { ok: false, error: { kind: "unavailable", message: "Browser storage refused the Project Group write." } }; }
    },
    async setGroupArchived(id, archived) {
      const current = state();
      if (!(current.projectGroups ?? []).some((row) => row.id === id)) return { ok: false, error: { kind: "unavailable", message: "Project Group not found." } };
      try { save({ ...current, projectGroups: (current.projectGroups ?? []).map((row) => row.id === id ? { ...row, archived } : row) }); return { ok: true, value: undefined }; }
      catch { return { ok: false, error: { kind: "unavailable", message: "Browser storage refused the Project Group write." } }; }
    },
    async setProjectArchived(id, archived) {
      const current = state();
      if (!current.projects.some((row) => row.id === id)) return { ok: false, error: { kind: "unavailable", message: "Project not found." } };
      try { save({ ...current, projects: current.projects.map((row) => row.id === id ? { ...row, status: archived ? "past" : "active" } : row) }); return { ok: true, value: undefined }; }
      catch { return { ok: false, error: { kind: "unavailable", message: "Browser storage refused the Project write." } }; }
    },
    async moveProjectStage(id, targetStageId, confirmed) {
      const current = state();
      const record = projectRecords(current).find((row) => row.id === id);
      if (!record) return { ok: false, error: { kind: "unavailable", message: "Project not found." } };
      const transition = projectStageTransition(record, targetStageId, new Date().toISOString(), confirmed);
      if (!transition) return { ok: false, error: { kind: "invalid", message: "Choose a stage from this Project's workflow." } };
      if (transition.kind === "confirmation-required") return { ok: false, error: { kind: "invalid", message: "Confirm delivery before moving this Project to Delivered." } };
      try {
        save({ ...current, projects: current.projects.map((project) => project.id === id ? { ...project, stage: transition.project.stage, workflowStageId: transition.project.workflowStageId, progress: `${transition.project.progress}%`, tone: transition.tone, completedAt: transition.project.completedAt } : project) });
        return { ok: true, value: { projectName: transition.project.name, stage: transition.project.stage, effect: transition.effect } };
      } catch { return { ok: false, error: { kind: "unavailable", message: "Browser storage refused the Project write." } }; }
    },
    async addOutput(input) {
      const nameError = projectOutputNameError(input.name);
      if (nameError) return { ok: false, error: { kind: "invalid", message: nameError } };
      const current = state();
      if (!current.projects.some(({ id }) => id === selectedProjectId)) return { ok: false, error: { kind: "unavailable", message: "Project not found." } };
      const id = `output_${crypto.randomUUID()}`;
      const output = { id, projectId: selectedProjectId, name: input.name.trim(), reviewState: "draft" as const, archived: false, versions: [] };
      try { save({ ...current, projectOutputs: [...(current.projectOutputs ?? []), output] }); return { ok: true, value: { id } }; }
      catch { return { ok: false, error: { kind: "unavailable", message: "Browser storage refused the Project Output write." } }; }
    },
    async editOutput(id, input) {
      const nameError = projectOutputNameError(input.name);
      if (nameError) return { ok: false, error: { kind: "invalid", message: nameError } };
      const current = state();
      if (!(current.projectOutputs ?? []).some((output) => output.id === id)) return { ok: false, error: { kind: "unavailable", message: "Project Output not found." } };
      try { save({ ...current, projectOutputs: (current.projectOutputs ?? []).map((output) => output.id === id ? { ...output, name: input.name.trim() } : output) }); return { ok: true, value: undefined }; }
      catch { return { ok: false, error: { kind: "unavailable", message: "Browser storage refused the Project Output write." } }; }
    },
    async setOutputArchived(id, archived) {
      const current = state();
      if (!(current.projectOutputs ?? []).some((output) => output.id === id)) return { ok: false, error: { kind: "unavailable", message: "Project Output not found." } };
      try { save({ ...current, projectOutputs: (current.projectOutputs ?? []).map((output) => output.id === id ? { ...output, archived } : output) }); return { ok: true, value: undefined }; }
      catch { return { ok: false, error: { kind: "unavailable", message: "Browser storage refused the Project Output write." } }; }
    },
    async setOutputReviewState(id, reviewState) {
      const current = state();
      if (!(current.projectOutputs ?? []).some((output) => output.id === id)) return { ok: false, error: { kind: "unavailable", message: "Project Output not found." } };
      try { save({ ...current, projectOutputs: (current.projectOutputs ?? []).map((output) => output.id === id ? { ...output, reviewState } : output) }); return { ok: true, value: undefined }; }
      catch { return { ok: false, error: { kind: "unavailable", message: "Browser storage refused the Project Output write." } }; }
    },
    async addMediaVersion(outputId, input) {
      const current = state();
      const outputs = current.projectOutputs ?? [];
      const output = outputs.find(({ id }) => id === outputId);
      if (!output) return { ok: false, error: { kind: "unavailable", message: "Project Output not found." } };
      const id = `version_${crypto.randomUUID()}`;
      const next = addMediaVersion(output, { id, url: input.url, addedAt: new Date().toISOString() });
      if (!next) return { ok: false, error: { kind: "invalid", message: "Enter a valid HTTP, HTTPS, YouTube, or Vimeo URL." } };
      try { save({ ...current, projectOutputs: outputs.map((item) => item.id === outputId ? next : item) }); return { ok: true, value: { id } }; }
      catch { return { ok: false, error: { kind: "unavailable", message: "Browser storage refused the Media Version write." } }; }
    },
    async resolveComment(id) {
      const current = state();
      const outputs = current.projectOutputs ?? [];
      const output = outputs.find(({ versions }) => versions.some(({ comments }) => comments.some((comment) => comment.id === id)));
      const comment = output?.versions.flatMap(({ comments }) => comments).find((item) => item.id === id);
      if (!comment) return { ok: false, error: { kind: "unavailable", message: "Comment not found." } };
      comment.resolved = true;
      try { save({ ...current, projectOutputs: outputs }); return { ok: true, value: undefined }; }
      catch { return { ok: false, error: { kind: "unavailable", message: "Browser storage refused the Comment write." } }; }
    },
    async deleteProject(id) {
      const current = state();
      if (!current.projects.some((row) => row.id === id)) return { ok: false, error: { kind: "unavailable", message: "Project not found." } };
      try { save({ ...current, projects: current.projects.filter((row) => row.id !== id), projectOutputs: (current.projectOutputs ?? []).filter((output) => output.projectId !== id) }); return { ok: true, value: undefined }; }
      catch { return { ok: false, error: { kind: "unavailable", message: "Browser storage refused the Project write." } }; }
    },
  };
}
