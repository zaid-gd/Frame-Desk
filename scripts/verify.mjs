import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const baseUrl = process.env.CUTLAB_VERIFY_URL || "http://localhost:3000";

const routes = [
  ["/", 200, ["Dashboard", "Salary Edits Done", "Sort", "Payment"]],
  ["/projects", 200, ["Projects", "Project Library"]],
  ["/clients", 200, ["Clients", "New Project"]],
  ["/timeline", 200, ["Timeline", "Delivery timeline"]],
  ["/calendar", 200, ["Calendar"]],
  ["/media", 200, ["Media", "Media Packages"]],
  ["/feedback", 200, ["Feedback", "Review Queue"]],
  ["/templates", 200, ["Templates", "Reusable production structures"]],
  ["/reports", 200, ["Reports", "Work Mix"]],
  ["/team", 200, ["Team", "Team Members"]],
  ["/settings", 200, ["Settings", "Integrations", "Appearance"]],
  ["/profile", 200, ["CutLab", "Share Profile"]],
  ["/profile/edit", 200, ["Edit Profile", "Profile Bio"]],
  ["/organization", 200, ["Organization Profile", "Team access"]],
  ["/missing-route", 404, ["Page not found"]]
];

const knownInternalRoutes = new Set(routes.map(([route]) => route));
knownInternalRoutes.add("/icon.svg");

const routeFiles = [
  "src/app/page.tsx",
  "src/app/projects/page.tsx",
  "src/app/clients/page.tsx",
  "src/app/timeline/page.tsx",
  "src/app/calendar/page.tsx",
  "src/app/media/page.tsx",
  "src/app/feedback/page.tsx",
  "src/app/templates/page.tsx",
  "src/app/reports/page.tsx",
  "src/app/team/page.tsx",
  "src/app/settings/page.tsx",
  "src/app/profile/page.tsx",
  "src/app/profile/edit/page.tsx",
  "src/app/organization/page.tsx",
  "src/app/error.tsx",
  "src/app/not-found.tsx",
  "src/app/icon.svg"
];

