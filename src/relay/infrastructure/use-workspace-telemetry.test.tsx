// @vitest-environment jsdom

import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { createTelemetryBoundary, type TelemetryTransport } from "../domain/telemetry";
import { useWorkspaceTelemetry, type WorkspaceMeasures } from "./use-workspace-telemetry";

const empty: WorkspaceMeasures = { projects: 0, delivered: 0, comments: 0, plans: 0, batches: 0, storage: 0 };

describe("workspace telemetry", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  test("does not count existing cloud records as new activity after hydration", () => {
    const send = vi.fn<TelemetryTransport>().mockResolvedValue(undefined);
    const telemetry = createTelemetryBoundary({ analyticsEnabled: true, send });
    const { rerender } = renderHook((props: { ready: boolean; measures: WorkspaceMeasures }) => useWorkspaceTelemetry({
      analyticsEnabled: true, hydrated: true, mode: "cloud", ready: props.ready, workspaceOpen: true, measures: props.measures, telemetry,
    }), { initialProps: { ready: false, measures: empty } });

    rerender({ ready: true, measures: { projects: 4, delivered: 2, comments: 7, plans: 1, batches: 1, storage: 4_000_000 } });

    const events = send.mock.calls.map(([payload]) => payload.category === "analytics" ? payload.event.name : payload.category);
    expect(events).toContain("activation");
    expect(events).toContain("weekly_return");
    expect(events).not.toContain("project_delivered");
    expect(events).not.toContain("comment_created");
    expect(events).not.toContain("storage_consumed");
  });
});
