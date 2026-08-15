"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import type { WorkspacePort, WorkspaceProject } from "../ports/workspace-port";

const listCloudProjects = makeFunctionReference<"query", Record<string, never>, WorkspaceProject[]>("relayWorkspaceImport:listMine");

export function createCloudWorkspacePort(projects: readonly WorkspaceProject[] = []): WorkspacePort {
  return {
    loadProjects() {
      return projects;
    },
    async requestNewProject() {
      return { ok: false, error: { kind: "unavailable", message: "Cloud project creation is not part of this Relay shell ticket." } };
    },
  };
}

export function useCloudWorkspacePort(enabled: boolean): WorkspacePort {
  const projects = useQuery(listCloudProjects, enabled ? {} : "skip");
  return useMemo(() => createCloudWorkspacePort(projects ?? []), [projects]);
}
