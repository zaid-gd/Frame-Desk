export const MAX_RELAY_PROJECTS = 500;

export type WorkspaceProject = {
  name: string;
  client: string;
  stage: string;
  tone: "review" | "delivered" | "overdue" | "planned";
  due: string;
  progress: string;
};

const projectKeys = ["name", "client", "stage", "tone", "due", "progress"] as const;
const textByteLimits = { name: 200, client: 200, stage: 80, due: 80, progress: 40 } as const;

function safeText(value: unknown, maxBytes: number): value is string {
  return typeof value === "string"
    && new TextEncoder().encode(value).byteLength <= maxBytes
    && !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value);
}

export function isWorkspaceProject(value: unknown): value is WorkspaceProject {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((key) => !projectKeys.includes(key as typeof projectKeys[number]))) return false;
  return safeText(record.name, textByteLimits.name)
    && safeText(record.client, textByteLimits.client)
    && safeText(record.stage, textByteLimits.stage)
    && ["review", "delivered", "overdue", "planned"].includes(String(record.tone))
    && safeText(record.due, textByteLimits.due)
    && safeText(record.progress, textByteLimits.progress);
}
