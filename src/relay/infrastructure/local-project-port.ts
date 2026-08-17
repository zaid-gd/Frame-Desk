import { copyProjectSetup } from "../domain/workflow-template";
import type { NewProjectInput, ProjectChoice, ProjectGroup, ProjectRecord, ProjectTemplate } from "../domain/project";
import type { ProjectPort } from "../ports/project-port";
import { deriveProjectGroupTotals } from "../domain/project-group";
import { readLocalWorkspaceState, RELAY_LOCAL_WORKSPACE_KEY, type LocalWorkspaceState } from "./local-workspace-state";

function projectRecords(state: LocalWorkspaceState | null): ProjectRecord[] {
  return (state?.projects ?? []).flatMap((project) => project.workflowSetup && project.financialType
    ? [{ id: project.id, name: project.name, clientId: project.clientId, ...(project.projectGroupId ? { projectGroupId: project.projectGroupId } : {}), stage: project.stage, dueDate: project.due, financialType: project.financialType, lead: project.lead ?? "Unassigned", assignees: project.assignees ?? [], progress: Number.parseFloat(project.progress) || 0, money: project.outstandingAmount ?? 0, workflowSetup: project.workflowSetup }]
    : []);
}

export function createLocalProjectPort({ storage, clients, templates }: { storage: Pick<Storage, "getItem" | "setItem">; clients: readonly ProjectChoice[]; templates: readonly ProjectTemplate[] }): ProjectPort {
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
    async createProject(input: NewProjectInput) {
      const current = state();
      const client = clients.find((row) => row.id === input.clientId && !row.archived);
      const group = input.projectGroupId ? current.projectGroups?.find((row) => row.id === input.projectGroupId && !row.archived) : undefined;
      const template = templates.find((row) => row.id === input.templateId && !row.archived);
      if (!client || !template || (input.projectGroupId && (!group || group.clientId !== input.clientId))) return { ok: false, error: { kind: "invalid", message: "Choose active Project setup options." } };
      const workflowSetup = copyProjectSetup(template);
      const id = `project_${crypto.randomUUID()}`;
      const project = { id, name: input.name.trim(), clientId: input.clientId, stage: workflowSetup.stages[0].label, tone: "planned" as const, due: input.dueDate, progress: "0%", status: "active" as const, ...(input.projectGroupId ? { projectGroupId: input.projectGroupId, projectGroupName: group!.name } : {}), workflowTemplateId: template.id, workflowStageId: workflowSetup.stages[0].id, workflowSetup, financialType: input.financialType, lead: "Unassigned", assignees: [] };
      try { save({ ...current, projects: [...current.projects, project] }); return { ok: true, value: { id } }; }
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
  };
}
