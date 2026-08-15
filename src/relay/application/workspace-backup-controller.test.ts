import { describe, expect, test } from "vitest";
import { createWorkspaceBackupController } from "./workspace-backup-controller";
import type { RelayWorkspaceBackup } from "../domain/workspace-backup";
import type { WorkspaceBackupPort } from "../ports/workspace-backup-port";

const backup: RelayWorkspaceBackup = {
  format: "relay-local-workspace",
  version: 2,
  exportedAt: "2026-08-16T08:00:00.000Z",
  workspace: { clients: [], projects: [] },
};

function port(overrides: Partial<WorkspaceBackupPort> = {}): WorkspaceBackupPort {
  return {
    exportBackup: () => ({ ok: true }),
    previewFile: async (file) => ({ ok: true, prepared: { backup, fileName: file.name, counts: { clients: 0, projects: 0, total: 0 } } }),
    applyBackup: async () => ({ ok: true, imported: 0 }),
    ...overrides,
  };
}

describe("Relay workspace backup controller", () => {
  test("returns display-ready Local Mode backup copy and actions", async () => {
    const controller = createWorkspaceBackupController({ mode: "local", backupPort: port() });

    expect(controller.model).toMatchObject({
      available: true,
      eyebrow: "Local Mode data",
      title: "Back up and restore this Workspace",
      showExport: true,
      applyLabel: "Restore Local Mode backup",
    });
    if (!controller.actions) throw new Error("Local backup actions should be available");
    const preview = await controller.actions.previewFile(new File(["{}"], "relay.json"));
    expect(preview).toEqual({ ok: true, prepared: { backup, fileName: "relay.json", recordSummary: "0 Clients · 0 projects · 0 total records" } });
    await expect(controller.actions.applyBackup(backup)).resolves.toEqual({ ok: true, message: "Restored 0 records in Local Mode." });
  });

  test("returns cloud move copy and keeps refusal errors", async () => {
    const controller = createWorkspaceBackupController({
      mode: "cloud",
      backupPort: port({ applyBackup: async () => ({ ok: false, error: "This cloud Workspace already contains records." }) }),
    });

    expect(controller.model).toMatchObject({
      eyebrow: "One-time cloud move",
      title: "Import a Local Mode backup",
      showExport: false,
      applyLabel: "Import into cloud Workspace",
    });
    if (!controller.actions) throw new Error("Cloud backup actions should be available");
    await expect(controller.actions.applyBackup(backup)).resolves.toEqual({ ok: false, message: "This cloud Workspace already contains records." });
  });

  test("marks Sample Workspace backup tools unavailable", () => {
    expect(createWorkspaceBackupController({ mode: "sample", backupPort: null }).model).toEqual({
      available: false,
      title: "Backup and move",
      description: "Backup tools are available in Local Mode and signed-in cloud Workspaces.",
    });
  });
});
