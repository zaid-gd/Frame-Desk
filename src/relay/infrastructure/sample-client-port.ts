import { createMemoryClientPort } from "./memory-client-port";

export function createSampleClientPort() {
  return createMemoryClientPort({
    readOnly: true,
    canViewMoney: false,
    clients: [{ id: "client_demo", name: "Demo Client", company: "Demo Studio", contactName: "Jamie Chen", email: "jamie@example.test", phone: "+1 555 0100", notes: "Sample relationship", archived: false }],
    projects: [
      { id: "demo_alpha", clientId: "client_demo", name: "Demo Project Alpha", stage: "In review", tone: "review", due: "Aug 15, 2026", progress: "60%", status: "active", outstandingAmount: 1200, projectGroupId: "demo_group", portalUrl: "/portal/demo-alpha" },
      { id: "demo_beta", clientId: "client_demo", name: "Demo Project Beta", stage: "Delivered", tone: "delivered", due: "Aug 1, 2026", progress: "100%", status: "past", outstandingAmount: 0, projectGroupId: "demo_group", portalUrl: "/portal/demo-beta" },
    ],
    groups: [{ id: "demo_group", clientId: "client_demo", name: "Launch campaign" }],
  });
}
