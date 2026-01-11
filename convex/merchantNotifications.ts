/**
 * Merchant notification pipeline for wallet-first disputes (v1).
 *
 * Goal: No-signup notifications. If the merchant publishes /.well-known/x402.json
 * we discover a supportEmail and require per-wallet email verification for (origin, wallet, supportEmail).
 */

import { internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import * as apiMod from "./_generated/api.js";
import { sendEmail } from "./lib/email";
import { buildMerchantRefundExecutedEmailCopy } from "./lib/merchantRefundEmailCopy";

// Avoid TS2589 (excessively deep type instantiation) by importing generated API as JS and treating it as `any`.
const api: any = (apiMod as any).api;
const internalApi: any = (apiMod as any).internal;

type X402Metadata = {
  x402refunds?: {
    supportEmail?: string;
  };
};

function normalizeMerchantId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  if (/^eip155:\d+:0x[a-fA-F0-9]{40}$/.test(s)) {
    const m = s.match(/^eip155:(\d+):(0x[a-fA-F0-9]{40})$/);
    if (!m) return null;
    return `eip155:${m[1]}:${m[2].toLowerCase()}`;
  }
  if (/^0x[a-fA-F0-9]{40}$/.test(s)) return `eip155:8453:${s.toLowerCase()}`; // legacy Base-only input
  if (/^solana:[^:]+:[1-9A-HJ-NP-Za-km-z]{32,64}$/.test(s)) return s;
  return null;
}

function deriveMerchantOriginFromRequestJson(requestJson?: string): string | null {
  if (!requestJson) return null;
  try {
    const parsed = JSON.parse(requestJson);
    const url = typeof parsed?.url === "string" ? parsed.url : null;
    if (!url) return null;
    const u = new URL(url);
    if (u.protocol !== "https:") return null;
    return u.origin;
  } catch {
    return null;
  }
}

function isBlockedHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "0.0.0.0" ||
    h === "::1"
  );
}

function isLikelyEmailAddress(value: string): boolean {
  const s = value.trim();
  if (s.length < 3 || s.length > 320) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

async function fetchX402Json(urlString: string): Promise<{ ok: true; data: X402Metadata } | { ok: false; code: string; message: string }> {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch (e: any) {
    return { ok: false, code: "INVALID_X402_METADATA_URL", message: e?.message || "Invalid metadata URL" };
  }
  if (url.protocol !== "https:") return { ok: false, code: "INVALID_X402_METADATA_URL", message: "x402.json URL must be https://" };
  if (isBlockedHostname(url.hostname)) return { ok: false, code: "BLOCKED_HOST", message: "Blocked hostname" };

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "X402Refunds/1.0 (+https://x402refunds.com)",
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return { ok: false, code: "FETCH_FAILED", message: `x402.json fetch failed: ${res.status}` };

    const text = await res.text();
    if (text.length > 65_536) return { ok: false, code: "TOO_LARGE", message: "x402.json too large" };

    const data = JSON.parse(text) as X402Metadata;
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, code: "FETCH_FAILED", message: e?.message || String(e) };
  }
}

function buildDisputeSummaryLines(params: {
  caseId: string;
  reason?: string;
  amountMicrousdc?: number;
  txHash?: string;
  chain?: string;
}): string[] {
  const lines: string[] = [];
  lines.push("Dispute received");
  lines.push("");
  lines.push(`Case ID: ${params.caseId}`);
  if (typeof params.amountMicrousdc === "number") {
    lines.push(`Amount: ${(params.amountMicrousdc / 1_000_000).toFixed(6)} USDC`);
  }
  if (params.reason) lines.push(`Reason: ${params.reason}`);
  if (params.chain) lines.push(`Chain: ${params.chain}`);
  if (params.txHash) lines.push(`Payment tx: ${params.txHash}`);
  return lines;
}

