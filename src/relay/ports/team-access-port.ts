import type { TeamPermissions } from "../domain/team-access";

export type TeamMemberView = {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: "Owner" | "Editor" | "Viewer";
  status: "invited" | "active";
  permissions: TeamPermissions;
};

export type TeamWorkspaceView = {
  id: string;
  name: string;
  currencyCode: string;
  timeZone: string;
  defaultWorkflowTemplateId: string;
  editorsCanViewAll: boolean;
  currentMemberId: string;
  role: TeamMemberView["role"];
  members: readonly TeamMemberView[];
};

export type TeamAccessPort = {
  state(): { kind: "loading" | "ready" | "unavailable" };
  workspace(): TeamWorkspaceView | null;
  updateSettings(input: Omit<TeamWorkspaceView, "id" | "currentMemberId" | "role" | "members">): Promise<void>;
  inviteMember(input: { email: string; name: string; role: "Editor" | "Viewer" }): Promise<void>;
  updateMember(input: { memberId: string; role: "Editor" | "Viewer"; permissions: TeamPermissions }): Promise<void>;
  transferOwnership(memberId: string): Promise<void>;
  removeMember(memberId: string): Promise<void>;
  leaveWorkspace(): Promise<void>;
  prepareAccountDeletion(): Promise<void>;
};
