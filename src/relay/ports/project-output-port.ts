import type { OutputReviewState, ProjectOutput } from "../domain/project-output";
import type { ProjectWriteResult } from "./project-port";

export type ProjectOutputPort = {
  projectId: string;
  loadOutputCounts(): readonly { projectId: string; count: number }[];
  outputState(): { kind: "ready" | "loading" | "error"; message?: string };
  loadOutputs(): readonly ProjectOutput[];
  loadWorkspaceOutputs(): readonly ProjectOutput[];
  addOutput(input: { name: string }): Promise<ProjectWriteResult<{ id: string }>>;
  editOutput(id: string, input: { name: string }): Promise<ProjectWriteResult>;
  setOutputArchived(id: string, archived: boolean): Promise<ProjectWriteResult>;
  setOutputReviewState(id: string, reviewState: OutputReviewState): Promise<ProjectWriteResult>;
  addMediaVersion(outputId: string, input: { url: string }): Promise<ProjectWriteResult<{ id: string }>>;
  resolveComment(id: string): Promise<ProjectWriteResult>;
};
