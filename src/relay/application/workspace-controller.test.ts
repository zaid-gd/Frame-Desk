import { describe, expect, test } from "vitest";
import { createWorkspaceController } from "./workspace-controller";
import { createMemoryWorkspacePort } from "../infrastructure/memory-workspace-port";

describe("Relay workspace controller", () => {
  test("refuses writes in the Sample Workspace", async () => {
    const projects = [{ id: "demo_alpha", name: "Demo Project Alpha", clientId: "client_demo", stage: "In review", tone: "review" as const, due: "Aug 15, 2026", progress: "60%" }];
    const controller = createWorkspaceController({
      mode: "sample",
      workspacePort: createMemoryWorkspacePort({ readOnly: true, projects }),
      clientNames: { client_demo: "Demo Client" },
    });

    await expect(controller.actions.requestNewProject()).resolves.toEqual({
      ok: false,
      kind: "forbidden",
      message: "Sample Workspace is read-only. Choose Local Mode or create an account to make changes.",
    });
    expect(controller.model).toMatchObject({
      workspaceLabel: "Production Desk",
      workspaceDetail: "Read-only sample",
    });
    expect(controller.model.navigation).toEqual(expect.arrayContaining([
      expect.objectContaining({ section: "dashboard", label: "Dashboard" }),
      expect.objectContaining({ section: "projects", label: "Projects" }),
    ]));
    expect(controller.model.projects).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "Demo Project Alpha", clientId: "client_demo", clientName: "Demo Client", stage: "In review" }),
    ]));
  });
});