function buildMerchantDisputeEmailText(params: {
  caseId: string;
  reason?: string;
  amountMicrousdc?: number;
  txHash?: string;
  chain?: string;
  actions?: {
    approveFullUrl: string;
    approvePartialUrl: string;
    rejectUrl: string;
  };
  topup?: {
    url: string;
    requiredMicrousdc?: number;
  };
}): string {
  const lines: string[] = [];
  lines.push(...buildDisputeSummaryLines(params));
  lines.push("");

  if (params.actions) {
    lines.push("Take action:");
    lines.push(`- Approve full refund: ${params.actions.approveFullUrl}`);
    lines.push(`- Approve partial refund (50%): ${params.actions.approvePartialUrl}`);
    lines.push(`- Reject dispute: ${params.actions.rejectUrl}`);
    lines.push("");
  } else if (params.topup) {
    lines.push("Next step:");
    lines.push("Top up refund credits to enable one-click approvals and automated refunds.");
    if (typeof params.topup.requiredMicrousdc === "number") {
      lines.push(`Required: ${(params.topup.requiredMicrousdc / 1_000_000).toFixed(6)} USDC`);
    }
    lines.push(`Top up: ${params.topup.url}`);
    lines.push("");
  }

  lines.push("Sent by x402refunds.com");
  return lines.join("\n");
}

function buildMerchantVerificationEmailText(params: {
  merchant: string;
  origin: string;
  supportEmail: string;
  confirmUrl: string;
}): string {
  const lines: string[] = [];
  lines.push("ACTION REQUIRED: VERIFY YOUR EMAIL FIRST");
  lines.push("");
  lines.push("Step 1 (required): verify this email so we can send dispute notifications.");
  lines.push("");
  lines.push(`Merchant wallet: ${params.merchant}`);
  lines.push(`Merchant origin: ${params.origin}`);
  lines.push(`Notification email: ${params.supportEmail}`);
  lines.push("");
  lines.push("Verify email:");
  lines.push(params.confirmUrl);
  lines.push("");
  lines.push("After you verify, we will email you the dispute details and one-click actions.");
  lines.push("");
  lines.push("Sent by x402refunds.com");
  return lines.join("\n");
}

