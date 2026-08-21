import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const baseUrl = process.env.CUTLAB_VERIFY_URL || "http://localhost:3000";
const accessPassword = process.env.CUTLAB_VERIFY_ACCESS_PASSWORD;
let failures = 0;

const activeRelayFiles = [
  "src/app/page.tsx",
  "src/app/providers.tsx",
  ...listFiles("src/app/relay"),
  ...listFiles("src/relay"),
];

const retiredPresentationPaths = [
  "src/app/tracker-app.tsx",
  "src/legacy-frame-desk",
];
for (const path of retiredPresentationPaths) {
  if (!existsSync(path) || (path === "src/legacy-frame-desk" && listFiles(path).length === 0)) continue;
  failures += 1;
  console.error(`${path} still contains the replaced Frame Desk presentation.`);
}
for (const file of activeRelayFiles) {
  const source = readFileSync(file, "utf8");
  for (const imported of importedModules(source)) {
    if (!["data-context", "tracker-app", "workItems"].some((forbidden) => imported.includes(forbidden))) continue;
    failures += 1;
    console.error(`${file} crosses the Relay boundary through ${imported}`);
  }
}

let accessCookie = "";
if (accessPassword) {
  const response = await fetch(`${baseUrl}/api/access`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Sec-Fetch-Site": "same-origin" },
    body: JSON.stringify({ password: accessPassword }),
  });
  accessCookie = (response.headers.get("set-cookie") || "").split(";", 1)[0];
  if (response.status !== 200 || !accessCookie) {
    failures += 1;
    console.error(`Access wall verification returned ${response.status} without an access cookie.`);
  }
}

const headers = accessCookie ? { Cookie: accessCookie } : undefined;
for (const [path, text] of [
  ["/", "<title>Welcome to Relay</title>"],
  ["/relay", "<title>Welcome to Relay</title>"],
  ["/relay/dashboard", "Relay"],
  ["/relay/projects", "Relay"],
  ["/relay/clients", "Relay"],
  ["/relay/templates", "Relay"],
  ["/relay/calendar", "Relay"],
  ["/relay/files", "Relay"],
  ["/relay/team", "Relay"],
  ["/relay/settings", "Relay"],
  ["/client-portal/release-smoke-token", "Relay"],
]) {
  const response = await fetch(`${baseUrl}${path}`, { headers });
  const body = await response.text();
  if (response.status !== 200 || !body.includes(text)) {
    failures += 1;
    console.error(`${path} did not return the Relay product (${response.status}, missing ${text}).`);
  }
  if (path === "/") verifySecurityHeaders(response);
}

for (const path of ["/projects", "/settings", "/u/old-profile"]) {
  const response = await fetch(`${baseUrl}${path}`, { headers, redirect: "manual" });
  const location = response.headers.get("location");
  if (![307, 308].includes(response.status) || !location?.endsWith("/")) {
    failures += 1;
    console.error(`${path} was not retired to the Relay root (${response.status}, ${location || "no location"}).`);
  }
}

if (failures) {
  console.error(`Relay verification failed with ${failures} issue${failures === 1 ? "" : "s"}.`);
  process.exit(1);
}

console.log("Relay runtime, route retirement, source boundary, and security headers verified.");

function verifySecurityHeaders(response) {
  const checks = [
    ["x-content-type-options", "nosniff"],
    ["referrer-policy", "strict-origin-when-cross-origin"],
    ["x-frame-options", "DENY"],
  ];
  for (const [name, expected] of checks) {
    if (response.headers.get(name) === expected) continue;
    failures += 1;
    console.error(`/ returned an invalid ${name} header.`);
  }
}

function listFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

function importedModules(source) {
  return [...source.matchAll(/(?:import|export)\s+(?:[\s\S]*?\sfrom\s*)?["']([^"']+)["']/g)]
    .map((match) => match[1]);
}
