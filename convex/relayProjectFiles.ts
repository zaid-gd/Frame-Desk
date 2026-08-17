import { ConvexError, v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { pinMatches } from "./relayClientPortals";
import { relayStorageUsage } from "./relayStorageUsage";
import type { Id } from "./_generated/dataModel";
import { createFileAccessUrl, createUploadUrl } from "./relayProjectFileAccess";
import { env } from "./_generated/server";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const FREE_WORKSPACE_BYTES = 200 * 1024 * 1024;
const RESERVATION_LIFETIME_MS = 15 * 60 * 1000;
const FILE_POLICIES = {
  "application/pdf": { extensions: ["pdf"], renderMode: "document", copyable: false },
  "text/plain": { extensions: ["txt"], renderMode: "plain-text", copyable: true },
  "text/markdown": { extensions: ["md", "markdown"], renderMode: "safe-markdown", copyable: true },
  "image/jpeg": { extensions: ["jpg", "jpeg"], renderMode: "image", copyable: false },
  "image/png": { extensions: ["png"], renderMode: "image", copyable: false },
  "image/webp": { extensions: ["webp"], renderMode: "image", copyable: false },
} as const;
type SafeMimeType = keyof typeof FILE_POLICIES;
const projectFileValidator = v.object({ id: v.string(), title: v.string(), fileName: v.string(), mimeType: v.string(), size: v.number(), archived: v.boolean(), portalVisible: v.boolean(), allowDownload: v.boolean(), accessUrl: v.union(v.string(), v.null()) });

async function ownerId(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError({ kind: "unauthorized", message: "Sign in to manage Project files." });
  return identity.tokenIdentifier;
}

function fileError(kind: "invalid" | "not-found" | "unavailable", message: string): never {
  throw new ConvexError({ kind, message });
}

function validateFile(fileName: string, mimeType: string, size: number) {
  const normalizedType = mimeType.toLowerCase();
  const extension = fileName.trim().toLowerCase().split(".").pop() ?? "";
  const policy = FILE_POLICIES[normalizedType as SafeMimeType];
  if (!fileName.trim() || !policy || !(policy.extensions as readonly string[]).includes(extension)) fileError("invalid", "File type is not allowed.");
  if (!Number.isSafeInteger(size) || size < 1 || size > MAX_FILE_BYTES) fileError("invalid", "Files must be no larger than 20 MB.");
}

function hasPrefix(bytes: Uint8Array, prefix: readonly number[], offset = 0) {
  return prefix.every((byte, index) => bytes[offset + index] === byte);
}

function contentMatchesType(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "application/pdf") return hasPrefix(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]);
  if (mimeType === "image/jpeg") return hasPrefix(bytes, [0xff, 0xd8, 0xff]);
  if (mimeType === "image/png") return hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (mimeType === "image/webp") return hasPrefix(bytes, [0x52, 0x49, 0x46, 0x46]) && hasPrefix(bytes, [0x57, 0x45, 0x42, 0x50], 8);
  if (mimeType === "text/plain" || mimeType === "text/markdown") {
    if (bytes.includes(0)) return false;
    try { new TextDecoder("utf-8", { fatal: true }).decode(bytes); return true; } catch { return false; }
  }
  return false;
}

async function requireProject(ctx: QueryCtx | MutationCtx, ownerUserId: string, projectId: string) {
  const project = await ctx.db.query("relayProjects").withIndex("by_ownerUserId_and_id", (q) => q.eq("ownerUserId", ownerUserId).eq("id", projectId)).unique();
  if (!project) fileError("not-found", "Project not found.");
  return project;
}

async function retainedBytes(ctx: QueryCtx | MutationCtx, ownerUserId: string) {
  return relayStorageUsage.sum(ctx, { namespace: ownerUserId });
}

