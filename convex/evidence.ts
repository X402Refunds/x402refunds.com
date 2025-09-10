import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
// Types are validated by Convex schema

export const submitEvidence = mutation({
  args: {
    agentDid: v.string(),
    sha256: v.string(),
    uri: v.string(),
    signer: v.string(),
    model: v.object({
      provider: v.string(),
      name: v.string(),
      version: v.string(),
      seed: v.optional(v.number()),
      temp: v.optional(v.number()),
    }),
    tool: v.optional(v.string()),
    caseId: v.optional(v.id("cases")),
  },
  handler: async (ctx, args) => {
    // Create the evidence manifest
    const manifest = {
      ...args,
      ts: Date.now(),
    };

    // Check if agent exists and is active
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_did", (q) => q.eq("did", args.agentDid))
      .first();

    if (!agent || agent.status !== "active") {
      throw new Error("Agent not found or not active");
    }

    // Check for duplicate evidence
    const existing = await ctx.db
      .query("evidenceManifests")
      .withIndex("by_sha256", (q) => q.eq("sha256", args.sha256))
      .first();

    if (existing) {
      throw new Error("Evidence with this hash already exists");
    }

    // Insert evidence manifest
    const evidenceId = await ctx.db.insert("evidenceManifests", manifest);

    // Log event
    await ctx.db.insert("events", {
      type: "EVIDENCE_SUBMITTED",
      payload: {
        evidenceId,
        agentDid: args.agentDid,
        sha256: args.sha256,
        caseId: args.caseId,
      },
      ts: Date.now(),
    });

    return evidenceId;
  },
});

export const getEvidence = query({
  args: { evidenceId: v.id("evidenceManifests") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.evidenceId);
  },
});

export const getEvidenceByCase = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("evidenceManifests")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();
  },
});

export const getEvidenceByAgent = query({
  args: { agentDid: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("evidenceManifests")
      .withIndex("by_agent", (q) => q.eq("agentDid", args.agentDid))
      .collect();
  },
});

export const getRecentEvidence = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("evidenceManifests")
      .withIndex("by_timestamp")
      .order("desc")
      .take(args.limit ?? 50);
  },
});