export const notifyMerchantDisputeFiled: any = internalAction({
  args: { caseId: v.id("cases") },
  handler: async (ctx: any, args: { caseId: any }): Promise<any> => {
    // NOTE: Cast runQuery to any to avoid excessively-deep type instantiations from generated Convex query types.
    const caseData: any = await (ctx.runQuery as any)(api.cases.getCaseById, { caseId: args.caseId });
    if (!caseData) return { ok: false, reason: "CASE_NOT_FOUND" };

    const merchantRaw = String(caseData.defendant || "");
    const buyer = String(caseData.plaintiff || "");
    const v1 = caseData?.metadata?.v1 || {};

    // Safety gate: only email if we were able to corroborate origin ⇄ wallet via seller endpoint payTo.
    // This prevents spam if a filer supplies an unrelated origin.
    if (v1?.endpointPayToMatch !== true) {
      return { ok: true, emailed: false, reason: "ENDPOINT_PAYTO_UNVERIFIED" };
    }

    const paymentDetails = caseData?.paymentDetails;
    const paymentRequestJson = paymentDetails?.plaintiffMetadata?.requestJson;
    const paymentChain = typeof paymentDetails?.blockchain === "string" ? paymentDetails.blockchain : undefined;

    // Wallet-first stores merchantOrigin in metadata.v1. Legacy payment disputes store requestJson in paymentDetails.*.
    const merchantOriginFromV1 = typeof v1?.merchantOrigin === "string" ? v1.merchantOrigin : "";
    const merchantOriginFromPayment = deriveMerchantOriginFromRequestJson(
      typeof paymentRequestJson === "string" ? paymentRequestJson : undefined,
    );
    const merchantOrigin = merchantOriginFromV1 || merchantOriginFromPayment || "";
    const overrideUrl = typeof v1?.merchantX402MetadataUrl === "string" ? v1.merchantX402MetadataUrl : undefined;
    if (!merchantOrigin && !overrideUrl) return { ok: true, emailed: false, reason: "NO_MERCHANT_ORIGIN" };

    const metadataUrl = overrideUrl || new URL("/.well-known/x402.json", merchantOrigin).toString();
    const fetched = await fetchX402Json(metadataUrl);
    if (!fetched.ok) return { ok: true, emailed: false, reason: fetched.code };

    const expectedMerchant = normalizeMerchantId(merchantRaw);
    if (!expectedMerchant) return { ok: true, emailed: false, reason: "UNSUPPORTED_MERCHANT_ID" };

    const supportEmail = fetched.data?.x402refunds?.supportEmail;
    if (!supportEmail || !isLikelyEmailAddress(String(supportEmail))) {
      return { ok: true, emailed: false, reason: "MISSING_SUPPORT_EMAIL" };
    }

    // Email verification gate: only send ongoing dispute emails after supportEmail confirms for this (merchant, origin).
    const verified = await (ctx.runQuery as any)(api.merchantEmailVerification.getVerification, {
      merchant: expectedMerchant,
      origin: merchantOrigin,
      supportEmail: String(supportEmail),
    });

    const amountMicrousdc =
      typeof v1?.amountMicrousdc === "number"
        ? v1.amountMicrousdc
        : typeof v1?.amountMicrousdc === "string" && /^\d+$/.test(v1.amountMicrousdc)
          ? Number(v1.amountMicrousdc)
          : typeof paymentDetails?.amountMicrousdc === "number"
            ? paymentDetails.amountMicrousdc
            : undefined;

    const reason =
      typeof v1?.description === "string"
        ? v1.description
        : typeof caseData?.description === "string"
          ? caseData.description
          : undefined;
    const txHash =
      typeof v1?.transactionHash === "string"
        ? v1.transactionHash
        : typeof paymentDetails?.transactionHash === "string"
          ? paymentDetails.transactionHash
          : undefined;
    const chain =
      typeof v1?.blockchain === "string"
        ? v1.blockchain
        : typeof paymentChain === "string"
          ? paymentChain
          : undefined;

    if (!verified) {
      const tokenRes = await (ctx.runMutation as any)(
        api.merchantEmailVerification.createOrReuseVerificationToken,
        {
          merchant: expectedMerchant,
          origin: merchantOrigin,
          supportEmail: String(supportEmail),
          caseId: args.caseId,
        },
      );

      if (!tokenRes?.shouldSend) {
        return { ok: true, emailed: false, reason: "AWAITING_EMAIL_VERIFICATION" };
      }

      const confirmUrl = `https://api.x402refunds.com/v1/merchant/verify-email?token=${encodeURIComponent(
        String(tokenRes.token),
      )}`;

      const subject = `ACTION REQUIRED: Verify dispute emails (${expectedMerchant.slice(0, 18)}…)`;
      const text = buildMerchantVerificationEmailText({
        merchant: expectedMerchant,
        origin: String(tokenRes.origin || merchantOrigin),
        supportEmail: String(supportEmail),
        confirmUrl,
      });

      const sent = await sendEmail({
        to: String(supportEmail),
        subject,
        text,
        replyTo: String(supportEmail),
      });

      if (!sent.ok) {
        return { ok: true, emailed: false, reason: sent.code, details: sent.message };
      }

      return { ok: true, emailed: true, reason: "EMAIL_VERIFICATION_SENT" };
    }

    const subject = `Dispute received (${String(args.caseId).slice(0, 8)})`;
    const paymentAmountMicrousdc =
      typeof paymentDetails?.amountMicrousdc === "number" ? Math.round(paymentDetails.amountMicrousdc) : undefined;
    const disputeFeeMicrousdc =
      typeof paymentDetails?.disputeFee === "number" && Number.isFinite(paymentDetails.disputeFee) && paymentDetails.disputeFee > 0
        ? Math.round(paymentDetails.disputeFee * 1_000_000)
        : 0;
    const requiredMicrousdc =
      typeof paymentAmountMicrousdc === "number" ? paymentAmountMicrousdc + disputeFeeMicrousdc : undefined;

    // Determine whether the merchant has enough refund credits to cover (full refund + fee).
    // Even if not, we still generate one-click action tokens; approve links will route through /topup.
    const balance =
      typeof requiredMicrousdc === "number"
        ? await (ctx.runQuery as any)(api.pool.getMerchantUsdcBalanceMicrousdc, { merchant: expectedMerchant })
        : null;
    const hasSufficientCredits =
      typeof requiredMicrousdc === "number" &&
      balance?.ok === true &&
      typeof balance.availableMicrousdc === "number" &&
      balance.availableMicrousdc >= requiredMicrousdc;

    const baseActionUrl = "https://api.x402refunds.com/v1/merchant/action?token=";
    const topupUrl = `https://x402refunds.com/topup?merchant=${encodeURIComponent(
      expectedMerchant,
    )}&caseId=${encodeURIComponent(String(args.caseId))}&email=${encodeURIComponent(String(supportEmail))}`;

    // Always generate action tokens when we can determine the payment amount.
    // Fallback to metadata-derived amount if paymentDetails is missing (older wallet-first cases).
    const tokenPaymentAmountMicrousdc =
      typeof paymentAmountMicrousdc === "number"
        ? paymentAmountMicrousdc
        : typeof amountMicrousdc === "number"
          ? Math.round(amountMicrousdc)
          : undefined;

    const actions =
      typeof tokenPaymentAmountMicrousdc === "number" && tokenPaymentAmountMicrousdc > 0
        ? await (ctx.runMutation as any)(api.merchantEmailActions.createActionTokensForCase, {
            caseId: args.caseId,
            merchant: expectedMerchant,
            origin: merchantOrigin,
            supportEmail: String(supportEmail),
            paymentAmountMicrousdc: tokenPaymentAmountMicrousdc,
          })
        : null;

    const text = buildMerchantDisputeEmailText({
      caseId: String(args.caseId),
      reason,
      amountMicrousdc,
      txHash,
      chain,
      actions: actions
        ? {
            approveFullUrl: hasSufficientCredits
              ? `${baseActionUrl}${encodeURIComponent(String(actions.approveFull))}`
              : `${topupUrl}&actionToken=${encodeURIComponent(String(actions.approveFull))}`,
            approvePartialUrl: hasSufficientCredits
              ? `${baseActionUrl}${encodeURIComponent(String(actions.approvePartial))}`
              : `${topupUrl}&actionToken=${encodeURIComponent(String(actions.approvePartial))}`,
            rejectUrl: `${baseActionUrl}${encodeURIComponent(String(actions.reject))}`,
          }
        : undefined,
      // If we couldn't generate action tokens (missing amount), fall back to the existing top-up guidance.
      topup: actions ? undefined : { url: topupUrl, requiredMicrousdc },
    });

    const sent = await sendEmail({
      to: String(supportEmail),
      subject,
      text,
      replyTo: String(supportEmail),
    });

    if (!sent.ok) {
      return { ok: true, emailed: false, reason: sent.code, details: sent.message };
    }

    return { ok: true, emailed: true };
  },
});

