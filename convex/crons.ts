import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// =================================================================
// LLM-POWERED DISPUTE GENERATION SYSTEM
// =================================================================

// Generate LLM-powered mock disputes every 5 minutes
crons.interval(
  "llm dispute generation",
  { minutes: 5 },
  internal.crons.generateLLMDispute,
  {} // empty args
);

// System health monitoring every 15 minutes
crons.interval(
  "system health check",
  { minutes: 15 },
  internal.crons.systemHealthMonitor,
  {} // empty args
);

// Process pending cases every 10 minutes
crons.interval(
  "process cases",
  { minutes: 10 },
  internal.crons.processPendingCases,
  {} // empty args
);

export default crons;

// =================================================================
// CRON JOB IMPLEMENTATIONS
// =================================================================

import { internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";

// Generate SHA256 hash utility
function generateSHA256(): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// AI vendor and consumer configurations
const AI_VENDORS = [
  {
    did: "did:agent:stripe-payment-api",
    ownerDid: "did:enterprise:stripe",
    functionalType: "financial"
  },
  {
    did: "did:agent:openai-gpt4-api", 
    ownerDid: "did:enterprise:openai",
    functionalType: "api"
  },
  {
    did: "did:agent:anthropic-claude-api",
    ownerDid: "did:enterprise:anthropic", 
    functionalType: "api"
  },
  {
    did: "did:agent:aws-lambda-api",
    ownerDid: "did:enterprise:amazon",
    functionalType: "api"
  }
];

const AI_CONSUMERS = [
  {
    did: "did:agent:netflix-recommendation-engine",
    ownerDid: "did:enterprise:netflix",
    functionalType: "api"
  },
  {
    did: "did:agent:uber-dispatch-system", 
    ownerDid: "did:enterprise:uber",
    functionalType: "api"
  },
  {
    did: "did:agent:discord-moderation-ai",
    ownerDid: "did:enterprise:discord",
    functionalType: "api"
  }
];

// Generate LLM-powered dispute
export const generateLLMDispute = internalAction({
  args: {},
  handler: async (ctx) => {
    try {
      console.log("🧠 Starting LLM dispute generation...");

      // Import LLM engine function dynamically
      const { generateCostOptimizedDispute } = await import("./llmEngine");
      
      // Generate dispute scenario using LLM
      const disputeScenario = await generateCostOptimizedDispute();
      
      if (!disputeScenario) {
        console.log("⚠️ LLM dispute generation returned null - using fallback");
        return await ctx.runMutation(internal.crons.generateFallbackDispute, {});
      }

      console.log(`✅ LLM generated dispute: ${disputeScenario.type}`);
      
      // Create the dispute using LLM data
      return await ctx.runMutation(internal.crons.createLLMDispute, {
        scenario: disputeScenario
      });
      
    } catch (error: any) {
      console.error("❌ LLM dispute generation failed:", error.message);
      
      // Fallback to rule-based generation
      return await ctx.runMutation(internal.crons.generateFallbackDispute, {});
    }
  }
});

// Create LLM-generated dispute 
export const createLLMDispute = internalMutation({
  args: {
    scenario: v.object({
      type: v.string(),
      description: v.string(),
      typicalDamages: v.object({
        min: v.number(),
        max: v.number()
      }),
      llmGenerated: v.boolean(),
      llmData: v.any()
    })
  },
  handler: async (ctx, args) => {
    try {
      // Select random vendor and consumer
      const vendor = AI_VENDORS[Math.floor(Math.random() * AI_VENDORS.length)];
      const consumer = AI_CONSUMERS[Math.floor(Math.random() * AI_CONSUMERS.length)];
      
      // Verify agents exist
      const vendorAgent = await ctx.db
        .query("agents")
        .withIndex("by_did", (q) => q.eq("did", vendor.did))
        .first();
        
      const consumerAgent = await ctx.db
        .query("agents")
        .withIndex("by_did", (q) => q.eq("did", consumer.did))
        .first();
        
      if (!vendorAgent || !consumerAgent) {
        console.log("⚠️ Required agents not found - skipping dispute");
        return { success: false, reason: "Agents not found" };
      }

      const now = Date.now();
      
      // Create evidence manifests using LLM data
      const providerEvidence = await ctx.db.insert("evidenceManifests", {
        agentDid: vendor.did,
        sha256: generateSHA256(),
        uri: `https://evidence.${vendor.ownerDid.split(':')[2]}.com/llm-incident-${now}.json`,
        signer: vendor.did,
        ts: now,
        model: {
          provider: "openrouter_llm",
          name: "claude-3.5-sonnet",
          version: "anthropic/claude-3.5-sonnet"
        },
        tool: "llm_generated_evidence"
      });
      
      const consumerEvidence = await ctx.db.insert("evidenceManifests", {
        agentDid: consumer.did,
        sha256: generateSHA256(),
        uri: `https://damages.${consumer.ownerDid.split(':')[2]}.com/llm-impact-${now}.json`,
        signer: consumer.did,
        ts: now,
        model: {
          provider: "openrouter_llm", 
          name: "claude-3.5-sonnet",
          version: "anthropic/claude-3.5-sonnet"
        },
        tool: "llm_generated_damages"
      });

      // File the dispute
      const panelDue = now + 7 * 24 * 60 * 60 * 1000; // 7 days
      
      const caseId = await ctx.db.insert("cases", {
        parties: [vendor.did, consumer.did],
        status: "FILED" as const,
        type: args.scenario.type,
        filedAt: now,
        jurisdictionTags: ["AI_VENDOR_DISPUTE", "LLM_GENERATED", "COMMERCIAL_SLA"],
        evidenceIds: [providerEvidence, consumerEvidence],
        deadlines: { panelDue }
      });

      // Update evidence with case ID
      await ctx.db.patch(providerEvidence, { caseId });
      await ctx.db.patch(consumerEvidence, { caseId });

      // Log evidence submission events
      await ctx.db.insert("events", {
        type: "EVIDENCE_SUBMITTED",
        payload: {
          agentDid: vendor.did,
          evidenceId: providerEvidence,
          caseId: caseId,
          evidenceType: "provider_incident_report",
          llmGenerated: true
        },
        timestamp: now,
        caseId: caseId,
        agentDid: vendor.did
      });

      await ctx.db.insert("events", {
        type: "EVIDENCE_SUBMITTED", 
        payload: {
          agentDid: consumer.did,
          evidenceId: consumerEvidence,
          caseId: caseId,
          evidenceType: "consumer_damage_report",
          llmGenerated: true
        },
        timestamp: now + 1, // Slightly offset timestamp
        caseId: caseId,
        agentDid: consumer.did
      });

      // Log event
      await ctx.db.insert("events", {
        type: "DISPUTE_FILED",
        payload: {
          caseId,
          parties: [vendor.did, consumer.did],
          type: args.scenario.type,
          evidenceCount: 2,
          jurisdictionTags: ["AI_VENDOR_DISPUTE", "LLM_GENERATED"],
          llmGenerated: true,
          llmData: args.scenario.llmData
        },
        timestamp: now + 2,
        caseId,
      });

      console.log(`✅ LLM dispute filed: ${args.scenario.type} (${vendor.ownerDid.split(':')[2]} vs ${consumer.ownerDid.split(':')[2]})`);
      console.log(`   Case ID: ${caseId}`);
      console.log(`   Damages: $${args.scenario.typicalDamages.min.toLocaleString()}-$${args.scenario.typicalDamages.max.toLocaleString()}`);
      
      return { 
        success: true, 
        caseId,
        disputeType: args.scenario.type,
        parties: [vendor.did, consumer.did],
        llmGenerated: true
      };
      
    } catch (error: any) {
      console.error("❌ Failed to create LLM dispute:", error.message);
      return { success: false, reason: error.message };
    }
  }
});

// Fallback dispute generation (rule-based)
export const generateFallbackDispute = internalMutation({
  args: {},
  handler: async (ctx) => {
    try {
      console.log("🔄 Using fallback rule-based dispute generation...");
      
      const disputeTypes = ["API_DOWNTIME", "RESPONSE_LATENCY", "DATA_ACCURACY", "PROCESSING_VOLUME"];
      const randomType = disputeTypes[Math.floor(Math.random() * disputeTypes.length)];
      
      // Select random vendor and consumer
      const vendor = AI_VENDORS[Math.floor(Math.random() * AI_VENDORS.length)];
      const consumer = AI_CONSUMERS[Math.floor(Math.random() * AI_CONSUMERS.length)];
      
      const now = Date.now();
      
      // Create simple evidence manifests
      const providerEvidence = await ctx.db.insert("evidenceManifests", {
        agentDid: vendor.did,
        sha256: generateSHA256(),
        uri: `https://evidence.${vendor.ownerDid.split(':')[2]}.com/fallback-${now}.json`,
        signer: vendor.did,
        ts: now,
        model: {
          provider: "system_fallback",
          name: "rule_based_generator",
          version: "1.0.0"
        },
        tool: "fallback_evidence_generator"
      });
      
      const consumerEvidence = await ctx.db.insert("evidenceManifests", {
        agentDid: consumer.did,
        sha256: generateSHA256(),
        uri: `https://damages.${consumer.ownerDid.split(':')[2]}.com/fallback-${now}.json`,
        signer: consumer.did,
        ts: now,
        model: {
          provider: "system_fallback",
          name: "rule_based_generator", 
          version: "1.0.0"
        },
        tool: "fallback_damage_calculator"
      });

      // File the dispute
      const panelDue = now + 7 * 24 * 60 * 60 * 1000;
      
      const caseId = await ctx.db.insert("cases", {
        parties: [vendor.did, consumer.did],
        status: "FILED" as const,
        type: randomType,
        filedAt: now,
        jurisdictionTags: ["AI_VENDOR_DISPUTE", "FALLBACK_GENERATED"],
        evidenceIds: [providerEvidence, consumerEvidence],
        deadlines: { panelDue }
      });

      // Update evidence with case ID
      await ctx.db.patch(providerEvidence, { caseId });
      await ctx.db.patch(consumerEvidence, { caseId });

      // Log evidence submission events for fallback disputes
      await ctx.db.insert("events", {
        type: "EVIDENCE_SUBMITTED",
        payload: {
          agentDid: vendor.did,
          evidenceId: providerEvidence,
          caseId: caseId,
          evidenceType: "fallback_incident_report",
          llmGenerated: false
        },
        timestamp: now,
        caseId: caseId,
        agentDid: vendor.did
      });

      await ctx.db.insert("events", {
        type: "EVIDENCE_SUBMITTED",
        payload: {
          agentDid: consumer.did,
          evidenceId: consumerEvidence,
          caseId: caseId,
          evidenceType: "fallback_damage_report", 
          llmGenerated: false
        },
        timestamp: now + 1,
        caseId: caseId,
        agentDid: consumer.did
      });

      // Log event
      await ctx.db.insert("events", {
        type: "DISPUTE_FILED",
        payload: {
          caseId,
          parties: [vendor.did, consumer.did],
          type: randomType,
          evidenceCount: 2,
          jurisdictionTags: ["AI_VENDOR_DISPUTE", "FALLBACK_GENERATED"],
          llmGenerated: false
        },
        timestamp: now + 2,
        caseId,
      });

      console.log(`✅ Fallback dispute filed: ${randomType} (${vendor.ownerDid.split(':')[2]} vs ${consumer.ownerDid.split(':')[2]})`);
      
      return { 
        success: true, 
        caseId,
        disputeType: randomType,
        parties: [vendor.did, consumer.did],
        llmGenerated: false
      };
      
    } catch (error: any) {
      console.error("❌ Fallback dispute generation failed:", error.message);
      return { success: false, reason: error.message };
    }
  }
});

// System health monitoring
export const systemHealthMonitor = internalMutation({
  args: {},
  handler: async (ctx) => {
    try {
      console.log("💚 System health check...");
      
      // Count active agents
      const activeAgents = await ctx.db
        .query("agents")
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();
        
      // Count filed cases
      const filedCases = await ctx.db
        .query("cases")
        .filter((q) => q.eq(q.field("status"), "FILED"))
        .collect();
        
      // Count evidence manifests
      const evidenceCount = await ctx.db
        .query("evidenceManifests")
        .collect();
        
      // Count recent events (last hour)
      const recentEvents = await ctx.db
        .query("events")
        .filter((q) => q.gt(q.field("timestamp"), Date.now() - 60 * 60 * 1000))
        .collect();

      const healthStats = {
        activeAgents: activeAgents.length,
        filedCases: filedCases.length,
        evidenceCount: evidenceCount.length,
        recentEvents: recentEvents.length,
        timestamp: Date.now(),
        status: "healthy"
      };
      
      console.log(`✅ System Health: ${activeAgents.length} agents, ${filedCases.length} cases, ${recentEvents.length} recent events`);
      
      return healthStats;
      
    } catch (error: any) {
      console.error("❌ Health check failed:", error.message);
      return { 
        status: "unhealthy", 
        reason: error.message, 
        timestamp: Date.now() 
      };
    }
  }
});

// Process pending cases
export const processPendingCases = internalMutation({
  args: {},
  handler: async (ctx) => {
    try {
      console.log("⚖️ Processing pending cases...");
      
      // Get filed cases that need processing
      const filedCases = await ctx.db
        .query("cases")
        .filter((q) => q.eq(q.field("status"), "FILED"))
        .collect();
        
      let processed = 0;
      
      for (const case_ of filedCases) {
        // Check if case is ready for processing (filed more than 30 seconds ago)
        const timeSinceFiling = Date.now() - case_.filedAt;
        
        if (timeSinceFiling > 30 * 1000) { // 30 seconds
          // Move to pending arbitration
          await ctx.db.patch(case_._id, {
            status: "PENDING_ARBITRATION"
          });
          
          // Log status change
          await ctx.db.insert("events", {
            type: "CASE_STATUS_CHANGED",
            payload: {
              caseId: case_._id,
              oldStatus: "FILED",
              newStatus: "PENDING_ARBITRATION",
              reason: "Automatic processing"
            },
            timestamp: Date.now(),
            caseId: case_._id,
          });
          
          processed++;
        }
      }
      
      if (processed > 0) {
        console.log(`✅ Processed ${processed} cases to PENDING_ARBITRATION`);
      }
      
      return { success: true, processed };
      
    } catch (error: any) {
      console.error("❌ Case processing failed:", error.message);
      return { success: false, reason: error.message };
    }
  }
});
