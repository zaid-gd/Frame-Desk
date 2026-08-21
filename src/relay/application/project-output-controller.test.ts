import { describe, expect, test } from "vitest";
import { createMemoryProjectPort } from "../infrastructure/memory-project-port";
import { copyProjectSetup, createDefaultWorkflowTemplate } from "../domain/workflow-template";
import type { ProjectRecord } from "../domain/project";
import type { ProjectOutput } from "../domain/project-output";
import { createProjectOutputController } from "./project-output-controller";

describe("Project Outputs and Media Versions", () => {
  const setup = copyProjectSetup(createDefaultWorkflowTemplate("template_default", "Default workflow"));
  const salaryProject: ProjectRecord = {
    id: "project_alpha", name: "Alpha", clientId: "client_acme", stage: "Delivered", dueDate: "2026-09-12",
    financialType: "salaryPlan", paymentState: "paid", lead: "owner", assignees: [], progress: 100,
    money: 0, archived: false, workflowSetup: setup, completedAt: "2026-08-10T09:00:00.000Z",
  };
  const output: ProjectOutput = {
    id: "output_main", projectId: salaryProject.id, name: "Main video", reviewState: "approved", archived: false,
    versions: [{ id: "version_1", number: 1, source: { provider: "youtube", providerId: "dQw4w9WgXcQ", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }, addedAt: "2026-08-16T10:00:00.000Z", comments: [{ id: "comment_1", authorName: "Client", body: "Tighten the opening.", resolved: false, createdAt: "2026-08-16T11:00:00.000Z" }] }],
    currentVersionId: "version_1",
  };

  test("manages Output slots and version history without changing the Project count", async () => {
    const port = createMemoryProjectPort({ projects: [salaryProject], outputs: [output], now: () => "2026-08-17T10:00:00.000Z" });
    const controller = createProjectOutputController({ port });

    await expect(controller.actions.add({ name: "Short cut" })).resolves.toMatchObject({ ok: true, message: "Project Output added." });
    const short = controller.actions.view().rows.find(({ name }) => name === "Short cut")!;
    await expect(controller.actions.edit(short.id, { name: "Vertical short" })).resolves.toMatchObject({ ok: true });
    await expect(controller.actions.setReviewState(short.id, "changes_requested")).resolves.toMatchObject({ ok: true });
    await expect(controller.actions.setArchived(short.id, true)).resolves.toMatchObject({ ok: true });
    await expect(controller.actions.addVersion(output.id, { url: "<iframe src=bad></iframe>" })).resolves.toMatchObject({ ok: false, kind: "invalid" });
    await expect(controller.actions.addVersion(output.id, { url: "https://vimeo.com/987654321" })).resolves.toMatchObject({ ok: true });

    expect(controller.actions.view().rows).toMatchObject([
      { id: output.id, currentVersionId: expect.stringMatching(/^version_/), reviewStateLabel: "In review", unresolvedPreviousComments: 1, versions: [{ id: "version_1", current: false }, { number: 2, providerLabel: "Vimeo", current: true }] },
      { id: short.id, name: "Vertical short", reviewStateLabel: "Changes requested", archived: true, versions: [] },
    ]);
    expect(port.loadProjects()).toHaveLength(1);
  });

  test("reports loading instead of presenting a cloud subscription as empty", () => {
    const port = createMemoryProjectPort({ projects: [salaryProject] });
    port.outputState = () => ({ kind: "loading" });
    expect(createProjectOutputController({ port }).actions.view()).toEqual({ state: { kind: "loading" }, rows: [] });
  });
});
