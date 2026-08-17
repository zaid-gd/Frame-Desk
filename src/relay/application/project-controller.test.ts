import { describe, expect, test } from "vitest";
import { createProjectController } from "./project-controller";
import { createMemoryProjectPort } from "../infrastructure/memory-project-port";
import { copyProjectSetup, createDefaultWorkflowTemplate } from "../domain/workflow-template";
import type { ProjectRecord } from "../domain/project";

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

describe("Projects table", () => {
  const project = (overrides: Partial<ProjectRecord> = {}): ProjectRecord => ({
    id: "project_alpha", name: "Alpha", clientId: "client_acme", stage: "Editing", dueDate: "2026-09-12",
    financialType: "projectValue" as const, paymentState: "unpaid" as const, lead: "owner", assignees: ["editor_1"],
    progress: 30, money: 1200, archived: false, workflowSetup: copyProjectSetup(createDefaultWorkflowTemplate("template_default", "Default workflow")),
    ...overrides,
  });

  test("filters and sorts URL view state while applying Editor project visibility", () => {
    const port = createMemoryProjectPort({
      clients: [{ id: "client_acme", name: "Acme", archived: false }],
      projects: [project(), project({ id: "project_beta", name: "Beta", stage: "Planned", dueDate: "2026-08-20", assignees: [] })],
    });
    const controller = createProjectController({ port, access: { role: "editor", memberId: "editor_1", editorsCanViewAll: false } });

    expect(controller.actions.table({ stage: "Editing", sort: "due", direction: "desc", view: "table" }).rows.map((row) => row.id)).toEqual(["project_alpha"]);
    expect(controller.actions.table({}).showAssignees).toBe(true);
    expect(controller.actions.viewQuery({ stage: "Editing", sort: "due", direction: "desc", view: "board" })).toBe("stage=Editing&sort=due&direction=desc&view=board");
  });

  test("archives without losing history and limits permanent deletion to Owners", async () => {
    const port = createMemoryProjectPort({ projects: [project()] });
    const editor = createProjectController({ port, access: { role: "editor", memberId: "editor_1", editorsCanViewAll: true } });
    await expect(editor.actions.archive("project_alpha")).resolves.toMatchObject({ ok: true });
    expect(port.loadProjects()[0].archived).toBe(true);
    await expect(editor.actions.deletePermanently("project_alpha")).resolves.toMatchObject({ ok: false, kind: "forbidden" });

    const owner = createProjectController({ port, access: { role: "owner", memberId: "owner", editorsCanViewAll: true } });
    await expect(owner.actions.deletePermanently("project_alpha")).resolves.toMatchObject({ ok: true });
    expect(port.loadProjects()).toEqual([]);
    expect(owner.model.deletionEffects).toContain("files, versions, Client Portal history, and Activity");
  });
});
