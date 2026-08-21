import { describe, expect, test } from "vitest";
import { createClientController } from "./client-controller";
import { createMemoryClientPort } from "../infrastructure/memory-client-port";

describe("Relay Client controller", () => {
  test("creates, edits, searches, archives, restores, and inspects durable Clients", async () => {
    const port = createMemoryClientPort({
      clients: [{ id: "client_acme", name: "Acme", company: "Acme Films", contactName: "Ava", email: "ava@acme.test", phone: "555-0100", notes: "Retainer", archived: false }],
      projects: [
        { id: "project_active", clientId: "client_acme", name: "Launch", stage: "In review", tone: "review", due: "Aug 22", progress: "80%", status: "active", outstandingAmount: 400, projectGroupId: "group_campaign", portalUrl: "/portal/launch" },
        { id: "project_past", clientId: "client_acme", name: "Trailer", stage: "Delivered", tone: "delivered", due: "Aug 1", progress: "100%", status: "past", outstandingAmount: 100, projectGroupId: "group_campaign", portalUrl: "/portal/trailer" },
      ],
      groups: [{ id: "group_campaign", clientId: "client_acme", name: "Campaign" }],
    });
    const controller = createClientController({ port });

    expect(controller.model.clients).toHaveLength(1);
    expect(controller.actions.search("films").map((client) => client.name)).toEqual(["Acme"]);
    expect(controller.actions.inspect("client_acme")).toMatchObject({
      activeProjects: [{ id: "project_active" }],
      pastProjects: [{ id: "project_past" }],
      projectGroups: [{ id: "group_campaign", projectCount: 2 }],
      outstandingMoney: "$500.00",
      portalLinks: [{ projectId: "project_active" }, { projectId: "project_past" }],
    });

    await expect(controller.actions.edit("client_acme", { notes: "Priority" })).resolves.toMatchObject({ ok: true });
    await expect(controller.actions.archive("client_acme")).resolves.toMatchObject({ ok: true });
    expect(controller.actions.search("")).toEqual([]);
    expect(controller.actions.search("acme", { includeArchived: true })).toHaveLength(1);
    expect(controller.actions.historical().map((client) => client.id)).toEqual(["client_acme"]);
    await expect(controller.actions.restore("client_acme")).resolves.toMatchObject({ ok: true });
    await expect(controller.actions.create({ name: "Northstar", company: "", contactName: "Noah", email: "noah@example.test", phone: "", notes: "" })).resolves.toMatchObject({ ok: true });
    expect(port.loadClients()).toHaveLength(2);
  });

  test("refuses Sample Workspace writes and hides money without permission", async () => {
    const port = createMemoryClientPort({ readOnly: true, canViewMoney: false, clients: [{ id: "client_demo", name: "Demo", company: "", contactName: "", email: "", phone: "", notes: "", archived: false }] });
    const controller = createClientController({ port });

    await expect(controller.actions.archive("client_demo")).resolves.toMatchObject({ ok: false, kind: "forbidden" });
    expect(controller.actions.inspect("client_demo")?.outstandingMoney).toBeNull();
  });
});
