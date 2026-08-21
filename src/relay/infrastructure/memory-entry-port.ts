import type { EntryMode, EntryPort } from "../ports/entry-port";

export function createMemoryEntryPort(initialMode: EntryMode | null = null): EntryPort {
  let mode = initialMode;
  return {
    loadMode: () => mode,
    saveMode: (nextMode) => {
      mode = nextMode;
    },
  };
}
