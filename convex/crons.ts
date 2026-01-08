// @ts-nocheck
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
const internalAny: any = internal;

// =================================================================
// PAYMENT DISPUTE DEMO GENERATION (DISABLED)
// =================================================================

// DISABLED: Generate mock payment disputes every 20 minutes for demo
// crons.interval(
//   "payment dispute demo generation",
//   { minutes: 20 },
//   internal.crons.generatePaymentDisputeDemo,
//   {}
// );

// Update cached system statistics every 10 minutes
crons.interval(
  "update stats cache",
  { minutes: 10 },
  internalAny.crons.updateSystemStatsCache,
  {}
);

// Auto-approve overdue disputes (Regulation E compliance)
crons.interval(
  "auto approve overdue disputes",
  { hours: 6 }, // Run 4x per day
  internalAny.crons.autoApproveOverdueDisputes,
  {}
);

// Sweep executed refunds and notify merchants (wallet-first email notifications)
crons.interval(
  "refund executed merchant email sweep",
  { minutes: 30 },
  internalAny.crons.sweepRefundExecutedEmails,
  {}
);

// =================================================================
// EVIDENCE RETENTION & CLEANUP CRONS
// =================================================================

// Daily: Redact PII from evidence (prepare for archival)
crons.daily(
  "redactPII",
  { hourUTC: 2, minuteUTC: 0 }, // Run at 2am UTC daily
  internal.evidence.cleanup.redactPersonalData,
  {}
);

// Weekly: Archive old evidence to cold storage
crons.weekly(
  "archiveOldEvidence",
  { hourUTC: 3, minuteUTC: 0, dayOfWeek: "sunday" },
  internal.evidence.cleanup.archiveToCloudStorage,
  {}
);

// Weekly: Delete customer support evidence (4 month retention)
crons.weekly(
  "deleteOldSupportData",
  { hourUTC: 4, minuteUTC: 0, dayOfWeek: "sunday" },
  internal.evidence.cleanup.deleteOldSupportData,
  {}
);

// Weekly: Delete payment dispute evidence (60 day retention)
crons.weekly(
  "deleteOldPaymentEvidence",
  { hourUTC: 5, minuteUTC: 0, dayOfWeek: "sunday" },
  internal.evidence.cleanup.deleteOldPaymentEvidence,
  {}
);

// Monthly: Delete old commercial evidence (7 year retention)
crons.monthly(
  "deleteAncientEvidence",
  { day: 1, hourUTC: 4, minuteUTC: 0 },
  internal.evidence.cleanup.deleteOldEvidence,
  { retentionYears: 7 }
);

// Monthly: Optimize storage (deduplication)
crons.monthly(
  "optimizeStorage",
  { day: 15, hourUTC: 3, minuteUTC: 0 },
  internal.evidence.cleanup.optimizeStorage,
  {}
);

export default crons;

// =================================================================
// CRON JOB IMPLEMENTATIONS
// =================================================================

import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Companies for payment disputes
const COMPANIES = [
  "CryptoMart", "AgentPay", "DecentraShop", "Web3Store", "MetaMall",
  "TokenBazaar", "ChainCommerce", "DigitalGoods", "AIMarket", "NeuralShop"
];

const CONSUMERS = [
  "Alice", "Bob", "Carol", "Dave", "Eve", "Frank", "Grace", "Henry", "Iris", "Jack"
];

