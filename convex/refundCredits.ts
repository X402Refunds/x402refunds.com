/**
 * Organization refund credits (internal ledger).
 *
 * MVP: first 500 orgs get 5 USDC trial credit. We charge $0.05 per dispute when it becomes org-reviewable,
 * and we debit refund amounts when a refund attempt is created.
 */

import { action, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { parseUsdcAmountToMicros } from "./lib/usdc";
import { api, internal } from "./_generated/api";

export const DISPUTE_FEE_MICROUSDC = 50_000;
export const DEFAULT_TRIAL_CREDIT_MICROUSDC = 5_000_000;
export const DEFAULT_MAX_PER_CASE_MICROUSDC = 250_000;

function remainingCredit(row: { trialCreditMicrousdc: number; topUpMicrousdc?: number; spentMicrousdc: number }): number {
  return Math.max(0, (row.trialCreditMicrousdc + (row.topUpMicrousdc || 0)) - row.spentMicrousdc);
}

async function ensureOrgRefundCreditsRow(ctx: any, organizationId: any) {
  const existing = await ctx.db
    .query("orgRefundCredits")
    .withIndex("by_organization", (q: any) => q.eq("organizationId", organizationId))
    .first();
  if (existing) return existing;

  const org = await ctx.db.get(organizationId);
  if (!org) throw new Error("Organization not found");

  // Determine rank by createdAt (approximate but stable enough for gating trial).
  const allOrgs = await ctx.db.query("organizations").collect();
  allOrgs.sort((a: any, b: any) => a.createdAt - b.createdAt);
  const rank = allOrgs.findIndex((o: any) => o._id === organizationId) + 1;
  const eligible = rank > 0 && rank <= 500;

  const now = Date.now();
  const id = await ctx.db.insert("orgRefundCredits", {
    organizationId,
    enabled: eligible,
    trialCreditMicrousdc: eligible ? DEFAULT_TRIAL_CREDIT_MICROUSDC : 0,
    topUpMicrousdc: 0,
    spentMicrousdc: 0,
    maxPerCaseMicrousdc: DEFAULT_MAX_PER_CASE_MICROUSDC,
    createdAt: now,
  });

  const created = await ctx.db.get(id);
  if (!created) throw new Error("Failed to create refund credits row");
  return created;
}

export const getOrgRefundCredits = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orgRefundCredits")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .first();
  },
});

export const getOrgRefundCreditsSummary = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("orgRefundCredits")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .first();
    if (!row) return null;
    const topUps = row.topUpMicrousdc || 0;
    const remaining = Math.max(0, (row.trialCreditMicrousdc + topUps) - row.spentMicrousdc);
    return {
      ...row,
      remainingMicrousdc: remaining,
      remainingUsdc: remaining / 1_000_000,
      trialCreditUsdc: row.trialCreditMicrousdc / 1_000_000,
      topUpUsdc: topUps / 1_000_000,
      spentUsdc: row.spentMicrousdc / 1_000_000,
      maxPerCaseUsdc: row.maxPerCaseMicrousdc / 1_000_000,
    };
  },
});

/**
 * Ensure a row exists for an org. First 500 orgs get 5 USDC trial credit + enabled.
 * Creates a disabled, 0-credit row for later orgs so the dashboard can still show a balance.
 */
export const ensureOrgRefundCredits = internalMutation({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const row = await ensureOrgRefundCreditsRow(ctx, args.organizationId);
    // eligible is implied by enabled for created rows; for existing rows we don't want to recompute.
    return { success: true, created: false, id: row._id };
  },
});

/**
 * User-submitted top-up request (manual reconciliation for now).
 * This does NOT credit immediately; it creates a PENDING record for review.
 */
export const submitTopUpRequest = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    blockchain: v.union(v.literal("base")),
    txHash: v.string(),
    amount: v.any(),
    amountUnit: v.union(v.literal("usdc"), v.literal("microusdc")),
  },
  handler: async (ctx, args) => {
    const tx = args.txHash.trim();
    if (!/^0x[a-fA-F0-9]{64}$/.test(tx)) {
      throw new Error("Invalid txHash format (expected 0x + 64 hex chars)");
    }

    const parsed = parseUsdcAmountToMicros(args.amount, args.amountUnit);
    if (!parsed.ok) throw new Error(`Invalid amount: ${parsed.code} - ${parsed.message}`);

    const dup = await ctx.db
      .query("refundTopUps")
      .withIndex("by_txhash", (q) => q.eq("txHash", tx))
      .first();
    if (dup) return { success: true, status: dup.status, topUpId: dup._id };

    const topUpId = await ctx.db.insert("refundTopUps", {
      organizationId: args.organizationId,
      blockchain: args.blockchain,
      txHash: tx,
      amountMicrousdc: parsed.microusdc,
      status: "PENDING",
      createdAt: Date.now(),
    });

    return { success: true, status: "PENDING", topUpId };
  },
});