async function reserveServiceCapacity(ctx: MutationCtx, ownerUserId: string, projectId: string, declaredSize: number) {
  let policy = await ctx.db.query("relayStoragePolicy").withIndex("by_key", (q) => q.eq("key", "service")).unique();
  if (!policy) {
    const remainingBytes = Number(env.RELAY_STORAGE_CAPACITY_BYTES);
    const reserveBytes = Number(env.RELAY_STORAGE_RESERVE_BYTES ?? 0);
    if (Number.isSafeInteger(remainingBytes) && remainingBytes > 0 && Number.isSafeInteger(reserveBytes) && reserveBytes >= 0) {
      const policyId = await ctx.db.insert("relayStoragePolicy", { key: "service", acceptsUploads: remainingBytes > reserveBytes, remainingBytes, reserveBytes, heldBytes: 0 });
      policy = await ctx.db.get("relayStoragePolicy", policyId);
    }
  }
  const belowReserve = !policy || policy.remainingBytes === undefined || policy.remainingBytes - MAX_FILE_BYTES < (policy.reserveBytes ?? 0);
  if (!policy || !policy.acceptsUploads || belowReserve) fileError("unavailable", "Relay has paused new uploads before reaching service capacity. Existing files remain available.");
  await ctx.db.patch("relayStoragePolicy", policy._id, { remainingBytes: policy.remainingBytes! - MAX_FILE_BYTES, heldBytes: (policy.heldBytes ?? 0) + MAX_FILE_BYTES });
  const reservationId = await ctx.db.insert("relayUploadReservations", { ownerUserId, projectId, size: MAX_FILE_BYTES, declaredSize, status: "pending", createdAt: new Date().toISOString(), expiresAt: Date.now() + RESERVATION_LIFETIME_MS });
  await ctx.scheduler.runAfter(RESERVATION_LIFETIME_MS, internal.relayProjectFiles.expireUploadReservation, { reservationId });
  return reservationId;
}

async function adjustServiceCapacity(ctx: MutationCtx, remainingDelta: number, heldDelta: number) {
  const policy = await ctx.db.query("relayStoragePolicy").withIndex("by_key", (q) => q.eq("key", "service")).unique();
  if (policy?.remainingBytes !== undefined) {
    const remainingBytes = policy.remainingBytes + remainingDelta;
    const heldBytes = Math.max(0, (policy.heldBytes ?? 0) + heldDelta);
    await ctx.db.patch("relayStoragePolicy", policy._id, { remainingBytes, heldBytes, acceptsUploads: remainingBytes > (policy.reserveBytes ?? 0) });
  }
}

async function releaseReservation(ctx: MutationCtx, reservation: { _id: Id<"relayUploadReservations">; size: number }) {
  await adjustServiceCapacity(ctx, reservation.size, -reservation.size);
  await ctx.db.delete("relayUploadReservations", reservation._id);
}

