import { copyProjectSetup } from "../domain/workflow-template";
import { projectStageTransition, type NewProjectInput, type ProjectChoice, type ProjectGroup, type ProjectRecord, type ProjectTemplate } from "../domain/project";
import type { ProjectPort } from "../ports/project-port";
import { deriveProjectGroupTotals } from "../domain/project-group";

export function createMemoryProjectPort({ clients = [], groups = [], templates = [], projects = [], now = () => new Date().toISOString() }: { clients?: readonly ProjectChoice[]; groups?: readonly Omit<ProjectGroup, "projectCount" | "progress" | "money">[]; templates?: readonly ProjectTemplate[]; projects?: readonly ProjectRecord[]; now?: () => string } = {}): ProjectPort {
  const savedGroups: ProjectGroup[] = groups.map((group) => ({ ...group, projectCount: 0, progress: 0, money: 0 }));
  const savedProjects = [...projects];
  return {
    loadClients: () => clients,
    loadGroups: () => savedGroups.map((group) => {
      return { ...group, ...deriveProjectGroupTotals(savedProjects, group.id) };
    }),
    loadTemplates: () => templates,
    loadProjects: () => savedProjects,
    async createProject(input: NewProjectInput) {
      const template = templates.find(({ id }) => id === input.templateId);
      const client = clients.find(({ id, archived }) => id === input.clientId && !archived);
      const group = input.projectGroupId ? savedGroups.find(({ id, archived }) => id === input.projectGroupId && !archived) : undefined;
      if (!client || !template || template.archived || (input.projectGroupId && (!group || group.clientId !== input.clientId))) return { ok: false, error: { kind: "invalid", message: "Choose active Project setup options." } };
      const setup = copyProjectSetup(template);
      const id = `project_${crypto.randomUUID()}`;
      savedProjects.push({ id, name: input.name.trim(), clientId: input.clientId, ...(input.projectGroupId ? { projectGroupId: input.projectGroupId } : {}), stage: setup.stages[0].label, workflowStageId: setup.stages[0].id, dueDate: input.dueDate, financialType: input.financialType, paymentState: input.financialType === "nonBillable" ? "not-applicable" : "unpaid", archived: false, lead: "Unassigned", assignees: [], progress: 0, money: 0, workflowSetup: setup });
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
    async deleteProject(id) { const index = savedProjects.findIndex((row) => row.id === id); if (index < 0) return { ok: false, error: { kind: "unavailable", message: "Project not found." } }; savedProjects.splice(index, 1); return { ok: true, value: undefined }; },
  };
}
