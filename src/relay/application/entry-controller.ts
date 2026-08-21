import type { EntryMode, EntryPort } from "../ports/entry-port";

export type WorkspaceMode = EntryMode | "cloud";

export type RelaySession =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; identity: { displayName: string; email: string; initials: string } };

type EntryChoice = { mode: EntryMode | "account" | "sign-in"; label: string };

export type EntryController = {
  model: {
    state: "loading" | "welcome" | "workspace";
    primaryChoices: readonly EntryChoice[];
    secondaryChoice: EntryChoice;
    mode?: WorkspaceMode;
    identity?: { displayName: string; email: string; initials: string };
    storageWarning?: string;
  };
  actions: {
    chooseMode(mode: EntryMode): void;
  };
};

export function createEntryController({ entryPort, session }: { entryPort: EntryPort; session: RelaySession }): EntryController {
  const storedMode = entryPort.loadMode();
  const signedIn = session.status === "signed-in";
  const mode: WorkspaceMode | undefined = signedIn ? "cloud" : storedMode ?? undefined;
  return {
    model: {
      state: session.status === "loading" ? "loading" : mode ? "workspace" : "welcome",
      primaryChoices: [
        { mode: "local", label: "Use Local Mode" },
        { mode: "account", label: "Create an account" },
        { mode: "sample", label: "Open Sample Workspace" },
      ],
      secondaryChoice: { mode: "sign-in", label: "Sign in" },
      mode,
      identity: signedIn ? session.identity : undefined,
      storageWarning: mode === "local"
        ? "Local Mode saves work only in this browser. Clearing site data can remove it."
        : undefined,
    },
    actions: {
      chooseMode(mode) {
        entryPort.saveMode(mode);
      },
    },
  };
}