const forbiddenText = [
  "Unauthorized",
  "profile selection",
  "not wired",
  "Coming soon",
  "Export Defaults",
  "Workspace Details",
  "Workspace Members",
  "Workspace people",
  "Workspace setup",
  "Workspace URL",
  "Export Settings",
  "Free Work"
];
const requiredStaticAssets = [
  "assets/readme-hero.png",
  "assets/readme-workflow.png",
  "assets/readme-features.png",
  "public/og-image.png"
];
const sourceChecks = [
  ["src/app/tracker-app.tsx", "applyRootThemeVariables(settings)", "root theme variable synchronization"],
  ["src/app/tracker-app.tsx", "function DeleteProjectDialog", "project delete confirmation dialog"],
  ["src/lib/data-context.tsx", "function normalizeStoredItem", "stored project normalization"],
  ["src/lib/data-context.tsx", "function normalizeSalaryState", "stored salary batch normalization"],
  ["src/lib/data-context.tsx", "normalizeSalaryState(readJson<unknown>(SALARY_STORAGE_KEY", "salary storage malformed-data guard"],
  ["src/lib/data-context.tsx", "function isGitHubExternalAccount", "GitHub auth account detection"],
  ["src/lib/data-context.tsx", "function shouldUseAuthProfileValue", "auth profile placeholder replacement"],
  ["src/lib/data-context.tsx", "await replaceAllItems({ items: localItems })", "awaited cloud project migration"],
  ["src/lib/data-context.tsx", "Cloud sync failed. Projects are saved locally for now.", "cloud project sync local fallback"],
  ["src/lib/data-context.tsx", "function stringSetting", "stored settings scalar normalization"],
  ["src/lib/data-context.tsx", "function optionSetting", "stored settings option normalization"],
  ["src/lib/data-context.tsx", "function colorSetting", "stored settings color normalization"],
  ["src/lib/data-context.tsx", "function booleanRecordSetting", "stored settings boolean-record normalization"],
  ["src/lib/data-context.tsx", "function stringRecordSetting", "stored settings string-record normalization"],
  ["src/lib/data-context.tsx", "function freshDefaultSettings", "fresh default settings factory"],
  ["src/lib/data-context.tsx", "studioName: \"CutLab Studio\"", "non-blank fresh install studio defaults"],
  ["src/lib/data-context.tsx", "const teamRoleOptions", "centralized team role options"],
  ["src/lib/data-context.tsx", "teamRole: optionSetting(r.teamRole, teamRoleOptions", "stored team role normalization"],
  ["src/lib/data-context.tsx", "role: optionSetting(m.role, teamRoleOptions", "stored team member role normalization"],
  ["src/lib/data-context.tsx", "s.trim() ? [s.trim()] : []", "stored workflow stage trimming"],
  ["src/lib/data-context.tsx", "const storedItems = Array.isArray(stored) ? stored : []", "malformed project storage guard"],
  ["src/app/tracker-app.tsx", "[defaultAccent, \"#2f6edb\"", "persistable accent color swatches"],
  ["src/lib/profiles.ts", "statusOptions: [\"Planned\", \"In Progress\", \"Delivered\", \"Cancelled\"]", "profile status options aligned with app statuses"],
  ["src/app/tracker-app.tsx", "Math.max(0, amount)", "non-negative money normalization"],
  ["src/app/tracker-app.tsx", "function copyText", "safe clipboard helper"],
  ["src/app/tracker-app.tsx", "function openNewProject", "new project workflow"],
  ["src/app/tracker-app.tsx", "function saveProject", "project save workflow"],
  ["src/app/tracker-app.tsx", "function openEditProject", "project edit workflow"],
  ["src/app/tracker-app.tsx", "function requestDeleteProject", "project delete request workflow"],
  ["src/app/tracker-app.tsx", "function confirmDeleteProject", "project delete confirmation workflow"],
  ["src/app/tracker-app.tsx", "function openTemplateProject", "template project workflow"],
  ["src/app/tracker-app.tsx", "function clearFilters", "dashboard filter reset workflow"],
  ["src/app/tracker-app.tsx", "function clearClientFilters", "client filter reset workflow"],
  ["src/app/tracker-app.tsx", "function shiftMonth", "calendar month navigation workflow"],
  ["src/app/tracker-app.tsx", "function jumpToToday", "calendar today workflow"],
  ["src/app/tracker-app.tsx", "function addMember", "team member add workflow"],
  ["src/app/tracker-app.tsx", "function updateMember", "team member edit workflow"],
  ["src/app/tracker-app.tsx", "function removeMember", "team member remove workflow"],
  ["src/app/tracker-app.tsx", "function openIntegration", "integration dialog workflow"],
  ["src/app/tracker-app.tsx", "function saveIntegration", "integration save workflow"],
  ["src/app/tracker-app.tsx", "function disconnectIntegration", "integration disconnect workflow"],
  ["src/app/tracker-app.tsx", "function resetSettings", "settings reset workflow"],
  ["src/app/tracker-app.tsx", "function updateNotification", "notification toggle workflow"],
  ["src/app/tracker-app.tsx", "async function shareProfile", "profile sharing workflow"],
  ["src/app/tracker-app.tsx", "Profile Bio", "focused profile edit panel"],
  ["src/app/tracker-app.tsx", "Public profile", "bottom identity public profile menu"],
  ["src/app/tracker-app.tsx", "Organization profile", "bottom identity organization profile menu"],
  ["src/app/tracker-app.tsx", "navigationItems", "sidebar route list"],
  ["src/app/tracker-app.tsx", "aria-label={`Open ${client.name} client details`}", "keyboard-accessible client rows"],
  ["src/app/tracker-app.tsx", "aria-label={`Select ${formatDate(key, settings.dateFormat)}", "keyboard-accessible calendar days"],
  ["src/app/tracker-app.tsx", "aria-label=\"Open profile menu\"", "labeled profile menu trigger"],
  ["src/app/tracker-app.tsx", "aria-label=\"Previous month\"", "labeled previous month control"],
  ["src/app/tracker-app.tsx", "aria-label=\"Next month\"", "labeled next month control"],
  ["src/app/tracker-app.tsx", "aria-label={`Remove workflow stage ${index + 1}`}", "labeled remove stage control"],
  ["src/app/tracker-app.tsx", "aria-label=\"Open profile settings\"", "labeled profile settings control"],
  ["src/app/page.tsx", "function DashboardRoute", "root route component naming"],
  ["src/app/layout.tsx", "themeBootScript", "pre-hydration theme boot script"],
  ["src/app/layout.tsx", "[\"Light\", \"Dark\", \"System\"].indexOf(settings.theme)", "boot script theme normalization"],
  ["src/app/layout.tsx", "/^#[0-9a-fA-F]{6}$/.test(settings.accentColor)", "boot script accent normalization"],
  ["src/app/layout.tsx", "metadataBase", "metadata base URL"],
  ["src/app/layout.tsx", "openGraph", "public Open Graph metadata"],
  ["src/app/layout.tsx", "twitter", "public Twitter card metadata"],
  ["src/app/layout.tsx", "/og-image.png", "served social preview image metadata"],
  ["src/app/layout.tsx", "export const viewport", "responsive viewport metadata"],
  ["src/app/layout.tsx", "/icon.svg", "app icon metadata"],
  ["src/app/layout.tsx", "data-clerk-modal-centering", "Clerk modal centering CSS fallback"],
  ["src/app/layout.tsx", "clerkModalCenteringCss", "Clerk modal centering stylesheet"],
  ["src/app/providers.tsx", "modalBackdrop", "Clerk modal backdrop appearance centering"],
  ["src/app/providers.tsx", "modalContent", "Clerk modal content appearance centering"],
  ["package.json", "\"name\": \"cutlab-studio\"", "branded package name"],
  ["package.json", "\"node\": \">=22\"", "Node engine requirement"],
  ["next.config.mjs", "async headers()", "production response headers"],
  ["next.config.mjs", "X-Content-Type-Options", "content type sniffing protection"],
  ["next.config.mjs", "Permissions-Policy", "browser permissions policy"],
  ["src/proxy.ts", "clerkMiddleware", "Clerk proxy integration"],
  ["src/proxy.ts", "NextResponse.next()", "local-first proxy fallback"],
  ["convex/auth.config.ts", "CLERK_JWT_ISSUER_DOMAIN", "Convex Clerk auth configuration"],
  ["convex/workItems.ts", ".take(500)", "bounded Convex work item queries"],
  ["convex/settings.ts", ".take(10)", "duplicate-safe Convex settings upsert"],
  ["convex/workItems.ts", "id: v.string()", "cloud project id persistence"],
  ["convex/salaryBatches.ts", "id: batch.id ?? `batch-${batch.number}`", "cloud salary batch id persistence"],
  ["src/app/providers.tsx", "mode={convex && clerkPublishableKey ? \"cloud\" : \"local\"}", "local-first provider fallback"],
  ["package.json", "\"check:full\"", "single full verification npm script"],
  ["scripts/verify-production.mjs", "waitForServer", "production runtime verification script"],
  ["package.json", "\"verify:prod\"", "production verification npm script"],
  ["scripts/verify-browser-smoke.mjs", "Browser smoke verified", "headless browser smoke verification script"],
  ["package.json", "\"verify:browser\"", "browser smoke verification npm script"],
  [".github/workflows/ci.yml", "npm run check:full", "CI full verification step"]
];

