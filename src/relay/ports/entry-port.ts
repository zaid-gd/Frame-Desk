export type EntryMode = "local" | "sample";

export type EntryPort = {
  loadMode(): EntryMode | null;
  saveMode(mode: EntryMode): void;
};
