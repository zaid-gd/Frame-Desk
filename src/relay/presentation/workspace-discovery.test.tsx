// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "vitest";
import { createWorkspaceDiscoveryController } from "../application/workspace-discovery-controller";
import { copyProjectSetup, createDefaultWorkflowTemplate } from "../domain/workflow-template";
import { CalendarPage, FilesPage, WorkspaceSearch } from "./relay-experience";

afterEach(cleanup);

function controller() {
  const workflowSetup = copyProjectSetup(createDefaultWorkflowTemplate("template_default", "Default workflow"));
  return createWorkspaceDiscoveryController({
    clients: [{ id: "client_acme", name: "Acme", archived: false }],
    groups: [{ id: "group_launch", name: "Launch campaign", clientId: "client_acme", archived: false }],
    projects: [{ id: "project_launch", name: "Launch film", clientId: "client_acme", projectGroupId: "group_launch", stage: "Client Review", dueDate: "2026-09-12", financialType: "projectValue", paymentState: "unpaid", archived: false, lead: "Owner", assignees: [], progress: 60, money: 1200, workflowSetup }],
    outputs: [{ id: "output_main", projectId: "project_launch", name: "Main cut", reviewState: "in_review", archived: false, relativeDeadlineDays: -1, currentVersionId: "version_main", versions: [{ id: "version_main", number: 1, source: { provider: "vimeo", providerId: "987654321", url: "https://vimeo.com/987654321" }, addedAt: "2026-09-09T10:00:00.000Z", comments: [] }] }],
    files: [{ id: "file_brief", projectId: "project_launch", title: "Creative brief", fileName: "brief.pdf", mimeType: "application/pdf", size: 1200, archived: false, portalVisible: false, allowDownload: false, accessUrl: "https://files.example/brief" }],
    calendarFeedUrl: "webcal://example.test/relay-calendar.ics?token=safe",
  });
}

describe("Workspace discovery pages", () => {
  test("shows a read-only Calendar and subscribed feed without event write controls", () => {
    render(<CalendarPage controller={controller()} />);

    expect(screen.getByRole("heading", { name: "Calendar" })).toBeTruthy();
    expect(screen.getByText("Main cut review")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Subscribe to calendar" }).getAttribute("href")).toContain("relay-calendar.ics");
    expect(screen.queryByRole("button", { name: /edit|move|delete/i })).toBeNull();
  });

  test("searches the Workspace Files index and keeps management in its Project", async () => {
    render(<FilesPage controller={controller()} />);

    await userEvent.type(screen.getByRole("searchbox", { name: "Search Workspace Files" }), "brief");
    expect(screen.getByText("Creative brief")).toBeTruthy();
    expect(screen.queryByText("Main cut v1")).toBeNull();
    expect(screen.getByRole("link", { name: "Manage in Launch film" }).getAttribute("href")).toBe("/relay/projects/project_launch#files");
    expect(screen.queryByRole("button", { name: /upload|archive|delete|visibility|version/i })).toBeNull();
  });

  test("finds core records and actions from the global keyboard search", async () => {
    render(<WorkspaceSearch controller={controller()} />);

    const input = screen.getByRole("searchbox", { name: "Search Workspace" });
    await userEvent.type(input, "main");
    expect(screen.getByRole("link", { name: /Main cut/ }).getAttribute("href")).toBe("/relay/projects/project_launch#outputs");
    await userEvent.clear(input);
    await userEvent.type(input, "new project");
    expect(screen.getByRole("link", { name: /New Project/ }).getAttribute("href")).toBe("/relay/projects?new=true");
  });
});