const forbiddenSourceChecks = [
  ["src/app/tracker-app.tsx", "exportDefaults", "removed export defaults state"],
  ["src/app/tracker-app.tsx", "Export Defaults", "removed export defaults settings panel"],
  ["src/app/tracker-app.tsx", "Workspace Details", "removed workspace setup settings panel"],
  ["src/app/tracker-app.tsx", "Workspace URL", "removed workspace URL settings control"],
  ["src/app/tracker-app.tsx", "Export Settings", "removed settings export button"],
  ["README.md", "Export defaults", "README avoids removed export settings"],
  ["README.md", "unpaid freelance work", "README avoids old free-work framing"]
];

const appSourceHygienePatterns = [
  [/console\./, "debug console call"],
  [/\bdebugger\b/, "debugger statement"],
  [/alert\(/, "browser alert"],
  [/@ts-ignore|@ts-expect-error/, "TypeScript suppression comment"],
  [/\bas any\b/, "broad any assertion"]
];

let failures = 0;
let checkedInternalLinks = 0;
let checkedNextAssets = 0;
let checkedSourceLinks = 0;
let checkedPngAssets = 0;

for (const asset of requiredStaticAssets) {
  if (!existsSync(asset)) {
    failures += 1;
    console.error(`Missing static asset: ${asset}`);
    continue;
  }
  const dimensions = readPngDimensions(asset);
  if (!dimensions) {
    failures += 1;
    console.error(`Static asset is not a valid PNG: ${asset}`);
    continue;
  }
  checkedPngAssets += 1;
  if (dimensions.width < 1200 || dimensions.height < 675) {
    failures += 1;
    console.error(`Static PNG is too small for the public showcase: ${asset} is ${dimensions.width}x${dimensions.height}`);
  }
  const aspectRatio = dimensions.width / dimensions.height;
  if (Math.abs(aspectRatio - 16 / 9) > 0.02) {
    failures += 1;
    console.error(`Static PNG should be close to 16:9: ${asset} is ${dimensions.width}x${dimensions.height}`);
  }
}

const readme = existsSync("README.md") ? readFileSync("README.md", "utf8") : "";
if (!readme) {
  failures += 1;
  console.error("Missing README.md");
}
for (const match of readme.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
  const imagePath = match[1];
  if (/^https?:\/\//.test(imagePath)) continue;
  if (!existsSync(imagePath)) {
    failures += 1;
    console.error(`README image does not exist: ${imagePath}`);
  }
}

for (const file of routeFiles) {
  if (!existsSync(file)) {
    failures += 1;
    console.error(`Missing route file: ${file}`);
  }
}

for (const [file, text, label] of sourceChecks) {
  if (!existsSync(file)) {
    failures += 1;
    console.error(`Missing source file for ${label}: ${file}`);
    continue;
  }
  const source = readFileSync(file, "utf8");
  if (!source.includes(text)) {
    failures += 1;
    console.error(`${file} is missing ${label}: ${text}`);
  }
}

for (const [file, text, label] of forbiddenSourceChecks) {
  if (!existsSync(file)) {
    failures += 1;
    console.error(`Missing source file for ${label}: ${file}`);
    continue;
  }
  const source = readFileSync(file, "utf8");
  if (source.includes(text)) {
    failures += 1;
    console.error(`${file} still contains ${label}: ${text}`);
  }
}

for (const file of listSourceFiles("src")) {
  const source = readFileSync(file, "utf8");
  for (const [pattern, label] of appSourceHygienePatterns) {
    if (!pattern.test(source)) continue;
    failures += 1;
    console.error(`${file} contains ${label}: ${pattern}`);
  }
}

for (const file of routeFiles.filter((file) => file.endsWith(".tsx"))) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/href="([^"]+)"/g)) {
    const target = match[1];
    if (!target.startsWith("/") || target.startsWith("/assets/") || target.startsWith("/_next/")) continue;
    const pathname = target.split(/[?#]/)[0];
    checkedSourceLinks += 1;
    if (!knownInternalRoutes.has(pathname)) {
      failures += 1;
      console.error(`${file} contains unknown source link: ${target}`);
    }
  }
}

