import { ConvexError, v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { outputReviewStateValidator, relayMediaCommentValidator, relayMediaSourceValidator } from "./relayWorkspaceValidators";
import { relayAccessForCurrentUser, relayProjectVisible, requireRelayPermission, type RelayAccess } from "./relayAccess";

const MAX_SHARED_OUTPUTS = 100;
const PIN_ITERATIONS = 210_000;
const accessValidator = v.union(v.literal("open"), v.literal("invalid"), v.literal("closed"), v.literal("expired"), v.literal("pin-required"), v.literal("wrong-pin"));
const publicViewValidator = v.object({
  branding: v.literal("relay"),
  project: v.object({ name: v.string(), stage: v.string(), progress: v.number(), publicNotes: v.string(), dueDate: v.union(v.string(), v.null()), completedAt: v.union(v.string(), v.null()) }),
  outputs: v.array(v.object({ id: v.string(), name: v.string(), reviewState: outputReviewStateValidator, currentVersion: v.object({ id: v.string(), source: relayMediaSourceValidator, comments: v.array(relayMediaCommentValidator) }) })),
});
const publicResultValidator = v.union(
  v.object({ access: accessValidator }),
  v.object({ access: v.literal("open"), view: publicViewValidator }),
);

function portalError(kind: "unauthorized" | "not-found" | "invalid" | "unavailable", message: string): never {
  throw new ConvexError({ kind, message });
}

async function ownerId(ctx: QueryCtx | MutationCtx) {
  return requireRelayPermission(ctx, "portals");
}

async function canReachProject(ctx: QueryCtx | MutationCtx, access: RelayAccess, projectId: string) {
  const project = await ctx.db.query("relayProjects").withIndex("by_ownerUserId_and_id", (q) => q.eq("ownerUserId", access.ownerUserId).eq("id", projectId)).unique();
  return project && relayProjectVisible(access, project) ? project : null;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(value: string) {
  return Uint8Array.from(value.match(/.{2}/g) ?? [], (byte) => Number.parseInt(byte, 16));
}

async function pinFields(pin: string) {
  if (!pin) return {};
  if (!/^\d{4,12}$/.test(pin)) portalError("invalid", "Use 4 to 12 digits for the Client Portal PIN.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { pinSalt: bytesToHex(salt), pinHash: bytesToHex(await derivePinHash(pin, salt)) };
}

async function derivePinHash(pin: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new Uint8Array(salt), iterations: PIN_ITERATIONS }, key, 256));
}

export async function pinMatches(pin: string, hash: string, salt: string) {
  const candidate = await derivePinHash(pin, hexToBytes(salt));
  const expected = hexToBytes(hash);
  if (candidate.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < candidate.length; index += 1) difference |= candidate[index] ^ expected[index];
  return difference === 0;
}

function newToken() {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll("-", "");
}

function progressNumber(progress: string) {
  return Number.parseFloat(progress) || 0;
}

function cleanReviewText(value: string, maxLength: number, message: string) {
  const clean = value.trim();
  if (!clean || clean.length > maxLength) portalError("invalid", message);
  return clean;
}

async function accessiblePortal(ctx: MutationCtx, token: string, pin?: string) {
  const portal = await ctx.db.query("relayClientPortals").withIndex("by_token", (q) => q.eq("token", token)).unique();
  if (!portal || portal.status === "closed" || (portal.expiresAt && Date.parse(portal.expiresAt) <= Date.now())) portalError("unavailable", "Client Portal unavailable.");
  if (portal.pinHash && portal.pinSalt && (!pin || !(await pinMatches(pin, portal.pinHash, portal.pinSalt)))) portalError("unavailable", "Client Portal unavailable.");
  return portal;
}

export const getForProject = query({
  args: { projectId: v.string() },
  returns: v.union(v.null(), v.object({ projectId: v.string(), token: v.string(), status: v.union(v.literal("open"), v.literal("closed")), publicNotes: v.string(), showDueDate: v.boolean(), showCompletedDate: v.boolean(), outputIds: v.array(v.string()), expiresAt: v.union(v.string(), v.null()), pinProtected: v.boolean() })),
  handler: async (ctx, args) => {
    const access = await relayAccessForCurrentUser(ctx);
    if (!access) return null;
    const ownerUserId = access.ownerUserId;
    if (!await canReachProject(ctx, access, args.projectId)) return null;
    const portal = await ctx.db.query("relayClientPortals").withIndex("by_ownerUserId_and_projectId", (q) => q.eq("ownerUserId", ownerUserId).eq("projectId", args.projectId)).unique();
    return portal ? { projectId: portal.projectId, token: portal.token, status: portal.status, publicNotes: portal.publicNotes, showDueDate: portal.showDueDate, showCompletedDate: portal.showCompletedDate, outputIds: portal.outputIds, expiresAt: portal.expiresAt, pinProtected: Boolean(portal.pinHash && portal.pinSalt) } : null;
  },
});