export const applyVerifiedTopUp = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    blockchain: v.union(v.literal("base")),
    txHash: v.string(),
    sourceTransferLogIndex: v.number(),
    payerAddress: v.string(),
    recipientAddress: v.string(),
    amountMicrousdc: v.number(),
  },
  handler: async (ctx, args) => {
    // Idempotency by (chain, txHash, logIndex)
    const existing = await ctx.db
      .query("refundTopUps")
      .withIndex("by_source_triplet", (q) =>
        q
          .eq("blockchain", args.blockchain)
          .eq("txHash", args.txHash)
          .eq("sourceTransferLogIndex", args.sourceTransferLogIndex)
      )
      .first();

    if (existing?.status === "APPROVED") {
      return { ok: true as const, topUpId: existing._id, alreadyApplied: true };
    }

    const credits2 = await ensureOrgRefundCreditsRow(ctx, args.organizationId);

    const now = Date.now();
    const topUpId =
      existing?._id ??
      (await ctx.db.insert("refundTopUps", {
        organizationId: args.organizationId,
        blockchain: args.blockchain,
        txHash: args.txHash,
        sourceTransferLogIndex: args.sourceTransferLogIndex,
        payerAddress: args.payerAddress.toLowerCase(),
        recipientAddress: args.recipientAddress.toLowerCase(),
        amountMicrousdc: args.amountMicrousdc,
        status: "PENDING",
        createdAt: now,
      }));

    await ctx.db.patch(topUpId, {
      status: "APPROVED",
      reviewedAt: now,
      reviewerNote: "Auto-approved via on-chain verification",
    });

    await ctx.db.patch(credits2._id, {
      topUpMicrousdc: (credits2.topUpMicrousdc || 0) + args.amountMicrousdc,
      updatedAt: now,
    });

    return { ok: true as const, topUpId, alreadyApplied: false };
  },
});

/**
 * Automatic top-up reconciliation:
 * - Verify there is a unique USDC Transfer log matching amount in txHash
 * - Require it is sent to the platform deposit address (CDP account address)
 * - Auto-credit org ledger
 */
export const submitTopUpAndAutoApply = action({
  args: {
    organizationId: v.id("organizations"),
    txHash: v.string(),
    amount: v.any(),
    amountUnit: v.union(v.literal("usdc"), v.literal("microusdc")),
  },
  handler: async (ctx, args): Promise<any> => {
    const tx = args.txHash.trim();
    if (!/^0x[a-fA-F0-9]{64}$/.test(tx)) {
      return { ok: false as const, code: "INVALID_TX_HASH", message: "Invalid txHash format (expected 0x + 64 hex chars)" };
    }

    const parsed = parseUsdcAmountToMicros(args.amount, args.amountUnit);
    if (!parsed.ok) {
      return { ok: false as const, code: parsed.code, message: parsed.message };
    }

    // Static deposit address configured in Convex env.
    const depositAddress = process.env.PLATFORM_BASE_USDC_DEPOSIT_ADDRESS;
    if (!depositAddress) {
      return {
        ok: false as const,
        code: "NOT_CONFIGURED",
        message: "PLATFORM_BASE_USDC_DEPOSIT_ADDRESS is not configured in Convex",
      };
    }

    const verified = await ctx.runAction(api.lib.blockchain.verifyUsdcTransferByAmount, {
      blockchain: "base",
      transactionHash: tx,
      expectedAmountMicrousdc: parsed.microusdc,
      expectedToAddress: depositAddress,
    });

    if (!verified.ok) {
      return { ok: false as const, code: verified.code, message: verified.message };
    }

    // Extra safety: recipient must match deposit address.
    if (verified.recipientAddress.toLowerCase() !== depositAddress.toLowerCase()) {
      return {
        ok: false as const,
        code: "WRONG_RECIPIENT",
        message: "USDC transfer recipient does not match platform deposit address",
      };
    }

    const applied = await ctx.runMutation(internal.refundCredits.applyVerifiedTopUp, {
      organizationId: args.organizationId,
      blockchain: "base",
      txHash: tx,
      sourceTransferLogIndex: verified.logIndex,
      payerAddress: verified.payerAddress,
      recipientAddress: verified.recipientAddress,
      amountMicrousdc: verified.amountMicrousdc,
    });

    const summary = await ctx.runQuery(api.refundCredits.getOrgRefundCreditsSummary, {
      organizationId: args.organizationId,
    });

    return {
      ok: true as const,
      status: "APPROVED" as const,
      topUpId: applied.topUpId,
      alreadyApplied: applied.alreadyApplied,
      depositAddress,
      credits: summary,
    };
  },
});

export const getPlatformDepositAddress = query({
  args: {},
  handler: async () => {
    const address = process.env.PLATFORM_BASE_USDC_DEPOSIT_ADDRESS;
    if (!address) return { ok: false as const, code: "NOT_CONFIGURED" as const };
    return { ok: true as const, address };
  },
});

export const listTopUpRequests = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("refundTopUps")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .take(20);
  },
});

