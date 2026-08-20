import { env } from "./_generated/server";

function secret() {
  if (env.RELAY_FILE_SIGNING_SECRET.length < 32) throw new Error("Calendar subscriptions require a signing secret.");
  return env.RELAY_FILE_SIGNING_SECRET;
}

function siteUrl() {
  return env.CONVEX_SITE_URL && env.CONVEX_SITE_URL !== "undefined" ? env.CONVEX_SITE_URL : "https://relay-calendar.invalid";
}

function normalizeAppOrigin(value: string) {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Calendar subscriptions require an HTTP app origin.");
  return url.origin;
}

async function sign(ownerUserId: string, appOrigin: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = await crypto.subtle.sign("HMAC", key, encoder.encode(`relay-calendar:${ownerUserId}:${appOrigin}`));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createCalendarFeedUrl(ownerUserId: string, appOrigin: string) {
  const origin = normalizeAppOrigin(appOrigin);
  return `${siteUrl()}/relay-calendar.ics?workspace=${encodeURIComponent(ownerUserId)}&origin=${encodeURIComponent(origin)}&signature=${await sign(ownerUserId, origin)}`;
}

export async function verifyCalendarFeedAccess(ownerUserId: string, appOrigin: string, signature: string) {
  let origin: string;
  try {
    origin = normalizeAppOrigin(appOrigin);
  } catch {
    return null;
  }
  const expected = await sign(ownerUserId, origin);
  if (signature.length !== expected.length) return null;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) mismatch |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  return mismatch === 0 ? origin : null;
}
