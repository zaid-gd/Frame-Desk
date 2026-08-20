"use client";

import { useEffect, useRef } from "react";
import type { WorkspaceMode } from "../application/entry-controller";
import type { createTelemetryBoundary } from "../domain/telemetry";

type TelemetryBoundary = ReturnType<typeof createTelemetryBoundary>;
export type WorkspaceMeasures = { projects: number; delivered: number; comments: number; plans: number; batches: number; storage: number };

export function useWorkspaceTelemetry({ analyticsEnabled, hydrated, mode, ready, workspaceOpen, measures, telemetry }: {
  analyticsEnabled: boolean;
  hydrated: boolean;
  mode: WorkspaceMode;
  ready: boolean;
  workspaceOpen: boolean;
  measures: WorkspaceMeasures;
  telemetry: TelemetryBoundary;
}) {
  const priorMeasures = useRef<WorkspaceMeasures | null>(null);

  useEffect(() => {
    if (!analyticsEnabled || !hydrated || !workspaceOpen || mode === "sample") return;
    if (mode === "cloud" && sessionStorage.getItem("relay:analytics:cloud-activation:v1") !== "sent") {
      sessionStorage.setItem("relay:analytics:cloud-activation:v1", "sent");
      void telemetry.track({ name: "activation", milestone: "cloud_workspace_opened" });
    }
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    const week = date.toISOString().slice(0, 10);
    const key = "relay:analytics:last-week:v1";
    if (localStorage.getItem(key) === week) return;
    localStorage.setItem(key, week);
    void telemetry.track({ name: "weekly_return", week });
  }, [analyticsEnabled, hydrated, mode, telemetry, workspaceOpen]);

  useEffect(() => {
    if (!hydrated) return;
    const reportWindowError = (event: ErrorEvent) => { void telemetry.reportError(event.error, { operation: "browser_runtime" }); };
    const reportRejection = (event: PromiseRejectionEvent) => { void telemetry.reportError(event.reason, { operation: "unhandled_promise" }); };
    window.addEventListener("error", reportWindowError);
    window.addEventListener("unhandledrejection", reportRejection);
    return () => {
      window.removeEventListener("error", reportWindowError);
      window.removeEventListener("unhandledrejection", reportRejection);
    };
  }, [hydrated, telemetry]);

  useEffect(() => {
    if (!ready) {
      priorMeasures.current = null;
      return;
    }
    const prior = priorMeasures.current;
    priorMeasures.current = measures;
    if (!prior) return;
    if (prior.projects === 0 && measures.projects > 0) void telemetry.track({ name: "activation", milestone: "first_project_created" });
    if (measures.delivered > prior.delivered) void telemetry.track({ name: "project_delivered", count: measures.delivered - prior.delivered });
    if (measures.comments > prior.comments) void telemetry.track({ name: "comment_created", count: measures.comments - prior.comments });
    if (measures.plans > prior.plans) void telemetry.track({ name: "salary_plan_used", count: measures.plans - prior.plans });
    if (measures.batches > prior.batches) void telemetry.track({ name: "salary_batch_created", count: measures.batches - prior.batches });
    if (measures.storage !== prior.storage) void telemetry.track({ name: "storage_consumed", bytes: measures.storage });
  }, [measures, ready, telemetry]);
}
