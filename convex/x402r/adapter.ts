/**
 * x402r Dispute Adapter
 * 
 * Converts x402r escrow disputes into the existing cases table format
 * This allows reuse of all existing AI analysis, workflows, and dashboard logic
 * 
 * Key principle: Additive, not invasive
 * - Uses existing cases table structure
 * - Populates x402rEscrow field (already exists in schema)
 * - Triggers existing AI workflow
 * - No changes to existing dispute resolution logic
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

/**
 * Convert x402r escrow dispute to case format
 * 
 * Creates a case with:
 * - Standard case fields (plaintiff, defendant, amount, etc.)
 * - x402rEscrow field populated with escrow details
 * - Evidence from x402r payload
 * - Type set to "PAYMENT_DISPUTE" to reuse existing workflow
 */
export const convertX402rDisputeToCase = internalMutation({
  args: {
    escrowAddress: v.string(),
    buyer: v.string(),
    merchant: v.string(),
    amount: v.number(),
    currency: v.string(),
    blockchain: v.string(),
    evidence: v.string(), // JSON string of request/response
    disputeReason: v.string(),
    description: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx, args): Promise<string> => {
    const now = Date.now();
    
    // Parse evidence
    let evidenceData;
    try {
      evidenceData = JSON.parse(args.evidence);
    } catch (error) {
      console.error("❌ Failed to parse evidence:", error);
      evidenceData = { raw: args.evidence };
    }
    
    // Create case in cases table
    // This reuses the EXISTING schema with x402rEscrow field
    const caseId = await ctx.db.insert("cases", {
      // Standard case fields
      plaintiff: args.buyer, // Buyer is the plaintiff
      defendant: args.merchant, // Merchant is the defendant
      amount: args.amount,
      currency: args.currency,
      description: args.description,
      
      // Case metadata
      type: "PAYMENT_DISPUTE", // Use existing type to trigger AI workflow
      status: "FILED", // Use valid schema status (FILED, not RECEIVED)
      category: "payment_failure", // Use 'category' not 'disputeCategory'
      
      // x402r specific data (uses existing x402rEscrow field in schema)
      x402rEscrow: {
        escrowAddress: args.escrowAddress,
        escrowState: "DISPUTED", // Escrow is now in disputed state
        blockchain: args.blockchain,
        createdAt: args.timestamp,
        // depositTxHash and releaseTxHash will be filled later
      },
      
      // Evidence IDs (x402r evidence is stored directly in the webhook payload, not as separate evidence manifests)
      evidenceIds: [], // No separate evidence manifests for x402r, evidence is in the dispute payload
      
      // Timestamps
      createdAt: now,
      filedAt: now,
      
      // Verdict will be set after AI analysis + human review
      // finalVerdict will trigger refund execution via existing logic
    });
    
    console.log(`✅ Created case ${caseId} for x402r escrow dispute ${args.escrowAddress}`);
    
    // Trigger AI workflow (reuses existing payment dispute workflow)
    // This will:
    // 1. Analyze the evidence
    // 2. Make a recommendation
    // 3. Queue for merchant review
    // 4. On approval, execute refund via x402r smart contract
    await ctx.scheduler.runAfter(
      0,
      internal.workflows.paymentDisputeWorkflow,
      { caseId }
    );
    
    console.log(`🤖 Triggered AI workflow for case ${caseId}`);
    
    return caseId;
  },
});

/**
 * Get x402r escrow details from a case
 * Helper function to extract escrow information
 */
export const getEscrowDetailsFromCase = internalMutation({
  args: {
    caseId: v.id("cases"),
  },
  handler: async (ctx, args): Promise<{
    hasEscrow: boolean;
    escrowAddress?: string;
    escrowState?: string;
    blockchain?: string;
  }> => {
    const caseData = await ctx.db.get(args.caseId);
    
    if (!caseData) {
      throw new Error(`Case ${args.caseId} not found`);
    }
    
    // Check if this case has x402r escrow
    if (!caseData.x402rEscrow) {
      return { hasEscrow: false };
    }
    
    return {
      hasEscrow: true,
      escrowAddress: caseData.x402rEscrow.escrowAddress,
      escrowState: caseData.x402rEscrow.escrowState,
      blockchain: caseData.x402rEscrow.blockchain,
    };
  },
});

/**
 * Update escrow state in case
 * Called when escrow state changes (e.g., funds released)
 */
export const updateEscrowState = internalMutation({
  args: {
    caseId: v.id("cases"),
    newState: v.union(
      v.literal("PENDING"),
      v.literal("HELD"),
      v.literal("DISPUTED"),
      v.literal("PARTIALLY_RELEASED"),
      v.literal("RELEASED_TO_BUYER"),
      v.literal("RELEASED_TO_MERCHANT")
    ),
    releaseTxHash: v.optional(v.string()),
    releaseAmountMicrousdc: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<void> => {
    const caseData = await ctx.db.get(args.caseId);
    
    if (!caseData) {
      throw new Error(`Case ${args.caseId} not found`);
    }
    
    if (!caseData.x402rEscrow) {
      throw new Error(`Case ${args.caseId} is not an x402r escrow case`);
    }
    
    // Update escrow state
    await ctx.db.patch(args.caseId, {
      x402rEscrow: {
        ...caseData.x402rEscrow,
        escrowState: args.newState,
        releaseTxHash: args.releaseTxHash,
        releaseAmountMicrousdc: args.releaseAmountMicrousdc,
        resolvedAt:
          args.newState === "PARTIALLY_RELEASED" || args.newState.startsWith("RELEASED")
            ? Date.now()
            : undefined,
      },
    });
    
    console.log(
      `✅ Updated escrow state for case ${args.caseId}: ${args.newState}${
        args.releaseTxHash ? ` (tx: ${args.releaseTxHash})` : ""
      }`
    );
  },
});

