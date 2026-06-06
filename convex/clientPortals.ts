import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { recordProjectActivity } from "./projectActivity";

const MAX_DELIVERABLES = 50;
const MAX_REVISIONS = 100;
const MAX_EVENTS = 100;
const MAX_SUMMARY_LENGTH = 800;
const MAX_NOTE_LENGTH = 2000;
const MAX_REVISION_LENGTH = 2000;

async function requireIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return identity;
}

async function requireProjectAccess(
  ctx: QueryCtx | MutationCtx,
  projectId: string,
  permission: "viewProjects" | "editProjects"
) {
  const identity = await requireIdentity(ctx);
  const project = await ctx.db
    .query("workItems")
    .withIndex("by_workItemId", (q) => q.eq("id", projectId))
    .unique();
  if (!project) throw new Error("Project not found");

  if (!project.teamId) {
    if (project.userId !== identity.tokenIdentifier) throw new Error("Project access required");
    return { identity, project };
  }

  const member = await ctx.db
    .query("teamMembers")
    .withIndex("by_teamId_and_userId", (q) =>
      q.eq("teamId", project.teamId as string).eq("userId", identity.tokenIdentifier)
    )
    .unique();
  if (!member || member.status !== "active" || !member.permissions[permission]) {
    throw new Error("Project access required");
  }
  return { identity, project };
}

function cleanText(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength);
}

function projectProgress(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized.includes("deliver") || normalized.includes("complete") || normalized === "done") return 100;
  if (normalized.includes("review") || normalized.includes("revision") || normalized.includes("feedback")) return 75;
  if (normalized.includes("progress") || normalized.includes("editing") || normalized.includes("active")) return 45;
  return 15;
}

function milestoneForStage(stage: string) {
  if (stage === "In Progress") {
    return { kind: "work_started", title: "Work started", body: "Production work is now underway." };
  }
  if (stage === "Review") {
    return { kind: "review_sent", title: "Review sent", body: "The latest project version is ready for client review." };
  }
  if (stage === "Delivered") {
    return { kind: "delivery_completed", title: "Delivery completed", body: "The project has reached final delivery." };
  }
  return { kind: "status_changed", title: "Project moved to Planning", body: "The project workflow returned to planning." };
}

function validPublicUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

async function portalForEditor(ctx: QueryCtx | MutationCtx, projectId: string) {
  await requireProjectAccess(ctx, projectId, "viewProjects");
  return await ctx.db
    .query("clientPortals")
    .withIndex("by_projectId", (q) => q.eq("projectId", projectId))
    .unique();
}

async function visibleProjectDeliverables(ctx: QueryCtx, projectId: string) {
  const projectFiles = await ctx.db
    .query("projectFiles")
    .withIndex("by_projectId_and_createdAt", (q) => q.eq("projectId", projectId))
    .order("desc")
    .take(MAX_DELIVERABLES);
  const visibleFiles = projectFiles.filter(
    (file) => file.category === "Deliverable" && file.clientVisible
  );

  const deliverables = await Promise.all(
    visibleFiles.map(async (file) => {
      const versions = await ctx.db
        .query("projectFileVersions")
        .withIndex("by_projectFileId_and_versionNumber", (q) => q.eq("projectFileId", file._id))
        .order("desc")
        .take(1);
      const latest = versions[0];
      if (!latest) return null;
      const url = latest.storageId
        ? await ctx.storage.getUrl(latest.storageId)
        : latest.externalUrl;
      if (!url) return null;
      return {
        title: file.title,
        detail: file.description || latest.notes,
        url,
        status: file.status,
        downloadable: file.downloadable,
        updatedAt: latest.uploadedAt,
      };
    })
  );

  return deliverables.filter(
    (item): item is NonNullable<typeof item> => item !== null
  );
}

async function requireEditablePortal(ctx: MutationCtx, portalId: Doc<"clientPortals">["_id"]) {
  const portal = await ctx.db.get(portalId);
  if (!portal) throw new Error("Client portal not found");
  const access = await requireProjectAccess(ctx, portal.projectId, "editProjects");
  return { portal, ...access };
}

