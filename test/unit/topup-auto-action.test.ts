import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { internal } from "../../convex/_generated/api";

describe("topup finalize auto-applies action token (unit)", () => {
  let t: ReturnType<typeof convexTest>;

  const prevDepositAddress = process.env.PLATFORM_BASE_USDC_DEPOSIT_ADDRESS;

  beforeAll(async () => {
    const modules = import.meta.glob("../../convex/**/*.{ts,js}");
    t = convexTest(schema, modules);
  });

  afterEach(() => {
    if (prevDepositAddress === undefined) {
      delete process.env.PLATFORM_BASE_USDC_DEPOSIT_ADDRESS;
    } else {
      process.env.PLATFORM_BASE_USDC_DEPOSIT_ADDRESS = prevDepositAddress;
    }
  });

  it("credits balance then applies approve action token (decides case + debits refund+fee)", async () => {
    process.env.PLATFORM_BASE_USDC_DEPOSIT_ADDRESS = "0x9876543210987654321098765432109876543210";

    const now = Date.now();
    const merchant = "eip155:8453:0x00000000000000000000000000000000000000aa";
    const origin = "https://merchant.example";
    const supportEmail = "support@merchant.example";

    const refundMicros = 10_000; // 0.01 USDC
    const feeUsdc = 0.05; // 0.05 USDC fee
    const requiredUsdc = 0.06;
    const topupMicros = 100_000; // 0.10 USDC (enough to cover refund+fee)

    const caseId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("cases", {
        plaintiff: "buyer:test",
        defendant: merchant,
        status: "IN_REVIEW",
        type: "PAYMENT",
        filedAt: now,
        description: "api_timeout",
        amount: refundMicros / 1_000_000,
        currency: "USDC",
        evidenceIds: [],
        createdAt: now,
        paymentDetails: {
          transactionId: "tx_test",
          transactionHash: "0x" + "11".repeat(32),
          blockchain: "base",
          amountMicrousdc: refundMicros,
          amountUnit: "microusdc",
          sourceTransferLogIndex: 0,
          disputeFee: feeUsdc,
          regulationEDeadline: now + 10_000,
          plaintiffMetadata: {},
          defendantMetadata: {},
        },
        paymentSourceChain: "base",
        paymentSourceTxHash: "0x" + "11".repeat(32),
      } as any);

      // Verified email channel required to use one-click actions.
      await ctx.db.insert("merchantEmailVerifications", {
        merchant,
        origin,
        supportEmail,
        verifiedAt: now,
        createdAt: now,
        updatedAt: now,
      } as any);

      // Start with insufficient credits.
      await ctx.db.insert("merchantBalances", {
        walletAddress: merchant,
        currency: "USDC",
        availableBalance: 0,
        lockedBalance: 0,
        totalDeposited: 0,
        totalRefunded: 0,
        createdAt: now,
        updatedAt: now,
      } as any);

      await ctx.db.insert("merchantEmailActionTokens", {
        token: "tok_topup_apply",
        caseId: id,
        merchant,
        origin,
        supportEmail,
        action: "APPROVE_FULL_REFUND",
        refundAmountMicrousdc: refundMicros,
        createdAt: now,
        expiresAt: now + 60_000,
      } as any);

      return id;
    });

    const txHash = "0x" + "aa".repeat(32);
    const finalize = await t.action((internal as any).pool.topup_finalizeFromTxHash, {
      merchant,
      txHash,
      expectedAmountMicrousdc: topupMicros,
      caseId,
      actionToken: "tok_topup_apply",
      blockchain: "base",
    });
    expect(finalize.ok).toBe(true);

    const updatedCase = await t.run(async (ctx) => await ctx.db.get(caseId));
    expect(updatedCase?.status).toBe("DECIDED");
    expect(updatedCase?.finalVerdict).toBe("CONSUMER_WINS");
    expect(updatedCase?.finalRefundAmountMicrousdc).toBe(refundMicros);

    const tokenRec = await t.run(async (ctx) => {
      return await ctx.db
        .query("merchantEmailActionTokens")
        .withIndex("by_token", (q) => q.eq("token", "tok_topup_apply"))
        .first();
    });
    expect(typeof tokenRec?.usedAt).toBe("number");

    const balAfter = await t.run(async (ctx) => {
      return await ctx.db
        .query("merchantBalances")
        .withIndex("by_wallet_currency", (q: any) => q.eq("walletAddress", merchant).eq("currency", "USDC"))
        .first();
    });

    // 0.10 credited - 0.06 debited = 0.04 remaining
    expect(balAfter?.availableBalance).toBeCloseTo((topupMicros / 1_000_000) - requiredUsdc, 6);
  });

  it("still credits balance even if the action token cannot be applied (e.g. NOT_VERIFIED)", async () => {
    process.env.PLATFORM_BASE_USDC_DEPOSIT_ADDRESS = "0x9876543210987654321098765432109876543210";

    const now = Date.now();
    // Use a distinct tuple from the previous test to avoid leaking verification state.
    const merchant = "eip155:8453:0x00000000000000000000000000000000000000cc";
    const origin = "https://merchant2.example";
    const supportEmail = "support2@merchant.example";

    const topupMicros = 100_000; // 0.10 USDC

    const caseId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("cases", {
        plaintiff: "buyer:test",
        defendant: merchant,
        status: "IN_REVIEW",
        type: "PAYMENT",
        filedAt: now,
        description: "not verified apply test",
        amount: 0.01,
        currency: "USDC",
        evidenceIds: [],
        createdAt: now,
        paymentDetails: {
          transactionId: "tx_test",
          transactionHash: "0x" + "11".repeat(32),
          blockchain: "base",
          amountMicrousdc: 10_000,
          amountUnit: "microusdc",
          sourceTransferLogIndex: 0,
          disputeFee: 0.01,
          regulationEDeadline: now + 10_000,
          plaintiffMetadata: {},
          defendantMetadata: {},
        },
        paymentSourceChain: "base",
        paymentSourceTxHash: "0x" + "11".repeat(32),
      } as any);

      // Deliberately do NOT insert merchantEmailVerifications (so applyDecisionFromToken returns NOT_VERIFIED).

      // Start with 0 credits.
      await ctx.db.insert("merchantBalances", {
        walletAddress: merchant,
        currency: "USDC",
        availableBalance: 0,
        lockedBalance: 0,
        totalDeposited: 0,
        totalRefunded: 0,
        createdAt: now,
        updatedAt: now,
      } as any);

      await ctx.db.insert("merchantEmailActionTokens", {
        token: "tok_not_verified",
        caseId: id,
        merchant,
        origin,
        supportEmail,
        action: "APPROVE_FULL_REFUND",
        refundAmountMicrousdc: 10_000,
        createdAt: now,
        expiresAt: now + 60_000,
      } as any);

      return id;
    });

    const txHash = "0x" + "bb".repeat(32);
    const finalize = await t.action((internal as any).pool.topup_finalizeFromTxHash, {
      merchant,
      txHash,
      expectedAmountMicrousdc: topupMicros,
      caseId,
      actionToken: "tok_not_verified",
      blockchain: "base",
    });
    expect(finalize.ok).toBe(true);

    const updatedCase = await t.run(async (ctx) => await ctx.db.get(caseId));
    // Should remain undecided because token apply fails NOT_VERIFIED (but finalize should not fail).
    expect(updatedCase?.status).toBe("IN_REVIEW");
    expect(typeof updatedCase?.finalVerdict).not.toBe("string");

    const balAfter = await t.run(async (ctx) => {
      return await ctx.db
        .query("merchantBalances")
        .withIndex("by_wallet_currency", (q: any) => q.eq("walletAddress", merchant).eq("currency", "USDC"))
        .first();
    });
    expect(balAfter?.availableBalance).toBeCloseTo(topupMicros / 1_000_000, 6);
  });

  it("still credits balance even if the action token is expired", async () => {
    process.env.PLATFORM_BASE_USDC_DEPOSIT_ADDRESS = "0x9876543210987654321098765432109876543210";

    const now = Date.now();
    const merchant = "eip155:8453:0x00000000000000000000000000000000000000dd";
    const origin = "https://merchant-expired.example";
    const supportEmail = "support-expired@merchant.example";

    const topupMicros = 100_000; // 0.10 USDC

    const caseId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("cases", {
        plaintiff: "buyer:test",
        defendant: merchant,
        status: "IN_REVIEW",
        type: "PAYMENT",
        filedAt: now,
        description: "expired token apply test",
        amount: 0.01,
        currency: "USDC",
        evidenceIds: [],
        createdAt: now,
        paymentDetails: {
          transactionId: "tx_test",
          transactionHash: "0x" + "11".repeat(32),
          blockchain: "base",
          amountMicrousdc: 10_000,
          amountUnit: "microusdc",
          sourceTransferLogIndex: 0,
          disputeFee: 0.01,
          regulationEDeadline: now + 10_000,
          plaintiffMetadata: {},
          defendantMetadata: {},
        },
        paymentSourceChain: "base",
        paymentSourceTxHash: "0x" + "11".repeat(32),
      } as any);

      await ctx.db.insert("merchantBalances", {
        walletAddress: merchant,
        currency: "USDC",
        availableBalance: 0,
        lockedBalance: 0,
        totalDeposited: 0,
        totalRefunded: 0,
        createdAt: now,
        updatedAt: now,
      } as any);

      await ctx.db.insert("merchantEmailActionTokens", {
        token: "tok_expired_apply",
        caseId: id,
        merchant,
        origin,
        supportEmail,
        action: "APPROVE_FULL_REFUND",
        refundAmountMicrousdc: 10_000,
        createdAt: now,
        expiresAt: now - 1,
      } as any);

      return id;
    });

    const txHash = "0x" + "cc".repeat(32);
    const finalize = await t.action((internal as any).pool.topup_finalizeFromTxHash, {
      merchant,
      txHash,
      expectedAmountMicrousdc: topupMicros,
      caseId,
      actionToken: "tok_expired_apply",
      blockchain: "base",
    });
    expect(finalize.ok).toBe(true);

    const updatedCase = await t.run(async (ctx) => await ctx.db.get(caseId));
    expect(updatedCase?.status).toBe("IN_REVIEW");
    expect(typeof updatedCase?.finalVerdict).not.toBe("string");

    const tokenRec = await t.run(async (ctx) => {
      return await ctx.db
        .query("merchantEmailActionTokens")
        .withIndex("by_token", (q) => q.eq("token", "tok_expired_apply"))
        .first();
    });
    expect(typeof tokenRec?.usedAt).not.toBe("number");

    const balAfter = await t.run(async (ctx) => {
      return await ctx.db
        .query("merchantBalances")
        .withIndex("by_wallet_currency", (q: any) => q.eq("walletAddress", merchant).eq("currency", "USDC"))
        .first();
    });
    expect(balAfter?.availableBalance).toBeCloseTo(topupMicros / 1_000_000, 6);
  });
});

