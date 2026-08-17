import { copyProjectSetup } from "../domain/workflow-template";
import { projectStageTransition, type NewProjectInput, type ProjectChoice, type ProjectGroup, type ProjectRecord, type ProjectTemplate } from "../domain/project";
import type { ProjectPort } from "../ports/project-port";
import { deriveProjectGroupTotals } from "../domain/project-group";
import { addMediaVersion, projectOutputNameError, type ProjectOutput } from "../domain/project-output";
import type { ProjectOutputPort } from "../ports/project-output-port";

export function createMemoryProjectPort({ clients = [], groups = [], templates = [], projects = [], outputs = [], selectedProjectId = projects[0]?.id ?? "", now = () => new Date().toISOString() }: { clients?: readonly ProjectChoice[]; groups?: readonly Omit<ProjectGroup, "projectCount" | "progress" | "money">[]; templates?: readonly ProjectTemplate[]; projects?: readonly ProjectRecord[]; outputs?: readonly ProjectOutput[]; selectedProjectId?: string; now?: () => string } = {}): ProjectPort & ProjectOutputPort {
  const savedGroups: ProjectGroup[] = groups.map((group) => ({ ...group, projectCount: 0, progress: 0, money: 0 }));
  const savedProjects = [...projects];
  const savedOutputs = structuredClone([...outputs]);
  return {
    loadClients: () => clients,
    loadGroups: () => savedGroups.map((group) => {
      return { ...group, ...deriveProjectGroupTotals(savedProjects, group.id) };
    }),
    loadTemplates: () => templates,
    loadProjects: () => savedProjects,
    projectId: selectedProjectId,
    outputState: () => ({ kind: "ready" }),
    loadOutputs: () => savedOutputs.filter((output) => output.projectId === selectedProjectId),
    async createProject(input: NewProjectInput) {
      const template = templates.find(({ id }) => id === input.templateId);
      const client = clients.find(({ id, archived }) => id === input.clientId && !archived);
      const group = input.projectGroupId ? savedGroups.find(({ id, archived }) => id === input.projectGroupId && !archived) : undefined;
      if (!client || !template || template.archived || (input.projectGroupId && (!group || group.clientId !== input.clientId))) return { ok: false, error: { kind: "invalid", message: "Choose active Project setup options." } };
      const setup = copyProjectSetup(template);
      const id = `project_${crypto.randomUUID()}`;
      savedProjects.push({ id, name: input.name.trim(), clientId: input.clientId, ...(input.projectGroupId ? { projectGroupId: input.projectGroupId } : {}), stage: setup.stages[0].label, workflowStageId: setup.stages[0].id, dueDate: input.dueDate, financialType: input.financialType, paymentState: input.financialType === "nonBillable" ? "not-applicable" : "unpaid", archived: false, lead: "Unassigned", assignees: [], progress: 0, money: 0, workflowSetup: setup });
      savedOutputs.push(...setup.starterOutputs.map((starter) => ({
        id: `output_${crypto.randomUUID()}`,
        projectId: id,
        name: starter.name,
        reviewState: "draft" as const,
        archived: false,
        relativeDeadlineDays: starter.relativeDeadlineDays,
        ...(starter.roleId ? { roleId: starter.roleId } : {}),
        versions: [],
      })));
      return { ok: true, value: { id } };
    },
    async createGroup(input) { const id = `group_${crypto.randomUUID()}`; savedGroups.push({ id, archived: false, projectCount: 0, progress: 0, money: 0, ...input }); return { ok: true, value: { id } }; },
    async editGroup(id, input) { const index = savedGroups.findIndex((group) => group.id === id); if (index < 0) return { ok: false, error: { kind: "unavailable", message: "Project Group not found." } }; savedGroups[index] = { ...savedGroups[index], ...input }; return { ok: true, value: undefined }; },
    async setGroupArchived(id, archived) { const group = savedGroups.find((row) => row.id === id); if (!group) return { ok: false, error: { kind: "unavailable", message: "Project Group not found." } }; group.archived = archived; return { ok: true, value: undefined }; },
    async setProjectArchived(id, archived) { const project = savedProjects.find((row) => row.id === id); if (!project) return { ok: false, error: { kind: "unavailable", message: "Project not found." } }; project.archived = archived; return { ok: true, value: undefined }; },
    async moveProjectStage(id, targetStageId, confirmed) {
      const index = savedProjects.findIndex((row) => row.id === id);
      if (index < 0) return { ok: false, error: { kind: "unavailable", message: "Project not found." } };
      const transition = projectStageTransition(savedProjects[index], targetStageId, now(), confirmed);
      if (!transition) return { ok: false, error: { kind: "invalid", message: "Choose a stage from this Project's workflow." } };
      if (transition.kind === "confirmation-required") return { ok: false, error: { kind: "invalid", message: "Confirm delivery before moving this Project to Delivered." } };
      savedProjects[index] = transition.project;
      return { ok: true, value: { projectName: transition.project.name, stage: transition.project.stage, effect: transition.effect } };
    },
    async addOutput(input) {
      const nameError = projectOutputNameError(input.name);
      if (nameError) return { ok: false, error: { kind: "invalid", message: nameError } };
      if (!savedProjects.some(({ id }) => id === selectedProjectId)) return { ok: false, error: { kind: "unavailable", message: "Project not found." } };
      const id = `output_${crypto.randomUUID()}`;
      savedOutputs.push({ id, projectId: selectedProjectId, name: input.name.trim(), reviewState: "draft", archived: false, versions: [] });
      return { ok: true, value: { id } };
    },
    async editOutput(id, input) { const nameError = projectOutputNameError(input.name); if (nameError) return { ok: false, error: { kind: "invalid", message: nameError } }; const output = savedOutputs.find((row) => row.id === id); if (!output) return { ok: false, error: { kind: "unavailable", message: "Project Output not found." } }; output.name = input.name.trim(); return { ok: true, value: undefined }; },
    async setOutputArchived(id, archived) { const output = savedOutputs.find((row) => row.id === id); if (!output) return { ok: false, error: { kind: "unavailable", message: "Project Output not found." } }; output.archived = archived; return { ok: true, value: undefined }; },
    async setOutputReviewState(id, reviewState) { const output = savedOutputs.find((row) => row.id === id); if (!output) return { ok: false, error: { kind: "unavailable", message: "Project Output not found." } }; output.reviewState = reviewState; return { ok: true, value: undefined }; },
    async addMediaVersion(outputId, input) {
      const index = savedOutputs.findIndex(({ id }) => id === outputId);
      if (index < 0) return { ok: false, error: { kind: "unavailable", message: "Project Output not found." } };
      const id = `version_${crypto.randomUUID()}`;
      const next = addMediaVersion(savedOutputs[index], { id, url: input.url, addedAt: now() });
      if (!next) return { ok: false, error: { kind: "invalid", message: "Enter a valid HTTP, HTTPS, YouTube, or Vimeo URL." } };
      savedOutputs[index] = next;
      return { ok: true, value: { id } };
    },
    async deleteProject(id) { const index = savedProjects.findIndex((row) => row.id === id); if (index < 0) return { ok: false, error: { kind: "unavailable", message: "Project not found." } }; savedProjects.splice(index, 1); for (let outputIndex = savedOutputs.length - 1; outputIndex >= 0; outputIndex -= 1) if (savedOutputs[outputIndex].projectId === id) savedOutputs.splice(outputIndex, 1); return { ok: true, value: undefined }; },
  };
}
