import { copyProjectSetup } from "../domain/workflow-template";
import { projectStageTransition, type NewProjectInput, type ProjectChoice, type ProjectGroup, type ProjectRecord, type ProjectTemplate } from "../domain/project";
import type { ProjectPort } from "../ports/project-port";
import { deriveProjectGroupTotals } from "../domain/project-group";
import { addMediaVersion, projectOutputNameError, type ProjectOutput } from "../domain/project-output";
import type { ProjectOutputPort } from "../ports/project-output-port";
import type { SalaryPlan } from "../domain/salary-plan";

export function createMemoryProjectPort({ clients = [], groups = [], templates = [], projects = [], outputs = [], salaryPlans = [], selectedProjectId = projects[0]?.id ?? "", now = () => new Date().toISOString() }: { clients?: readonly ProjectChoice[]; groups?: readonly Omit<ProjectGroup, "projectCount" | "progress" | "money">[]; templates?: readonly ProjectTemplate[]; projects?: readonly ProjectRecord[]; outputs?: readonly ProjectOutput[]; salaryPlans?: readonly SalaryPlan[]; selectedProjectId?: string; now?: () => string } = {}): ProjectPort & ProjectOutputPort {
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
    loadOutputCounts: () => {
      const counts = new Map<string, number>();
      for (const output of savedOutputs) counts.set(output.projectId, (counts.get(output.projectId) ?? 0) + 1);
      return [...counts.entries()].map(([projectId, count]) => ({ projectId, count }));
    },
    outputState: () => ({ kind: "ready" }),
    loadOutputs: () => savedOutputs.filter((output) => output.projectId === selectedProjectId),
    async createProject(input: NewProjectInput) {
      const template = templates.find(({ id }) => id === input.templateId);
      const client = clients.find(({ id, archived }) => id === input.clientId && !archived);
      const group = input.projectGroupId ? savedGroups.find(({ id, archived }) => id === input.projectGroupId && !archived) : undefined;
      const salaryPlan = input.salaryPlanId ? salaryPlans.find(({ id }) => id === input.salaryPlanId) : undefined;
      if (input.financialType === "salaryPlan" && (!salaryPlan || salaryPlan.archived || salaryPlan.clientId !== input.clientId)) return { ok: false, error: { kind: "invalid", message: "Choose a Salary Plan for the same active Client." } };
      if (input.financialType !== "salaryPlan" && input.salaryPlanId) return { ok: false, error: { kind: "invalid", message: "Salary Plans can only be selected for Salary Plan Projects." } };
      if (!client || !template || template.archived || (input.projectGroupId && (!group || group.clientId !== input.clientId))) return { ok: false, error: { kind: "invalid", message: "Choose active Project setup options." } };
      const setup = copyProjectSetup(template);
      const id = `project_${crypto.randomUUID()}`;
      const createdAt = now();
      const agreedAmount = input.financialType === "projectValue" ? input.agreedAmount ?? 0 : 0;
      savedProjects.push({ id, name: input.name.trim(), clientId: input.clientId, ...(input.projectGroupId ? { projectGroupId: input.projectGroupId } : {}), ...(input.salaryPlanId ? { salaryPlanId: input.salaryPlanId } : {}), stage: setup.stages[0].label, workflowStageId: setup.stages[0].id, dueDate: input.dueDate, financialType: input.financialType, paymentState: input.financialType === "nonBillable" ? "not-applicable" : "unpaid", archived: false, lead: "Unassigned", assignees: [], progress: 0, money: agreedAmount, agreedAmount, workflowSetup: setup, createdAt, stageHistory: [{ stageId: setup.stages[0].id, label: setup.stages[0].label, purpose: setup.stages[0].purpose, enteredAt: createdAt }] });
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
    async setProjectPayment(id, paid) {
      const project = savedProjects.find((row) => row.id === id);
      if (!project) return { ok: false, error: { kind: "not-found", message: "Project not found." } };
      if (project.financialType !== "projectValue") return { ok: false, error: { kind: "invalid", message: "Only normal client Projects have a payment state." } };
      project.paymentState = paid ? "paid" : "unpaid";
      if (paid) project.paidAt = now();
      else delete project.paidAt;
      return { ok: true, value: paid ? { paidAt: project.paidAt } : {} };
    },
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
    async resolveComment(id) {
      const comment = savedOutputs.flatMap(({ versions }) => versions).flatMap(({ comments }) => comments).find((item) => item.id === id);
      if (!comment) return { ok: false, error: { kind: "unavailable", message: "Comment not found." } };
      comment.resolved = true;
      return { ok: true, value: undefined };
    },
    async deleteProject(id) { const index = savedProjects.findIndex((row) => row.id === id); if (index < 0) return { ok: false, error: { kind: "unavailable", message: "Project not found." } }; savedProjects.splice(index, 1); for (let outputIndex = savedOutputs.length - 1; outputIndex >= 0; outputIndex -= 1) if (savedOutputs[outputIndex].projectId === id) savedOutputs.splice(outputIndex, 1); return { ok: true, value: undefined }; },
  };
}