async function insertEvent(
  ctx: MutationCtx,
  portalId: Doc<"clientPortals">["_id"],
  kind: string,
  title: string,
  body: string,
  createdAt = new Date().toISOString()
) {
  const existingEvents = await ctx.db
    .query("portalEvents")
    .withIndex("by_portalId_and_createdAt", (q) => q.eq("portalId", portalId))
    .order("desc")
    .take(MAX_EVENTS);
  if (existingEvents.length >= MAX_EVENTS) {
    await ctx.db.delete(existingEvents[existingEvents.length - 1]._id);
  }
  await ctx.db.insert("portalEvents", {
    portalId,
    kind,
    title: cleanText(title, 120),
    body: cleanText(body, 500),
    createdAt,
  });
  await ctx.db.patch(portalId, { updatedAt: createdAt });
}

export const getForProject = query({
  args: { projectId: v.string() },
  handler: async (ctx, args) => {
    const portal = await portalForEditor(ctx, args.projectId);
    if (!portal) return null;

    const deliverables = await ctx.db
      .query("portalDeliverables")
      .withIndex("by_portalId_and_createdAt", (q) => q.eq("portalId", portal._id))
      .order("desc")
      .take(MAX_DELIVERABLES);
    const revisions = await ctx.db
      .query("portalRevisions")
      .withIndex("by_portalId_and_createdAt", (q) => q.eq("portalId", portal._id))
      .order("desc")
      .take(MAX_REVISIONS);

    return { portal, deliverables, revisions };
  },
});

export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const portal = await ctx.db
      .query("clientPortals")
      .withIndex("by_token", (q) => q.eq("token", args.token.trim()))
      .unique();
    if (!portal || !portal.published) return null;

    const deliverables = await ctx.db
      .query("portalDeliverables")
      .withIndex("by_portalId_and_createdAt", (q) => q.eq("portalId", portal._id))
      .order("desc")
      .take(MAX_DELIVERABLES);
    const unifiedDeliverables = await visibleProjectDeliverables(ctx, portal.projectId);
    const revisions = await ctx.db
      .query("portalRevisions")
      .withIndex("by_portalId_and_createdAt", (q) => q.eq("portalId", portal._id))
      .order("desc")
      .take(MAX_REVISIONS);
    const events = await ctx.db
      .query("portalEvents")
      .withIndex("by_portalId_and_createdAt", (q) => q.eq("portalId", portal._id))
      .order("desc")
      .take(MAX_EVENTS);

    return {
      title: portal.title,
      clientName: portal.clientName,
      projectType: portal.projectType,
      status: portal.status,
      dueDate: portal.dueDate,
      progress: portal.progress,
      clientSummary: portal.clientSummary,
      clientNotes: portal.clientNotes,
      estimatedCompletion: portal.estimatedCompletion,
      revisionLimit: portal.revisionLimit,
      createdAt: portal.createdAt,
      updatedAt: portal.updatedAt,
      deliverables: [
        ...unifiedDeliverables,
        ...deliverables.map((item) => ({
          title: item.title,
          detail: item.detail,
          url: item.url,
          status: item.status,
          downloadable: item.downloadable,
          updatedAt: item.updatedAt,
        })),
      ].slice(0, MAX_DELIVERABLES),
      revisions: revisions.map((item) => ({
        clientName: item.clientName,
        message: item.message,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      events: events.map((item) => ({
        kind: item.kind,
        title: item.title,
        body: item.body,
        createdAt: item.createdAt,
      })),
    };
  },
});

