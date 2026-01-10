import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

function normalizeOrigin(origin: string): string | null {
  try {
    const u = new URL(origin);
    if (u.protocol !== "https:") return null;
    return u.origin;
  } catch {
    return null;
  }
}

export const createActionTokensForCase = internalMutation({
  args: {
    caseId: v.id("cases"),
    merchant: v.string(), // CAIP-10
    origin: v.string(),
    supportEmail: v.string(),
    // Payment amount for full refund (microusdc)
    paymentAmountMicrousdc: v.number(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    approveFull: string;
    reject: string;
    approvePartial: string;
    origin: string;
  }> => {
    const now = Date.now();
    const origin = normalizeOrigin(args.origin);
    if (!origin) throw new Error("Invalid origin");

    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days
    // Partial refund default: 50% (merchant can edit amount in URL later if we add UI; for now fixed).
    const partialMicros = Math.max(0, Math.min(args.paymentAmountMicrousdc, Math.round(args.paymentAmountMicrousdc / 2)));

    const mk = async (action: "APPROVE_FULL_REFUND" | "REJECT" | "APPROVE_PARTIAL_REFUND", refundAmountMicrousdc?: number) => {
      const token = crypto.randomUUID();
      await ctx.db.insert("merchantEmailActionTokens", {
        token,
        caseId: args.caseId,
        merchant: args.merchant,
        origin,
        supportEmail: args.supportEmail,
        action,
        refundAmountMicrousdc,
        createdAt: now,
        expiresAt,
      });
      return token;
    };

    const approveFull = await mk("APPROVE_FULL_REFUND", args.paymentAmountMicrousdc);
    const reject = await mk("REJECT");
    const approvePartial = await mk("APPROVE_PARTIAL_REFUND", partialMicros);
    return { approveFull, reject, approvePartial, origin };
  },
});

export const getToken = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("merchantEmailActionTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
  },
});

export const markTokenUsed = internalMutation({
  args: { tokenId: v.id("merchantEmailActionTokens") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tokenId, { usedAt: Date.now() });
  },
});

