import { copyProjectSetup, createDefaultWorkflowTemplate, removedStageIds, type ClientPortalDefaults, type WorkflowTemplate, type WorkflowTemplateInput } from "../domain/workflow-template";
import type { WorkflowTemplatePort, WorkflowTemplateWriteResult } from "../ports/workflow-template-port";

function displayResult(result: WorkflowTemplateWriteResult, success: string) {
  return result.ok ? { ok: true as const, message: success, template: result.template } : { ok: false as const, kind: result.error.kind, message: result.error.message };
}

function draftFrom(template: WorkflowTemplate): WorkflowTemplateInput {
  const { id: _id, archived: _archived, ...input } = structuredClone(template);
  return input;
}

function move<T>(items: readonly T[], index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= items.length) return [...items];
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

const purposeLabels = { planned: "Planned", editing: "Editing", clientReview: "Client review", revisions: "Revisions", approved: "Approved", delivered: "Delivered" } as const;

export function createWorkflowTemplateController({ port, canManage = true }: { port: WorkflowTemplatePort; canManage?: boolean }) {
  const templates = () => port.loadTemplates();
  return {
    model: {
      canManage,
      copy: {
        listTitle: "Workflow Templates", includeArchivedLabel: "Include archived Templates", createLabel: "New Workflow Template",
        inspectEmpty: "Choose a Workflow Template to inspect its stages, starter Project Outputs, roles, dates, and Client Portal defaults.",
        inspectLead: "Inspect and edit reusable Project setup", cancelledHelp: "Cancelled stays outside the ordered workflow path.",
        sections: { stages: "Ordered stages", roles: "Roles", outputs: "Starter Project Outputs and relative deadlines", portal: "Client Portal defaults" },
        fields: { name: "Template name", cancelled: "Cancelled label", outputName: "Starter Project Output name", deadline: "Days from Project due date", role: "Role", roleLabel: "Role label", unassigned: "Unassigned" },
        actions: { archive: "Archive", restore: "Restore", remove: "Remove", addStage: "Add stage", addRole: "Add role", addOutput: "Add starter output", save: "Save Workflow Template" },
        moveTemplateUp: "Move Template up", moveTemplateDown: "Move Template down",
        portalLabels: { enabled: "Enable portal", showDates: "Show dates", showNotes: "Show notes", allowComments: "Allow comments" } satisfies Record<keyof ClientPortalDefaults, string>,
      },
    },
    actions: {
      list(includeArchived = false) { return templates().filter(({ archived }) => includeArchived || !archived); },
      listRows(includeArchived = false) {
        return templates().filter(({ archived }) => includeArchived || !archived).map((template) => ({
          id: template.id, name: template.name, summary: `${template.stages.length} stages · ${template.starterOutputs.length} starter outputs`, archivedText: template.archived ? "Archived" : "",
        }));
      },
      inspect(id: string) { return templates().find((template) => template.id === id) ?? null; },
      inspectView(id: string) {
        const template = templates().find((row) => row.id === id);
        return template ? { id: template.id, name: template.name, archiveActionLabel: template.archived ? "Restore" : "Archive", draft: draftFrom(template) } : null;
      },
      copyProjectSetup(id: string) {
        const template = templates().find((row) => row.id === id);
        return template ? copyProjectSetup(template) : null;
      },
      async create(name = "New Workflow Template") {
        const template = createDefaultWorkflowTemplate(`template_${crypto.randomUUID()}`, name);
        const { id: _id, archived: _archived, ...input } = template;
        return displayResult(await port.createTemplate(input), "Workflow Template created.");
      },
      async edit(id: string, input: WorkflowTemplateInput) {
        const prior = templates().find((template) => template.id === id);
        if (!prior) return { ok: false as const, kind: "unavailable" as const, message: "Workflow Template not found." };
        const changedPurpose = input.stages.some((stage) => {
          const priorStage = prior.stages.find(({ id: priorId }) => priorId === stage.id);
          return priorStage && priorStage.purpose !== stage.purpose;
        });
        if (changedPurpose) return { ok: false as const, kind: "fixed-purpose" as const, message: "A stage's reporting purpose cannot change. Add a new stage instead." };
        const usedStage = removedStageIds(prior, input).map((stageId) => prior.stages.find((stage) => stage.id === stageId)!).find(({ id: stageId }) => port.isStageInUse(id, stageId));
        if (usedStage) return { ok: false as const, kind: "stage-in-use" as const, message: `Reassign Projects from ${usedStage.label} before removing this stage.` };
        return displayResult(await port.editTemplate(id, input), "Workflow Template saved.");
      },
      async reorder(ids: readonly string[]) {
        const result = await port.reorderTemplates(ids);
        return result.ok ? { ok: true as const, message: "Workflow Templates reordered." } : { ok: false as const, kind: result.error.kind, message: result.error.message };
      },
      async moveTemplate(id: string, direction: -1 | 1) {
        const rows = [...templates()];
        const index = rows.findIndex((template) => template.id === id);
        if (index < 0) return { ok: false as const, kind: "unavailable" as const, message: "Workflow Template not found." };
        const ordered = move(rows, index, direction);
        const result = await port.reorderTemplates(ordered.map((template) => template.id));
        return result.ok ? { ok: true as const, message: "Workflow Templates reordered." } : { ok: false as const, kind: result.error.kind, message: result.error.message };
      },
      async setArchived(id: string, archived: boolean) {
        return displayResult(await port.setTemplateArchived(id, archived), archived ? "Workflow Template archived." : "Workflow Template restored.");
      },
      async toggleArchived(id: string) {
        const template = templates().find((row) => row.id === id);
        if (!template) return { ok: false as const, kind: "unavailable" as const, message: "Workflow Template not found." };
        return displayResult(await port.setTemplateArchived(id, !template.archived), template.archived ? "Workflow Template restored." : "Workflow Template archived.");
      },
      setName(draft: WorkflowTemplateInput, name: string) { return { ...draft, name }; },
      setCancelledLabel(draft: WorkflowTemplateInput, cancelledLabel: string) { return { ...draft, cancelledLabel }; },
      setStageLabel(draft: WorkflowTemplateInput, stageId: string, label: string) { return { ...draft, stages: draft.stages.map((stage) => stage.id === stageId ? { ...stage, label } : stage) }; },
      stageRows(draft: WorkflowTemplateInput) { return draft.stages.map((stage) => ({ stage, purposeLabel: purposeLabels[stage.purpose], canRemove: stage.purpose !== "delivered" })); },
      moveStageActionLabel(stageLabel: string, direction: -1 | 1) { return `Move ${stageLabel} ${direction < 0 ? "up" : "down"}`; },
      moveStage(draft: WorkflowTemplateInput, index: number, direction: -1 | 1) { return { ...draft, stages: move(draft.stages, index, direction) }; },
      removeStage(draft: WorkflowTemplateInput, stageId: string) { return { ...draft, stages: draft.stages.filter(({ id }) => id !== stageId) }; },
      addStage(draft: WorkflowTemplateInput) { return { ...draft, stages: [...draft.stages, { id: `stage_${crypto.randomUUID()}`, label: "New stage", purpose: "editing" as const }] }; },
      setRoleLabel(draft: WorkflowTemplateInput, roleId: string, label: string) { return { ...draft, roles: draft.roles.map((role) => role.id === roleId ? { ...role, label } : role) }; },
      removeRole(draft: WorkflowTemplateInput, roleId: string) { return { ...draft, roles: draft.roles.filter(({ id }) => id !== roleId), starterOutputs: draft.starterOutputs.map((output) => output.roleId === roleId ? { ...output, roleId: null } : output) }; },
      addRole(draft: WorkflowTemplateInput) { return { ...draft, roles: [...draft.roles, { id: `role_${crypto.randomUUID()}`, label: "New role" }] }; },
      setOutputName(draft: WorkflowTemplateInput, outputId: string, name: string) { return { ...draft, starterOutputs: draft.starterOutputs.map((output) => output.id === outputId ? { ...output, name } : output) }; },
      setOutputDeadline(draft: WorkflowTemplateInput, outputId: string, relativeDeadlineDays: number) { return { ...draft, starterOutputs: draft.starterOutputs.map((output) => output.id === outputId ? { ...output, relativeDeadlineDays } : output) }; },
      setOutputRole(draft: WorkflowTemplateInput, outputId: string, roleId: string | null) { return { ...draft, starterOutputs: draft.starterOutputs.map((output) => output.id === outputId ? { ...output, roleId } : output) }; },
      removeOutput(draft: WorkflowTemplateInput, outputId: string) { return { ...draft, starterOutputs: draft.starterOutputs.filter(({ id }) => id !== outputId) }; },
      addOutput(draft: WorkflowTemplateInput) { return { ...draft, starterOutputs: [...draft.starterOutputs, { id: `output_${crypto.randomUUID()}`, name: "New output", relativeDeadlineDays: 0, roleId: null }] }; },
      setPortalDefault(draft: WorkflowTemplateInput, key: keyof ClientPortalDefaults, value: boolean) { return { ...draft, portalDefaults: { ...draft.portalDefaults, [key]: value } }; },
    },
  };
}

export type WorkflowTemplateController = ReturnType<typeof createWorkflowTemplateController>;
