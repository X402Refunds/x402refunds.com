/**
 * Automated Refund Execution System
 */

// @ts-nocheck
import { mutation, internalAction, internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { extractAddress, isSolana } from "./lib/caip10";
import { executeSolanaRefundImpl } from "./lib/solana";
import type { Id } from "./_generated/dataModel";

function isCoinbaseRefundsEnabled(): boolean {
  return process.env.COINBASE_REFUNDS_ENABLED === "true";
}

/**
 * Execute automated refund after dispute is decided
 * Called by payment dispute workflow when verdict is CONSUMER_WINS
 * 
 * UPDATED: Uses x402r escrow contracts if available
 * GitHub: https://github.com/BackTrackCo/x402r-contracts
 */
async function executeAutomatedRefundImpl(
  ctx: { db: any; scheduler: any },
  caseId: Id<"cases">,
  opts?: { force?: boolean },
): Promise<any> {
  const dispute = await ctx.db.get(caseId);
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
      internal.refunds.executeX402rRelease as any,
      { caseId }
    );
    
    return { 
      status: "SCHEDULED_X402R", 
      escrowAddress: dispute.x402rEscrow.escrowAddress 
    };
  }

  // Check if already refunded
  const existingRefund = await ctx.db
    .query("refundTransactions")
    .withIndex("by_case", (q: any) => q.eq("caseId", caseId))
    .first();
  
  if (existingRefund) {
    console.log(`⏭️  Refund already exists for case ${caseId}`);
    return { status: "ALREADY_REFUNDED", refundId: existingRefund._id };
  }

  // NEW: Refund-to-source (platform wallet) flow for payment disputes.
  // Support both the new ingestion shape (paymentDetails.transactionHash/blockchain/amountMicrousdc)
  // and the older shape used by the dashboard card (paymentDetails.crypto.transactionHash/blockchain).
  if (dispute.type === "PAYMENT") {
    const pd: any = dispute.paymentDetails || {};
    const txHash: string | undefined = pd.transactionHash || pd.crypto?.transactionHash;
    const rawChain: string | undefined = pd.blockchain || pd.crypto?.blockchain;
    const chain = typeof rawChain === "string" ? rawChain.toLowerCase() : undefined;

    const amountMicrousdc: number | undefined =
      typeof pd.amountMicrousdc === "number"
        ? pd.amountMicrousdc
        : typeof dispute.amount === "number"
          ? Math.round(dispute.amount * 1_000_000)
          : undefined;

    const chainOk = chain === "base" || chain === "solana";
    const txOk = typeof txHash === "string" && /^0x[a-fA-F0-9]{64}$/.test(txHash);
    const amountOk = typeof amountMicrousdc === "number" && Number.isFinite(amountMicrousdc) && amountMicrousdc > 0;

    if (txOk && chainOk && amountOk) {
      // Backfill into the canonical fields used by the refund engine, so subsequent runs are consistent.
      if (!pd.transactionHash || !pd.blockchain || typeof pd.amountMicrousdc !== "number") {
        await ctx.db.patch(caseId, {
          paymentDetails: {
            ...(pd || {}),
            transactionHash: txHash,
            blockchain: chain,
            amountMicrousdc,
          },
        });
      }

      await ctx.scheduler.runAfter(0, internal.refunds.createRefundAttempt as any, { caseId });
      return { status: "SCHEDULED_REFUND_ATTEMPT" };
    }

    // If we can't deterministically refund-to-source, create a failure record so the UI can show why.
    const missing: string[] = [];
    if (!txOk) missing.push("transactionHash");
    if (!chainOk) missing.push("blockchain");
    if (!amountOk) missing.push("amountMicrousdc");

    const refundId = await ctx.db.insert("refundTransactions", {
      caseId,
      fromWallet: "platform",
      toWallet: dispute.plaintiff || "",
      amount: typeof dispute.amount === "number" ? dispute.amount : 0,
      currency: dispute.currency || "USDC",
      blockchain: chainOk ? chain : "base",
      status: "FAILED",
      createdAt: Date.now(),
      failureCode: "MISSING_PAYMENT_DETAILS",
      failureReason: `Cannot issue refund-to-source: missing/invalid ${missing.join(", ")}`,
    });

    return { status: "FAILED", refundId, reason: "MISSING_PAYMENT_DETAILS" };
  }
  
  // Get merchant settings
  const merchantSettings = await ctx.db
    .query("merchantSettings")
    .withIndex("by_wallet", (q: any) => q.eq("walletAddress", dispute.defendant))
    .first();
  
  const force = Boolean(opts?.force);

  // Check if auto-refund is enabled (unless forced by a human decision)
  if (!force && (!merchantSettings || !merchantSettings.autoRefundEnabled)) {
    console.log(`⏸️  Auto-refund disabled for ${dispute.defendant}`);
    return { status: "AWAITING_APPROVAL", reason: "Auto-refund not enabled" };
  }
  
  // Check threshold
  if (
    !force &&
    merchantSettings.requireApprovalOver &&
    dispute.amount &&
    dispute.amount > merchantSettings.requireApprovalOver
  ) {
    console.log(`⏸️  Amount $${dispute.amount} exceeds threshold $${merchantSettings.requireApprovalOver}`);
    return { status: "AWAITING_APPROVAL", reason: "Amount exceeds threshold" };
  }
  
  // Check merchant balance
  const balance = await ctx.db
    .query("merchantBalances")
    .withIndex("by_wallet_currency", (q: any) =>
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
    caseId,
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
    internal.refunds.executeOnChain as any,
    {
      refundId,
      caseId,
    }
  );
  
  return { status: "SCHEDULED", refundId };
}

