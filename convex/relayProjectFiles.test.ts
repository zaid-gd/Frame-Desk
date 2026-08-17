/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { makeFunctionReference } from "convex/server";
import aggregateTest from "@convex-dev/aggregate/test";
import schema from "./schema";
import { relayStorageUsage } from "./relayStorageUsage";
import { createFileAccessUrl, verifyFileAccessClaim } from "./relayProjectFileAccess";
import type { Id } from "./_generated/dataModel";

process.env.RELAY_FILE_SIGNING_SECRET = "relay-project-files-test-secret-32-bytes";

const modules = import.meta.glob("./**/*.ts");
const prepareUpload = makeFunctionReference<"mutation">("relayProjectFiles:prepareUpload");
const finishUpload = makeFunctionReference<"action">("relayProjectFiles:finishUpload");
const list = makeFunctionReference<"query">("relayProjectFiles:list");
const setSharing = makeFunctionReference<"mutation">("relayProjectFiles:setSharing");
const portalAccess = makeFunctionReference<"query">("relayProjectFiles:portalAccess");
const portalFiles = makeFunctionReference<"query">("relayProjectFiles:portalFiles");
const setArchived = makeFunctionReference<"mutation">("relayProjectFiles:setArchived");
const permanentlyDelete = makeFunctionReference<"mutation">("relayProjectFiles:permanentlyDelete");
const publishPortal = makeFunctionReference<"mutation">("relayClientPortals:publish");
const addOutput = makeFunctionReference<"mutation">("relayProjectOutputs:addOutput");
const addMediaVersion = makeFunctionReference<"mutation">("relayProjectOutputs:addMediaVersion");
const reportServiceCapacity = makeFunctionReference<"mutation">("relayProjectFiles:reportServiceCapacity");
const cleanupDeletedProjectRecords = makeFunctionReference<"mutation">("relayProjects:cleanupDeletedProjectRecords");
const expireUploadReservation = makeFunctionReference<"mutation">("relayProjectFiles:expireUploadReservation");
const bindUploadedStorage = makeFunctionReference<"mutation">("relayProjectFiles:bindUploadedStorage");

function setup() {
  const t = convexTest(schema, modules);
  aggregateTest.register(t, "relayStorageUsage");
  const owner = t.withIdentity({ tokenIdentifier: "owner|files", name: "Zaid" });
  return { t, owner };
}

async function seedProject(t: ReturnType<typeof convexTest>) {
  await t.run((ctx) => ctx.db.insert("relayProjects", {
    ownerUserId: "owner|files", id: "project_files", name: "Safe files", clientId: "client_one",
    stage: "Editing", tone: "review", workflowStageId: "editing", due: "2026-08-30", progress: "25", financialType: "nonBillable", importedAt: "2026-08-18T00:00:00.000Z",
  }));
  await t.mutation(reportServiceCapacity, { remainingBytes: 10 * 1024 * 1024 * 1024, reserveBytes: 100 * 1024 * 1024 });
}

async function bindStorage(t: ReturnType<typeof convexTest>, reservationId: Id<"relayUploadReservations">, storageId: Id<"_storage">) {
  await expect(t.mutation(bindUploadedStorage, { reservationId, storageId })).resolves.toBe(true);
}