/**
 * Status helper for the top-up page. Does NOT send email.
 */
export const getNotificationStatusForCase: any = internalAction({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args): Promise<any> => {
    // NOTE: Cast runQuery to any to avoid excessively-deep type instantiations from generated Convex query types.
    const caseData: any = await (ctx.runQuery as any)(api.cases.getCaseById, { caseId: args.caseId });
    if (!caseData) return { ok: false, reason: "CASE_NOT_FOUND" };

    const merchantRaw = String(caseData.defendant || "");
    const v1 = caseData?.metadata?.v1 || {};

    const paymentDetails = caseData?.paymentDetails;
    const paymentRequestJson = paymentDetails?.plaintiffMetadata?.requestJson;

    const merchantOriginFromV1 = typeof v1?.merchantOrigin === "string" ? v1.merchantOrigin : "";
    const merchantOriginFromPayment = deriveMerchantOriginFromRequestJson(
      typeof paymentRequestJson === "string" ? paymentRequestJson : undefined,
    );
    const merchantOrigin = merchantOriginFromV1 || merchantOriginFromPayment || "";
    const overrideUrl = typeof v1?.merchantX402MetadataUrl === "string" ? v1.merchantX402MetadataUrl : undefined;

    const expectedMerchant = normalizeMerchantId(merchantRaw);
    if (!expectedMerchant) return { ok: false, reason: "UNSUPPORTED_MERCHANT_ID" };

    // Compute required credits (refund + dispute fee).
    const paymentAmountMicrousdc =
      typeof paymentDetails?.amountMicrousdc === "number" ? Math.round(paymentDetails.amountMicrousdc) : undefined;
    const disputeFeeMicrousdc =
      typeof paymentDetails?.disputeFee === "number" && Number.isFinite(paymentDetails.disputeFee) && paymentDetails.disputeFee > 0
        ? Math.round(paymentDetails.disputeFee * 1_000_000)
        : 0;
    const requiredMicrousdc =
      typeof paymentAmountMicrousdc === "number" ? paymentAmountMicrousdc + disputeFeeMicrousdc : undefined;

    const balance: any =
      typeof requiredMicrousdc === "number"
        ? await (ctx.runQuery as any)(api.pool.getMerchantUsdcBalanceMicrousdc, { merchant: expectedMerchant })
        : null;
    const hasSufficientCredits: boolean =
      typeof requiredMicrousdc === "number" &&
      balance?.ok === true &&
      typeof balance.availableMicrousdc === "number" &&
      balance.availableMicrousdc >= requiredMicrousdc;

    // If we can't determine the merchant origin, return what we can.
    if (!merchantOrigin && !overrideUrl) {
      return {
        ok: true,
        merchant: expectedMerchant,
        origin: null,
        supportEmail: null,
        verified: false,
        requiredMicrousdc,
        requiredUsdc: typeof requiredMicrousdc === "number" ? requiredMicrousdc / 1_000_000 : null,
        hasSufficientCredits,
      };
    }

    const metadataUrl = overrideUrl || new URL("/.well-known/x402.json", merchantOrigin).toString();
    const fetched = await fetchX402Json(metadataUrl);
    if (!fetched.ok) {
      return {
        ok: true,
        merchant: expectedMerchant,
        origin: merchantOrigin || null,
        supportEmail: null,
        verified: false,
        requiredMicrousdc,
        requiredUsdc: typeof requiredMicrousdc === "number" ? requiredMicrousdc / 1_000_000 : null,
        hasSufficientCredits,
        reason: fetched.code,
      };
    }

    const supportEmail = fetched.data?.x402refunds?.supportEmail;
    const email = supportEmail && isLikelyEmailAddress(String(supportEmail)) ? String(supportEmail) : null;
    const verified: any = email
      ? await (ctx.runQuery as any)(api.merchantEmailVerification.getVerification, {
          merchant: expectedMerchant,
          origin: merchantOrigin,
          supportEmail: email,
        })
      : null;

    return {
      ok: true,
      merchant: expectedMerchant,
      origin: merchantOrigin || null,
      supportEmail: email,
      verified: Boolean(verified),
      requiredMicrousdc,
      requiredUsdc: typeof requiredMicrousdc === "number" ? requiredMicrousdc / 1_000_000 : null,
      hasSufficientCredits,
    };
  },
});

