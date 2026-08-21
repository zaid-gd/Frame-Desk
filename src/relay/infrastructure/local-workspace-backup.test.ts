import { describe, expect, test } from "vitest";
import {
  MAX_RELAY_BACKUP_BYTES,
  createLocalWorkspaceBackup,
  previewLocalWorkspaceBackup,
  restoreLocalWorkspaceBackup,
} from "./local-workspace-backup";
import { RELAY_LOCAL_PROJECTS_KEY } from "./local-workspace-port";
import { RELAY_LOCAL_CLIENTS_KEY } from "./local-client-port";
import { RELAY_LOCAL_WORKSPACE_KEY } from "./local-workspace-state";
import { createDefaultWorkflowTemplate } from "../domain/workflow-template";

const project = {
  id: "project_launch",
  name: "Launch film",
  clientId: "client_demo",
  stage: "In review",
  tone: "review" as const,
  due: "Aug 22, 2026",
  progress: "80%",
};
const client = { id: "client_demo", name: "Demo Client", company: "", contactName: "", email: "", phone: "", notes: "", archived: false };

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

describe("Local Mode workspace backups", () => {
  test("round-trips saved Workflow Templates", () => {
    const workflowTemplates = [createDefaultWorkflowTemplate("template_default", "Studio workflow")];
    const storage = memoryStorage({ [RELAY_LOCAL_WORKSPACE_KEY]: JSON.stringify({ clients: [], projects: [], workflowTemplates }) });

    const text = createLocalWorkspaceBackup(storage, "2026-08-16T08:00:00.000Z");
    const target = memoryStorage();

    expect(restoreLocalWorkspaceBackup(target, text)).toMatchObject({ ok: true, counts: { workflowTemplates: 1, total: 1 } });
    expect(JSON.parse(target.getItem(RELAY_LOCAL_WORKSPACE_KEY)!).workflowTemplates).toEqual(workflowTemplates);
  });

  test("includes durable Clients in export, preview, and restore", () => {
    const archivedClient = { ...client, name: "Acme", company: "Acme Films", contactName: "Ava", email: "ava@acme.test", phone: "555-0100", notes: "Retainer", archived: true };
    const storage = memoryStorage({ [RELAY_LOCAL_CLIENTS_KEY]: JSON.stringify([archivedClient]) });
    const text = createLocalWorkspaceBackup(storage, "2026-08-16T08:00:00.000Z");
    expect(previewLocalWorkspaceBackup(text)).toMatchObject({ ok: true, counts: { clients: 1, projects: 0, total: 1 } });
    const target = memoryStorage();
    expect(restoreLocalWorkspaceBackup(target, text)).toMatchObject({ ok: true, counts: { clients: 1, total: 1 } });
    expect(JSON.parse(target.getItem(RELAY_LOCAL_WORKSPACE_KEY)!).clients).toEqual([archivedClient]);
  });

  test("exports every supported record in a versioned JSON backup without private account data", () => {
    const storage = memoryStorage({
      [RELAY_LOCAL_PROJECTS_KEY]: JSON.stringify([project]),
      [RELAY_LOCAL_CLIENTS_KEY]: JSON.stringify([client]),
      "relay:account": JSON.stringify({ token: "private-token" }),
      "relay:theme:v1": "dark",
    });

    const backup = JSON.parse(createLocalWorkspaceBackup(storage, "2026-08-16T08:00:00.000Z"));

    expect(backup).toEqual({
      format: "relay-local-workspace",
      version: 2,
      exportedAt: "2026-08-16T08:00:00.000Z",
      workspace: { clients: [client], projects: [project] },
    });
    expect(JSON.stringify(backup)).not.toContain("private-token");
    expect(JSON.stringify(backup)).not.toContain("account");
  });

  test("previews record counts before a restore writes anything", () => {
    const storage = memoryStorage({ [RELAY_LOCAL_PROJECTS_KEY]: JSON.stringify([]) });
    const backupText = JSON.stringify({
      format: "relay-local-workspace",
      version: 2,
      exportedAt: "2026-08-16T08:00:00.000Z",
      workspace: { clients: [client], projects: [project, { ...project, name: "Trailer cut" }] },
    });

    expect(previewLocalWorkspaceBackup(backupText)).toEqual({
      ok: true,
      backup: expect.objectContaining({ workspace: { clients: [client], projects: [project, { ...project, name: "Trailer cut" }] } }),
      counts: { clients: 1, projects: 2, total: 3 },
    });
    expect(storage.getItem(RELAY_LOCAL_PROJECTS_KEY)).toBe("[]");
  });

  test.each([
    ["malformed", "{", "Choose a valid Relay JSON backup."],
    ["incompatible", JSON.stringify({ format: "relay-local-workspace", version: 1, exportedAt: "2026-08-16T08:00:00.000Z", workspace: { clients: [], projects: [] } }), "This backup uses Relay version 1. This build supports version 2."],
    ["unsafe", JSON.stringify({ format: "relay-local-workspace", version: 2, exportedAt: "2026-08-16T08:00:00.000Z", token: "do-not-import", workspace: { clients: [], projects: [] } }), "This backup contains an unsafe or unsupported field: token."],
    ["oversized", "x".repeat(MAX_RELAY_BACKUP_BYTES + 1), "This backup is too large. Choose a file smaller than 512 KB."],
  ])("rejects %s input with a clear error and preserves saved work", (_case, backupText, message) => {
    const original = JSON.stringify([project]);
    const storage = memoryStorage({ [RELAY_LOCAL_PROJECTS_KEY]: original });

    expect(restoreLocalWorkspaceBackup(storage, backupText)).toEqual({ ok: false, error: message });
    expect(storage.getItem(RELAY_LOCAL_PROJECTS_KEY)).toBe(original);
  });

  test("restores a valid backup with one atomic workspace write", () => {
    const writes: Array<[string, string]> = [];
    const storage = {
      getItem: () => JSON.stringify([{ ...project, name: "Old work" }]),
      setItem(key: string, value: string) {
        writes.push([key, value]);
      },
    };
    const backupText = JSON.stringify({
      format: "relay-local-workspace",
      version: 2,
      exportedAt: "2026-08-16T08:00:00.000Z",
      workspace: { clients: [client], projects: [project] },
    });

    expect(restoreLocalWorkspaceBackup(storage, backupText)).toEqual({ ok: true, counts: { clients: 1, projects: 1, total: 2 } });
    expect(writes).toEqual([[RELAY_LOCAL_WORKSPACE_KEY, JSON.stringify({ clients: [client], projects: [project] })]]);
  });

  test("reports a failed storage write without claiming a restore", () => {
    const storage = {
      getItem: () => JSON.stringify([{ ...project, name: "Old work" }]),
      setItem() {
        throw new Error("quota");
      },
    };
    const backupText = JSON.stringify({
      format: "relay-local-workspace",
      version: 2,
      exportedAt: "2026-08-16T08:00:00.000Z",
      workspace: { clients: [client], projects: [project] },
    });

    expect(restoreLocalWorkspaceBackup(storage, backupText)).toEqual({
      ok: false,
      error: "Browser storage refused the restore. Your saved Local Mode work was not changed.",
    });
  });

  test("rejects dangling Client identifiers before a Local Mode write", () => {
    const storage = memoryStorage({ [RELAY_LOCAL_WORKSPACE_KEY]: JSON.stringify({ clients: [client], projects: [] }) });
    const backupText = JSON.stringify({ format: "relay-local-workspace", version: 2, exportedAt: "2026-08-16T08:00:00.000Z", workspace: { clients: [], projects: [project] } });
    expect(restoreLocalWorkspaceBackup(storage, backupText)).toEqual({ ok: false, error: "Every Project in this backup must refer to one Client identifier." });
    expect(JSON.parse(storage.getItem(RELAY_LOCAL_WORKSPACE_KEY)!)).toEqual({ clients: [client], projects: [] });
  });

  test("every supported Local Mode project set exports as an importable backup", () => {
    const projects = Array.from({ length: 500 }, () => ({
      id: "i".repeat(100),
      name: "n".repeat(200),
      clientId: "client_demo",
      stage: "s".repeat(80),
      tone: "review" as const,
      due: "d".repeat(80),
      progress: "p".repeat(40),
    }));
    const storage = memoryStorage({ [RELAY_LOCAL_PROJECTS_KEY]: JSON.stringify(projects), [RELAY_LOCAL_CLIENTS_KEY]: JSON.stringify([client]) });

    const preview = previewLocalWorkspaceBackup(createLocalWorkspaceBackup(storage, "2026-08-16T08:00:00.000Z"));

    expect(preview).toMatchObject({ ok: true, counts: { clients: 1, projects: 500, total: 501 } });
  });
});
