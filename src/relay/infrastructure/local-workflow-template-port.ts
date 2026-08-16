import { createDefaultWorkflowTemplate, isWorkflowTemplate, validateWorkflowTemplate, type WorkflowTemplate } from "../domain/workflow-template";
import type { WorkflowTemplatePort } from "../ports/workflow-template-port";
import { readLocalWorkspaceState, RELAY_LOCAL_WORKSPACE_KEY } from "./local-workspace-state";

type TemplateStorage = Pick<Storage, "getItem" | "setItem">;

export function createLocalWorkflowTemplatePort(storage?: TemplateStorage, createId = () => `template_${crypto.randomUUID()}`): WorkflowTemplatePort {
  const target = () => storage ?? (typeof window === "undefined" ? undefined : window.localStorage);
  const loadTemplates = (): WorkflowTemplate[] => {
    const storageTarget = target();
    if (!storageTarget) return [createDefaultWorkflowTemplate("template_default", "Default workflow")];
    const templates = readLocalWorkspaceState(storageTarget)?.workflowTemplates;
    return templates?.length && templates.every(isWorkflowTemplate) ? structuredClone(templates) : [createDefaultWorkflowTemplate("template_default", "Default workflow")];
  };
  const save = (templates: readonly WorkflowTemplate[]) => {
    try {
      const storageTarget = target();
      if (!storageTarget) return "Browser storage is unavailable.";
      const state = readLocalWorkspaceState(storageTarget) ?? { clients: [], projects: [] };
      storageTarget.setItem(RELAY_LOCAL_WORKSPACE_KEY, JSON.stringify({ ...state, workflowTemplates: templates }));
      return null;
    } catch { return "Browser storage refused the Workflow Template update."; }
  };
  return {
    loadTemplates,
    isStageInUse(templateId, stageId) {
      const storageTarget = target();
      return storageTarget ? (readLocalWorkspaceState(storageTarget)?.projects ?? []).some((project) => project.workflowTemplateId === templateId && project.workflowStageId === stageId) : false;
    },
    async createTemplate(input) {
      const error = validateWorkflowTemplate(input);
      if (error) return { ok: false, error: { kind: "unavailable", message: error } };
      const templates = loadTemplates();
      if (templates.length >= 100) return { ok: false, error: { kind: "unavailable", message: "A Workspace supports up to 100 Workflow Templates." } };
      const template = { id: createId(), archived: false, ...structuredClone(input) };
      const writeError = save([...templates, template]);
      return writeError ? { ok: false, error: { kind: "unavailable", message: writeError } } : { ok: true, template };
    },
    async editTemplate(id, input) {
      const templates = loadTemplates();
      const index = templates.findIndex((template) => template.id === id);
      if (index < 0) return { ok: false, error: { kind: "unavailable", message: "Workflow Template not found." } };
      const error = validateWorkflowTemplate(input);
      if (error) return { ok: false, error: { kind: "unavailable", message: error } };
      const template = { id, archived: templates[index].archived, ...structuredClone(input) };
      templates[index] = template;
      const writeError = save(templates);
      return writeError ? { ok: false, error: { kind: "unavailable", message: writeError } } : { ok: true, template };
    },
    async reorderTemplates(ids) {
      const templates = loadTemplates();
      if (ids.length !== templates.length || new Set(ids).size !== templates.length) return { ok: false, error: { kind: "unavailable", message: "Choose every Workflow Template once before saving the order." } };
      const ordered = ids.map((id) => templates.find((template) => template.id === id)).filter((template): template is WorkflowTemplate => Boolean(template));
      if (ordered.length !== templates.length) return { ok: false, error: { kind: "unavailable", message: "Choose every Workflow Template once before saving the order." } };
      const writeError = save(ordered);
      return writeError ? { ok: false, error: { kind: "unavailable", message: writeError } } : { ok: true };
    },
    async setTemplateArchived(id, archived) {
      const templates = loadTemplates();
      const template = templates.find((row) => row.id === id);
      if (!template) return { ok: false, error: { kind: "unavailable", message: "Workflow Template not found." } };
      template.archived = archived;
      const writeError = save(templates);
      return writeError ? { ok: false, error: { kind: "unavailable", message: writeError } } : { ok: true, template };
    },
  };
}