// Generate payment dispute for demo
export const generatePaymentDisputeDemo = internalMutation({
  args: {},
  handler: async (ctx): Promise<any> => {
    try {
      console.log("💳 Generating payment dispute demo...");

      // Random company and consumer
      const merchant = COMPANIES[Math.floor(Math.random() * COMPANIES.length)];
      const consumer = CONSUMERS[Math.floor(Math.random() * CONSUMERS.length)];

      // Generate random amount (flat $0.05 fee for all, no tiers)
      const amountRoll = Math.random();
      let amount: number;

      if (amountRoll < 0.60) {
        // 60% micro amounts (<$1)
        amount = 0.10 + (Math.random() * 0.89);
      } else if (amountRoll < 0.85) {
        // 25% small amounts ($1-10)
        amount = 1 + (Math.random() * 9);
      } else if (amountRoll < 0.95) {
        // 10% medium amounts ($10-100)
        amount = 10 + (Math.random() * 90);
      } else if (amountRoll < 0.99) {
        // 4% large amounts ($100-1k)
        amount = 100 + (Math.random() * 900);
      } else {
        // 1% very large amounts (>$1k)
        amount = 1000 + (Math.random() * 4000);
      }

      const disputeReasons = [
        "unauthorized",
        "service_not_rendered",
        "amount_incorrect",
        "duplicate_charge",
        "quality_issue",
        "api_timeout"
      ];
      const reason = disputeReasons[Math.floor(Math.random() * disputeReasons.length)];

      const descriptions: Record<string, string> = {
        unauthorized: `${consumer} claims they did not authorize this $${amount.toFixed(2)} charge from ${merchant}. The transaction appears suspicious and may be fraudulent.`,
        service_not_rendered: `${consumer} paid $${amount.toFixed(2)} to ${merchant} but the digital goods/service was never delivered despite multiple attempts to contact support.`,
        amount_incorrect: `${consumer} was charged $${amount.toFixed(2)} by ${merchant}, but the agreed price was different. The merchant's pricing was not disclosed correctly.`,
        duplicate_charge: `${merchant} charged ${consumer} twice for the same transaction. The duplicate $${amount.toFixed(2)} charge needs to be refunded.`,
        quality_issue: `${consumer} received substandard goods/service from ${merchant}. The $${amount.toFixed(2)} purchase did not meet the advertised quality or specifications.`,
        api_timeout: `The transaction between ${consumer} and ${merchant} for $${amount.toFixed(2)} failed due to API timeout, but ${consumer} was still charged.`
      };

      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Demo dispute generation requires mock blockchain mode; otherwise we would need real tx hashes.
      if (process.env.MOCK_BLOCKCHAIN_QUERIES !== "true") {
        console.warn("Skipping demo payment dispute generation: MOCK_BLOCKCHAIN_QUERIES is not enabled");
        return { success: false, reason: "Demo generation disabled (MOCK_BLOCKCHAIN_QUERIES != true)" };
      }

      // Create the payment dispute
      const result: any = await ctx.runMutation(internal.paymentDisputes.createPaymentDisputeCase as any, {
        transactionId,
        transactionHash: `0xmock_${transactionId}`,
        blockchain: "base",
        amount: amount.toFixed(2),
        amountUnit: "usdc",
        amountMicrousdc: Math.round(amount * 1_000_000),
        amountUsdc: amount,
        currency: "USDC",
        paymentProtocol: "demo",
        plaintiff: `consumer:${consumer.toLowerCase()}@demo.com`,
        defendant: `merchant:${merchant.toLowerCase()}@demo.com`,
        disputeReason: reason as any,
        description: descriptions[reason] || `Dispute regarding transaction ${transactionId}`,
        evidenceUrls: [],
        callbackUrl: undefined,
        reviewerEmail: undefined,
        reviewerOrganizationId: undefined,
        sourceTransferLogIndex: 0,
        payerAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        recipientAddress: "0x9876543210987654321098765432109876543210",
        disputeFee: 0.05,
      });

      console.log(`✅ Payment dispute created: $${amount.toFixed(2)} - ${reason}`);
      console.log(`   Consumer: ${consumer} vs Merchant: ${merchant}`);
      console.log(`   Transaction: ${transactionId}`);
      console.log(`   Fee: $${result.fee.toFixed(2)}`);

      return { success: true, ...result };

    } catch (error: any) {
      console.error("❌ Payment dispute generation failed:", error.message);
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

      // Get all cases
      const allCases = await ctx.db.query("cases").collect();
      
      // Get all agents
      const allAgents = await ctx.db.query("agents").collect();
      const activeAgents = allAgents.filter(a => a.status === "active");
      
      // Count resolved and pending cases
      const resolvedCases = allCases.filter(c => 
        c.status === "DECIDED" || c.status === "CLOSED"
      );
      const pendingCases = allCases.filter(c => 
        c.status === "FILED" || c.status === "ANALYZED" || c.status === "IN_REVIEW"
      );
      
      // Calculate average resolution time
      const resolvedWithTime = resolvedCases.filter(c => c.decidedAt && c.filedAt);
      const avgResolutionTimeMs = resolvedWithTime.length > 0
        ? resolvedWithTime.reduce((sum, c) => sum + (c.decidedAt! - c.filedAt), 0) / resolvedWithTime.length
        : 0;
      
      // Calculate 24h metrics
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000);
      const agentRegistrationsLast24h = allAgents.filter(a => a.createdAt > cutoffTime).length;
      const casesFiledLast24h = allCases.filter(c => c.filedAt > cutoffTime).length;
      const casesResolvedLast24h = resolvedCases.filter(c => c.decidedAt && c.decidedAt > cutoffTime).length;
      
      const calculationTimeMs = Date.now() - startTime;
      
      const stats = {
        key: "current",
        totalAgents: allAgents.length,
        activeAgents: activeAgents.length,
        totalCases: allCases.length,
        resolvedCases: resolvedCases.length,
        pendingCases: pendingCases.length,
        avgResolutionTimeMs,
        avgResolutionTimeMinutes: avgResolutionTimeMs / (60 * 1000),
        agentRegistrationsLast24h,
        casesFiledLast24h,
        casesResolvedLast24h,
        lastUpdated: Date.now(),
        calculationTimeMs,
      };

      // Upsert to systemStats table
      const existing = await ctx.db
        .query("systemStats")
        .withIndex("by_key", (q) => q.eq("key", "current"))
        .first();
      
      if (existing) {
        await ctx.db.patch(existing._id, stats);
      } else {
        await ctx.db.insert("systemStats", stats);
      }

      console.log(`✅ Stats updated in ${calculationTimeMs}ms:`);
      console.log(`   Total cases: ${stats.totalCases}, Resolved: ${stats.resolvedCases}, Pending: ${stats.pendingCases}`);
      console.log(`   Total agents: ${stats.totalAgents}, Active: ${stats.activeAgents}`);
      console.log(`   Avg resolution time: ${stats.avgResolutionTimeMinutes.toFixed(1)} minutes`);

      return stats;

    } catch (error: any) {
      console.error("❌ Stats update failed:", error.message);
      return { success: false, reason: error.message };
    }
  }
});

