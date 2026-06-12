import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { recordProjectActivity } from "./projectActivity";
import {
  fileCategoryValidator,
  fileProviderValidator,
  fileStatusValidator,
} from "./domainValidators";
import {
  approvalStatusLabel,
  normalizeFileStatus,
} from "../src/lib/domain-values";
import type {
  FileCategory,
  FileProvider,
  FileStatus,
  ProjectActivityKind,
  TeamActivityKind,
} from "../src/lib/domain-values";

const MAX_PROJECT_FILES = 100;
const MAX_PROJECT_VERSIONS = 500;
const MAX_VERSIONS_PER_FILE = 20;
type FileActivityKind = ProjectActivityKind & TeamActivityKind;

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

function actorName(identity: Awaited<ReturnType<typeof requireIdentity>>) {
  return identity.name || identity.nickname || identity.email || "CutLab user";
}

function cleanText(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength);
}

function validExternalUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

async function requireEditableFile(ctx: MutationCtx, fileId: Id<"projectFiles">) {
  const file = await ctx.db.get(fileId);
  if (!file) throw new Error("Project file not found");
  const access = await requireProjectAccess(ctx, file.projectId, "editProjects");
  return { file, ...access };
}

async function logFileActivity(
  ctx: MutationCtx,
  project: Doc<"workItems">,
  identity: Awaited<ReturnType<typeof requireIdentity>>,
  kind: FileActivityKind,
  message: string,
  detail?: string
) {
  const name = actorName(identity);
  await recordProjectActivity(ctx, {
    project,
    actorUserId: identity.tokenIdentifier,
    actorName: name,
    kind,
    message,
    detail,
  });
  if (project.teamId) {
    await ctx.db.insert("teamActivity", {
      teamId: project.teamId,
      actorUserId: identity.tokenIdentifier,
      actorName: name,
      kind,
      projectId: project.id,
      message,
      createdAt: new Date().toISOString(),
    });
  }
}

async function nextVersionNumber(ctx: MutationCtx, fileId: Id<"projectFiles">) {
  const versions = await ctx.db
    .query("projectFileVersions")
    .withIndex("by_projectFileId_and_versionNumber", (q) => q.eq("projectFileId", fileId))
    .order("desc")
    .take(MAX_VERSIONS_PER_FILE);
  if (versions.length >= MAX_VERSIONS_PER_FILE) throw new Error("This file has reached its 20-version limit");
  return (versions[0]?.versionNumber ?? 0) + 1;
}

