import { describe, expect, test } from "vitest";
import { addMediaVersion, normalizeMediaSource, salaryProjectCount, type ProjectOutput } from "./project-output";
import type { ProjectRecord } from "./project";
import { copyProjectSetup, createDefaultWorkflowTemplate } from "./workflow-template";

const project = (overrides: Partial<ProjectRecord> = {}): ProjectRecord => ({
  id: "project_alpha",
  name: "Alpha",
  clientId: "client_acme",
  stage: "Delivered",
  dueDate: "2026-09-12",
  financialType: "salaryPlan",
  paymentState: "paid",
  lead: "owner",
  assignees: [],
  progress: 100,
  money: 0,
  archived: false,
  workflowSetup: copyProjectSetup(createDefaultWorkflowTemplate("template_default", "Default workflow")),
  completedAt: "2026-08-17T10:00:00.000Z",
  ...overrides,
});

const output = (): ProjectOutput => ({
  id: "output_main",
  projectId: "project_alpha",
  name: "Main video",
  reviewState: "approved",
  archived: false,
  versions: [{
    id: "version_1",
    number: 1,
    source: { provider: "youtube", providerId: "dQw4w9WgXcQ", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    addedAt: "2026-08-16T10:00:00.000Z",
    comments: [{ id: "comment_1", authorName: "Client", body: "Tighten the opening.", resolved: false, createdAt: "2026-08-16T11:00:00.000Z" }],
  }],
  currentVersionId: "version_1",
});

describe("Project Output media", () => {
  test("normalizes supported providers and keeps other HTTP links ordinary", () => {
    expect(normalizeMediaSource("https://youtu.be/dQw4w9WgXcQ?t=12")).toEqual({
      provider: "youtube",
      providerId: "dQw4w9WgXcQ",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });
    expect(normalizeMediaSource("https://player.vimeo.com/video/987654321?autoplay=1")).toEqual({
      provider: "vimeo",
      providerId: "987654321",
      url: "https://vimeo.com/987654321",
    });
    expect(normalizeMediaSource("https://example.com/review/cut-2?view=team")).toEqual({
      provider: "link",
      providerId: null,
      url: "https://example.com/review/cut-2?view=team",
    });
    expect(normalizeMediaSource("<iframe src=\"https://youtube.com/embed/dQw4w9WgXcQ\"></iframe>")).toBeNull();
    expect(normalizeMediaSource("javascript:alert(1)")).toBeNull();
    expect(normalizeMediaSource("https://youtube.com/watch?v=bad")).toBeNull();
    expect(normalizeMediaSource("https://vimeo.com/not-a-video")).toBeNull();
  });

  test("makes a new version current and keeps unresolved old-version Comments visible", () => {
    const next = addMediaVersion(output(), {
      id: "version_2",
      url: "https://vimeo.com/987654321",
      addedAt: "2026-08-17T10:00:00.000Z",
    });
    if (!next) throw new Error("Expected a valid Media Version.");

    expect(next).toMatchObject({ currentVersionId: "version_2", reviewState: "in_review" });
    expect(next.versions).toHaveLength(2);
    expect(next.versions[0].comments).toEqual([{ id: "comment_1", authorName: "Client", body: "Tighten the opening.", resolved: false, createdAt: "2026-08-16T11:00:00.000Z" }]);
    expect(next.unresolvedPreviousComments).toBe(1);
  });

  test("counts delivered salary work by Project, never by Output or Media Version", () => {
    expect(salaryProjectCount([project()])).toBe(1);
    expect(salaryProjectCount([project(), project({ id: "project_beta" })])).toBe(2);
  });
});
