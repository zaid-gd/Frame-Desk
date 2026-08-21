export const MAX_RELAY_CLIENTS = 500;

export type ClientId = string;

export type RelayClient = {
  id: ClientId;
  name: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  notes: string;
  archived: boolean;
};

export type ClientInput = Omit<RelayClient, "id" | "archived">;
export type ClientProject = {
  id: string;
  clientId: ClientId;
  name: string;
  stage: string;
  tone: "review" | "delivered" | "overdue" | "planned";
  due: string;
  progress: string;
  status: "active" | "past";
  outstandingAmount: number;
  projectGroupId?: string;
  portalUrl?: string;
};
export type ClientProjectGroup = { id: string; clientId: ClientId; name: string };

const clientKeys = ["id", "name", "company", "contactName", "email", "phone", "notes", "archived"] as const;
const limits = { id: 100, name: 200, company: 200, contactName: 200, email: 320, phone: 80, notes: 4000 } as const;

function validText(value: unknown, limit: number) {
  return typeof value === "string" && new TextEncoder().encode(value).byteLength <= limit && !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value);
}

export function isRelayClient(value: unknown): value is RelayClient {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return !Object.keys(row).some((key) => !clientKeys.includes(key as typeof clientKeys[number]))
    && validText(row.id, limits.id) && row.id !== ""
    && validText(row.name, limits.name) && String(row.name).trim() !== ""
    && validText(row.company, limits.company)
    && validText(row.contactName, limits.contactName)
    && validText(row.email, limits.email)
    && (row.email === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(row.email)))
    && validText(row.phone, limits.phone)
    && validText(row.notes, limits.notes)
    && typeof row.archived === "boolean";
}

export function validateClientInput(input: ClientInput): string | null {
  return isRelayClient({ id: "pending", archived: false, ...input }) ? null : "Enter a name and valid Client details before saving.";
}
