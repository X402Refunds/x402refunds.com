/**
 * Merchant notification pipeline for wallet-first disputes (v1).
 *
 * Goal: No-signup notifications. We discover the merchant notification email from the seller's
 * `Link` header (refund-contact rel) on the sellerEndpointUrl 402 response, store it on the case,
 * and require per-wallet email verification for (origin, wallet, supportEmail).
 */

import { internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import * as apiMod from "./_generated/api.js";
import { sendEmail } from "./lib/email";
import { buildMerchantRefundExecutedEmailCopy } from "./lib/merchantRefundEmailCopy";
import { buildPartnerProcessedSummaryEmailCopy } from "./lib/partnerProcessedSummaryEmailCopy";
import { findLinkByRel, parseRefundContactEmailFromLinkUri } from "./lib/linkHeader";
import { parseX402PayTo } from "./lib/x402PayTo";

// Avoid TS2589 (excessively deep type instantiation) by importing generated API as JS and treating it as `any`.
const api: any = (apiMod as any).api;
const internalApi: any = (apiMod as any).internal;

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

function isLikelyEmailAddress(value: string): boolean {
  const s = value.trim();
  if (s.length < 3 || s.length > 320) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

async function resolveDexterPartnerProgram(ctx: any, caseData: any): Promise<any | null> {
  const meta = caseData?.metadata && typeof caseData.metadata === "object" ? caseData.metadata : {};
  const partnerMeta = meta?.partner && typeof meta.partner === "object" ? meta.partner : null;
  const partnerProgramId =
    partnerMeta && typeof (partnerMeta as any).partnerProgramId === "string" ? String((partnerMeta as any).partnerProgramId) : "";

  if (partnerProgramId) {
    try {
      const p = await (ctx.runQuery as any)((internalApi as any).partnerPrograms.getPartnerProgramByIdInternal, {
        partnerProgramId,
      });
      if (p && String(p.partnerKey || "").toLowerCase() === "dexter" && p.enabled === true) return p;
    } catch {
      // ignore
    }
  }

  // Fallback: canonical email routing (POC) — match by the refund-contact email stored on the case.
  const v1 = meta?.v1 && typeof meta.v1 === "object" ? meta.v1 : {};
  const emailRaw = typeof (v1 as any)?.paymentSupportEmail === "string" ? String((v1 as any).paymentSupportEmail) : "";
  const email = normalizeEmail(emailRaw);
  if (!email || email !== "refunds@dexter.cash") return null;

  try {
    const p = await (ctx.runQuery as any)((internalApi as any).partnerPrograms.getPartnerProgramByCanonicalEmailInternal, {
      canonicalEmail: email,
    });
    if (p && String(p.partnerKey || "").toLowerCase() === "dexter" && p.enabled === true) return p;
  } catch {
    // ignore
  }

  return null;
}

function buildDisputeSummaryLines(params: {
  caseId: string;
  reason?: string;
  amountMicrousdc?: number;
  txHash?: string;
  chain?: string;
}): string[] {
  const lines: string[] = [];
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
  lines.push(`[Case ID: ${params.caseId}]`);
  return lines.join("\n");
}

function buildMerchantVerificationEmailText(params: {
  merchant: string;
  origin: string;
  supportEmail: string;
  confirmUrl: string;
}): string {
  const lines: string[] = [];
  lines.push(`Merchant wallet: ${params.merchant}`);
  lines.push(`Merchant origin: ${params.origin}`);
  lines.push(`Notification email: ${params.supportEmail}`);
  lines.push("");
  lines.push("Click to verify your email:");
  lines.push(params.confirmUrl);
  lines.push("");
  lines.push("After you verify, we will email you the refund request details received for your agent.");
  lines.push("");
  lines.push("Sent by x402refunds.com");
  return lines.join("\n");
}

export const notifyMerchantDisputeFiled: any = internalAction({
  args: { caseId: v.id("cases") },
  handler: async (ctx: any, args: { caseId: any }): Promise<any> => {
    // NOTE: Cast runQuery to any to avoid excessively-deep type instantiations from generated Convex query types.
    let caseData: any = await (ctx.runQuery as any)(api.cases.getCaseById, { caseId: args.caseId });
    if (!caseData) return { ok: false, reason: "CASE_NOT_FOUND" };

    const merchantRaw = String(caseData.defendant || "");
    let v1 = caseData?.metadata?.v1 || {};

    // === Dexter partner routing (POC) ===
    // If this case is routed to Dexter by canonical refund-contact email, notify platform ops (not the canonical email).
    // This bypasses the endpoint payTo corroboration and email verification gates (Dexter is treated as a managed partner).
    const dexterPartner = await resolveDexterPartnerProgram(ctx, caseData);
    if (dexterPartner) {
      const meta: any = caseData?.metadata && typeof caseData.metadata === "object" ? caseData.metadata : {};
      const partnerMeta: any = meta?.partner && typeof meta.partner === "object" ? meta.partner : {};

      // Idempotency: avoid duplicate "received" emails.
      if (typeof partnerMeta?.receivedEmailSentAt === "number") {
        return { ok: true, emailed: false, reason: "PARTNER_RECEIVED_ALREADY_SENT" };
      }

      const to = normalizeEmail(String(dexterPartner.platformOpsEmail || ""));
      if (!to || !isLikelyEmailAddress(to)) {
        return { ok: true, emailed: false, reason: "PARTNER_EMAIL_NOT_CONFIGURED" };
      }

      const paymentDetails = caseData?.paymentDetails;
      const reason =
        typeof v1?.description === "string"
          ? v1.description
          : typeof caseData?.description === "string"
            ? caseData.description
            : undefined;
      const amountMicrousdc =
        typeof v1?.amountMicrousdc === "number"
          ? v1.amountMicrousdc
          : typeof paymentDetails?.amountMicrousdc === "number"
            ? paymentDetails.amountMicrousdc
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
          : typeof paymentDetails?.blockchain === "string"
            ? paymentDetails.blockchain
            : undefined;

      const subject = `Refund request received (Dexter) [${String(args.caseId).slice(0, 8)}]`;
      const lines: string[] = [];
      lines.push("Dexter partner POC: dispute routed by canonical refund-contact email.");
      lines.push(...buildDisputeSummaryLines({ caseId: String(args.caseId), reason, amountMicrousdc, txHash, chain }));
      lines.push("");
      lines.push("View case:");
      lines.push(`- https://x402refunds.com/cases/${encodeURIComponent(String(args.caseId))}`);
      lines.push("");
      lines.push("Sent by x402refunds.com");
      lines.push(`[Case ID: ${String(args.caseId)}]`);

      const sent = await sendEmail({
        to,
        subject,
        text: lines.join("\n"),
        replyTo: to,
      });
      if (!sent.ok) {
        return { ok: true, emailed: false, reason: sent.code, details: sent.message };
      }

      const now = Date.now();
      await (ctx.runMutation as any)((internalApi as any).merchantNotifications._patchCasePartnerMetadata, {
        caseId: args.caseId,
        patch: {
          receivedEmailSentAt: now,
          receivedEmailSentTo: to,
        },
      });

      return { ok: true, emailed: true, partner: "dexter" };
    }

    // If this case wasn't filed through the wallet-first pipeline, metadata.v1 may be missing.
    // Best-effort: attempt to refresh contact + payTo corroboration before gating.
    if (v1?.endpointPayToMatch !== true) {
      try {
        await (ctx.runAction as any)((internalApi as any).merchantNotifications.refreshMerchantContactForCase, {
          caseId: args.caseId,
        });
        caseData = await (ctx.runQuery as any)(api.cases.getCaseById, { caseId: args.caseId });
        v1 = caseData?.metadata?.v1 || v1;
      } catch {
        // ignore
      }
    }

    // Safety gate: only email if we were able to corroborate origin ⇄ wallet via seller endpoint payTo.
    // This prevents spam if a filer supplies an unrelated origin.
    if (v1?.endpointPayToMatch !== true) {
      console.info("merchantNotifications:notifyMerchantDisputeFiled: skip (ENDPOINT_PAYTO_UNVERIFIED)", {
        caseId: String(args.caseId),
      });
      return { ok: true, emailed: false, reason: "ENDPOINT_PAYTO_UNVERIFIED" };
    }

    const paymentDetails = caseData?.paymentDetails;
    const paymentChain = typeof paymentDetails?.blockchain === "string" ? paymentDetails.blockchain : undefined;

    const merchantOrigin = typeof v1?.merchantOrigin === "string" ? v1.merchantOrigin : "";
    if (!merchantOrigin) {
      console.info("merchantNotifications:notifyMerchantDisputeFiled: skip (NO_MERCHANT_ORIGIN)", {
        caseId: String(args.caseId),
      });
      return { ok: true, emailed: false, reason: "NO_MERCHANT_ORIGIN" };
    }

    const expectedMerchant = normalizeMerchantId(merchantRaw);
    if (!expectedMerchant) {
      console.info("merchantNotifications:notifyMerchantDisputeFiled: skip (UNSUPPORTED_MERCHANT_ID)", {
        caseId: String(args.caseId),
        merchant: merchantRaw,
      });
      return { ok: true, emailed: false, reason: "UNSUPPORTED_MERCHANT_ID" };
    }

    const supportEmail = typeof v1?.paymentSupportEmail === "string" ? v1.paymentSupportEmail : "";
    if (!supportEmail || !isLikelyEmailAddress(String(supportEmail))) {
      console.info("merchantNotifications:notifyMerchantDisputeFiled: skip (MISSING_SUPPORT_EMAIL)", {
        caseId: String(args.caseId),
      });
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
        console.info("merchantNotifications:notifyMerchantDisputeFiled: skip (AWAITING_EMAIL_VERIFICATION)", {
          caseId: String(args.caseId),
          merchant: expectedMerchant,
          origin: merchantOrigin,
          supportEmail: String(supportEmail),
        });
        return { ok: true, emailed: false, reason: "AWAITING_EMAIL_VERIFICATION" };
      }

      const confirmUrl = `https://api.x402refunds.com/v1/merchant/verify-email?token=${encodeURIComponent(
        String(tokenRes.token),
      )}`;

      const subject = "Action required - verify email.";
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
        console.warn("merchantNotifications:notifyMerchantDisputeFiled: verification email failed", {
          caseId: String(args.caseId),
          code: sent.code,
          message: sent.message,
        });
        return { ok: true, emailed: false, reason: sent.code, details: sent.message };
      }

      console.info("merchantNotifications:notifyMerchantDisputeFiled: verification email sent", {
        caseId: String(args.caseId),
        to: String(supportEmail),
      });
      return { ok: true, emailed: true, reason: "EMAIL_VERIFICATION_SENT" };
    }

    const subject = `Refund request received [${String(args.caseId).slice(0, 8)}]`;
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
      console.warn("merchantNotifications:notifyMerchantDisputeFiled: dispute email failed", {
        caseId: String(args.caseId),
        code: sent.code,
        message: sent.message,
      });
      return { ok: true, emailed: false, reason: sent.code, details: sent.message };
    }

    console.info("merchantNotifications:notifyMerchantDisputeFiled: dispute email sent", {
      caseId: String(args.caseId),
      to: String(supportEmail),
    });
    return { ok: true, emailed: true };
  },
});

