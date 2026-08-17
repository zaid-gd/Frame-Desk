import { env } from "./_generated/server";

const ACCESS_LIFETIME_MS = 5 * 60 * 1000;

export type FileAccessClaim = {
  fileId: string;
  expiresAt: number;
  ownerUserId?: string;
  portalToken?: string;
};

function signingSecret() {
  const secret = env.RELAY_FILE_SIGNING_SECRET;
  if (!secret || secret.length < 32) throw new Error("Project file access is unavailable until RELAY_FILE_SIGNING_SECRET is configured.");
  return secret;
}

function hex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function signature(payload: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(signingSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
}

function siteUrl() {
  return (env as typeof env & { readonly CONVEX_SITE_URL?: string }).CONVEX_SITE_URL ?? "https://relay-files.invalid";
}

export async function createFileAccessUrl(claim: Omit<FileAccessClaim, "expiresAt">, now: number) {
  const payload = JSON.stringify({ ...claim, expiresAt: now + ACCESS_LIFETIME_MS });
  const signed = await signature(payload);
  return `${siteUrl()}/project-file?claim=${encodeURIComponent(payload)}&signature=${signed}`;
}

export async function createUploadUrl(reservationId: string, expiresAt: number) {
  const payload = JSON.stringify({ reservationId, expiresAt });
  return `${siteUrl()}/project-file-upload?claim=${encodeURIComponent(payload)}&signature=${await signature(payload)}`;
}

export async function verifyUploadClaim(payload: string, signed: string, now: number) {
  if (await signature(payload) !== signed) return null;
  const claim: unknown = JSON.parse(payload);
  if (!claim || typeof claim !== "object" || !("reservationId" in claim) || typeof claim.reservationId !== "string" || !("expiresAt" in claim) || typeof claim.expiresAt !== "number" || claim.expiresAt <= now || claim.expiresAt > now + 16 * 60 * 1000) return null;
  return { reservationId: claim.reservationId, expiresAt: claim.expiresAt };
}

export async function verifyFileAccessClaim(payload: string, signed: string, now: number): Promise<FileAccessClaim | null> {
  const expected = await signature(payload);
  if (signed.length !== expected.length) return null;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) mismatch |= expected.charCodeAt(index) ^ signed.charCodeAt(index);
  if (mismatch !== 0) return null;
  const claim: unknown = JSON.parse(payload);
  if (!claim || typeof claim !== "object" || !("fileId" in claim) || typeof claim.fileId !== "string" || !("expiresAt" in claim) || typeof claim.expiresAt !== "number" || claim.expiresAt <= now || claim.expiresAt > now + ACCESS_LIFETIME_MS + 60_000) return null;
  if ("portalToken" in claim && claim.portalToken !== undefined && typeof claim.portalToken !== "string") return null;
  if ("ownerUserId" in claim && claim.ownerUserId !== undefined && typeof claim.ownerUserId !== "string") return null;
  const hasPortalToken = "portalToken" in claim && typeof claim.portalToken === "string";
  const hasOwnerUserId = "ownerUserId" in claim && typeof claim.ownerUserId === "string";
  if (!hasPortalToken && !hasOwnerUserId) return null;
  return claim as FileAccessClaim;
}
