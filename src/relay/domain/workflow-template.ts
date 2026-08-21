export const WORKFLOW_STAGE_PURPOSES = ["planned", "editing", "clientReview", "revisions", "approved", "delivered"] as const;
export type WorkflowStagePurpose = (typeof WORKFLOW_STAGE_PURPOSES)[number];

export type WorkflowStage = { id: string; label: string; purpose: WorkflowStagePurpose };
export type WorkflowTemplateRole = { id: string; label: string };
export type StarterProjectOutput = {
  id: string;
  name: string;
  relativeDeadlineDays: number;
  roleId: string | null;
};
export type ClientPortalDefaults = {
  enabled: boolean;
  showDates: boolean;
  showNotes: boolean;
  allowComments: boolean;
};
export type WorkflowTemplate = {
  id: string;
  name: string;
  archived: boolean;
  stages: WorkflowStage[];
  cancelledLabel: string;
  starterOutputs: StarterProjectOutput[];
  roles: WorkflowTemplateRole[];
  portalDefaults: ClientPortalDefaults;
};
export type WorkflowTemplateInput = Omit<WorkflowTemplate, "id" | "archived">;
export type ProjectSetup = Omit<WorkflowTemplate, "id" | "name" | "archived"> & { templateId: string; templateName: string };

const defaultStageLabels = ["Planned", "Editing", "Client Review", "Revisions", "Approved", "Delivered"] as const;
const controlCharacters = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/;

function validText(value: unknown, maxBytes: number) {
  return typeof value === "string" && value.trim() !== "" && new TextEncoder().encode(value).byteLength <= maxBytes && !controlCharacters.test(value);
}

export function createDefaultWorkflowTemplate(id: string, name: string): WorkflowTemplate {
  return {
    id,
    name,
    archived: false,
    stages: WORKFLOW_STAGE_PURPOSES.map((purpose, index) => ({ id: `${id}_stage_${purpose}`, label: defaultStageLabels[index], purpose })),
    cancelledLabel: "Cancelled",
    starterOutputs: [{ id: `${id}_output_main-video`, name: "Main video", relativeDeadlineDays: 0, roleId: null }],
    roles: [{ id: `${id}_role_editor`, label: "Editor" }],
    portalDefaults: { enabled: false, showDates: true, showNotes: false, allowComments: true },
  };
}

export function validateWorkflowTemplate(template: WorkflowTemplate | WorkflowTemplateInput): string | null {
  if (!validText(template.name, 200) || !validText(template.cancelledLabel, 80)) return "Enter valid Workflow Template details before saving.";
  if (!template.portalDefaults || [template.portalDefaults.enabled, template.portalDefaults.showDates, template.portalDefaults.showNotes, template.portalDefaults.allowComments].some((value) => typeof value !== "boolean")) {
    return "Enter valid Client Portal defaults before saving.";
  }
  if (template.stages.length < 1 || template.stages.length > 24 || template.stages.filter(({ purpose }) => purpose === "delivered").length !== 1) {
    return "Every Workflow Template must contain exactly one Delivered-purpose stage.";
  }
  const stageIds = new Set(template.stages.map(({ id }) => id));
  if (stageIds.size !== template.stages.length || template.stages.some(({ id, label, purpose }) => !validText(id, 100) || !validText(label, 80) || !WORKFLOW_STAGE_PURPOSES.includes(purpose))) {
    return "Enter valid Workflow Template stages before saving.";
  }
  const roleIds = new Set(template.roles.map(({ id }) => id));
  if (roleIds.size !== template.roles.length || template.roles.length > 24 || template.roles.some(({ id, label }) => !validText(id, 100) || !validText(label, 80))) {
    return "Enter valid Workflow Template roles before saving.";
  }
  const outputIds = new Set(template.starterOutputs.map(({ id }) => id));
  if (outputIds.size !== template.starterOutputs.length || template.starterOutputs.length > 100 || template.starterOutputs.some(({ id, name, relativeDeadlineDays, roleId }) => !validText(id, 100) || !validText(name, 200) || !Number.isInteger(relativeDeadlineDays) || relativeDeadlineDays < -365 || relativeDeadlineDays > 3650 || (roleId !== null && !roleIds.has(roleId)))) {
    return "Enter valid starter Project Outputs before saving.";
  }
  return null;
}

export function isWorkflowTemplate(value: unknown): value is WorkflowTemplate {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const template = value as WorkflowTemplate;
  return validText(template.id, 100) && typeof template.archived === "boolean"
    && Array.isArray(template.stages) && Array.isArray(template.starterOutputs) && Array.isArray(template.roles)
    && Boolean(template.portalDefaults) && typeof template.portalDefaults === "object"
    && validateWorkflowTemplate(template) === null;
}

export function removedStageIds(prior: WorkflowTemplate, next: WorkflowTemplateInput) {
  const nextIds = new Set(next.stages.map(({ id }) => id));
  return prior.stages.filter(({ id }) => !nextIds.has(id)).map(({ id }) => id);
}

export function copyProjectSetup(template: WorkflowTemplate): ProjectSetup {
  return structuredClone({
    templateId: template.id,
    templateName: template.name,
    stages: template.stages,
    cancelledLabel: template.cancelledLabel,
    starterOutputs: template.starterOutputs,
    roles: template.roles,
    portalDefaults: template.portalDefaults,
  });
}
