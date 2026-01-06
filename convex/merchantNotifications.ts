/**
 * Merchant notification pipeline for wallet-first disputes (v1).
 *
 * Goal: No-signup notifications. If the merchant publishes /.well-known/x402.json
 * and it strictly matches the merchant wallet in the dispute, we email supportEmail.
 */

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { sendEmail } from "./lib/email";

type X402Metadata = {
  x402disputes?: {
    merchant?: string;
    supportEmail?: string;
  };
};

function normalizeMerchantIdForBase(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  if (/^eip155:\d+:0x[a-fA-F0-9]{40}$/.test(s)) {
    const m = s.match(/^eip155:(\d+):(0x[a-fA-F0-9]{40})$/);
    if (!m) return null;
    return `eip155:${m[1]}:${m[2].toLowerCase()}`;
  }
  if (/^0x[a-fA-F0-9]{40}$/.test(s)) return `eip155:8453:${s.toLowerCase()}`;
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
        "User-Agent": "x402Disputes/1.0 (+https://x402disputes.com)",
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

function buildMerchantEmailText(params: {
  caseId: string;
  buyer: string;
  merchant: string;
  reason?: string;
  amountMicrousdc?: number;
  txHash?: string;
  chain?: string;
  actions?: {
    approveFullUrl: string;
    approvePartialUrl: string;
    rejectUrl: string;
  };
}): string {
  const lines: string[] = [];
  lines.push("New dispute filed");
  lines.push("");
  lines.push(`Case: ${params.caseId}`);
  lines.push(`Merchant: ${params.merchant}`);
  lines.push(`Buyer: ${params.buyer}`);
  if (params.reason) lines.push(`Reason: ${params.reason}`);
  if (typeof params.amountMicrousdc === "number") lines.push(`Amount: ${params.amountMicrousdc / 1_000_000} USDC`);
  if (params.chain) lines.push(`Chain: ${params.chain}`);
  if (params.txHash) lines.push(`Tx: ${params.txHash}`);
  lines.push("");
  if (params.actions) {
    lines.push("Actions:");
    lines.push(`- Approve full refund: ${params.actions.approveFullUrl}`);
    lines.push(`- Approve partial refund (50%): ${params.actions.approvePartialUrl}`);
    lines.push(`- Reject dispute: ${params.actions.rejectUrl}`);
    lines.push("");
  }
  lines.push("View:");
  lines.push(`- https://x402disputes.com/disputes?merchant=${encodeURIComponent(params.merchant)}`);
  lines.push(`- https://api.x402disputes.com/v1/dispute?id=${encodeURIComponent(params.caseId)}`);
  lines.push("");
  lines.push("If you publish /.well-known/x402.json, this email is sent to supportEmail.");
  return lines.join("\n");
}

function buildMerchantVerificationEmailText(params: {
  merchant: string;
  origin: string;
  supportEmail: string;
  confirmUrl: string;
  dispute: {
    caseId: string;
    buyer: string;
    reason?: string;
    amountMicrousdc?: number;
    txHash?: string;
    chain?: string;
  };
}): string {
  const lines: string[] = [];
  lines.push("Confirm dispute emails");
  lines.push("");
  lines.push(`Merchant: ${params.merchant}`);
  lines.push(`Origin: ${params.origin}`);
  lines.push(`Email: ${params.supportEmail}`);
  lines.push("");
  lines.push("Click to confirm you want to receive dispute emails:");
  lines.push(params.confirmUrl);
  lines.push("");
  lines.push("Dispute received:");
  lines.push(buildMerchantEmailText({
    caseId: params.dispute.caseId,
    buyer: params.dispute.buyer,
    merchant: params.merchant,
    reason: params.dispute.reason,
    amountMicrousdc: params.dispute.amountMicrousdc,
    txHash: params.dispute.txHash,
    chain: params.dispute.chain,
  }));
  lines.push("");
  lines.push("Until you confirm, we will not email future disputes for this origin.");
  return lines.join("\n");
}

export const notifyMerchantDisputeFiled = internalAction({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args): Promise<{ ok: boolean; emailed?: boolean; reason?: string; details?: string }> => {
    const caseData: any = await ctx.runQuery((internal as any).cases.getCase, { caseId: args.caseId });
    if (!caseData) return { ok: false, reason: "CASE_NOT_FOUND" };

    const merchantRaw = String(caseData.defendant || "");
    const buyer = String(caseData.plaintiff || "");
    const v1 = caseData?.metadata?.v1 || {};

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

    const expectedMerchant =
      paymentChain === "base" || merchantRaw.startsWith("eip155:")
        ? normalizeMerchantIdForBase(merchantRaw)
        : null;
    if (!expectedMerchant) return { ok: true, emailed: false, reason: "UNSUPPORTED_MERCHANT_ID" };

    const jsonMerchantRaw = fetched.data?.x402disputes?.merchant;
    const jsonMerchant =
      typeof jsonMerchantRaw === "string" ? normalizeMerchantIdForBase(jsonMerchantRaw) : null;
    if (!jsonMerchant || jsonMerchant !== expectedMerchant) {
      return { ok: true, emailed: false, reason: "MERCHANT_MISMATCH" };
    }

    const supportEmail = fetched.data?.x402disputes?.supportEmail;
    if (!supportEmail || !isLikelyEmailAddress(String(supportEmail))) {
      return { ok: true, emailed: false, reason: "MISSING_SUPPORT_EMAIL" };
    }

    // Email verification gate: only send ongoing dispute emails after supportEmail confirms for this (merchant, origin).
    const verified = await ctx.runQuery((internal as any).merchantEmailVerification.getVerification, {
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
      typeof v1?.reason === "string"
        ? v1.reason
        : typeof caseData?.description === "string"
          ? caseData.description
          : undefined;
    const txHash =
      typeof v1?.txHash === "string"
        ? v1.txHash
        : typeof paymentDetails?.transactionHash === "string"
          ? paymentDetails.transactionHash
          : undefined;
    const chain =
      typeof v1?.chain === "string"
        ? v1.chain
        : typeof paymentChain === "string"
          ? paymentChain
          : undefined;

    if (!verified) {
      const tokenRes = await ctx.runMutation(
        (internal as any).merchantEmailVerification.createOrReuseVerificationToken,
        {
          merchant: expectedMerchant,
          origin: merchantOrigin,
          supportEmail: String(supportEmail),
        },
      );

      if (!tokenRes?.shouldSend) {
        return { ok: true, emailed: false, reason: "AWAITING_EMAIL_VERIFICATION" };
      }

      const confirmUrl = `https://api.x402disputes.com/v1/merchant/verify-email?token=${encodeURIComponent(
        String(tokenRes.token),
      )}`;

      const subject = `Confirm dispute emails (${expectedMerchant.slice(0, 18)}…)`;
      const text = buildMerchantVerificationEmailText({
        merchant: expectedMerchant,
        origin: String(tokenRes.origin || merchantOrigin),
        supportEmail: String(supportEmail),
        confirmUrl,
        dispute: {
          caseId: String(args.caseId),
          buyer,
          reason,
          amountMicrousdc,
          txHash,
          chain,
        },
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

    const subject = `New dispute filed (${String(args.caseId).slice(0, 8)})`;
    const paymentAmountMicrousdc =
      typeof paymentDetails?.amountMicrousdc === "number" ? Math.round(paymentDetails.amountMicrousdc) : undefined;
    const actions =
      typeof paymentAmountMicrousdc === "number" && paymentAmountMicrousdc > 0
        ? await ctx.runMutation((internal as any).merchantEmailActions.createActionTokensForCase, {
            caseId: args.caseId,
            merchant: expectedMerchant,
            origin: merchantOrigin,
            supportEmail: String(supportEmail),
            paymentAmountMicrousdc,
          })
        : null;

    const baseActionUrl = "https://api.x402disputes.com/v1/merchant/action?token=";
    const text = buildMerchantEmailText({
      caseId: String(args.caseId),
      buyer,
      merchant: expectedMerchant,
      reason,
      amountMicrousdc,
      txHash,
      chain,
      actions: actions
        ? {
            approveFullUrl: `${baseActionUrl}${encodeURIComponent(String(actions.approveFull))}`,
            approvePartialUrl: `${baseActionUrl}${encodeURIComponent(String(actions.approvePartial))}`,
            rejectUrl: `${baseActionUrl}${encodeURIComponent(String(actions.reject))}`,
          }
        : undefined,
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

