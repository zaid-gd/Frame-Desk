import type { WorkspaceProject } from "../domain/workspace-project";

export type { WorkspaceProject } from "../domain/workspace-project";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: { kind: "forbidden" | "unavailable"; message: string } };

export type WorkspacePort = {
  loadProjects(): readonly WorkspaceProject[];
  requestNewProject(): Promise<ActionResult>;
};

export const sampleWriteRefusal: ActionResult = {
  ok: false,
  error: {
    kind: "forbidden",
    message: "Sample Workspace is read-only. Choose Local Mode or create an account to make changes.",
  },
};
