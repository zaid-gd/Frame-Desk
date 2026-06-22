import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const baseUrl = process.env.CUTLAB_VERIFY_URL || "http://localhost:3000";

const routes = [
  ["/", 200, ["Dashboard", "Production overview", "Deadline queue", "Production flow", "Activity", "Salary batch", "Recent Activity", "Team Activity", "All Projects", "Batch progress", "Sort", "Payment"]],
  ["/projects", 200, ["Projects", "My Projects", "Team Projects"]],
  ["/clients", 200, ["Clients", "New Client"]],
  ["/timeline", 200, ["Timeline", "Delivery timeline"]],
  ["/calendar", 200, ["Calendar"]],
  ["/media", 200, ["Media", "Project packages"]],
  ["/resources", 200, ["Resources"]],
  ["/feedback", 200, ["Feedback", "Review Queue"]],
  ["/templates", 200, ["Templates", "Start with a practical editing workflow", "YouTube Video", "Client Retainer Package", "Blank Project", "Use template"]],
  ["/reports", 200, ["Reports", "Invoice drafts", "Salary Batch Ledger", "Editor Summary", "Delivered Projects"]],
  ["/integrations", 200, ["Integrations", "Global Integrations", "Project Integrations", "Google Drive", "Google Calendar"]],
  ["/team", 200, ["Team", "Active members"]],
  ["/team-chat", 200, ["Team Chat", "Manage Team"]],
  ["/settings", 200, ["Settings", "Project Tags", "Integrations", "Appearance"]],
  ["/account", 200, ["Account Settings"]],
  ["/profile", 200, ["CutLab", "Share Profile"]],
  ["/profile/edit", 200, ["Edit Profile", "Profile Bio"]],
  ["/organization", 200, ["Organization Profile", "Team access"]],
  ["/client-portal", 200, ["Client Portal", "A project link is required", "No account required"]],
  ["/privacy", 200, ["Privacy Policy", "Local-First Storage", "Clerk", "Convex"]],
  ["/terms", 200, ["Terms of Service", "Local Mode", "Acceptable Use"]],
  ["/missing-route", 404, ["Page not found"]]
];

const knownInternalRoutes = new Set(routes.map(([route]) => route));
knownInternalRoutes.add("/icon.png");
knownInternalRoutes.add("/manifest.webmanifest");