async function insertVersion(
  ctx: MutationCtx,
  args: {
    project: Doc<"workItems">;
    identity: Awaited<ReturnType<typeof requireIdentity>>;
    projectFileId?: Id<"projectFiles">;
    category: FileCategory;
    title: string;
    description: string;
    status: FileStatus;
    clientVisible: boolean;
    downloadable: boolean;
    provider: FileProvider;
    storageId?: Id<"_storage">;
    externalUrl?: string;
    externalId?: string;
    fileName: string;
    mimeType: string;
    size: number;
    notes: string;
  }
) {
  const now = new Date().toISOString();
  const projectVersions = await ctx.db
    .query("projectFileVersions")
    .withIndex("by_projectId_and_uploadedAt", (q) => q.eq("projectId", args.project.id))
    .take(MAX_PROJECT_VERSIONS);
  if (projectVersions.length >= MAX_PROJECT_VERSIONS) {
    throw new Error("This project has reached its 500-version history limit");
  }
  if (args.storageId) {
    const existingStorageReference = await ctx.db
      .query("projectFileVersions")
      .withIndex("by_storageId", (q) => q.eq("storageId", args.storageId))
      .unique();
    if (existingStorageReference) {
      throw new Error("This uploaded file is already attached to a project version");
    }
  }
  let fileId = args.projectFileId;
  let previousStatus: FileStatus | null = null;
  if (fileId) {
    const existing = await ctx.db.get(fileId);
    if (!existing || existing.projectId !== args.project.id) throw new Error("Project file not found");
    previousStatus = normalizeFileStatus(existing.status);
  } else {
    const existingFiles = await ctx.db
      .query("projectFiles")
      .withIndex("by_projectId_and_createdAt", (q) => q.eq("projectId", args.project.id))
      .take(MAX_PROJECT_FILES);
    if (existingFiles.length >= MAX_PROJECT_FILES) throw new Error("This project has reached its 100-file limit");
    fileId = await ctx.db.insert("projectFiles", {
      projectId: args.project.id,
      ownerUserId: args.project.userId,
      teamId: args.project.teamId,
      category: args.category,
      title: cleanText(args.title, 160) || cleanText(args.fileName, 160),
      description: cleanText(args.description, 500),
      status: args.status,
      clientVisible: args.clientVisible && args.category === "Deliverable",
      downloadable: args.downloadable,
      createdByUserId: args.identity.tokenIdentifier,
      createdByName: actorName(args.identity),
      createdAt: now,
      updatedAt: now,
    });
  }
  const versionNumber = await nextVersionNumber(ctx, fileId);
  await ctx.db.insert("projectFileVersions", {
    projectId: args.project.id,
    projectFileId: fileId,
    versionNumber,
    status: args.status,
    provider: args.provider,
    storageId: args.storageId,
    externalUrl: args.externalUrl,
    externalId: cleanText(args.externalId ?? "", 300) || undefined,
    fileName: cleanText(args.fileName, 240),
    mimeType: cleanText(args.mimeType, 120),
    size: Math.max(0, Math.floor(args.size)),
    uploadedByUserId: args.identity.tokenIdentifier,
    uploadedByName: actorName(args.identity),
    uploadedAt: now,
    notes: cleanText(args.notes, 500),
  });
  await ctx.db.patch(fileId, {
    status: args.status,
    updatedAt: now,
  });
  const file = await ctx.db.get(fileId);
  await logFileActivity(
    ctx,
    args.project,
    args.identity,
    versionNumber === 1 ? "project_file_added" : "project_file_version_added",
    versionNumber === 1
      ? `${file?.title ?? args.fileName} was added to ${args.category.toLowerCase()} files.`
      : `${file?.title ?? args.fileName} version ${versionNumber} was uploaded.`,
    `${args.fileName} · ${args.provider} · ${approvalStatusLabel(args.status)}`
  );
  if (previousStatus && previousStatus !== args.status) {
    await logFileActivity(
      ctx,
      args.project,
      args.identity,
      "project_file_updated",
      `${file?.title ?? args.fileName} approval changed from ${approvalStatusLabel(previousStatus)} to ${approvalStatusLabel(args.status)}.`
    );
  }
  return fileId;
}

export const listForProject = query({
  args: { projectId: v.string() },
  handler: async (ctx, args) => {
    await requireProjectAccess(ctx, args.projectId, "viewProjects");
    const [files, versions] = await Promise.all([
      ctx.db
        .query("projectFiles")
        .withIndex("by_projectId_and_createdAt", (q) => q.eq("projectId", args.projectId))
        .order("desc")
        .take(MAX_PROJECT_FILES),
      ctx.db
        .query("projectFileVersions")
        .withIndex("by_projectId_and_uploadedAt", (q) => q.eq("projectId", args.projectId))
        .order("desc")
        .take(MAX_PROJECT_VERSIONS),
    ]);
    const versionsWithUrls = await Promise.all(
      versions.map(async (version) => ({
        _id: version._id,
        projectFileId: version.projectFileId,
        versionNumber: version.versionNumber,
        status: normalizeFileStatus(version.status),
        provider: version.provider,
        url: version.storageId ? await ctx.storage.getUrl(version.storageId) : version.externalUrl,
        externalId: version.externalId,
        fileName: version.fileName,
        mimeType: version.mimeType,
        size: version.size,
        uploadedByName: version.uploadedByName,
        uploadedAt: version.uploadedAt,
        notes: version.notes,
      }))
    );
    return {
      files: files.map((file) => ({
        _id: file._id,
        category: file.category,
        title: file.title,
        description: file.description,
        status: normalizeFileStatus(file.status),
        clientVisible: file.clientVisible,
        downloadable: file.downloadable,
        createdByName: file.createdByName,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
        versions: versionsWithUrls.filter((version) => version.projectFileId === file._id),
      })),
      uploadHistory: versionsWithUrls,
    };
  },
});

