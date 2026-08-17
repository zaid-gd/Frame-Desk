import type { MediaSource, OutputReviewState } from "./project-output";
import type { ProjectOutput } from "./project-output";

export type ClientPortalStatus = "open" | "closed";
export type ClientPortalAccess = "open" | "invalid" | "closed" | "expired" | "pin-required" | "wrong-pin";

export type ClientPortalSettings = {
  status: ClientPortalStatus;
  publicNotes: string;
  showDueDate: boolean;
  showCompletedDate: boolean;
  outputIds: string[];
  expiresAt: string | null;
  pinProtected: boolean;
};

export type ClientPortalRecord = ClientPortalSettings & {
  projectId: string;
  token: string;
};

export type ClientPortalProject = {
  id: string;
  name: string;
  stage: string;
  progress: number;
  dueDate: string;
  completedAt?: string;
};

export type ClientPortalOutput = {
  id: string;
  name: string;
  reviewState: OutputReviewState;
  currentVersion: { id: string; source: MediaSource };
};

export type ClientPortalPublicView = {
  project: {
    name: string;
    stage: string;
    progress: number;
    publicNotes: string;
    dueDate: string | null;
    completedAt: string | null;
  };
  outputs: ClientPortalOutput[];
  branding: "relay";
};

type PortalAccessFields = Pick<ClientPortalSettings, "status" | "expiresAt" | "pinProtected">;

export function clientPortalAccessState(
  portal: PortalAccessFields | null,
  now: number,
  pinAccepted: boolean,
): ClientPortalAccess {
  if (!portal) return "invalid";
  if (portal.status === "closed") return "closed";
  if (portal.expiresAt && Date.parse(portal.expiresAt) <= now) return "expired";
  if (portal.pinProtected && !pinAccepted) return "pin-required";
  return "open";
}

export function buildClientPortalPublicView(project: ClientPortalProject, outputs: readonly ProjectOutput[], portal: ClientPortalRecord): ClientPortalPublicView {
  return {
    branding: "relay",
    project: {
      name: project.name,
      stage: project.stage,
      progress: project.progress,
      publicNotes: portal.publicNotes,
      dueDate: portal.showDueDate ? project.dueDate : null,
      completedAt: portal.showCompletedDate ? project.completedAt ?? null : null,
    },
    outputs: portal.outputIds.flatMap((outputId) => {
      const output = outputs.find(({ id, archived }) => id === outputId && !archived);
      const currentVersion = output?.versions.find(({ id }) => id === output.currentVersionId);
      return output && currentVersion ? [{ id: output.id, name: output.name, reviewState: output.reviewState, currentVersion: { id: currentVersion.id, source: currentVersion.source } }] : [];
    }),
  };
}
