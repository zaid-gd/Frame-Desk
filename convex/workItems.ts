import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

const integrationLinkValidator = v.record(
  v.string(),
  v.object({
    url: v.string(),
    label: v.string(),
    notes: v.string(),
    updatedAt: v.string(),
  })
);

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const personalItems = await ctx.db
      .query("workItems")
      .withIndex("by_userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .take(500);
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .take(3);
    const activeMembership = memberships.find((member) => member.status === "active");
    const canViewTeamProjects = Boolean(activeMembership?.permissions.viewProjects);
    const teamItems = activeMembership && canViewTeamProjects
      ? await ctx.db
          .query("workItems")
          .withIndex("by_teamId", (q) => q.eq("teamId", activeMembership.teamId))
          .take(500)
      : [];
    const itemsById = new Map<string, Doc<"workItems">>();
    for (const item of [...personalItems, ...teamItems]) {
      itemsById.set(item.id, item);
    }
    const items = Array.from(itemsById.values());
    return items.map((item) => ({
      id: item.id,
      teamId: item.teamId,
      ownerUserId: item.ownerUserId,
      assigneeUserIds: item.assigneeUserIds,
      profileId: item.profileId,
      title: item.title,
      client: item.client,
      status: item.status,
      workType: item.workType,
      startDate: item.startDate,
      dueDate: item.dueDate,
      earnings: item.earnings,
      notes: item.notes,
      integrationLinks: item.integrationLinks,
      createdAt: item.createdAt,
    }));
  },
});

