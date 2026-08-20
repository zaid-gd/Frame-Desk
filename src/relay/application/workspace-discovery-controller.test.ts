import { describe, expect, test } from "vitest";
import { copyProjectSetup, createDefaultWorkflowTemplate } from "../domain/workflow-template";
import type { ProjectRecord } from "../domain/project";
import type { ProjectOutput } from "../domain/project-output";
import { createWorkspaceDiscoveryController } from "./workspace-discovery-controller";

const setup = copyProjectSetup(createDefaultWorkflowTemplate("template_default", "Default workflow"));
const projects: ProjectRecord[] = [
  { id: "project_active", name: "Launch film", clientId: "client_active", projectGroupId: "group_active", stage: "Client Review", dueDate: "2026-09-12", financialType: "projectValue", paymentState: "unpaid", archived: false, lead: "Owner", assignees: [], progress: 60, money: 1200, workflowSetup: setup },
  { id: "project_archived", name: "Secret archive", clientId: "client_archived", stage: "Delivered", dueDate: "2026-08-01", financialType: "nonBillable", paymentState: "not-applicable", archived: true, lead: "Owner", assignees: [], progress: 100, money: 0, workflowSetup: setup },
];
const outputs: ProjectOutput[] = [
  { id: "output_active", projectId: "project_active", name: "Main cut", reviewState: "in_review", archived: false, relativeDeadlineDays: -2, currentVersionId: "version_1", versions: [{ id: "version_1", number: 1, source: { provider: "vimeo", providerId: "987654321", url: "https://vimeo.com/987654321" }, addedAt: "2026-09-08T09:00:00.000Z", comments: [] }] },
  { id: "output_archived", projectId: "project_active", name: "Hidden cut", reviewState: "draft", archived: true, versions: [] },
];

function controller() {
  return createWorkspaceDiscoveryController({
    clients: [
      { id: "client_active", name: "Acme", archived: false },
      { id: "client_archived", name: "Old client", archived: true },
    ],
    projects,
    groups: [
      { id: "group_active", name: "Launch campaign", clientId: "client_active", archived: false },
      { id: "group_archived", name: "Past campaign", clientId: "client_active", archived: true },
    ],
    outputs,
    files: [{ id: "file_brief", projectId: "project_active", title: "Launch brief", fileName: "brief.pdf", mimeType: "application/pdf", size: 1200, archived: false, portalVisible: false, allowDownload: false, accessUrl: "https://files.example/brief" }],
    calendarFeedUrl: "webcal://example.test/relay-calendar.ics?token=safe",
  });
}

describe("Workspace discovery public interface", () => {
  test("builds read-only Project, Output, review, and payment calendar events", () => {
    const model = controller().model;

    expect(model.calendar.events.map(({ kind, date, title }) => ({ kind, date, title }))).toEqual([
      { kind: "review", date: "2026-09-08", title: "Main cut review" },
      { kind: "output", date: "2026-09-10", title: "Main cut due" },
      { kind: "payment", date: "2026-09-12", title: "Launch film payment due" },
      { kind: "project", date: "2026-09-12", title: "Launch film due" },
    ]);
    expect(model.calendar.feedUrl).toContain("relay-calendar.ics");
  });

  test("indexes stored files and linked Media Versions without write actions", () => {
    expect(controller().actions.searchFiles("launch")).toEqual([
      expect.objectContaining({ kind: "stored-file", title: "Launch brief", projectName: "Launch film", ownerUrl: "/relay/projects/project_active#files" }),
      expect.objectContaining({ kind: "media-version", title: "Main cut v1", projectName: "Launch film", ownerUrl: "/relay/projects/project_active#outputs" }),
    ]);
  });

  test("searches active allowed records and common actions while excluding archives", () => {
    const actions = controller().actions;

    expect(actions.search("launch").map(({ kind, title }) => ({ kind, title }))).toEqual([
      { kind: "project", title: "Launch film" },
      { kind: "project-group", title: "Launch campaign" },
      { kind: "project-output", title: "Main cut" },
    ]);
    expect(actions.search("main")).toEqual([expect.objectContaining({ kind: "project-output", title: "Main cut", href: "/relay/projects/project_active#outputs" })]);
    expect(actions.search("new project")).toEqual([expect.objectContaining({ kind: "action", title: "New Project" })]);
    expect(actions.search("secret old hidden past")).toEqual([]);
  });
});
