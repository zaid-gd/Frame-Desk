import { v } from "convex/values";
import { internalMutation, mutation, query, type MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { newProjectInputValidator, projectDetailValidator, projectGroupInputValidator, projectGroupValidator, projectStageEffectValidator } from "./relayWorkspaceValidators";
import { copyProjectSetup, createDefaultWorkflowTemplate, type WorkflowTemplate } from "../src/relay/domain/workflow-template";
import { isIsoCalendarDate } from "../src/relay/domain/calendar-date";
import { deriveProjectGroupTotals } from "../src/relay/domain/project-group";
import { projectStageTransition, type ProjectRecord } from "../src/relay/domain/project";
import { relayStorageUsage } from "./relayStorageUsage";
import { maybeCreateSalaryBatch } from "./relaySalaryPlans";
import { relayAccessForCurrentUser } from "./relayAccess";

async function requireOwner(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Sign in to manage Projects.");
  return identity.tokenIdentifier;
}

function validGroup(input: { name: string; clientId: string; startDate: string; endDate: string; notes: string }) {
  return input.name.trim().length > 0
    && input.name.length <= 200
    && input.clientId.length > 0
    && (!input.startDate || isIsoCalendarDate(input.startDate))
    && (!input.endDate || isIsoCalendarDate(input.endDate))
    && (!input.startDate || !input.endDate || input.startDate <= input.endDate)
    && input.notes.length <= 2_000;
}

async function clientExists(ctx: MutationCtx, ownerUserId: string, clientId: string) {
  return ctx.db.query("relayClients").withIndex("by_ownerUserId_and_durableId", (q) => q.eq("ownerUserId", ownerUserId).eq("durableId", clientId)).unique();
}

export const listGroups = query({
  args: { includeArchived: v.optional(v.boolean()) },
  returns: v.array(projectGroupValidator),
  handler: async (ctx, args) => {
    const access = await relayAccessForCurrentUser(ctx);
    if (!access) return [];
    const groups = await ctx.db.query("relayProjectGroups").withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", access.ownerUserId)).take(500);
    const projects = await ctx.db.query("relayProjects").withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", access.ownerUserId)).take(500);
    return groups.filter((group) => args.includeArchived || !group.archived).map((group) => {
      const totals = deriveProjectGroupTotals(projects.map((project) => ({ projectGroupId: project.projectGroupId, progress: Number.parseFloat(project.progress) || 0, money: project.agreedAmount ?? project.outstandingAmount ?? 0 })), group.durableId);
      return { id: group.durableId, name: group.name, clientId: group.clientId, startDate: group.startDate, endDate: group.endDate, notes: group.notes, archived: group.archived, ...totals };
    });
  },
});

export const createGroup = mutation({
  args: projectGroupInputValidator.fields,
  returns: v.object({ id: v.string() }),
  handler: async (ctx, args) => {
    const ownerUserId = await requireOwner(ctx);
    if (!validGroup(args)) throw new Error("Enter valid Project Group details before saving.");
    const client = await clientExists(ctx, ownerUserId, args.clientId);
    if (!client || client.archived) throw new Error("Choose an active Client for this Project Group.");
    const durableId = `group_${crypto.randomUUID()}`;
    await ctx.db.insert("relayProjectGroups", { ownerUserId, durableId, archived: false, ...args, name: args.name.trim() });
    return { id: durableId };
  },
});

export const editGroup = mutation({
  args: { id: v.string(), ...projectGroupInputValidator.fields },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerUserId = await requireOwner(ctx);
    const group = await ctx.db.query("relayProjectGroups").withIndex("by_ownerUserId_and_durableId", (q) => q.eq("ownerUserId", ownerUserId).eq("durableId", args.id)).unique();
    if (!group) throw new Error("Project Group not found.");
    const { id: _id, ...input } = args;
    if (!validGroup(input)) throw new Error("Enter valid Project Group details before saving.");
    const client = await clientExists(ctx, ownerUserId, input.clientId);
    if (!client || client.archived) throw new Error("Choose an active Client for this Project Group.");
    const assignedProject = await ctx.db.query("relayProjects").withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", ownerUserId)).take(500);
    if (assignedProject.some((project) => project.projectGroupId === args.id && project.clientId !== input.clientId)) throw new Error("Move this Project Group's Projects before changing its Client.");
    await ctx.db.patch("relayProjectGroups", group._id, { ...input, name: input.name.trim() });
    return null;
  },
});

export const setGroupArchived = mutation({
  args: { id: v.string(), archived: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerUserId = await requireOwner(ctx);
    const group = await ctx.db.query("relayProjectGroups").withIndex("by_ownerUserId_and_durableId", (q) => q.eq("ownerUserId", ownerUserId).eq("durableId", args.id)).unique();
    if (!group) throw new Error("Project Group not found.");
    await ctx.db.patch("relayProjectGroups", group._id, { archived: args.archived });
    return null;
  },
});