export const applyDecisionFromToken = internalMutation({
  args: { token: v.string() },
  handler: async (
    ctx,
    args,
  ): Promise<
    | { ok: true; caseId: string; status: string; verdict: string; refundScheduled?: boolean }
    | { ok: false; code: string; message: string }
  > => {
    const now = Date.now();
    const rec: any = await ctx.db
      .query("merchantEmailActionTokens")
      .withIndex("by_token", (q: any) => q.eq("token", args.token))
      .first();
    if (!rec) return { ok: false, code: "INVALID_TOKEN", message: "Invalid token" };
    if (rec.usedAt) return { ok: false, code: "TOKEN_USED", message: "This link has already been used" };
    if (typeof rec.expiresAt === "number" && rec.expiresAt <= now) {
      return { ok: false, code: "TOKEN_EXPIRED", message: "This link has expired" };
    }

    // Must be verified to use one-click actions.
    const verified = await ctx.db
      .query("merchantEmailVerifications")
      .withIndex("by_tuple", (q: any) =>
        q.eq("merchant", rec.merchant).eq("origin", rec.origin).eq("supportEmail", rec.supportEmail),
      )
      .first();
    if (!verified) return { ok: false, code: "NOT_VERIFIED", message: "Email not verified for this merchant/origin" };

    const dispute: any = await ctx.db.get(rec.caseId);
    if (!dispute) return { ok: false, code: "NOT_FOUND", message: "Dispute not found" };
    if (typeof dispute.finalVerdict === "string" && dispute.finalVerdict.length > 0) {
      return { ok: false, code: "ALREADY_DECIDED", message: "Dispute already decided" };
    }

    // Canonical payment amount for validation (microusdc).
    const paymentAmountMicrousdc: number | undefined =
      typeof dispute.paymentDetails?.amountMicrousdc === "number"
        ? Math.round(dispute.paymentDetails.amountMicrousdc)
        : typeof dispute.amount === "number"
          ? Math.round(dispute.amount * 1_000_000)
          : undefined;

    let finalVerdict: "CONSUMER_WINS" | "MERCHANT_WINS" | "PARTIAL_REFUND";
    let finalRefundAmountMicrousdc: number | undefined;

    if (rec.action === "REJECT") {
      finalVerdict = "MERCHANT_WINS";
    } else if (rec.action === "APPROVE_FULL_REFUND") {
      finalVerdict = "CONSUMER_WINS";
      finalRefundAmountMicrousdc =
        typeof rec.refundAmountMicrousdc === "number"
          ? Math.round(rec.refundAmountMicrousdc)
          : paymentAmountMicrousdc;
    } else if (rec.action === "APPROVE_PARTIAL_REFUND") {
      finalVerdict = "PARTIAL_REFUND";
      if (typeof rec.refundAmountMicrousdc !== "number" || rec.refundAmountMicrousdc <= 0) {
        return { ok: false, code: "MISSING_AMOUNT", message: "Partial refund amount missing" };
      }
      finalRefundAmountMicrousdc = Math.round(rec.refundAmountMicrousdc);
    } else {
      return { ok: false, code: "INVALID_ACTION", message: "Invalid action" };
    }

    if (finalVerdict !== "MERCHANT_WINS") {
      if (typeof paymentAmountMicrousdc !== "number" || paymentAmountMicrousdc <= 0) {
        return { ok: false, code: "MISSING_PAYMENT_AMOUNT", message: "Missing payment amount for refund" };
      }
      if (!finalRefundAmountMicrousdc || finalRefundAmountMicrousdc <= 0) {
        return { ok: false, code: "MISSING_REFUND_AMOUNT", message: "Missing refund amount" };
      }
      if (finalRefundAmountMicrousdc > paymentAmountMicrousdc) {
        return { ok: false, code: "AMOUNT_TOO_LARGE", message: "Refund amount exceeds payment amount" };
      }
    }

    // If the action issues a refund, require sufficient merchant credits (refund + fee) at click time.
    if (finalVerdict !== "MERCHANT_WINS") {
      const disputeFeeUsdc =
        typeof dispute.paymentDetails?.disputeFee === "number" && Number.isFinite(dispute.paymentDetails.disputeFee)
          ? dispute.paymentDetails.disputeFee
          : 0;
      const feeMicrousdc = Math.max(0, Math.round(disputeFeeUsdc * 1_000_000));
      const requiredMicrousdc = (finalRefundAmountMicrousdc as number) + feeMicrousdc;

      const bal: any = await ctx.db
        .query("merchantBalances")
        .withIndex("by_wallet_currency", (q: any) =>
          q.eq("walletAddress", String(rec.merchant || "")).eq("currency", "USDC"),
        )
        .first();
      const availableUsdc = typeof bal?.availableBalance === "number" ? bal.availableBalance : 0;
      const availableMicrousdc = Math.max(0, Math.round(availableUsdc * 1_000_000));
      if (availableMicrousdc < requiredMicrousdc) {
        return {
          ok: false,
          code: "INSUFFICIENT_CREDITS",
          message: "Insufficient refund credits to cover refund + fee. Top up at https://x402refunds.com/topup and try again.",
        };
      }

      // Debit credits now (so the action is deterministic and we don't oversubscribe credits).
      const requiredUsdc = requiredMicrousdc / 1_000_000;
      const refundUsdc = (finalRefundAmountMicrousdc as number) / 1_000_000;
      if (bal?._id) {
        await ctx.db.patch(bal._id, {
          availableBalance: Math.max(0, availableUsdc - requiredUsdc),
          totalRefunded: (bal.totalRefunded || 0) + refundUsdc,
          lastRefundAt: now,
          updatedAt: now,
        });
      }
    }

    // Atomic: mark token used + apply decision in same mutation.
    await ctx.db.patch(rec._id, { usedAt: now });
    await ctx.db.patch(rec.caseId, {
      status: "DECIDED",
      finalVerdict,
      finalRefundAmountMicrousdc,
      decidedAt: now,
      humanReviewedAt: now,
      humanReviewedBy: rec.supportEmail,
      humanAgreesWithAI: false,
      humanOverrideReason: "Approved via email link",
    });

    let refundScheduled = false;
    if (finalVerdict === "CONSUMER_WINS" || finalVerdict === "PARTIAL_REFUND") {
      await (ctx.scheduler.runAfter as any)(0, (internal as any).refunds.executeAutomatedRefund, {
        caseId: rec.caseId,
        force: true,
      });
      refundScheduled = true;
    }

    return { ok: true, caseId: String(rec.caseId), status: "DECIDED", verdict: finalVerdict, refundScheduled };
  },
});

