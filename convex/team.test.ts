/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

const ownerPermissions = {
  viewProjects: true,
  createProjects: true,
  editProjects: true,
  updateStatus: true,
  commentProjects: true,
  manageTeam: true,
  useChat: true,
};

const editorPermissions = {
  ...ownerPermissions,
  manageTeam: false,
};

const reviewerPermissions = {
  viewProjects: true,
  createProjects: false,
  editProjects: false,
  updateStatus: false,
  commentProjects: true,
  manageTeam: false,
  useChat: true,
};

function project(id: string, teamId: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    teamId,
    profileId: "video-editing",
    title: `Project ${id}`,
    client: "Client",
    status: "Planned",
    workType: "Freelance",
    startDate: "2026-06-01",
    dueDate: "2026-06-10",
    earnings: 500,
    notes: "",
    assigneeUserIds: [],
    ...overrides,
  };
}

async function setupTeam() {
  const t = convexTest(schema, modules);
  const teamId = await t.run(async (ctx) => {
    const createdAt = new Date().toISOString();
    const workspaceId = await ctx.db.insert("teamWorkspaces", {
      ownerUserId: "owner",
      name: "Test Team",
      inviteCode: "ABC123",
      createdAt,
    });
    for (const member of [
      { userId: "owner", email: "owner@example.com", name: "Owner User", role: "Owner", permissions: ownerPermissions },
      { userId: "editor", email: "editor@example.com", name: "Editor User", role: "Editor", permissions: editorPermissions },
      { userId: "reviewer", email: "reviewer@example.com", name: "Review User", role: "Reviewer", permissions: reviewerPermissions },
    ]) {
      await ctx.db.insert("teamMembers", {
        teamId: workspaceId,
        ...member,
        status: "active",
        createdAt,
        joinedAt: createdAt,
      });
    }
    return workspaceId;
  });
  return {
    t,
    teamId,
    owner: t.withIdentity({ tokenIdentifier: "owner", name: "Owner User", email: "owner@example.com" }),
    editor: t.withIdentity({ tokenIdentifier: "editor", name: "Editor User", email: "editor@example.com" }),
    reviewer: t.withIdentity({ tokenIdentifier: "reviewer", name: "Review User", email: "reviewer@example.com" }),
  };
}

