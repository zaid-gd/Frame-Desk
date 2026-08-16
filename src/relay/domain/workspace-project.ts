import { validateWorkflowTemplate, type ProjectSetup } from "./workflow-template";

export const MAX_RELAY_PROJECTS = 500;

export type WorkspaceProject = {
  id: string;
  name: string;
  clientId: string;
  stage: string;
  tone: "review" | "delivered" | "overdue" | "planned";
  due: string;
  progress: string;
  status?: "active" | "past";
  outstandingAmount?: number;
  projectGroupId?: string;
  projectGroupName?: string;
  portalUrl?: string;
  workflowTemplateId?: string;
  workflowStageId?: string;
  workflowSetup?: ProjectSetup;
};

export function createWorkspaceProjectDraft(id: string, name: string, setup?: ProjectSetup): WorkspaceProject {
  const firstStage = setup?.stages[0];
  return {
    id,
    name,
    clientId: "client_unassigned",
    stage: firstStage?.label ?? "Planned",
    tone: "planned",
    due: "Not set",
    progress: "0%",
    ...(setup && firstStage ? { workflowTemplateId: setup.templateId, workflowStageId: firstStage.id, workflowSetup: structuredClone(setup) } : {}),
  };
}

const projectKeys = ["id", "name", "clientId", "stage", "tone", "due", "progress", "status", "outstandingAmount", "projectGroupId", "projectGroupName", "portalUrl", "workflowTemplateId", "workflowStageId", "workflowSetup"] as const;
const textByteLimits = { id: 100, name: 200, clientId: 100, stage: 80, due: 80, progress: 40 } as const;

function safeText(value: unknown, maxBytes: number): value is string {
  return typeof value === "string"
    && new TextEncoder().encode(value).byteLength <= maxBytes
    && !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value);
}

export function isWorkspaceProject(value: unknown): value is WorkspaceProject {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((key) => !projectKeys.includes(key as typeof projectKeys[number]))) return false;
  return safeText(record.id, textByteLimits.id) && record.id !== ""
    && safeText(record.name, textByteLimits.name)
    && safeText(record.clientId, textByteLimits.clientId) && record.clientId !== ""
    && safeText(record.stage, textByteLimits.stage)
    && ["review", "delivered", "overdue", "planned"].includes(String(record.tone))
    && safeText(record.due, textByteLimits.due)
    && safeText(record.progress, textByteLimits.progress)
    && (record.status === undefined || record.status === "active" || record.status === "past")
    && (record.outstandingAmount === undefined || (typeof record.outstandingAmount === "number" && Number.isFinite(record.outstandingAmount)))
    && (record.projectGroupId === undefined || safeText(record.projectGroupId, 100))
    && (record.projectGroupName === undefined || safeText(record.projectGroupName, 200))
    && (record.portalUrl === undefined || safeText(record.portalUrl, 1000))
    && (record.workflowTemplateId === undefined || safeText(record.workflowTemplateId, 100))
    && (record.workflowStageId === undefined || safeText(record.workflowStageId, 100))
    && (record.workflowSetup === undefined || validProjectSetup(record.workflowSetup));
}

function validProjectSetup(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const setup = value as ProjectSetup;
  return safeText(setup.templateId, 100) && safeText(setup.templateName, 200)
    && validateProjectSetup(setup) === null;
}

function validateProjectSetup(setup: ProjectSetup) {
  const { templateId: _templateId, templateName: name, ...input } = setup;
  return validateWorkflowTemplate({ id: "project_setup", name, archived: false, ...input });
}
