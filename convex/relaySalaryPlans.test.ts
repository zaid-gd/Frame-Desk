/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";
import { describe, expect, test } from "vitest";
import schema from "./schema";
import { createDefaultWorkflowTemplate } from "../src/relay/domain/workflow-template";

const modules = import.meta.glob("./**/*.ts");
const planInput = { clientId: "client_acme", requiredProjectCount: 3, batchAmount: 9000, startDate: "2026-08-01", notes: "Launch work." };
const createPlan = makeFunctionReference<"mutation", typeof planInput, { id: string }>("relaySalaryPlans:createPlan");
const editPlan = makeFunctionReference<"mutation", typeof planInput & { id: string }, null>("relaySalaryPlans:editPlan");
const archivePlan = makeFunctionReference<"mutation", { id: string; archived: boolean }, null>("relaySalaryPlans:setArchived");
const listPlans = makeFunctionReference<"query", { includeArchived?: boolean }, Array<Record<string, unknown>>>("relaySalaryPlans:listPlans");
const listBatches = makeFunctionReference<"query", Record<string, never>, Array<Record<string, unknown>>>("relaySalaryPlans:listBatches");
const receiveBatch = makeFunctionReference<"mutation", { id: string; correctionNote?: string }, null>("relaySalaryPlans:markBatchReceived");
const createProject = makeFunctionReference<"mutation", { name: string; clientId: string; projectGroupId: string; templateId: string; dueDate: string; financialType: "salaryPlan"; salaryPlanId?: string }, { id: string }>("relayProjects:createProject");
const moveProjectStage = makeFunctionReference<"mutation", { id: string; targetStageId: string; confirmed: boolean }, Record<string, unknown>>("relayProjects:moveProjectStage");
const deleteProject = makeFunctionReference<"mutation", { id: string }, null>("relayProjects:deleteProject");

async function setup() {
  const t = convexTest(schema, modules);
  const owner = t.withIdentity({ tokenIdentifier: "owner" });
  await t.run(async (ctx) => {
    await ctx.db.insert("relayClients", { ownerUserId: "owner", durableId: "client_acme", archived: false, name: "Acme", company: "", contactName: "", email: "", phone: "", notes: "" });
    await ctx.db.insert("relayClients", { ownerUserId: "owner", durableId: "client_other", archived: false, name: "Other", company: "", contactName: "", email: "", phone: "", notes: "" });
  });
  return { t, owner };
}

describe("Relay Salary Plans and immutable Salary Batches", () => {
  test("keeps partial progress count-only, enforces owner-only access, and archives plans", async () => {
    const { t, owner } = await setup();
    const { id } = await owner.mutation(createPlan, planInput);
    await t.run(async (ctx) => {
      await ctx.db.insert("relayProjects", { ownerUserId: "owner", importedAt: "2026-08-08T00:00:00.000Z", id: "project_one", name: "One", clientId: "client_acme", stage: "Delivered", tone: "delivered", due: "2026-08-08", progress: "100%", financialType: "salaryPlan", salaryPlanId: id, completedAt: "2026-08-08T10:00:00.000Z" });
      await ctx.db.insert("relayProjects", { ownerUserId: "owner", importedAt: "2026-08-09T00:00:00.000Z", id: "project_two", name: "Two", clientId: "client_acme", stage: "Delivered", tone: "delivered", due: "2026-08-09", progress: "100%", financialType: "salaryPlan", salaryPlanId: id, completedAt: "2026-08-09T10:00:00.000Z" });
    });

    await expect(owner.query(listPlans, {})).resolves.toMatchObject([{ id, deliveredProjectIds: ["project_one", "project_two"], deliveredProjectCount: 2, remainingProjectCount: 1, currentAmount: null, notes: "Launch work." }]);
    await expect(t.withIdentity({ tokenIdentifier: "editor" }).query(listPlans, {})).resolves.toEqual([]);
    await owner.mutation(archivePlan, { id, archived: true });
    await expect(owner.query(listPlans, {})).resolves.toEqual([]);
    await expect(owner.query(listPlans, { includeArchived: true })).resolves.toMatchObject([{ id, archived: true }]);
  });

  test("binds a Project to the Plan Client and creates one immutable batch in delivery transaction", async () => {
    const { owner } = await setup();
    const { id: planId } = await owner.mutation(createPlan, planInput);
    const template = createDefaultWorkflowTemplate("template_default", "Default workflow");
    const delivered = template.stages.find(({ purpose }) => purpose === "delivered")!;
    const projectIds: string[] = [];
    for (const name of ["One", "Two", "Three"]) {
      const { id } = await owner.mutation(createProject, { name, clientId: "client_acme", projectGroupId: "", templateId: "template_default", dueDate: "2026-08-10", financialType: "salaryPlan", salaryPlanId: planId });
      projectIds.push(id);
      await owner.mutation(moveProjectStage, { id, targetStageId: delivered.id, confirmed: true });
    }

    const batches = await owner.query(listBatches, {});
    expect(batches).toHaveLength(1);
    expect(batches[0]).toMatchObject({ planId, clientId: "client_acme", requiredProjectCount: 3, batchAmount: 9000, startDate: "2026-08-01", notes: "Launch work.", projectIds, receivedAt: null });
    await expect(owner.query(listPlans, {})).resolves.toMatchObject([{ id: planId, deliveredProjectCount: 0, currentAmount: null }]);
  });

  test("preserves a completed batch through reopen, deletion, plan edits, and receipt correction", async () => {
    const { owner } = await setup();
    const { id: planId } = await owner.mutation(createPlan, planInput);
    const template = createDefaultWorkflowTemplate("template_default", "Default workflow");
    const delivered = template.stages.find(({ purpose }) => purpose === "delivered")!;
    const revisions = template.stages.find(({ purpose }) => purpose === "revisions")!;
    const projectIds: string[] = [];
    for (const name of ["One", "Two", "Three"]) {
      const { id } = await owner.mutation(createProject, { name, clientId: "client_acme", projectGroupId: "", templateId: "template_default", dueDate: "2026-08-10", financialType: "salaryPlan", salaryPlanId: planId });
      projectIds.push(id);
      await owner.mutation(moveProjectStage, { id, targetStageId: delivered.id, confirmed: true });
    }
    await owner.mutation(moveProjectStage, { id: projectIds[0], targetStageId: revisions.id, confirmed: false });
    await owner.mutation(editPlan, { id: planId, ...planInput, batchAmount: 12000, notes: "Changed after completion." });
    await owner.mutation(deleteProject, { id: projectIds[1] });

    const beforeReceive = (await owner.query(listBatches, {}))[0];
    expect(beforeReceive).toMatchObject({ planId, batchAmount: 9000, notes: "Launch work.", projectIds });
    await owner.mutation(receiveBatch, { id: String(beforeReceive.id), correctionNote: "Client corrected the invoice." });
    await expect(owner.query(listBatches, {})).resolves.toMatchObject([{ id: beforeReceive.id, planId, batchAmount: 9000, notes: "Launch work.", projectIds, receivedAt: expect.stringMatching(/^2026-08-19T/), correctionNote: "Client corrected the invoice." }]);
  });

  test("rejects a salary Project whose selected Plan belongs to another Client", async () => {
    const { owner } = await setup();
    const { id: planId } = await owner.mutation(createPlan, planInput);
    await expect(owner.mutation(createProject, { name: "Wrong client", clientId: "client_other", projectGroupId: "", templateId: "template_default", dueDate: "2026-08-10", financialType: "salaryPlan", salaryPlanId: planId })).rejects.toThrow("same Client");
  });
});
