import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

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
  internal.crons.updateSystemStatsCache,
  {}
);

// Process filed cases every 10 minutes
crons.interval(
  "process filed cases",
  { minutes: 10 },
  internal.crons.processFiledCases,
  {}
);

// Auto-approve overdue disputes (Regulation E compliance)
crons.interval(
  "auto approve overdue disputes",
  { hours: 6 }, // Run 4x per day
  internal.crons.autoApproveOverdueDisputes,
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

      // Generate amount based on random tier
      const tierRoll = Math.random();
      let amount: number;
      let tier: string;

      if (tierRoll < 0.60) {
        // 60% micro (<$1)
        amount = 0.10 + (Math.random() * 0.89);
        tier = "micro";
      } else if (tierRoll < 0.85) {
        // 25% small ($1-10)
        amount = 1 + (Math.random() * 9);
        tier = "small";
      } else if (tierRoll < 0.95) {
        // 10% medium ($10-100)
        amount = 10 + (Math.random() * 90);
        tier = "medium";
      } else if (tierRoll < 0.99) {
        // 4% large ($100-1k)
        amount = 100 + (Math.random() * 900);
        tier = "large";
      } else {
        // 1% enterprise (>$1k)
        amount = 1000 + (Math.random() * 4000);
        tier = "enterprise";
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

      // Create the payment dispute
      const result: any = await ctx.runMutation(api.paymentDisputes.receivePaymentDispute, {
        transactionId,
        amount,
        currency: "USD",
        paymentProtocol: Math.random() < 0.5 ? "ACP" : "ATXP",
        plaintiff: `consumer:${consumer.toLowerCase()}@demo.com`,
        defendant: `merchant:${merchant.toLowerCase()}@demo.com`,
        disputeReason: reason as any,
        description: descriptions[reason] || `Dispute regarding transaction ${transactionId}`,
      });

      console.log(`✅ Payment dispute created: $${amount.toFixed(2)} (${tier} tier) - ${reason}`);
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

      // Get payment disputes (type=PAYMENT cases)
      const allPaymentDisputes = await ctx.db
        .query("cases")
        .filter((q) => q.eq(q.field("type"), "PAYMENT"))
        .collect();

      // Calculate stats
      const totalDisputes = allPaymentDisputes.length;
      const microDisputes = allPaymentDisputes.filter(d => (d.amount || 0) < 1).length;
      const autoResolved = allPaymentDisputes.filter(d => !d.humanReviewRequired).length;

      // Calculate total fees
      const totalFees = allPaymentDisputes.reduce((sum, d) => {
        const fee = d.paymentDetails?.disputeFee || 0;
        return sum + fee;
      }, 0);

      // Group by verdict
      const verdictCounts = allPaymentDisputes.reduce((acc: any, d) => {
        const verdict = d.aiRecommendation?.verdict || d.finalVerdict || "PENDING";
        acc[verdict] = (acc[verdict] || 0) + 1;
        return acc;
      }, {});

      const stats = {
        totalDisputes,
        microDisputes,
        autoResolved,
        totalFees,
        verdictCounts,
        updatedAt: Date.now(),
      };

      console.log(`✅ Stats updated: ${totalDisputes} disputes, $${totalFees.toFixed(2)} in fees`);
      console.log(`   Micro: ${microDisputes}, Auto-resolved: ${autoResolved}`);

      return stats;

    } catch (error: any) {
      console.error("❌ Stats update failed:", error.message);
      return { success: false, reason: error.message };
    }
  }
});

// Manual trigger for demo dispute generation (can be called from frontend)
export const triggerDisputeGeneration = mutation({
  args: {},
  handler: async (ctx): Promise<any> => {
    return await ctx.runMutation(internal.crons.generatePaymentDisputeDemo, {});
  }
});

// =================================================================
// PROCESS FILED CASES (AUTO-RESOLVE STUCK CASES)
// =================================================================

/**
 * Process cases stuck in FILED status
 *
 * This cron job runs every 2 minutes and automatically processes cases that are:
 * - In FILED status for > 5 minutes (enough time for parties to submit evidence)
 * - Have not been processed by the court engine yet
 *
 * Why this is needed:
 * - Cases can get stuck in FILED status if no one manually triggers court workflow
 * - Payment disputes should auto-resolve within minutes
 * - Agent disputes should move to panel review automatically
 */
export const processFiledCases = internalMutation({
  args: {},
  handler: async (ctx) => {
    try {
      const startTime = Date.now();
      console.log("⚖️  Processing filed cases with AI analysis...");

      // Get all cases in FILED status
      const filedCases = await ctx.db
        .query("cases")
        .filter((q) => q.eq(q.field("status"), "FILED"))
        .collect();

      if (filedCases.length === 0) {
        console.log("✅ No filed cases found");
        return { processed: 0, message: "No cases to process" };
      }

      console.log(`📋 Found ${filedCases.length} cases in FILED status`);

      let processed = 0;
      let errors = 0;
      let skipped = 0;

      for (const caseData of filedCases) {
        try {
          // Check if already analyzed
          const alreadyAnalyzed = await hasAIRecommendation(ctx, caseData._id);

          if (alreadyAnalyzed) {
            skipped++;
            console.log(`  ⏭️  Skipped case ${caseData._id} (already analyzed)`);
            continue;
          }

          // Check if organization has AI enabled
          const org = await getOrgForCase(ctx, caseData);
          if (org && org.aiEnabled === false) {
            skipped++;
            console.log(`  ⏭️  Skipped case ${caseData._id} (AI disabled for organization ${org._id})`);
            continue;
          }

          // Trigger AI analysis using processWithAI (no age check - process immediately)
          await ctx.scheduler.runAfter(0, api.paymentDisputes.processWithAI, {
            caseId: caseData._id,
          });
          processed++;
          console.log(`  ✅ Triggered AI analysis for case ${caseData._id}`);
        } catch (error: any) {
          errors++;
          console.error(`  ❌ Failed to process case ${caseData._id}:`, error.message);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`⚖️  Processed ${processed}/${filedCases.length} cases in ${duration}ms (${errors} errors, ${skipped} skipped)`);

      return {
        processed,
        errors,
        skipped,
        total: filedCases.length,
        duration,
      };

    } catch (error: any) {
      console.error("❌ Filed case processing failed:", error.message);
      return { success: false, reason: error.message };
    }
  }
});

// =================================================================
// HELPER FUNCTIONS
// =================================================================

/**
 * Get organization for a case
 */
async function getOrgForCase(ctx: any, caseData: any) {
  // Cases now have reviewerOrganizationId directly
  if (caseData?.reviewerOrganizationId) {
    return await ctx.db.get(caseData.reviewerOrganizationId);
  }

  // Fallback: return null (use default settings)
  return null;
}

/**
 * Check if case already has AI recommendation
 */
async function hasAIRecommendation(ctx: any, caseId: any) {
  // Check case table for AI recommendation (single source of truth)
  const caseData = await ctx.db.get(caseId);
  return !!caseData?.aiRecommendation;
}

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
