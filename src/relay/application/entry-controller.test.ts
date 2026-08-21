import { describe, expect, test } from "vitest";
import { createEntryController } from "./entry-controller";
import { createMemoryEntryPort } from "../infrastructure/memory-entry-port";

describe("Relay entry controller", () => {
  test("offers the three main entry choices with sign in below them", () => {
    const controller = createEntryController({
      entryPort: createMemoryEntryPort(),
      session: { status: "signed-out" },
    });

    expect(controller.model).toMatchObject({
      state: "welcome",
      primaryChoices: [
        { mode: "local", label: "Use Local Mode" },
        { mode: "account", label: "Create an account" },
        { mode: "sample", label: "Open Sample Workspace" },
      ],
      secondaryChoice: { mode: "sign-in", label: "Sign in" },
    });
  });

  test("restores Local Mode with a browser-storage warning", () => {
    const controller = createEntryController({
      entryPort: createMemoryEntryPort("local"),
      session: { status: "signed-out" },
    });

    expect(controller.model).toMatchObject({
      state: "workspace",
      mode: "local",
      storageWarning: "Local Mode saves work only in this browser. Clearing site data can remove it.",
    });
  });

  test("uses the signed-in session as cloud identity", () => {
    const controller = createEntryController({
      entryPort: createMemoryEntryPort("local"),
      session: {
        status: "signed-in",
        identity: { displayName: "Dana Editor", email: "dana@example.com", initials: "DE" },
      },
    });

    expect(controller.model).toMatchObject({
      state: "workspace",
      mode: "cloud",
      identity: { displayName: "Dana Editor", email: "dana@example.com", initials: "DE" },
    });
    expect(controller.model.storageWarning).toBeUndefined();
  });
});
