import type { EntryMode, EntryPort } from "../ports/entry-port";

export const RELAY_ENTRY_MODE_KEY = "relay:entry-mode:v1";

export function createBrowserEntryPort(storage: Storage): EntryPort {
  return {
    loadMode() {
      const value = storage.getItem(RELAY_ENTRY_MODE_KEY);
      return value === "local" || value === "sample" ? value : null;
    },
    saveMode(mode: EntryMode) {
      storage.setItem(RELAY_ENTRY_MODE_KEY, mode);
    },
  };
}
