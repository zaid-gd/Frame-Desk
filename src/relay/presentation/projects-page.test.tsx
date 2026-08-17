// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { createProjectController } from "../application/project-controller";
import { createWorkspaceController } from "../application/workspace-controller";
import { createMemoryProjectPort } from "../infrastructure/memory-project-port";
import { createMemoryWorkspacePort } from "../infrastructure/memory-workspace-port";
import { copyProjectSetup, createDefaultWorkflowTemplate } from "../domain/workflow-template";
import { ProjectPage, ProjectsPage } from "./relay-experience";
import type { ProjectRecord } from "../domain/project";
import type { ProjectOutput } from "../domain/project-output";
import { createProjectOutputController } from "../application/project-output-controller";

const navigation = vi.hoisted(() => ({ replace: vi.fn(), search: "" }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/relay/projects",
  useRouter: () => navigation,
  useSearchParams: () => new URLSearchParams(navigation.search),
}));

afterEach(() => { cleanup(); navigation.search = ""; navigation.replace.mockReset(); });

describe("Projects page public interface", () => {
  function renderPage(controller = createProjectController({ port: createMemoryProjectPort() })) {
    const workspace = createWorkspaceController({ mode: "local", workspacePort: createMemoryWorkspacePort(), section: "projects" }).model;
    return render(<ProjectsPage controller={controller} workspace={workspace} readOnly={false} showNewProject={false} onNewProject={() => undefined} onCancelNewProject={() => undefined} onProjectCreated={() => undefined} onChanged={() => undefined} />);
  }

  test("renders an announced empty state and focusable keyboard controls", async () => {
    renderPage();
    expect(screen.getByRole("status").textContent).toContain("No Projects found");
    const search = screen.getByRole("textbox", { name: "Search Projects" });
    search.focus();
    expect(document.activeElement).toBe(search);
    const board = screen.getByRole("button", { name: "Board" });
    board.focus();
    await userEvent.keyboard("{Enter}");
    expect(navigation.replace).toHaveBeenCalledWith(expect.stringContaining("view=board"));
  });

  test("hides destructive actions in a read-only Workspace", () => {
    const setup = copyProjectSetup(createDefaultWorkflowTemplate("template_default", "Default workflow"));
    const controller = createProjectController({ canManage: false, port: createMemoryProjectPort({ clients: [{ id: "client_acme", name: "Acme", archived: false }], projects: [{ id: "project_alpha", name: "Alpha", clientId: "client_acme", stage: "Editing", dueDate: "2026-09-12", financialType: "projectValue", paymentState: "unpaid", archived: false, lead: "Owner", assignees: [], progress: 30, money: 1200, workflowSetup: setup }] }) });
    const workspace = createWorkspaceController({ mode: "sample", workspacePort: createMemoryWorkspacePort(), section: "projects" }).model;
    render(<ProjectsPage controller={controller} workspace={workspace} readOnly showNewProject={false} onNewProject={() => undefined} onCancelNewProject={() => undefined} onProjectCreated={() => undefined} onChanged={() => undefined} />);
    expect(screen.queryByRole("button", { name: "Archive" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete permanently" })).toBeNull();
  });

  test("uses named column headers and a bookmarkable row link", () => {
    const setup = copyProjectSetup(createDefaultWorkflowTemplate("template_default", "Default workflow"));
    renderPage(createProjectController({ port: createMemoryProjectPort({ clients: [{ id: "client_acme", name: "Acme", archived: false }], projects: [{ id: "project_alpha", name: "Alpha", clientId: "client_acme", stage: "Editing", dueDate: "2026-09-12", financialType: "projectValue", paymentState: "unpaid", archived: false, lead: "Owner", assignees: [], progress: 30, money: 1200, workflowSetup: setup }] }) }));
    expect(screen.getByRole("columnheader", { name: "Client" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Payment" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Alpha" }).getAttribute("href")).toBe("/relay/projects/project_alpha");
  });

  test("announces loading and error states", () => {
    const loadingPort = createMemoryProjectPort();
    loadingPort.projectState = () => ({ kind: "loading" });
    const { unmount } = renderPage(createProjectController({ port: loadingPort }));
    expect(screen.getByRole("status").textContent).toContain("Loading Projects");
    unmount();
    const errorPort = createMemoryProjectPort();
    errorPort.projectState = () => ({ kind: "error", message: "Check your connection and refresh." });
    renderPage(createProjectController({ port: errorPort }));
    expect(screen.getByRole("alert").textContent).toContain("Check your connection and refresh.");
  });

  test("groups the board by copied stages and offers the same move through a stage menu", async () => {
    navigation.search = "view=board";
    const setup = copyProjectSetup(createDefaultWorkflowTemplate("template_default", "Default workflow"));
    const port = createMemoryProjectPort({
      now: () => "2026-08-17T10:00:00.000Z",
      clients: [{ id: "client_acme", name: "Acme", archived: false }],
      projects: [{ id: "project_alpha", name: "Alpha", clientId: "client_acme", stage: "Approved", dueDate: "2026-09-12", financialType: "projectValue", paymentState: "unpaid", archived: false, lead: "Owner", assignees: [], progress: 90, money: 1200, workflowSetup: setup }],
    });
    renderPage(createProjectController({ port }));

    for (const stage of setup.stages) expect(screen.getByRole("heading", { name: stage.label })).toBeTruthy();
    const dragHandle = screen.getByRole("button", { name: "Drag Alpha" });
    expect(dragHandle.getAttribute("aria-describedby")).toBeTruthy();
    dragHandle.focus();
    fireEvent.keyDown(dragHandle, { key: " ", code: "Space" });
    expect(await screen.findByText("Picked up Alpha.")).toBeTruthy();
    fireEvent.keyDown(dragHandle, { key: "Escape", code: "Escape" });
    expect(await screen.findByText("Moving Alpha was cancelled.")).toBeTruthy();
    fireEvent.pointerDown(dragHandle, { button: 0, buttons: 1, clientX: 10, clientY: 10, isPrimary: true, pointerId: 1, pointerType: "mouse" });
    fireEvent.pointerMove(document, { buttons: 1, clientX: 20, clientY: 10, isPrimary: true, pointerId: 1, pointerType: "mouse" });
    expect(await screen.findByText("Picked up Alpha.")).toBeTruthy();
    fireEvent.pointerUp(document, { button: 0, clientX: 20, clientY: 10, isPrimary: true, pointerId: 1, pointerType: "mouse" });
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Move Alpha to stage" }), setup.stages.find(({ purpose }) => purpose === "delivered")!.id);
    expect(screen.getByRole("alertdialog").textContent).toContain("records the actual delivery time and earns 1,200");
    const confirmDelivery = screen.getByRole("button", { name: "Confirm delivery" });
    expect(document.activeElement).toBe(confirmDelivery);
    await userEvent.click(confirmDelivery);
    expect(await screen.findByText("Alpha delivered. 1,200 earned.")).toBeTruthy();
    expect(port.loadProjects()[0]).toMatchObject({ stage: "Delivered", completedAt: "2026-08-17T10:00:00.000Z" });
  });
});

describe("Project Outputs public interface", () => {
  test("lets an editor manage Output slots and add a current Media Version", async () => {
    const setup = copyProjectSetup(createDefaultWorkflowTemplate("template_default", "Default workflow"));
    const project: ProjectRecord = { id: "project_alpha", name: "Alpha", clientId: "client_acme", stage: "Editing", dueDate: "2026-09-12", financialType: "salaryPlan", paymentState: "unpaid", archived: false, lead: "Owner", assignees: [], progress: 30, money: 0, workflowSetup: setup };
    const output: ProjectOutput = { id: "output_main", projectId: project.id, name: "Main video", reviewState: "approved", archived: false, currentVersionId: "version_1", versions: [{ id: "version_1", number: 1, source: { provider: "youtube", providerId: "dQw4w9WgXcQ", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }, addedAt: "2026-08-16T10:00:00.000Z", comments: [{ id: "comment_1", authorName: "Client", body: "Tighten the opening.", resolved: false, createdAt: "2026-08-16T11:00:00.000Z" }] }] };
    const port = createMemoryProjectPort({ clients: [{ id: "client_acme", name: "Acme", archived: false }], projects: [project], outputs: [output] });
    const controller = createProjectController({ port });
    render(<ProjectPage controller={controller} outputController={createProjectOutputController({ port })} projectId={project.id} readOnly={false} onChanged={() => undefined} />);

    await userEvent.type(screen.getByRole("textbox", { name: "New Project Output name" }), "Short cut");
    await userEvent.click(screen.getByRole("button", { name: "Add Project Output" }));
    expect(await screen.findByText("Short cut")).toBeTruthy();
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Main video review state" }), "changes_requested");
    await userEvent.type(screen.getByRole("textbox", { name: "New Media Version URL for Main video" }), "https://vimeo.com/987654321");
    await userEvent.click(screen.getByRole("button", { name: "Add Media Version for Main video" }));

    expect(await screen.findByText("Current · Vimeo · v2")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("1 unresolved Comment from an older version");
    expect(screen.getByRole("link", { name: "Open current Media Version" }).getAttribute("href")).toBe("https://vimeo.com/987654321");
    await userEvent.click(screen.getByRole("button", { name: "Resolve Comment from Client" }));
    expect(port.loadOutputs()[0].versions[0].comments[0].resolved).toBe(true);
  });
});