for (const [route, expectedStatus, expectedText] of routes) {
  const url = `${baseUrl}${route}`;
  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    failures += 1;
    console.error(`Could not fetch ${url}: ${error instanceof Error ? error.message : String(error)}`);
    continue;
  }

  const body = await response.text();
  if (response.status !== expectedStatus) {
    failures += 1;
    console.error(`${route} returned ${response.status}, expected ${expectedStatus}`);
  }

  for (const text of expectedText) {
    if (!body.includes(text)) {
      failures += 1;
      console.error(`${route} is missing expected text: ${text}`);
    }
  }

  for (const text of forbiddenText) {
    if (body.includes(text)) {
      failures += 1;
      console.error(`${route} contains forbidden text: ${text}`);
    }
  }

  if (route === "/") {
    const headerChecks = [
      ["x-content-type-options", "nosniff", "content type sniffing protection"],
      ["referrer-policy", "strict-origin-when-cross-origin", "referrer policy"],
      ["x-frame-options", "DENY", "clickjacking protection"]
    ];

    for (const [name, value, label] of headerChecks) {
      const actual = response.headers.get(name);
      if (actual !== value) {
        failures += 1;
        console.error(`${route} returned unexpected ${label} header: ${actual || "<missing>"}`);
      }
    }

    const permissionsPolicy = response.headers.get("permissions-policy") || "";
    for (const directive of ["camera=()", "microphone=()", "geolocation=()"]) {
      if (!permissionsPolicy.includes(directive)) {
        failures += 1;
        console.error(`${route} permissions-policy is missing ${directive}: ${permissionsPolicy || "<missing>"}`);
      }
    }

    const metadataChecks = [
      ["<title>CutLab Studio</title>", "document title"],
      ['name="description" content="A local-first video editing work tracker for editors."', "description meta tag"],
      ['property="og:title" content="CutLab Studio"', "Open Graph title"],
      ['property="og:image"', "Open Graph image"],
      ['content="https://cutlab.studio/og-image.png"', "served Open Graph image URL"],
      ['name="twitter:card" content="summary_large_image"', "Twitter card"],
      ['rel="icon" href="/icon.svg"', "icon link"],
      ["data-clerk-modal-centering", "Clerk modal centering style tag"]
    ];

    for (const [text, label] of metadataChecks) {
      if (!body.includes(text)) {
        failures += 1;
        console.error(`${route} is missing ${label}: ${text}`);
      }
    }
  }

  if (expectedStatus === 200) {
    const hrefPattern = /\s(?:href|src)="([^"]+)"/g;
    for (const match of body.matchAll(hrefPattern)) {
      const target = match[1];
      if (!target.startsWith("/") || target.startsWith("/assets/")) continue;
      if (target.startsWith("/_next/")) {
        checkedNextAssets += 1;
        const assetResponse = await fetch(`${baseUrl}${target}`).catch((error) => {
          failures += 1;
          console.error(`Could not fetch Next asset ${target}: ${error instanceof Error ? error.message : String(error)}`);
          return null;
        });
        if (assetResponse && assetResponse.status !== 200) {
          failures += 1;
          console.error(`Next asset ${target} returned ${assetResponse.status}, expected 200`);
        }
        continue;
      }
      checkedInternalLinks += 1;
      const pathname = target.split(/[?#]/)[0];
      if (!knownInternalRoutes.has(pathname)) {
        failures += 1;
        console.error(`${route} contains unknown internal link: ${target}`);
      }
    }
  }
}