const routeFiles = [
  "src/app/page.tsx",
  "src/app/projects/page.tsx",
  "src/app/clients/page.tsx",
  "src/app/timeline/page.tsx",
  "src/app/calendar/page.tsx",
  "src/app/media/page.tsx",
  "src/app/resources/page.tsx",
  "src/app/feedback/page.tsx",
  "src/app/templates/page.tsx",
  "src/app/reports/page.tsx",
  "src/app/integrations/page.tsx",
  "src/app/team/page.tsx",
  "src/app/team-chat/page.tsx",
  "src/app/settings/page.tsx",
  "src/app/account/page.tsx",
  "src/app/profile/page.tsx",
  "src/app/profile/edit/page.tsx",
  "src/app/organization/page.tsx",
  "src/app/client-portal/page.tsx",
  "src/app/client-portal/[token]/page.tsx",
  "src/app/client-portal/client-portal-view.tsx",
  "src/app/privacy/page.tsx",
  "src/app/terms/page.tsx",
  "src/app/error.tsx",
  "src/app/not-found.tsx",
  "src/app/icon.png"
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
  "assets/readme/command-center.png",
  "assets/readme/editing-templates.png",
  "assets/readme/file-versions.png",
  "public/og-image.png"
];
const requiredBrandAssets = [
  "public/brand/logo/cutlab-studio.png",
  "public/brand/favicon.png",
  "public/brand/cutlab-mark.svg",
  "public/brand/app-icon-dark.svg",
  "public/brand/app-icon-light.svg",
  "public/brand/icons/app-icon-dark-192.png",
  "public/brand/icons/app-icon-dark-512.png",
  "public/brand/empty-states/projects.png",
  "public/brand/empty-states/clients.png",
  "public/brand/empty-states/schedule.png",
  "public/brand/empty-states/library.png",
  "public/brand/empty-states/feedback.png",
  "public/brand/empty-states/reports.png",
  "public/brand/empty-states/team.png",
  "public/brand/empty-states/resources.png"
];
const sourceChecks = [
  ["src/app/tracker-app.tsx", "applyRootThemeVariables(settings)", "root theme variable synchronization"],
  ["src/app/tracker-app.tsx", "function DeleteProjectDialog", "project delete confirmation dialog"],
  ["src/lib/data-context.tsx", "function normalizeStoredItem", "stored project normalization"],
  ["src/lib/data-context.tsx", "function normalizeWorkItems", "cloud project metadata stripping"],
  ["src/lib/data-context.tsx", "function normalizeSalaryState", "stored salary batch normalization"],
  ["src/lib/data-context.tsx", "normalizeSalaryState(readJson<unknown>(SALARY_STORAGE_KEY", "salary storage malformed-data guard"],
  ["src/lib/data-context.tsx", "function isGitHubExternalAccount", "GitHub auth account detection"],
  ["src/lib/data-context.tsx", "function shouldUseAuthProfileValue", "auth profile placeholder replacement"],
  ["src/lib/data-context.tsx", "useConvexAuth", "Convex auth readiness gate"],
  ["src/lib/data-context.tsx", "function diagnoseConvexAuthToken", "Convex auth token diagnostic"],
  ["src/lib/data-context.tsx", "previousAuthMode", "auth mode transition reset"],
  ["src/lib/data-context.tsx", "await replaceAllItems({ items: localItems })", "awaited cloud project migration"],
  ["src/lib/data-context.tsx", "Cloud sync failed. Projects are saved locally for now.", "cloud project sync local fallback"],
  ["src/lib/data-context.tsx", "function stringSetting", "stored settings scalar normalization"],
  ["src/lib/data-context.tsx", "function optionSetting", "stored settings option normalization"],
  ["src/lib/data-context.tsx", "function colorSetting", "stored settings color normalization"],
  ["src/lib/data-context.tsx", "function booleanRecordSetting", "stored settings boolean-record normalization"],
  ["src/lib/data-context.tsx", "function stringRecordSetting", "stored settings string-record normalization"],
  ["src/lib/data-context.tsx", "function freshDefaultSettings", "fresh default settings factory"],
  ["src/lib/data-context.tsx", "projectTags: [...defaultSettings.projectTags]", "fresh project tag defaults"],
  ["src/lib/data-context.tsx", "salaryBatchSize: positiveIntegerSetting", "stored salary batch size normalization"],
  ["src/lib/data-context.tsx", "function isSalaryWorkType", "settings-driven salary work type"],
  ["src/lib/data-context.tsx", "studioName: \"CutLab Studio\"", "non-blank fresh install studio defaults"],
  ["src/lib/data-context.tsx", "const teamRoleOptions", "centralized team role options"],
  ["src/lib/data-context.tsx", "teamRole: optionSetting(r.teamRole, teamRoleOptions", "stored team role normalization"],
  ["src/lib/data-context.tsx", "role: optionSetting(m.role, teamRoleOptions", "stored team member role normalization"],
  ["src/lib/data-context.tsx", "s.trim() ? [s.trim()] : []", "stored workflow stage trimming"],
  ["src/lib/data-context.tsx", "const storedItems = Array.isArray(stored) ? stored : []", "malformed project storage guard"],
  ["src/app/tracker-app.tsx", "[cutlab.color.teal, cutlab.color.cyan, cutlab.color.deepTeal", "brand-system accent color swatches"],
  ["src/lib/profiles.ts", "statusOptions: [\"Planned\", \"In Progress\", \"Delivered\", \"Cancelled\"]", "profile status options aligned with app statuses"],
  ["src/app/tracker-app.tsx", "Math.max(0, amount)", "non-negative money normalization"],
  ["src/app/tracker-app.tsx", "function copyText", "safe clipboard helper"],
  ["src/app/tracker-app.tsx", "function openNewProject", "new project workflow"],
  ["src/app/tracker-app.tsx", "function saveProject", "project save workflow"],
  ["src/app/tracker-app.tsx", "function validateProject", "project form validation"],
  ["src/app/tracker-app.tsx", "function DatePickerField", "app-native project date picker"],
  ["src/app/tracker-app.tsx", "function NotificationBell", "functional notification menu"],
  ["src/lib/data-context.tsx", "customClients: stringListSetting", "saved client settings normalization"],
  ["src/app/tracker-app.tsx", "function normalizeProjectIntegrationLinks", "project integration link normalization"],
  ["src/app/tracker-app.tsx", "function projectStageIssues", "workflow stage validation"],
  ["src/app/tracker-app.tsx", "function projectTagIssues", "project tag validation"],
  ["src/app/tracker-app.tsx", "function canonicalClientName", "case-insensitive client reuse"],
  ["src/app/tracker-app.tsx", "function projectWorkTypeOptions", "custom project tag options"],
  ["src/app/tracker-app.tsx", "normalizedSalaryBatchSize(settings.salaryBatchSize)", "custom salary batch size"],
  ["src/app/tracker-app.tsx", "normalizedSalaryBatchAmount(settings.salaryBatchAmount)", "custom salary batch amount"],
  ["src/app/tracker-app.tsx", "<Autocomplete", "client dropdown with free text entry"],
  ["src/app/tracker-app.tsx", "function isValidEmail", "email validation helper"],
  ["src/app/tracker-app.tsx", "function isValidProfileImageSource", "profile image source validation"],
  ["src/app/tracker-app.tsx", "function AppLoadingStatus", "account and data loading state"],
  ["src/app/tracker-app.tsx", "function openEditProject", "project edit workflow"],
  ["src/app/tracker-app.tsx", "function requestDeleteProject", "project delete request workflow"],
  ["src/app/tracker-app.tsx", "function confirmDeleteProject", "project delete confirmation workflow"],
  ["src/app/tracker-app.tsx", "function openTemplateProject", "template project workflow"],
  ["src/lib/project-templates.ts", "export const PROJECT_TEMPLATES", "maintainable project template catalog"],
  ["src/lib/project-templates.ts", "theme-park-social-campaign", "theme park social campaign template"],
  ["src/lib/project-templates.ts", "client-retainer-package", "client retainer package template"],
  ["src/lib/project-templates.ts", "applyProjectTemplate", "template project factory"],
  ["src/app/tracker-app.tsx", "function ProjectStartDialog", "blank or template project chooser"],
  ["src/app/tracker-app.tsx", "function TemplateSetupEditor", "editable template workflow setup"],
  ["src/app/tracker-app.tsx", "function ClientTabPanel", "client detail tabs render real panels"],
  ["src/app/tracker-app.tsx", "type ClientDetailTab", "typed client detail tab state"],
  ["src/app/tracker-app.tsx", "function clearFilters", "dashboard filter reset workflow"],
  ["src/app/tracker-app.tsx", "function WorkflowPipeline", "dashboard workflow pipeline"],
  ["src/app/tracker-app.tsx", "function UpcomingDeliveries", "dashboard upcoming delivery queue"],
  ["src/app/tracker-app.tsx", "function SalaryBatchProgress", "dashboard salary batch progress"],
  ["src/app/tracker-app.tsx", "function UnifiedOperationsMetrics", "unified performance and salary metrics"],
  ["src/app/tracker-app.tsx", "function DashboardActivityFeed", "dashboard recent and team activity feeds"],
  ["src/app/tracker-app.tsx", "value=\"recent\" label=\"Recent Activity\"", "tabbed recent activity panel"],
  ["src/app/tracker-app.tsx", "value=\"team\" label=\"Team Activity\"", "tabbed team activity panel"],
  ["src/app/tracker-app.tsx", "projects.slice(0, compact ? 3 : 6)", "compact upcoming delivery cap"],
  ["src/app/tracker-app.tsx", "minHeight: compact ? 72 : 112", "compact workflow pipeline"],
  ["src/app/tracker-app.tsx", "function CompactDashboardEmpty", "compact dashboard empty states"],
  ["src/app/tracker-app.tsx", "function DashboardActivitySkeleton", "dashboard team loading skeleton"],
  ["src/app/tracker-app.tsx", "function dashboardProjectStage", "dashboard pipeline stage derivation"],
  ["src/app/tracker-app.tsx", "function dashboardUpcomingDeliveries", "dashboard urgency ordering"],
  ["src/app/tracker-app.tsx", "function dashboardProjectActivity", "dashboard project activity derivation"],
  ["src/app/tracker-app.tsx", "pipelineFilter", "dashboard stage-driven project filtering"],
  ["src/app/tracker-app.tsx", "No upcoming deliveries", "dashboard delivery empty state"],
  ["src/app/tracker-app.tsx", "No team activity", "dashboard solo workspace empty state"],
  ["src/app/tracker-app.tsx", "function clearClientFilters", "client filter reset workflow"],
  ["src/app/tracker-app.tsx", "function shiftMonth", "calendar month navigation workflow"],
  ["src/app/tracker-app.tsx", "function jumpToToday", "calendar today workflow"],
  ["src/app/tracker-app.tsx", "const createWorkspace = useMutation(api.team.createWorkspace)", "team workspace creation workflow"],
  ["src/app/tracker-app.tsx", "const inviteMember = useMutation(api.team.inviteMember)", "team member invite workflow"],
  ["src/app/tracker-app.tsx", "const updateMemberRole = useMutation(api.team.updateMemberRole)", "team member role management workflow"],
  ["src/app/tracker-app.tsx", "const removeMember = useMutation(api.team.removeMember)", "team member removal workflow"],
  ["src/app/tracker-app.tsx", "Team Chat", "team chat surface"],
  ["src/app/team-chat/page.tsx", "<TrackerApp page=\"team-chat\" />", "dedicated Team Chat route"],
  ["src/app/tracker-app.tsx", "My Projects", "personal project workspace"],
  ["src/app/tracker-app.tsx", "Team Projects", "team project workspace"],
  ["src/app/tracker-app.tsx", "SIDEBAR_COLLAPSED_STORAGE_KEY", "collapsible sidebar persistence"],
  ["src/app/tracker-app.tsx", "aria-label=\"Go to dashboard\"", "clickable app logo"],
  ["src/app/tracker-app.tsx", "Activity Feed", "team activity feed surface"],
  ["src/app/tracker-app.tsx", "function saveLink", "integration link save workflow"],
  ["src/app/tracker-app.tsx", "function removeLink", "integration link remove workflow"],
  ["src/app/tracker-app.tsx", "function openLink", "integration link open workflow"],
  ["src/app/tracker-app.tsx", "function resetSettings", "settings reset workflow"],
  ["src/app/tracker-app.tsx", "function updateNotification", "notification toggle workflow"],
  ["src/app/tracker-app.tsx", "async function shareProfile", "profile sharing workflow"],
  ["src/app/tracker-app.tsx", "Profile Bio", "focused profile edit panel"],
  ["src/app/tracker-app.tsx", "Public profile", "bottom identity public profile menu"],
  ["src/app/tracker-app.tsx", "Organization profile", "bottom identity organization profile menu"],
  ["src/app/tracker-app.tsx", "navigationItems", "sidebar route list"],
  ["src/app/tracker-app.tsx", "label: \"Library\"", "consolidated Library sidebar destination"],
  ["src/app/tracker-app.tsx", "pages: [\"projects\", \"timeline\", \"calendar\"]", "grouped project navigation"],
  ["src/app/tracker-app.tsx", "pages: [\"settings\", \"account\"]", "grouped settings navigation"],
  ["src/app/tracker-app.tsx", "<CutLabLockup compact subtitle=\"Production workspace\"", "supplied sidebar wordmark"],
  ["src/lib/integrations.ts", "isValidIntegrationUrl", "link-only integration URL validation"],
  ["src/app/tracker-app.tsx", "function IntegrationLinkManager", "reusable integration link manager"],
  ["src/app/tracker-app.tsx", "Project Integrations", "project-level integration link surface"],
  ["src/app/tracker-app.tsx", "aria-label={`Open ${client.name} client details`}", "keyboard-accessible client rows"],
  ["src/app/tracker-app.tsx", "aria-label={`Select ${formatDate(key, settings.dateFormat)}", "keyboard-accessible calendar days"],
  ["src/app/tracker-app.tsx", "aria-label=\"Open profile menu\"", "labeled profile menu trigger"],
  ["src/app/tracker-app.tsx", "aria-label=\"Previous month\"", "labeled previous month control"],
  ["src/app/tracker-app.tsx", "aria-label=\"Next month\"", "labeled next month control"],
  ["src/app/tracker-app.tsx", "aria-label={`Remove workflow stage ${index + 1}`}", "labeled remove stage control"],
  ["src/app/page.tsx", "function DashboardRoute", "root route component naming"],
  ["src/app/layout.tsx", "themeBootScript", "pre-hydration theme boot script"],
  ["src/app/layout.tsx", "[\"Light\", \"Dark\", \"System\"].indexOf(settings.theme)", "boot script theme normalization"],
  ["src/app/layout.tsx", "/^#[0-9a-fA-F]{6}$/.test(settings.accentColor)", "boot script accent normalization"],
  ["src/app/layout.tsx", "metadataBase", "metadata base URL"],
  ["src/app/layout.tsx", "openGraph", "public Open Graph metadata"],
  ["src/app/layout.tsx", "twitter", "public Twitter card metadata"],
  ["src/app/layout.tsx", "/og-image.png", "served social preview image metadata"],
  ["src/app/layout.tsx", "export const viewport", "responsive viewport metadata"],
  ["src/app/layout.tsx", "/brand/icons/app-icon-dark-32.png", "supplied PNG app icon metadata"],
  ["src/app/layout.tsx", "data-clerk-modal-centering", "Clerk modal centering CSS fallback"],
  ["src/app/layout.tsx", "clerkModalCenteringCss", "Clerk modal centering stylesheet"],
  ["src/app/providers.tsx", "modalBackdrop", "Clerk modal backdrop appearance centering"],
  ["src/app/providers.tsx", "modalContent", "Clerk modal content appearance centering"],
  ["src/app/theme.ts", "MuiMenu", "dark mode menu surface override"],
  ["src/app/theme.ts", "var(--app-panel, ${cutlab.color.graphite})", "CSS variable driven MUI surfaces"],
  ["src/app/design-system.ts", "charcoal: \"#090C0D\"", "centralized CutLab color tokens"],
  ["src/app/design-system.ts", "heading: \"var(--font-space-grotesk)", "centralized CutLab typography tokens"],
  ["src/app/cutlab-brand.tsx", "function CutLabMark", "shared CutLab product mark"],
  ["src/app/cutlab-brand.tsx", "src=\"/brand/logo/cutlab-studio.png\"", "supplied CutLab Studio wordmark asset"],
  ["src/app/cutlab-brand.tsx", "href=\"/\"", "brand lockup dashboard link"],
  ["src/app/brand-assets.ts", "emptyStateAssets", "typed generated asset registry"],
  ["src/app/tracker-app.tsx", "emptyStateAssets[emptyStateAssetFor(title)]", "contextual generated empty-state selection"],
  ["src/app/manifest.ts", "app-icon-dark-192.png", "installable app icon manifest"],
  ["scripts/generate-brand-assets.mjs", "const iconSizes", "repeatable app icon export pipeline"],
  ["src/app/tracker-app.tsx", "function EmptyPanel", "shared branded empty-state primitive"],
  ["package.json", "\"name\": \"cutlab-studio\"", "branded package name"],
  ["package.json", "\"node\": \">=22\"", "Node engine requirement"],
  ["next.config.mjs", "async headers()", "production response headers"],
  ["next.config.mjs", "X-Content-Type-Options", "content type sniffing protection"],
  ["next.config.mjs", "Permissions-Policy", "browser permissions policy"],
  ["src/proxy.ts", "NextResponse.next()", "public route proxy passthrough"],
  ["convex/auth.config.ts", "CLERK_JWT_ISSUER_DOMAIN", "Convex Clerk auth configuration"],
  ["convex/workItems.ts", ".take(500)", "bounded Convex work item queries"],
  ["convex/workItems.ts", "return items.map", "plain Convex work item query payloads"],
  ["convex/settings.ts", ".take(10)", "duplicate-safe Convex settings upsert"],
  ["convex/settings.ts", "projectTags: v.array(v.string())", "Convex settings project tags"],
  ["convex/settings.ts", "salaryBatchAmount: v.number()", "Convex settings salary amount"],
  ["convex/schema.ts", "salaryBatchSize: v.optional(v.number())", "Convex schema salary batch size"],
  ["convex/workItems.ts", "id: v.string()", "cloud project id persistence"],
  ["convex/salaryBatches.ts", "return batches.map", "plain Convex salary batch query payloads"],
  ["convex/salaryBatches.ts", "id: batch.id ?? `batch-${batch.number}`", "cloud salary batch id persistence"],
  ["convex/schema.ts", "paid: v.optional(v.boolean())", "migration-safe salary batch payment status"],
  ["src/lib/payout-reporting.ts", "export function buildPayoutReport", "tested payout calculation model"],
  ["src/lib/payout-reporting.ts", "export function payoutReportToCsv", "payout CSV export"],
  ["src/lib/invoice-reporting.ts", "export function buildInvoiceDrafts", "local invoice draft builder"],
  ["src/lib/invoice-reporting.ts", "export function invoiceDraftsToCsv", "invoice draft CSV export"],
  ["docs/security/THIRD_PARTY_INTEGRATION_REVIEW.md", "## Approval Standard", "third-party integration trust gate"],
  ["docs/security/THIRD_PARTY_INTEGRATION_REVIEW.md", "Stripe", "reviewed future payment provider"],
  ["src/app/providers.tsx", "mode={convex && clerkPublishableKey ? \"cloud\" : \"local\"}", "local-first provider fallback"],
  ["convex/schema.ts", "clientPortals: defineTable", "client portal safe snapshot table"],
  ["convex/schema.ts", "portalDeliverables: defineTable", "client portal deliverables table"],
  ["convex/schema.ts", "portalRevisions: defineTable", "client portal revision requests table"],
  ["convex/schema.ts", "portalEvents: defineTable", "client-visible portal events table"],
  ["convex/clientPortals.ts", "export const getByToken = query", "public token portal query"],
  ["convex/clientPortals.ts", "export const submitRevision = mutation", "persisted public revision submission"],
  ["convex/clientPortals.ts", "export const updateDeliverableStatus = mutation", "editor deliverable status workflow"],
  ["convex/clientPortals.ts", "export const setAccessControls = mutation", "client portal access controls mutation"],
  ["convex/clientPortals.ts", "export const regenerateToken = mutation", "client portal token regeneration mutation"],
  ["convex/clientPortals.ts", "export const setPasswordProtection = mutation", "client portal password protection mutation"],
  ["convex/clientPortals.ts", "name: \"PBKDF2\"", "PBKDF2 portal password derivation"],
  ["convex/clientPortals.ts", "return { access: \"locked\" as const }", "protected portal data gate"],
  ["convex/clientPortals.ts", "passwordProtected: Boolean(portal.passwordHash && portal.passwordSalt)", "hash-free editor protection state"],
  ["convex/clientPortals.ts", "function portalAccessState", "shared client portal public access guard"],
  ["convex/clientPortals.ts", "if (access === \"expired\") return { access: \"expired\" as const }", "safe expired portal response"],
  ["convex/clientPortals.ts", "if (access === \"unavailable\") return { access: \"unavailable\" as const }", "safe unavailable portal response"],
  ["convex/clientPortals.ts", "title: \"Work started\"", "client timeline work-started milestone"],
  ["convex/clientPortals.ts", "title: \"Review sent\"", "client timeline review-sent milestone"],
  ["convex/clientPortals.ts", "title: \"Delivery completed\"", "client timeline delivery-completed milestone"],
  ["convex/clientPortals.ts", "\"revision_completed\", \"Revision completed\"", "client timeline revision-completed milestone"],
  ["convex/clientPortals.ts", "await requireProjectAccess(ctx, args.projectId, \"editProjects\")", "authenticated portal publishing authorization"],
  ["convex/clientPortals.ts", "deliverables: [", "merged public deliverable projection"],
  ["convex/clientPortals.ts", "const deliverables = storedDeliverables.flatMap((item) => {", "normalized legacy deliverable projection"],
  ["convex/clientPortals.ts", "isClientSafeApprovalStatus(status)", "client-safe deliverable status guard"],
  ["convex/clientPortals.ts", "downloadable: item.downloadable", "explicit legacy deliverable field projection"],
  ["convex/clientPortals.ts", "revisions: revisions.map", "explicit public revision projection"],
  ["convex/clientPortals.ts", "events: events.map", "explicit public event projection"],
  ["convex/workItems.ts", "await syncClientPortal", "published portal safe snapshot synchronization"],
  ["convex/workItems.ts", "await deleteClientPortal", "deleted project portal cleanup"],
  ["src/app/client-portal/[token]/page.tsx", "<ClientPortalView token={token}", "dynamic token portal route"],
  ["src/app/client-portal/client-portal-view.tsx", "api.clientPortals.getByToken", "public portal data query wiring"],
  ["src/app/client-portal/client-portal-view.tsx", "api.clientPortals.submitRevision", "public revision submission wiring"],
  ["src/app/client-portal/client-portal-view.tsx", "No deliverables yet", "deliverables empty state"],
  ["src/app/client-portal/client-portal-view.tsx", "No timeline events", "timeline empty state"],
  ["src/app/client-portal/client-portal-view.tsx", "No revision requests", "revisions empty state"],
  ["src/app/client-portal/client-portal-view.tsx", "No client notes", "client notes empty state"],
  ["src/app/client-portal/client-portal-view.tsx", "label=\"Last Updated\"", "required client project last-updated field"],
  ["src/app/tracker-app.tsx", "function ClientPortalManager", "editor client portal management surface"],
  ["src/app/tracker-app.tsx", "Copy Link", "client portal copy-link action"],
  ["src/app/tracker-app.tsx", "Access Controls", "client portal access settings UI"],
  ["src/app/tracker-app.tsx", "Regenerate Link", "client portal token regeneration UI"],
  ["src/app/tracker-app.tsx", "PIN Or Password", "client portal password settings UI"],
  ["src/app/client-portal/client-portal-view.tsx", "Portal link expired", "expired client portal state"],
  ["src/app/client-portal/client-portal-view.tsx", "This portal is protected", "locked client portal state"],
  ["docs/security/SECURITY.md", "PBKDF2-SHA-256", "documented client portal password hashing"],
  ["src/app/tracker-app.tsx", "Only notes entered here are visible. Internal project notes are never copied.", "client-note security boundary copy"],
  ["package.json", "\"check:full\"", "single full verification npm script"],
  ["package.json", "npm run verify:team && npm run verify:browser && npm run verify:prod", "full verification includes Team, browser, and production gates"],
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

for (const asset of requiredBrandAssets) {
  if (!existsSync(asset)) {
    failures += 1;
    console.error(`Missing brand asset: ${asset}`);
    continue;
  }
  if (!asset.endsWith(".png")) continue;
  const dimensions = readPngDimensions(asset);
  if (!dimensions || dimensions.width < 16 || dimensions.height < 16) {
    failures += 1;
    console.error(`Brand PNG is invalid or too small: ${asset}`);
  } else {
    checkedPngAssets += 1;
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
    if (!target.startsWith("/") || target.startsWith("/assets/") || target.startsWith("/brand/") || target.startsWith("/_next/")) continue;
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
      ['href="/brand/icons/app-icon-dark-32.png"', "PNG icon link"],
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
      if (!target.startsWith("/") || target.startsWith("/assets/") || target.startsWith("/brand/")) continue;
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

const iconResponse = await fetch(`${baseUrl}/icon.png`).catch((error) => {
  failures += 1;
  console.error(`Could not fetch ${baseUrl}/icon.png: ${error instanceof Error ? error.message : String(error)}`);
  return null;
});
if (iconResponse) {
  const contentType = iconResponse.headers.get("content-type") || "";
  if (iconResponse.status !== 200) {
    failures += 1;
    console.error(`/icon.png returned ${iconResponse.status}, expected 200`);
  }
  if (!contentType.includes("image/png")) {
    failures += 1;
    console.error(`/icon.png returned unexpected content type: ${contentType}`);
  }
}

const manifestResponse = await fetch(`${baseUrl}/manifest.webmanifest`).catch((error) => {
  failures += 1;
  console.error(`Could not fetch ${baseUrl}/manifest.webmanifest: ${error instanceof Error ? error.message : String(error)}`);
  return null;
});
if (manifestResponse) {
  const manifest = await manifestResponse.json().catch(() => null);
  if (manifestResponse.status !== 200 || !manifest?.icons?.some((icon) => icon.src === "/brand/icons/app-icon-dark-192.png")) {
    failures += 1;
    console.error("/manifest.webmanifest is missing the generated CutLab app icon set.");
  }
}

for (const asset of requiredBrandAssets) {
  const target = `/${asset.replace(/^public[\\/]/, "").replaceAll("\\", "/")}`;
  const response = await fetch(`${baseUrl}${target}`).catch((error) => {
    failures += 1;
    console.error(`Could not fetch brand asset ${target}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  });
  if (!response) continue;
  const expectedType = asset.endsWith(".svg") ? "image/svg+xml" : "image/png";
  const contentType = response.headers.get("content-type") || "";
  if (response.status !== 200 || !contentType.includes(expectedType)) {
    failures += 1;
    console.error(`Brand asset ${target} returned ${response.status} with ${contentType}, expected 200 ${expectedType}`);
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
