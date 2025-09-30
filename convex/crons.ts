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
import { AI_VENDORS, AI_CONSUMERS } from "./disputeEngine";

// Generate SHA256 hash utility
function generateSHA256(): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// AI vendor and consumer configurations are imported from disputeEngine.ts
// This ensures cron jobs use the same agents that are registered in the database

// Generate LLM-powered dispute
export const generateLLMDispute = internalAction({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; reason?: string; caseId?: any; disputeType?: string; parties?: string[]; llmGenerated?: boolean }> => {
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
        deadlines: { panelDue },
        description: args.scenario.llmData?.description || args.scenario.description,
        claimedDamages: args.scenario.typicalDamages?.max,
        breachDetails: args.scenario.llmData ? {
          duration: args.scenario.llmData.breachDuration,
          impactLevel: args.scenario.llmData.impactLevel,
          affectedUsers: args.scenario.llmData.affectedUsers,
          slaRequirement: args.scenario.llmData.slaRequirement,
          actualPerformance: args.scenario.llmData.actualPerformance,
          rootCause: args.scenario.llmData.rootCause,
        } : undefined,
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
      
      const disputeTypes = [
        "API_DOWNTIME",
        "RESPONSE_LATENCY", 
        "DATA_ACCURACY",
        "PROCESSING_VOLUME",
        "RATE_LIMIT_BREACH",
        "DATA_LOSS",
        "SECURITY_INCIDENT",
        "BILLING_OVERCHARGE"
      ];
      const randomType = disputeTypes[Math.floor(Math.random() * disputeTypes.length)];
      
      // Select random vendor and consumer (ensure they're different companies)
      let vendor = AI_VENDORS[Math.floor(Math.random() * AI_VENDORS.length)];
      let consumer = AI_CONSUMERS[Math.floor(Math.random() * AI_CONSUMERS.length)];
      
      // Avoid same company being vendor and consumer
      let attempts = 0;
      while (vendor.ownerDid === consumer.ownerDid && attempts < 10) {
        consumer = AI_CONSUMERS[Math.floor(Math.random() * AI_CONSUMERS.length)];
        attempts++;
      }
      
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
      
      // Generate detailed dispute description for fallback
      const vendorName = vendor.ownerDid.split(':')[2].charAt(0).toUpperCase() + vendor.ownerDid.split(':')[2].slice(1);
      const consumerName = consumer.ownerDid.split(':')[2].charAt(0).toUpperCase() + consumer.ownerDid.split(':')[2].slice(1);
      
      // Create grammatically correct descriptions based on dispute type
      const descriptions: Record<string, string> = {
        "API_DOWNTIME": `${consumerName} has filed a dispute alleging that ${vendorName}'s API service experienced unscheduled downtime exceeding the agreed SLA threshold. The outage resulted in service disruptions and measurable revenue loss during the affected period.`,
        "RESPONSE_LATENCY": `${consumerName} claims that ${vendorName}'s API response times consistently exceeded contractual performance requirements. The elevated latency degraded user experience and operational efficiency, violating agreed service levels.`,
        "DATA_ACCURACY": `${consumerName} alleges that ${vendorName} provided inaccurate or inconsistent data that led to incorrect business decisions and operational failures. The data quality issues represent a breach of the agreed accuracy standards.`,
        "PROCESSING_VOLUME": `${consumerName} reports that ${vendorName} failed to process the contracted volume of requests, resulting in throttling and failed transactions during peak business hours in violation of capacity commitments.`,
        "RATE_LIMIT_BREACH": `${consumerName} alleges that ${vendorName} imposed undisclosed rate limits that prevented ${consumerName} from utilizing the full contracted API capacity, causing business disruptions.`,
        "DATA_LOSS": `${consumerName} claims that ${vendorName}'s service experienced data loss or corruption affecting critical business information, representing a severe breach of data integrity commitments.`,
        "SECURITY_INCIDENT": `${consumerName} alleges that ${vendorName} suffered a security incident that exposed ${consumerName}'s sensitive data, violating security and compliance guarantees outlined in the service agreement.`,
        "BILLING_OVERCHARGE": `${consumerName} disputes billing charges from ${vendorName}, alleging overcharges, incorrect pricing application, or charges for services not rendered according to contractual terms.`
      };
      
      const description = descriptions[randomType] || `${consumerName} has initiated a formal dispute against ${vendorName} regarding ${randomType.replace(/_/g, ' ').toLowerCase()}.`;
      
      // Generate realistic damage amounts based on dispute severity
      const damageRanges: Record<string, { min: number; max: number }> = {
        "API_DOWNTIME": { min: 15000, max: 150000 },
        "RESPONSE_LATENCY": { min: 5000, max: 75000 },
        "DATA_ACCURACY": { min: 10000, max: 100000 },
        "PROCESSING_VOLUME": { min: 8000, max: 80000 },
        "RATE_LIMIT_BREACH": { min: 12000, max: 90000 },
        "DATA_LOSS": { min: 50000, max: 500000 },
        "SECURITY_INCIDENT": { min: 100000, max: 1000000 },
        "BILLING_OVERCHARGE": { min: 3000, max: 50000 }
      };
      
      const damageRange = damageRanges[randomType] || { min: 5000, max: 50000 };
      const claimedDamages = Math.floor(Math.random() * (damageRange.max - damageRange.min)) + damageRange.min;
      
      // Generate breach details
      const impactLevels = ["Minor", "Moderate", "Significant", "Severe", "Critical"];
      const durations = ["15 minutes", "2 hours", "6 hours", "12 hours", "24 hours", "3 days"];
      const affectedUsers = Math.floor(Math.random() * 100000) + 1000; // $1k-$11k
      
      const caseId = await ctx.db.insert("cases", {
        parties: [vendor.did, consumer.did],
        status: "FILED" as const,
        type: randomType,
        filedAt: now,
        jurisdictionTags: ["AI_VENDOR_DISPUTE", "FALLBACK_GENERATED"],
        evidenceIds: [providerEvidence, consumerEvidence],
        deadlines: { panelDue },
        description,
        claimedDamages,
        breachDetails: {
          duration: durations[Math.floor(Math.random() * durations.length)],
          impactLevel: impactLevels[Math.floor(Math.random() * impactLevels.length)],
          affectedUsers,
          slaRequirement: randomType === "API_DOWNTIME" ? "99.9% uptime" : 
                         randomType === "RESPONSE_LATENCY" ? "< 200ms p95 latency" :
                         randomType === "DATA_ACCURACY" ? "99.95% accuracy" :
                         randomType === "PROCESSING_VOLUME" ? "10M requests/day" :
                         "Service level agreement standards",
          actualPerformance: randomType === "API_DOWNTIME" ? "98.2% uptime" :
                            randomType === "RESPONSE_LATENCY" ? "450ms p95 latency" :
                            randomType === "DATA_ACCURACY" ? "96.3% accuracy" :
                            randomType === "PROCESSING_VOLUME" ? "6.2M requests/day" :
                            "Below contractual thresholds",
          rootCause: randomType === "API_DOWNTIME" ? "Infrastructure failure in primary data center" :
                    randomType === "RESPONSE_LATENCY" ? "Database query optimization issues" :
                    randomType === "DATA_ACCURACY" ? "Data pipeline transformation errors" :
                    randomType === "PROCESSING_VOLUME" ? "Insufficient auto-scaling configuration" :
                    randomType === "SECURITY_INCIDENT" ? "Unauthorized access to customer data" :
                    "System configuration or operational issues"
        },
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

// Process pending cases - Auto-arbitration enabled
export const processPendingCases = internalMutation({
  args: {},
  handler: async (ctx) => {
    try {
      console.log("⚖️ Processing pending cases...");
      
      // Get filed cases
      const filedCases = await ctx.db
        .query("cases")
        .filter((q) => q.eq(q.field("status"), "FILED"))
        .collect();
      
      console.log(`📊 Found ${filedCases.length} cases in FILED status`);
      
      let processed = 0;
      
      // Process each filed case through the court engine
      for (const caseData of filedCases) {
        try {
          // Get evidence for this case
          const evidence = await ctx.db
            .query("evidenceManifests")
            .withIndex("by_case", q => q.eq("caseId", caseData._id))
            .collect();
          
          // Simple rule-based decision logic
          let verdict: "UPHELD" | "DISMISSED";
          let code: string;
          let reasons: string;
          let auto = true;
          
          // Basic automated rules
          if (evidence.length === 0) {
            verdict = "DISMISSED";
            code = "INSUFFICIENT_EVIDENCE";
            reasons = "Case dismissed due to lack of evidence.";
          } else if (evidence.length >= 3) {
            verdict = "UPHELD";
            code = "SLA_VIOLATION_CONFIRMED";
            reasons = "Substantial evidence confirms SLA violation. Provider found liable.";
          } else {
            // 1-2 pieces of evidence, likely UPHELD
            verdict = "UPHELD";
            code = "EVIDENCE_SUPPORTS_CLAIM";
            reasons = "Evidence supports claim of service level violation.";
          }
          
          const decidedAt = Date.now();
          
          // Create ruling
          await ctx.db.insert("rulings", {
            caseId: caseData._id,
            verdict,
            code,
            reasons,
            auto,
            decidedAt,
            proof: {
              merkleRoot: "simple_hash_" + caseData._id,
            }
          });
          
          // Update case status - all auto-decisions are DECIDED
          const newStatus = "DECIDED" as const;
          await ctx.db.patch(caseData._id, {
            status: newStatus,
            ruling: {
              verdict,
              auto,
              decidedAt
            }
          });
          
          // Log the status update event for dashboard tracking
          await ctx.db.insert("events", {
            type: "CASE_STATUS_UPDATED",
            payload: {
              caseId: caseData._id,
              oldStatus: "FILED",
              newStatus: newStatus,
              verdict: verdict,
              auto: auto
            },
            timestamp: decidedAt,
            caseId: caseData._id,
          });
          
          processed++;
          console.log(`✅ Case ${caseData._id} resolved - ${verdict} (${code})`);
          
        } catch (error: any) {
          console.error(`❌ Failed to process case ${caseData._id}:`, error.message);
        }
      }
      
      console.log(`🎯 Processed ${processed}/${filedCases.length} cases`);
      
      return { success: true, filedCases: filedCases.length, processed };
      
    } catch (error: any) {
      console.error("❌ Case processing failed:", error.message);
      return { success: false, reason: error.message };
    }
  }
});
