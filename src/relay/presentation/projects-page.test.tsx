// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { createProjectController } from "../application/project-controller";
import { createWorkspaceController } from "../application/workspace-controller";
import { createMemoryProjectPort } from "../infrastructure/memory-project-port";
import { createMemoryWorkspacePort } from "../infrastructure/memory-workspace-port";
import { copyProjectSetup, createDefaultWorkflowTemplate } from "../domain/workflow-template";
import { ProjectsPage } from "./relay-experience";

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/relay/projects",
  useRouter: () => navigation,
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(cleanup);

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
});