export const publish = mutation({
  args: { projectId: v.string(), publicNotes: v.string(), showDueDate: v.boolean(), showCompletedDate: v.boolean(), outputIds: v.array(v.string()), expiresAt: v.union(v.string(), v.null()), pin: v.string(), removePin: v.boolean() },
  returns: v.object({ token: v.string() }),
  handler: async (ctx, args) => {
    const access = await ownerId(ctx);
    const ownerUserId = access.ownerUserId;
    const project = await canReachProject(ctx, access, args.projectId);
    if (!project) portalError("not-found", "Project not found.");
    if (args.publicNotes.length > 2_000) portalError("invalid", "Keep public notes under 2,000 characters.");
    if (args.expiresAt && !Number.isFinite(Date.parse(args.expiresAt))) portalError("invalid", "Enter a valid expiry date and time.");
    const outputIds = [...new Set(args.outputIds)];
    if (outputIds.length > MAX_SHARED_OUTPUTS) portalError("unavailable", "This Client Portal has reached its shared-output limit.");
    const outputs = await ctx.db.query("relayProjectOutputs").withIndex("by_ownerUserId_and_projectId", (q) => q.eq("ownerUserId", ownerUserId).eq("projectId", args.projectId)).take(MAX_SHARED_OUTPUTS + 1);
    if (outputIds.some((id) => !outputs.some((output) => output.durableId === id && !output.archived && output.currentVersionId))) portalError("invalid", "Choose current Project Outputs from this Project.");
    const existing = await ctx.db.query("relayClientPortals").withIndex("by_ownerUserId_and_projectId", (q) => q.eq("ownerUserId", ownerUserId).eq("projectId", args.projectId)).unique();
    const timestamp = new Date().toISOString();
    const token = existing?.token ?? newToken();
    const protection = args.removePin
      ? { pinHash: undefined, pinSalt: undefined }
      : args.pin
        ? await pinFields(args.pin)
        : {};
    const fields = { status: "open" as const, publicNotes: args.publicNotes.trim(), showDueDate: args.showDueDate, showCompletedDate: args.showCompletedDate, outputIds, expiresAt: args.expiresAt, ...protection, updatedAt: timestamp };
    if (existing) await ctx.db.patch("relayClientPortals", existing._id, fields);
    else await ctx.db.insert("relayClientPortals", { ownerUserId, projectId: args.projectId, token, createdAt: timestamp, ...fields });
    return { token };
  },
});

export const setOpen = mutation({
  args: { projectId: v.string(), open: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const access = await ownerId(ctx);
    const ownerUserId = access.ownerUserId;
    if (!await canReachProject(ctx, access, args.projectId)) portalError("not-found", "Client Portal not found.");
    const portal = await ctx.db.query("relayClientPortals").withIndex("by_ownerUserId_and_projectId", (q) => q.eq("ownerUserId", ownerUserId).eq("projectId", args.projectId)).unique();
    if (!portal) portalError("not-found", "Client Portal not found.");
    await ctx.db.patch("relayClientPortals", portal._id, { status: args.open ? "open" : "closed", updatedAt: new Date().toISOString() });
    return null;
  },
});

export const regenerateToken = mutation({
  args: { projectId: v.string() },
  returns: v.object({ token: v.string() }),
  handler: async (ctx, args) => {
    const access = await ownerId(ctx);
    const ownerUserId = access.ownerUserId;
    if (!await canReachProject(ctx, access, args.projectId)) portalError("not-found", "Client Portal not found.");
    const portal = await ctx.db.query("relayClientPortals").withIndex("by_ownerUserId_and_projectId", (q) => q.eq("ownerUserId", ownerUserId).eq("projectId", args.projectId)).unique();
    if (!portal) portalError("not-found", "Client Portal not found.");
    const token = newToken();
    await ctx.db.patch("relayClientPortals", portal._id, { token, updatedAt: new Date().toISOString() });
    return { token };
  },
});

