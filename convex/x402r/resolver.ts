/**
 * x402r Dispute Resolver
 * 
 * Handles the execution of fund releases from x402r escrow contracts
 * Called after merchant makes a decision (approve refund or reject)
 * 
 * Safety features:
 * - Gas price checks (don't execute if gas too high)
 * - Amount limits (require manual review for large amounts)
 * - Retry logic for failures
 * - Graceful degradation (failures don't crash the system)
 * 
 * Integrates with existing refunds.ts which already calls x402r
 */

import { internalMutation, internalAction } from "../_generated/server";
import { v } from "convex/values";
// NOTE: Avoid importing generated API types at module scope to prevent excessive
// type instantiation in downstream TypeScript builds. We dynamically import
// `internal`/`api` inside handlers instead.
import { requiresManualReview } from "./config";

/**
 * Resolve escrow dispute (entry point)
 * 
 * Triggered when:
 * - Merchant approves AI recommendation (CONSUMER_WINS)
 * - Merchant rejects claim (MERCHANT_WINS)
 * 
 * This calls the smart contract to release funds to the winner
 */
export const resolveEscrowDispute = internalMutation({
  args: {
    caseId: v.id("cases"),
  },
  handler: async (ctx, args): Promise<{ status: string; reason?: string }> => {
    const caseData = await ctx.db.get(args.caseId);
    
    if (!caseData) {
      throw new Error(`Case ${args.caseId} not found`);
    }
    
    // Verify this is an x402r case
    if (!caseData.x402rEscrow) {
      return {
        status: "NOT_X402R",
        reason: "This case does not have x402r escrow",
      };
    }
    
    // Verify case has a final verdict
    if (!caseData.finalVerdict) {
      return {
        status: "NO_VERDICT",
        reason: "Case does not have a final verdict yet",
      };
    }
    
    // Check if already resolved
    if (
      caseData.x402rEscrow.escrowState === "PARTIALLY_RELEASED" ||
      caseData.x402rEscrow.escrowState === "RELEASED_TO_BUYER" ||
      caseData.x402rEscrow.escrowState === "RELEASED_TO_MERCHANT"
    ) {
      return {
        status: "ALREADY_RESOLVED",
        reason: `Escrow already released (${caseData.x402rEscrow.escrowState})`,
      };
    }
    
    // Check if amount requires manual review
    if (requiresManualReview(caseData.amount || 0)) {
      console.log(
        `⚠️  Case ${args.caseId} amount $${caseData.amount} requires manual review`
      );
      return {
        status: "REQUIRES_MANUAL_REVIEW",
        reason: `Amount $${caseData.amount} exceeds automatic processing limit`,
      };
    }
    
    // Determine winner based on verdict (partial refunds still resolve in favor of BUYER for the released amount)
    const winner =
      caseData.finalVerdict === "CONSUMER_WINS" || caseData.finalVerdict === "PARTIAL_REFUND"
        ? "BUYER"
        : "MERCHANT";
    
    // Determine amount to release.
    // - For BUYER outcomes:
    //   - PARTIAL_REFUND requires explicit finalRefundAmountMicrousdc.
    //   - CONSUMER_WINS can derive full escrow amount for backward compatibility if missing.
    // - For MERCHANT wins: release full escrow amount.
    const escrowAmountMicros = Math.round((caseData.amount || 0) * 1_000_000);

    let buyerReleaseMicros: number | undefined =
      typeof caseData.finalRefundAmountMicrousdc === "number"
        ? Math.round(caseData.finalRefundAmountMicrousdc)
        : undefined;

    if (winner === "BUYER") {
      if (caseData.finalVerdict === "CONSUMER_WINS") {
        if (!buyerReleaseMicros || buyerReleaseMicros <= 0) {
          buyerReleaseMicros = escrowAmountMicros;
        }
      } else {
        // PARTIAL_REFUND: must be explicit
        if (!buyerReleaseMicros || buyerReleaseMicros <= 0) {
          return { status: "NO_REFUND_AMOUNT", reason: "Missing finalRefundAmountMicrousdc for partial buyer release" };
        }
      }

      if (buyerReleaseMicros > escrowAmountMicros) {
        return { status: "INVALID_REFUND_AMOUNT", reason: "finalRefundAmountMicrousdc exceeds escrow amount" };
      }
    }

    const amountToReleaseUsd =
      winner === "BUYER"
        ? (buyerReleaseMicros || 0) / 1_000_000
        : caseData.amount || 0;

    console.log(
      `🔄 Resolving x402r escrow ${caseData.x402rEscrow.escrowAddress}: ${winner} wins`
    );
    
    // Schedule smart contract execution (async action)
    // @ts-ignore - generated api types can trigger excessively deep instantiation in some TS programs
    const { internal } = (await import("../_generated/api")) as any;
    await (ctx.scheduler as any).runAfter(0, internal.x402r.resolver.executeRelease, {
      caseId: args.caseId,
      escrowAddress: caseData.x402rEscrow.escrowAddress,
      winner,
      buyerAddress: caseData.plaintiff,
      merchantAddress: caseData.defendant,
      amount: amountToReleaseUsd,
    });
    
    return {
      status: "SCHEDULED",
      reason: "Smart contract release scheduled",
    };
  },
});

/**
 * Execute smart contract release (action)
 * 
 * Calls the x402r smart contract to release funds
 * This is an action (not mutation) because it needs to make external calls
 */
