/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";
import { describe, expect, test } from "vitest";
import schema from "./schema";
import { createDefaultWorkflowTemplate } from "../src/relay/domain/workflow-template";
import type { NewProjectInput } from "../src/relay/domain/project";

const modules = import.meta.glob("./**/*.ts");
const groupInput = { name: "Launch campaign", clientId: "client_acme", startDate: "2026-08-01", endDate: "2026-09-30", notes: "Six launch films" };
const createGroup = makeFunctionReference<"mutation", typeof groupInput, { id: string }>("relayProjects:createGroup");
const editGroup = makeFunctionReference<"mutation", typeof groupInput & { id: string }, null>("relayProjects:editGroup");
const archiveGroup = makeFunctionReference<"mutation", { id: string; archived: boolean }, null>("relayProjects:setGroupArchived");
const listGroups = makeFunctionReference<"query", { includeArchived?: boolean }, Array<typeof groupInput & { id: string; archived: boolean; projectCount: number; progress: number; money: number }>>("relayProjects:listGroups");
const projectInput: NewProjectInput = { name: "Launch film 01", clientId: "client_acme", projectGroupId: "", templateId: "template_launch", dueDate: "2026-09-12", financialType: "projectValue" };
const createProject = makeFunctionReference<"mutation", typeof projectInput, { id: string }>("relayProjects:createProject");
const inspectProject = makeFunctionReference<"query", { id: string }, Record<string, unknown> | null>("relayProjects:inspectProject");
const archiveProject = makeFunctionReference<"mutation", { id: string; archived: boolean }, null>("relayProjects:setProjectArchived");
const deleteProject = makeFunctionReference<"mutation", { id: string }, null>("relayProjects:deleteProject");
const moveProjectStage = makeFunctionReference<"mutation", { id: string; targetStageId: string; confirmed: boolean }, { projectName: string; stage: string; effect: { kind: "projectValue"; amount: number } | { kind: "salaryPlan"; change: "added" | "removed" } | { kind: "none" } }>("relayProjects:moveProjectStage");
const listProjects = makeFunctionReference<"query", Record<string, never>, Array<Record<string, unknown>>>("relayProjects:listProjects");
const listOutputs = makeFunctionReference<"query", { projectId: string }, Array<Record<string, unknown>>>("relayProjectOutputs:listOutputs");
const addOutput = makeFunctionReference<"mutation", { projectId: string; name: string }, { id: string }>("relayProjectOutputs:addOutput");
const editOutput = makeFunctionReference<"mutation", { id: string; name: string }, null>("relayProjectOutputs:editOutput");
const setOutputArchived = makeFunctionReference<"mutation", { id: string; archived: boolean }, null>("relayProjectOutputs:setOutputArchived");
const setOutputReviewState = makeFunctionReference<"mutation", { id: string; reviewState: "draft" | "in_review" | "changes_requested" | "approved" | "final_delivered" }, null>("relayProjectOutputs:setOutputReviewState");
const addMediaVersion = makeFunctionReference<"mutation", { outputId: string; url: string }, { id: string }>("relayProjectOutputs:addMediaVersion");

