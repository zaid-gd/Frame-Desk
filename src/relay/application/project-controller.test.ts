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

  test("maps copied workflow stages and valid board targets", () => {
    const baseSetup = project().workflowSetup;
    const otherSetup = { ...baseSetup, templateId: "template_other", stages: baseSetup.stages.map((stage) => ({ ...stage, id: `other_${stage.id}` })) };
    const controller = createProjectController({ port: createMemoryProjectPort({ projects: [project(), project({ id: "project_beta", name: "Beta", stage: "Editing", workflowSetup: otherSetup, workflowStageId: otherSetup.stages[1].id })] }) });

    const board = controller.actions.board({ view: "board" });
    expect(board.columns).toHaveLength(12);
    const editingStageId = baseSetup.stages.find(({ purpose }) => purpose === "editing")!.id;
    const alpha = board.columns.flatMap(({ projects }) => projects).find(({ id }) => id === "project_alpha")!;
    const beta = board.columns.flatMap(({ projects }) => projects).find(({ id }) => id === "project_beta")!;
    expect({ project_alpha: alpha.currentStageId, project_beta: beta.currentStageId }).toEqual({ project_alpha: editingStageId, project_beta: `other_${editingStageId}` });
    expect(alpha.stageOptions.map(({ value }) => value)).toEqual(baseSetup.stages.map(({ id }) => id));
    expect(alpha.stageOptions.map(({ value }) => value)).not.toContain(`other_${baseSetup.stages.find(({ purpose }) => purpose === "delivered")!.id}`);
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

describe("Project workflow", () => {
  const setup = copyProjectSetup(createDefaultWorkflowTemplate("template_default", "Default workflow"));
  const project = (overrides: Partial<ProjectRecord> = {}): ProjectRecord => ({
    id: "project_alpha", name: "Alpha", clientId: "client_acme", stage: "Approved", dueDate: "2026-09-12",
    financialType: "projectValue", paymentState: "unpaid", lead: "owner", assignees: [], progress: 90,
    money: 1200, archived: false, workflowSetup: setup, ...overrides,
  });

  test("requires delivery confirmation and reports the earned amount", async () => {
    const port = createMemoryProjectPort({ now: () => "2026-08-17T10:00:00.000Z", projects: [project()] });
    const controller = createProjectController({ port });
    const delivered = setup.stages.find(({ purpose }) => purpose === "delivered")!;

    expect(controller.actions.previewStageMove("project_alpha", delivered.id)).toEqual({
      ok: true,
      requiresConfirmation: true,
      message: "Delivering Alpha records the actual delivery time and earns 1,200.",
    });
    await expect(controller.actions.moveStage("project_alpha", delivered.id, false)).resolves.toMatchObject({ ok: false, kind: "confirmation-required" });
    await expect(controller.actions.moveStage("project_alpha", delivered.id, true)).resolves.toEqual({ ok: true, message: "Alpha delivered. 1,200 earned." });
    expect(port.loadProjects()[0]).toMatchObject({ stage: delivered.label, progress: 100, completedAt: "2026-08-17T10:00:00.000Z" });
  });

  test("reopening removes current Salary Plan progress without rewriting settled history", async () => {
    const port = createMemoryProjectPort({
      now: () => "2026-08-17T10:00:00.000Z",
      projects: [project({ stage: "Delivered", progress: 100, financialType: "salaryPlan", money: 0, completedAt: "2026-08-10T09:00:00.000Z" })],
    });
    const controller = createProjectController({ port });
    const editing = setup.stages.find(({ purpose }) => purpose === "editing")!;

    expect(controller.actions.previewStageMove("project_alpha", editing.id)).toEqual({ ok: true, requiresConfirmation: false, message: "Move Alpha to Editing." });
    await expect(controller.actions.moveStage("project_alpha", editing.id, false)).resolves.toEqual({ ok: true, message: "Alpha moved to Editing. This Project no longer counts toward incomplete Salary Plan progress; completed batches stay unchanged." });
    expect(port.loadProjects()[0]).toMatchObject({ stage: "Editing", progress: 25, completedAt: undefined });
  });
});
