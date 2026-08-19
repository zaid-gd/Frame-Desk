import type { ClientId, ClientInput } from "../domain/client";
import type { ClientPort, ClientWriteResult } from "../ports/client-port";

type ClientMoney = { earned: number; collected: number; outstanding: number };

function displayResult(result: ClientWriteResult, success: string) {
  return result.ok ? { ok: true as const, message: success, client: result.client } : { ok: false as const, kind: result.error.kind, message: result.error.message };
}

export function createClientController({ port, currencyCode = "USD", moneyByClient }: { port: ClientPort; currencyCode?: string; moneyByClient?: Readonly<Record<string, ClientMoney>> }) {
  const activeClients = () => port.loadClients().filter((client) => !client.archived);
  const copy = {
    listTitle: "Client records", searchLabel: "Search Clients", searchPlaceholder: "Name, company, or contact", includeArchivedLabel: "Include archived Clients",
    emptyList: "No Clients match this view.", createTitle: "New Client", editTitle: "Edit Client", createLabel: "Create Client", saveLabel: "Save Client", cancelLabel: "Cancel",
    fieldLabels: { name: "Name", company: "Company", contactName: "Contact name", email: "Email", phone: "Phone", notes: "Notes" },
    inspectTitle: "Inspect a Client", inspectEmpty: "Choose a Client to see contact details, active and past work, Project Groups, money access, and portal links.",
    editLabel: "Edit Client", archiveLabel: "Archive Client", restoreLabel: "Restore Client", archivedLabel: "Archived", noCompany: "No company", noNotes: "No notes.", notAuthorized: "Not authorized", none: "None.", noPortals: "No portal links.",
  } as const;
  return {
    model: { clients: activeClients(), archivedHidden: true, copy },
    actions: {
      search(query: string, options: { includeArchived?: boolean } = {}) {
        const needle = query.trim().toLocaleLowerCase();
        return port.loadClients().filter((client) => (options.includeArchived || !client.archived) && (!needle || [client.name, client.company, client.contactName, client.email, client.phone, client.notes].some((value) => value.toLocaleLowerCase().includes(needle))));
      },
      searchRows(query: string, options: { includeArchived?: boolean } = {}) {
        const needle = query.trim().toLocaleLowerCase();
        return port.loadClients().filter((client) => (options.includeArchived || !client.archived) && (!needle || [client.name, client.company, client.contactName, client.email, client.phone, client.notes].some((value) => value.toLocaleLowerCase().includes(needle))))
          .map((client) => ({ client, secondary: client.company || client.contactName || copy.noCompany, archivedText: client.archived ? copy.archivedLabel : null }));
      },
      inspect(id: ClientId) {
        const client = port.loadClients().find((row) => row.id === id);
        if (!client) return null;
        const projects = [...new Map(port.loadProjects().filter((project) => project.clientId === id).map((project) => [project.id, project])).values()];
        const activeProjects = projects.filter((project) => project.status === "active");
        const pastProjects = projects.filter((project) => project.status === "past");
        const projectGroups = port.loadProjectGroups().filter((group) => group.clientId === id).map((group) => ({ ...group, projectCount: projects.filter((project) => project.projectGroupId === group.id).length }));
        const total = projects.reduce((sum, project) => sum + project.outstandingAmount, 0);
        const canonicalMoney = moneyByClient?.[id];
        const money = canonicalMoney ?? { earned: 0, collected: 0, outstanding: total };
        const formatMoney = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode }).format(value);
        const outstandingMoney = port.canViewMoney() ? formatMoney(money.outstanding) : null;
        const portalLinks = projects.filter((project) => project.portalUrl).map((project) => ({ projectId: project.id, projectName: project.name, url: project.portalUrl! }));
        return { client, activeProjects, pastProjects, projectGroups, outstandingMoney, portalLinks,
          display: {
            fields: [{ kind: "text" as const, label: "Company", value: client.company || "—" }, { kind: "text" as const, label: "Contact", value: client.contactName || "—" }, { kind: "email" as const, label: "Email", value: client.email || "—", href: client.email ? `mailto:${client.email}` : null }, { kind: "text" as const, label: "Phone", value: client.phone || "—" }, { kind: "text" as const, label: "Earned", value: port.canViewMoney() ? formatMoney(money.earned) : copy.notAuthorized }, { kind: "text" as const, label: "Collected", value: port.canViewMoney() ? formatMoney(money.collected) : copy.notAuthorized }, { kind: "text" as const, label: "Outstanding", value: outstandingMoney ?? copy.notAuthorized }],
            relationships: [{ title: "Active Projects", rows: activeProjects.map((project) => `${project.name} · ${project.stage}`) }, { title: "Past Projects", rows: pastProjects.map((project) => `${project.name} · ${project.stage}`) }, { title: "Project Groups", rows: projectGroups.map((group) => `${group.name} · ${group.projectCount} projects`) }],
            portalTitle: "Client Portal links",
            notes: client.notes || copy.noNotes,
            portalsEmpty: copy.noPortals,
          },
        };
      },
      historical() {
        const historicalIds = new Set(port.loadProjects().filter((project) => project.status === "past").map((project) => project.clientId));
        return port.loadClients().filter((client) => client.archived || historicalIds.has(client.id));
      },
      async create(input: ClientInput) { return displayResult(await port.createClient(input), "Client created."); },
      async edit(id: ClientId, changes: Partial<ClientInput>) { return displayResult(await port.editClient(id, changes), "Client updated."); },
      async archive(id: ClientId) { return displayResult(await port.setClientArchived(id, true), "Client archived."); },
      async restore(id: ClientId) { return displayResult(await port.setClientArchived(id, false), "Client restored."); },
    },
  };
}

export type ClientController = ReturnType<typeof createClientController>;
