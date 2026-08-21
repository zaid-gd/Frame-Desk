import { isRelayClient, MAX_RELAY_CLIENTS, validateClientInput, type ClientInput, type RelayClient } from "../domain/client";
import type { ClientPort } from "../ports/client-port";
import { readLocalWorkspaceState, RELAY_LOCAL_WORKSPACE_KEY } from "./local-workspace-state";
import { RELAY_LOCAL_PROJECTS_KEY } from "./local-workspace-port";
import { isWorkspaceProject } from "../domain/workspace-project";

export const RELAY_LOCAL_CLIENTS_KEY = "relay:local-clients:v1";
type ClientStorage = Pick<Storage, "getItem" | "setItem">;

export function createLocalClientPort(storage?: ClientStorage, createId = () => `client_${crypto.randomUUID()}`, projects: ClientPort["loadProjects"] = () => [], groups: ClientPort["loadProjectGroups"] = () => []): ClientPort {
  const target = () => storage ?? (typeof window === "undefined" ? undefined : window.localStorage);
  const loadClients = (): RelayClient[] => {
    try {
      const storageTarget = target();
      const parsed: unknown = storageTarget ? (readLocalWorkspaceState(storageTarget)?.clients ?? JSON.parse(storageTarget.getItem(RELAY_LOCAL_CLIENTS_KEY) ?? "[]")) : [];
      return Array.isArray(parsed) && parsed.length <= MAX_RELAY_CLIENTS && parsed.every(isRelayClient) ? parsed : [];
    } catch { return []; }
  };
  const save = (clients: readonly RelayClient[]) => {
    try {
      const storageTarget = target();
      if (!storageTarget) return "Browser storage is unavailable.";
      const state = readLocalWorkspaceState(storageTarget);
      const legacyProjects: unknown = JSON.parse(storageTarget.getItem(RELAY_LOCAL_PROJECTS_KEY) ?? "[]");
      const candidateProjects: unknown = state?.projects ?? legacyProjects;
      const projects = Array.isArray(candidateProjects) && candidateProjects.every(isWorkspaceProject) ? candidateProjects : [];
      storageTarget.setItem(RELAY_LOCAL_WORKSPACE_KEY, JSON.stringify({ ...state, clients, projects }));
      return null;
    }
    catch { return "Browser storage refused the Client update."; }
  };
  return {
    loadClients,
    loadProjects: projects,
    loadProjectGroups: groups,
    canViewMoney: () => true,
    async createClient(input: ClientInput) {
      const error = validateClientInput(input);
      if (error) return { ok: false, error: { kind: "unavailable", message: error } };
      const clients = loadClients();
      if (clients.length >= MAX_RELAY_CLIENTS) return { ok: false, error: { kind: "unavailable", message: "Local Mode supports up to 500 Clients." } };
      const client = { id: createId(), archived: false, ...input };
      const writeError = save([...clients, client]);
      return writeError ? { ok: false, error: { kind: "unavailable", message: writeError } } : { ok: true, client };
    },
    async editClient(id, changes) {
      const clients = loadClients();
      const index = clients.findIndex((client) => client.id === id);
      if (index < 0) return { ok: false, error: { kind: "unavailable", message: "Client not found." } };
      const client = { ...clients[index], ...changes };
      const error = validateClientInput(client);
      if (error) return { ok: false, error: { kind: "unavailable", message: error } };
      clients[index] = client;
      const writeError = save(clients);
      return writeError ? { ok: false, error: { kind: "unavailable", message: writeError } } : { ok: true, client };
    },
    async setClientArchived(id, archived) {
      const clients = loadClients();
      const client = clients.find((row) => row.id === id);
      if (!client) return { ok: false, error: { kind: "unavailable", message: "Client not found." } };
      client.archived = archived;
      const writeError = save(clients);
      return writeError ? { ok: false, error: { kind: "unavailable", message: writeError } } : { ok: true, client };
    },
  };
}
