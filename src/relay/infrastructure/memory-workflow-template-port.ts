import { validateWorkflowTemplate, type WorkflowTemplate } from "../domain/workflow-template";
import type { WorkflowTemplatePort } from "../ports/workflow-template-port";
import { sampleWriteRefusal } from "../ports/workspace-port";

export function createMemoryWorkflowTemplatePort({ templates = [], usedStages = [], readOnly = false }: { templates?: readonly WorkflowTemplate[]; usedStages?: ReadonlyArray<{ templateId: string; stageId: string }>; readOnly?: boolean } = {}): WorkflowTemplatePort {
  const rows = structuredClone([...templates]);
  const used = new Set(usedStages.map(({ templateId, stageId }) => `${templateId}:${stageId}`));
  const refuse = () => ({ ...sampleWriteRefusal });
  return {
    loadTemplates: () => rows,
    isStageInUse: (templateId, stageId) => used.has(`${templateId}:${stageId}`),
    async createTemplate(input) {
      if (readOnly) return refuse();
      const error = validateWorkflowTemplate(input);
      if (error) return { ok: false, error: { kind: "unavailable", message: error } };
      if (rows.length >= 100) return { ok: false, error: { kind: "unavailable", message: "A Workspace supports up to 100 Workflow Templates." } };
      const template = { id: `template_${crypto.randomUUID()}`, archived: false, ...structuredClone(input) };
      rows.push(template);
      return { ok: true, template };
    },
    async editTemplate(id, input) {
      if (readOnly) return refuse();
      const index = rows.findIndex((template) => template.id === id);
      if (index < 0) return { ok: false, error: { kind: "unavailable", message: "Workflow Template not found." } };
      const error = validateWorkflowTemplate(input);
      if (error) return { ok: false, error: { kind: "unavailable", message: error } };
      const template = { id, archived: rows[index].archived, ...structuredClone(input) };
      rows[index] = template;
      return { ok: true, template };
    },
    async reorderTemplates(ids) {
      if (readOnly) return refuse();
      if (ids.length !== rows.length || new Set(ids).size !== rows.length || ids.some((id) => !rows.some((row) => row.id === id))) {
        return { ok: false, error: { kind: "unavailable", message: "Choose every Workflow Template once before saving the order." } };
      }
      rows.splice(0, rows.length, ...ids.map((id) => rows.find((row) => row.id === id)!));
      return { ok: true };
    },
    async setTemplateArchived(id, archived) {
      if (readOnly) return refuse();
      const template = rows.find((row) => row.id === id);
      if (!template) return { ok: false, error: { kind: "unavailable", message: "Workflow Template not found." } };
      template.archived = archived;
      return { ok: true, template };
    },
  };
}
