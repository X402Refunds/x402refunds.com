import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// =================================================================
// LLM-POWERED DISPUTE GENERATION SYSTEM
// =================================================================

// Generate LLM-powered mock disputes every 30 minutes
crons.interval(
  "llm dispute generation",
  { minutes: 30 },
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

// Process pending cases every 15 minutes
crons.interval(
  "process cases",
  { minutes: 15 },
  internal.crons.processPendingCases,
  {} // empty args
);

// Update cached system statistics every 10 minutes
crons.interval(
  "update stats cache",
  { minutes: 10 },
  internal.crons.updateSystemStatsCache,
  {} // empty args
);

export default crons;

// =================================================================
// CRON JOB IMPLEMENTATIONS
// =================================================================

import { internalMutation, internalAction, mutation } from "./_generated/server";
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
      // Get all agents and randomly select vendor and consumer
      const allAgents = await ctx.db.query("agents").filter((q) => q.eq(q.field("status"), "active")).collect();
      
      if (allAgents.length < 2) {
        console.log("⚠️ Need at least 2 agents for disputes - skipping");
        return { success: false, reason: "Not enough agents" };
      }
      
      // Randomly select vendor and consumer (ensure different organizations)
      const vendorAgent = allAgents[Math.floor(Math.random() * allAgents.length)];
      let consumerAgent = allAgents[Math.floor(Math.random() * allAgents.length)];
      
      // Ensure different organizations
      let attempts = 0;
      while (vendorAgent.organizationName === consumerAgent.organizationName && attempts < 10) {
        consumerAgent = allAgents[Math.floor(Math.random() * allAgents.length)];
        attempts++;
      }
      
      if (vendorAgent.organizationName === consumerAgent.organizationName) {
        console.log("⚠️ Could not find different organizations - skipping dispute");
        return { success: false, reason: "Same organization selected" };
      }

      const now = Date.now();
      
      // Create evidence manifests using LLM data
      const providerEvidence = await ctx.db.insert("evidenceManifests", {
        agentDid: vendorAgent.did,
        sha256: generateSHA256(),
        uri: `https://evidence.${(vendorAgent.organizationName || 'unknown').toLowerCase().replace(/\s+/g, '')}.com/llm-incident-${now}.json`,
        signer: vendorAgent.did,
        ts: now,
        model: {
          provider: "openrouter_llm",
          name: "claude-3.5-sonnet",
          version: "anthropic/claude-3.5-sonnet"
        },
        tool: "llm_generated_evidence"
      });
      
      const consumerEvidence = await ctx.db.insert("evidenceManifests", {
        agentDid: consumerAgent.did,
        sha256: generateSHA256(),
        uri: `https://damages.${(consumerAgent.organizationName || 'unknown').toLowerCase().replace(/\s+/g, '')}.com/llm-impact-${now}.json`,
        signer: consumerAgent.did,
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
        plaintiff: consumerAgent.did,
        defendant: vendorAgent.did,
        parties: [vendorAgent.did, consumerAgent.did],
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
        mock: true, // Mark as demo data for the demo cases page
      });

      // Update evidence with case ID
      await ctx.db.patch(providerEvidence, { caseId });
      await ctx.db.patch(consumerEvidence, { caseId });

      // Log evidence submission events
      await ctx.db.insert("events", {
        type: "EVIDENCE_SUBMITTED",
        payload: {
          agentDid: vendorAgent.did,
          evidenceId: providerEvidence,
          caseId: caseId,
          evidenceType: "provider_incident_report",
          llmGenerated: true
        },
        timestamp: now,
        caseId: caseId,
        agentDid: vendorAgent.did
      });

      await ctx.db.insert("events", {
        type: "EVIDENCE_SUBMITTED", 
        payload: {
          agentDid: consumerAgent.did,
          evidenceId: consumerEvidence,
          caseId: caseId,
          evidenceType: "consumer_damage_report",
          llmGenerated: true
        },
        timestamp: now + 1, // Slightly offset timestamp
        caseId: caseId,
        agentDid: consumerAgent.did
      });

      // Log event
      await ctx.db.insert("events", {
        type: "DISPUTE_FILED",
        payload: {
          caseId,
          parties: [vendorAgent.did, consumerAgent.did],
          type: args.scenario.type,
          evidenceCount: 2,
          jurisdictionTags: ["AI_VENDOR_DISPUTE", "LLM_GENERATED"],
          llmGenerated: true,
          llmData: args.scenario.llmData
        },
        timestamp: now + 2,
        caseId,
      });

      console.log(`✅ LLM dispute filed: ${args.scenario.type} (${vendorAgent.organizationName} vs ${consumerAgent.organizationName})`);
      console.log(`   Case ID: ${caseId}`);
      console.log(`   Damages: $${args.scenario.typicalDamages.min.toLocaleString()}-$${args.scenario.typicalDamages.max.toLocaleString()}`);
      
      return { 
        success: true, 
        caseId,
        disputeType: args.scenario.type,
        parties: [vendorAgent.did, consumerAgent.did],
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
      
      // Get all agents and randomly select vendor and consumer
      const allAgents = await ctx.db.query("agents").filter((q) => q.eq(q.field("status"), "active")).collect();
      
      if (allAgents.length < 2) {
        console.log("⚠️ Need at least 2 agents for disputes - skipping");
        return { success: false, reason: "Not enough agents" };
      }
      
      // Randomly select vendor and consumer (ensure different organizations)
      const vendorAgent = allAgents[Math.floor(Math.random() * allAgents.length)];
      let consumerAgent = allAgents[Math.floor(Math.random() * allAgents.length)];
      
      // Ensure different organizations
      let attempts = 0;
      while (vendorAgent.organizationName === consumerAgent.organizationName && attempts < 10) {
        consumerAgent = allAgents[Math.floor(Math.random() * allAgents.length)];
        attempts++;
      }
      
      if (vendorAgent.organizationName === consumerAgent.organizationName) {
        console.log("⚠️ Could not find different organizations - skipping dispute");
        return { success: false, reason: "Same organization selected" };
      }
      
      const now = Date.now();
      
      // Create simple evidence manifests
      const providerEvidence = await ctx.db.insert("evidenceManifests", {
        agentDid: vendorAgent.did,
        sha256: generateSHA256(),
        uri: `https://evidence.${(vendorAgent.organizationName || 'unknown').toLowerCase().replace(/\s+/g, '')}.com/fallback-${now}.json`,
        signer: vendorAgent.did,
        ts: now,
        model: {
          provider: "system_fallback",
          name: "rule_based_generator",
          version: "1.0.0"
        },
        tool: "fallback_evidence_generator"
      });
      
      const consumerEvidence = await ctx.db.insert("evidenceManifests", {
        agentDid: consumerAgent.did,
        sha256: generateSHA256(),
        uri: `https://damages.${(consumerAgent.organizationName || 'unknown').toLowerCase().replace(/\s+/g, '')}.com/fallback-${now}.json`,
        signer: consumerAgent.did,
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
      const vendorName = vendorAgent.organizationName || 'Unknown Vendor';
      const consumerName = consumerAgent.organizationName || 'Unknown Consumer';
      
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
        plaintiff: consumerAgent.did,
        defendant: vendorAgent.did,
        parties: [vendorAgent.did, consumerAgent.did],
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
        mock: true, // Mark as demo data for the demo cases page
      });

      // Update evidence with case ID
      await ctx.db.patch(providerEvidence, { caseId });
      await ctx.db.patch(consumerEvidence, { caseId });

      // Log evidence submission events for fallback disputes
      await ctx.db.insert("events", {
        type: "EVIDENCE_SUBMITTED",
        payload: {
          agentDid: vendorAgent.did,
          evidenceId: providerEvidence,
          caseId: caseId,
          evidenceType: "fallback_incident_report",
          llmGenerated: false
        },
        timestamp: now,
        caseId: caseId,
        agentDid: vendorAgent.did
      });

      await ctx.db.insert("events", {
        type: "EVIDENCE_SUBMITTED",
        payload: {
          agentDid: consumerAgent.did,
          evidenceId: consumerEvidence,
          caseId: caseId,
          evidenceType: "fallback_damage_report", 
          llmGenerated: false
        },
        timestamp: now + 1,
        caseId: caseId,
        agentDid: consumerAgent.did
      });

      // Log event
      await ctx.db.insert("events", {
        type: "DISPUTE_FILED",
        payload: {
          caseId,
          parties: [vendorAgent.did, consumerAgent.did],
          type: randomType,
          evidenceCount: 2,
          jurisdictionTags: ["AI_VENDOR_DISPUTE", "FALLBACK_GENERATED"],
          llmGenerated: false
        },
        timestamp: now + 2,
        caseId,
      });

      console.log(`✅ Fallback dispute filed: ${randomType} (${vendorName} vs ${consumerName})`);
      
      return { 
        success: true, 
        caseId,
        disputeType: randomType,
        parties: [vendorAgent.did, consumerAgent.did],
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

          // Convert legacy verdict to agent verdict
          const agentVerdict: "PLAINTIFF_WINS" | "DEFENDANT_WINS" | "SPLIT" | "NEED_PANEL" =
            verdict === "UPHELD" ? "PLAINTIFF_WINS" :
            verdict === "DISMISSED" ? "DEFENDANT_WINS" :
            verdict === "SPLIT" ? "SPLIT" : "NEED_PANEL";

          // Create ruling
          await ctx.db.insert("rulings", {
            caseId: caseData._id,
            verdict: agentVerdict,
            verdictLegacy: verdict,
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

// Update cached system statistics for fast dashboard loading
export const updateSystemStatsCache = internalMutation({
  args: {},
  handler: async (ctx) => {
    try {
      const startTime = Date.now();
      console.log("📊 Updating cached system statistics...");
      
      // Get all agents
      const allAgents = await ctx.db.query("agents").collect();
      const activeAgents = allAgents.filter(a => a.status === "active");
      
      // Get all cases
      const allCases = await ctx.db.query("cases").collect();
      const resolvedCases = allCases.filter(c => 
        c.status === "DECIDED" || c.status === "CLOSED" || c.status === "AUTORULED"
      );
      const pendingCases = allCases.filter(c => c.status === "FILED");
      
      // Calculate average resolution time for cases with rulings
      const casesWithResolution = allCases.filter(c => c.ruling?.decidedAt && c.filedAt);
      let avgResolutionTimeMs = 0;
      if (casesWithResolution.length > 0) {
        const totalResolutionTime = casesWithResolution.reduce((sum, c) => {
          return sum + (c.ruling!.decidedAt - c.filedAt);
        }, 0);
        avgResolutionTimeMs = totalResolutionTime / casesWithResolution.length;
      }
      const avgResolutionTimeMinutes = avgResolutionTimeMs / (1000 * 60);
      
      // Get 24h metrics
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000);
      const recentEvents = await ctx.db
        .query("events")
        .withIndex("by_timestamp", (q) => q.gt("timestamp", cutoffTime))
        .collect();
      
      const agentRegistrationsLast24h = recentEvents.filter(e => e.type === "AGENT_REGISTERED").length;
      const casesFiledLast24h = recentEvents.filter(e => e.type === "DISPUTE_FILED").length;
      const casesResolvedLast24h = recentEvents.filter(e => 
        e.type === "CASE_STATUS_UPDATED" && 
        (e.payload?.newStatus === "DECIDED" || e.payload?.newStatus === "CLOSED")
      ).length;
      
      // Calculate how long this took
      const calculationTimeMs = Date.now() - startTime;
      
      // Update or insert the cached stats (singleton pattern)
      const existingStats = await ctx.db
        .query("systemStats")
        .withIndex("by_key", (q) => q.eq("key", "current"))
        .first();
      
      const statsData = {
        key: "current",
        totalAgents: allAgents.length,
        activeAgents: activeAgents.length,
        totalCases: allCases.length,
        resolvedCases: resolvedCases.length,
        pendingCases: pendingCases.length,
        avgResolutionTimeMs,
        avgResolutionTimeMinutes,
        agentRegistrationsLast24h,
        casesFiledLast24h,
        casesResolvedLast24h,
        lastUpdated: Date.now(),
        calculationTimeMs,
      };
      
      if (existingStats) {
        await ctx.db.patch(existingStats._id, statsData);
      } else {
        await ctx.db.insert("systemStats", statsData);
      }
      
      console.log(`✅ Stats cache updated in ${calculationTimeMs}ms: ${activeAgents.length} agents, ${allCases.length} cases, ${avgResolutionTimeMinutes.toFixed(1)} min avg resolution`);
      
      return { success: true, calculationTimeMs, stats: statsData };
      
    } catch (error: any) {
      console.error("❌ Failed to update stats cache:", error.message);
      return { success: false, reason: error.message };
    }
  }
});

// =================================================================
// PUBLIC TRIGGER FOR MANUAL DISPUTE GENERATION (for testing/demo)
// =================================================================

/**
 * Public mutation to manually trigger dispute generation
 * This is a wrapper that calls the internal cron job
 * Useful for testing and demo purposes
 */
export const triggerDisputeGeneration = mutation({
  args: {},
  handler: async (ctx) => {
    try {
      console.log("🎬 Manual dispute generation triggered...");
      
      // Call the internal fallback dispute generation
      // (We use fallback instead of LLM for faster demo generation)
      const result = await ctx.db
        .query("agents")
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();
      
      if (result.length < 2) {
        return { 
          success: false, 
          message: "Need at least 2 active agents to generate a dispute. Please register agents first." 
        };
      }
      
      // Generate a fallback dispute directly (similar to cron logic)
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
      
      // Get all agents and randomly select vendor and consumer
      const allAgents = result;
      
      // Randomly select vendor and consumer (ensure different organizations)
      const vendorAgent = allAgents[Math.floor(Math.random() * allAgents.length)];
      let consumerAgent = allAgents[Math.floor(Math.random() * allAgents.length)];
      
      // Ensure different organizations
      let attempts = 0;
      while (vendorAgent.organizationName === consumerAgent.organizationName && attempts < 10) {
        consumerAgent = allAgents[Math.floor(Math.random() * allAgents.length)];
        attempts++;
      }
      
      if (vendorAgent.organizationName === consumerAgent.organizationName) {
        return { 
          success: false, 
          message: "Could not find agents from different organizations" 
        };
      }
      
      const now = Date.now();
      
      // Create simple evidence manifests
      const providerEvidence = await ctx.db.insert("evidenceManifests", {
        agentDid: vendorAgent.did,
        sha256: generateSHA256(),
        uri: `https://evidence.${(vendorAgent.organizationName || 'unknown').toLowerCase().replace(/\s+/g, '')}.com/manual-${now}.json`,
        signer: vendorAgent.did,
        ts: now,
        model: {
          provider: "manual_trigger",
          name: "manual_dispute_generator",
          version: "1.0.0"
        },
        tool: "manual_trigger"
      });
      
      const consumerEvidence = await ctx.db.insert("evidenceManifests", {
        agentDid: consumerAgent.did,
        sha256: generateSHA256(),
        uri: `https://damages.${(consumerAgent.organizationName || 'unknown').toLowerCase().replace(/\s+/g, '')}.com/manual-${now}.json`,
        signer: consumerAgent.did,
        ts: now,
        model: {
          provider: "manual_trigger",
          name: "manual_dispute_generator", 
          version: "1.0.0"
        },
        tool: "manual_trigger"
      });

      // File the dispute
      const panelDue = now + 7 * 24 * 60 * 60 * 1000;
      
      // Generate detailed dispute description
      const vendorName = vendorAgent.organizationName || 'Unknown Vendor';
      const consumerName = consumerAgent.organizationName || 'Unknown Consumer';
      
      const descriptions: Record<string, string> = {
        "API_DOWNTIME": `${consumerName} has filed a dispute alleging that ${vendorName}'s API service experienced unscheduled downtime exceeding the agreed SLA threshold.`,
        "RESPONSE_LATENCY": `${consumerName} claims that ${vendorName}'s API response times consistently exceeded contractual performance requirements.`,
        "DATA_ACCURACY": `${consumerName} alleges that ${vendorName} provided inaccurate or inconsistent data that led to incorrect business decisions.`,
        "PROCESSING_VOLUME": `${consumerName} reports that ${vendorName} failed to process the contracted volume of requests.`,
        "RATE_LIMIT_BREACH": `${consumerName} alleges that ${vendorName} imposed undisclosed rate limits that prevented full service utilization.`,
        "DATA_LOSS": `${consumerName} claims that ${vendorName}'s service experienced data loss or corruption affecting critical business information.`,
        "SECURITY_INCIDENT": `${consumerName} alleges that ${vendorName} suffered a security incident that exposed sensitive data.`,
        "BILLING_OVERCHARGE": `${consumerName} disputes billing charges from ${vendorName}, alleging overcharges or incorrect pricing.`
      };
      
      const description = descriptions[randomType] || `${consumerName} has initiated a dispute against ${vendorName}.`;
      
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
      
      const caseId = await ctx.db.insert("cases", {
        plaintiff: consumerAgent.did,
        defendant: vendorAgent.did,
        parties: [vendorAgent.did, consumerAgent.did],
        status: "FILED" as const,
        type: randomType,
        filedAt: now,
        jurisdictionTags: ["AI_VENDOR_DISPUTE", "MANUAL_TRIGGER"],
        evidenceIds: [providerEvidence, consumerEvidence],
        deadlines: { panelDue },
        description,
        claimedDamages,
        breachDetails: {
          duration: "Manually triggered demo",
          impactLevel: "Moderate",
          affectedUsers: Math.floor(Math.random() * 10000) + 100,
          slaRequirement: "Demo SLA requirements",
          actualPerformance: "Demo actual performance",
          rootCause: "Manual trigger for demo purposes"
        },
        mock: true, // Mark as demo data
      });

      // Update evidence with case ID
      await ctx.db.patch(providerEvidence, { caseId });
      await ctx.db.patch(consumerEvidence, { caseId });

      // Log evidence submission events
      await ctx.db.insert("events", {
        type: "EVIDENCE_SUBMITTED",
        payload: {
          agentDid: vendorAgent.did,
          evidenceId: providerEvidence,
          caseId: caseId,
          evidenceType: "manual_trigger",
        },
        timestamp: now,
        caseId: caseId,
        agentDid: vendorAgent.did
      });

      await ctx.db.insert("events", {
        type: "EVIDENCE_SUBMITTED",
        payload: {
          agentDid: consumerAgent.did,
          evidenceId: consumerEvidence,
          caseId: caseId,
          evidenceType: "manual_trigger", 
        },
        timestamp: now + 1,
        caseId: caseId,
        agentDid: consumerAgent.did
      });

      // Log dispute filed event
      await ctx.db.insert("events", {
        type: "DISPUTE_FILED",
        payload: {
          caseId,
          parties: [vendorAgent.did, consumerAgent.did],
          type: randomType,
          evidenceCount: 2,
          jurisdictionTags: ["AI_VENDOR_DISPUTE", "MANUAL_TRIGGER"],
        },
        timestamp: now + 2,
        caseId,
      });

      console.log(`✅ Manual dispute generated: ${randomType} (${vendorName} vs ${consumerName})`);
      
      return { 
        success: true, 
        message: `Dispute generated successfully`,
        caseId,
        disputeType: randomType,
        parties: [vendorAgent.did, consumerAgent.did],
      };
      
    } catch (error: any) {
      console.error("❌ Failed to generate manual dispute:", error.message);
      return { 
        success: false, 
        message: error.message 
      };
    }
  }
});