export const replaceAll = mutation({
  args: {
    items: v.array(
      v.object({
        id: v.string(),
        teamId: v.optional(v.string()),
        ownerUserId: v.optional(v.string()),
        assigneeUserIds: v.optional(v.array(v.string())),
        profileId: v.string(),
        title: v.string(),
        client: v.optional(v.string()),
        status: v.string(),
        workType: v.string(),
        startDate: v.string(),
        dueDate: v.string(),
        earnings: v.number(),
        notes: v.string(),
        integrationLinks: v.optional(integrationLinkValidator),
        createdAt: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.tokenIdentifier;
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(3);
    const activeMembership = memberships.find((member) => member.status === "active");
    const canCreateTeamProjects = Boolean(activeMembership?.permissions.createProjects);
    const canEditTeamProjects = Boolean(activeMembership?.permissions.editProjects);
    const canManageTeamProjects = Boolean(activeMembership?.permissions.manageTeam);
    const canUpdateTeamStatus = Boolean(activeMembership?.permissions.updateStatus);
    const personalExisting = await ctx.db
      .query("workItems")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(500);
    const teamExisting = activeMembership
      ? await ctx.db
          .query("workItems")
          .withIndex("by_teamId", (q) => q.eq("teamId", activeMembership.teamId))
          .take(500)
      : [];
    const activeTeamMemberIds = activeMembership
      ? new Set(
          (
            await ctx.db
              .query("teamMembers")
              .withIndex("by_teamId", (q) => q.eq("teamId", activeMembership.teamId))
              .take(6)
          )
            .filter((member) => member.status === "active")
            .map((member) => member.userId)
        )
      : new Set<string>();
    const existingById = new Map<string, Doc<"workItems">>();
    for (const item of [...personalExisting, ...teamExisting]) {
      existingById.set(item.id, item);
    }
    const incomingIds = new Set(args.items.map((item) => item.id));
    const now = new Date().toISOString();

    for (const item of args.items) {
      const existing = existingById.get(item.id);
      const targetTeamId = existing?.teamId ?? item.teamId;
      const isTeamProject = Boolean(targetTeamId);
      if (targetTeamId && activeMembership?.teamId !== targetTeamId) {
        throw new Error("Team access required for this project");
      }
      const isStatusOnlyUpdate = Boolean(
        existing &&
        existing.teamId &&
        existing.title === item.title &&
        (existing.client ?? "") === (item.client ?? "") &&
        existing.workType === item.workType &&
        existing.startDate === item.startDate &&
        existing.dueDate === item.dueDate &&
        existing.earnings === item.earnings &&
        existing.notes === item.notes &&
        JSON.stringify(existing.integrationLinks ?? {}) === JSON.stringify(item.integrationLinks ?? {}) &&
        JSON.stringify(existing.assigneeUserIds ?? []) === JSON.stringify(item.assigneeUserIds ?? [])
      );
      if (isTeamProject && !existing && !canCreateTeamProjects) {
        throw new Error("You do not have permission to create team projects");
      }
      if (isTeamProject && existing && existing.teamId && !canEditTeamProjects && !(isStatusOnlyUpdate && canUpdateTeamStatus)) {
        throw new Error("You do not have permission to edit team projects");
      }
      if (isTeamProject && existing && existing.teamId && isStatusOnlyUpdate && !canEditTeamProjects && canUpdateTeamStatus) {
        if (existing.status !== item.status) {
          await ctx.db.patch(existing._id, { status: item.status });
          await logProjectActivity(ctx, {
            teamId: existing.teamId,
            actorUserId: userId,
            actorName: identity.name || identity.email || "Team member",
            projectId: item.id,
            message: `${item.title} status changed from ${existing.status} to ${item.status}.`,
          });
          await notifyProjectAssignees(ctx, {
            teamId: existing.teamId,
            senderUserId: userId,
            ownerUserId: existing.ownerUserId,
            assigneeUserIds: existing.assigneeUserIds ?? [],
            projectId: item.id,
            message: `${item.title} was updated.`,
          });
        }
        continue;
      }
      const requestedAssignees = item.assigneeUserIds ?? existing?.assigneeUserIds ?? [];
      const assigneeUserIds = targetTeamId
        ? requestedAssignees.filter((assigneeUserId) => activeTeamMemberIds.has(assigneeUserId)).slice(0, 5)
        : [];

      const nextItem = {
        profileId: item.profileId,
        title: item.title,
        client: item.client ?? "",
        status: item.status,
        workType: item.workType,
        startDate: item.startDate,
        dueDate: item.dueDate,
        earnings: item.earnings,
        notes: item.notes,
        integrationLinks: item.integrationLinks,
        createdAt: item.createdAt ?? existing?.createdAt ?? now,
        teamId: targetTeamId,
        ownerUserId: existing?.ownerUserId ?? (targetTeamId ? userId : item.ownerUserId ?? userId),
        assigneeUserIds,
      };

      if (existing) {
        await ctx.db.patch(existing._id, nextItem);
        const integrationLinksChanged = JSON.stringify(existing.integrationLinks ?? {}) !== JSON.stringify(item.integrationLinks ?? {});
        const importantDetailChanges = [
          existing.title !== item.title ? "title" : "",
          (existing.client ?? "") !== (item.client ?? "") ? "client" : "",
          existing.workType !== item.workType ? "work type" : "",
          existing.startDate !== item.startDate ? "start date" : "",
          existing.dueDate !== item.dueDate ? "due date" : "",
          existing.earnings !== item.earnings ? "amount" : "",
          integrationLinksChanged ? "resource links" : "",
        ].filter(Boolean);
        if (targetTeamId && (existing.status !== item.status || existing.notes !== item.notes || importantDetailChanges.length)) {
          const updateMessage =
            existing.status !== item.status
              ? `${item.title} status changed from ${existing.status} to ${item.status}.`
              : existing.notes !== item.notes
                ? `${item.title} notes were updated.`
                : `${item.title} details updated: ${importantDetailChanges.join(", ")}.`;
          await logProjectActivity(ctx, {
            teamId: targetTeamId,
            actorUserId: userId,
            actorName: identity.name || identity.email || "Team member",
            projectId: item.id,
            message: updateMessage,
          });
          await notifyProjectAssignees(ctx, {
            teamId: targetTeamId,
            senderUserId: userId,
            ownerUserId: nextItem.ownerUserId,
            assigneeUserIds: nextItem.assigneeUserIds,
            projectId: item.id,
            message: updateMessage,
          });
        }
        const newlyAssigned = nextItem.assigneeUserIds.filter(
          (assigneeUserId) => !(existing.assigneeUserIds ?? []).includes(assigneeUserId)
        );
        const removedAssignees = (existing.assigneeUserIds ?? []).filter(
          (assigneeUserId) => !nextItem.assigneeUserIds.includes(assigneeUserId)
        );
        if (targetTeamId && removedAssignees.length) {
          await logProjectActivity(ctx, {
            teamId: targetTeamId,
            actorUserId: userId,
            actorName: identity.name || identity.email || "Team member",
            projectId: item.id,
            message: `${item.title} assignment removed for ${removedAssignees.length} team member${removedAssignees.length === 1 ? "" : "s"}.`,
          });
          await notifyProjectAssignees(ctx, {
            teamId: targetTeamId,
            senderUserId: userId,
            ownerUserId: undefined,
            assigneeUserIds: removedAssignees,
            projectId: item.id,
            message: `You were unassigned from ${item.title}.`,
          });
        }
        if (targetTeamId && (newlyAssigned.length || removedAssignees.length)) {
          await notifyProjectAssignees(ctx, {
            teamId: targetTeamId,
            senderUserId: userId,
            ownerUserId: nextItem.ownerUserId,
            assigneeUserIds: [],
            projectId: item.id,
            message: `${item.title} assignment changed.`,
          });
        }
        if (targetTeamId && newlyAssigned.length) {
          await logProjectActivity(ctx, {
            teamId: targetTeamId,
            actorUserId: userId,
            actorName: identity.name || identity.email || "Team member",
            projectId: item.id,
            message: `${item.title} assignment changed for ${newlyAssigned.length} team member${newlyAssigned.length === 1 ? "" : "s"}.`,
          });
          await notifyProjectAssignees(ctx, {
            teamId: targetTeamId,
            senderUserId: userId,
            ownerUserId: undefined,
            assigneeUserIds: newlyAssigned,
            projectId: item.id,
            message: `You were assigned to ${item.title}.`,
          });
        }
      } else {
        await ctx.db.insert("workItems", {
          ...nextItem,
          id: item.id,
          userId,
        });
        if (targetTeamId) {
          await logProjectActivity(ctx, {
            teamId: targetTeamId,
            actorUserId: userId,
            actorName: identity.name || identity.email || "Team member",
            projectId: item.id,
            message: `${item.title} was created.`,
          });
          await notifyProjectAssignees(ctx, {
            teamId: targetTeamId,
            senderUserId: userId,
            ownerUserId: nextItem.ownerUserId,
            assigneeUserIds: nextItem.assigneeUserIds,
            projectId: item.id,
            message: `You were assigned to ${item.title}.`,
          });
        }
      }
    }

    for (const existing of personalExisting) {
      if (!incomingIds.has(existing.id) && !existing.teamId) {
        await ctx.db.delete(existing._id);
      }
    }
    if (activeMembership && (canEditTeamProjects || canManageTeamProjects)) {
      for (const existing of teamExisting) {
        const canDeleteTeamProject = existing.ownerUserId === userId || canManageTeamProjects;
        if (!incomingIds.has(existing.id) && canDeleteTeamProject) {
          await logProjectActivity(ctx, {
            teamId: activeMembership.teamId,
            actorUserId: userId,
            actorName: identity.name || identity.email || "Team member",
            projectId: existing.id,
            message: `${existing.title} was deleted.`,
          });
          await notifyProjectAssignees(ctx, {
            teamId: activeMembership.teamId,
            senderUserId: userId,
            ownerUserId: existing.ownerUserId,
            assigneeUserIds: existing.assigneeUserIds ?? [],
            projectId: existing.id,
            message: `${existing.title} was deleted.`,
          });
          await deleteProjectComments(ctx, {
            teamId: activeMembership.teamId,
            projectId: existing.id,
          });
          await ctx.db.delete(existing._id);
        }
      }
    }
  },
});

async function logProjectActivity(
  ctx: MutationCtx,
  args: {
    teamId: string;
    actorUserId: string;
    actorName: string;
    projectId: string;
    message: string;
  }
) {
  await ctx.db.insert("teamActivity", {
    teamId: args.teamId,
    actorUserId: args.actorUserId,
    actorName: args.actorName,
    kind: "project_update",
    projectId: args.projectId,
    message: args.message,
    createdAt: new Date().toISOString(),
  });
}

async function deleteProjectComments(
  ctx: MutationCtx,
  args: {
    teamId: string;
    projectId: string;
  }
) {
  const comments = await ctx.db
    .query("projectComments")
    .withIndex("by_teamId_and_projectId", (q) =>
      q.eq("teamId", args.teamId).eq("projectId", args.projectId)
    )
    .take(50);
  await Promise.all(comments.map((comment) => ctx.db.delete(comment._id)));
}

async function notifyProjectAssignees(
  ctx: MutationCtx,
  args: {
    teamId: string;
    senderUserId: string;
    ownerUserId?: string;
    assigneeUserIds: string[];
    projectId: string;
    message: string;
  }
) {
  const recipientIds = [...new Set([args.ownerUserId, ...args.assigneeUserIds])];
  await Promise.all(
    recipientIds
      .filter((assigneeUserId): assigneeUserId is string => Boolean(assigneeUserId && assigneeUserId !== args.senderUserId))
      .slice(0, 5)
      .map((assigneeUserId) =>
        ctx.db.insert("teamNotifications", {
          teamId: args.teamId,
          userId: assigneeUserId,
          kind: "project_update",
          projectId: args.projectId,
          message: args.message,
          read: false,
          createdAt: new Date().toISOString(),
        })
      )
  );
}