/**
 * Initialize trial credits for the first N orgs (by createdAt).
 * Safe to run multiple times (skips orgs that already have a row).
 */
export const initializeTrialRefundCredits = internalMutation({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.max(0, Math.min(args.limit ?? 500, 5000));
    const orgs = await ctx.db.query("organizations").collect();
    orgs.sort((a, b) => a.createdAt - b.createdAt);
    const target = orgs.slice(0, limit);

    let created = 0;
    let skipped = 0;
    const now = Date.now();

    for (const org of target) {
      const existing = await ctx.db
        .query("orgRefundCredits")
        .withIndex("by_organization", (q) => q.eq("organizationId", org._id))
        .first();
      if (existing) {
        skipped++;
        continue;
      }
      await ctx.db.insert("orgRefundCredits", {
        organizationId: org._id,
        enabled: true,
        trialCreditMicrousdc: DEFAULT_TRIAL_CREDIT_MICROUSDC,
        spentMicrousdc: 0,
        maxPerCaseMicrousdc: DEFAULT_MAX_PER_CASE_MICROUSDC,
        createdAt: now,
      });
      created++;
    }

    return { success: true, created, skipped, limit };
  },
});

/**
 * Charge the $0.05 dispute fee when a case becomes org-reviewable.
 * Idempotent via paymentDetails.feeChargedAt.
 */
export const chargeDisputeFeeForCase = internalMutation({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args): Promise<{ ok: true } | { ok: false; code: string; message: string }> => {
    const caseData = await ctx.db.get(args.caseId);
    if (!caseData) return { ok: false, code: "CASE_NOT_FOUND", message: "Case not found" };
    if (caseData.type !== "PAYMENT") return { ok: true };
    if (!caseData.reviewerOrganizationId) {
      return { ok: false, code: "NO_REVIEWER_ORG", message: "No reviewerOrganizationId set" };
    }

    const alreadyCharged = Boolean(caseData.paymentDetails?.feeChargedAt);
    if (alreadyCharged) return { ok: true };

    const credits = await ctx.db
      .query("orgRefundCredits")
      .withIndex("by_organization", (q) => q.eq("organizationId", caseData.reviewerOrganizationId!))
      .first();
    if (!credits || !credits.enabled) {
      return { ok: false, code: "CREDITS_DISABLED", message: "Refund credits are not enabled for this org" };
    }
    if (remainingCredit(credits) < DISPUTE_FEE_MICROUSDC) {
      return {
        ok: false,
        code: "INSUFFICIENT_CREDITS_FEE",
        message: "Insufficient credits to cover dispute fee",
      };
    }

    const now = Date.now();
    await ctx.db.patch(credits._id, {
      spentMicrousdc: credits.spentMicrousdc + DISPUTE_FEE_MICROUSDC,
      updatedAt: now,
    });

    await ctx.db.patch(args.caseId, {
      paymentDetails: {
        ...(caseData.paymentDetails || ({} as any)),
        feeChargedAt: now,
        feeChargedMicrousdc: DISPUTE_FEE_MICROUSDC,
      },
    });

    return { ok: true };
  },
});

export const debitRefundAmount = internalMutation({
  args: { organizationId: v.id("organizations"), amountMicrousdc: v.number() },
  handler: async (ctx, args): Promise<{ ok: true } | { ok: false; code: string; message: string }> => {
    const credits = await ctx.db
      .query("orgRefundCredits")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .first();
    if (!credits || !credits.enabled) {
      return { ok: false, code: "CREDITS_DISABLED", message: "Refund credits are not enabled for this org" };
    }
    if (!Number.isSafeInteger(args.amountMicrousdc) || args.amountMicrousdc <= 0) {
      return { ok: false, code: "INVALID_AMOUNT", message: "amountMicrousdc must be a positive safe integer" };
    }
    if (args.amountMicrousdc > credits.maxPerCaseMicrousdc) {
      return { ok: false, code: "OVER_CASE_CAP", message: "Refund amount exceeds per-case cap" };
    }
    if (remainingCredit(credits) < args.amountMicrousdc) {
      return { ok: false, code: "INSUFFICIENT_CREDITS", message: "Insufficient credits to cover refund" };
    }
    await ctx.db.patch(credits._id, {
      spentMicrousdc: credits.spentMicrousdc + args.amountMicrousdc,
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

export const rollbackRefundAmount = internalMutation({
  args: { organizationId: v.id("organizations"), amountMicrousdc: v.number() },
  handler: async (ctx, args): Promise<{ ok: true } | { ok: false; code: string; message: string }> => {
    const credits = await ctx.db
      .query("orgRefundCredits")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .first();
    if (!credits) return { ok: false, code: "CREDITS_NOT_FOUND", message: "Credits row not found" };
    const nextSpent = Math.max(0, credits.spentMicrousdc - args.amountMicrousdc);
    await ctx.db.patch(credits._id, {
      spentMicrousdc: nextSpent,
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});


