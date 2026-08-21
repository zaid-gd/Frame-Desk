import type { BackupCounts, BackupPreviewResult, RelayWorkspaceBackup } from "../domain/workspace-backup";

export type PreparedWorkspaceBackup = {
  backup: RelayWorkspaceBackup;
  fileName: string;
  counts: BackupCounts;
};

export type WorkspaceBackupPort = {
  exportBackup(): { ok: true } | { ok: false; error: string };
  previewFile(file: File): Promise<
    | { ok: true; prepared: PreparedWorkspaceBackup }
    | Extract<BackupPreviewResult, { ok: false }>
  >;
  applyBackup(backup: RelayWorkspaceBackup): Promise<
    | { ok: true; imported: number }
    | { ok: false; error: string }
  >;
};
