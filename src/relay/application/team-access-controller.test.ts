import { describe, expect, test, vi } from "vitest";
import { createTeamAccessController } from "./team-access-controller";
import type { TeamAccessPort, TeamWorkspaceView } from "../ports/team-access-port";

const ownerWorkspace: TeamWorkspaceView = { id: "workspace", name: "Desk", currencyCode: "USD", timeZone: "UTC", defaultWorkflowTemplateId: "template_default", editorsCanViewAll: false, currentMemberId: "owner", role: "Owner", members: [{ id: "owner", userId: "owner", email: "owner@example.com", name: "Owner", role: "Owner", status: "active", permissions: { projects: true, reviews: true, portals: true, finance: true } }] };

function port(workspace: TeamWorkspaceView = ownerWorkspace): TeamAccessPort {
  return { state: () => ({ kind: "ready" }), workspace: () => workspace, updateSettings: vi.fn(), inviteMember: vi.fn(), updateMember: vi.fn(), transferOwnership: vi.fn(), removeMember: vi.fn(), leaveWorkspace: vi.fn(), prepareAccountDeletion: vi.fn() };
}

describe("Team access controller", () => {
  test("returns display-ready seat and ownership rules", () => {
    const controller = createTeamAccessController(port());
    expect(controller.model).toMatchObject({ owner: true, canLeave: false, seats: { used: 1, limit: 3, active: 1, invited: 0 }, accountDeletionMessage: "Transfer ownership before deleting your account." });
  });

  test("maps transport failures at the route-facing seam", async () => {
    const adapter = port();
    vi.mocked(adapter.inviteMember).mockRejectedValue(new Error("Seat cap reached."));
    await expect(createTeamAccessController(adapter).actions.invite({ email: "editor@example.com", name: "Editor", role: "Editor" })).resolves.toEqual({ ok: false, message: "Seat cap reached." });
  });
});
