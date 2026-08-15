"use client";

import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import type { WorkspaceProject } from "../domain/workspace-project";
import type { ClientPort } from "../ports/client-port";
import { clientRelationships } from "../domain/client-relationships";
import { api } from "../../../convex/_generated/api";

const { list: listClients, create: createClient, edit: editClient, setArchived } = api.relayClients;

export function useCloudClientPort(enabled: boolean, projects: readonly WorkspaceProject[] = []): ClientPort {
  const relationships = clientRelationships(projects);
  const clients = useQuery(listClients, enabled ? { includeArchived: true } : "skip") ?? [];
  const createMutation = useMutation(createClient);
  const editMutation = useMutation(editClient);
  const archiveMutation = useMutation(setArchived);
  return useMemo(() => ({
    loadClients: () => clients,
    loadProjects: () => relationships.projects,
    loadProjectGroups: () => relationships.groups,
    canViewMoney: () => enabled,
    async createClient(input) {
      try { const { id } = await createMutation(input); return { ok: true as const, client: { id, archived: false, ...input } }; }
      catch (error) { return { ok: false as const, error: { kind: "unavailable" as const, message: error instanceof Error ? error.message : "Relay could not create this Client." } }; }
    },
    async editClient(id, changes) {
      const prior = clients.find((client) => client.id === id);
      if (!prior) return { ok: false as const, error: { kind: "unavailable" as const, message: "Client not found." } };
      const client = { ...prior, ...changes };
      try { await editMutation({ id, name: client.name, company: client.company, contactName: client.contactName, email: client.email, phone: client.phone, notes: client.notes }); return { ok: true as const, client }; }
      catch (error) { return { ok: false as const, error: { kind: "unavailable" as const, message: error instanceof Error ? error.message : "Relay could not update this Client." } }; }
    },
    async setClientArchived(id, archived) {
      try { await archiveMutation({ id, archived }); return { ok: true as const, client: clients.find((client) => client.id === id) }; }
      catch (error) { return { ok: false as const, error: { kind: "unavailable" as const, message: error instanceof Error ? error.message : "Relay could not update this Client." } }; }
    },
  }), [archiveMutation, clients, createMutation, editMutation, relationships.groups, relationships.projects]);
}
