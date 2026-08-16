import type { WorkflowTemplate, WorkflowTemplateInput } from "../domain/workflow-template";
import type { ActionResult } from "./workspace-port";

export type WorkflowTemplateWriteResult = ActionResult & { template?: WorkflowTemplate };
export type WorkflowTemplatePort = {
  loadTemplates(): readonly WorkflowTemplate[];
  isStageInUse(templateId: string, stageId: string): boolean;
  createTemplate(input: WorkflowTemplateInput): Promise<WorkflowTemplateWriteResult>;
  editTemplate(id: string, input: WorkflowTemplateInput): Promise<WorkflowTemplateWriteResult>;
  reorderTemplates(ids: readonly string[]): Promise<ActionResult>;
  setTemplateArchived(id: string, archived: boolean): Promise<WorkflowTemplateWriteResult>;
};
