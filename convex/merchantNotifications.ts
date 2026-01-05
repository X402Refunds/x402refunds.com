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
  lines.push("View:");
  lines.push(`- https://x402disputes.com/disputes?merchant=${encodeURIComponent(params.merchant)}`);
  lines.push(`- https://api.x402disputes.com/v1/dispute?id=${encodeURIComponent(params.caseId)}`);
  lines.push("");
  lines.push("If you publish /.well-known/x402.json, this email is sent to supportEmail.");
  return lines.join("\n");
}

export const notifyMerchantDisputeFiled = internalAction({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args): Promise<{ ok: boolean; emailed?: boolean; reason?: string }> => {
    const caseData: any = await ctx.runQuery((internal as any).cases.getCase, { caseId: args.caseId });
    if (!caseData) return { ok: false, reason: "CASE_NOT_FOUND" };

    const merchant = String(caseData.defendant || "");
    const buyer = String(caseData.plaintiff || "");
    const v1 = caseData?.metadata?.v1 || {};

    const merchantOrigin = typeof v1?.merchantOrigin === "string" ? v1.merchantOrigin : "";
    const overrideUrl = typeof v1?.merchantX402MetadataUrl === "string" ? v1.merchantX402MetadataUrl : undefined;
    if (!merchantOrigin && !overrideUrl) return { ok: true, emailed: false, reason: "NO_MERCHANT_ORIGIN" };

    const metadataUrl = overrideUrl || new URL("/.well-known/x402.json", merchantOrigin).toString();
    const fetched = await fetchX402Json(metadataUrl);
    if (!fetched.ok) return { ok: true, emailed: false, reason: fetched.code };

    const jsonMerchant = fetched.data?.x402disputes?.merchant;
    if (!jsonMerchant || String(jsonMerchant) !== merchant) {
      return { ok: true, emailed: false, reason: "MERCHANT_MISMATCH" };
    }

    const supportEmail = fetched.data?.x402disputes?.supportEmail;
    if (!supportEmail || !isLikelyEmailAddress(String(supportEmail))) {
      return { ok: true, emailed: false, reason: "MISSING_SUPPORT_EMAIL" };
    }

    const amountMicrousdc =
      typeof v1?.amountMicrousdc === "number"
        ? v1.amountMicrousdc
        : typeof v1?.amountMicrousdc === "string" && /^\d+$/.test(v1.amountMicrousdc)
          ? Number(v1.amountMicrousdc)
          : undefined;

    const subject = `New dispute filed (${String(args.caseId).slice(0, 8)})`;
    const text = buildMerchantEmailText({
      caseId: String(args.caseId),
      buyer,
      merchant,
      reason: typeof v1?.reason === "string" ? v1.reason : undefined,
      amountMicrousdc,
      txHash: typeof v1?.txHash === "string" ? v1.txHash : undefined,
      chain: typeof v1?.chain === "string" ? v1.chain : undefined,
    });

    const sent = await sendEmail({
      to: String(supportEmail),
      subject,
      text,
      replyTo: String(supportEmail),
    });

    if (!sent.ok) {
      return { ok: true, emailed: false, reason: sent.code };
    }

    return { ok: true, emailed: true };
  },
});

