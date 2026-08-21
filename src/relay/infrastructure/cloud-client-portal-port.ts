"use client";

import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { buildClientPortalPublicView, clientPortalAccessState, type ClientPortalProject } from "../domain/client-portal";
import type { ProjectOutput } from "../domain/project-output";
import type { ClientPortalPort } from "../ports/client-portal-port";

const refs = {
  get: api.relayClientPortals.getForProject,
  publish: api.relayClientPortals.publish,
  setOpen: api.relayClientPortals.setOpen,
  regenerate: api.relayClientPortals.regenerateToken,
};

function writeError(error: unknown, fallback: string) {
  return { ok: false as const, error: { kind: "unavailable" as const, message: error instanceof Error ? error.message : fallback } };
}

export function useCloudClientPortalPort(enabled: boolean, project: ClientPortalProject | null, outputs: readonly ProjectOutput[]): ClientPortalPort | null {
  const portal = useQuery(refs.get, enabled && project ? { projectId: project.id } : "skip");
  const publish = useMutation(refs.publish);
  const setOpen = useMutation(refs.setOpen);
  const regenerate = useMutation(refs.regenerate);
  return useMemo(() => enabled && project ? ({
    projectId: project.id,
    loadProject: () => project,
    loadOutputs: () => outputs,
    loadPortal: () => portal ?? null,
    preview() {
      const access = clientPortalAccessState(portal ?? null, Date.now(), true);
      return portal && access === "open" ? { access, view: buildClientPortalPublicView(project, outputs, portal) } : { access };
    },
    async publish(input) { try { await publish({ projectId: project.id, ...input }); return { ok: true as const, value: undefined }; } catch (error) { return writeError(error, "Client Portal could not be published."); } },
    async setOpen(open) { try { await setOpen({ projectId: project.id, open }); return { ok: true as const, value: undefined }; } catch (error) { return writeError(error, "Client Portal access could not be changed."); } },
    async regenerateToken() { try { return { ok: true as const, value: await regenerate({ projectId: project.id }) }; } catch (error) { return writeError(error, "Client Portal link could not be regenerated."); } },
  }) : null, [enabled, outputs, portal, project, publish, regenerate, setOpen]);
}