describe("Relay cloud Projects and Project Groups", () => {
  test("creates, edits, archives, and derives Project Group totals for its Client", async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity({ tokenIdentifier: "owner" });
    const other = t.withIdentity({ tokenIdentifier: "other" });
    const template = createDefaultWorkflowTemplate("template_launch", "Launch workflow");
    await t.run(async (ctx) => {
      await ctx.db.insert("relayClients", { ownerUserId: "owner", durableId: "client_acme", archived: false, name: "Acme", company: "", contactName: "", email: "", phone: "", notes: "" });
      const { id: durableId, ...input } = template;
      await ctx.db.insert("relayWorkflowTemplates", { ownerUserId: "owner", durableId, order: 0, ...input });
    });

    await expect(owner.mutation(createGroup, { ...groupInput, startDate: "2026-99-99" })).rejects.toThrow("valid Project Group");
    const { id } = await owner.mutation(createGroup, groupInput);
    await t.run(async (ctx) => {
      await ctx.db.insert("relayProjects", { ownerUserId: "owner", importedAt: "2026-08-17T00:00:00.000Z", id: "project_grouped", name: "Launch film", clientId: "client_acme", projectGroupId: id, stage: "Editing", tone: "planned", due: "2026-09-12", progress: "50%", outstandingAmount: 1200 });
    });
    await expect(other.query(listGroups, { includeArchived: true })).resolves.toEqual([]);
    await owner.mutation(editGroup, { id, ...groupInput, notes: "Priority campaign" });
    await owner.mutation(archiveGroup, { id, archived: true });
    await expect(owner.query(listGroups, {})).resolves.toEqual([]);
    await expect(owner.query(listGroups, { includeArchived: true })).resolves.toMatchObject([{ id, notes: "Priority campaign", archived: true, projectCount: 1, progress: 50, money: 1200 }]);
    await expect(other.mutation(archiveGroup, { id, archived: false })).rejects.toThrow("Project Group not found");
  });

  test("creates one Project, enforces group ownership, and copies its Workflow Template", async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity({ tokenIdentifier: "owner" });
    const template = createDefaultWorkflowTemplate("template_launch", "Launch workflow");
    await t.run(async (ctx) => {
      await ctx.db.insert("relayClients", { ownerUserId: "owner", durableId: "client_acme", archived: false, name: "Acme", company: "", contactName: "", email: "", phone: "", notes: "" });
      await ctx.db.insert("relayClients", { ownerUserId: "owner", durableId: "client_other", archived: false, name: "Other", company: "", contactName: "", email: "", phone: "", notes: "" });
      const { id: durableId, ...input } = template;
      await ctx.db.insert("relayWorkflowTemplates", { ownerUserId: "owner", durableId, order: 0, ...input });
      await ctx.db.insert("relayProjectGroups", { ownerUserId: "owner", durableId: "group_other", archived: false, name: "Other work", clientId: "client_other", startDate: "", endDate: "", notes: "" });
    });

    await expect(owner.mutation(createProject, { ...projectInput, dueDate: "2026-02-30" })).rejects.toThrow("valid Project details");
    await expect(owner.mutation(createProject, { ...projectInput, projectGroupId: "group_other" })).rejects.toThrow("same Client");
    const { id } = await owner.mutation(createProject, projectInput);
    const project = await owner.query(inspectProject, { id });
    expect(project).toMatchObject({ id, name: "Launch film 01", clientId: "client_acme", stage: "Planned", dueDate: "2026-09-12", financialType: "projectValue", lead: "Unassigned", assignees: [], workflowSetup: { templateId: "template_launch", templateName: "Launch workflow" } });
    await t.run(async (ctx) => {
      const stored = await ctx.db.query("relayWorkflowTemplates").withIndex("by_ownerUserId_and_durableId", (q) => q.eq("ownerUserId", "owner").eq("durableId", "template_launch")).unique();
      await ctx.db.patch("relayWorkflowTemplates", stored!._id, { name: "Changed later" });
    });
    await expect(owner.query(inspectProject, { id })).resolves.toMatchObject({ workflowSetup: { templateName: "Launch workflow" } });
  });

  test("uses the default Workflow Template in a fresh cloud Workspace", async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity({ tokenIdentifier: "owner" });
    await t.run(async (ctx) => {
      await ctx.db.insert("relayClients", { ownerUserId: "owner", durableId: "client_acme", archived: false, name: "Acme", company: "", contactName: "", email: "", phone: "", notes: "" });
    });
    const { id } = await owner.mutation(createProject, { ...projectInput, templateId: "template_default" });
    await expect(owner.query(inspectProject, { id })).resolves.toMatchObject({ workflowSetup: { templateId: "template_default", templateName: "Default workflow" } });
  });

  test("archives a Project with its history intact, then permanently deletes it", async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity({ tokenIdentifier: "owner" });
    await t.run(async (ctx) => {
      await ctx.db.insert("relayClients", { ownerUserId: "owner", durableId: "client_acme", archived: false, name: "Acme", company: "", contactName: "", email: "", phone: "", notes: "" });
    });
    const { id } = await owner.mutation(createProject, { ...projectInput, templateId: "template_default" });
    await owner.mutation(archiveProject, { id, archived: true });
    await expect(owner.query(inspectProject, { id })).resolves.toMatchObject({ id, status: "past" });
    await owner.mutation(deleteProject, { id });
    await expect(owner.query(inspectProject, { id })).resolves.toBeNull();
  });

  test("moves a Project through delivery and reopening in owner-scoped transactions", async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity({ tokenIdentifier: "owner" });
    const other = t.withIdentity({ tokenIdentifier: "other" });
    const template = createDefaultWorkflowTemplate("template_default", "Default workflow");
    await t.run(async (ctx) => {
      await ctx.db.insert("relayClients", { ownerUserId: "owner", durableId: "client_acme", archived: false, name: "Acme", company: "", contactName: "", email: "", phone: "", notes: "" });
    });
    const { id } = await owner.mutation(createProject, { ...projectInput, templateId: template.id, financialType: "salaryPlan" });
    const delivered = template.stages.find(({ purpose }) => purpose === "delivered")!;
    const revisions = template.stages.find(({ purpose }) => purpose === "revisions")!;

    await expect(other.mutation(moveProjectStage, { id, targetStageId: delivered.id, confirmed: true })).rejects.toThrow("Project not found");
    await expect(owner.mutation(moveProjectStage, { id, targetStageId: delivered.id, confirmed: false })).rejects.toThrow("Confirm delivery");
    await expect(owner.mutation(moveProjectStage, { id, targetStageId: delivered.id, confirmed: true })).resolves.toMatchObject({ projectName: "Launch film 01", stage: "Delivered", effect: { kind: "salaryPlan", change: "added" } });
    await expect(owner.query(inspectProject, { id })).resolves.toMatchObject({ stage: "Delivered", progress: "100%", completedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/) });
    await expect(owner.mutation(moveProjectStage, { id, targetStageId: revisions.id, confirmed: false })).resolves.toMatchObject({ stage: "Revisions", effect: { kind: "salaryPlan", change: "removed" } });
    const reopened = await owner.query(inspectProject, { id });
    expect(reopened).toMatchObject({ stage: "Revisions", progress: "65%" });
    expect(reopened).not.toHaveProperty("completedAt");
  });
});

