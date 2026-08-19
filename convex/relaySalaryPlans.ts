import { ConvexError, v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { salaryPlanSchema, deriveSalaryPlanProgress, markSalaryBatchReceived, type SalaryBatch, type SalaryPlan, type SalaryProject } from "../src/relay/domain/salary-plan";
import { salaryBatchValidator, salaryPlanInputValidator, salaryPlanValidator } from "./relayWorkspaceValidators";

function salaryError(kind: "unauthorized" | "invalid" | "not-found" | "unavailable", message: string): never {
  throw new ConvexError({ kind, message });
}

async function requireOwner(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) salaryError("unauthorized", "Sign in to manage Salary Plans.");
  return identity.tokenIdentifier;
}

function planFromRow(row: { durableId: string; clientId: string; requiredProjectCount: number; batchAmount: number; startDate: string; notes: string; archived: boolean }): SalaryPlan {
  return { id: row.durableId, clientId: row.clientId, requiredProjectCount: row.requiredProjectCount, batchAmount: row.batchAmount, startDate: row.startDate, notes: row.notes, archived: row.archived };
}

function batchFromRow(row: { id: string; planId: string; clientId: string; requiredProjectCount: number; batchAmount: number; startDate: string; notes: string; projectIds: string[]; completedAt: string; receivedAt?: string | null; correctionNote?: string }): SalaryBatch {
  return { id: row.id, planId: row.planId, clientId: row.clientId, requiredProjectCount: row.requiredProjectCount, batchAmount: row.batchAmount, startDate: row.startDate, notes: row.notes, projectIds: row.projectIds, completedAt: row.completedAt, receivedAt: row.receivedAt ?? null, ...(row.correctionNote ? { correctionNote: row.correctionNote } : {}) };
}

async function collectPlans(ctx: QueryCtx | MutationCtx, ownerUserId: string) {
  const rows: Doc<"relaySalaryPlans">[] = [];
  let cursor: string | null = null;
  for (;;) {
    const page = await ctx.db.query("relaySalaryPlans").withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", ownerUserId)).paginate({ numItems: 500, cursor });
    rows.push(...page.page);
    if (page.isDone) return rows;
    cursor = page.continueCursor;
  }
}

async function collectProjects(ctx: QueryCtx | MutationCtx, ownerUserId: string, planId: string) {
  const rows: Doc<"relayProjects">[] = [];
  let cursor: string | null = null;
  for (;;) {
    const page = await ctx.db.query("relayProjects").withIndex("by_ownerUserId_and_salaryPlanId", (q) => q.eq("ownerUserId", ownerUserId).eq("salaryPlanId", planId)).paginate({ numItems: 500, cursor });
    rows.push(...page.page);
    if (page.isDone) return rows;
    cursor = page.continueCursor;
  }
}

async function collectBatches(ctx: QueryCtx | MutationCtx, ownerUserId: string, planId?: string) {
  const rows: Doc<"relaySalaryBatches">[] = [];
  let cursor: string | null = null;
  for (;;) {
    const query = planId === undefined
      ? ctx.db.query("relaySalaryBatches").withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", ownerUserId))
      : ctx.db.query("relaySalaryBatches").withIndex("by_ownerUserId_and_planId", (q) => q.eq("ownerUserId", ownerUserId).eq("planId", planId));
    const page = await query.paginate({ numItems: 500, cursor });
    rows.push(...page.page);
    if (page.isDone) return rows;
    cursor = page.continueCursor;
  }
}

function validatePlan(input: unknown) {
  const parsed = salaryPlanSchema.safeParse(input);
  if (!parsed.success) salaryError("invalid", parsed.error.issues[0]?.message ?? "Enter valid Salary Plan details.");
  return parsed.data;
}

async function requireActiveClient(ctx: MutationCtx, ownerUserId: string, clientId: string) {
  const client = await ctx.db.query("relayClients").withIndex("by_ownerUserId_and_durableId", (q) => q.eq("ownerUserId", ownerUserId).eq("durableId", clientId)).unique();
  if (!client || client.archived) salaryError("invalid", "Choose an active Client for this Salary Plan.");
}

export const listPlans = query({
  args: { includeArchived: v.optional(v.boolean()) },
  returns: v.array(salaryPlanValidator),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const planRows = await collectPlans(ctx, identity.tokenIdentifier);
    const batchRows = await collectBatches(ctx, identity.tokenIdentifier);
    const progressRows = await Promise.all(planRows.map(async (row) => {
      const plan = planFromRow(row);
      const projects = await collectProjects(ctx, identity.tokenIdentifier, plan.id);
      const progress = deriveSalaryPlanProgress(plan, projects.map((project): SalaryProject => ({ id: project.id, ...(project.salaryPlanId ? { salaryPlanId: project.salaryPlanId } : {}), ...(project.completedAt ? { completedAt: project.completedAt } : {}) })), batchRows.map(batchFromRow));
      return { ...plan, deliveredProjectIds: [...progress.deliveredProjectIds], deliveredProjectCount: progress.deliveredProjectCount, remainingProjectCount: progress.remainingProjectCount, currentAmount: progress.currentAmount };
    }));
    return progressRows
      .filter((plan) => args.includeArchived || !plan.archived)
  },
});

