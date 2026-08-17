import { newProjectSchema, type NewProjectInput, type ProjectGroupInput } from "../domain/project";
import type { ProjectPort, ProjectWriteResult } from "../ports/project-port";

function message<T>(result: ProjectWriteResult<T>, success: string) {
  return result.ok ? { ok: true as const, message: success } : { ok: false as const, kind: result.error.kind, message: result.error.message };
}

export function createProjectController({ port, canManage = true }: { port: ProjectPort; canManage?: boolean }) {
  return {
    model: {
      canManage,
      clients: port.loadClients().filter(({ archived }) => !archived).map(({ id: value, name: label }) => ({ value, label })),
      templates: port.loadTemplates().filter(({ archived }) => !archived).map(({ id: value, name: label }) => ({ value, label })),
      groups: port.loadGroups(),
      projects: port.loadProjects(),
    },
    actions: {
      groupOptions(clientId: string) { return port.loadGroups().filter((group) => !group.archived && group.clientId === clientId).map(({ id: value, name: label }) => ({ value, label })); },
      inspectProject(id: string) { return port.loadProjects().find((project) => project.id === id) ?? null; },
      async create(input: NewProjectInput) {
        const parsed = newProjectSchema.safeParse(input);
        if (!parsed.success) return { ok: false as const, kind: "invalid" as const, message: parsed.error.issues[0].message };
        const result = await port.createProject(parsed.data);
        return result.ok ? { ok: true as const, message: "Project created.", url: `/relay/projects/${result.value.id}` } : { ok: false as const, kind: result.error.kind, message: result.error.message };
      },
      async createGroup(input: ProjectGroupInput) { return message(await port.createGroup(input), "Project Group created."); },
      async editGroup(id: string, input: ProjectGroupInput) { return message(await port.editGroup(id, input), "Project Group saved."); },
      async setGroupArchived(id: string, archived: boolean) { return message(await port.setGroupArchived(id, archived), archived ? "Project Group archived." : "Project Group restored."); },
    },
  };
}

export type ProjectController = ReturnType<typeof createProjectController>;
