import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Delete all non-payment dispute cases
 * USE WITH CAUTION - This permanently deletes data
 */
export const deleteNonPaymentDisputes = mutation({
  args: {},
  handler: async (ctx) => {
    const cases = await ctx.db.query("cases").collect();
    let deleted = 0;

    for (const caseDoc of cases) {
      if (caseDoc.type !== "PAYMENT") {
        await ctx.db.delete(caseDoc._id);
        deleted++;
        console.log(`Deleted ${caseDoc.type} case: ${caseDoc._id}`);
      }
    }

    console.log(`✅ Total deleted: ${deleted} non-payment cases`);
    return { deleted, message: `Deleted ${deleted} non-payment dispute cases` };
  },
});

/**
 * Analyze database tables and return counts
 * Helps identify junk data
 */
export const analyzeDatabase = query({
  args: {},
  handler: async (ctx) => {
    const tables = [
      "agents",
      "cases",
      "evidenceManifests",
      "rulings",
      "events",
      "agentReputation",
      "sponsorships",
      "systemStats",
      "feedbackSignals",
      "workflowSteps",
      "organizations",
      "users",
    ];

    const analysis: Record<string, any> = {};

    for (const tableName of tables) {
      try {
        const allRecords = await ctx.db.query(tableName as any).collect();
        const count = allRecords.length;

        // Additional analysis per table
        let details: any = { count };

        if (tableName === "agents") {
          const byStatus: Record<string, number> = {};
          const mockCount = allRecords.filter((r: any) => r.mock === true).length;
          
          for (const agent of allRecords) {
            const status = (agent as any).status || "unknown";
            byStatus[status] = (byStatus[status] || 0) + 1;
          }
          
          details = {
            ...details,
            byStatus,
            mockCount,
            agents: allRecords.map((a: any) => ({
              _id: a._id,
              did: a.did,
              name: a.name,
              status: a.status,
              mock: a.mock,
              createdAt: a.createdAt,
            })),
          };
        } else if (tableName === "cases") {
          const byType: Record<string, number> = {};
          const byStatus: Record<string, number> = {};
          const mockCount = allRecords.filter((r: any) => r.mock === true).length;
          
          for (const caseDoc of allRecords) {
            const type = (caseDoc as any).type || "unknown";
            const status = (caseDoc as any).status || "unknown";
            byType[type] = (byType[type] || 0) + 1;
            byStatus[status] = (byStatus[status] || 0) + 1;
          }
          
          details = {
            ...details,
            byType,
            byStatus,
            mockCount,
          };
        } else if (tableName === "events") {
          const byType: Record<string, number> = {};
          for (const event of allRecords) {
            const type = (event as any).type || "unknown";
            byType[type] = (byType[type] || 0) + 1;
          }
          details = { ...details, byType };
        } else if (tableName === "evidenceManifests") {
          const archivedCount = allRecords.filter((r: any) => r.archived === true).length;
          const redactedCount = allRecords.filter((r: any) => r.redacted === true).length;
          details = { ...details, archivedCount, redactedCount };
        }

        analysis[tableName] = details;
      } catch (error) {
        analysis[tableName] = {
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    return analysis;
  },
});

/**
 * Delete all agents except one specified agent
 * USE WITH CAUTION - This permanently deletes data
 */
export const deleteAllAgentsExceptOne = mutation({
  args: {
    keepAgentId: v.id("agents"), // The agent ID to keep
  },
  handler: async (ctx, args) => {
    const allAgents = await ctx.db.query("agents").collect();
    const keepAgent = await ctx.db.get(args.keepAgentId);
    
    if (!keepAgent) {
      throw new Error(`Agent ${args.keepAgentId} not found`);
    }

    let deleted = 0;
    const deletedAgentIds: string[] = [];
    const deletedAgentDids: string[] = [];

    for (const agent of allAgents) {
      if (agent._id !== args.keepAgentId) {
        deletedAgentIds.push(agent._id);
        deletedAgentDids.push(agent.did);
        await ctx.db.delete(agent._id);
        deleted++;
      }
    }

    // Clean up related data
    let relatedDeleted = 0;

    // Delete agent reputation records for deleted agents
    const allReputations = await ctx.db.query("agentReputation").collect();
    for (const rep of allReputations) {
      if (deletedAgentDids.includes(rep.agentDid)) {
        await ctx.db.delete(rep._id);
        relatedDeleted++;
      }
    }

    // Delete cases where deleted agents are plaintiff or defendant
    const allCases = await ctx.db.query("cases").collect();
    for (const caseDoc of allCases) {
      const plaintiff = caseDoc.plaintiff || "";
      const defendant = caseDoc.defendant || "";
      
      if (
        deletedAgentDids.some(did => plaintiff.includes(did) || defendant.includes(did)) ||
        deletedAgentDids.some(did => plaintiff === did || defendant === did)
      ) {
        // Delete evidence manifests for this case
        for (const evidenceId of caseDoc.evidenceIds || []) {
          try {
            await ctx.db.delete(evidenceId);
            relatedDeleted++;
          } catch (e) {
            // Evidence might already be deleted
          }
        }
        
        // Delete rulings for this case
        const rulings = await ctx.db
          .query("rulings")
          .withIndex("by_case", (q) => q.eq("caseId", caseDoc._id))
          .collect();
        for (const ruling of rulings) {
          await ctx.db.delete(ruling._id);
          relatedDeleted++;
        }

        // Delete workflow steps for this case
        const workflowSteps = await ctx.db
          .query("workflowSteps")
          .withIndex("by_case", (q) => q.eq("caseId", caseDoc._id))
          .collect();
        for (const step of workflowSteps) {
          await ctx.db.delete(step._id);
          relatedDeleted++;
        }

        // Delete feedback signals for this case
        const feedbackSignals = await ctx.db
          .query("feedbackSignals")
          .withIndex("by_case", (q) => q.eq("caseId", caseDoc._id))
          .collect();
        for (const signal of feedbackSignals) {
          await ctx.db.delete(signal._id);
          relatedDeleted++;
        }

        // Delete events for this case
        const events = await ctx.db
          .query("events")
          .filter((q) => q.eq(q.field("caseId"), caseDoc._id))
          .collect();
        for (const event of events) {
          await ctx.db.delete(event._id);
          relatedDeleted++;
        }

        // Finally delete the case
        await ctx.db.delete(caseDoc._id);
        relatedDeleted++;
      }
    }

    // Delete evidence manifests for deleted agents
    const allEvidence = await ctx.db.query("evidenceManifests").collect();
    for (const evidence of allEvidence) {
      if (deletedAgentDids.includes(evidence.agentDid)) {
        await ctx.db.delete(evidence._id);
        relatedDeleted++;
      }
    }

    // Delete events for deleted agents
    const allEvents = await ctx.db.query("events").collect();
    for (const event of allEvents) {
      if (event.agentDid && deletedAgentDids.includes(event.agentDid)) {
        await ctx.db.delete(event._id);
        relatedDeleted++;
      }
    }

    // Delete sponsorships involving deleted agents
    const allSponsorships = await ctx.db.query("sponsorships").collect();
    for (const sponsorship of allSponsorships) {
      if (
        deletedAgentDids.includes(sponsorship.sponsorDid) ||
        deletedAgentDids.includes(sponsorship.sponsoredDid)
      ) {
        await ctx.db.delete(sponsorship._id);
        relatedDeleted++;
      }
    }

    console.log(`✅ Deleted ${deleted} agents (kept: ${keepAgent.did})`);
    console.log(`✅ Deleted ${relatedDeleted} related records`);

    return {
      deletedAgents: deleted,
      keptAgent: {
        _id: keepAgent._id,
        did: keepAgent.did,
        name: keepAgent.name,
      },
      deletedRelatedRecords: relatedDeleted,
      message: `Deleted ${deleted} agents and ${relatedDeleted} related records. Kept agent: ${keepAgent.did}`,
    };
  },
});

/**
 * Delete all mock/test data
 * USE WITH CAUTION - This permanently deletes data
 */
export const deleteMockData = mutation({
  args: {},
  handler: async (ctx) => {
    let deleted = 0;

    // Delete mock agents
    const mockAgents = await ctx.db
      .query("agents")
      .filter((q) => q.eq(q.field("mock"), true))
      .collect();
    
    for (const agent of mockAgents) {
      await ctx.db.delete(agent._id);
      deleted++;
    }

    // Delete mock cases
    const mockCases = await ctx.db
      .query("cases")
      .filter((q) => q.eq(q.field("mock"), true))
      .collect();
    
    for (const caseDoc of mockCases) {
      // Delete related evidence
      for (const evidenceId of caseDoc.evidenceIds || []) {
        try {
          await ctx.db.delete(evidenceId);
        } catch (e) {
          // Evidence might already be deleted
        }
      }
      
      // Delete related rulings
      const rulings = await ctx.db
        .query("rulings")
        .withIndex("by_case", (q) => q.eq("caseId", caseDoc._id))
        .collect();
      for (const ruling of rulings) {
        await ctx.db.delete(ruling._id);
      }

      // Delete workflow steps
      const workflowSteps = await ctx.db
        .query("workflowSteps")
        .withIndex("by_case", (q) => q.eq("caseId", caseDoc._id))
        .collect();
      for (const step of workflowSteps) {
        await ctx.db.delete(step._id);
      }

      // Delete feedback signals
      const feedbackSignals = await ctx.db
        .query("feedbackSignals")
        .withIndex("by_case", (q) => q.eq("caseId", caseDoc._id))
        .collect();
      for (const signal of feedbackSignals) {
        await ctx.db.delete(signal._id);
      }

      // Delete events
      const events = await ctx.db
        .query("events")
        .filter((q) => q.eq(q.field("caseId"), caseDoc._id))
        .collect();
      for (const event of events) {
        await ctx.db.delete(event._id);
      }

      await ctx.db.delete(caseDoc._id);
      deleted++;
    }

    console.log(`✅ Deleted ${deleted} mock records`);
    return {
      deleted,
      message: `Deleted ${deleted} mock records (agents and cases with related data)`,
    };
  },
});

/**
 * Delete cases with absurdly large amounts (likely test/invalid data)
 * USE WITH CAUTION - This permanently deletes data
 */
export const deleteLargeAmountCases = mutation({
  args: {
    maxAmountUSD: v.optional(v.number()), // Default: 1,000,000
    maxAmountETH: v.optional(v.number()), // Default: 1000
  },
  handler: async (ctx, args) => {
    const maxUSD = args.maxAmountUSD ?? 1_000_000;
    const maxETH = args.maxAmountETH ?? 1000;

    const allCases = await ctx.db.query("cases").collect();
    let deleted = 0;
    const deletedCases: Array<{ id: string; amount: number; currency: string }> = [];

    for (const caseDoc of allCases) {
      if (!caseDoc.amount) continue;

      const amount = caseDoc.amount;
      const currency = caseDoc.currency || "USD";

      // Check for absurdly large amounts
      const shouldDelete = 
        (currency === "USD" && amount > maxUSD) ||
        (currency === "ETH" && amount > maxETH);

      if (shouldDelete) {
        deletedCases.push({
          id: caseDoc._id,
          amount: amount,
          currency: currency,
        });

        // Delete related evidence
        for (const evidenceId of caseDoc.evidenceIds || []) {
          try {
            await ctx.db.delete(evidenceId);
          } catch (e) {
            // Evidence might already be deleted
          }
        }

        // Delete related rulings
        const rulings = await ctx.db
          .query("rulings")
          .withIndex("by_case", (q) => q.eq("caseId", caseDoc._id))
          .collect();
        for (const ruling of rulings) {
          await ctx.db.delete(ruling._id);
        }

        // Delete workflow steps
        const workflowSteps = await ctx.db
          .query("workflowSteps")
          .withIndex("by_case", (q) => q.eq("caseId", caseDoc._id))
          .collect();
        for (const step of workflowSteps) {
          await ctx.db.delete(step._id);
        }

        // Delete feedback signals
        const feedbackSignals = await ctx.db
          .query("feedbackSignals")
          .withIndex("by_case", (q) => q.eq("caseId", caseDoc._id))
          .collect();
        for (const signal of feedbackSignals) {
          await ctx.db.delete(signal._id);
        }

        // Delete events
        const events = await ctx.db
          .query("events")
          .filter((q) => q.eq(q.field("caseId"), caseDoc._id))
          .collect();
        for (const event of events) {
          await ctx.db.delete(event._id);
        }

        // Finally delete the case
        await ctx.db.delete(caseDoc._id);
        deleted++;

        console.log(`Deleted case ${caseDoc._id} with amount ${amount} ${currency}`);
      }
    }

    console.log(`✅ Deleted ${deleted} cases with large amounts`);
    return {
      deleted,
      deletedCases,
      message: `Deleted ${deleted} cases with amounts > $${maxUSD} USD or > ${maxETH} ETH`,
    };
  },
});

/**
 * Delete cases with zero or missing amounts in IN_REVIEW status
 * USE WITH CAUTION - This permanently deletes data
 */
export const deleteZeroAmountCases = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all IN_REVIEW cases
    const inReviewCases = await ctx.db
      .query("cases")
      .filter(q => q.eq(q.field("status"), "IN_REVIEW"))
      .collect();

    let deleted = 0;
    const deletedCases: Array<{ id: string; amount: number; currency: string }> = [];

    for (const caseDoc of inReviewCases) {
      // Check if amount is zero, null, or undefined
      if (!caseDoc.amount || caseDoc.amount === 0) {
        deletedCases.push({
          id: caseDoc._id,
          amount: caseDoc.amount || 0,
          currency: caseDoc.currency || "USD",
        });

        // Delete related evidence
        for (const evidenceId of caseDoc.evidenceIds || []) {
          try {
            await ctx.db.delete(evidenceId);
          } catch (e) {
            // Evidence might already be deleted
          }
        }

        // Delete related rulings
        const rulings = await ctx.db
          .query("rulings")
          .withIndex("by_case", (q) => q.eq("caseId", caseDoc._id))
          .collect();
        for (const ruling of rulings) {
          await ctx.db.delete(ruling._id);
        }

        // Delete workflow steps
        const workflowSteps = await ctx.db
          .query("workflowSteps")
          .withIndex("by_case", (q) => q.eq("caseId", caseDoc._id))
          .collect();
        for (const step of workflowSteps) {
          await ctx.db.delete(step._id);
        }

        // Delete feedback signals
        const feedbackSignals = await ctx.db
          .query("feedbackSignals")
          .withIndex("by_case", (q) => q.eq("caseId", caseDoc._id))
          .collect();
        for (const signal of feedbackSignals) {
          await ctx.db.delete(signal._id);
        }

        // Delete events
        const events = await ctx.db
          .query("events")
          .filter((q) => q.eq(q.field("caseId"), caseDoc._id))
          .collect();
        for (const event of events) {
          await ctx.db.delete(event._id);
        }

        // Finally delete the case
        await ctx.db.delete(caseDoc._id);
        deleted++;

        console.log(`Deleted zero-amount case ${caseDoc._id}`);
      }
    }

    console.log(`✅ Deleted ${deleted} zero-amount IN_REVIEW cases`);
    return {
      deleted,
      deletedCases,
      message: `Deleted ${deleted} zero-amount IN_REVIEW cases`,
    };
  },
});