export const publish = mutation({
  args: {
    projectId: v.string(),
    clientSummary: v.string(),
    clientNotes: v.string(),
    estimatedCompletion: v.string(),
    revisionLimit: v.number(),
    clientStage: v.string(),
  },
  handler: async (ctx, args) => {
    const { identity, project } = await requireProjectAccess(ctx, args.projectId, "editProjects");
    const existing = await ctx.db
      .query("clientPortals")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .unique();
    const now = new Date().toISOString();
    const revisionLimit = Math.max(0, Math.min(20, Math.floor(args.revisionLimit)));
    const clientStage = cleanText(args.clientStage, 40);
    if (!["Planning", "In Progress", "Review", "Delivered"].includes(clientStage)) {
      throw new Error("Invalid client-facing workflow stage");
    }
    const snapshot = {
      title: cleanText(project.title, 160),
      clientName: cleanText(project.client ?? "", 120),
      projectType: cleanText(project.workType, 120),
      status: clientStage,
      sourceStatus: cleanText(project.status, 80),
      startDate: project.startDate,
      dueDate: project.dueDate,
      progress: projectProgress(clientStage),
      clientSummary: cleanText(args.clientSummary, MAX_SUMMARY_LENGTH),
      clientNotes: cleanText(args.clientNotes, MAX_NOTE_LENGTH),
      estimatedCompletion: cleanText(args.estimatedCompletion, 40) || project.dueDate,
      revisionLimit,
      published: true,
      updatedAt: now,
    };

    if (existing) {
      const statusChanged = existing.status !== snapshot.status;
      await ctx.db.patch(existing._id, snapshot);
      if (statusChanged) {
        const milestone = milestoneForStage(snapshot.status);
        await insertEvent(ctx, existing._id, milestone.kind, milestone.title, milestone.body);
      }
      await recordProjectActivity(ctx, {
        project,
        actorUserId: identity.tokenIdentifier,
        actorName: identity.name || identity.email || "CutLab user",
        kind: statusChanged ? "client_stage_changed" : "client_portal_updated",
        message: statusChanged
          ? `Client workflow stage changed to ${snapshot.status}.`
          : "Client portal details were updated.",
      });
      return { token: existing.token };
    }

    const token = crypto.randomUUID().replaceAll("-", "");
    const portalId = await ctx.db.insert("clientPortals", {
      ownerUserId: identity.tokenIdentifier,
      projectId: args.projectId,
      token,
      ...snapshot,
      createdAt: project.createdAt || now,
    });
    await insertEvent(ctx, portalId, "project_created", "Project created", "The project workspace and client portal were prepared.", project.createdAt || now);
    if (clientStage !== "Planning") {
      const milestone = milestoneForStage(clientStage);
      await insertEvent(ctx, portalId, milestone.kind, milestone.title, milestone.body, now);
    }
    await insertEvent(ctx, portalId, "portal_published", "Client portal published", "Project progress is now available through this private link.", now);
    await recordProjectActivity(ctx, {
      project,
      actorUserId: identity.tokenIdentifier,
      actorName: identity.name || identity.email || "CutLab user",
      kind: "client_portal_published",
      message: "The client portal was published.",
    });
    return { token };
  },
});

export const setPublished = mutation({
  args: { portalId: v.id("clientPortals"), published: v.boolean() },
  handler: async (ctx, args) => {
    const { portal, identity, project } = await requireEditablePortal(ctx, args.portalId);
    await ctx.db.patch(args.portalId, { published: args.published, updatedAt: new Date().toISOString() });
    await recordProjectActivity(ctx, {
      project,
      actorUserId: identity.tokenIdentifier,
      actorName: identity.name || identity.email || "CutLab user",
      kind: args.published ? "client_portal_published" : "client_portal_unpublished",
      message: `The client portal was ${args.published ? "published" : "unpublished"}.`,
    });
    return null;
  },
});

export const addDeliverable = mutation({
  args: {
    portalId: v.id("clientPortals"),
    title: v.string(),
    detail: v.string(),
    url: v.string(),
    status: v.string(),
    downloadable: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { portal, identity, project } = await requireEditablePortal(ctx, args.portalId);
    const title = cleanText(args.title, 160);
    const url = args.url.trim();
    if (!title) throw new Error("Deliverable title is required");
    if (!validPublicUrl(url)) throw new Error("Enter a valid http or https deliverable URL");
    const existing = await ctx.db
      .query("portalDeliverables")
      .withIndex("by_portalId_and_createdAt", (q) => q.eq("portalId", args.portalId))
      .take(MAX_DELIVERABLES);
    if (existing.length >= MAX_DELIVERABLES) throw new Error("This portal has reached its deliverable limit");
    const now = new Date().toISOString();
    await ctx.db.insert("portalDeliverables", {
      portalId: args.portalId,
      title,
      detail: cleanText(args.detail, 300),
      url,
      status: cleanText(args.status, 40) || "Pending",
      downloadable: args.downloadable,
      createdAt: now,
      updatedAt: now,
    });
    await insertEvent(ctx, args.portalId, "deliverable_added", "New file available", `${title} was added to the project deliverables.`);
    await recordProjectActivity(ctx, {
      project,
      actorUserId: identity.tokenIdentifier,
      actorName: identity.name || identity.email || "CutLab user",
      kind: "deliverable_added",
      message: `${title} was added to deliverables.`,
      detail: cleanText(args.detail, 300) || undefined,
    });
    return null;
  },
});

export const removeDeliverable = mutation({
  args: { deliverableId: v.id("portalDeliverables") },
  handler: async (ctx, args) => {
    const deliverable = await ctx.db.get(args.deliverableId);
    if (!deliverable) return null;
    const { identity, project } = await requireEditablePortal(ctx, deliverable.portalId);
    await ctx.db.delete(args.deliverableId);
    await recordProjectActivity(ctx, {
      project,
      actorUserId: identity.tokenIdentifier,
      actorName: identity.name || identity.email || "CutLab user",
      kind: "deliverable_removed",
      message: `${deliverable.title} was removed from deliverables.`,
    });
    return null;
  },
});

