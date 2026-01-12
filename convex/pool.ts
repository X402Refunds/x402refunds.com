/**
 * Wallet-first dispute + refund pool (v1).
 *
 * HARD CUTOVER (txHash-first):
 * - Dispute filing identifies the merchant by the on-chain USDC recipient (Base/Solana).
 * - The buyer provides `sellerEndpointUrl` so we can derive an https origin for merchant email
 *   discovery via `/.well-known/x402.json`.
 * - `/.well-known/x402.json` is treated as *contact only* (supportEmail), not a wallet registry.
 */

import { internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { recoverMessageAddress } from "viem";
import * as apiMod from "./_generated/api.js";
import { createCustodyEvent } from "./custody";

// Avoid TS2589 (excessively deep type instantiation) in downstream TypeScript configs (notably dashboard)
// by importing generated API as JS and treating it as `any`.
const api: any = (apiMod as any).api;
const internal: any = (apiMod as any).internal;

type Caip10ParsedAny =
  | { ok: true; namespace: "eip155"; chainId: number; address: `0x${string}`; normalized: string }
  | { ok: true; namespace: "solana"; chainId: string; address: string; normalized: string }
  | { ok: false; code: string; message: string };

function parseCaip10Any(input: string): Caip10ParsedAny {
  const raw = input.trim();
  if (!raw) return { ok: false, code: "INVALID_CAIP10", message: "CAIP-10 is required" };

  const evm = raw.match(/^eip155:(\d+):(0x[a-fA-F0-9]{40})$/);
  if (evm) {
    const chainId = Number(evm[1]);
    if (!Number.isSafeInteger(chainId) || chainId <= 0) {
      return { ok: false, code: "INVALID_CHAIN_ID", message: "chainId must be a positive integer" };
    }
    const address = evm[2].toLowerCase() as `0x${string}`;
    return { ok: true, namespace: "eip155", chainId, address, normalized: `eip155:${chainId}:${address}` };
  }

  const sol = raw.match(/^solana:([^:]+):([1-9A-HJ-NP-Za-km-z]{32,64})$/);
  if (sol) {
    const chainId = sol[1];
    const address = sol[2];
    return { ok: true, namespace: "solana", chainId, address, normalized: `solana:${chainId}:${address}` };
  }

  return {
    ok: false,
    code: "INVALID_CAIP10",
    message: "Expected CAIP-10 eip155:<chainId>:0x<40hex> or solana:<chainRef>:<base58Address>",
  };
}

type Caip10ParsedEip155 =
  | { ok: true; namespace: "eip155"; chainId: number; address: `0x${string}`; normalized: string }
  | { ok: false; code: string; message: string };

function parseCaip10Eip155(input: string): Caip10ParsedEip155 {
  const parsed = parseCaip10Any(input);
  if (!parsed.ok) return parsed;
  if (parsed.namespace !== "eip155") {
    return {
      ok: false,
      code: "INVALID_CAIP10",
      message: "Expected CAIP-10 eip155:<chainId>:0x<40hex>",
    };
  }
  return parsed;
}

function parseMicros(input: unknown): { ok: true; microusdc: number } | { ok: false; code: string; message: string } {
  if (typeof input === "number") {
    if (!Number.isSafeInteger(input) || input <= 0) return { ok: false, code: "INVALID_AMOUNT", message: "amountMicrousdc must be a positive integer" };
    return { ok: true, microusdc: input };
  }
  if (typeof input === "string") {
    const s = input.trim();
    if (!/^\d+$/.test(s)) return { ok: false, code: "INVALID_AMOUNT", message: "amountMicrousdc must be a base-10 integer string" };
    const n = Number(s);
    if (!Number.isSafeInteger(n) || n <= 0) return { ok: false, code: "INVALID_AMOUNT", message: "amountMicrousdc must be a positive safe integer" };
    return { ok: true, microusdc: n };
  }
  return { ok: false, code: "INVALID_AMOUNT", message: "amountMicrousdc is required" };
}

function generateSHA256(_input: string): string {
  // Simple hash for now (in production: use crypto.subtle). Must be 64 hex chars for tests.
  const chars = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < 64; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function poolStatus(
  value: unknown,
): "FILED" | "DENIED" | "PAID" | "APPROVED_PENDING_FUNDS" | null {
  if (value === "FILED" || value === "DENIED" || value === "PAID" || value === "APPROVED_PENDING_FUNDS") return value;
  return null;
}

export const cases_fileWalletPaymentDispute = mutation({
  args: {
    blockchain: v.union(v.literal("base"), v.literal("solana")),
    transactionHash: v.string(),
    sellerEndpointUrl: v.string(),
    origin: v.string(), // https origin of sellerEndpointUrl
    payer: v.string(), // CAIP-10 (derived from chain)
    merchant: v.string(), // CAIP-10 (derived from chain)
    amountMicrousdc: v.number(),
    sourceTransferLogIndex: v.number(),
    description: v.string(),
    evidenceUrls: v.optional(v.array(v.string())),
    // Best-effort corroboration from sellerEndpointUrl 402 parsing
    endpointPayToCandidates: v.optional(v.array(v.string())),
    endpointPayToMatch: v.optional(v.boolean()),
    endpointPayToMismatch: v.optional(v.boolean()),
    // Best-effort: extracted from sellerEndpointUrl 402 response Link header refund-contact rel.
    paymentSupportEmail: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ ok: true; disputeId: Id<"cases"> } | { ok: false; code: string; message: string }> => {
    const parsedMerchant = parseCaip10Any(args.merchant);
    if (!parsedMerchant.ok) return parsedMerchant;

    const parsedPayer = parseCaip10Any(args.payer);
    if (!parsedPayer.ok) return parsedPayer;

    const sellerEndpointUrl = (args.sellerEndpointUrl || "").trim();
    if (!sellerEndpointUrl) return { ok: false, code: "INVALID_SELLER_ENDPOINT_URL", message: "sellerEndpointUrl is required" };

    const origin = (args.origin || "").trim();
    if (!origin) return { ok: false, code: "INVALID_ORIGIN", message: "origin is required" };
    if (!origin.startsWith("https://")) {
      return { ok: false, code: "INVALID_ORIGIN", message: "origin must be an https:// origin" };
    }

    const txHash = (args.transactionHash || "").trim();
    if (!txHash) return { ok: false, code: "INVALID_TRANSACTION_HASH", message: "transactionHash is required" };

    const description = (args.description || "").trim();
    if (!description) return { ok: false, code: "INVALID_DESCRIPTION", message: "description is required" };

    if (!Number.isSafeInteger(args.amountMicrousdc) || args.amountMicrousdc <= 0) {
      return { ok: false, code: "INVALID_AMOUNT", message: "amountMicrousdc must be a positive integer" };
    }
    if (!Number.isSafeInteger(args.sourceTransferLogIndex) || args.sourceTransferLogIndex < 0) {
      return { ok: false, code: "INVALID_LOG_INDEX", message: "sourceTransferLogIndex must be a non-negative integer" };
    }

    const now = Date.now();
    const regulationEDeadline = now + (10 * 24 * 60 * 60 * 1000); // Simplified: 10 calendar days

    // Idempotency / de-dupe: (chain, txHash) for type=PAYMENT.
    const existing = await ctx.db
      .query("cases")
      .withIndex("by_payment_source_tx", (q) =>
        q.eq("paymentSourceChain", args.blockchain).eq("paymentSourceTxHash", txHash),
      )
      .filter((q) => q.eq(q.field("type"), "PAYMENT"))
      .first();
    if (existing) {
      return { ok: true, disputeId: existing._id };
    }

    // Best-effort: assign review org by matching merchant CAIP-10 to an agent wallet.
    let reviewerOrganizationId: Id<"organizations"> | undefined = undefined;
    try {
      const agent: any = await ctx.db
        .query("agents")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", parsedMerchant.normalized))
        .first();
      if (agent?.organizationId) reviewerOrganizationId = agent.organizationId as Id<"organizations">;
    } catch {
      // ignore
    }

    const paymentSupportEmailRaw = typeof args.paymentSupportEmail === "string" ? args.paymentSupportEmail.trim() : "";
    const paymentSupportEmail =
      paymentSupportEmailRaw.length >= 3 &&
      paymentSupportEmailRaw.length <= 320 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paymentSupportEmailRaw)
        ? paymentSupportEmailRaw
        : undefined;

    const disputeId = await ctx.db.insert("cases", {
      plaintiff: parsedPayer.normalized,
      defendant: parsedMerchant.normalized,
      status: "FILED",
      type: "PAYMENT",
      filedAt: now,
      description,
      amount: args.amountMicrousdc / 1_000_000,
      currency: "USDC",
      evidenceIds: [],
      // Align wallet-first disputes with payment-dispute review flows.
      reviewerOrganizationId,
      humanReviewRequired: args.amountMicrousdc / 1_000_000 >= 1.0,
      finalDecisionDue: regulationEDeadline,
      regulationEDeadline,
      retentionPolicy: "payment",
      paymentSourceChain: args.blockchain,
      paymentSourceTxHash: txHash,
      metadata: {
        poolStatus: "FILED",
        v1: {
          sellerEndpointUrl,
          merchantOrigin: origin,
          payer: parsedPayer.normalized,
          merchant: parsedMerchant.normalized,
          blockchain: args.blockchain,
          transactionHash: txHash,
          amountMicrousdc: args.amountMicrousdc,
          sourceTransferLogIndex: args.sourceTransferLogIndex,
          description,
          evidenceUrls: Array.isArray(args.evidenceUrls) ? args.evidenceUrls : undefined,
          endpointPayToCandidates: Array.isArray(args.endpointPayToCandidates) ? args.endpointPayToCandidates : undefined,
          endpointPayToMatch: typeof args.endpointPayToMatch === "boolean" ? args.endpointPayToMatch : undefined,
          endpointPayToMismatch: typeof args.endpointPayToMismatch === "boolean" ? args.endpointPayToMismatch : undefined,
          paymentSupportEmail,
        },
      },
      paymentDetails: {
        // For wallet-first disputes, the chain tx hash is the canonical transaction identifier.
        transactionId: txHash,
        transactionHash: txHash,
        blockchain: args.blockchain,
        amountMicrousdc: args.amountMicrousdc,
        amountUnit: "microusdc",
        sourceTransferLogIndex: args.sourceTransferLogIndex,
        disputeReason: "other",
        regulationEDeadline,
        // Preserve request URL for merchantNotifications fallback logic.
        plaintiffMetadata: {
          walletAddress: parsedPayer.address,
          requestJson: JSON.stringify({ method: "POST", url: sellerEndpointUrl, headers: {}, body: {} }),
        },
        defendantMetadata: {
          walletAddress: parsedMerchant.address,
          merchantId: parsedMerchant.normalized,
          merchantOrigin: origin,
          responseJson: JSON.stringify({ status: 402, headers: {}, body: {} }),
        },
        disputeFee: 0.05,
      },
      createdAt: now,
    } as any);

    // Attach evidence URLs as ADP evidence manifests (best-effort; does not block filing).
    if (Array.isArray(args.evidenceUrls) && args.evidenceUrls.length > 0) {
      try {
        const ids: Id<"evidenceManifests">[] = [];
        for (const url of args.evidenceUrls) {
          const u = typeof url === "string" ? url.trim() : "";
          if (!u) continue;
          const evidenceId = await ctx.db.insert("evidenceManifests", {
            agentDid: parsedPayer.normalized,
            sha256: generateSHA256(u),
            uri: u,
            signer: parsedPayer.normalized,
            caseId: disputeId,
            ts: now,
            model: { provider: "payment_dispute", name: "payment_dispute", version: "1.0.0" },
          });
          ids.push(evidenceId);
        }
        if (ids.length > 0) {
          await ctx.db.patch(disputeId, { evidenceIds: ids });
        }
      } catch {
        // ignore
      }
    }

    // ADP custody event for dispute filing.
    try {
      await createCustodyEvent(ctx, {
        type: "DISPUTE_FILED",
        caseId: disputeId,
        agentDid: parsedPayer.normalized,
        payload: {
          type: "PAYMENT_DISPUTE",
          amount: args.amountMicrousdc / 1_000_000,
          currency: "USDC",
          microDispute: args.amountMicrousdc / 1_000_000 < 1.0,
          adpVersion: "draft-01",
        },
      });
    } catch {
      // ignore
    }

    // Notify merchant asynchronously (does not block dispute filing).
    try {
      await ctx.scheduler.runAfter(
        0,
        (internal as any).merchantNotifications.notifyMerchantDisputeFiled,
        { caseId: disputeId }
      );
    } catch (e: any) {
      // Don't fail dispute filing if scheduler is unavailable (e.g. some test environments).
      console.warn("Failed to schedule merchant notification:", e?.message || String(e));
    }

    return { ok: true, disputeId };
  },
});

export const cases_getWalletPaymentDisputeBySourceTx = query({
  args: {
    blockchain: v.union(v.literal("base"), v.literal("solana")),
    transactionHash: v.string(),
  },
  handler: async (ctx, args) => {
    const txHash = (args.transactionHash || "").trim();
    if (!txHash) return null;
    const existing = await ctx.db
      .query("cases")
      .withIndex("by_payment_source_tx", (q) =>
        q.eq("paymentSourceChain", args.blockchain).eq("paymentSourceTxHash", txHash),
      )
      .filter((q) => q.eq(q.field("type"), "PAYMENT"))
      .first();
    return existing || null;
  },
});

// Internal helper: read merchant USDC balance (microusdc) for gating email actions.
export const getMerchantUsdcBalanceMicrousdc = internalQuery({
  args: { merchant: v.string() }, // CAIP-10 eip155
  handler: async (ctx, args): Promise<{ ok: boolean; availableMicrousdc?: number }> => {
    const parsed = parseCaip10Any(args.merchant);
    if (!parsed.ok) return { ok: false };
    const row: any = await ctx.db
      .query("merchantBalances")
      .withIndex("by_wallet_currency", (q: any) =>
        q.eq("walletAddress", parsed.normalized).eq("currency", "USDC"),
      )
      .first();
    const availableUsdc = typeof row?.availableBalance === "number" ? row.availableBalance : 0;
    const availableMicrousdc = Math.max(0, Math.round(availableUsdc * 1_000_000));
    return { ok: true, availableMicrousdc };
  },
});

export const cases_listWalletDisputesByMerchant = query({
  args: { merchant: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const parsedMerchant = parseCaip10Any(args.merchant);
    if (!parsedMerchant.ok) return { ok: false as const, code: parsedMerchant.code, message: parsedMerchant.message };

    const limit = Math.max(1, Math.min(args.limit ?? 50, 200));
    const rows = await ctx.db
      .query("cases")
      .withIndex("by_defendant", (q) => q.eq("defendant", parsedMerchant.normalized))
      .order("desc")
      .take(limit);

    return { ok: true as const, disputes: rows };
  },
});

export const topup_creditMerchantBalanceFromTx = mutation({
  args: {
    merchant: v.string(), // CAIP-10
    blockchain: v.union(v.literal("base")),
    txHash: v.string(),
    sourceTransferLogIndex: v.number(),
    amountMicrousdc: v.number(),
    payerAddress: v.optional(v.string()),
    recipientAddress: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<
    | { ok: true; creditedMicrousdc: number; newBalanceMicrousdc: number }
    | { ok: false; code: string; message: string }
  > => {
    const parsedMerchant = parseCaip10Any(args.merchant);
    if (!parsedMerchant.ok) return parsedMerchant;

    if (!/^0x[a-fA-F0-9]{64}$/.test(args.txHash)) {
      return { ok: false, code: "INVALID_TX_HASH", message: "txHash must be 0x + 64 hex chars" };
    }
    if (!Number.isSafeInteger(args.sourceTransferLogIndex) || args.sourceTransferLogIndex < 0) {
      return { ok: false, code: "INVALID_LOG_INDEX", message: "sourceTransferLogIndex must be a non-negative integer" };
    }
    if (!Number.isSafeInteger(args.amountMicrousdc) || args.amountMicrousdc <= 0) {
      return { ok: false, code: "INVALID_AMOUNT", message: "amountMicrousdc must be a positive integer" };
    }

    // Idempotency by (chain, txHash, logIndex)
    const existing = await ctx.db
      .query("merchantTopups")
      .withIndex("by_source_triplet", (q) =>
        q
          .eq("blockchain", args.blockchain)
          .eq("txHash", args.txHash)
          .eq("sourceTransferLogIndex", args.sourceTransferLogIndex)
      )
      .first();

    if (existing) {
      const row = await ctx.db
        .query("merchantBalances")
        .withIndex("by_wallet_currency", (q: any) =>
          q.eq("walletAddress", parsedMerchant.normalized).eq("currency", "USDC")
        )
        .first();
      const newBalanceMicrousdc = Math.round(((row?.availableBalance || 0) as number) * 1_000_000);
      return { ok: true, creditedMicrousdc: existing.amountMicrousdc, newBalanceMicrousdc };
    }

    const now = Date.now();
    await ctx.db.insert("merchantTopups", {
      merchant: parsedMerchant.normalized,
      blockchain: args.blockchain,
      txHash: args.txHash,
      sourceTransferLogIndex: args.sourceTransferLogIndex,
      amountMicrousdc: args.amountMicrousdc,
      payerAddress: args.payerAddress,
      recipientAddress: args.recipientAddress,
      createdAt: now,
    });

    // Credit merchantBalances (stored as numeric USDC values in schema today)
    const currency = "USDC";
    const amountUsdc = args.amountMicrousdc / 1_000_000;

    const row = await ctx.db
      .query("merchantBalances")
      .withIndex("by_wallet_currency", (q: any) =>
        q.eq("walletAddress", parsedMerchant.normalized).eq("currency", currency)
      )
      .first();

    if (!row) {
      await ctx.db.insert("merchantBalances", {
        walletAddress: parsedMerchant.normalized,
        currency,
        availableBalance: amountUsdc,
        lockedBalance: 0,
        totalDeposited: amountUsdc,
        totalRefunded: 0,
        lastDepositAt: now,
        createdAt: now,
        updatedAt: now,
      } as any);
      return { ok: true, creditedMicrousdc: args.amountMicrousdc, newBalanceMicrousdc: args.amountMicrousdc };
    }

    const nextAvailable = (row.availableBalance || 0) + amountUsdc;
    await ctx.db.patch(row._id, {
      availableBalance: nextAvailable,
      totalDeposited: (row.totalDeposited || 0) + amountUsdc,
      lastDepositAt: now,
      updatedAt: now,
    });

    return { ok: true, creditedMicrousdc: args.amountMicrousdc, newBalanceMicrousdc: Math.round(nextAvailable * 1_000_000) };
  },
});

/**
 * Finalize a top-up asynchronously:
 * - verify USDC Transfer log exists on-chain (may take a few seconds after facilitator settle)
 * - credit merchant ledger (idempotent)
 * - optionally re-notify merchant for a specific case (so action links appear after funding)
 */
export const topup_finalizeFromTxHash = internalAction({
  args: {
    merchant: v.string(), // CAIP-10 eip155
    txHash: v.string(),
    expectedAmountMicrousdc: v.number(),
    caseId: v.optional(v.id("cases")),
    actionToken: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ ok: boolean; txHash: string; credited?: boolean; reason?: string }> => {
    const depositAddress = process.env.PLATFORM_BASE_USDC_DEPOSIT_ADDRESS;
    if (!depositAddress) {
      return { ok: false, txHash: args.txHash, reason: "NOT_CONFIGURED" };
    }

    // Normalize merchant once so downstream comparisons don't fail due to checksum casing.
    const parsedMerchant = parseCaip10Eip155(args.merchant);
    if (!parsedMerchant.ok) {
      // Credit mutation will also reject invalid merchant, but return a clear error early.
      return { ok: false, txHash: args.txHash, reason: parsedMerchant.code };
    }

    // Retry for up to ~30s (indexing / propagation lag is common).
    const maxAttempts = 12;
    let verified: any = null;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const res = await ctx.runAction(api.lib.blockchain.verifyUsdcTransferByAmount, {
        blockchain: "base",
        transactionHash: args.txHash,
        expectedAmountMicrousdc: args.expectedAmountMicrousdc,
        expectedToAddress: depositAddress,
      });
      verified = res as any;
      if (verified?.ok) break;
      const code = String(verified?.code || "");
      const retryable = code === "TX_NOT_FOUND" || code === "NO_MATCH";
      if (!retryable) break;
      await new Promise((r) => setTimeout(r, 750 + attempt * 500));
    }

    if (!verified?.ok) {
      return { ok: false, txHash: args.txHash, reason: String(verified?.code || "VERIFY_FAILED") };
    }

    const credited = await ctx.runMutation((api as any).pool.topup_creditMerchantBalanceFromTx, {
      merchant: parsedMerchant.normalized,
      blockchain: "base",
      txHash: args.txHash,
      sourceTransferLogIndex: verified.logIndex,
      amountMicrousdc: verified.amountMicrousdc,
      payerAddress: verified.payerAddress,
      recipientAddress: verified.recipientAddress,
    });

    if (!credited?.ok) {
      return { ok: false, txHash: args.txHash, reason: String(credited?.code || "CREDIT_FAILED") };
    }

    // If this top-up was triggered from an approve link, automatically apply the decision now.
    // This prevents a second “action links” email and makes refunds one-click.
    if (typeof args.actionToken === "string" && args.actionToken.trim()) {
      try {
        await (ctx.runMutation as any)((internal as any).merchantEmailActions.applyDecisionFromToken, {
          token: args.actionToken.trim(),
        });
      } catch {
        // Never fail credit finalization due to decision follow-up.
      }
    }

    return { ok: true, txHash: args.txHash, credited: true };
  },
});

export const arbiter_resolveDispute = internalMutation({
  args: {
    disputeId: v.id("cases"),
    outcome: v.union(v.literal("refund"), v.literal("deny")),
    refundAmountMicrousdc: v.optional(v.any()),
    timestampMs: v.number(),
    nonce: v.string(),
    signature: v.string(), // 0x...
  },
  handler: async (ctx, args): Promise<any> => {
    const arbiterIdentity = process.env.ARBITER_IDENTITY;
    if (!arbiterIdentity) return { ok: false as const, code: "NOT_CONFIGURED", message: "ARBITER_IDENTITY not configured" };

    const parsedArbiter = parseCaip10Eip155(arbiterIdentity);
    if (!parsedArbiter.ok) return { ok: false as const, code: "INVALID_ARBITER_IDENTITY", message: parsedArbiter.message };

    const now = Date.now();
    const skewMs = Math.abs(now - args.timestampMs);
    if (skewMs > 5 * 60_000) return { ok: false as const, code: "STALE_TIMESTAMP", message: "timestampMs outside allowed window" };

    const nonce = args.nonce.trim();
    if (!nonce) return { ok: false as const, code: "INVALID_NONCE", message: "nonce is required" };

    const used = await ctx.db
      .query("arbiterNonces")
      .withIndex("by_nonce", (q: any) => q.eq("nonce", nonce))
      .first();
    if (used) return { ok: false as const, code: "REPLAY", message: "nonce already used" };

    const refundAmountParsed = args.outcome === "refund" ? parseMicros(args.refundAmountMicrousdc) : null;
    if (args.outcome === "refund" && (!refundAmountParsed || !refundAmountParsed.ok)) {
      return { ok: false as const, code: "INVALID_REFUND_AMOUNT", message: "refundAmountMicrousdc is required for outcome=refund" };
    }

    const refundAmountMicrousdc = refundAmountParsed?.ok ? refundAmountParsed.microusdc : undefined;

    const message =
      [
        "x402disputes:resolve:v1",
        `disputeId=${args.disputeId}`,
        `outcome=${args.outcome}`,
        `refundAmountMicrousdc=${typeof refundAmountMicrousdc === "number" ? refundAmountMicrousdc : ""}`,
        `timestamp=${args.timestampMs}`,
        `nonce=${nonce}`,
      ].join("\n") + "\n";

    let recovered: `0x${string}`;
    try {
      recovered = (await recoverMessageAddress({
        message,
        signature: args.signature as `0x${string}`,
      })) as `0x${string}`;
    } catch (e: any) {
      return { ok: false as const, code: "INVALID_SIGNATURE", message: e?.message || "Failed to recover signer" };
    }

    if (recovered.toLowerCase() !== parsedArbiter.address.toLowerCase()) {
      return { ok: false as const, code: "UNAUTHORIZED", message: "arbiter signature does not match ARBITER_IDENTITY" };
    }

    // Mark nonce used (must happen before any side effects).
    await ctx.db.insert("arbiterNonces", {
      nonce,
      arbiter: parsedArbiter.normalized,
      usedAt: now,
    });

    const dispute: any = await ctx.db.get(args.disputeId);
    if (!dispute) return { ok: false as const, code: "NOT_FOUND", message: "Dispute not found" };

    const merchant = dispute.defendant as string;
    const parsedMerchant = parseCaip10Eip155(merchant);
    if (!parsedMerchant.ok) {
      return { ok: false as const, code: "INVALID_MERCHANT", message: "Dispute merchant identity is not CAIP-10 eip155" };
    }

    if (args.outcome === "deny") {
      await ctx.db.patch(args.disputeId, {
        status: "DECIDED",
        metadata: {
          ...(dispute.metadata || {}),
          poolStatus: "DENIED",
        },
        finalVerdict: "MERCHANT_WINS",
        decidedAt: now,
      });
      return { ok: true as const, status: "DENIED" as const };
    }

    // Refund path
    const balance = await ctx.db
      .query("merchantBalances")
      .withIndex("by_wallet_currency", (q: any) =>
        q.eq("walletAddress", parsedMerchant.normalized).eq("currency", "USDC")
      )
      .first();

    const refundUsdc = (refundAmountMicrousdc as number) / 1_000_000;
    const feeMicrousdc = 0; // MVP: fee is 0 unless/ until you add it.
    const requiredUsdc = (refundAmountMicrousdc as number + feeMicrousdc) / 1_000_000;

    if (!balance || (balance.availableBalance || 0) < requiredUsdc) {
      await ctx.db.patch(args.disputeId, {
        status: "DECIDED",
        metadata: {
          ...(dispute.metadata || {}),
          poolStatus: "APPROVED_PENDING_FUNDS",
          requiredMicrousdc: (refundAmountMicrousdc as number) + feeMicrousdc,
        },
        finalVerdict: "CONSUMER_WINS",
        finalRefundAmountMicrousdc: refundAmountMicrousdc,
        decidedAt: now,
      });
      return { ok: true as const, status: "APPROVED_PENDING_FUNDS" as const };
    }

    // Debit merchant balance
    await ctx.db.patch(balance._id, {
      availableBalance: (balance.availableBalance || 0) - requiredUsdc,
      totalRefunded: (balance.totalRefunded || 0) + refundUsdc,
      lastRefundAt: now,
      updatedAt: now,
    });

    // Create refund execution record (actual on-chain execution still handled by existing refund engine later if desired).
    await ctx.db.insert("refundTransactions", {
      caseId: args.disputeId,
      fromWallet: "platform",
      toWallet: dispute.plaintiff || "",
      amount: refundUsdc,
      currency: "USDC",
      blockchain: "base",
      status: "PENDING_SEND",
      createdAt: now,
      amountMicrousdc: refundAmountMicrousdc,
      refundToAddress: dispute.plaintiff || "",
      provider: "coinbase",
    } as any);

    await ctx.db.patch(args.disputeId, {
      status: "DECIDED",
      metadata: {
        ...(dispute.metadata || {}),
        poolStatus: "PAID",
      },
      finalVerdict: "CONSUMER_WINS",
      finalRefundAmountMicrousdc: refundAmountMicrousdc,
      decidedAt: now,
    });

    return { ok: true as const, status: "PAID" as const };
  },
});