/**
 * Clean up empty or orphaned records
 * USE WITH CAUTION - This permanently deletes data
 */
export const cleanupOrphanedRecords = mutation({
  args: {},
  handler: async (ctx) => {
    let deleted = 0;

    // Delete evidence manifests without a case
    const allEvidence = await ctx.db.query("evidenceManifests").collect();
    for (const evidence of allEvidence) {
      if (!evidence.caseId) {
        await ctx.db.delete(evidence._id);
        deleted++;
      } else {
        // Check if case still exists
        try {
          const caseDoc = await ctx.db.get(evidence.caseId);
          if (!caseDoc) {
            await ctx.db.delete(evidence._id);
            deleted++;
          }
        } catch (e) {
          // Case doesn't exist, delete evidence
          await ctx.db.delete(evidence._id);
          deleted++;
        }
      }
    }

    // Delete rulings without a case
    const allRulings = await ctx.db.query("rulings").collect();
    for (const ruling of allRulings) {
      try {
        const caseDoc = await ctx.db.get(ruling.caseId);
        if (!caseDoc) {
          await ctx.db.delete(ruling._id);
          deleted++;
        }
      } catch (e) {
        await ctx.db.delete(ruling._id);
        deleted++;
      }
    }

    // Delete workflow steps without a case
    const allWorkflowSteps = await ctx.db.query("workflowSteps").collect();
    for (const step of allWorkflowSteps) {
      try {
        const caseDoc = await ctx.db.get(step.caseId);
        if (!caseDoc) {
          await ctx.db.delete(step._id);
          deleted++;
        }
      } catch (e) {
        await ctx.db.delete(step._id);
        deleted++;
      }
    }

    // Delete feedback signals without a case
    const allFeedbackSignals = await ctx.db.query("feedbackSignals").collect();
    for (const signal of allFeedbackSignals) {
      try {
        const caseDoc = await ctx.db.get(signal.caseId);
        if (!caseDoc) {
          await ctx.db.delete(signal._id);
          deleted++;
        }
      } catch (e) {
        await ctx.db.delete(signal._id);
        deleted++;
      }
    }

    // Delete agent reputation for non-existent agents
    const allReputations = await ctx.db.query("agentReputation").collect();
    const allAgents = await ctx.db.query("agents").collect();
    const agentDids = new Set(allAgents.map(a => a.did));
    
    for (const rep of allReputations) {
      if (!agentDids.has(rep.agentDid)) {
        await ctx.db.delete(rep._id);
        deleted++;
      }
    }

    console.log(`✅ Deleted ${deleted} orphaned records`);
    return {
      deleted,
      message: `Deleted ${deleted} orphaned records`,
    };
  },
});
