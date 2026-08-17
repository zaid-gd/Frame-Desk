import { newProjectSchema, type NewProjectInput, type ProjectGroupInput, type ProjectViewState } from "../domain/project";
import type { ProjectPort, ProjectWriteResult } from "../ports/project-port";

function message<T>(result: ProjectWriteResult<T>, success: string) {
  return result.ok ? { ok: true as const, message: success } : { ok: false as const, kind: result.error.kind, message: result.error.message };
}

type ProjectAccess = { role: "owner" | "editor" | "viewer"; memberId: string; editorsCanViewAll: boolean; team?: boolean };

export function createProjectController({ port, canManage = true, access = { role: "owner", memberId: "owner", editorsCanViewAll: true, team: false } }: { port: ProjectPort; canManage?: boolean; access?: ProjectAccess }) {
  const clientNames = new Map(port.loadClients().map((client) => [client.id, client.name]));
  const canSee = (project: ReturnType<ProjectPort["loadProjects"]>[number]) => access.role !== "editor" || access.editorsCanViewAll || project.assignees.includes(access.memberId) || project.lead === access.memberId;
  const previewStageMove = (id: string, targetStageId: string) => {
    const project = port.loadProjects().find((row) => row.id === id);
    const target = project?.workflowSetup.stages.find((stage) => stage.id === targetStageId);
    if (!project || !target) return { ok: false as const, kind: "invalid" as const, message: "Choose a stage from this Project's workflow." };
    if (target.purpose !== "delivered") return { ok: true as const, requiresConfirmation: false, message: `Move ${project.name} to ${target.label}.` };
    const effect = project.financialType === "projectValue"
      ? ` and earns ${project.money.toLocaleString("en-US")}`
      : project.financialType === "salaryPlan" ? " and adds one delivered Project to Salary Plan progress" : " with no earnings effect";
    return { ok: true as const, requiresConfirmation: true, message: `Delivering ${project.name} records the actual delivery time${effect}.` };
  };
  const table = (state: ProjectViewState) => {
    const needle = state.query?.trim().toLocaleLowerCase();
    const rows = port.loadProjects().filter(canSee).filter((project) =>
      (state.archived === "include" || !project.archived)
      && (!needle || project.name.toLocaleLowerCase().includes(needle) || (clientNames.get(project.clientId) ?? "").toLocaleLowerCase().includes(needle))
      && (!state.client || project.clientId === state.client)
      && (!state.stage || project.stage === state.stage)
      && (!state.payment || project.paymentState === state.payment)
      && (!state.salary || (state.salary === "salary") === (project.financialType === "salaryPlan")));
    const sort = state.sort ?? "due";
    const value = (project: typeof rows[number]) => sort === "client" ? clientNames.get(project.clientId) ?? "" : sort === "payment" ? project.paymentState : sort === "due" ? project.dueDate : project[sort];
    rows.sort((left, right) => String(value(left)).localeCompare(String(value(right))) * (state.direction === "desc" ? -1 : 1));
    return { rows: rows.map((project) => ({ ...project, clientName: clientNames.get(project.clientId) ?? "Unknown Client" })), showAssignees: access.team !== false || access.role !== "owner", view: state.view ?? "table" };
  };
  return {
    model: {
      canManage,
      clients: port.loadClients().filter(({ archived }) => !archived).map(({ id: value, name: label }) => ({ value, label })),
      templates: port.loadTemplates().filter(({ archived }) => !archived).map(({ id: value, name: label }) => ({ value, label })),
      groups: port.loadGroups(),
      projects: port.loadProjects(),
      projectState: port.projectState?.() ?? { kind: "ready" as const },
      canDeletePermanently: canManage && access.role === "owner",
      deletionEffects: "Permanent deletion removes this Project. Its files, versions, Client Portal history, and Activity will no longer be available through the Project. This cannot be undone.",
    },
    actions: {
      groupOptions(clientId: string) { return port.loadGroups().filter((group) => !group.archived && group.clientId === clientId).map(({ id: value, name: label }) => ({ value, label })); },
      inspectProject(id: string) { return port.loadProjects().find((project) => project.id === id) ?? null; },
      table,
      board(state: ProjectViewState) {
        const rows = table(state).rows;
        const stages = rows.flatMap((project) => project.workflowSetup.stages).filter((stage, index, all) => all.findIndex(({ id }) => id === stage.id) === index);
        const currentStage = (project: typeof rows[number]) => project.workflowSetup.stages.find(({ id }) => id === project.workflowStageId) ?? project.workflowSetup.stages.find(({ label }) => label === project.stage);
        return {
          columns: stages.map((stage) => ({
            id: stage.id,
            label: stage.label,
            projects: rows.filter((project) => currentStage(project)?.id === stage.id).map((project) => ({
              ...project,
              currentStageId: currentStage(project)?.id ?? "",
              stageOptions: project.workflowSetup.stages.map(({ id: value, label }) => ({ value, label })),
            })),
          })),
        };
      },
      viewQuery(state: ProjectViewState) { const query = new URLSearchParams(); for (const [key, value] of Object.entries(state)) if (value) query.set(key, value); return query.toString(); },
      async create(input: NewProjectInput) {
        const parsed = newProjectSchema.safeParse(input);
        if (!parsed.success) return { ok: false as const, kind: "invalid" as const, message: parsed.error.issues[0].message };
        const result = await port.createProject(parsed.data);
        return result.ok ? { ok: true as const, message: "Project created.", url: `/relay/projects/${result.value.id}` } : { ok: false as const, kind: result.error.kind, message: result.error.message };
      },
      async createGroup(input: ProjectGroupInput) { return message(await port.createGroup(input), "Project Group created."); },
      async editGroup(id: string, input: ProjectGroupInput) { return message(await port.editGroup(id, input), "Project Group saved."); },
      async setGroupArchived(id: string, archived: boolean) { return message(await port.setGroupArchived(id, archived), archived ? "Project Group archived." : "Project Group restored."); },
      async archive(id: string) { return message(await port.setProjectArchived(id, true), "Project archived. Its history remains available."); },
      async restore(id: string) { return message(await port.setProjectArchived(id, false), "Project restored."); },
      previewStageMove,
      async moveStage(id: string, targetStageId: string, confirmed: boolean) {
        const preview = previewStageMove(id, targetStageId);
        if (!preview.ok) return preview;
        if (preview.requiresConfirmation && !confirmed) return { ok: false as const, kind: "confirmation-required" as const, message: preview.message };
        const result = await port.moveProjectStage(id, targetStageId, confirmed);
        if (!result.ok) return { ok: false as const, kind: result.error.kind, message: result.error.message };
        const { projectName, stage, effect } = result.value;
        const effectMessage = effect.kind === "projectValue" ? `${effect.amount.toLocaleString("en-US")} earned.`
          : effect.kind === "salaryPlan" && effect.change === "added" ? "Salary Plan progress increased by one delivered Project."
          : effect.kind === "salaryPlan" ? "This Project no longer counts toward incomplete Salary Plan progress; completed batches stay unchanged."
          : "No earnings change.";
        return { ok: true as const, message: stage === "Delivered" ? `${projectName} delivered. ${effectMessage}` : `${projectName} moved to ${stage}. ${effectMessage}` };
      },
      async deletePermanently(id: string) {
        if (access.role !== "owner") return { ok: false as const, kind: "forbidden" as const, message: "Only the Workspace Owner can permanently delete Projects." };
        return message(await port.deleteProject(id), "Project permanently deleted.");
      },
    },
  };
}

export type ProjectController = ReturnType<typeof createProjectController>;
