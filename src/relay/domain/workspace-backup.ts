import { isWorkspaceProject, MAX_RELAY_PROJECTS, type WorkspaceProject } from "./workspace-project";

export const RELAY_BACKUP_FORMAT = "relay-local-workspace";
export const RELAY_BACKUP_VERSION = 1;
export const MAX_RELAY_BACKUP_BYTES = 512 * 1024;

const forbiddenFields = /^(?:account|auth|credential|credentials|identity|password|secret|token|api[-_]?key|access[-_]?key)$/i;

export type RelayWorkspaceBackup = {
  format: typeof RELAY_BACKUP_FORMAT;
  version: typeof RELAY_BACKUP_VERSION;
  exportedAt: string;
  workspace: { projects: WorkspaceProject[] };
};

export type BackupCounts = { projects: number; total: number };
export type BackupPreviewResult =
  | { ok: true; backup: RelayWorkspaceBackup; counts: BackupCounts }
  | { ok: false; error: string };

function byteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

function findForbiddenField(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const field = findForbiddenField(item);
      if (field) return field;
    }
    return null;
  }
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenFields.test(key) || key === "__proto__" || key === "constructor" || key === "prototype") return key;
    const field = findForbiddenField(child);
    if (field) return field;
  }
  return null;
}

function unexpectedKey(value: object, allowed: readonly string[]) {
  return Object.keys(value).find((key) => !allowed.includes(key)) ?? null;
}

export function serializeWorkspaceBackup(projects: readonly WorkspaceProject[], exportedAt = new Date().toISOString()) {
  const backup: RelayWorkspaceBackup = {
    format: RELAY_BACKUP_FORMAT,
    version: RELAY_BACKUP_VERSION,
    exportedAt,
    workspace: { projects: [...projects] },
  };
  const text = JSON.stringify(backup, null, 2);
  if (projects.length > MAX_RELAY_PROJECTS || !projects.every(isWorkspaceProject) || byteLength(text) > MAX_RELAY_BACKUP_BYTES) {
    throw new Error("Relay cannot export this Local Mode data because it exceeds the supported backup limits.");
  }
  return text;
}

export function previewWorkspaceBackup(text: string): BackupPreviewResult {
  if (byteLength(text) > MAX_RELAY_BACKUP_BYTES) return { ok: false, error: "This backup is too large. Choose a file smaller than 512 KB." };
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { ok: false, error: "Choose a valid Relay JSON backup." };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, error: "Choose a valid Relay JSON backup." };
  const forbidden = findForbiddenField(value);
  if (forbidden) return { ok: false, error: `This backup contains an unsafe or unsupported field: ${forbidden}.` };
  const record = value as Record<string, unknown>;
  const unsupportedTopLevel = unexpectedKey(record, ["format", "version", "exportedAt", "workspace"]);
  if (unsupportedTopLevel) return { ok: false, error: `This backup contains an unsafe or unsupported field: ${unsupportedTopLevel}.` };
  if (record.format !== RELAY_BACKUP_FORMAT) return { ok: false, error: "This file is not a Relay Local Mode backup." };
  if (record.version !== RELAY_BACKUP_VERSION) {
    const shownVersion = typeof record.version === "number" || typeof record.version === "string" ? record.version : "unknown";
    return { ok: false, error: `This backup uses Relay version ${shownVersion}. This build supports version 1.` };
  }
  if (typeof record.exportedAt !== "string" || record.exportedAt.length > 40 || Number.isNaN(Date.parse(record.exportedAt))) {
    return { ok: false, error: "This backup has an invalid export date." };
  }
  if (!record.workspace || typeof record.workspace !== "object" || Array.isArray(record.workspace)) return { ok: false, error: "This backup does not contain a valid Relay workspace." };
  const workspace = record.workspace as Record<string, unknown>;
  const unsupportedWorkspaceField = unexpectedKey(workspace, ["projects"]);
  if (unsupportedWorkspaceField) return { ok: false, error: `This backup contains an unsafe or unsupported field: ${unsupportedWorkspaceField}.` };
  if (!Array.isArray(workspace.projects) || workspace.projects.length > MAX_RELAY_PROJECTS) return { ok: false, error: `This backup must contain no more than ${MAX_RELAY_PROJECTS} projects.` };
  if (!workspace.projects.every(isWorkspaceProject)) return { ok: false, error: "This backup contains an invalid project record." };
  const backup = value as RelayWorkspaceBackup;
  return { ok: true, backup, counts: { projects: backup.workspace.projects.length, total: backup.workspace.projects.length } };
}