const iconResponse = await fetch(`${baseUrl}/icon.svg`).catch((error) => {
  failures += 1;
  console.error(`Could not fetch ${baseUrl}/icon.svg: ${error instanceof Error ? error.message : String(error)}`);
  return null;
});
if (iconResponse) {
  const iconBody = await iconResponse.text();
  const contentType = iconResponse.headers.get("content-type") || "";
  if (iconResponse.status !== 200) {
    failures += 1;
    console.error(`/icon.svg returned ${iconResponse.status}, expected 200`);
  }
  if (!contentType.includes("image/svg+xml")) {
    failures += 1;
    console.error(`/icon.svg returned unexpected content type: ${contentType}`);
  }
  if (!iconBody.includes("<svg") || !iconBody.includes("viewBox")) {
    failures += 1;
    console.error("/icon.svg does not look like an SVG icon.");
  }
}

const socialImageResponse = await fetch(`${baseUrl}/og-image.png`).catch((error) => {
  failures += 1;
  console.error(`Could not fetch ${baseUrl}/og-image.png: ${error instanceof Error ? error.message : String(error)}`);
  return null;
});
if (socialImageResponse) {
  const contentType = socialImageResponse.headers.get("content-type") || "";
  const bytes = await socialImageResponse.arrayBuffer();
  if (socialImageResponse.status !== 200) {
    failures += 1;
    console.error(`/og-image.png returned ${socialImageResponse.status}, expected 200`);
  }
  if (!contentType.includes("image/png")) {
    failures += 1;
    console.error(`/og-image.png returned unexpected content type: ${contentType}`);
  }
  if (bytes.byteLength < 100_000) {
    failures += 1;
    console.error(`/og-image.png looks too small for a real social preview image: ${bytes.byteLength} bytes`);
  }
}

function readPngDimensions(path) {
  const bytes = readFileSync(path);
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length < 24 || !signature.every((byte, index) => bytes[index] === byte)) return null;
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20)
  };
}

function listSourceFiles(directory) {
  const entries = readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listSourceFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

if (failures) {
  console.error(`Verification failed with ${failures} issue${failures === 1 ? "" : "s"}.`);
  process.exit(1);
}

console.log(`Verified ${routes.length} routes, ${checkedInternalLinks} rendered internal links, ${checkedSourceLinks} source links, ${checkedNextAssets} Next assets, ${checkedPngAssets} PNG assets, and ${sourceChecks.length} source invariants against ${baseUrl}.`);
