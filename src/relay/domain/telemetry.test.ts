import { describe, expect, test, vi } from "vitest";
import { createTelemetryBoundary, type TelemetryTransport } from "./telemetry";

const sensitive = {
  clientName: "Northstar Pictures",
  projectName: "Secret Launch Film",
  comment: "Replace the ending at 01:14",
  fileName: "northstar-final-v7.mp4",
  link: "https://example.com/private/review",
  portalToken: "portal-secret-123",
  amount: 42_750,
};

describe("Relay telemetry boundary", () => {
  test("does not send optional analytics before Local Mode consent", async () => {
    const send = vi.fn<TelemetryTransport>();
    const telemetry = createTelemetryBoundary({ analyticsEnabled: false, send });

    await telemetry.track({ name: "activation", milestone: "local_workspace_opened" });

    expect(send).not.toHaveBeenCalled();
  });

  test("sends every private-beta outcome using privacy-safe fields", async () => {
    const send = vi.fn<TelemetryTransport>().mockResolvedValue(undefined);
    const telemetry = createTelemetryBoundary({ analyticsEnabled: true, send });
    const events = [
      { name: "activation", milestone: "first_project_created" },
      { name: "weekly_return", week: "2026-08-17" },
      { name: "project_delivered", count: 1 },
      { name: "client_portal_opened", count: 1 },
      { name: "comment_created", count: 1 },
      { name: "salary_plan_used", count: 1 },
      { name: "salary_batch_created", count: 1 },
      { name: "storage_consumed", bytes: 20_000_000 },
    ] as const;

    for (const event of events) await telemetry.track({ ...event, ...sensitive });

    expect(send.mock.calls.map(([payload]) => payload)).toEqual(events.map((event) => ({ category: "analytics", event })));
    expect(JSON.stringify(send.mock.calls)).not.toContain("Northstar Pictures");
    expect(JSON.stringify(send.mock.calls)).not.toContain("Secret Launch Film");
    expect(JSON.stringify(send.mock.calls)).not.toContain("Replace the ending");
    expect(JSON.stringify(send.mock.calls)).not.toContain("northstar-final-v7.mp4");
    expect(JSON.stringify(send.mock.calls)).not.toContain("https://example.com");
    expect(JSON.stringify(send.mock.calls)).not.toContain("portal-secret-123");
    expect(JSON.stringify(send.mock.calls)).not.toContain("42750");
  });

  test("keeps essential error reports separate and strips work data", async () => {
    const send = vi.fn<TelemetryTransport>().mockResolvedValue(undefined);
    const telemetry = createTelemetryBoundary({ analyticsEnabled: false, send });

    const error = new Error(`Upload failed for ${sensitive.fileName} at ${sensitive.link}`);
    error.name = sensitive.projectName;
    await telemetry.reportError(error, {
      operation: "project_file_upload",
      ...sensitive,
    });

    expect(send).toHaveBeenCalledWith({
      category: "essential_error",
      error: { name: "Error", operation: "project_file_upload" },
    });
  });
});
