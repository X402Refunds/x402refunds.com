// Avoid TS2589 (excessively deep type instantiation) by importing generated API as JS and treating it as `any`.
import * as apiMod from "../_generated/api.js";
const api: any = (apiMod as any).api;
import { parseDuplicatePaymentDisputeError } from "./duplicateDispute";

const SOLANA_BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]+$/;

type ParsedMerchant =
  | { ok: true; namespace: "eip155"; chainId: string; address: `0x${string}`; caip10: string }
  | { ok: true; namespace: "solana"; chainId: string; address: string; caip10: string }
  | { ok: false; code: string; message: string };

function parseMerchantCaip10(input: string): ParsedMerchant {
  const raw = (input || "").trim();
  const parts = raw.split(":");
  if (parts.length !== 3) {
    return { ok: false, code: "INVALID_MERCHANT", message: "merchant must be CAIP-10 (namespace:chainId:address)" };
  }
  const [namespace, chainId, addrRaw] = parts;
  if (!namespace || !chainId || !addrRaw) {
    return { ok: false, code: "INVALID_MERCHANT", message: "merchant must be CAIP-10 (namespace:chainId:address)" };
  }
  if (namespace === "eip155") {
    if (!/^\d+$/.test(chainId)) return { ok: false, code: "INVALID_CHAIN_ID", message: "eip155 chainId must be numeric" };
    if (!/^0x[a-fA-F0-9]{40}$/.test(addrRaw)) {
      return { ok: false, code: "INVALID_ADDRESS", message: "eip155 address must be 0x + 40 hex chars" };
    }
    const address = addrRaw.toLowerCase() as `0x${string}`;
    const caip10 = `eip155:${chainId}:${address}`;
    return { ok: true, namespace: "eip155", chainId, address, caip10 };
  }
  if (namespace === "solana") {
    const addr = addrRaw.trim();
    if (!SOLANA_BASE58_RE.test(addr) || addr.length < 32 || addr.length > 64) {
      return { ok: false, code: "INVALID_ADDRESS", message: "solana address must be base58" };
    }
    const caip10 = `solana:${chainId}:${addr}`;
    return { ok: true, namespace: "solana", chainId, address: addr, caip10 };
  }
  return { ok: false, code: "UNSUPPORTED_NAMESPACE", message: "merchant namespace must be eip155 or solana" };
}

function deriveBlockchainAndRecipient(parsed: ParsedMerchant) {
  if (!parsed.ok) return parsed;
  if (parsed.namespace === "eip155") {
    // Canonical support: Base mainnet only (8453) for X-402 USDC.
    if (parsed.chainId !== "8453") {
      return { ok: false as const, code: "UNSUPPORTED_CHAIN", message: "Only eip155:8453 (Base) is supported for payment disputes" };
    }
    return { ok: true as const, blockchain: "base" as const, recipientAddress: parsed.address, merchantCaip10: parsed.caip10 };
  }
  return { ok: true as const, blockchain: "solana" as const, recipientAddress: parsed.address, merchantCaip10: parsed.caip10 };
}

function isValidTxHash(blockchain: "base" | "solana", txHash: string) {
  const t = (txHash || "").trim();
  if (blockchain === "base") return /^0x[a-fA-F0-9]{64}$/.test(t);
  return SOLANA_BASE58_RE.test(t) && t.length >= 32 && t.length <= 128;
}

export type CanonicalDisputeInput = {
  merchant: string; // CAIP-10
  merchantApiUrl: string; // https URL to endpoint the buyer called
  txHash: string;
  description: string;
  evidenceUrls?: string[];
  callbackUrl?: string;
  sourceTransferLogIndex?: number;
  // If caller has better evidence (MCP tool), pass it through:
  request?: unknown;
  response?: unknown;
};

export type CanonicalDisputeResult =
  | {
      ok: true;
      caseId: string;
      trackingUrl: string;
      /** True if this call created a new case. False if it returned an existing case (duplicate). */
      created?: boolean;
      /** Convenience: true when created=false */
      duplicate?: boolean;
      evidenceUrls?: string[];
      disputeFee?: number;
      status?: string;
    }
  | { ok: false; code: string; message: string; field?: string };

