import { MAX_RELAY_BACKUP_BYTES, previewWorkspaceBackup } from "../domain/workspace-backup";

export async function previewBrowserBackupFile(file: File) {
  if (file.size > MAX_RELAY_BACKUP_BYTES) return { ok: false as const, error: "This backup is too large. Choose a file smaller than 512 KB." };
  try {
    const preview = previewWorkspaceBackup(await file.text());
    return preview.ok
      ? { ok: true as const, prepared: { backup: preview.backup, fileName: file.name, counts: preview.counts } }
      : preview;
  } catch {
    return { ok: false as const, error: "Relay could not read this file. Choose another JSON backup." };
  }
}
