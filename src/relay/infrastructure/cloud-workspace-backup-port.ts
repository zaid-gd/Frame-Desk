"use client";

import { useMemo } from "react";
import { useMutation } from "convex/react";
import { makeFunctionReference } from "convex/server";
import type { WorkspaceBackupPort } from "../ports/workspace-backup-port";
import type { RelayWorkspaceBackup } from "../domain/workspace-backup";
import type { WorkspaceProject } from "../domain/workspace-project";
import type { RelayClient } from "../domain/client";
import { previewBrowserBackupFile } from "./browser-workspace-backup";

type CloudImportResult = { ok: true; imported: number } | { ok: false; error: string };
const importCloudWorkspace = makeFunctionReference<"mutation", { projects: WorkspaceProject[]; clients: RelayClient[] }, CloudImportResult>("relayWorkspaceImport:importLocalWorkspace");

export function useCloudWorkspaceBackupPort(): WorkspaceBackupPort {
  const runImport = useMutation(importCloudWorkspace);
  return useMemo(() => ({
    exportBackup: () => ({ ok: false as const, error: "Cloud backup export is not part of this Local Mode move." }),
    previewFile: previewBrowserBackupFile,
    async applyBackup(backup: RelayWorkspaceBackup) {
      try {
        const result = await runImport({ projects: backup.workspace.projects, clients: backup.workspace.clients });
        return result.ok ? result : { ok: false as const, error: result.error };
      } catch (error) {
        return { ok: false as const, error: error instanceof Error ? error.message : "Relay could not import this backup." };
      }
    },
  }), [runImport]);
}