describe("Relay Project files", () => {
  test.each([
    ["brief.pdf", "application/pdf"], ["notes.txt", "text/plain"], ["readme.md", "text/markdown"],
    ["photo.jpg", "image/jpeg"], ["photo.png", "image/png"], ["photo.webp", "image/webp"],
  ])("accepts %s", async (fileName, mimeType) => {
    const { t, owner } = setup();
    await seedProject(t);
    await expect(owner.mutation(prepareUpload, { projectId: "project_files", fileName, mimeType, size: 20 * 1024 * 1024 })).resolves.toMatchObject({ uploadUrl: expect.any(String) });
  });

  test.each([
    ["page.html", "text/html"], ["mark.svg", "image/svg+xml"], ["app.js", "text/javascript"],
    ["run.exe", "application/x-msdownload"], ["files.zip", "application/zip"], ["clip.mp4", "video/mp4"], ["sound.mp3", "audio/mpeg"],
  ])("rejects unsafe upload %s", async (fileName, mimeType) => {
    const { t, owner } = setup();
    await seedProject(t);
    await expect(owner.mutation(prepareUpload, { projectId: "project_files", fileName, mimeType, size: 10 })).rejects.toThrow("File type is not allowed");
  });

  test("rejects files over 20 MB", async () => {
    const { t, owner } = setup();
    await seedProject(t);
    await expect(owner.mutation(prepareUpload, { projectId: "project_files", fileName: "large.pdf", mimeType: "application/pdf", size: 20 * 1024 * 1024 + 1 })).rejects.toThrow("20 MB");
  });

  test("rejects a safe MIME type paired with an unsafe extension", async () => {
    const { t, owner } = setup();
    await seedProject(t);
    await expect(owner.mutation(prepareUpload, { projectId: "project_files", fileName: "payload.html", mimeType: "text/plain", size: 10 })).rejects.toThrow("File type is not allowed");
  });

  test("stores a private file and defaults portal download off", async () => {
    const { t, owner } = setup();
    await seedProject(t);
    const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["hello"], { type: "text/markdown" })));
    const { reservationId } = await owner.mutation(prepareUpload, { projectId: "project_files", fileName: "notes.md", mimeType: "text/markdown", size: 5 });
    await bindStorage(t, reservationId, storageId);
    expect(await owner.action(finishUpload, { projectId: "project_files", reservationId, storageId, fileName: "notes.md", mimeType: "text/markdown", title: "Notes" })).toMatchObject({ ok: true });
    await expect(owner.query(list, { projectId: "project_files", now: Date.now() })).resolves.toMatchObject({
      retainedBytes: 5,
      files: [{ title: "Notes", archived: false, portalVisible: false, allowDownload: false, accessUrl: expect.any(String) }],
    });
  });

  test("counts retained Media Versions and archived files toward the 200 MB limit without deleting either", async () => {
    const { t, owner } = setup();
    await seedProject(t);
    await t.run(async (ctx) => {
      const storageId = await ctx.storage.store(new Blob(["kept"], { type: "application/pdf" }));
      await ctx.db.insert("relayProjectFiles", { ownerUserId: "owner|files", durableId: "file_archived", projectId: "project_files", storageId, title: "Archive", fileName: "archive.pdf", mimeType: "application/pdf", size: 100 * 1024 * 1024, archived: true, portalVisible: false, allowDownload: false, createdAt: "2026-08-18T00:00:00.000Z" });
      await relayStorageUsage.insert(ctx, { namespace: "owner|files", key: "file_archived", id: "file:file_archived", sumValue: 100 * 1024 * 1024 });
      await ctx.db.insert("relayMediaVersions", { ownerUserId: "owner|files", durableId: "version_kept", projectId: "project_files", outputId: "output_one", number: 1, provider: "link", normalizedUrl: "https://example.com/version", addedAt: "2026-08-18T00:00:00.000Z", size: 90 * 1024 * 1024 });
      await relayStorageUsage.insert(ctx, { namespace: "owner|files", key: "version_kept", id: "version:version_kept", sumValue: 90 * 1024 * 1024 });
    });
    await expect(owner.mutation(prepareUpload, { projectId: "project_files", fileName: "more.pdf", mimeType: "application/pdf", size: 11 * 1024 * 1024 })).rejects.toThrow("200 MB");
    expect((await owner.query(list, { projectId: "project_files", now: Date.now() })).files).toHaveLength(1);
    expect(await t.run((ctx) => ctx.db.query("relayMediaVersions").take(10))).toHaveLength(1);
  });

  test("records external Media Versions as retained zero-byte provider references", async () => {
    const { t, owner } = setup();
    await seedProject(t);
    const { id: outputId } = await owner.mutation(addOutput, { projectId: "project_files", name: "Main film" });
    const { id } = await owner.mutation(addMediaVersion, { outputId, url: "https://vimeo.com/123456" });
    const version = await t.run((ctx) => ctx.db.query("relayMediaVersions").withIndex("by_ownerUserId_and_projectId", (q) => q.eq("ownerUserId", "owner|files").eq("projectId", "project_files")).unique());
    expect(version).toMatchObject({ durableId: id, size: 0 });
    expect((await owner.query(list, { projectId: "project_files", now: Date.now() })).retainedBytes).toBe(0);
  });

  test("releases retained Media Version bytes when Project cleanup deletes the version", async () => {
    const { t } = setup();
    let storageId: Id<"_storage">;
    await t.mutation(reportServiceCapacity, { remainingBytes: 100, reserveBytes: 10 });
    await t.run(async (ctx) => {
      storageId = await ctx.storage.store(new Blob(["file"], { type: "text/plain" }));
      await ctx.db.insert("relayProjectFiles", { ownerUserId: "owner|files", durableId: "file_stored", projectId: "project_files", storageId, title: "Stored", fileName: "stored.txt", mimeType: "text/plain", size: 4, archived: false, portalVisible: false, allowDownload: false, createdAt: "2026-08-18T00:00:00.000Z" });
      await relayStorageUsage.insert(ctx, { namespace: "owner|files", key: "file_stored", id: "file:file_stored", sumValue: 4 });
      await ctx.db.insert("relayMediaVersions", { ownerUserId: "owner|files", durableId: "version_stored", projectId: "project_files", outputId: "output_one", number: 1, provider: "link", normalizedUrl: "https://example.com/version", addedAt: "2026-08-18T00:00:00.000Z", size: 12 });
      await relayStorageUsage.insert(ctx, { namespace: "owner|files", key: "version_stored", id: "version:version_stored", sumValue: 12 });
    });

    await t.mutation(cleanupDeletedProjectRecords, { ownerUserId: "owner|files", projectId: "project_files" });

    await expect(t.run((ctx) => ctx.db.query("relayMediaVersions").take(1))).resolves.toEqual([]);
    await expect(t.run((ctx) => ctx.db.query("relayProjectFiles").take(1))).resolves.toEqual([]);
    await expect(t.run((ctx) => ctx.db.system.get("_storage", storageId))).resolves.toBeNull();
    await expect(t.run((ctx) => relayStorageUsage.sum(ctx, { namespace: "owner|files" }))).resolves.toBe(0);
  });

  test("issues links that fail verification after their short expiry", async () => {
    const url = new URL(await createFileAccessUrl({ fileId: "file_one", ownerUserId: "owner|files" }, 1_000));
    const payload = url.searchParams.get("claim")!;
    const signed = url.searchParams.get("signature")!;
    await expect(verifyFileAccessClaim(payload, signed, 1_001)).resolves.toMatchObject({ fileId: "file_one", expiresAt: 301_000 });
    await expect(verifyFileAccessClaim(payload, signed, 301_000)).resolves.toBeNull();
    const futureUrl = new URL(await createFileAccessUrl({ fileId: "file_one", ownerUserId: "owner|files" }, 999_999_999));
    await expect(verifyFileAccessClaim(futureUrl.searchParams.get("claim")!, futureUrl.searchParams.get("signature")!, 1_000)).resolves.toBeNull();
  });

  test("service pressure refuses new uploads without hiding retained files", async () => {
    const { t, owner } = setup();
    await seedProject(t);
    const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["kept"], { type: "text/plain" })));
    const { reservationId } = await owner.mutation(prepareUpload, { projectId: "project_files", fileName: "kept.txt", mimeType: "text/plain", size: 4 });
    await bindStorage(t, reservationId, storageId);
    const saved = await owner.action(finishUpload, { projectId: "project_files", reservationId, storageId, fileName: "kept.txt", mimeType: "text/plain", title: "Kept" });
    if (!saved.ok) throw new Error(saved.error);
    const { id } = saved;
    await t.mutation(reportServiceCapacity, { remainingBytes: 5, reserveBytes: 3 });
    await expect(owner.mutation(prepareUpload, { projectId: "project_files", fileName: "new.txt", mimeType: "text/plain", size: 3 })).rejects.toThrow("service capacity");
    expect((await owner.query(list, { projectId: "project_files", now: Date.now() })).files[0]?.id).toBe(id);
  });

  test("fails closed without a capacity report and reserves accepted upload bytes", async () => {
    const { t, owner } = setup();
    await t.run((ctx) => ctx.db.insert("relayProjects", { ownerUserId: "owner|files", id: "project_files", name: "Safe files", clientId: "client_one", stage: "Editing", tone: "review", workflowStageId: "editing", due: "2026-08-30", progress: "25", financialType: "nonBillable", importedAt: "2026-08-18T00:00:00.000Z" }));
    await expect(owner.mutation(prepareUpload, { projectId: "project_files", fileName: "safe.txt", mimeType: "text/plain", size: 4 })).rejects.toThrow("service capacity");
    await t.mutation(reportServiceCapacity, { remainingBytes: 30 * 1024 * 1024, reserveBytes: 2 });
    const prepared = await owner.mutation(prepareUpload, { projectId: "project_files", fileName: "safe.txt", mimeType: "text/plain", size: 4 });
    expect(prepared.reservationId).toBeTruthy();
    expect(await t.run(async (ctx) => (await ctx.db.query("relayStoragePolicy").withIndex("by_key", (q) => q.eq("key", "service")).unique())?.remainingBytes)).toBe(10 * 1024 * 1024);
  });

  test("uses configured provider capacity before the first operational report", async () => {
    const previous = process.env.RELAY_STORAGE_CAPACITY_BYTES;
    process.env.RELAY_STORAGE_CAPACITY_BYTES = String(30 * 1024 * 1024);
    try {
      const { t, owner } = setup();
      await t.run((ctx) => ctx.db.insert("relayProjects", { ownerUserId: "owner|files", id: "project_files", name: "Safe files", clientId: "client_one", stage: "Editing", tone: "review", workflowStageId: "editing", due: "2026-08-30", progress: "25", financialType: "nonBillable", importedAt: "2026-08-18T00:00:00.000Z" }));
      await expect(owner.mutation(prepareUpload, { projectId: "project_files", fileName: "safe.txt", mimeType: "text/plain", size: 4 })).resolves.toMatchObject({ reservationId: expect.any(String) });
    } finally {
      if (previous === undefined) delete process.env.RELAY_STORAGE_CAPACITY_BYTES;
      else process.env.RELAY_STORAGE_CAPACITY_BYTES = previous;
    }
  });

  test("reclaims expired upload reservations", async () => {
    const { t } = setup();
    await t.mutation(reportServiceCapacity, { remainingBytes: 1_000_000, reserveBytes: 100 });
    const reservationId = await t.run((ctx) => ctx.db.insert("relayUploadReservations", { ownerUserId: "owner|files", projectId: "project_files", size: 4, declaredSize: 4, status: "pending", createdAt: "2026-08-18T00:00:00.000Z", expiresAt: 0 }));
    await t.mutation(expireUploadReservation, { reservationId });
    await expect(t.run((ctx) => ctx.db.get("relayUploadReservations", reservationId))).resolves.toMatchObject({ status: "expired" });
    await expect(t.run(async (ctx) => (await ctx.db.query("relayStoragePolicy").withIndex("by_key", (q) => q.eq("key", "service")).unique())?.remainingBytes)).resolves.toBe(1_000_004);
  });

  test("portal access is explicit, signed, inline by default, and honors Allow Download", async () => {
    const { t, owner } = setup();
    await seedProject(t);
    const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["copy me"], { type: "text/markdown" })));
    const { reservationId } = await owner.mutation(prepareUpload, { projectId: "project_files", fileName: "safe.md", mimeType: "text/markdown", size: 7 });
    await bindStorage(t, reservationId, storageId);
    const saved = await owner.action(finishUpload, { projectId: "project_files", reservationId, storageId, fileName: "safe.md", mimeType: "text/markdown", title: "Safe markdown" });
    if (!saved.ok) throw new Error(saved.error);
    const { id } = saved;
    await t.run((ctx) => ctx.db.insert("relayClientPortals", { ownerUserId: "owner|files", projectId: "project_files", token: "portal_files", status: "open", publicNotes: "", showDueDate: false, showCompletedDate: false, outputIds: [], expiresAt: null, createdAt: "2026-08-18T00:00:00.000Z", updatedAt: "2026-08-18T00:00:00.000Z" }));
    await expect(t.query(portalAccess, { token: "portal_files", fileId: id, now: Date.now() })).resolves.toBeNull();
    await owner.mutation(setSharing, { id, portalVisible: true, allowDownload: false });
    await expect(t.query(portalAccess, { token: "portal_files", fileId: id, now: Date.now() })).resolves.toMatchObject({ url: expect.any(String), disposition: "inline", renderMode: "safe-markdown", copyable: true });
    await owner.mutation(setSharing, { id, portalVisible: true, allowDownload: true });
    await expect(t.query(portalAccess, { token: "portal_files", fileId: id, now: Date.now() })).resolves.toMatchObject({ disposition: "attachment" });
  });

  test("archive and permanent deletion explain retained size and history effects", async () => {
    const { t, owner } = setup();
    await seedProject(t);
    const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["%PDF-x\n"], { type: "application/pdf" })));
    const { reservationId } = await owner.mutation(prepareUpload, { projectId: "project_files", fileName: "history.pdf", mimeType: "application/pdf", size: 7 });
    await bindStorage(t, reservationId, storageId);
    const saved = await owner.action(finishUpload, { projectId: "project_files", reservationId, storageId, fileName: "history.pdf", mimeType: "application/pdf", title: "History" });
    if (!saved.ok) throw new Error(saved.error);
    const { id } = saved;
    await owner.mutation(setArchived, { id, archived: true });
    expect((await owner.query(list, { projectId: "project_files", now: Date.now() })).retainedBytes).toBe(7);
    await owner.mutation(permanentlyDelete, { id });
    expect((await owner.query(list, { projectId: "project_files", now: Date.now() })).retainedBytes).toBe(0);
    expect(await t.run((ctx) => ctx.db.system.get("_storage", storageId))).toBeNull();
  });

  test("removes a stored blob when final validation rejects it", async () => {
    const { t, owner } = setup();
    await seedProject(t);
    const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["unsafe"], { type: "text/html" })));
    const reservationId = await t.run((ctx) => ctx.db.insert("relayUploadReservations", { ownerUserId: "owner|files", projectId: "project_files", size: 20 * 1024 * 1024, declaredSize: 6, status: "pending", createdAt: "2026-08-18T00:00:00.000Z", expiresAt: Date.now() + 60_000 }));
    await bindStorage(t, reservationId, storageId);
    await expect(owner.action(finishUpload, { projectId: "project_files", reservationId, storageId, fileName: "unsafe.html", mimeType: "text/html", title: "Unsafe" })).resolves.toMatchObject({ ok: false });
    expect(await t.run((ctx) => ctx.db.system.get("_storage", storageId))).toBeNull();
  });

  test("rejects unsafe bytes renamed as an allowed file type", async () => {
    const { t, owner } = setup();
    await seedProject(t);
    const body = "<script>alert(1)</script>";
    const storageId = await t.run((ctx) => ctx.storage.store(new Blob([body], { type: "application/pdf" })));
    const { reservationId } = await owner.mutation(prepareUpload, { projectId: "project_files", fileName: "renamed.pdf", mimeType: "application/pdf", size: body.length });
    await bindStorage(t, reservationId, storageId);
    await expect(owner.action(finishUpload, { projectId: "project_files", reservationId, storageId, fileName: "renamed.pdf", mimeType: "application/pdf", title: "Renamed" })).resolves.toMatchObject({ ok: false, error: expect.stringContaining("contents") });
    await expect(t.run((ctx) => ctx.db.system.get("_storage", storageId))).resolves.toBeNull();
  });

  test("cleans a late upload after its reservation expires", async () => {
    const { t, owner } = setup();
    await seedProject(t);
    const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["late"], { type: "text/plain" })));
    const reservationId = await t.run((ctx) => ctx.db.insert("relayUploadReservations", { ownerUserId: "owner|files", projectId: "project_files", size: 20 * 1024 * 1024, declaredSize: 4, status: "expired", createdAt: "2026-08-18T00:00:00.000Z", expiresAt: 0 }));
    await expect(t.mutation(bindUploadedStorage, { reservationId, storageId })).resolves.toBe(false);
    await expect(t.run((ctx) => ctx.db.system.get("_storage", storageId))).resolves.toBeNull();
    await expect(t.run((ctx) => ctx.db.get("relayUploadReservations", reservationId))).resolves.toBeNull();
  });

  test("does not let two reservations claim the same stored blob", async () => {
    const { t, owner } = setup();
    await seedProject(t);
    const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["once"], { type: "text/plain" })));
    const first = await owner.mutation(prepareUpload, { projectId: "project_files", fileName: "once.txt", mimeType: "text/plain", size: 4 });
    const second = await owner.mutation(prepareUpload, { projectId: "project_files", fileName: "twice.txt", mimeType: "text/plain", size: 4 });
    await bindStorage(t, first.reservationId, storageId);
    await expect(owner.action(finishUpload, { projectId: "project_files", reservationId: first.reservationId, storageId, fileName: "once.txt", mimeType: "text/plain", title: "Once" })).resolves.toMatchObject({ ok: true });
    await expect(t.mutation(bindUploadedStorage, { reservationId: second.reservationId, storageId })).resolves.toBe(false);
    await expect(t.run((ctx) => ctx.db.query("relayProjectFiles").take(10))).resolves.toHaveLength(1);
    await expect(t.run((ctx) => ctx.db.system.get("_storage", storageId))).resolves.not.toBeNull();
  });

  test("does not claim a blob retained by the existing Project file store", async () => {
    const { t, owner } = setup();
    await seedProject(t);
    const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["once"], { type: "text/plain" })));
    await t.run(async (ctx) => {
      const projectFileId = await ctx.db.insert("projectFiles", { projectId: "legacy_project", ownerUserId: "owner|files", category: "Reference", title: "Legacy", description: "", status: "draft", clientVisible: false, downloadable: false, createdByUserId: "owner|files", createdByName: "Zaid", createdAt: "2026-08-18T00:00:00.000Z", updatedAt: "2026-08-18T00:00:00.000Z" });
      await ctx.db.insert("projectFileVersions", { projectId: "legacy_project", projectFileId, versionNumber: 1, provider: "convex", storageId, fileName: "legacy.txt", mimeType: "text/plain", size: 4, uploadedByUserId: "owner|files", uploadedByName: "Zaid", uploadedAt: "2026-08-18T00:00:00.000Z", notes: "" });
    });
    const { reservationId } = await owner.mutation(prepareUpload, { projectId: "project_files", fileName: "relay.txt", mimeType: "text/plain", size: 4 });
    await expect(t.mutation(bindUploadedStorage, { reservationId, storageId })).resolves.toBe(false);
    await expect(t.run((ctx) => ctx.db.system.get("_storage", storageId))).resolves.not.toBeNull();
  });

  test("capacity reports preserve the full 20 MB hold for pending direct uploads", async () => {
    const { t, owner } = setup();
    await seedProject(t);
    await owner.mutation(prepareUpload, { projectId: "project_files", fileName: "held.txt", mimeType: "text/plain", size: 1 });
    await t.mutation(reportServiceCapacity, { remainingBytes: 30 * 1024 * 1024, reserveBytes: 100 });
    await expect(t.run(async (ctx) => ctx.db.query("relayStoragePolicy").withIndex("by_key", (q) => q.eq("key", "service")).unique())).resolves.toMatchObject({ remainingBytes: 10 * 1024 * 1024, heldBytes: 20 * 1024 * 1024 });
  });

  test("portal file access follows portal PIN and expiry controls", async () => {
    const { t, owner } = setup();
    await seedProject(t);
    const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["safe"], { type: "text/plain" })));
    const { reservationId } = await owner.mutation(prepareUpload, { projectId: "project_files", fileName: "safe.txt", mimeType: "text/plain", size: 4 });
    await bindStorage(t, reservationId, storageId);
    const saved = await owner.action(finishUpload, { projectId: "project_files", reservationId, storageId, fileName: "safe.txt", mimeType: "text/plain", title: "Safe", portalVisible: true });
    if (!saved.ok) throw new Error(saved.error);
    const { token } = await owner.mutation(publishPortal, { projectId: "project_files", publicNotes: "", showDueDate: false, showCompletedDate: false, outputIds: [], expiresAt: null, pin: "2468", removePin: false });
    await expect(t.query(portalAccess, { token, fileId: saved.id, now: Date.now() })).resolves.toBeNull();
    await expect(t.query(portalAccess, { token, fileId: saved.id, pin: "0000", now: Date.now() })).resolves.toBeNull();
    await expect(t.query(portalAccess, { token, fileId: saved.id, pin: "2468", now: Date.now() })).resolves.toMatchObject({ url: expect.any(String) });
    await expect(t.query(portalFiles, { token, pin: "2468", now: Date.now() })).resolves.toMatchObject({ access: "open", files: [{ id: saved.id, allowDownload: false, renderMode: "plain-text", url: expect.any(String) }] });
    await t.run(async (ctx) => { const portal = await ctx.db.query("relayClientPortals").withIndex("by_token", (q) => q.eq("token", token)).unique(); if (portal) await ctx.db.patch("relayClientPortals", portal._id, { expiresAt: "2000-01-01T00:00:00.000Z" }); });
    await expect(t.query(portalAccess, { token, fileId: saved.id, pin: "2468", now: Date.now() })).resolves.toBeNull();
  });
});
