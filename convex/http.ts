import { httpRouter, makeFunctionReference } from "convex/server";
import { httpAction } from "./_generated/server";
import { verifyFileAccessClaim, verifyUploadClaim } from "./relayProjectFileAccess";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { verifyCalendarFeedAccess } from "./relayCalendarFeedAccess";
import { serializeCalendarFeed } from "../src/relay/domain/calendar-feed";

const http = httpRouter();
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const calendarEventsRef = makeFunctionReference<"query", { ownerUserId: string }, Array<{ id: string; date: string; title: string; href: string }>>("relayCalendar:feedEvents");

async function limitedBlob(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: ArrayBuffer[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_FILE_BYTES) { await reader.cancel(); return null; }
    const copy = new Uint8Array(value.byteLength);
    copy.set(value);
    chunks.push(copy.buffer);
  }
  return new Blob(chunks, { type: request.headers.get("Content-Type") ?? "application/octet-stream" });
}

http.route({
  path: "/project-file-upload",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const payload = url.searchParams.get("claim");
    const signed = url.searchParams.get("signature");
    const claim = payload && signed ? await verifyUploadClaim(payload, signed, Date.now()) : null;
    if (!claim) return new Response("Invalid or expired upload link.", { status: 403 });
    const blob = await limitedBlob(request);
    if (!blob) return new Response("Files must be no larger than 20 MB.", { status: 413 });
    const storageId = await ctx.storage.store(blob);
    try {
      const bound = await ctx.runMutation(internal.relayProjectFiles.bindUploadedStorage, { reservationId: claim.reservationId as Id<"relayUploadReservations">, storageId });
      return bound ? Response.json({ storageId }) : new Response("Upload reservation is no longer available.", { status: 409 });
    } catch (error) {
      await ctx.storage.delete(storageId);
      throw error;
    }
  }),
});

http.route({
  path: "/relay-calendar.ics",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const ownerUserId = url.searchParams.get("workspace");
    const requestedOrigin = url.searchParams.get("origin");
    const signature = url.searchParams.get("signature");
    const appOrigin = ownerUserId && requestedOrigin && signature ? await verifyCalendarFeedAccess(ownerUserId, requestedOrigin, signature) : null;
    if (!ownerUserId || !appOrigin) return new Response("Invalid calendar subscription.", { status: 403 });
    const events = await ctx.runQuery(calendarEventsRef, { ownerUserId });
    const body = serializeCalendarFeed({ name: "Relay commitments", generatedAt: new Date().toISOString().replaceAll(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z"), events: events.map((event) => ({ ...event, url: new URL(event.href, appOrigin).href })) });
    return new Response(body, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": "inline; filename=relay-calendar.ics", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  }),
});

http.route({
  path: "/project-file",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const payload = url.searchParams.get("claim");
    const signed = url.searchParams.get("signature");
    if (!payload || !signed) return new Response("Invalid file link.", { status: 403 });
    const claim = await verifyFileAccessClaim(payload, signed, Date.now());
    if (!claim) return new Response("This file link has expired.", { status: 403 });
    const file = await ctx.runQuery(internal.relayProjectFiles.resolveFileAccess, { fileId: claim.fileId, ownerUserId: claim.ownerUserId, portalToken: claim.portalToken, now: Date.now() });
    if (!file) return new Response("File not found.", { status: 404 });
    const blob = await ctx.storage.get(file.storageId);
    if (!blob) return new Response("File not found.", { status: 404 });
    return new Response(blob, { headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `${file.allowDownload ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
      "Cache-Control": "private, no-store",
      "Access-Control-Allow-Origin": "*",
      "Content-Security-Policy": "sandbox; default-src 'none'",
      "X-Content-Type-Options": "nosniff",
    } });
  }),
});

export default http;
