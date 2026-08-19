import type { NewProjectInput, ProjectChoice, ProjectGroup, ProjectGroupInput, ProjectRecord, ProjectStageEffect, ProjectTemplate } from "../domain/project";

export type ProjectAccess = { role: "owner" | "editor" | "viewer"; memberId: string; editorsCanViewAll: boolean; team?: boolean };

export type ProjectWriteResult<T = undefined> = { ok: true; value: T } | { ok: false; error: { kind: "unauthorized" | "forbidden" | "not-found" | "invalid" | "transport" | "unavailable"; message: string } };

export type ProjectPort = {
  projectAccess?(): ProjectAccess;
  projectState?(): { kind: "ready" | "loading" | "error"; message?: string };
  loadClients(): readonly ProjectChoice[];
  loadGroups(): readonly ProjectGroup[];
  loadTemplates(): readonly ProjectTemplate[];
  loadProjects(): readonly ProjectRecord[];
  createProject(input: NewProjectInput): Promise<ProjectWriteResult<{ id: string }>>;
  createGroup(input: ProjectGroupInput): Promise<ProjectWriteResult<{ id: string }>>;
  editGroup(id: string, input: ProjectGroupInput): Promise<ProjectWriteResult>;
  setGroupArchived(id: string, archived: boolean): Promise<ProjectWriteResult>;
  setProjectArchived(id: string, archived: boolean): Promise<ProjectWriteResult>;
  setProjectPayment(id: string, paid: boolean): Promise<ProjectWriteResult<{ paidAt?: string }>>;
  moveProjectStage(id: string, targetStageId: string, confirmed: boolean): Promise<ProjectWriteResult<{ projectName: string; stage: string; effect: ProjectStageEffect }>>;
  deleteProject(id: string): Promise<ProjectWriteResult>;
};

export const projectWriteRefusal: ProjectWriteResult<never> = { ok: false, error: { kind: "forbidden", message: "Sample Workspace is read-only. Choose Local Mode or create an account to make changes." } };