function workflowTemplateFromRow(row: { durableId: string; archived: boolean; name: string; stages: WorkflowTemplate["stages"]; cancelledLabel: string; starterOutputs: WorkflowTemplate["starterOutputs"]; roles: WorkflowTemplate["roles"]; portalDefaults: WorkflowTemplate["portalDefaults"] }): WorkflowTemplate {
  return { id: row.durableId, archived: row.archived, name: row.name, stages: row.stages, cancelledLabel: row.cancelledLabel, starterOutputs: row.starterOutputs, roles: row.roles, portalDefaults: row.portalDefaults };
}

export const createProject = mutation({
  args: newProjectInputValidator.fields,
  returns: v.object({ id: v.string() }),
  handler: async (ctx, args) => {
    const ownerUserId = await requireOwner(ctx);
    if (!args.name.trim() || args.name.length > 200 || !isIsoCalendarDate(args.dueDate)) throw new Error("Enter valid Project details before saving.");
    if (args.agreedAmount !== undefined && (!Number.isFinite(args.agreedAmount) || args.agreedAmount < 0)) throw new Error("Enter a valid agreed Project amount.");
    const client = await clientExists(ctx, ownerUserId, args.clientId);
    if (!client || client.archived) throw new Error("Choose an active Client for this Project.");
    const salaryPlanId = args.salaryPlanId?.trim() || undefined;
    if (args.financialType === "salaryPlan") {
      if (!salaryPlanId) throw new Error("Choose a Salary Plan for this Project.");
      const plan = await ctx.db.query("relaySalaryPlans").withIndex("by_ownerUserId_and_durableId", (q) => q.eq("ownerUserId", ownerUserId).eq("durableId", salaryPlanId)).unique();
      if (!plan || plan.archived) throw new Error("Choose an active Salary Plan for this Project.");
      if (plan.clientId !== args.clientId) throw new Error("Choose a Salary Plan for the same Client.");
    } else if (salaryPlanId) {
      throw new Error("Salary Plans can only be selected for Salary Plan Projects.");
    }
    if (args.projectGroupId) {
      const group = await ctx.db.query("relayProjectGroups").withIndex("by_ownerUserId_and_durableId", (q) => q.eq("ownerUserId", ownerUserId).eq("durableId", args.projectGroupId)).unique();
      if (!group || group.archived || group.clientId !== args.clientId) throw new Error("Choose an active Project Group for the same Client.");
    }
    const storedTemplate = await ctx.db.query("relayWorkflowTemplates").withIndex("by_ownerUserId_and_durableId", (q) => q.eq("ownerUserId", ownerUserId).eq("durableId", args.templateId)).unique();
    const template = storedTemplate ? workflowTemplateFromRow(storedTemplate) : args.templateId === "template_default" ? createDefaultWorkflowTemplate("template_default", "Default workflow") : null;
    if (!template || template.archived) throw new Error("Choose an active Workflow Template.");
    const setup = copyProjectSetup(template);
    const firstStage = setup.stages[0];
    const id = `project_${crypto.randomUUID()}`;
    const createdAt = new Date().toISOString();
    const agreedAmount = args.financialType === "projectValue" ? args.agreedAmount ?? 0 : 0;
    await ctx.db.insert("relayProjects", {
      ownerUserId,
      importedAt: createdAt,
      id,
      name: args.name.trim(),
      clientId: args.clientId,
      stage: firstStage.label,
      tone: "planned",
      due: args.dueDate,
      progress: "0%",
      status: "active",
      ...(args.projectGroupId ? { projectGroupId: args.projectGroupId } : {}),
      workflowTemplateId: template.id,
      workflowStageId: firstStage.id,
      workflowSetup: setup,
      financialType: args.financialType,
      agreedAmount,
      paymentState: args.financialType === "nonBillable" ? "not-applicable" : "unpaid",
      createdAt,
      stageHistory: [{ stageId: firstStage.id, label: firstStage.label, purpose: firstStage.purpose, enteredAt: createdAt }],
      ...(salaryPlanId ? { salaryPlanId } : {}),
      lead: "Unassigned",
      assignees: [],
    });
    for (const starter of setup.starterOutputs) {
      await ctx.db.insert("relayProjectOutputs", {
        ownerUserId,
        durableId: `output_${crypto.randomUUID()}`,
        projectId: id,
        name: starter.name,
        reviewState: "draft",
        archived: false,
        relativeDeadlineDays: starter.relativeDeadlineDays,
        ...(starter.roleId ? { roleId: starter.roleId } : {}),
      });
    }
    return { id };
  },
});

