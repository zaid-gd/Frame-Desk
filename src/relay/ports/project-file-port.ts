import type { ProjectWriteResult } from "./project-port";

export type ProjectFile = {
  id: string;
  title: string;
  fileName: string;
  mimeType: string;
  size: number;
  archived: boolean;
  portalVisible: boolean;
  allowDownload: boolean;
  accessUrl: string | null;
};

export type ProjectFilePort = {
  state(): { kind: "loading" | "ready" };
  files(): readonly ProjectFile[];
  usage(): { retainedBytes: number; limitBytes: number };
  upload(file: File, title: string): Promise<ProjectWriteResult<{ id: string }>>;
  setSharing(id: string, portalVisible: boolean, allowDownload: boolean): Promise<ProjectWriteResult>;
  setArchived(id: string, archived: boolean): Promise<ProjectWriteResult>;
  deletionImpact(id: string): Promise<ProjectWriteResult<{ archiveEffect: string; deleteEffect: string }>>;
  permanentlyDelete(id: string): Promise<ProjectWriteResult>;
};

export function projectFileEffects(sizeInBytes: number) {
  const size = `${sizeInBytes.toLocaleString("en-US")} ${sizeInBytes === 1 ? "byte" : "bytes"}`;
  return {
    archiveEffect: `Archive hides this file from active Project files but keeps ${size} in Workspace storage and preserves its history.`,
    deleteEffect: `Permanent deletion removes this file, frees ${size}, and removes it from Project and Client Portal history.`,
  };
}