export const expireUploadReservation = internalMutation({
  args: { reservationId: v.id("relayUploadReservations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get("relayUploadReservations", args.reservationId);
    if (reservation?.status === "pending" && reservation.expiresAt <= Date.now()) {
      await adjustServiceCapacity(ctx, reservation.size, -reservation.size);
      await ctx.db.patch("relayUploadReservations", reservation._id, { status: "expired" });
      if (reservation.storageId) await ctx.storage.delete(reservation.storageId);
      await ctx.scheduler.runAfter(24 * 60 * 60 * 1000, internal.relayProjectFiles.purgeUploadReservation, { reservationId: reservation._id });
    }
    return null;
  },
});

export const purgeUploadReservation = internalMutation({
  args: { reservationId: v.id("relayUploadReservations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get("relayUploadReservations", args.reservationId);
    if (reservation?.status === "expired") await ctx.db.delete("relayUploadReservations", reservation._id);
    return null;
  },
});

async function ownedFile(ctx: QueryCtx | MutationCtx, ownerUserId: string, id: string) {
  const file = await ctx.db.query("relayProjectFiles").withIndex("by_ownerUserId_and_durableId", (q) => q.eq("ownerUserId", ownerUserId).eq("durableId", id)).unique();
  if (!file) fileError("not-found", "Project file not found.");
  return file;
}

function renderMode(mimeType: string) {
  return FILE_POLICIES[mimeType as SafeMimeType]?.renderMode ?? "document";
}

export const reportServiceCapacity = internalMutation({
  args: { remainingBytes: v.number(), reserveBytes: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.remainingBytes < 0 || args.reserveBytes < 0) fileError("invalid", "Storage capacity values cannot be negative.");
    const policy = await ctx.db.query("relayStoragePolicy").withIndex("by_key", (q) => q.eq("key", "service")).unique();
    const heldBytes = policy?.heldBytes ?? 0;
    const remainingBytes = Math.max(0, args.remainingBytes - heldBytes);
    const fields = { acceptsUploads: remainingBytes > args.reserveBytes, remainingBytes, reserveBytes: args.reserveBytes, heldBytes };
    if (policy) await ctx.db.patch("relayStoragePolicy", policy._id, fields);
    else await ctx.db.insert("relayStoragePolicy", { key: "service", ...fields });
    return null;
  },
});

export const prepareUpload = mutation({
  args: { projectId: v.string(), fileName: v.string(), mimeType: v.string(), size: v.number() },
  returns: v.object({ uploadUrl: v.string(), reservationId: v.id("relayUploadReservations") }),
  handler: async (ctx, args) => {
    const ownerUserId = await ownerId(ctx);
    await requireProject(ctx, ownerUserId, args.projectId);
    validateFile(args.fileName, args.mimeType, args.size);
    const reservationId = await reserveServiceCapacity(ctx, ownerUserId, args.projectId, args.size);
    if (await retainedBytes(ctx, ownerUserId) + args.size > FREE_WORKSPACE_BYTES) fileError("unavailable", "The free Workspace storage limit is 200 MB. Archive keeps its size; permanently delete files to free space.");
    const reservation = await ctx.db.get("relayUploadReservations", reservationId);
    return { uploadUrl: await createUploadUrl(reservationId, reservation!.expiresAt), reservationId };
  },
});

export const cancelUpload = mutation({
  args: { reservationId: v.id("relayUploadReservations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get("relayUploadReservations", args.reservationId);
    if (!reservation || reservation.ownerUserId !== await ownerId(ctx) || reservation.status !== "pending") return null;
    if (reservation.storageId) await ctx.storage.delete(reservation.storageId);
    await releaseReservation(ctx, reservation);
    return null;
  },
});

export const bindUploadedStorage = internalMutation({
  args: { reservationId: v.id("relayUploadReservations"), storageId: v.id("_storage") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get("relayUploadReservations", args.reservationId);
    const metadata = await ctx.db.system.get("_storage", args.storageId);
    const relayClaim = await ctx.db.query("relayProjectFiles").withIndex("by_storageId", (q) => q.eq("storageId", args.storageId)).unique();
    const legacyClaim = await ctx.db.query("projectFileVersions").withIndex("by_storageId", (q) => q.eq("storageId", args.storageId)).unique();
    if (relayClaim || legacyClaim) {
      if (reservation?.status === "pending") await releaseReservation(ctx, reservation);
      else if (reservation) await ctx.db.delete("relayUploadReservations", reservation._id);
      return false;
    }
    if (!reservation || !metadata || reservation.status !== "pending" || reservation.expiresAt <= Date.now() || reservation.storageId || metadata.size > MAX_FILE_BYTES) {
      await ctx.storage.delete(args.storageId);
      if (reservation?.status === "pending" && reservation.expiresAt <= Date.now()) await releaseReservation(ctx, reservation);
      else if (reservation?.status === "expired") await ctx.db.delete("relayUploadReservations", reservation._id);
      return false;
    }
    await ctx.db.patch("relayUploadReservations", reservation._id, { storageId: args.storageId });
    return true;
  },
});

export const finishUpload = action({
  args: { projectId: v.string(), reservationId: v.id("relayUploadReservations"), storageId: v.id("_storage"), fileName: v.string(), mimeType: v.string(), title: v.string(), portalVisible: v.optional(v.boolean()), allowDownload: v.optional(v.boolean()) },
  returns: v.union(v.object({ ok: v.literal(true), id: v.string() }), v.object({ ok: v.literal(false), error: v.string() })),
  handler: async (ctx, args): Promise<{ ok: true; id: string } | { ok: false; error: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) fileError("invalid", "Sign in to finish a Project file upload.");
    const blob = await ctx.storage.get(args.storageId);
    const withinReadLimit = Boolean(blob && blob.size <= MAX_FILE_BYTES);
    const bytes = withinReadLimit ? new Uint8Array(await blob!.arrayBuffer()) : new Uint8Array();
    return ctx.runMutation(internal.relayProjectFiles.finalizeUpload, { ...args, ownerUserId: identity.tokenIdentifier, contentSafe: withinReadLimit && contentMatchesType(bytes, (blob?.type || args.mimeType).toLowerCase()) });
  },
});

export const finalizeUpload = internalMutation({
  args: { projectId: v.string(), reservationId: v.id("relayUploadReservations"), storageId: v.id("_storage"), fileName: v.string(), mimeType: v.string(), title: v.string(), portalVisible: v.optional(v.boolean()), allowDownload: v.optional(v.boolean()), ownerUserId: v.string(), contentSafe: v.boolean() },
  returns: v.union(v.object({ ok: v.literal(true), id: v.string() }), v.object({ ok: v.literal(false), error: v.string() })),
  handler: async (ctx, args) => {
    const ownerUserId = args.ownerUserId;
    const reservation = await ctx.db.get("relayUploadReservations", args.reservationId);
    const claimedFile = await ctx.db.query("relayProjectFiles").withIndex("by_storageId", (q) => q.eq("storageId", args.storageId)).unique();
    const legacyClaim = await ctx.db.query("projectFileVersions").withIndex("by_storageId", (q) => q.eq("storageId", args.storageId)).unique();
    if (!reservation || reservation.ownerUserId !== ownerUserId || reservation.projectId !== args.projectId || reservation.storageId !== args.storageId) return { ok: false as const, error: "Upload reservation is invalid or already used." };
    if (claimedFile || legacyClaim) {
      if (reservation.status === "pending") await releaseReservation(ctx, reservation);
      else await ctx.db.delete("relayUploadReservations", reservation._id);
      return { ok: false as const, error: "Uploaded storage has already been used." };
    }
    if (reservation.status === "expired" || reservation.expiresAt <= Date.now()) {
      if (reservation.status === "pending") await adjustServiceCapacity(ctx, reservation.size, -reservation.size);
      await ctx.storage.delete(args.storageId);
      await ctx.db.delete("relayUploadReservations", reservation._id);
      return { ok: false as const, error: "Upload reservation expired. Start the upload again." };
    }
    const project = await ctx.db.query("relayProjects").withIndex("by_ownerUserId_and_id", (q) => q.eq("ownerUserId", ownerUserId).eq("id", args.projectId)).unique();
    if (!project) {
      await ctx.storage.delete(args.storageId);
      await releaseReservation(ctx, reservation);
      return { ok: false as const, error: "Project not found." };
    }
    const metadata = await ctx.db.system.get("_storage", args.storageId);
    if (!metadata) {
      await releaseReservation(ctx, reservation);
      return { ok: false as const, error: "Uploaded file not found." };
    }
    const mimeType = (metadata.contentType ?? args.mimeType).toLowerCase();
    try {
      validateFile(args.fileName, mimeType, metadata.size);
      if (!args.contentSafe) fileError("invalid", "File contents do not match an allowed safe file type.");
      if (metadata.size > reservation.declaredSize) fileError("unavailable", "The uploaded file exceeded its declared size.");
      if (await retainedBytes(ctx, ownerUserId) + metadata.size > FREE_WORKSPACE_BYTES) fileError("unavailable", "The free Workspace storage limit is 200 MB. Existing files remain available.");
    } catch (error) {
      await ctx.storage.delete(args.storageId);
      await releaseReservation(ctx, reservation);
      return { ok: false as const, error: error instanceof Error ? error.message : "Upload rejected." };
    }
    const id = `file_${crypto.randomUUID()}`;
    await ctx.db.insert("relayProjectFiles", { ownerUserId, durableId: id, projectId: args.projectId, storageId: args.storageId, title: args.title.trim() || args.fileName, fileName: args.fileName, mimeType, size: metadata.size, archived: false, portalVisible: args.portalVisible ?? false, allowDownload: args.allowDownload ?? false, createdAt: new Date().toISOString() });
    await relayStorageUsage.insert(ctx, { namespace: ownerUserId, key: id, id: `file:${id}`, sumValue: metadata.size });
    await adjustServiceCapacity(ctx, reservation.size - metadata.size, -reservation.size);
    await ctx.db.delete("relayUploadReservations", reservation._id);
    return { ok: true as const, id };
  },
});

export const list = query({
  args: { projectId: v.string(), now: v.number() },
  returns: v.object({ retainedBytes: v.number(), limitBytes: v.number(), files: v.array(projectFileValidator) }),
  handler: async (ctx, args) => {
    const ownerUserId = await ownerId(ctx);
    await requireProject(ctx, ownerUserId, args.projectId);
    const files = await ctx.db.query("relayProjectFiles").withIndex("by_ownerUserId_and_projectId", (q) => q.eq("ownerUserId", ownerUserId).eq("projectId", args.projectId)).take(500);
    return { retainedBytes: await retainedBytes(ctx, ownerUserId), limitBytes: FREE_WORKSPACE_BYTES, files: await Promise.all(files.map(async (file) => ({ id: file.durableId, title: file.title, fileName: file.fileName, mimeType: file.mimeType, size: file.size, archived: file.archived, portalVisible: file.portalVisible, allowDownload: file.allowDownload, accessUrl: await createFileAccessUrl({ fileId: file.durableId, ownerUserId }, args.now) }))) };
  },
});

export const setSharing = mutation({
  args: { id: v.string(), portalVisible: v.boolean(), allowDownload: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerUserId = await ownerId(ctx);
    const file = await ownedFile(ctx, ownerUserId, args.id);
    await ctx.db.patch("relayProjectFiles", file._id, { portalVisible: args.portalVisible, allowDownload: args.portalVisible && args.allowDownload });
    return null;
  },
});

export const portalAccess = query({
  args: { token: v.string(), fileId: v.string(), pin: v.optional(v.string()), now: v.number() },
  returns: v.union(v.null(), v.object({ url: v.string(), fileName: v.string(), mimeType: v.string(), disposition: v.union(v.literal("inline"), v.literal("attachment")), renderMode: v.union(v.literal("safe-markdown"), v.literal("plain-text"), v.literal("image"), v.literal("document")), copyable: v.boolean() })),
  handler: async (ctx, args) => {
    const portal = await ctx.db.query("relayClientPortals").withIndex("by_token", (q) => q.eq("token", args.token)).unique();
    if (!portal || portal.status !== "open" || (portal.expiresAt && Date.parse(portal.expiresAt) <= args.now)) return null;
    if (portal.pinHash && portal.pinSalt && (!args.pin || !(await pinMatches(args.pin, portal.pinHash, portal.pinSalt)))) return null;
    const file = await ctx.db.query("relayProjectFiles").withIndex("by_ownerUserId_and_durableId", (q) => q.eq("ownerUserId", portal.ownerUserId).eq("durableId", args.fileId)).unique();
    if (!file || file.projectId !== portal.projectId || file.archived || !file.portalVisible) return null;
    const url = await createFileAccessUrl({ fileId: file.durableId, portalToken: args.token }, args.now);
    return { url, fileName: file.fileName, mimeType: file.mimeType, disposition: file.allowDownload ? "attachment" as const : "inline" as const, renderMode: renderMode(file.mimeType), copyable: FILE_POLICIES[file.mimeType as SafeMimeType]?.copyable ?? false };
  },
});

export const portalFiles = query({
  args: { token: v.string(), pin: v.optional(v.string()), now: v.number() },
  returns: v.union(
    v.object({ access: v.union(v.literal("invalid"), v.literal("closed"), v.literal("expired"), v.literal("pin-required"), v.literal("wrong-pin")) }),
    v.object({ access: v.literal("open"), files: v.array(v.object({ id: v.string(), title: v.string(), fileName: v.string(), mimeType: v.string(), url: v.string(), allowDownload: v.boolean(), renderMode: v.union(v.literal("safe-markdown"), v.literal("plain-text"), v.literal("image"), v.literal("document")) })) }),
  ),
  handler: async (ctx, args) => {
    const portal = await ctx.db.query("relayClientPortals").withIndex("by_token", (q) => q.eq("token", args.token)).unique();
    if (!portal) return { access: "invalid" as const };
    if (portal.status !== "open") return { access: "closed" as const };
    if (portal.expiresAt && Date.parse(portal.expiresAt) <= args.now) return { access: "expired" as const };
    if (portal.pinHash && portal.pinSalt) {
      if (!args.pin) return { access: "pin-required" as const };
      if (!(await pinMatches(args.pin, portal.pinHash, portal.pinSalt))) return { access: "wrong-pin" as const };
    }
    const files = await ctx.db.query("relayProjectFiles").withIndex("by_ownerUserId_and_projectId", (q) => q.eq("ownerUserId", portal.ownerUserId).eq("projectId", portal.projectId)).take(500);
    const visible = files.filter((file) => file.portalVisible && !file.archived);
    const projected = await Promise.all(visible.map(async (file) => {
      const url = await createFileAccessUrl({ fileId: file.durableId, portalToken: args.token }, args.now);
      return { id: file.durableId, title: file.title, fileName: file.fileName, mimeType: file.mimeType, url, allowDownload: file.allowDownload, renderMode: renderMode(file.mimeType) };
    }));
    return { access: "open" as const, files: projected.filter((file) => file !== null) };
  },
});

export const resolveFileAccess = internalQuery({
  args: { fileId: v.string(), ownerUserId: v.optional(v.string()), portalToken: v.optional(v.string()), now: v.number() },
  returns: v.union(v.null(), v.object({ storageId: v.id("_storage"), fileName: v.string(), mimeType: v.string(), allowDownload: v.boolean() })),
  handler: async (ctx, args) => {
    const portal = args.portalToken ? await ctx.db.query("relayClientPortals").withIndex("by_token", (q) => q.eq("token", args.portalToken!)).unique() : null;
    const ownerUserId = portal?.ownerUserId ?? args.ownerUserId;
    if (!ownerUserId) return null;
    const file = await ctx.db.query("relayProjectFiles").withIndex("by_ownerUserId_and_durableId", (q) => q.eq("ownerUserId", ownerUserId).eq("durableId", args.fileId)).unique();
    if (!file) return null;
    if (args.portalToken) {
      if (!portal || portal.projectId !== file.projectId || portal.status !== "open" || (portal.expiresAt && Date.parse(portal.expiresAt) <= args.now) || file.archived || !file.portalVisible) return null;
    }
    return { storageId: file.storageId, fileName: file.fileName, mimeType: file.mimeType, allowDownload: file.allowDownload };
  },
});

export const setArchived = mutation({
  args: { id: v.string(), archived: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const file = await ownedFile(ctx, await ownerId(ctx), args.id);
    await ctx.db.patch("relayProjectFiles", file._id, { archived: args.archived, ...(args.archived ? { portalVisible: false } : {}) });
    return null;
  },
});

export const permanentlyDelete = mutation({
  args: { id: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const file = await ownedFile(ctx, await ownerId(ctx), args.id);
    await ctx.storage.delete(file.storageId);
    await ctx.db.delete("relayProjectFiles", file._id);
    await relayStorageUsage.delete(ctx, { namespace: file.ownerUserId, key: file.durableId, id: `file:${file.durableId}` });
    await adjustServiceCapacity(ctx, file.size, 0);
    return null;
  },
});