export const updateDeliverableStatus = mutation({
  args: { deliverableId: v.id("portalDeliverables"), status: v.string() },
  handler: async (ctx, args) => {
    const deliverable = await ctx.db.get(args.deliverableId);
    if (!deliverable) throw new Error("Deliverable not found");
    const { identity, project } = await requireEditablePortal(ctx, deliverable.portalId);
    const status = cleanText(args.status, 40);
    if (!["Pending", "In Progress", "Ready", "Delivered"].includes(status)) {
      throw new Error("Invalid deliverable status");
    }
    if (status === deliverable.status) return null;
    const now = new Date().toISOString();
    await ctx.db.patch(args.deliverableId, { status, updatedAt: now });
    const event = status === "Delivered"
      ? { kind: "delivery_completed", title: "Delivery completed", body: `${deliverable.title} was marked as delivered.` }
      : { kind: "deliverable_updated", title: "Deliverable updated", body: `${deliverable.title} is now ${status.toLowerCase()}.` };
    await insertEvent(ctx, deliverable.portalId, event.kind, event.title, event.body, now);
    await recordProjectActivity(ctx, {
      project,
      actorUserId: identity.tokenIdentifier,
      actorName: identity.name || identity.email || "CutLab user",
      kind: "deliverable_status_changed",
      message: `${deliverable.title} changed from ${deliverable.status} to ${status}.`,
    });
    return null;
  },
});

export const submitRevision = mutation({
  args: { token: v.string(), clientName: v.string(), message: v.string() },
  handler: async (ctx, args) => {
    const portal = await ctx.db
      .query("clientPortals")
      .withIndex("by_token", (q) => q.eq("token", args.token.trim()))
      .unique();
    if (!portal || !portal.published) throw new Error("Client portal not found");
    const message = cleanText(args.message, MAX_REVISION_LENGTH);
    if (!message) throw new Error("Revision request cannot be empty");
    const existing = await ctx.db
      .query("portalRevisions")
      .withIndex("by_portalId_and_createdAt", (q) => q.eq("portalId", portal._id))
      .take(MAX_REVISIONS);
    if (existing.length >= MAX_REVISIONS) throw new Error("This portal has reached its revision request limit");
    const now = new Date().toISOString();
    await ctx.db.insert("portalRevisions", {
      portalId: portal._id,
      clientName: cleanText(args.clientName, 100) || portal.clientName || "Client",
      message,
      status: "Submitted",
      createdAt: now,
      updatedAt: now,
    });
    await insertEvent(ctx, portal._id, "revision_requested", "Revision requested", "A new client revision request was submitted.", now);
    const project = await ctx.db
      .query("workItems")
      .withIndex("by_workItemId", (q) => q.eq("id", portal.projectId))
      .unique();
    if (project) {
      await recordProjectActivity(ctx, {
        project,
        actorUserId: "client",
        actorName: cleanText(args.clientName, 100) || portal.clientName || "Client",
        kind: "revision_requested",
        message: "A client revision request was submitted.",
        detail: message,
        createdAt: now,
      });
    }
    await ctx.db.patch(portal._id, { updatedAt: now });
    return null;
  },
});

export const updateRevisionStatus = mutation({
  args: { revisionId: v.id("portalRevisions"), status: v.string() },
  handler: async (ctx, args) => {
    const revision = await ctx.db.get(args.revisionId);
    if (!revision) throw new Error("Revision request not found");
    const { identity, project } = await requireEditablePortal(ctx, revision.portalId);
    const status = cleanText(args.status, 40);
    if (!["Submitted", "In Review", "Resolved"].includes(status)) throw new Error("Invalid revision status");
    const now = new Date().toISOString();
    await ctx.db.patch(args.revisionId, { status, updatedAt: now });
    if (status === "Resolved") {
      await insertEvent(ctx, revision.portalId, "revision_completed", "Revision completed", "A client revision request was resolved.", now);
    }
    await recordProjectActivity(ctx, {
      project,
      actorUserId: identity.tokenIdentifier,
      actorName: identity.name || identity.email || "CutLab user",
      kind: "revision_status_changed",
      message: `A revision request changed from ${revision.status} to ${status}.`,
    });
    return null;
  },
});
