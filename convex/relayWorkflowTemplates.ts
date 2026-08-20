import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { createDefaultWorkflowTemplate, validateWorkflowTemplate, type WorkflowTemplate } from "../src/relay/domain/workflow-template";
import { workflowTemplateInputValidator, workflowTemplateValidator } from "./relayWorkspaceValidators";
import { relayAccessForCurrentUser, requireRelayPermission } from "./relayAccess";

async function requireOwnerUserId(ctx: MutationCtx) {
  return (await requireRelayPermission(ctx, "projects")).ownerUserId;
}

function rowToTemplate(row: { durableId: string; archived: boolean; name: string; stages: WorkflowTemplate["stages"]; cancelledLabel: string; starterOutputs: WorkflowTemplate["starterOutputs"]; roles: WorkflowTemplate["roles"]; portalDefaults: WorkflowTemplate["portalDefaults"] }): WorkflowTemplate {
  return { id: row.durableId, archived: row.archived, name: row.name, stages: row.stages, cancelledLabel: row.cancelledLabel, starterOutputs: row.starterOutputs, roles: row.roles, portalDefaults: row.portalDefaults };
}

export const list = query({
  args: { includeArchived: v.optional(v.boolean()) },
  returns: v.array(workflowTemplateValidator),
  handler: async (ctx, args) => {
    const access = await relayAccessForCurrentUser(ctx);
    if (!access) return [];
    const rows = await ctx.db.query("relayWorkflowTemplates").withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", access.ownerUserId)).take(100);
    if (!rows.length) return [createDefaultWorkflowTemplate("template_default", "Default workflow")];
    return rows.sort((a, b) => a.order - b.order).filter((row) => args.includeArchived || !row.archived).map(rowToTemplate);
  },
});

export const create = mutation({
  args: workflowTemplateInputValidator.fields,
  returns: v.object({ id: v.string() }),
  handler: async (ctx, args) => {
    const ownerUserId = await requireOwnerUserId(ctx);
    const error = validateWorkflowTemplate(args);
    if (error) throw new Error(error);
    const rows = await ctx.db.query("relayWorkflowTemplates").withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", ownerUserId)).take(100);
    if (rows.length >= 100) throw new Error("A Workspace supports up to 100 Workflow Templates.");
    if (!rows.length) {
      const fallback = createDefaultWorkflowTemplate("template_default", "Default workflow");
      const { id: durableId, ...defaultInput } = fallback;
      await ctx.db.insert("relayWorkflowTemplates", { ownerUserId, durableId, order: 0, ...defaultInput });
    }
    const durableId = `template_${crypto.randomUUID()}`;
    await ctx.db.insert("relayWorkflowTemplates", { ownerUserId, durableId, order: rows.length + (rows.length ? 0 : 1), archived: false, ...args });
    return { id: durableId };
  },
});

export const edit = mutation({
  args: { id: v.string(), ...workflowTemplateInputValidator.fields },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerUserId = await requireOwnerUserId(ctx);
    const stored = await ctx.db.query("relayWorkflowTemplates").withIndex("by_ownerUserId_and_durableId", (q) => q.eq("ownerUserId", ownerUserId).eq("durableId", args.id)).unique();
    const prior = stored ? rowToTemplate(stored) : args.id === "template_default" ? createDefaultWorkflowTemplate("template_default", "Default workflow") : null;
    if (!prior) throw new Error("Workflow Template not found.");
    const { id: _id, ...input } = args;
    const error = validateWorkflowTemplate(input);
    if (error) throw new Error(error);
    for (const stage of prior.stages) {
      const next = input.stages.find(({ id }) => id === stage.id);
      if (next && next.purpose !== stage.purpose) throw new Error("A stage's reporting purpose cannot change. Add a new stage instead.");
      if (!next) {
        const used = await ctx.db.query("relayProjects").withIndex("by_ownerUserId_and_workflowTemplateId_and_workflowStageId", (q) => q.eq("ownerUserId", ownerUserId).eq("workflowTemplateId", args.id).eq("workflowStageId", stage.id)).first();
        if (used) throw new Error(`Reassign Projects from ${stage.label} before removing this stage.`);
      }
    }
    if (stored) await ctx.db.patch("relayWorkflowTemplates", stored._id, input);
    else await ctx.db.insert("relayWorkflowTemplates", { ownerUserId, durableId: args.id, order: 0, archived: false, ...input });
    return null;
  },
});

export const reorder = mutation({
  args: { ids: v.array(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerUserId = await requireOwnerUserId(ctx);
    const rows = await ctx.db.query("relayWorkflowTemplates").withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", ownerUserId)).take(100);
    if (rows.length !== args.ids.length || new Set(args.ids).size !== rows.length) throw new Error("Choose every saved Workflow Template once before saving the order.");
    for (const [order, id] of args.ids.entries()) {
      const row = rows.find(({ durableId }) => durableId === id);
      if (!row) throw new Error("Choose every saved Workflow Template once before saving the order.");
      await ctx.db.patch("relayWorkflowTemplates", row._id, { order });
    }
    return null;
  },
});

export const setArchived = mutation({
  args: { id: v.string(), archived: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerUserId = await requireOwnerUserId(ctx);
    const row = await ctx.db.query("relayWorkflowTemplates").withIndex("by_ownerUserId_and_durableId", (q) => q.eq("ownerUserId", ownerUserId).eq("durableId", args.id)).unique();
    if (!row && args.id === "template_default") {
      const template = createDefaultWorkflowTemplate("template_default", "Default workflow");
      const { id: durableId, ...input } = template;
      await ctx.db.insert("relayWorkflowTemplates", { ownerUserId, durableId, order: 0, ...input, archived: args.archived });
      return null;
    }
    if (!row) throw new Error("Workflow Template not found.");
    await ctx.db.patch("relayWorkflowTemplates", row._id, { archived: args.archived });
    return null;
  },
});