describe("team workspace permissions and synchronization", () => {
  test("Owner and Editor can create, edit, assign, and update stages without stale snapshot deletion", async () => {
    const { t, teamId, owner, editor } = await setupTeam();

    await owner.mutation(api.workItems.replaceAll, {
      deleteMissing: false,
      items: [project("owner-project", teamId, { ownerUserId: "owner" })],
    });
    await editor.mutation(api.workItems.replaceAll, {
      deleteMissing: false,
      items: [project("editor-project", teamId, { ownerUserId: "editor" })],
    });
    await editor.mutation(api.workItems.replaceAll, {
      deleteMissing: false,
      items: [project("editor-project", teamId, {
        ownerUserId: "editor",
        status: "Review",
        notes: "Editor handoff ready",
        assigneeUserIds: ["reviewer"],
      })],
    });
    await owner.mutation(api.workItems.replaceAll, {
      deleteMissing: false,
      items: [project("owner-project", teamId, {
        ownerUserId: "owner",
        status: "In Progress",
        notes: "Production started",
        assigneeUserIds: ["reviewer"],
      })],
    });

    const projects = await editor.query(api.workItems.list, {});
    expect(projects.map((item) => item.id).sort()).toEqual(["editor-project", "owner-project"]);
    expect(projects.find((item) => item.id === "editor-project")).toMatchObject({
      status: "Review",
      notes: "Editor handoff ready",
      assigneeUserIds: ["reviewer"],
    });
    expect(projects.find((item) => item.id === "owner-project")).toMatchObject({
      status: "In Progress",
      notes: "Production started",
      assigneeUserIds: ["reviewer"],
    });

    const reviewerWorkspace = await t.withIdentity({ tokenIdentifier: "reviewer" }).query(api.team.getMyWorkspace, {});
    expect(reviewerWorkspace?.notifications.some((notification) => notification.message.includes("assigned"))).toBe(true);
    expect(reviewerWorkspace?.activity.some((event) => event.projectId === "owner-project")).toBe(true);
  });

  test("Reviewer can leave notes, mention teammates, and chat but cannot mutate projects or stages", async () => {
    const { teamId, owner, reviewer } = await setupTeam();
    await owner.mutation(api.workItems.replaceAll, {
      deleteMissing: false,
      items: [project("review-project", teamId, { ownerUserId: "owner", assigneeUserIds: ["reviewer"] })],
    });

    await expect(reviewer.mutation(api.workItems.replaceAll, {
      deleteMissing: false,
      items: [project("blocked-create", teamId, { ownerUserId: "reviewer" })],
    })).rejects.toThrow("You do not have permission to create team projects");
    await expect(reviewer.mutation(api.workItems.replaceAll, {
      deleteMissing: false,
      items: [project("review-project", teamId, { ownerUserId: "owner", status: "Review" })],
    })).rejects.toThrow("You do not have permission to edit team projects");

    await reviewer.mutation(api.team.addProjectComment, {
      teamId,
      projectId: "review-project",
      body: "@owner Please check this cut.",
    });
    await reviewer.mutation(api.team.sendChatMessage, {
      teamId,
      body: "@owner Review notes are ready.",
    });

    const ownerWorkspace = await owner.query(api.team.getMyWorkspace, {});
    expect(ownerWorkspace?.notifications.filter((notification) => notification.kind.includes("mention"))).toHaveLength(2);
    expect(ownerWorkspace?.activity.some((event) => event.kind === "project_comment")).toBe(true);
    expect(ownerWorkspace?.activity.some((event) => event.kind === "chat_message")).toBe(true);
    expect(ownerWorkspace?.chat[ownerWorkspace.chat.length - 1]?.body).toBe("@owner Review notes are ready.");
  });

  test("Only a project owner or team Owner can delete a team project", async () => {
    const { t, teamId, owner, editor } = await setupTeam();
    await owner.mutation(api.workItems.replaceAll, {
      deleteMissing: false,
      items: [project("owned", teamId, { ownerUserId: "owner" })],
    });
    await editor.mutation(api.workItems.replaceAll, {
      deleteMissing: false,
      items: [project("editor-owned", teamId, { ownerUserId: "editor" })],
    });

    await expect(editor.mutation(api.workItems.deleteOne, { projectId: "owned" })).rejects.toThrow("permission to delete");
    await editor.mutation(api.workItems.deleteOne, { projectId: "editor-owned" });
    await owner.mutation(api.workItems.deleteOne, { projectId: "owned" });

    const remaining = await t.run(async (ctx) => {
      return await ctx.db.query("workItems").withIndex("by_teamId", (q) => q.eq("teamId", teamId)).take(10);
    });
    expect(remaining).toHaveLength(0);
  });

  test("Removed members immediately lose projects, comments, chat, and workspace access", async () => {
    const { t, teamId, owner, reviewer } = await setupTeam();
    const reviewerId = await t.run(async (ctx) => {
      const member = await ctx.db
        .query("teamMembers")
        .withIndex("by_teamId_and_userId", (q) => q.eq("teamId", teamId).eq("userId", "reviewer"))
        .unique();
      if (!member) throw new Error("Reviewer missing");
      return member._id;
    });

    await owner.mutation(api.team.removeMember, { teamId, memberId: reviewerId });

    expect(await reviewer.query(api.team.getMyWorkspace, {})).toBeNull();
    expect(await reviewer.query(api.workItems.list, {})).toEqual([]);
    await expect(reviewer.mutation(api.team.sendChatMessage, { teamId, body: "Still here" })).rejects.toThrow("Team access required");
    await expect(reviewer.mutation(api.team.addProjectComment, { teamId, projectId: "missing", body: "Still here" })).rejects.toThrow("Team access required");
  });

  test("Only Owners manage roles and legacy Client members normalize to Reviewer", async () => {
    const { t, teamId, owner, editor } = await setupTeam();
    const { legacyMemberIds, editorMemberId } = await t.run(async (ctx) => {
      const createdAt = new Date().toISOString();
      const legacyMemberIds = [];
      for (let index = 0; index < 5; index += 1) {
        legacyMemberIds.push(await ctx.db.insert("teamMembers", {
          teamId,
          userId: `legacy-${index}`,
          email: `legacy-${index}@example.com`,
          name: `Legacy Client ${index}`,
          role: "Client",
          status: "active",
          permissions: { ...reviewerPermissions, useChat: false },
          createdAt,
          joinedAt: createdAt,
        }));
      }
      const editorMember = await ctx.db
        .query("teamMembers")
        .withIndex("by_teamId_and_userId", (q) => q.eq("teamId", teamId).eq("userId", "editor"))
        .unique();
      if (!editorMember) throw new Error("Editor missing");
      return { legacyMemberIds, editorMemberId: editorMember._id };
    });

    await expect(editor.mutation(api.team.updateMemberRole, {
      teamId,
      memberId: legacyMemberIds[0],
      role: "Reviewer",
    })).rejects.toThrow("Permission denied");

    expect(await owner.mutation(api.team.normalizeLegacyRoles, { teamId })).toBe(5);
    const legacyMembers = await t.run(async (ctx) =>
      Promise.all(legacyMemberIds.map((memberId) => ctx.db.get(memberId)))
    );
    expect(legacyMembers).toHaveLength(5);
    for (const legacyMember of legacyMembers) {
      expect(legacyMember).toMatchObject({ role: "Reviewer", permissions: reviewerPermissions });
    }

    await owner.mutation(api.team.updateMemberRole, {
      teamId,
      memberId: editorMemberId,
      role: "Reviewer",
    });
    await expect(editor.mutation(api.workItems.replaceAll, {
      deleteMissing: false,
      items: [project("role-blocked", teamId)],
    })).rejects.toThrow("permission to create");
  });
});
