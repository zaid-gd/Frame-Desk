import { describe, expect, it } from "vitest";
import { createClientPortalController } from "./client-portal-controller";
import { createMemoryClientPortalPort } from "../infrastructure/memory-client-portal-port";

describe("Client Portal controller", () => {
  it("previews selected public data and controls portal access", async () => {
    const port = createMemoryClientPortalPort({
      project: {
        id: "project-1",
        name: "Campaign film",
        stage: "Client Review",
        progress: 50,
        dueDate: "2026-08-30",
        completedAt: "2026-08-20T10:00:00.000Z",
      },
      outputs: [
        {
          id: "main",
          projectId: "project-1",
          name: "Main film",
          reviewState: "in_review",
          archived: false,
          currentVersionId: "v2",
          versions: [
            { id: "v1", number: 1, addedAt: "2026-08-10T10:00:00.000Z", source: { provider: "link", providerId: null, url: "https://example.com/old" }, comments: [] },
            { id: "v2", number: 2, addedAt: "2026-08-18T10:00:00.000Z", source: { provider: "vimeo", providerId: "123", url: "https://vimeo.com/123" }, comments: [] },
          ],
        },
      ],
    });
    const controller = createClientPortalController({ port });

    expect(controller.actions.preview({
      publicNotes: "Draft preview.", showDueDate: false, showCompletedDate: true, outputIds: ["main"], expiresAt: null, pin: "", removePin: false,
    })).toMatchObject({ access: "open", view: { project: { publicNotes: "Draft preview.", dueDate: null, completedAt: "2026-08-20T10:00:00.000Z" } } });

    await controller.actions.publish({
      publicNotes: "Ready for review.",
      showDueDate: true,
      showCompletedDate: false,
      outputIds: ["main"],
      expiresAt: null,
      pin: "2468",
      removePin: false,
    });

    await controller.actions.publish({ publicNotes: "Updated notes.", showDueDate: true, showCompletedDate: false, outputIds: ["main"], expiresAt: null, pin: "", removePin: false });
    expect(port.loadPortal()?.pinProtected).toBe(true);

    expect(controller.actions.preview()).toEqual({
      access: "open",
      view: {
        branding: "relay",
        project: {
          name: "Campaign film",
          stage: "Client Review",
          progress: 50,
          publicNotes: "Updated notes.",
          dueDate: "2026-08-30",
          completedAt: null,
        },
        outputs: [{
          id: "main",
          name: "Main film",
          reviewState: "in_review",
          currentVersion: { id: "v2", source: { provider: "vimeo", providerId: "123", url: "https://vimeo.com/123" } },
        }],
      },
    });

    const oldToken = controller.actions.view().portal?.token;
    await controller.actions.close();
    expect(controller.actions.view().access).toBe("closed");
    await controller.actions.open();
    const regenerated = await controller.actions.regenerateToken();
    expect(regenerated.ok).toBe(true);
    expect(controller.actions.view().portal?.token).not.toBe(oldToken);
  });
});
