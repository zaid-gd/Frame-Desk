import { validateClientInput, type ClientId, type ClientInput, type ClientProject, type ClientProjectGroup, type RelayClient } from "../domain/client";
import type { ClientPort } from "../ports/client-port";
import { sampleWriteRefusal } from "../ports/workspace-port";

export function createMemoryClientPort({ clients = [], projects = [], groups = [], readOnly = false, canViewMoney = true }: { clients?: readonly RelayClient[]; projects?: readonly ClientProject[]; groups?: readonly ClientProjectGroup[]; readOnly?: boolean; canViewMoney?: boolean } = {}): ClientPort {
  const clientRows = [...clients];
  const refuse = () => ({ ...sampleWriteRefusal });
  return {
    loadClients: () => clientRows,
    loadProjects: () => projects,
    loadProjectGroups: () => groups,
    canViewMoney: () => canViewMoney,
    async createClient(input) {
      if (readOnly) return refuse();
      const error = validateClientInput(input);
      if (error) return { ok: false, error: { kind: "unavailable", message: error } };
      const client = { id: `client_${crypto.randomUUID()}`, archived: false, ...input };
      clientRows.push(client);
      return { ok: true, client };
    },
    async editClient(id: ClientId, changes: Partial<ClientInput>) {
      if (readOnly) return refuse();
      const index = clientRows.findIndex((client) => client.id === id);
      if (index < 0) return { ok: false, error: { kind: "unavailable", message: "Client not found." } };
      const client = { ...clientRows[index], ...changes };
      const error = validateClientInput(client);
      if (error) return { ok: false, error: { kind: "unavailable", message: error } };
      clientRows[index] = client;
      return { ok: true, client };
    },
    async setClientArchived(id, archived) {
      if (readOnly) return refuse();
      const client = clientRows.find((row) => row.id === id);
      if (!client) return { ok: false, error: { kind: "unavailable", message: "Client not found." } };
      client.archived = archived;
      return { ok: true, client };
    },
  };
}