export const inspectProject = query({
  args: { id: v.string() },
  returns: v.union(projectDetailValidator, v.null()),
  handler: async (ctx, args) => {
    const access = await relayAccessForCurrentUser(ctx);
    if (!access) return null;
    const project = await ctx.db.query("relayProjects").withIndex("by_ownerUserId_and_id", (q) => q.eq("ownerUserId", access.ownerUserId).eq("id", args.id)).unique();
    if (!project || !project.workflowSetup || !project.financialType) return null;
    const { ownerUserId: _owner, importedAt: _importedAt, _id: _rowId, _creationTime: _created, ...detail } = project;
    return { ...detail, financialType: project.financialType, dueDate: project.due, lead: project.lead ?? "Unassigned", assignees: project.assignees ?? [] };
  },
});

export const listProjects = query({
  args: {},
  returns: v.array(projectDetailValidator),
  handler: async (ctx) => {
    const access = await relayAccessForCurrentUser(ctx);
    if (!access) return [];
    const projects = await ctx.db.query("relayProjects").withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", access.ownerUserId)).take(500);
    return projects.flatMap((project) => {
      if (!project.workflowSetup || !project.financialType) return [];
      const { ownerUserId: _owner, importedAt: _importedAt, _id: _rowId, _creationTime: _created, ...detail } = project;
      return [{ ...detail, financialType: project.financialType, dueDate: project.due, lead: project.lead ?? "Unassigned", assignees: project.assignees ?? [] }];
    });
  },
});

export const myAccess = query({
  args: {},
  returns: v.union(v.object({ ownerUserId: v.string(), memberId: v.string(), role: v.union(v.literal("owner"), v.literal("editor"), v.literal("viewer")), canMarkPayments: v.boolean() }), v.null()),
  handler: async (ctx) => relayAccessForCurrentUser(ctx),
});

export const setProjectArchived = mutation({
  args: { id: v.string(), archived: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerUserId = await requireOwner(ctx);
    const project = await ctx.db.query("relayProjects").withIndex("by_ownerUserId_and_id", (q) => q.eq("ownerUserId", ownerUserId).eq("id", args.id)).unique();
    if (!project) throw new Error("Project not found.");
    await ctx.db.patch("relayProjects", project._id, { status: args.archived ? "past" : "active" });
    return null;
  },
});