/**
 * Best-effort: refresh case.metadata.v1.{merchantOrigin,paymentSupportEmail,endpointPayTo*}
 * by probing the sellerEndpointUrl. Useful for demo agents (GET=200, POST w/out payment=402)
 * and for older cases that were filed before we improved discovery.
 *
 * Never throws; never blocks callers.
 */
export const refreshMerchantContactForCase: any = internalAction({
  args: { caseId: v.id("cases") },
  handler: async (ctx: any, args: { caseId: any }): Promise<any> => {
    const caseData: any = await (ctx.runQuery as any)(api.cases.getCaseById, { caseId: args.caseId });
    if (!caseData) return { ok: false, reason: "CASE_NOT_FOUND" };

    const meta: any = caseData?.metadata && typeof caseData.metadata === "object" ? caseData.metadata : {};
    const v1: any = meta?.v1 && typeof meta.v1 === "object" ? meta.v1 : {};

    // Prefer wallet-first metadata, but fall back to requestJson for payment-dispute cases.
    let sellerEndpointUrl =
      typeof v1?.sellerEndpointUrl === "string" ? String(v1.sellerEndpointUrl).trim() : "";

    if (!sellerEndpointUrl) {
      const reqJson = caseData?.paymentDetails?.plaintiffMetadata?.requestJson;
      if (typeof reqJson === "string" && reqJson.trim()) {
        try {
          const parsed = JSON.parse(reqJson) as any;
          const url = typeof parsed?.url === "string" ? String(parsed.url).trim() : "";
          if (url && url.startsWith("https://")) {
            // Keep parity with /v1/refunds validation: require a path, not just an origin.
            const u = new URL(url);
            if (u.pathname && u.pathname !== "/") sellerEndpointUrl = u.toString();
          }
        } catch {
          // ignore
        }
      }
    }

    if (!sellerEndpointUrl) return { ok: false, reason: "NO_SELLER_ENDPOINT_URL" };

    let origin: string | null = null;
    try {
      origin = new URL(sellerEndpointUrl).origin;
    } catch {
      origin = null;
    }

    const recipientAddress =
      typeof caseData?.paymentDetails?.transactionHash === "string" ? null : null; // unused; keep for future
    void recipientAddress;

    let paymentSupportEmail: string | undefined = undefined;
    let endpointPayToCandidates: string[] | undefined = undefined;
    let endpointPayToMatch: boolean | undefined = undefined;
    let endpointPayToMismatch: boolean | undefined = undefined;

    const merchantRaw = String(caseData.defendant || "");
    const expectedMerchant = normalizeMerchantId(merchantRaw);
    // If we can't normalize merchant, we can still store origin + supportEmail for status UX.

    // Special-case: our demo agents may be hosted on the same origin as the dispute service.
    // Some serverless runtimes can restrict outbound fetch-to-self, so provide a deterministic fallback
    // so demo disputes still trigger the notification pipeline.
    try {
      const u = new URL(sellerEndpointUrl);
      if (u.origin === "https://api.x402refunds.com" && u.pathname.startsWith("/demo-agents/")) {
        const fallbackEmail = process.env.DEMO_AGENTS_REFUND_CONTACT_EMAIL || "refunds@x402refunds.com";
        paymentSupportEmail = fallbackEmail;
        if (expectedMerchant) {
          const parts = expectedMerchant.split(":");
          const expectedAddr = parts.length >= 3 ? String(parts[2] || "").trim() : "";
          if (expectedAddr) {
            endpointPayToCandidates = [expectedAddr];
            endpointPayToMatch = true;
            endpointPayToMismatch = false;
          }
        }
      }
    } catch {
      // ignore
    }

    const parseContact = (res: Response) => {
      const link = res.headers.get("Link") || "";
      const uri = findLinkByRel(link, "https://x402refunds.com/rel/refund-contact");
      const email = uri ? parseRefundContactEmailFromLinkUri(uri) : null;
      if (email) paymentSupportEmail = email;
    };

    const parsePayToFrom402 = async (res: Response) => {
      if (res.status !== 402) return;
      const paymentRequiredHeader = res.headers.get("PAYMENT-REQUIRED");
      const bodyText = await res.text().catch(() => null);
      const parsed = parseX402PayTo({ status: res.status, paymentRequiredHeader, bodyText });
      if (!parsed.ok) return;
      endpointPayToCandidates = parsed.payToCandidates;
      if (expectedMerchant) {
        const parts = expectedMerchant.split(":");
        const chain = parts.length >= 1 ? String(parts[0] || "").trim() : "";
        const expectedAddr = parts.length >= 3 ? String(parts[2] || "").trim() : "";
        if (expectedAddr) {
          // EVM addresses are case-insensitive; Solana base58 is case-sensitive.
          endpointPayToMatch =
            chain === "eip155"
              ? parsed.payToCandidates.some((x) => String(x).toLowerCase() === expectedAddr.toLowerCase())
              : parsed.payToCandidates.some((x) => String(x) === expectedAddr);
          endpointPayToMismatch = !endpointPayToMatch;
        }
      }
    };

    try {
      const getRes = await fetch(sellerEndpointUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(5_000),
      });
      parseContact(getRes);
      await parsePayToFrom402(getRes);

      if (getRes.status !== 402) {
        const postRes = await fetch(sellerEndpointUrl, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: "{}",
          signal: AbortSignal.timeout(5_000),
        });
        parseContact(postRes);
        await parsePayToFrom402(postRes);
      }
    } catch {
      // ignore
    }

    // Patch metadata.v1 with what we learned (never delete existing fields).
    const nextV1: any = { ...v1 };
    if (sellerEndpointUrl) nextV1.sellerEndpointUrl = sellerEndpointUrl;
    if (origin) nextV1.merchantOrigin = origin;
    if (paymentSupportEmail) nextV1.paymentSupportEmail = paymentSupportEmail;
    if (endpointPayToCandidates) nextV1.endpointPayToCandidates = endpointPayToCandidates;
    if (typeof endpointPayToMatch === "boolean") nextV1.endpointPayToMatch = endpointPayToMatch;
    if (typeof endpointPayToMismatch === "boolean") nextV1.endpointPayToMismatch = endpointPayToMismatch;

    await (ctx.runMutation as any)((internalApi as any).merchantNotifications._patchCaseMetadataV1, {
      caseId: args.caseId,
      v1: nextV1,
    });

    return {
      ok: true,
      origin: origin ?? null,
      supportEmail: paymentSupportEmail ?? null,
      endpointPayToMatch: typeof endpointPayToMatch === "boolean" ? endpointPayToMatch : null,
    };
  },
});

