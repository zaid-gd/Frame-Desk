import { existsSync, readFileSync } from "node:fs";

const checks = [
  ["convex/schema.ts", "relayTeamWorkspaces: defineTable", "Relay workspace table"],
  ["convex/schema.ts", "relayTeamMembers: defineTable", "Relay workspace members table"],
  ["convex/relayTeamAccess.ts", "export const getWorkspace = query", "workspace query"],
  ["convex/relayTeamAccess.ts", "export const inviteMember = mutation", "member invite mutation"],
  ["convex/relayTeamAccess.ts", "export const updateMember = mutation", "member permission mutation"],
  ["convex/relayTeamAccess.ts", "export const transferOwnership = mutation", "ownership transfer mutation"],
  ["convex/relayTeamAccess.ts", "export const removeMember = mutation", "member removal mutation"],
  ["convex/relayTeamAccess.ts", "export const leaveWorkspace = mutation", "workspace leave mutation"],
  ["convex/relayTeamAccess.ts", "export const prepareAccountDeletion = mutation", "account deletion cleanup"],
  ["src/relay/infrastructure/cloud-team-access-port.ts", "relayTeamAccess:getWorkspace", "cloud Team adapter"],
  ["src/relay/application/team-access-controller.ts", "export function createTeamAccessController", "Team controller"],
  ["src/relay/domain/team-access.ts", "export function buildTeamAccess", "Team permission model"],
  ["src/relay/presentation/relay-experience.tsx", "export function TeamPage", "Relay Team page"],
  ["src/relay/presentation/relay-experience.tsx", "Cloud Team access", "signed-out Team state"],
  ["src/relay/presentation/team-page.test.tsx", "renders the approved member table and inspector", "Team presentation test"],
  ["convex/relayTeamAccess.test.ts", "caps the free Workspace at two invited members", "Team backend seat-cap test"],
];

let failures = 0;
for (const [file, text, label] of checks) {
  if (!existsSync(file)) {
    failures += 1;
    console.error(`Missing file for ${label}: ${file}`);
    continue;
  }
  const source = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  if (!source.includes(text)) {
    failures += 1;
    console.error(`${file} missing ${label}: ${text}`);
  }
}

if (failures) {
  console.error(`Team verification failed with ${failures} issue${failures === 1 ? "" : "s"}.`);
  process.exit(1);
}

console.log(`Verified ${checks.length} Team seams across the Relay UI, controller, adapter, and Convex backend.`);
