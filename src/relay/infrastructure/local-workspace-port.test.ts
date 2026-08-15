import { describe, expect, test } from "vitest";
import { createLocalWorkspacePort, RELAY_LOCAL_PROJECTS_KEY } from "./local-workspace-port";

describe("Local workspace adapter", () => {
  test("loads solo project records from browser storage", () => {
    const project = { name: "My Local Cut", client: "Solo Client", stage: "Planned", tone: "planned", due: "Sep 1, 2026", progress: "0%" };
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
});