export const executeAutomatedRefund = internalMutation({
  args: {
    caseId: v.id("cases"),
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await executeAutomatedRefundImpl(ctx, args.caseId, { force: args.force });
  },
});

/**
 * Create a refund attempt record and (optionally) send via Coinbase.
 * This is idempotent by (sourceChain, sourceTxHash, sourceTransferLogIndex).
 */
export const createRefundAttempt = internalAction({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args): Promise<any> => {
    const dispute: any = await ctx.runQuery(api.cases.getCaseById, { caseId: args.caseId });
    if (!dispute) throw new Error("Dispute not found");

    if (dispute.finalVerdict !== "CONSUMER_WINS") {
      return { status: "NOT_APPLICABLE", reason: "Verdict not CONSUMER_WINS" };
    }
    if (!dispute.reviewerOrganizationId) {
      return { status: "NO_REVIEWER_ORG", reason: "Dispute is not assigned to an organization" };
    }

    const pd = dispute.paymentDetails;
    const sourceChain = pd?.blockchain;
    const sourceTxHash = pd?.transactionHash;
    const amountMicrousdc = pd?.amountMicrousdc;

    if (!sourceChain || !sourceTxHash || typeof amountMicrousdc !== "number") {
      return {
        status: "MISSING_PAYMENT_DETAILS",
        reason: "Missing verified paymentDetails (blockchain, transactionHash, amountMicrousdc)",
      };
    }

    const verify = await ctx.runAction(api.lib.blockchain.verifyUsdcTransferByAmount, {
      blockchain: sourceChain,
      transactionHash: sourceTxHash,
      expectedAmountMicrousdc: amountMicrousdc,
    });

    if (!verify.ok) {
      const status =
        verify.code === "NO_MATCH"
          ? "INVALID_PROOF"
          : verify.code === "MULTI_MATCH"
            ? "AMBIGUOUS_PROOF"
            : "FAILED";
      const inserted = await ctx.runMutation(internal.refunds.insertRefundFailure, {
        caseId: args.caseId,
        sourceChain,
        sourceTxHash,
        sourceTransferLogIndex: typeof pd?.sourceTransferLogIndex === "number" ? pd.sourceTransferLogIndex : undefined,
        amountMicrousdc,
        status,
        failureCode: verify.code,
        failureReason: verify.message,
      });
      return { status, refundId: inserted.refundId };
    }

    const logIndex = typeof pd?.sourceTransferLogIndex === "number" ? pd.sourceTransferLogIndex : verify.logIndex;
    const created = await ctx.runMutation(internal.refunds.createRefundAttemptRecord, {
      caseId: args.caseId,
      organizationId: dispute.reviewerOrganizationId,
      sourceChain,
      sourceTxHash,
      sourceTransferLogIndex: logIndex,
      amountMicrousdc,
      refundToAddress: verify.payerAddress,
    });

    if (created.status === "PENDING_SEND" && isCoinbaseRefundsEnabled()) {
      await ctx.scheduler.runAfter(0, internal.refunds.sendPendingRefund as any, { refundId: created.refundId });
    }

    return created;
  },
});

