import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { isWorkspaceProject, MAX_RELAY_PROJECTS } from "../src/relay/domain/workspace-project";
import { isRelayClient, MAX_RELAY_CLIENTS } from "../src/relay/domain/client";
import { relayClientValidator, relayProjectValidator } from "./relayWorkspaceValidators";

const importResultValidator = v.union(
  v.object({ ok: v.literal(true), imported: v.number() }),
  v.object({ ok: v.literal(false), error: v.string() }),
);

const WORKSPACE_NOT_EMPTY = "This cloud Workspace already contains records. Relay did not change either source.";

export const listMine = query({
  args: {},
  returns: v.array(relayProjectValidator),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const projects = await ctx.db
      .query("relayProjects")
      .withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", identity.tokenIdentifier))
      .take(MAX_RELAY_PROJECTS);
    return projects.map(({ _id: _documentId, _creationTime: _created, ownerUserId: _owner, importedAt: _imported, ...project }) => project);
  },
});

export const importLocalWorkspace = mutation({
  args: { projects: v.array(relayProjectValidator), clients: v.array(relayClientValidator) },
  returns: importResultValidator,
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Sign in to import a Local Mode backup.");
    if (args.projects.length > MAX_RELAY_PROJECTS) {
      throw new Error(`A Relay backup can contain no more than ${MAX_RELAY_PROJECTS} projects.`);
    }
    if (!args.projects.every(isWorkspaceProject)) throw new Error("The backup contains an invalid project record.");
    if (args.clients.length > MAX_RELAY_CLIENTS || !args.clients.every(isRelayClient)) throw new Error("The backup contains an invalid Client record.");
    const clientIds = new Set(args.clients.map((client) => client.id));
    if (clientIds.size !== args.clients.length || args.projects.some((project) => !clientIds.has(project.clientId))) {
      throw new Error("Every imported Project must refer to one imported Client identifier.");
    }

    const ownerUserId = identity.tokenIdentifier;
    const [priorImport, relayProject, relayClient] = await Promise.all([
      ctx.db.query("relayWorkspaceImports").withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", ownerUserId)).unique(),
      ctx.db.query("relayProjects").withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", ownerUserId)).first(),
      ctx.db.query("relayClients").withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", ownerUserId)).first(),
    ]);
    if (priorImport || relayProject || relayClient) return { ok: false as const, error: WORKSPACE_NOT_EMPTY };

    const importedAt = new Date().toISOString();
    for (const project of args.projects) {
      await ctx.db.insert("relayProjects", { ownerUserId, importedAt, ...project });
    }
    for (const { id: durableId, ...client } of args.clients) {
      await ctx.db.insert("relayClients", { ownerUserId, durableId, ...client });
    }
    const recordCount = args.projects.length + args.clients.length;
    await ctx.db.insert("relayWorkspaceImports", { ownerUserId, importedAt, recordCount });
    return { ok: true as const, imported: recordCount };
  },
});
