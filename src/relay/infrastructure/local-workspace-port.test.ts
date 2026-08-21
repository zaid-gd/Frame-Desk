import { describe, expect, test } from "vitest";
import { createLocalWorkspacePort, RELAY_LOCAL_PROJECTS_KEY } from "./local-workspace-port";
import { MAX_RELAY_PROJECTS } from "../domain/workspace-project";

describe("Local workspace adapter", () => {
  test("loads solo project records from browser storage", () => {
    const project = { id: "project_local", name: "My Local Cut", clientId: "client_solo", stage: "Planned", tone: "planned", due: "Sep 1, 2026", progress: "0%" };
    const storage = { getItem: (key: string) => key === RELAY_LOCAL_PROJECTS_KEY ? JSON.stringify([project]) : null, setItem: () => undefined };

    expect(createLocalWorkspacePort(storage).loadProjects()).toEqual([project]);
  });

  test("treats damaged browser data as an empty workspace", () => {
    expect(createLocalWorkspacePort({ getItem: () => "not-json", setItem: () => undefined }).loadProjects()).toEqual([]);
  });

  test("accepts a local draft only after saving it", async () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    const port = createLocalWorkspacePort(storage);

    await expect(port.requestNewProject()).resolves.toMatchObject({ ok: true });
    expect(port.loadProjects()).toEqual([
      expect.objectContaining({ name: "Untitled local project", stage: "Planned" }),
    ]);
  });

  test("keeps supported local state within the backup record limit", async () => {
    const projects = Array.from({ length: MAX_RELAY_PROJECTS }, (_, index) => ({
      id: `project_${index}`,
      name: `Project ${index}`,
      clientId: "client_unassigned",
      stage: "Planned",
      tone: "planned" as const,
      due: "Not set",
      progress: "0%",
    }));
    const values = new Map([[RELAY_LOCAL_PROJECTS_KEY, JSON.stringify(projects)]]);
    const port = createLocalWorkspacePort({
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    });

    await expect(port.requestNewProject()).resolves.toEqual({
      ok: false,
      error: { kind: "unavailable", message: "Local Mode supports up to 500 projects so every Workspace can be backed up safely." },
    });
    expect(port.loadProjects()).toHaveLength(MAX_RELAY_PROJECTS);
  });
});
