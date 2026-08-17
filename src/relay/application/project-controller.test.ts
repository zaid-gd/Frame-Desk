import { describe, expect, test } from "vitest";
import { createProjectController } from "./project-controller";
import { createMemoryProjectPort } from "../infrastructure/memory-project-port";
import { createDefaultWorkflowTemplate } from "../domain/workflow-template";

describe("Project creation form", () => {
  test("accepts only the six setup choices and returns the new bookmarkable URL", async () => {
    const port = createMemoryProjectPort({
      clients: [{ id: "client_acme", name: "Acme", archived: false }],
      groups: [{ id: "group_launch", name: "Launch", clientId: "client_acme", startDate: "", endDate: "", notes: "", archived: false }],
      templates: [createDefaultWorkflowTemplate("template_default", "Default workflow")],
    });
    const controller = createProjectController({ port });

    await expect(controller.actions.create({ name: " ", clientId: "client_acme", projectGroupId: "group_launch", templateId: "template_default", dueDate: "2026-09-12", financialType: "projectValue" })).resolves.toMatchObject({ ok: false, message: "Enter a Project name." });
    await expect(controller.actions.create({ name: "Launch film", clientId: "client_acme", projectGroupId: "group_launch", templateId: "template_default", dueDate: "2026-09-12", financialType: "projectValue" })).resolves.toMatchObject({ ok: true, url: expect.stringMatching(/^\/relay\/projects\/project_/) });
    expect(port.loadProjects()).toMatchObject([{ name: "Launch film", clientId: "client_acme", projectGroupId: "group_launch", workflowSetup: { templateName: "Default workflow" } }]);
  });

  test("filters optional Project Groups to the chosen Client", () => {
    const controller = createProjectController({ port: createMemoryProjectPort({
      clients: [{ id: "client_acme", name: "Acme", archived: false }, { id: "client_other", name: "Other", archived: false }],
      groups: [{ id: "group_launch", name: "Launch", clientId: "client_acme", startDate: "", endDate: "", notes: "", archived: false }],
      templates: [],
    }) });
    expect(controller.actions.groupOptions("client_acme")).toEqual([{ value: "group_launch", label: "Launch" }]);
    expect(controller.actions.groupOptions("client_other")).toEqual([]);
  });
});