export const generateUploadUrl = mutation({
  args: { projectId: v.string() },
  handler: async (ctx, args) => {
    await requireProjectAccess(ctx, args.projectId, "editProjects");
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveStorageVersion = mutation({
  args: {
    projectId: v.string(),
    projectFileId: v.optional(v.id("projectFiles")),
    storageId: v.id("_storage"),
    category: fileCategoryValidator,
    title: v.string(),
    description: v.string(),
    status: fileStatusValidator,
    clientVisible: v.boolean(),
    downloadable: v.boolean(),
    fileName: v.string(),
    mimeType: v.string(),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const { identity, project } = await requireProjectAccess(ctx, args.projectId, "editProjects");
    const metadata = await ctx.db.system.get(args.storageId);
    if (!metadata) throw new Error("Uploaded file not found");
    return await insertVersion(ctx, {
      ...args,
      project,
      identity,
      provider: "convex",
      size: metadata.size,
      mimeType: args.mimeType || metadata.contentType || "application/octet-stream",
    });
  },
});

export const saveExternalVersion = mutation({
  args: {
    projectId: v.string(),
    projectFileId: v.optional(v.id("projectFiles")),
    category: fileCategoryValidator,
    title: v.string(),
    description: v.string(),
    status: fileStatusValidator,
    clientVisible: v.boolean(),
    downloadable: v.boolean(),
    provider: fileProviderValidator,
    externalUrl: v.string(),
    externalId: v.optional(v.string()),
    fileName: v.string(),
    mimeType: v.string(),
    size: v.number(),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.provider === "convex") throw new Error("Use the upload flow for Convex storage");
    if (!validExternalUrl(args.externalUrl)) throw new Error("Enter a valid http or https file URL");
    const { identity, project } = await requireProjectAccess(ctx, args.projectId, "editProjects");
    return await insertVersion(ctx, { ...args, project, identity });
  },
});

export const updateFile = mutation({
  args: {
    fileId: v.id("projectFiles"),
    category: fileCategoryValidator,
    title: v.string(),
    description: v.string(),
    status: fileStatusValidator,
    clientVisible: v.boolean(),
    downloadable: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { file, identity, project } = await requireEditableFile(ctx, args.fileId);
    const title = cleanText(args.title, 160);
    if (!title) throw new Error("File title is required");
    const previousStatus = normalizeFileStatus(file.status);
    const latestVersion = previousStatus !== args.status
      ? await ctx.db
          .query("projectFileVersions")
          .withIndex("by_projectFileId_and_versionNumber", (q) => q.eq("projectFileId", args.fileId))
          .order("desc")
          .first()
      : null;
    await ctx.db.patch(args.fileId, {
      category: args.category,
      title,
      description: cleanText(args.description, 500),
      status: args.status,
      clientVisible: args.clientVisible && args.category === "Deliverable",
      downloadable: args.downloadable,
      updatedAt: new Date().toISOString(),
    });
    if (latestVersion) {
      await ctx.db.patch(latestVersion._id, { status: args.status });
    }
    const statusChanged = previousStatus !== args.status;
    await logFileActivity(
      ctx,
      project,
      identity,
      "project_file_updated",
      statusChanged
        ? `${file.title} approval changed from ${approvalStatusLabel(previousStatus)} to ${approvalStatusLabel(args.status)}.`
        : `${file.title} file details were updated.`
    );
    return null;
  },
});

export const removeFile = mutation({
  args: { fileId: v.id("projectFiles") },
  handler: async (ctx, args) => {
    const { file, identity, project } = await requireEditableFile(ctx, args.fileId);
    const versions = await ctx.db
      .query("projectFileVersions")
      .withIndex("by_projectFileId_and_versionNumber", (q) => q.eq("projectFileId", args.fileId))
      .take(MAX_VERSIONS_PER_FILE);
    await Promise.all(
      versions.map(async (version) => {
        if (version.storageId) await ctx.storage.delete(version.storageId);
        await ctx.db.delete(version._id);
      })
    );
    await ctx.db.delete(args.fileId);
    await logFileActivity(ctx, project, identity, "project_file_removed", `${file.title} was removed from project files.`);
    return null;
  },
});
