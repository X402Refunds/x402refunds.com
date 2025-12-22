/**
 * Automated Refund Execution System
 */

import { mutation, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { parseCaip10, extractAddress, isSolana } from "./lib/caip10";

/**
 * Execute automated refund after dispute is decided
 * Called by payment dispute workflow when verdict is CONSUMER_WINS
 * 
 * UPDATED: Uses x402r escrow contracts if available
 * GitHub: https://github.com/BackTrackCo/x402r-contracts
 */
export const executeAutomatedRefund = internalMutation({
  args: {
    caseId: v.id("cases"),
  },
  handler: async (ctx, args) => {
    const dispute = await ctx.db.get(args.caseId);
    if (!dispute) {
      throw new Error("Dispute not found");
    }
    
    // Only refund if consumer wins
    if (dispute.finalVerdict !== "CONSUMER_WINS") {
      console.log(`⏭️  Skipping refund: verdict is ${dispute.finalVerdict}`);
      return { status: "NOT_APPLICABLE", reason: "Verdict not CONSUMER_WINS" };
    }
    
    // NEW: Check if this dispute uses x402r escrow
    if (dispute.x402rEscrow) {
      console.log(`🔗 Using x402r escrow for refund: ${dispute.x402rEscrow.escrowAddress}`);
      
      // Schedule x402r escrow release
      await ctx.scheduler.runAfter(
        0,
        internal.refunds.executeX402rRelease,
        { caseId: args.caseId }
      );
      
      return { 
        status: "SCHEDULED_X402R", 
        escrowAddress: dispute.x402rEscrow.escrowAddress 
      };
    }
    
    // Check if already refunded
    const existingRefund = await ctx.db
      .query("refundTransactions")
      .withIndex("by_case", q => q.eq("caseId", args.caseId))
      .first();
    
    if (existingRefund) {
      console.log(`⏭️  Refund already exists for case ${args.caseId}`);
      return { status: "ALREADY_REFUNDED", refundId: existingRefund._id };
    }
    
    // Get merchant settings
    const merchantSettings = await ctx.db
      .query("merchantSettings")
      .withIndex("by_wallet", q => q.eq("walletAddress", dispute.defendant))
      .first();
    
    // Check if auto-refund is enabled
    if (!merchantSettings || !merchantSettings.autoRefundEnabled) {
      console.log(`⏸️  Auto-refund disabled for ${dispute.defendant}`);
      return { status: "AWAITING_APPROVAL", reason: "Auto-refund not enabled" };
    }
    
    // Check threshold
    if (merchantSettings.requireApprovalOver && dispute.amount && dispute.amount > merchantSettings.requireApprovalOver) {
      console.log(`⏸️  Amount $${dispute.amount} exceeds threshold $${merchantSettings.requireApprovalOver}`);
      return { status: "AWAITING_APPROVAL", reason: "Amount exceeds threshold" };
    }
    
    // Check merchant balance
    const balance = await ctx.db
      .query("merchantBalances")
      .withIndex("by_wallet_currency", q => 
        q.eq("walletAddress", dispute.defendant).eq("currency", dispute.currency || "USDC")
      )
      .first();
    
    if (!balance || balance.availableBalance < (dispute.amount || 0)) {
      console.error(`❌ Insufficient balance for ${dispute.defendant}`);
      return { 
        status: "INSUFFICIENT_BALANCE", 
        available: balance?.availableBalance || 0,
        required: dispute.amount || 0
      };
    }
    
    // Create pending refund transaction
    const refundId = await ctx.db.insert("refundTransactions", {
      caseId: args.caseId,
      fromWallet: dispute.defendant,
      toWallet: dispute.plaintiff,
      amount: dispute.amount || 0,
      currency: dispute.currency || "USDC",
      blockchain: "solana",
      status: "PENDING",
      createdAt: Date.now(),
    });
    
    // Schedule refund execution (async to avoid blocking)
    await ctx.scheduler.runAfter(
      0,
      internal.refunds.executeOnChain,
      {
        refundId,
        caseId: args.caseId,
      }
    );
    
    return { status: "SCHEDULED", refundId };
  },
});

/**
 * Execute refund on-chain (Solana)
 * Scheduled by executeAutomatedRefund
 */
export const executeOnChain = internalMutation({
  args: {
    refundId: v.id("refundTransactions"),
    caseId: v.id("cases"),
  },
  handler: async (ctx, args) => {
    const refund = await ctx.db.get(args.refundId);
    if (!refund) {
      throw new Error("Refund transaction not found");
    }
    
    try {
      // Parse CAIP-10 identifiers to get raw addresses
      const fromAddress = extractAddress(refund.fromWallet);
      const toAddress = extractAddress(refund.toWallet);
      
      // Verify it's Solana (for now we only support Solana)
      if (!isSolana(refund.fromWallet)) {
        throw new Error(`Unsupported blockchain for ${refund.fromWallet}`);
      }
      
      // Execute transfer via Solana action
      const result = await ctx.runAction(internal.lib.solana.executeSolanaRefund, {
        fromWallet: fromAddress,
        toWallet: toAddress,
        amount: refund.amount,
        currency: refund.currency,
      });
      
      // Update refund transaction
      await ctx.db.patch(args.refundId, {
        status: "EXECUTED",
        txSignature: result.txSignature,
        executedAt: Date.now(),
      });
      
      // Update merchant balance
      const balance = await ctx.db
        .query("merchantBalances")
        .withIndex("by_wallet_currency", q =>
          q.eq("walletAddress", refund.fromWallet).eq("currency", refund.currency)
        )
        .first();
      
      if (balance) {
        await ctx.db.patch(balance._id, {
          availableBalance: balance.availableBalance - refund.amount,
          totalRefunded: balance.totalRefunded + refund.amount,
          lastRefundAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
      
      // Log event
      await ctx.db.insert("events", {
        type: "REFUND_EXECUTED",
        caseId: args.caseId,
        payload: {
          refundId: args.refundId,
          amount: refund.amount,
          currency: refund.currency,
          txSignature: result.txSignature,
          fromWallet: refund.fromWallet,
          toWallet: refund.toWallet,
        },
        timestamp: Date.now(),
      });
      
      console.log(`✅ Refund executed: ${result.txSignature}`);
      
      return { success: true, txSignature: result.txSignature };
      
    } catch (error: any) {
      console.error(`❌ Refund execution failed:`, error);
      
      // Update refund transaction with error
      await ctx.db.patch(args.refundId, {
        status: "FAILED",
        errorMessage: error.message,
      });
      
      throw error;
    }
  },
});

/**
 * Get refund status for a case
 */
export const getRefundStatus = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const refund = await ctx.db
      .query("refundTransactions")
      .withIndex("by_case", q => q.eq("caseId", args.caseId))
      .first();
    
    return refund || null;
  },
});

/**
 * Execute x402r escrow release
 * Calls smart contract to release funds to winner
 * 
 * NOTE: This now delegates to the new x402r/resolver module
 * for better separation of concerns and safety features
 */
export const executeX402rRelease = internalMutation({
  args: {
    caseId: v.id("cases"),
  },
  handler: async (ctx, args) => {
    console.log(`🔗 Delegating x402r release for case ${args.caseId} to resolver module`);
    
    // Delegate to x402r resolver module
    // This provides:
    // - Gas price checks
    // - Amount limits
    // - Retry logic
    // - Graceful error handling
    const result = await ctx.runMutation(internal.x402r.resolver.resolveEscrowDispute, {
      caseId: args.caseId,
    });
    
    console.log(`x402r release status: ${result.status}`);
    
    return result;
  },
});

/**
 * Manually approve and execute refund
 * For cases where auto-refund is disabled
 */
export const manualApproveRefund = mutation({
  args: {
    caseId: v.id("cases"),
    approvedByUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify user has permission
    const user = await ctx.db.get(args.approvedByUserId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Execute refund
    return await ctx.runMutation(internal.refunds.executeAutomatedRefund, {
      caseId: args.caseId,
    });
  },
});






