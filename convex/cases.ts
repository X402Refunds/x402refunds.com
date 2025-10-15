import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { createCustodyEvent } from "./custody";

export const fileDispute = mutation({
  args: {
    plaintiff: v.string(),  // Agent DID filing the dispute
    defendant: v.string(),  // Agent DID being sued
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
      rootCause: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // Validate plaintiff and defendant are different
    if (args.plaintiff === args.defendant) {
      throw new Error("Plaintiff and defendant must be different agents");
    }

    // Verify both parties are active agents
    const plaintiff = await ctx.db
      .query("agents")
      .withIndex("by_did", (q) => q.eq("did", args.plaintiff))
      .first();

    const defendant = await ctx.db
      .query("agents")
      .withIndex("by_did", (q) => q.eq("did", args.defendant))
      .first();

    if (!plaintiff || plaintiff.status !== "active") {
      throw new Error(`Plaintiff ${args.plaintiff} not found or not active`);
    }

    if (!defendant || defendant.status !== "active") {
      throw new Error(`Defendant ${args.defendant} not found or not active`);
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
      plaintiff: args.plaintiff,
      defendant: args.defendant,
      parties: [args.plaintiff, args.defendant], // For backward compatibility
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

    // Log custody event
    await createCustodyEvent(ctx, {
      type: "DISPUTE_FILED",
      caseId,
      agentDid: args.plaintiff,
      payload: {
        plaintiff: args.plaintiff,
        defendant: args.defendant,
        type: args.type,
        evidenceCount: args.evidenceIds.length,
        claimedDamages: args.claimedDamages,
      },
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

export const getCasesByPlaintiff = query({
  args: { 
    plaintiffDid: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const allCases = await ctx.db
      .query("cases")
      .order("desc")
      .collect();
    
    return allCases
      .filter((c) => c.plaintiff === args.plaintiffDid)
      .slice(0, args.limit ?? 50);
  },
});

export const getCasesByDefendant = query({
  args: { 
    defendantDid: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const allCases = await ctx.db
      .query("cases")
      .order("desc")
      .collect();
    
    return allCases
      .filter((c) => c.defendant === args.defendantDid)
      .slice(0, args.limit ?? 50);
  },
});

export const getRecentCases = query({
  args: { 
    limit: v.optional(v.number()),
    mockOnly: v.optional(v.boolean()), // Filter for demo data only
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("cases")
      .withIndex("by_filed_at")
      .order("desc");
    
    // Filter for mock/demo data if requested
    if (args.mockOnly === true) {
      query = query.filter((q) => q.eq(q.field("mock"), true));
    }
    
    return await query.take(args.limit ?? 20);
  },
});

export const getOrganizationCases = query({
  args: { 
    organizationId: v.id("organizations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get all agents in the organization
    const orgAgents = await ctx.db
      .query("agents")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    
    const agentDids = orgAgents.map(a => a.did);
    
    // Get cases where any org agent is plaintiff or defendant
    const cases = await ctx.db
      .query("cases")
      .withIndex("by_filed_at")
      .order("desc")
      .take(args.limit ?? 10);
    
    // Filter to only cases involving org agents
    return cases.filter(c => 
      (c.plaintiff && agentDids.includes(c.plaintiff)) || 
      (c.defendant && agentDids.includes(c.defendant))
    );
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

    // Log custody event
    await createCustodyEvent(ctx, {
      type: "CASE_STATUS_UPDATED",
      caseId: args.caseId,
      agentDid: undefined, // system action
      payload: {
        oldStatus: case_.status,
        newStatus: args.status,
        panelId: args.panelId,
      },
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
      winner: v.optional(v.string()),  // Agent DID of winner
      auto: v.boolean(),
      decidedAt: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const case_ = await ctx.db.get(args.caseId);
    if (!case_) {
      throw new Error("Case not found");
    }

    await ctx.db.patch(args.caseId, {
      ruling: args.ruling,
    });

    // Update reputation for both parties if we have a winner
    if (args.ruling.winner && case_.plaintiff && case_.defendant) {
      const isSLAViolation = case_.type.toLowerCase().includes("sla") || 
                             case_.breachDetails !== undefined;

      // Update plaintiff reputation
      await ctx.scheduler.runAfter(0, api.agents.updateAgentReputation, {
        agentDid: case_.plaintiff,
        role: "plaintiff",
        outcome: args.ruling.winner === case_.plaintiff ? "won" : "lost",
        slaViolation: isSLAViolation && args.ruling.winner === case_.plaintiff,
      });

      // Update defendant reputation  
      await ctx.scheduler.runAfter(0, api.agents.updateAgentReputation, {
        agentDid: case_.defendant,
        role: "defendant",
        outcome: args.ruling.winner === case_.defendant ? "won" : "lost",
        slaViolation: isSLAViolation && args.ruling.winner !== case_.defendant,
      });
    }

    // Log custody event
    await createCustodyEvent(ctx, {
      type: "CASE_DECIDED",
      caseId: args.caseId,
      agentDid: undefined, // system action
      payload: {
        verdict: args.ruling.verdict,
        auto: args.ruling.auto,
        winner: args.ruling.winner,
      },
    });

    console.info(`Case ${args.caseId} ruling updated, reputation updates scheduled`);
  },
});

// Get cached system statistics (fast query - no expensive calculations)
export const getCachedSystemStats = query({
  args: {},
  handler: async (ctx) => {
    // Read from cache table - this is instant!
    const cachedStats = await ctx.db
      .query("systemStats")
      .withIndex("by_key", (q) => q.eq("key", "current"))
      .first();
    
    if (!cachedStats) {
      // Return default values if cache not yet populated
      return {
        totalAgents: 0,
        activeAgents: 0,
        totalCases: 0,
        resolvedCases: 0,
        pendingCases: 0,
        avgResolutionTimeMs: 0,
        avgResolutionTimeMinutes: 0,
        agentRegistrationsLast24h: 0,
        casesFiledLast24h: 0,
        casesResolvedLast24h: 0,
        lastUpdated: Date.now(),
        isCached: false,
      };
    }
    
    return {
      ...cachedStats,
      isCached: true,
    };
  },
});
