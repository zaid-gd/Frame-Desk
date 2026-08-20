/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";
import { describe, expect, test } from "vitest";
import schema from "./schema";

process.env.RELAY_FILE_SIGNING_SECRET = "relay-calendar-test-secret-at-least-32-bytes";

const modules = import.meta.glob("./**/*.ts");
const feedUrl = makeFunctionReference<"query", { appOrigin: string }, string | null>("relayCalendar:feedUrl");
const feedEvents = makeFunctionReference<"query", { ownerUserId: string; memberId: string }, Array<{ id: string; date: string; title: string; href: string }>>("relayCalendar:feedEvents");

describe("Relay cloud calendar subscription", () => {
  test("keeps an assigned Editor subscription scoped to assigned Projects", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const workspaceId = await ctx.db.insert("relayTeamWorkspaces", { dataOwnerUserId: "owner", currentOwnerUserId: "owner", name: "Desk", currencyCode: "USD", timeZone: "UTC", defaultWorkflowTemplateId: "template_default", editorsCanViewAll: false, createdAt: "2026-08-01" });
      await ctx.db.insert("relayTeamMembers", { workspaceId, userId: "editor", email: "editor@example.com", name: "Editor", role: "Editor", status: "active", permissions: { projects: true, reviews: true, portals: true, finance: false }, createdAt: "2026-08-01" });
      for (const [id, lead] of [["assigned", "editor"], ["private", "owner"]] as const) await ctx.db.insert("relayProjects", { ownerUserId: "owner", id, name: id, clientId: "client", stage: "Editing", tone: "planned", due: "2026-09-12", progress: "0%", status: "active", financialType: "nonBillable", importedAt: "2026-08-01", lead, assignees: [] });
    });
    await expect(t.query(feedEvents, { ownerUserId: "owner", memberId: "editor" })).resolves.toEqual([{ id: "project:assigned", date: "2026-09-12", title: "assigned due", href: "/relay/projects/assigned" }]);
  });

  test("issues a private feed URL and projects only active Workspace dates", async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity({ tokenIdentifier: "owner|calendar" });
    await t.run(async (ctx) => {
      await ctx.db.insert("relayProjects", { ownerUserId: "owner|calendar", id: "project_active", name: "Launch film", clientId: "client_acme", stage: "Client Review", tone: "review", due: "2026-09-12", progress: "60%", financialType: "projectValue", paymentState: "unpaid", importedAt: "2026-08-01T00:00:00.000Z" });
      await ctx.db.insert("relayProjects", { ownerUserId: "owner|calendar", id: "project_archived", name: "Hidden film", clientId: "client_acme", stage: "Delivered", tone: "delivered", due: "2026-09-20", progress: "100%", financialType: "nonBillable", status: "past", importedAt: "2026-08-01T00:00:00.000Z" });
      await ctx.db.insert("relayProjectOutputs", { ownerUserId: "owner|calendar", durableId: "output_main", projectId: "project_active", name: "Main cut", reviewState: "in_review", archived: false, relativeDeadlineDays: -1, currentVersionId: "version_main" });
      await ctx.db.insert("relayMediaVersions", { ownerUserId: "owner|calendar", durableId: "version_main", projectId: "project_active", outputId: "output_main", number: 1, provider: "vimeo", providerId: "987654321", normalizedUrl: "https://vimeo.com/987654321", addedAt: "2026-09-09T10:00:00.000Z" });
    });

    await expect(t.query(feedUrl, { appOrigin: "https://app.relay.test" })).resolves.toBeNull();
    await expect(owner.query(feedUrl, { appOrigin: "https://app.relay.test" })).resolves.toMatch(/^https:\/\/.*\/relay-calendar\.ics\?workspace=.*&member=.*&origin=https%3A%2F%2Fapp\.relay\.test&signature=[a-f0-9]{64}$/);
    await expect(t.query(feedEvents, { ownerUserId: "owner|calendar", memberId: "owner|calendar" })).resolves.toEqual([
      { id: "review:output_main", date: "2026-09-09", title: "Main cut review", href: "/relay/projects/project_active#outputs" },
      { id: "output:output_main", date: "2026-09-11", title: "Main cut due", href: "/relay/projects/project_active#outputs" },
      { id: "payment:project_active", date: "2026-09-12", title: "Launch film payment due", href: "/relay/projects/project_active" },
      { id: "project:project_active", date: "2026-09-12", title: "Launch film due", href: "/relay/projects/project_active" },
    ]);
  });
});
