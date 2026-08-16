import { createDefaultWorkflowTemplate } from "../domain/workflow-template";
import { createMemoryWorkflowTemplatePort } from "./memory-workflow-template-port";

export function createSampleWorkflowTemplatePort() {
  return createMemoryWorkflowTemplatePort({ templates: [createDefaultWorkflowTemplate("template_sample", "Sample production workflow")], readOnly: true });
}