// Best-effort sweeper: find EXECUTED refunds that haven't triggered a merchant email yet,
// and schedule `merchantNotifications.notifyMerchantRefundExecuted`.
export const sweepRefundExecutedEmails = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const lookbackMs = 7 * 24 * 60 * 60 * 1000; // 7 days

    const executed = await ctx.db
      .query("refundTransactions")
      .withIndex("by_status", (q) => q.eq("status", "EXECUTED"))
      .order("desc")
      .take(100);

    let scheduled = 0;
    for (const r of executed) {
      if (typeof r.merchantRefundExecutedEmailSentAt === "number") continue;
      if (!r.caseId) continue;
      if (typeof r.executedAt === "number" && now - r.executedAt > lookbackMs) continue;

      await ctx.scheduler.runAfter(0, internalAny.merchantNotifications.notifyMerchantRefundExecuted as any, {
        caseId: r.caseId,
        refundId: r._id,
      });
      scheduled += 1;
    }

    return { ok: true, scanned: executed.length, scheduled };
  },
});

// Manual trigger for demo dispute generation (can be called from frontend)
export const triggerDisputeGeneration = mutation({
  args: {},
  handler: async (ctx): Promise<any> => {
    return await ctx.runMutation(internal.crons.generatePaymentDisputeDemo, {});
  }
});

// Manual trigger for stats cache update (can be called from frontend)
export const triggerStatsUpdate = mutation({
  args: {},
  handler: async (ctx): Promise<any> => {
    return await ctx.runMutation(internal.crons.updateSystemStatsCache, {});
  }
});

/**
 * Auto-approve disputes that exceed Regulation E deadline (10 business days)
 * Runs every 6 hours to check for overdue disputes
 */
export const autoApproveOverdueDisputes = internalMutation({
  args: {},
  handler: async (ctx) => {
    try {
      const startTime = Date.now();
      console.log("🕐 Checking for overdue disputes to auto-approve...");

      // Find payment disputes (type=PAYMENT cases) with AI recommendations but no human review
      // that are past their Regulation E deadline
      const now = Date.now();
      const allDisputes = await ctx.db
        .query("cases")
        .filter((q) => q.eq(q.field("type"), "PAYMENT"))
        .collect();

      const overdueDisputes = allDisputes.filter((d) =>
        d.humanReviewedAt === undefined &&
        d.aiRecommendation !== undefined &&
        d.paymentDetails?.regulationEDeadline &&
        d.paymentDetails.regulationEDeadline < now
      );

      if (overdueDisputes.length === 0) {
        console.log("✅ No overdue disputes found");
        return { approved: 0, message: "No overdue disputes" };
      }

      console.log(`📋 Found ${overdueDisputes.length} overdue disputes`);

      let approved = 0;
      let errors = 0;

      for (const dispute of overdueDisputes) {
        try {
          // TODO: Implement auto-approve logic for consolidated cases table
          // await ctx.runMutation(api.paymentDisputes.autoApproveAIRecommendation, {
          //   paymentDisputeId: dispute._id,
          // });
          console.warn(`  ⚠️  Auto-approve not yet implemented for consolidated cases table: ${dispute._id}`);
          // approved++;
          // console.log(`  ✅ Auto-approved dispute ${dispute._id} (${(now - (dispute.paymentDetails?.regulationEDeadline || 0)) / (24 * 60 * 60 * 1000)} days overdue)`);
        } catch (error: any) {
          errors++;
          console.error(`  ❌ Failed to auto-approve ${dispute._id}:`, error.message);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`🕐 Auto-approved ${approved}/${overdueDisputes.length} overdue disputes in ${duration}ms (${errors} errors)`);

      return {
        approved,
        errors,
        total: overdueDisputes.length,
        duration,
      };

    } catch (error: any) {
      console.error("❌ Auto-approval cron failed:", error.message);
      return { success: false, reason: error.message };
    }
  }
});
