import { buildClientPortalPublicView, clientPortalAccessState } from "../domain/client-portal";
import type { ClientPortalPort, ClientPortalPublishInput } from "../ports/client-portal-port";

function validatePublish(input: ClientPortalPublishInput, outputIds: ReadonlySet<string>) {
  if (input.publicNotes.length > 2_000) return "Keep public notes under 2,000 characters.";
  if (input.pin && !/^\d{4,12}$/.test(input.pin)) return "Use 4 to 12 digits for the Client Portal PIN.";
  if (input.expiresAt && !Number.isFinite(Date.parse(input.expiresAt))) return "Enter a valid expiry date and time.";
  if (input.outputIds.some((id) => !outputIds.has(id))) return "Choose Project Outputs from this Project.";
  return null;
}

export function createClientPortalController({ port, onPortalOpened }: { port: ClientPortalPort; onPortalOpened?: () => void }) {
  return {
    actions: {
      view() {
        const portal = port.loadPortal();
        return {
          project: port.loadProject(),
          outputs: port.loadOutputs().filter(({ archived, currentVersionId }) => !archived && currentVersionId),
          portal,
          access: clientPortalAccessState(portal, Date.now(), true),
        };
      },
      preview(input?: ClientPortalPublishInput) {
        if (!input) return port.preview();
        const project = port.loadProject();
        if (!project) return { access: "invalid" as const };
        return {
          access: "open" as const,
          view: buildClientPortalPublicView(project, port.loadOutputs(), {
            projectId: project.id,
            token: "preview",
            status: "open",
            publicNotes: input.publicNotes.trim(),
            showDueDate: input.showDueDate,
            showCompletedDate: input.showCompletedDate,
            outputIds: input.outputIds,
            expiresAt: input.expiresAt,
            pinProtected: Boolean(input.pin),
          }),
        };
      },
      async publish(input: ClientPortalPublishInput) {
        const error = validatePublish(input, new Set(port.loadOutputs().map(({ id }) => id)));
        if (error) return { ok: false as const, kind: "invalid" as const, message: error };
        const result = await port.publish(input);
        return result.ok ? { ok: true as const, message: "Client Portal published." } : { ok: false as const, kind: result.error.kind, message: result.error.message };
      },
      async open() {
        const result = await port.setOpen(true);
        if (result.ok) onPortalOpened?.();
        return result.ok ? { ok: true as const, message: "Client Portal opened." } : { ok: false as const, kind: result.error.kind, message: result.error.message };
      },
      async close() {
        const result = await port.setOpen(false);
        return result.ok ? { ok: true as const, message: "Client Portal closed." } : { ok: false as const, kind: result.error.kind, message: result.error.message };
      },
      regenerateToken: () => port.regenerateToken(),
    },
  };
}

export type ClientPortalController = ReturnType<typeof createClientPortalController>;
