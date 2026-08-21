import { buildClientPortalPublicView, clientPortalAccessState, type ClientPortalProject, type ClientPortalRecord } from "../domain/client-portal";
import type { ProjectOutput } from "../domain/project-output";
import type { ClientPortalPort } from "../ports/client-portal-port";

function randomPortalToken() {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll("-", "");
}

export function createMemoryClientPortalPort({ project, outputs = [], now = () => Date.now() }: { project: ClientPortalProject; outputs?: readonly ProjectOutput[]; now?: () => number }): ClientPortalPort {
  let portal: ClientPortalRecord | null = null;
  return {
    projectId: project.id,
    loadProject: () => project,
    loadOutputs: () => outputs,
    loadPortal: () => portal,
    preview() {
      const access = clientPortalAccessState(portal, now(), true);
      return portal && access === "open" ? { access, view: buildClientPortalPublicView(project, outputs, portal) } : { access };
    },
    async publish(input) {
      portal = {
        projectId: project.id,
        token: portal?.token ?? randomPortalToken(),
        status: "open",
        publicNotes: input.publicNotes.trim(),
        showDueDate: input.showDueDate,
        showCompletedDate: input.showCompletedDate,
        outputIds: [...new Set(input.outputIds)],
        expiresAt: input.expiresAt,
        pinProtected: input.removePin ? false : Boolean(input.pin) || portal?.pinProtected === true,
      };
      return { ok: true, value: undefined };
    },
    async setOpen(open) {
      if (!portal) return { ok: false, error: { kind: "unavailable", message: "Publish this Client Portal first." } };
      portal = { ...portal, status: open ? "open" : "closed" };
      return { ok: true, value: undefined };
    },
    async regenerateToken() {
      if (!portal) return { ok: false, error: { kind: "unavailable", message: "Publish this Client Portal first." } };
      const token = randomPortalToken();
      portal = { ...portal, token };
      return { ok: true, value: { token } };
    },
  };
}