describe("Relay cloud Project Outputs", () => {
  test("materializes starter slots and retains normalized Media Version history without adding Projects", async () => {
    const t = convexTest(schema, modules);
    const ownerUserId = "owner|outputs";
    const owner = t.withIdentity({ tokenIdentifier: ownerUserId });
    const template = createDefaultWorkflowTemplate("template_outputs", "Output workflow");
    template.starterOutputs.push({ id: "output_short", name: "Short cut", relativeDeadlineDays: -1, roleId: null });
    await t.run(async (ctx) => {
      await ctx.db.insert("relayClients", { ownerUserId, durableId: "client_acme", archived: false, name: "Acme", company: "", contactName: "", email: "", phone: "", notes: "" });
      const { id: durableId, ...input } = template;
      await ctx.db.insert("relayWorkflowTemplates", { ownerUserId, durableId, order: 0, ...input });
    });
    const { id: projectId } = await owner.mutation(createProject, { ...projectInput, templateId: template.id, financialType: "salaryPlan" });

    expect(await owner.query(listOutputs, { projectId })).toMatchObject([
      { name: "Main video", reviewState: "draft", versions: [] },
      { name: "Short cut", reviewState: "draft", versions: [], relativeDeadlineDays: -1 },
    ]);
    const { id: addedId } = await owner.mutation(addOutput, { projectId, name: "Thumbnail" });
    await owner.mutation(editOutput, { id: addedId, name: "Cover image" });
    await owner.mutation(setOutputReviewState, { id: addedId, reviewState: "approved" });
    await owner.mutation(setOutputArchived, { id: addedId, archived: true });

    const outputId = String((await owner.query(listOutputs, { projectId }))[0].id);
    const first = await owner.mutation(addMediaVersion, { outputId, url: "https://youtu.be/dQw4w9WgXcQ?t=12" });
    await t.run(async (ctx) => {
      await ctx.db.insert("relayMediaComments", { ownerUserId, durableId: "comment_1", projectId, versionId: first.id, body: "Tighten the opening.", resolved: false });
    });
    await owner.mutation(addMediaVersion, { outputId, url: "https://player.vimeo.com/video/987654321?autoplay=1" });

    expect((await owner.query(listOutputs, { projectId }))[0]).toMatchObject({
      currentVersionId: expect.stringMatching(/^version_/), reviewState: "in_review", unresolvedPreviousComments: 1,
      versions: [
        { number: 1, source: { provider: "youtube", providerId: "dQw4w9WgXcQ", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }, comments: [{ body: "Tighten the opening.", resolved: false }] },
        { number: 2, source: { provider: "vimeo", providerId: "987654321", url: "https://vimeo.com/987654321" } },
      ],
    });
    expect(await owner.query(listProjects, {})).toHaveLength(1);
    await expect(owner.mutation(addMediaVersion, { outputId, url: "<iframe src=bad></iframe>" })).rejects.toThrow("valid HTTP");
    await expect(t.withIdentity({ tokenIdentifier: "other|user" }).mutation(editOutput, { id: outputId, name: "Stolen" })).rejects.toThrow("not found");
  });
});