export async function fileCanonicalDispute(ctx: any, input: CanonicalDisputeInput): Promise<CanonicalDisputeResult> {
  const merchantRaw = (input.merchant || "").trim();
  if (!merchantRaw) return { ok: false, code: "MISSING_MERCHANT", message: "merchant (CAIP-10) is required", field: "merchant" };

  const parsedMerchant = parseMerchantCaip10(merchantRaw);
  if (!parsedMerchant.ok) return { ok: false, code: parsedMerchant.code, message: parsedMerchant.message, field: "merchant" };

  const derived = deriveBlockchainAndRecipient(parsedMerchant);
  if (!derived.ok) return { ok: false, code: derived.code, message: derived.message, field: "merchant" };

  const merchantApiUrlRaw = (input.merchantApiUrl || "").trim();
  if (!merchantApiUrlRaw) return { ok: false, code: "MISSING_MERCHANT_API_URL", message: "merchantApiUrl is required", field: "merchantApiUrl" };

  let merchantOrigin: string;
  try {
    const u = new URL(merchantApiUrlRaw);
    if (u.protocol !== "https:") throw new Error("merchantApiUrl must be https://");
    merchantOrigin = u.origin;
  } catch (e: any) {
    return { ok: false, code: "INVALID_MERCHANT_API_URL", message: e?.message || "Invalid merchantApiUrl", field: "merchantApiUrl" };
  }

  const txHash = (input.txHash || "").trim();
  if (!txHash) return { ok: false, code: "MISSING_TX_HASH", message: "txHash is required", field: "txHash" };
  if (!isValidTxHash(derived.blockchain, txHash)) {
    return { ok: false, code: "INVALID_TX_HASH", message: `txHash format invalid for ${derived.blockchain}`, field: "txHash" };
  }

  const description = (input.description || "").trim();
  if (description.length < 10 || description.length > 500) {
    return { ok: false, code: "INVALID_DESCRIPTION", message: "description must be 10-500 chars", field: "description" };
  }

  const evidenceUrls =
    Array.isArray(input.evidenceUrls)
      ? input.evidenceUrls.filter((u) => typeof u === "string" && u.trim()).map((u) => u.trim())
      : [];

  const callbackUrl = typeof input.callbackUrl === "string" && input.callbackUrl.trim() ? input.callbackUrl.trim() : undefined;

  // Synthesize minimal request/response unless caller provides better evidence.
  const requestObj =
    input.request && typeof input.request === "object"
      ? input.request
      : {
          method: "POST",
          url: merchantApiUrlRaw,
          headers: {},
          body: {},
        };

  const responseObj =
    input.response && typeof input.response === "object"
      ? input.response
      : {
          status: 500,
          headers: {},
          body: {},
        };

  const paymentDisputeArgs: any = {
    transactionHash: txHash,
    blockchain: derived.blockchain,
    recipientAddress: derived.recipientAddress,
    sourceTransferLogIndex: typeof input.sourceTransferLogIndex === "number" ? input.sourceTransferLogIndex : undefined,
    disputeReason: "other",
    description,
    evidenceUrls,
    callbackUrl,
    // Used by merchantNotifications to derive merchant origin from requestJson.
    plaintiffMetadata: {
      requestJson: JSON.stringify(requestObj),
    },
    defendantMetadata: {
      responseJson: JSON.stringify(responseObj),
      merchantId: derived.merchantCaip10,
      merchantOrigin,
    },
  };

  // Try to assign to the merchant’s org for review (best-effort).
  try {
    const defendantAgent = await ctx.runQuery((api as any).agents.getAgentByWallet as any, {
      walletAddress: derived.recipientAddress,
    });
    if (defendantAgent?.organizationId) {
      paymentDisputeArgs.reviewerOrganizationId = defendantAgent.organizationId;
    }
  } catch {
    // ignore
  }

  let result: any = null;
  try {
    result = await ctx.runAction((api as any).paymentDisputes.receivePaymentDispute, paymentDisputeArgs);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    const dup = parseDuplicatePaymentDisputeError(message);
    if (dup?.existingCaseId) {
      const caseId = String(dup.existingCaseId);
      return {
        ok: true,
        caseId,
        trackingUrl: `https://x402refunds.com/cases/${caseId}`,
        created: false,
        duplicate: true,
        evidenceUrls,
        status: typeof dup.status === "string" ? dup.status : undefined,
      };
    }
    return { ok: false, code: "INTAKE_FAILED", message };
  }

  const caseId = typeof result?.caseId === "string" ? result.caseId : "";
  const trackingUrl = `https://x402refunds.com/cases/${caseId}`;
  if (!caseId) return { ok: false, code: "INTERNAL_ERROR", message: "Failed to create case" };

  return {
    ok: true,
    caseId,
    trackingUrl,
    created: true,
    duplicate: false,
    evidenceUrls,
    disputeFee: typeof result?.fee === "number" ? result.fee : undefined,
    status: typeof result?.status === "string" ? result.status : undefined,
  };
}