export const markRefundExecutedEmailSent: any = internalMutation({
  args: { refundId: v.id("refundTransactions"), sentTo: v.string() },
  handler: async (ctx: any, args: any) => {
    const now = Date.now();
    await ctx.db.patch(args.refundId, {
      merchantRefundExecutedEmailSentAt: now,
      merchantRefundExecutedEmailSentTo: String(args.sentTo || ""),
    });
    return { ok: true };
  },
});

export const notifyMerchantRefundExecuted: any = internalAction({
  args: { caseId: v.id("cases"), refundId: v.id("refundTransactions") },
  handler: async (ctx: any, args: { caseId: any; refundId: any }): Promise<any> => {
    const refund: any = await (ctx.runQuery as any)(internalApi.refunds.getRefundTransaction, {
      refundId: args.refundId,
    });
    if (!refund) return { ok: false, emailed: false, reason: "REFUND_NOT_FOUND" };
    if (String(refund.caseId) !== String(args.caseId)) return { ok: false, emailed: false, reason: "CASE_REFUND_MISMATCH" };
    if (refund.status !== "EXECUTED") return { ok: true, emailed: false, reason: "REFUND_NOT_EXECUTED" };
    if (typeof refund.merchantRefundExecutedEmailSentAt === "number") return { ok: true, emailed: false, reason: "ALREADY_SENT" };

    // NOTE: Cast runQuery to any to avoid excessively-deep type instantiations from generated Convex query types.
    const caseData: any = await (ctx.runQuery as any)(api.cases.getCaseById, { caseId: args.caseId });
    if (!caseData) return { ok: false, emailed: false, reason: "CASE_NOT_FOUND" };

    const merchantRaw = String(caseData.defendant || "");
    const v1 = caseData?.metadata?.v1 || {};

    if (v1?.endpointPayToMatch !== true) {
      return { ok: true, emailed: false, reason: "ENDPOINT_PAYTO_UNVERIFIED" };
    }

    const paymentDetails = caseData?.paymentDetails;
    const paymentRequestJson = paymentDetails?.plaintiffMetadata?.requestJson;

    // Wallet-first stores merchantOrigin in metadata.v1. Legacy payment disputes store requestJson in paymentDetails.*.
    const merchantOriginFromV1 = typeof v1?.merchantOrigin === "string" ? v1.merchantOrigin : "";
    const merchantOriginFromPayment = deriveMerchantOriginFromRequestJson(
      typeof paymentRequestJson === "string" ? paymentRequestJson : undefined,
    );
    const merchantOrigin = merchantOriginFromV1 || merchantOriginFromPayment || "";
    const overrideUrl = typeof v1?.merchantX402MetadataUrl === "string" ? v1.merchantX402MetadataUrl : undefined;
    if (!merchantOrigin && !overrideUrl) return { ok: true, emailed: false, reason: "NO_MERCHANT_ORIGIN" };

    const metadataUrl = overrideUrl || new URL("/.well-known/x402.json", merchantOrigin).toString();
    const fetched = await fetchX402Json(metadataUrl);
    if (!fetched.ok) return { ok: true, emailed: false, reason: fetched.code };

    const expectedMerchant = normalizeMerchantId(merchantRaw);
    if (!expectedMerchant) return { ok: true, emailed: false, reason: "UNSUPPORTED_MERCHANT_ID" };

    const supportEmail = fetched.data?.x402refunds?.supportEmail;
    if (!supportEmail || !isLikelyEmailAddress(String(supportEmail))) {
      return { ok: true, emailed: false, reason: "MISSING_SUPPORT_EMAIL" };
    }

    // Only send ongoing emails after verification for this (merchant, origin).
    const verified = await (ctx.runQuery as any)(internalApi.merchantEmailVerification.getVerification, {
      merchant: expectedMerchant,
      origin: merchantOrigin,
      supportEmail: String(supportEmail),
    });
    if (!verified) return { ok: true, emailed: false, reason: "AWAITING_EMAIL_VERIFICATION" };

    const amountMicrousdc =
      typeof refund.amountMicrousdc === "number"
        ? Math.round(refund.amountMicrousdc)
        : typeof refund.amount === "number"
          ? Math.round(refund.amount * 1_000_000)
          : null;

    const subject = `Refund processed (${String(args.caseId).slice(0, 8)})`;
    const text = buildMerchantRefundExecutedEmailCopy({
      caseId: String(args.caseId),
      amountMicrousdc,
      explorerUrl: typeof refund.explorerUrl === "string" ? refund.explorerUrl : null,
      refundTxHash: typeof refund.refundTxHash === "string" ? refund.refundTxHash : null,
      trackingUrl: `https://x402refunds.com/cases/${encodeURIComponent(String(args.caseId))}`,
    });

    const sent = await sendEmail({
      to: String(supportEmail),
      subject,
      text,
      replyTo: String(supportEmail),
    });
    if (!sent.ok) return { ok: true, emailed: false, reason: sent.code, details: sent.message };

    await (ctx.runMutation as any)(internalApi.merchantNotifications.markRefundExecutedEmailSent, {
      refundId: args.refundId,
      sentTo: String(supportEmail),
    });

    return { ok: true, emailed: true };
  },
});

/**
 * Simple throttle so resend can't be spammed. Stored on cases.metadata.v1.lastResendAt.
 */
export const throttleResendForCase = internalMutation({
  args: { caseId: v.id("cases"), minIntervalMs: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const minIntervalMs = Math.max(5_000, Math.min(args.minIntervalMs ?? 60_000, 10 * 60_000));
    const row: any = await ctx.db.get(args.caseId);
    if (!row) return { ok: false, code: "NOT_FOUND" };

    const now = Date.now();
    const meta: any = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
    const v1: any = meta.v1 && typeof meta.v1 === "object" ? meta.v1 : {};
    const last = typeof v1.lastResendAt === "number" ? v1.lastResendAt : 0;
    const waitMs = last ? Math.max(0, minIntervalMs - (now - last)) : 0;
    if (waitMs > 0) return { ok: false, code: "RATE_LIMITED", waitMs };

    await ctx.db.patch(args.caseId, {
      metadata: {
        ...meta,
        v1: {
          ...v1,
          lastResendAt: now,
        },
      },
    });

    return { ok: true };
  },
});