export const setProjectPayment = mutation({
  args: { id: v.string(), paid: v.boolean() },
  returns: v.object({ paidAt: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    const access = await relayAccessForCurrentUser(ctx);
    if (!access?.canMarkPayments) throw new Error("You do not have permission to mark Project payments.");
    const project = await ctx.db.query("relayProjects").withIndex("by_ownerUserId_and_id", (q) => q.eq("ownerUserId", access.ownerUserId).eq("id", args.id)).unique();
    if (!project) throw new Error("Project not found.");
    if (project.financialType !== "projectValue") throw new Error("Only normal client Projects have a payment state.");
    const paidAt = args.paid ? new Date().toISOString() : undefined;
    await ctx.db.patch("relayProjects", project._id, {
      paymentState: args.paid ? "paid" : "unpaid",
      ...(paidAt ? { paidAt } : { paidAt: undefined }),
    });
    return paidAt ? { paidAt } : {};
  },
});

export const moveProjectStage = mutation({
  args: { id: v.string(), targetStageId: v.string(), confirmed: v.boolean() },
  returns: v.object({ projectName: v.string(), stage: v.string(), effect: projectStageEffectValidator }),
  handler: async (ctx, args) => {
    const ownerUserId = await requireOwner(ctx);
    const project = await ctx.db.query("relayProjects").withIndex("by_ownerUserId_and_id", (q) => q.eq("ownerUserId", ownerUserId).eq("id", args.id)).unique();
    if (!project || !project.workflowSetup || !project.financialType) throw new Error("Project not found.");
    const record: ProjectRecord = {
      id: project.id,
      name: project.name,
      clientId: project.clientId,
      ...(project.salaryPlanId ? { salaryPlanId: project.salaryPlanId } : {}),
      ...(project.projectGroupId ? { projectGroupId: project.projectGroupId } : {}),
      stage: project.stage,
      dueDate: project.due,
      financialType: project.financialType,
      paymentState: project.financialType === "nonBillable" ? "not-applicable" : project.paymentState ?? (project.agreedAmount !== undefined ? "unpaid" : (project.outstandingAmount ?? 0) > 0 ? "unpaid" : "paid"),
      archived: project.status === "past",
      lead: project.lead ?? "Unassigned",
      assignees: project.assignees ?? [],
      progress: Number.parseFloat(project.progress) || 0,
      money: project.agreedAmount ?? project.outstandingAmount ?? 0,
      agreedAmount: project.agreedAmount,
      paidAt: project.paidAt,
      createdAt: project.createdAt,
      stageHistory: project.stageHistory,
      workflowSetup: project.workflowSetup,
      workflowStageId: project.workflowStageId,
      completedAt: project.completedAt,
    };
    const transition = projectStageTransition(record, args.targetStageId, new Date().toISOString(), args.confirmed);
    if (!transition) throw new Error("Choose a stage from this Project's workflow.");
    if (transition.kind === "confirmation-required") throw new Error("Confirm delivery before moving this Project to Delivered.");
    await ctx.db.patch("relayProjects", project._id, {
      stage: transition.project.stage,
      workflowStageId: transition.project.workflowStageId,
      progress: `${transition.project.progress}%`,
      tone: transition.tone,
      completedAt: transition.project.completedAt,
      ...(transition.project.stageHistory ? { stageHistory: transition.project.stageHistory } : {}),
    });
    const batchId = transition.effect.kind === "salaryPlan" && transition.effect.change === "added" && transition.project.salaryPlanId
      ? await maybeCreateSalaryBatch(ctx, ownerUserId, transition.project.salaryPlanId)
      : null;
    const effect = batchId && transition.effect.kind === "salaryPlan" ? { ...transition.effect, batchId } : transition.effect;
    return { projectName: transition.project.name, stage: transition.project.stage, effect };
  },
});

export const cleanupDeletedProjectRecords = internalMutation({
  args: { ownerUserId: v.string(), projectId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const batchSize = 100;
    const comments = await ctx.db.query("relayMediaComments").withIndex("by_ownerUserId_and_projectId", (q) => q.eq("ownerUserId", args.ownerUserId).eq("projectId", args.projectId)).take(batchSize);
    for (const comment of comments) await ctx.db.delete("relayMediaComments", comment._id);
    if (comments.length === batchSize) { await ctx.scheduler.runAfter(0, internal.relayProjects.cleanupDeletedProjectRecords, args); return null; }
    const files = await ctx.db.query("relayProjectFiles").withIndex("by_ownerUserId_and_projectId", (q) => q.eq("ownerUserId", args.ownerUserId).eq("projectId", args.projectId)).take(batchSize);
    for (const file of files) {
      await ctx.storage.delete(file.storageId);
      await ctx.db.delete("relayProjectFiles", file._id);
      await relayStorageUsage.deleteIfExists(ctx, { namespace: args.ownerUserId, key: file.durableId, id: `file:${file.durableId}` });
      const policy = await ctx.db.query("relayStoragePolicy").withIndex("by_key", (q) => q.eq("key", "service")).unique();
      if (policy?.remainingBytes !== undefined) {
        const remainingBytes = policy.remainingBytes + file.size;
        await ctx.db.patch("relayStoragePolicy", policy._id, { remainingBytes, acceptsUploads: remainingBytes > (policy.reserveBytes ?? 0) });
      }
    }
    if (files.length === batchSize) { await ctx.scheduler.runAfter(0, internal.relayProjects.cleanupDeletedProjectRecords, args); return null; }
    const versions = await ctx.db.query("relayMediaVersions").withIndex("by_ownerUserId_and_projectId", (q) => q.eq("ownerUserId", args.ownerUserId).eq("projectId", args.projectId)).take(batchSize);
    for (const version of versions) {
      await ctx.db.delete("relayMediaVersions", version._id);
      await relayStorageUsage.deleteIfExists(ctx, {
        namespace: args.ownerUserId,
        key: version.durableId,
        id: `version:${version.durableId}`,
      });
    }
    if (versions.length === batchSize) { await ctx.scheduler.runAfter(0, internal.relayProjects.cleanupDeletedProjectRecords, args); return null; }
    const outputs = await ctx.db.query("relayProjectOutputs").withIndex("by_ownerUserId_and_projectId", (q) => q.eq("ownerUserId", args.ownerUserId).eq("projectId", args.projectId)).take(batchSize);
    for (const output of outputs) await ctx.db.delete("relayProjectOutputs", output._id);
    if (outputs.length === batchSize) await ctx.scheduler.runAfter(0, internal.relayProjects.cleanupDeletedProjectRecords, args);
    return null;
  },
});

export const deleteProject = mutation({
  args: { id: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerUserId = await requireOwner(ctx);
    const project = await ctx.db.query("relayProjects").withIndex("by_ownerUserId_and_id", (q) => q.eq("ownerUserId", ownerUserId).eq("id", args.id)).unique();
    if (!project) throw new Error("Project not found.");
    await ctx.db.delete("relayProjects", project._id);
    await ctx.scheduler.runAfter(0, internal.relayProjects.cleanupDeletedProjectRecords, { ownerUserId, projectId: args.id });
    return null;
  },
});