/**
 * Send a pending refund via Coinbase, and roll back credits on failure.
 */
export const sendPendingRefund = internalAction({
  args: { refundId: v.id("refundTransactions") },
  handler: async (ctx, args): Promise<any> => {
    const refund: any = await ctx.runQuery(internal.refunds.getRefundTransaction, { refundId: args.refundId });
    if (!refund) throw new Error("Refund transaction not found");
    if (refund.status !== "PENDING_SEND") return { status: "SKIPPED" };

    const dispute: any = await ctx.runQuery(api.cases.getCaseById, { caseId: refund.caseId });
    if (!dispute || !dispute.reviewerOrganizationId) {
      await ctx.runMutation(internal.refunds.markRefundFailed, {
        refundId: args.refundId,
        status: "FAILED",
        failureCode: "NO_REVIEWER_ORG",
        failureReason: "Case missing reviewerOrganizationId at send time",
      });
      return { status: "FAILED" };
    }

    const amountMicrousdc = refund.amountMicrousdc ?? Math.round((refund.amount || 0) * 1_000_000);
    const toAddress = refund.refundToAddress || refund.toWallet;

    const send = await ctx.runAction(api.lib.coinbase.sendUsdcBase, {
      toAddress,
      amountMicrousdc,
    });

    if (!send.ok) {
      await ctx.runMutation(internal.refunds.rollbackAndFailRefund, {
        refundId: args.refundId,
        organizationId: dispute.reviewerOrganizationId,
        amountMicrousdc,
        status: send.code === "COINBASE_DISABLED" ? "COINBASE_DISABLED" : "FAILED",
        failureCode: send.code,
        failureReason: send.message,
      });
      return { status: "FAILED", code: send.code };
    }

    await ctx.runMutation(internal.refunds.markRefundExecuted, {
      refundId: args.refundId,
      providerTransferId: send.providerTransferId,
      refundTxHash: send.txHash,
      explorerUrl: send.explorerUrl,
    });

    return { status: "EXECUTED", refundId: args.refundId };
  },
});