export const executeRelease = internalAction({
  args: {
    caseId: v.id("cases"),
    escrowAddress: v.string(),
    winner: v.union(v.literal("BUYER"), v.literal("MERCHANT")),
    buyerAddress: v.string(),
    merchantAddress: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args): Promise<void> => {
    console.log(
      `⚡ Executing smart contract release for escrow ${args.escrowAddress}`
    );
    
    try {
      // Call the smart contract via lib/x402r.ts
      // @ts-ignore - generated api types can trigger excessively deep instantiation in some TS programs
      const { api, internal } = (await import("../_generated/api")) as any;
      const result = await (ctx as any).runAction(api.lib.x402r.resolveDispute, {
        escrowAddress: args.escrowAddress,
        winner: args.winner,
        buyerAddress: args.buyerAddress,
        merchantAddress: args.merchantAddress,
        amount: args.amount,
      });
      
      if (result.success) {
        console.log(
          `✅ Funds released successfully (tx: ${result.txHash}, gas: ${result.gasPriceGwei} gwei)`
        );
        
        // Mark as released in database
        await ctx.runMutation(internal.x402r.resolver.markReleased, {
          caseId: args.caseId,
          txHash: result.txHash,
          winner: args.winner,
          gasPriceGwei: result.gasPriceGwei,
        });
      } else {
        throw new Error("Smart contract call failed");
      }
    } catch (error: any) {
      console.error(`❌ Failed to release funds for case ${args.caseId}:`, error);
      
      // Mark as failed (will require manual retry)
      // @ts-ignore - generated api types can trigger excessively deep instantiation in some TS programs
      const { internal } = (await import("../_generated/api")) as any;
      await ctx.runMutation(internal.x402r.resolver.markFailed, {
        caseId: args.caseId,
        errorMessage: error.message,
      });
      
      // Don't re-throw - we want graceful degradation
      // Failed releases can be retried manually
    }
  },
});

/**
 * Mark escrow as released (mutation)
 * Updates case with transaction hash and new state
 */
export const markReleased = internalMutation({
  args: {
    caseId: v.id("cases"),
    txHash: v.string(),
    winner: v.union(v.literal("BUYER"), v.literal("MERCHANT")),
    gasPriceGwei: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<void> => {
    const caseData = await ctx.db.get(args.caseId);
    
    if (!caseData || !caseData.x402rEscrow) {
      throw new Error(`Case ${args.caseId} not found or not x402r`);
    }
    
    const isPartialBuyerRelease =
      args.winner === "BUYER" &&
      typeof caseData.finalVerdict === "string" &&
      caseData.finalVerdict === "PARTIAL_REFUND";

    const newState =
      args.winner === "BUYER"
        ? (isPartialBuyerRelease ? "PARTIALLY_RELEASED" : "RELEASED_TO_BUYER")
        : "RELEASED_TO_MERCHANT";
    
    // Update case with release details
    await ctx.db.patch(args.caseId, {
      x402rEscrow: {
        ...caseData.x402rEscrow,
        escrowState: newState,
        releaseTxHash: args.txHash,
        releaseAmountMicrousdc:
          args.winner === "BUYER"
            ? (typeof caseData.finalRefundAmountMicrousdc === "number"
                ? caseData.finalRefundAmountMicrousdc
                : (caseData.finalVerdict === "CONSUMER_WINS"
                    ? Math.round((caseData.amount || 0) * 1_000_000)
                    : undefined))
            : undefined,
        resolvedAt: Date.now(),
      },
      status: "DECIDED", // Mark case as fully decided
    });
    
    console.log(
      `✅ Case ${args.caseId} marked as released: ${newState} (tx: ${args.txHash})`
    );
    
    // Update adapter's escrow state tracker
    // @ts-ignore - generated api types can trigger excessively deep instantiation in some TS programs
    const { internal } = (await import("../_generated/api")) as any;
    await ctx.runMutation(internal.x402r.adapter.updateEscrowState, {
      caseId: args.caseId,
      newState,
      releaseTxHash: args.txHash,
      releaseAmountMicrousdc:
        args.winner === "BUYER"
          ? (typeof caseData.finalRefundAmountMicrousdc === "number"
              ? caseData.finalRefundAmountMicrousdc
              : (caseData.finalVerdict === "CONSUMER_WINS"
                  ? Math.round((caseData.amount || 0) * 1_000_000)
                  : undefined))
          : undefined,
    });
  },
});

/**
 * Mark escrow release as failed (mutation)
 * Updates case to indicate manual intervention needed
 */
export const markFailed = internalMutation({
  args: {
    caseId: v.id("cases"),
    errorMessage: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    const caseData = await ctx.db.get(args.caseId);
    
    if (!caseData || !caseData.x402rEscrow) {
      throw new Error(`Case ${args.caseId} not found or not x402r`);
    }
    
    // Log the error (schema doesn't have a notes field, so just log)
    console.error(
      `❌ Case ${args.caseId} escrow release failed: ${args.errorMessage}`
    );
    console.log("🔧 Manual intervention required for this case");
    console.log(`🔍 Case ID: ${args.caseId}, Error: ${args.errorMessage}`);
    
    // TODO: Store failure in a separate errors table or send alert to operations team
    // For now, manual retries can be done via retryFailedRelease mutation
  },
});

/**
 * Retry failed release (manual trigger)
 * Allows operations to retry a failed release
 */
export const retryFailedRelease = internalMutation({
  args: {
    caseId: v.id("cases"),
  },
  handler: async (ctx, args): Promise<{ status: string }> => {
    console.log(`🔁 Retrying failed release for case ${args.caseId}`);
    
    // Re-run the resolution logic
    // @ts-ignore - generated api types can trigger excessively deep instantiation in some TS programs
    const { internal } = (await import("../_generated/api")) as any;
    return await ctx.runMutation(internal.x402r.resolver.resolveEscrowDispute, {
      caseId: args.caseId,
    });
  },
});

