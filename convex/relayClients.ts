import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { isRelayClient, validateClientInput } from "../src/relay/domain/client";
import { relayClientInputValidator, relayClientValidator } from "./relayWorkspaceValidators";

async function owner(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Sign in to manage Clients.");
  return identity.tokenIdentifier;
}

export const list = query({
  args: { includeArchived: v.optional(v.boolean()), search: v.optional(v.string()) },
  returns: v.array(relayClientValidator),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const needle = args.search?.trim().toLocaleLowerCase() ?? "";
    const rows = await ctx.db.query("relayClients").withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", identity.tokenIdentifier)).take(500);
    return rows.filter((row) => (args.includeArchived || !row.archived) && (!needle || [row.name, row.company, row.contactName, row.email, row.phone, row.notes].some((value) => value.toLocaleLowerCase().includes(needle))))
      .map(({ durableId, name, company, contactName, email, phone, notes, archived }) => ({ id: durableId, name, company, contactName, email, phone, notes, archived }));
  },
});

export const create = mutation({
  args: relayClientInputValidator.fields,
  returns: v.object({ id: v.string() }),
  handler: async (ctx, args) => {
    const ownerUserId = await owner(ctx);
    if (validateClientInput(args)) throw new Error("Enter a name and valid Client details before saving.");
    const durableId = `client_${crypto.randomUUID()}`;
    await ctx.db.insert("relayClients", { ownerUserId, durableId, archived: false, ...args });
    return { id: durableId };
  },
});

export const edit = mutation({
  args: { id: v.string(), ...relayClientInputValidator.fields },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerUserId = await owner(ctx);
    const existing = await ctx.db.query("relayClients").withIndex("by_ownerUserId_and_durableId", (q) => q.eq("ownerUserId", ownerUserId).eq("durableId", args.id)).unique();
    if (!existing) throw new Error("Client not found.");
    const { id: _id, ...input } = args;
    if (!isRelayClient({ id: args.id, archived: existing.archived, ...input })) throw new Error("Enter a name and valid Client details before saving.");
    await ctx.db.patch("relayClients", existing._id, input);
    return null;
  },
});

export const setArchived = mutation({
  args: { id: v.string(), archived: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerUserId = await owner(ctx);
    const existing = await ctx.db.query("relayClients").withIndex("by_ownerUserId_and_durableId", (q) => q.eq("ownerUserId", ownerUserId).eq("durableId", args.id)).unique();
    if (!existing) throw new Error("Client not found.");
    await ctx.db.patch("relayClients", existing._id, { archived: args.archived });
    return null;
  },
});
