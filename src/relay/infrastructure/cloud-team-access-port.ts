"use client";

import { useEffect, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import type { TeamAccessPort, TeamWorkspaceView } from "../ports/team-access-port";

const refs = {
  workspace: makeFunctionReference<"query", Record<string, never>, TeamWorkspaceView | null>("relayTeamAccess:getWorkspace"),
  updateSettings: makeFunctionReference<"mutation", Omit<TeamWorkspaceView, "id" | "currentMemberId" | "role" | "members">, null>("relayTeamAccess:updateSettings"),
  invite: makeFunctionReference<"mutation", { email: string; name: string; role: "Editor" | "Viewer" }, { id: string }>("relayTeamAccess:inviteMember"),
  updateMember: makeFunctionReference<"mutation", Parameters<TeamAccessPort["updateMember"]>[0], null>("relayTeamAccess:updateMember"),
  transfer: makeFunctionReference<"mutation", { memberId: string }, null>("relayTeamAccess:transferOwnership"),
  remove: makeFunctionReference<"mutation", { memberId: string }, null>("relayTeamAccess:removeMember"),
  leave: makeFunctionReference<"mutation", Record<string, never>, null>("relayTeamAccess:leaveWorkspace"),
  prepareAccountDeletion: makeFunctionReference<"mutation", Record<string, never>, null>("relayTeamAccess:prepareAccountDeletion"),
  accept: makeFunctionReference<"mutation", Record<string, never>, boolean>("relayTeamAccess:acceptInvitation"),
};

export function useCloudTeamAccessPort(enabled: boolean): TeamAccessPort {
  const workspace = useQuery(refs.workspace, enabled ? {} : "skip");
  const updateSettings = useMutation(refs.updateSettings);
  const invite = useMutation(refs.invite);
  const updateMember = useMutation(refs.updateMember);
  const transfer = useMutation(refs.transfer);
  const remove = useMutation(refs.remove);
  const leave = useMutation(refs.leave);
  const prepareAccountDeletion = useMutation(refs.prepareAccountDeletion);
  const accept = useMutation(refs.accept);
  useEffect(() => {
    if (enabled && workspace?.id === "solo") void accept({});
  }, [accept, enabled, workspace?.id]);
  return useMemo(() => ({
    state: () => !enabled ? { kind: "unavailable" as const } : workspace === undefined ? { kind: "loading" as const } : { kind: "ready" as const },
    workspace: () => workspace ?? null,
    async updateSettings(input) { await updateSettings(input); },
    async inviteMember(input) { await invite(input); },
    async updateMember(input) { await updateMember(input); },
    async transferOwnership(memberId) { await transfer({ memberId }); },
    async removeMember(memberId) { await remove({ memberId }); },
    async leaveWorkspace() { await leave({}); },
    async prepareAccountDeletion() { await prepareAccountDeletion({}); },
  }), [enabled, invite, leave, prepareAccountDeletion, remove, transfer, updateMember, updateSettings, workspace]);
}
