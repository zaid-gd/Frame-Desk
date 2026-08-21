// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { TeamAccessPort } from "../ports/team-access-port";
import { TeamPage } from "./relay-experience";
import { createTeamAccessController } from "../application/team-access-controller";

afterEach(cleanup);

describe("Team page", () => {
  test("renders the approved member table and inspector, then sends an Editor invite", async () => {
    const inviteMember = vi.fn().mockResolvedValue(undefined);
    const port: TeamAccessPort = {
      state: () => ({ kind: "ready" }),
      workspace: () => ({
        id: "team_1", name: "Production Desk", currencyCode: "USD", timeZone: "UTC", defaultWorkflowTemplateId: "template_default", editorsCanViewAll: false, currentMemberId: "owner", role: "Owner",
        members: [
          { id: "member_owner", userId: "owner", name: "Owner", email: "owner@example.com", role: "Owner", status: "active", permissions: { projects: true, reviews: true, portals: true, finance: true } },
          { id: "member_editor", userId: "editor", name: "Editor", email: "editor@example.com", role: "Editor", status: "active", permissions: { projects: true, reviews: true, portals: true, finance: false } },
        ],
      }),
      updateSettings: vi.fn(), inviteMember, updateMember: vi.fn(), transferOwnership: vi.fn(), removeMember: vi.fn(), leaveWorkspace: vi.fn(), prepareAccountDeletion: vi.fn(),
    };
    render(<TeamPage controller={createTeamAccessController(port)} />);

    expect(screen.getByRole("columnheader", { name: "Member" })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Select Editor" }));
    expect(screen.getByRole("heading", { name: "Member access" })).toBeTruthy();
    expect((screen.getByRole("checkbox", { name: "Finance" }) as HTMLInputElement).checked).toBe(false);

    await userEvent.click(screen.getByRole("button", { name: "Invite member" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "New Editor");
    await userEvent.type(screen.getByRole("textbox", { name: "Email" }), "new@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Send invite" }));
    expect(inviteMember).toHaveBeenCalledWith({ name: "New Editor", email: "new@example.com", role: "Editor" });
  });
});
