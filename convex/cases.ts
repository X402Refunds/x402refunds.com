import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
// Types are validated by Convex schema

export const fileDispute = mutation({
  args: {
    parties: v.array(v.string()),
    type: v.string(),
    jurisdictionTags: v.array(v.string()),
    evidenceIds: v.array(v.id("evidenceManifests")),
    description: v.optional(v.string()),
    claimedDamages: v.optional(v.number()),
    breachDetails: v.optional(v.object({
      duration: v.optional(v.string()),
      impactLevel: v.optional(v.string()),
      affectedUsers: v.optional(v.number()),
      slaRequirement: v.optional(v.string()),
      actualPerformance: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // Validate parties are different agents
    if (args.parties.length < 2) {
      throw new Error("At least 2 parties required for a dispute");
    }

    if (new Set(args.parties).size !== args.parties.length) {
      throw new Error("All parties must be unique");
    }

    // Verify all parties are active agents
    for (const partyDid of args.parties) {
      const agent = await ctx.db
        .query("agents")
        .withIndex("by_did", (q) => q.eq("did", partyDid))
        .first();

      if (!agent || agent.status !== "active") {
        throw new Error(`Agent ${partyDid} not found or not active`);
      }
    }

    // Verify evidence exists
    for (const evidenceId of args.evidenceIds) {
      const evidence = await ctx.db.get(evidenceId);
      if (!evidence) {
        throw new Error(`Evidence ${evidenceId} not found`);
      }
    }

    const now = Date.now();
    const panelDue = now + 7 * 24 * 60 * 60 * 1000; // 7 days

    const caseData = {
      parties: args.parties,
      status: "FILED" as const,
      type: args.type,
      filedAt: now,
      jurisdictionTags: args.jurisdictionTags,
      evidenceIds: args.evidenceIds,
      deadlines: {
        panelDue,
      },
      description: args.description,
      claimedDamages: args.claimedDamages,
      breachDetails: args.breachDetails,
    };

    const caseId = await ctx.db.insert("cases", caseData);

    // Update evidence manifests to link to case
    for (const evidenceId of args.evidenceIds) {
      await ctx.db.patch(evidenceId, { caseId });
    }

    // Log event
    await ctx.db.insert("events", {
      type: "DISPUTE_FILED",
      payload: {
        caseId,
        parties: args.parties,
        type: args.type,
        evidenceCount: args.evidenceIds.length,
        jurisdictionTags: args.jurisdictionTags,
      },
      timestamp: now,
      caseId,
    });

    return caseId;
  },
});

export const getCase = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const case_ = await ctx.db.get(args.caseId);
    if (!case_) return null;

    // Get associated evidence
    const evidence = await ctx.db
      .query("evidenceManifests")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();

    // Get ruling if exists
    const ruling = await ctx.db
      .query("rulings")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .first();

    // Get panel if exists
    let panel = null;
    if (case_.panelId) {
      panel = await ctx.db.get(case_.panelId);
    }

    return {
      ...case_,
      evidence,
      ruling,
      panel,
    };
  },
});

// Alias for clarity in frontend
export const getCaseById = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.caseId);
  },
});

export const getCasesByStatus = query({
  args: { 
    status: v.union(
      v.literal("FILED"),
      v.literal("AUTORULED"),
      v.literal("PANELED"),
      v.literal("DECIDED"),
      v.literal("CLOSED")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cases")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const getCasesByParty = query({
  args: { agentDid: v.string() },
  handler: async (ctx, args) => {
    // Since parties is an array, we need to filter manually
    const allCases = await ctx.db.query("cases").collect();
    return allCases.filter(case_ => case_.parties.includes(args.agentDid));
  },
});

export const getRecentCases = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cases")
      .withIndex("by_filed_at")
      .order("desc")
      .take(args.limit ?? 20);
  },
});

export const updateCaseStatus = mutation({
  args: {
    caseId: v.id("cases"),
    status: v.union(
      v.literal("FILED"),
      v.literal("AUTORULED"),
      v.literal("PANELED"),
      v.literal("DECIDED"),
      v.literal("CLOSED")
    ),
    panelId: v.optional(v.id("panels")),
  },
  handler: async (ctx, args) => {
    const case_ = await ctx.db.get(args.caseId);
    if (!case_) {
      throw new Error("Case not found");
    }

    const updates: any = { status: args.status };
    if (args.panelId) {
      updates.panelId = args.panelId;
    }

    await ctx.db.patch(args.caseId, updates);

    // Log event
    await ctx.db.insert("events", {
      type: "CASE_STATUS_UPDATED",
      payload: {
        caseId: args.caseId,
        oldStatus: case_.status,
        newStatus: args.status,
        panelId: args.panelId,
      },
      timestamp: Date.now(),
      caseId: args.caseId,
    });

    return args.caseId;
  },
});

// Update case ruling - for autoRule integration
export const updateCaseRuling = mutation({
  args: {
    caseId: v.id("cases"),
    ruling: v.object({
      verdict: v.string(),
      auto: v.boolean(),
      decidedAt: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.caseId, {
      ruling: args.ruling,
    });
    console.info(`Case ${args.caseId} ruling updated`);
  },
});
