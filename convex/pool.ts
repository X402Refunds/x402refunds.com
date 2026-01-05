/**
 * Wallet-first dispute + refund pool (v1).
 *
 * Public API vocabulary:
 * - buyer, merchant
 *
 * Internal storage (legacy schema):
 * - cases.plaintiff = buyer
 * - cases.defendant = merchant (CAIP-10)
 *
 * Pool-specific status is stored in cases.metadata.poolStatus so we don't widen the
 * cases.status enum during the MVP.
 */

import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { recoverMessageAddress } from "viem";
import { internal } from "./_generated/api";

type ChainRef = "base";

type Caip10Parsed =
  | { ok: true; namespace: "eip155"; chainId: number; address: `0x${string}`; normalized: string }
  | { ok: false; code: string; message: string };

function parseCaip10Eip155(input: string): Caip10Parsed {
  const raw = input.trim();
  const m = raw.match(/^eip155:(\d+):(0x[a-fA-F0-9]{40})$/);
  if (!m) return { ok: false, code: "INVALID_CAIP10", message: "Expected CAIP-10 eip155:<chainId>:0x<40hex>" };
  const chainId = Number(m[1]);
  if (!Number.isSafeInteger(chainId) || chainId <= 0) {
    return { ok: false, code: "INVALID_CHAIN_ID", message: "chainId must be a positive integer" };
  }
  const address = m[2].toLowerCase() as `0x${string}`;
  return { ok: true, namespace: "eip155", chainId, address, normalized: `eip155:${chainId}:${address}` };
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

function poolStatus(
  value: unknown,
): "FILED" | "DENIED" | "PAID" | "APPROVED_PENDING_FUNDS" | null {
  if (value === "FILED" || value === "DENIED" || value === "PAID" || value === "APPROVED_PENDING_FUNDS") return value;
  return null;
}

export const cases_fileWalletPaymentDispute = mutation({
  args: {
    buyer: v.string(),
    merchant: v.string(), // CAIP-10 eip155
    merchantOrigin: v.string(), // https origin used to fetch /.well-known/x402.json
    merchantX402MetadataUrl: v.optional(v.string()), // optional override for x402.json url
    txHash: v.optional(v.string()),
    chain: v.optional(v.union(v.literal("base"))),
    amountMicrousdc: v.optional(v.any()),
    reason: v.optional(v.string()),
    evidenceUrlOrHash: v.optional(v.string()),
    agentId: v.optional(v.string()),
    txId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ ok: true; disputeId: Id<"cases"> } | { ok: false; code: string; message: string }> => {
    const parsedMerchant = parseCaip10Eip155(args.merchant);
    if (!parsedMerchant.ok) return parsedMerchant;

    const buyer = (args.buyer || "").trim();
    if (!buyer) return { ok: false, code: "INVALID_BUYER", message: "buyer is required" };

    const merchantOrigin = (args.merchantOrigin || "").trim();
    if (!merchantOrigin) return { ok: false, code: "INVALID_MERCHANT_ORIGIN", message: "merchantOrigin is required" };
    if (!merchantOrigin.startsWith("https://")) {
      return { ok: false, code: "INVALID_MERCHANT_ORIGIN", message: "merchantOrigin must be an https:// origin" };
    }

    const merchantX402MetadataUrl =
      typeof args.merchantX402MetadataUrl === "string" && args.merchantX402MetadataUrl.trim()
        ? args.merchantX402MetadataUrl.trim()
        : undefined;

    const now = Date.now();
    const amountParsed = args.amountMicrousdc !== undefined ? parseMicros(args.amountMicrousdc) : null;

    const disputeId = await ctx.db.insert("cases", {
      plaintiff: buyer,
      defendant: parsedMerchant.normalized,
      status: "FILED",
      type: "PAYMENT",
      filedAt: now,
      description: args.reason || "Payment dispute",
      amount: amountParsed?.ok ? amountParsed.microusdc / 1_000_000 : undefined,
      currency: "USDC",
      evidenceIds: [],
      metadata: {
        poolStatus: "FILED",
        v1: {
          buyer,
          merchant: parsedMerchant.normalized,
          merchantOrigin,
          merchantX402MetadataUrl,
          agentId: args.agentId,
          txId: args.txId,
          txHash: args.txHash,
          chain: args.chain,
          amountMicrousdc: amountParsed?.ok ? amountParsed.microusdc : undefined,
          reason: args.reason,
          evidenceUrlOrHash: args.evidenceUrlOrHash,
        },
      },
      createdAt: now,
    } as any);

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

export const cases_listWalletDisputesByMerchant = query({
  args: { merchant: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const parsedMerchant = parseCaip10Eip155(args.merchant);
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
    const parsedMerchant = parseCaip10Eip155(args.merchant);
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