export const listBatches = query({
  args: {},
  returns: v.array(salaryBatchValidator),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return (await collectBatches(ctx, identity.tokenIdentifier)).map(batchFromRow);
  },
});

export async function maybeCreateSalaryBatch(ctx: MutationCtx, ownerUserId: string, planId: string): Promise<string | null> {
  const planRow = await ctx.db.query("relaySalaryPlans").withIndex("by_ownerUserId_and_durableId", (q) => q.eq("ownerUserId", ownerUserId).eq("durableId", planId)).unique();
  if (!planRow) return null;
  const [projectRows, batchRows] = await Promise.all([collectProjects(ctx, ownerUserId, planId), collectBatches(ctx, ownerUserId, planId)]);
  const plan = planFromRow(planRow);
  const progress = deriveSalaryPlanProgress(
    plan,
    projectRows.map((project): SalaryProject => ({ id: project.id, ...(project.salaryPlanId ? { salaryPlanId: project.salaryPlanId } : {}), ...(project.completedAt ? { completedAt: project.completedAt } : {}) })),
    batchRows.map(batchFromRow),
  );
  if (progress.deliveredProjectCount < plan.requiredProjectCount) return null;
  const batchId = `batch_${crypto.randomUUID()}`;
  await ctx.db.insert("relaySalaryBatches", {
    ownerUserId,
    id: batchId,
    planId: plan.id,
    clientId: plan.clientId,
    requiredProjectCount: plan.requiredProjectCount,
    batchAmount: plan.batchAmount,
    startDate: plan.startDate,
    notes: plan.notes,
    projectIds: progress.deliveredProjectIds.slice(0, plan.requiredProjectCount),
    completedAt: new Date().toISOString(),
    receivedAt: null,
  });
  return batchId;
}

export const createPlan = mutation({
  args: salaryPlanInputValidator.fields,
  returns: v.object({ id: v.string() }),
  handler: async (ctx, args) => {
    const ownerUserId = await requireOwner(ctx);
    const input = validatePlan(args);
    await requireActiveClient(ctx, ownerUserId, input.clientId);
    const durableId = `plan_${crypto.randomUUID()}`;
    await ctx.db.insert("relaySalaryPlans", { ownerUserId, durableId, archived: false, ...input });
    return { id: durableId };
  },
});

export const editPlan = mutation({
  args: { id: v.string(), ...salaryPlanInputValidator.fields },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerUserId = await requireOwner(ctx);
    const plan = await ctx.db.query("relaySalaryPlans").withIndex("by_ownerUserId_and_durableId", (q) => q.eq("ownerUserId", ownerUserId).eq("durableId", args.id)).unique();
    if (!plan) salaryError("not-found", "Salary Plan not found.");
    const { id: _id, ...rawInput } = args;
    const input = validatePlan(rawInput);
    await requireActiveClient(ctx, ownerUserId, input.clientId);
    if (input.clientId !== plan.clientId) {
      const linkedProjects = await ctx.db.query("relayProjects").withIndex("by_ownerUserId_and_salaryPlanId", (q) => q.eq("ownerUserId", ownerUserId).eq("salaryPlanId", plan.durableId)).take(1);
      if (linkedProjects.length) salaryError("invalid", "Move this Salary Plan's Projects before changing its Client.");
    }
    await ctx.db.patch(plan._id, input);
    return null;
  },
});

export const setArchived = mutation({
  args: { id: v.string(), archived: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerUserId = await requireOwner(ctx);
    const plan = await ctx.db.query("relaySalaryPlans").withIndex("by_ownerUserId_and_durableId", (q) => q.eq("ownerUserId", ownerUserId).eq("durableId", args.id)).unique();
    if (!plan) salaryError("not-found", "Salary Plan not found.");
    await ctx.db.patch(plan._id, { archived: args.archived });
    return null;
  },
});

export const markBatchReceived = mutation({
  args: { id: v.string(), correctionNote: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerUserId = await requireOwner(ctx);
    const batch = await ctx.db.query("relaySalaryBatches").withIndex("by_ownerUserId_and_id", (q) => q.eq("ownerUserId", ownerUserId).eq("id", args.id)).unique();
    if (!batch) salaryError("not-found", "Salary Batch not found.");
    if (batch.receivedAt) salaryError("invalid", "Salary Batch is already received.");
    if (args.correctionNote && args.correctionNote.length > 2000) salaryError("invalid", "Correction note is too long.");
    const received = markSalaryBatchReceived(batchFromRow(batch), new Date().toISOString(), args.correctionNote);
    await ctx.db.patch(batch._id, { receivedAt: received.receivedAt, ...(received.correctionNote ? { correctionNote: received.correctionNote } : {}) });
    return null;
  },
});
