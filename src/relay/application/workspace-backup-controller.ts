import type { WorkspaceMode } from "./entry-controller";
import type { RelayWorkspaceBackup } from "../domain/workspace-backup";
import type { WorkspaceBackupPort } from "../ports/workspace-backup-port";

export type PreparedBackupView = {
  backup: RelayWorkspaceBackup;
  fileName: string;
  recordSummary: string;
};

export function createWorkspaceBackupController({ mode, backupPort }: { mode: WorkspaceMode; backupPort: WorkspaceBackupPort | null }) {
  if (mode === "sample" || !backupPort) {
    return {
      model: { available: false as const, title: "Backup and move", description: "Backup tools are available in Local Mode and signed-in cloud Workspaces." },
      actions: null,
    };
  }
  const cloud = mode === "cloud";
  return {
    model: {
      available: true as const,
      eyebrow: cloud ? "One-time cloud move" : "Local Mode data",
      title: cloud ? "Import a Local Mode backup" : "Back up and restore this Workspace",
      description: cloud
        ? "Relay will import only into a signed-in cloud Workspace with no saved records. It will never merge or delete either source."
        : "Download a safe JSON copy, or check and restore a prior Relay backup. A restore replaces Local Mode records only after the full file passes validation.",
      showExport: !cloud,
      exportTitle: "Download current work",
      exportDescription: "The backup includes all supported Local Mode project records. It excludes account and secret data.",
      exportLabel: "Download JSON backup",
      fileTitle: "Choose a Relay JSON backup",
      fileDescription: "Maximum file size: 512 KB. Relay checks the version, fields, and every record before a write.",
      applyLead: cloud ? "Ready to import" : "Ready to restore",
      applyLabel: cloud ? "Import into cloud Workspace" : "Restore Local Mode backup",
    },
    actions: {
      exportBackup: () => backupPort.exportBackup(),
      async previewFile(file: File): Promise<{ ok: true; prepared: PreparedBackupView } | { ok: false; error: string }> {
        const result = await backupPort.previewFile(file);
        if (!result.ok) return result;
        const projectNoun = result.prepared.counts.projects === 1 ? "project" : "projects";
        const clientNoun = result.prepared.counts.clients === 1 ? "Client" : "Clients";
        const recordNoun = result.prepared.counts.total === 1 ? "record" : "records";
        return {
          ok: true,
          prepared: {
            backup: result.prepared.backup,
            fileName: result.prepared.fileName,
            recordSummary: `${result.prepared.counts.clients} ${clientNoun} · ${result.prepared.counts.projects} ${projectNoun} · ${result.prepared.counts.total} total ${recordNoun}`,
          },
        };
      },
      async applyBackup(backup: RelayWorkspaceBackup) {
        const result = await backupPort.applyBackup(backup);
        if (!result.ok) return { ok: false as const, message: result.error };
        const noun = result.imported === 1 ? "record" : "records";
        return {
          ok: true as const,
          message: cloud ? `Imported ${result.imported} ${noun} into the cloud Workspace.` : `Restored ${result.imported} ${noun} in Local Mode.`,
        };
      },
    },
  };
}

export type WorkspaceBackupController = ReturnType<typeof createWorkspaceBackupController>;
