import { describe, expect, test } from "vitest";
import { createWorkflowTemplateController } from "./workflow-template-controller";
import { createDefaultWorkflowTemplate } from "../domain/workflow-template";
import { createMemoryWorkflowTemplatePort } from "../infrastructure/memory-workflow-template-port";
import { createMemoryWorkspacePort } from "../infrastructure/memory-workspace-port";
import { createWorkspaceController } from "./workspace-controller";

describe("Workflow Template controller", () => {
  test("copies Project setup so later Template edits cannot rewrite it", async () => {
    const template = createDefaultWorkflowTemplate("template_default", "Default workflow");
    const controller = createWorkflowTemplateController({ port: createMemoryWorkflowTemplatePort({ templates: [template] }) });
    const setup = controller.actions.copyProjectSetup(template.id);
    const workspacePort = createMemoryWorkspacePort();
    const workspaceController = createWorkspaceController({ mode: "local", workspacePort, defaultProjectSetup: setup ?? undefined });
    await workspaceController.actions.requestNewProject();
    const renamed = { ...template, name: "Social workflow", stages: template.stages.map((stage) => stage.purpose === "editing" ? { ...stage, label: "Cutting" } : stage) };
    await controller.actions.edit(template.id, renamed);

    const copiedSetup = workspacePort.loadProjects()[0].workflowSetup;
    expect(copiedSetup).toMatchObject({ templateId: template.id, templateName: "Default workflow" });
    expect(copiedSetup?.stages.find(({ purpose }) => purpose === "editing")?.label).toBe("Editing");
    expect(controller.actions.inspect(template.id)?.stages.find(({ purpose }) => purpose === "editing")?.label).toBe("Cutting");
  });

  test("refuses to remove a stage used by a Project until it is reassigned", async () => {
    const template = createDefaultWorkflowTemplate("template_default", "Default workflow");
    const editingStage = template.stages.find(({ purpose }) => purpose === "editing")!;
    const controller = createWorkflowTemplateController({
      port: createMemoryWorkflowTemplatePort({ templates: [template], usedStages: [{ templateId: template.id, stageId: editingStage.id }] }),
    });

    const result = await controller.actions.edit(template.id, { ...template, stages: template.stages.filter(({ id }) => id !== editingStage.id) });

    expect(result).toEqual({ ok: false, kind: "stage-in-use", message: "Reassign Projects from Editing before removing this stage." });
    expect(controller.actions.inspect(template.id)?.stages).toHaveLength(6);
  });

  test("keeps a stage's reporting purpose fixed when its visible label changes", async () => {
    const template = createDefaultWorkflowTemplate("template_default", "Default workflow");
    const controller = createWorkflowTemplateController({ port: createMemoryWorkflowTemplatePort({ templates: [template] }) });
    const editing = template.stages.find(({ purpose }) => purpose === "editing")!;

    const result = await controller.actions.edit(template.id, {
      ...template,
      stages: template.stages.map((stage) => stage.id === editing.id ? { ...stage, label: "Assembly", purpose: "planned" as const } : stage),
    });

    expect(result).toEqual({ ok: false, kind: "fixed-purpose", message: "A stage's reporting purpose cannot change. Add a new stage instead." });
  });

  test("creates, inspects, reorders, and archives Templates with reusable setup fields", async () => {
    const first = createDefaultWorkflowTemplate("template_first", "First");
    const second = createDefaultWorkflowTemplate("template_second", "Second");
    const controller = createWorkflowTemplateController({ port: createMemoryWorkflowTemplatePort({ templates: [first, second] }) });

    const created = await controller.actions.create("Launch workflow");
    expect(created.ok && created.template).toMatchObject({
      name: "Launch workflow",
      starterOutputs: [{ name: "Main video", relativeDeadlineDays: 0 }],
      roles: [{ label: "Editor" }],
      portalDefaults: { enabled: false, showDates: true, showNotes: false, allowComments: true },
    });
    await controller.actions.reorder([second.id, first.id, created.template!.id]);
    expect(controller.actions.list().map(({ name }) => name)).toEqual(["Second", "First", "Launch workflow"]);
    await controller.actions.setArchived(first.id, true);
    expect(controller.actions.list().map(({ name }) => name)).toEqual(["Second", "Launch workflow"]);
    expect(controller.actions.list(true).map(({ name }) => name)).toEqual(["Second", "First", "Launch workflow"]);
  });
});
