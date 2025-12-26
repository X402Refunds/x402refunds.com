/**
 * Organization refund credits (internal ledger).
 *
 * MVP: first 500 orgs get 5 USDC trial credit. We charge $0.05 per dispute when it becomes org-reviewable,
 * and we debit refund amounts when a refund attempt is created.
 */

import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

export const DISPUTE_FEE_MICROUSDC = 50_000;
export const DEFAULT_TRIAL_CREDIT_MICROUSDC = 5_000_000;
export const DEFAULT_MAX_PER_CASE_MICROUSDC = 250_000;

function remainingCredit(row: { trialCreditMicrousdc: number; spentMicrousdc: number }): number {
  return Math.max(0, row.trialCreditMicrousdc - row.spentMicrousdc);
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


