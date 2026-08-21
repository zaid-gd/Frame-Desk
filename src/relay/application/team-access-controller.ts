import type { TeamAccessPort, TeamWorkspaceView } from "../ports/team-access-port";
import type { TeamPermissions } from "../domain/team-access";

function failure(error: unknown, fallback: string) {
  return { ok: false as const, message: error instanceof Error ? error.message : fallback };
}

export function createTeamAccessController(port: TeamAccessPort) {
  const workspace = port.workspace();
  const owner = workspace?.role === "Owner";
  const run = async (operation: () => Promise<void>, success: string, fallback: string) => {
    try { await operation(); return { ok: true as const, message: success }; }
    catch (error) { return failure(error, fallback); }
  };
  return {
    model: {
      state: port.state(),
      workspace,
      owner,
      seats: workspace ? { used: workspace.members.length, limit: 3, active: workspace.members.filter(({ status }) => status === "active").length, invited: workspace.members.filter(({ status }) => status === "invited").length } : null,
      canLeave: Boolean(workspace && workspace.role !== "Owner"),
      accountDeletionMessage: workspace?.role === "Owner" ? "Transfer ownership before deleting your account." : "Deleting your account also removes your Team membership and clears open assignments.",
    },
    actions: {
      invite(input: { email: string; name: string; role: "Editor" | "Viewer" }) { return run(() => port.inviteMember(input), "Invitation added.", "Invitation could not be added."); },
      updateMember(input: { memberId: string; role: "Editor" | "Viewer"; permissions: TeamPermissions }) { return run(() => port.updateMember(input), "Member access saved.", "Member access could not be saved."); },
      transferOwnership(memberId: string) { return run(() => port.transferOwnership(memberId), "Ownership transferred.", "Ownership could not be transferred."); },
      removeMember(memberId: string) { return run(() => port.removeMember(memberId), "Member removed.", "Member could not be removed."); },
      leaveWorkspace() { return run(() => port.leaveWorkspace(), "You left the Workspace.", "Workspace could not be left."); },
      prepareAccountDeletion() { return run(() => port.prepareAccountDeletion(), "Account is ready for deletion.", "Account deletion could not start."); },
      updateSettings(input: Omit<TeamWorkspaceView, "id" | "currentMemberId" | "role" | "members">) { return run(() => port.updateSettings(input), "Workspace settings saved.", "Workspace settings could not be saved."); },
    },
  };
}

export type TeamAccessController = ReturnType<typeof createTeamAccessController>;
