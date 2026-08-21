import {
  previewWorkspaceBackup,
  serializeWorkspaceBackup,
  type RelayWorkspaceBackup,
} from "../domain/workspace-backup";
import type { WorkspaceBackupPort } from "../ports/workspace-backup-port";
import { previewBrowserBackupFile } from "./browser-workspace-backup";
import { createLocalWorkspacePort } from "./local-workspace-port";
import { createLocalClientPort } from "./local-client-port";
import { readLocalWorkspaceState, RELAY_LOCAL_WORKSPACE_KEY } from "./local-workspace-state";

export * from "../domain/workspace-backup";
export { MAX_RELAY_PROJECTS as MAX_RELAY_BACKUP_PROJECTS } from "../domain/workspace-project";

type BackupStorage = Pick<Storage, "getItem" | "setItem">;

export function createLocalWorkspaceBackup(storage: BackupStorage, exportedAt = new Date().toISOString()) {
  return serializeWorkspaceBackup(createLocalWorkspacePort(storage).loadProjects(), createLocalClientPort(storage).loadClients(), exportedAt, readLocalWorkspaceState(storage)?.workflowTemplates ?? []);
}

export function previewLocalWorkspaceBackup(text: string) {
  return previewWorkspaceBackup(text);
}

export function restoreLocalWorkspaceBackup(storage: BackupStorage, text: string):
  | { ok: true; counts: { clients: number; projects: number; workflowTemplates?: number; total: number } }
  | { ok: false; error: string } {
  const preview = previewWorkspaceBackup(text);
  if (!preview.ok) return preview;
  try {
    storage.setItem(RELAY_LOCAL_WORKSPACE_KEY, JSON.stringify(preview.backup.workspace));
    return { ok: true, counts: preview.counts };
  } catch {
    return { ok: false, error: "Browser storage refused the restore. Your saved Local Mode work was not changed." };
  }
}

function downloadJson(text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `relay-local-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function createLocalWorkspaceBackupPort(storage: BackupStorage, download: (text: string) => void = downloadJson, onRestore: () => void = () => undefined): WorkspaceBackupPort {
  return {
    exportBackup() {
      try {
        download(createLocalWorkspaceBackup(storage));
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "Relay could not export this Local Mode backup." };
      }
    },
    previewFile: previewBrowserBackupFile,
    async applyBackup(backup: RelayWorkspaceBackup) {
      const result = restoreLocalWorkspaceBackup(storage, JSON.stringify(backup));
      if (!result.ok) return result;
      onRestore();
      return { ok: true, imported: result.counts.total };
    },
  };
}
