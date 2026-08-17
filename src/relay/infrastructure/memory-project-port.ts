import { copyProjectSetup } from "../domain/workflow-template";
import type { NewProjectInput, ProjectChoice, ProjectGroup, ProjectRecord, ProjectTemplate } from "../domain/project";
import type { ProjectPort } from "../ports/project-port";
import { deriveProjectGroupTotals } from "../domain/project-group";

export function createMemoryProjectPort({ clients = [], groups = [], templates = [], projects = [] }: { clients?: readonly ProjectChoice[]; groups?: readonly Omit<ProjectGroup, "projectCount" | "progress" | "money">[]; templates?: readonly ProjectTemplate[]; projects?: readonly ProjectRecord[] } = {}): ProjectPort {
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
      savedProjects.push({ id, name: input.name.trim(), clientId: input.clientId, ...(input.projectGroupId ? { projectGroupId: input.projectGroupId } : {}), stage: setup.stages[0].label, dueDate: input.dueDate, financialType: input.financialType, lead: "Unassigned", assignees: [], progress: 0, money: 0, workflowSetup: setup });
      return { ok: true, value: { id } };
    },
    async createGroup(input) { const id = `group_${crypto.randomUUID()}`; savedGroups.push({ id, archived: false, projectCount: 0, progress: 0, money: 0, ...input }); return { ok: true, value: { id } }; },
    async editGroup(id, input) { const index = savedGroups.findIndex((group) => group.id === id); if (index < 0) return { ok: false, error: { kind: "unavailable", message: "Project Group not found." } }; savedGroups[index] = { ...savedGroups[index], ...input }; return { ok: true, value: undefined }; },
    async setGroupArchived(id, archived) { const group = savedGroups.find((row) => row.id === id); if (!group) return { ok: false, error: { kind: "unavailable", message: "Project Group not found." } }; group.archived = archived; return { ok: true, value: undefined }; },
  };
}
