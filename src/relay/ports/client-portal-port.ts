import type { ClientPortalAccess, ClientPortalProject, ClientPortalPublicView, ClientPortalRecord, ClientPortalSettings } from "../domain/client-portal";
import type { ProjectOutput } from "../domain/project-output";
import type { ProjectWriteResult } from "./project-port";

export type ClientPortalPublishInput = Omit<ClientPortalSettings, "status" | "pinProtected"> & { pin: string; removePin: boolean };

export type ClientPortalPort = {
  projectId: string;
  loadProject(): ClientPortalProject | null;
  loadOutputs(): readonly ProjectOutput[];
  loadPortal(): ClientPortalRecord | null;
  preview(): { access: ClientPortalAccess; view?: ClientPortalPublicView };
  publish(input: ClientPortalPublishInput): Promise<ProjectWriteResult>;
  setOpen(open: boolean): Promise<ProjectWriteResult>;
  regenerateToken(): Promise<ProjectWriteResult<{ token: string }>>;
};