export const publicView = query({
  args: { token: v.string(), pin: v.optional(v.string()) },
  returns: publicResultValidator,
  handler: async (ctx, args) => {
    const portal = await ctx.db.query("relayClientPortals").withIndex("by_token", (q) => q.eq("token", args.token)).unique();
    if (!portal) return { access: "invalid" as const };
    if (portal.status === "closed") return { access: "closed" as const };
    if (portal.expiresAt && Date.parse(portal.expiresAt) <= Date.now()) return { access: "expired" as const };
    if (portal.pinHash && portal.pinSalt) {
      if (!args.pin) return { access: "pin-required" as const };
      if (!(await pinMatches(args.pin, portal.pinHash, portal.pinSalt))) return { access: "wrong-pin" as const };
    }
    const project = await ctx.db.query("relayProjects").withIndex("by_ownerUserId_and_id", (q) => q.eq("ownerUserId", portal.ownerUserId).eq("id", portal.projectId)).unique();
    if (!project) return { access: "invalid" as const };
    const outputs = await ctx.db.query("relayProjectOutputs").withIndex("by_ownerUserId_and_projectId", (q) => q.eq("ownerUserId", portal.ownerUserId).eq("projectId", portal.projectId)).take(MAX_SHARED_OUTPUTS);
    const selected = outputs.filter((output) => portal.outputIds.includes(output.durableId) && !output.archived && output.currentVersionId);
    const versions = await Promise.all(selected.map((output) => ctx.db.query("relayMediaVersions").withIndex("by_ownerUserId_and_outputId_and_number", (q) => q.eq("ownerUserId", portal.ownerUserId).eq("outputId", output.durableId)).order("desc").first()));
    const comments = await Promise.all(versions.map((version) => version ? ctx.db.query("relayMediaComments").withIndex("by_ownerUserId_and_versionId", (q) => q.eq("ownerUserId", portal.ownerUserId).eq("versionId", version.durableId)).take(500) : []));
    return {
      access: "open" as const,
      view: {
        branding: "relay" as const,
        project: { name: project.name, stage: project.stage, progress: progressNumber(project.progress), publicNotes: portal.publicNotes, dueDate: portal.showDueDate ? project.due : null, completedAt: portal.showCompletedDate ? project.completedAt ?? null : null },
        outputs: selected.flatMap((output, index) => {
          const version = versions[index];
          if (!version || version.durableId !== output.currentVersionId) return [];
          return [{ id: output.durableId, name: output.name, reviewState: output.reviewState, currentVersion: { id: version.durableId, source: { provider: version.provider, providerId: version.providerId ?? null, url: version.normalizedUrl }, comments: comments[index].map((comment) => ({ id: comment.durableId, authorName: comment.authorName ?? "Client", body: comment.body, resolved: comment.resolved, createdAt: comment.createdAt ?? new Date(comment._creationTime).toISOString() })) } }];
        }),
      },
    };
  },
});

export const addComment = mutation({
  args: { token: v.string(), pin: v.optional(v.string()), versionId: v.string(), displayName: v.string(), body: v.string() },
  returns: v.object({ id: v.string() }),
  handler: async (ctx, args) => {
    const portal = await accessiblePortal(ctx, args.token, args.pin);
    const displayName = cleanReviewText(args.displayName, 100, "Enter a display name under 100 characters.");
    const body = cleanReviewText(args.body, 2_000, "Enter a Comment under 2,000 characters.");
    const version = await ctx.db.query("relayMediaVersions").withIndex("by_ownerUserId_and_projectId", (q) => q.eq("ownerUserId", portal.ownerUserId).eq("projectId", portal.projectId)).take(500).then((items) => items.find(({ durableId }) => durableId === args.versionId));
    const output = version ? await ctx.db.query("relayProjectOutputs").withIndex("by_ownerUserId_and_durableId", (q) => q.eq("ownerUserId", portal.ownerUserId).eq("durableId", version.outputId)).unique() : null;
    if (!version || !output || output.currentVersionId !== version.durableId || !portal.outputIds.includes(output.durableId)) portalError("invalid", "Comment on a shared current Media Version.");
    const id = `comment_${crypto.randomUUID()}`;
    await ctx.db.insert("relayMediaComments", { ownerUserId: portal.ownerUserId, durableId: id, projectId: portal.projectId, versionId: version.durableId, authorName: displayName, body, resolved: false, createdAt: new Date().toISOString() });
    return { id };
  },
});

export const reopenComment = mutation({
  args: { token: v.string(), pin: v.optional(v.string()), id: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const portal = await accessiblePortal(ctx, args.token, args.pin);
    const comment = await ctx.db.query("relayMediaComments").withIndex("by_ownerUserId_and_durableId", (q) => q.eq("ownerUserId", portal.ownerUserId).eq("durableId", args.id)).unique();
    if (!comment || comment.projectId !== portal.projectId) portalError("not-found", "Comment not found.");
    const version = await ctx.db.query("relayMediaVersions").withIndex("by_ownerUserId_and_projectId", (q) => q.eq("ownerUserId", portal.ownerUserId).eq("projectId", portal.projectId)).take(500).then((items) => items.find(({ durableId }) => durableId === comment.versionId));
    const output = version ? await ctx.db.query("relayProjectOutputs").withIndex("by_ownerUserId_and_durableId", (q) => q.eq("ownerUserId", portal.ownerUserId).eq("durableId", version.outputId)).unique() : null;
    if (!version || !output || output.currentVersionId !== version.durableId || !portal.outputIds.includes(output.durableId)) portalError("invalid", "Reopen a Comment on a shared current Media Version.");
    await ctx.db.patch("relayMediaComments", comment._id, { resolved: false });
    return null;
  },
});