export const getRefundTransaction = internalQuery({
  args: { refundId: v.id("refundTransactions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.refundId);
  },
});

export const insertRefundFailure = internalMutation({
  args: {
    caseId: v.id("cases"),
    sourceChain: v.union(v.literal("base"), v.literal("solana")),
    sourceTxHash: v.string(),
    sourceTransferLogIndex: v.optional(v.number()),
    amountMicrousdc: v.number(),
    status: v.string(),
    failureCode: v.string(),
    failureReason: v.string(),
  },
  handler: async (ctx, args) => {
    const refundId = await ctx.db.insert("refundTransactions", {
      caseId: args.caseId,
      fromWallet: "platform",
      toWallet: "",
      amount: args.amountMicrousdc / 1_000_000,
      currency: "USDC",
      blockchain: args.sourceChain,
      status: args.status as any,
      errorMessage: args.failureReason,
      createdAt: Date.now(),
      sourceChain: args.sourceChain,
      sourceTxHash: args.sourceTxHash,
      sourceTransferLogIndex: args.sourceTransferLogIndex,
      amountMicrousdc: args.amountMicrousdc,
      failureCode: args.failureCode,
      failureReason: args.failureReason,
    });
    return { refundId };
  },
});

export const createRefundAttemptRecord = internalMutation({
  args: {
    caseId: v.id("cases"),
    organizationId: v.id("organizations"),
    sourceChain: v.union(v.literal("base"), v.literal("solana")),
    sourceTxHash: v.string(),
    sourceTransferLogIndex: v.number(),
    amountMicrousdc: v.number(),
    refundToAddress: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    const existing = await ctx.db
      .query("refundTransactions")
      .withIndex("by_source_triplet", (q) =>
        q
          .eq("sourceChain", args.sourceChain)
          .eq("sourceTxHash", args.sourceTxHash)
          .eq("sourceTransferLogIndex", args.sourceTransferLogIndex)
      )
      .first();
    if (existing) {
      // Allow retry for Coinbase send failures (e.g., insufficient ETH for gas on Base)
      // by re-debiting credits and moving the record back to PENDING_SEND.
      const retryableCoinbaseFailure =
        existing.provider === "coinbase" &&
        (existing.status === "FAILED" || existing.status === "COINBASE_DISABLED") &&
        (existing.failureCode === "COINBASE_SEND_FAILED" || existing.failureCode === "COINBASE_DISABLED");

      if (!retryableCoinbaseFailure) {
        return { status: "ALREADY_EXISTS", refundId: existing._id };
      }

      const debitRes = await ctx.runMutation(internal.refundCredits.debitRefundAmount as any, {
        organizationId: args.organizationId,
        amountMicrousdc: args.amountMicrousdc,
      });

      if (!debitRes.ok) {
        await ctx.db.patch(existing._id, {
          status: "INSUFFICIENT_CREDITS",
          errorMessage: debitRes.message,
          failureCode: debitRes.code,
          failureReason: debitRes.message,
        });
        return { status: "INSUFFICIENT_CREDITS", refundId: existing._id };
      }

      await ctx.db.patch(existing._id, {
        status: "PENDING_SEND",
        // Keep for audit, but clear failure fields so the UI reflects the retry attempt.
        failureCode: undefined,
        failureReason: undefined,
        errorMessage: undefined,
        // Ensure these are present in case they were missing in older rows.
        amountMicrousdc: args.amountMicrousdc,
        refundToAddress: args.refundToAddress,
        provider: "coinbase",
      });

      return { status: "PENDING_SEND", refundId: existing._id, retried: true };
    }

    const debitRes = await ctx.runMutation(internal.refundCredits.debitRefundAmount as any, {
      organizationId: args.organizationId,
      amountMicrousdc: args.amountMicrousdc,
    });
    if (!debitRes.ok) {
      const refundId = await ctx.db.insert("refundTransactions", {
        caseId: args.caseId,
        fromWallet: "platform",
        toWallet: args.refundToAddress,
        amount: args.amountMicrousdc / 1_000_000,
        currency: "USDC",
        blockchain: args.sourceChain,
        status: "INSUFFICIENT_CREDITS",
        errorMessage: debitRes.message,
        createdAt: Date.now(),
        sourceChain: args.sourceChain,
        sourceTxHash: args.sourceTxHash,
        sourceTransferLogIndex: args.sourceTransferLogIndex,
        amountMicrousdc: args.amountMicrousdc,
        refundToAddress: args.refundToAddress,
        failureCode: debitRes.code,
        failureReason: debitRes.message,
        provider: "coinbase",
      });
      return { status: "INSUFFICIENT_CREDITS", refundId };
    }

    const refundId = await ctx.db.insert("refundTransactions", {
      caseId: args.caseId,
      fromWallet: "platform",
      toWallet: args.refundToAddress,
      amount: args.amountMicrousdc / 1_000_000,
      currency: "USDC",
      blockchain: args.sourceChain,
      status: "PENDING_SEND",
      createdAt: Date.now(),
      sourceChain: args.sourceChain,
      sourceTxHash: args.sourceTxHash,
      sourceTransferLogIndex: args.sourceTransferLogIndex,
      amountMicrousdc: args.amountMicrousdc,
      refundToAddress: args.refundToAddress,
      provider: "coinbase",
    });

    return { status: "PENDING_SEND", refundId };
  },
});

/**
 * Retry a failed refund-to-source attempt (Coinbase).
 *
 * Intended for cases where the platform wallet had insufficient gas/token balance at send time,
 * and has since been funded. This schedules the same internal workflow and relies on
 * createRefundAttemptRecord's retry logic to re-debit and re-send.
 */
export const retryRefundForCase = mutation({
  args: {
    caseId: v.id("cases"),
    requesterUserId: v.id("users"),
  },
  handler: async (ctx, args): Promise<any> => {
    const dispute: any = await ctx.db.get(args.caseId);
    if (!dispute) throw new Error("Dispute not found");
    if (!dispute.reviewerOrganizationId) throw new Error("Dispute is not assigned to an organization");

    const requester: any = await ctx.db.get(args.requesterUserId);
    if (!requester) throw new Error("Requester not found");
    if (requester.organizationId !== dispute.reviewerOrganizationId) {
      throw new Error("Unauthorized: requester not from customer organization");
    }

    const refund: any = await ctx.db
      .query("refundTransactions")
      .withIndex("by_case", (q: any) => q.eq("caseId", args.caseId))
      .first();

    if (!refund) {
      return { ok: false as const, code: "NO_REFUND", message: "No refund record exists yet for this case" };
    }

    if (refund.status === "EXECUTED") {
      return { ok: true as const, status: "EXECUTED", refundId: refund._id };
    }

    // Allow manually re-sending a pending refund (e.g., if a background job was delayed).
    if (refund.status === "PENDING_SEND") {
      await ctx.scheduler.runAfter(0, internal.refunds.sendPendingRefund as any, { refundId: refund._id });
      return { ok: true as const, status: "SCHEDULED_SEND", refundId: refund._id };
    }

    const retryable =
      refund.provider === "coinbase" &&
      (refund.status === "FAILED" || refund.status === "COINBASE_DISABLED") &&
      (refund.failureCode === "COINBASE_SEND_FAILED" || refund.failureCode === "COINBASE_DISABLED");

    if (!retryable) {
      return {
        ok: false as const,
        code: "NOT_RETRYABLE",
        message: `Refund is not in a retryable state (status=${refund.status}, code=${refund.failureCode || "n/a"})`,
        refundId: refund._id,
      };
    }

    await ctx.scheduler.runAfter(0, internal.refunds.createRefundAttempt as any, { caseId: args.caseId });
    return { ok: true as const, status: "SCHEDULED", refundId: refund._id };
  },
});

export const markRefundFailed = internalMutation({
  args: {
    refundId: v.id("refundTransactions"),
    status: v.string(),
    failureCode: v.string(),
    failureReason: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.refundId, {
      status: args.status as any,
      failureCode: args.failureCode,
      failureReason: args.failureReason,
    });
    return { success: true };
  },
});