/**
 * Internal helper used by refreshMerchantContactForCase to patch metadata.v1 safely.
 */
export const _patchCaseMetadataV1: any = internalMutation({
  args: { caseId: v.id("cases"), v1: v.any() },
  handler: async (ctx: any, args: any) => {
    const row: any = await ctx.db.get(args.caseId);
    if (!row) return { ok: false, reason: "CASE_NOT_FOUND" };
    const meta: any = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
    await ctx.db.patch(args.caseId, {
      metadata: {
        ...meta,
        v1: args.v1,
      },
    });
    return { ok: true };
  },
});

export const _patchCasePartnerMetadata: any = internalMutation({
  args: { caseId: v.id("cases"), patch: v.any() },
  handler: async (ctx: any, args: any) => {
    const row: any = await ctx.db.get(args.caseId);
    if (!row) return { ok: false, reason: "CASE_NOT_FOUND" };
    const meta: any = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
    const partner: any = meta.partner && typeof meta.partner === "object" ? meta.partner : {};
    await ctx.db.patch(args.caseId, {
      metadata: {
        ...meta,
        partner: {
          ...partner,
          ...(args.patch && typeof args.patch === "object" ? args.patch : {}),
        },
      },
    });
    return { ok: true };
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
    const merchantOrigin = typeof v1?.merchantOrigin === "string" ? v1.merchantOrigin : "";

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
    if (!merchantOrigin) {
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

    const supportEmail = typeof v1?.paymentSupportEmail === "string" ? v1.paymentSupportEmail : "";
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

    // === Dexter partner routing (POC) ===
    // Route refund executed notifications to platform ops, and send a separate processed summary email
    // containing the AI decision (and on-chain proof when available).
    const dexterPartner = await resolveDexterPartnerProgram(ctx, caseData);
    if (dexterPartner) {
      const meta: any = caseData?.metadata && typeof caseData.metadata === "object" ? caseData.metadata : {};
      const partnerMeta: any = meta?.partner && typeof meta.partner === "object" ? meta.partner : {};

      const toOps = normalizeEmail(String(dexterPartner.platformOpsEmail || ""));
      if (!toOps || !isLikelyEmailAddress(toOps)) {
        return { ok: true, emailed: false, reason: "PARTNER_EMAIL_NOT_CONFIGURED" };
      }

      // 1) Executed email → platform ops (idempotent via refundTransactions fields).
      const subject = `Refund processed (Dexter) [${String(args.caseId).slice(0, 8)}]`;
      const amountMicrousdc =
        typeof refund.amountMicrousdc === "number"
          ? Math.round(refund.amountMicrousdc)
          : typeof refund.amount === "number"
            ? Math.round(refund.amount * 1_000_000)
            : null;
      const executedText = buildMerchantRefundExecutedEmailCopy({
        caseId: String(args.caseId),
        amountMicrousdc,
        explorerUrl: typeof refund.explorerUrl === "string" ? refund.explorerUrl : null,
        refundTxHash: typeof refund.refundTxHash === "string" ? refund.refundTxHash : null,
        trackingUrl: `https://x402refunds.com/cases/${encodeURIComponent(String(args.caseId))}`,
      });

      const sentExec = await sendEmail({
        to: toOps,
        subject,
        text: executedText,
        replyTo: toOps,
      });
      if (!sentExec.ok) return { ok: true, emailed: false, reason: sentExec.code, details: sentExec.message };

      await (ctx.runMutation as any)(internalApi.merchantNotifications.markRefundExecutedEmailSent, {
        refundId: args.refundId,
        sentTo: toOps,
      });

      // 2) Processed summary email → partner ops (POC override for refunds@dexter.cash).
      if (typeof partnerMeta?.processedSummaryEmailSentAt !== "number") {
        const partnerOpsRaw = normalizeEmail(String(dexterPartner.partnerOpsEmail || ""));
        const partnerTo =
          partnerOpsRaw === "refunds@dexter.cash" ? "vbkotecha@gmail.com" : partnerOpsRaw;
        if (partnerTo && isLikelyEmailAddress(partnerTo)) {
          const aiRec: any = caseData.aiRecommendation || {};
          const verdict =
            typeof caseData.finalVerdict === "string" && caseData.finalVerdict
              ? caseData.finalVerdict
              : typeof aiRec.verdict === "string"
                ? aiRec.verdict
                : "UNKNOWN";
          const summary2 =
            typeof aiRec.summary2 === "string" && aiRec.summary2.trim()
              ? aiRec.summary2.trim()
              : typeof aiRec.reasoning === "string"
                ? aiRec.reasoning.trim()
                : "";

          const processedSubject = `Refund request processed (Dexter) [${String(args.caseId).slice(0, 8)}]`;
          const processedText = buildPartnerProcessedSummaryEmailCopy({
            caseId: String(args.caseId),
            verdict,
            summary2,
            amountMicrousdc,
            explorerUrl: typeof refund.explorerUrl === "string" ? refund.explorerUrl : null,
            refundTxHash: typeof refund.refundTxHash === "string" ? refund.refundTxHash : null,
            trackingUrl: `https://x402refunds.com/cases/${encodeURIComponent(String(args.caseId))}`,
          });

          const sentProcessed = await sendEmail({
            to: partnerTo,
            subject: processedSubject,
            text: processedText,
            replyTo: partnerTo,
          });

          if (sentProcessed.ok) {
            const now = Date.now();
            await (ctx.runMutation as any)((internalApi as any).merchantNotifications._patchCasePartnerMetadata, {
              caseId: args.caseId,
              patch: {
                processedSummaryEmailSentAt: now,
                processedSummaryEmailSentTo: partnerTo,
              },
            });
          }
        }
      }

      return { ok: true, emailed: true, partner: "dexter" };
    }

    if (v1?.endpointPayToMatch !== true) {
      return { ok: true, emailed: false, reason: "ENDPOINT_PAYTO_UNVERIFIED" };
    }

    const paymentDetails = caseData?.paymentDetails;
    const merchantOrigin = typeof v1?.merchantOrigin === "string" ? v1.merchantOrigin : "";
    if (!merchantOrigin) return { ok: true, emailed: false, reason: "NO_MERCHANT_ORIGIN" };

    const expectedMerchant = normalizeMerchantId(merchantRaw);
    if (!expectedMerchant) return { ok: true, emailed: false, reason: "UNSUPPORTED_MERCHANT_ID" };

    const supportEmail = typeof v1?.paymentSupportEmail === "string" ? v1.paymentSupportEmail : "";
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

    const subject = `Refund processed [${String(args.caseId).slice(0, 8)}]`;
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