export const rollbackAndFailRefund = internalMutation({
  args: {
    refundId: v.id("refundTransactions"),
    organizationId: v.id("organizations"),
    amountMicrousdc: v.number(),
    status: v.string(),
    failureCode: v.string(),
    failureReason: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.refundCredits.rollbackRefundAmount as any, {
      organizationId: args.organizationId,
      amountMicrousdc: args.amountMicrousdc,
    });
    await ctx.db.patch(args.refundId, {
      status: args.status as any,
      failureCode: args.failureCode,
      failureReason: args.failureReason,
    });
    return { success: true };
  },
});

export const markRefundExecuted = internalMutation({
  args: {
    refundId: v.id("refundTransactions"),
    providerTransferId: v.string(),
    refundTxHash: v.optional(v.string()),
    explorerUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.refundId, {
      status: "EXECUTED",
      providerTransferId: args.providerTransferId,
      refundTxHash: args.refundTxHash,
      explorerUrl: args.explorerUrl,
      executedAt: Date.now(),
    });
    return { success: true };
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
      
      // Execute transfer (placeholder implementation lives in convex/lib/solana.ts)
      const result = await executeSolanaRefundImpl({
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
    await ctx.scheduler.runAfter(0, internal.x402r.resolver.resolveEscrowDispute as any, {
      caseId: args.caseId,
    });

    return { status: "SCHEDULED" };
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
    const user = await ctx.db.get(args.approvedByUserId);
    if (!user) {
      throw new Error("User not found");
    }

    const dispute: any = await ctx.db.get(args.caseId);
    if (!dispute) throw new Error("Dispute not found");

    // Only allow customer org members to trigger manual refunds for org-assigned cases.
    if (dispute.reviewerOrganizationId && user.organizationId !== dispute.reviewerOrganizationId) {
      throw new Error("Unauthorized: user not from customer organization");
    }

    // Manual approval is intended to be the "human gate" when auto-refund is disabled.
    // It should still execute the refund, bypassing merchantSettings.autoRefundEnabled/threshold gates.
    return await executeAutomatedRefundImpl(ctx, args.caseId, { force: true });
  },
});






