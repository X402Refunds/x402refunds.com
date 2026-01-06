import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api, internal } from "../../convex/_generated/api";

describe("merchant email actions (unit)", () => {
  let t: ReturnType<typeof convexTest>;
  const originalFetch = globalThis.fetch;

  beforeAll(async () => {
    const modules = import.meta.glob("../../convex/**/*.{ts,js}");
    t = convexTest(schema, modules);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("applies full refund decision and marks token used", async () => {
    const now = Date.now();
    const merchant = "eip155:8453:0x0000000000000000000000000000000000000001";
    const origin = "https://merchant.example";
    const supportEmail = "support@merchant.example";

    const caseId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("cases", {
        plaintiff: "0xbuyer",
        defendant: merchant,
        status: "IN_REVIEW",
        type: "PAYMENT",
        filedAt: now,
        description: "api_timeout",
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
          disputeFee: 0.05,
          regulationEDeadline: now + 10_000,
          plaintiffMetadata: {},
          defendantMetadata: {},
        },
        paymentSourceChain: "base",
        paymentSourceTxHash: "0x" + "11".repeat(32),
      } as any);
      await ctx.db.insert("merchantEmailVerifications", {
        merchant,
        origin,
        supportEmail,
        verifiedAt: now,
        createdAt: now,
        updatedAt: now,
      } as any);
      const token = "tok_full_refund";
      await ctx.db.insert("merchantEmailActionTokens", {
        token,
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

    const res = await t.mutation(internal.merchantEmailActions.applyDecisionFromToken, {
      token: "tok_full_refund",
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.verdict).toBe("CONSUMER_WINS");
    expect(res.refundScheduled).toBe(true);

    const updated = await t.run(async (ctx) => await ctx.db.get(caseId));
    expect(updated?.status).toBe("DECIDED");
    expect(updated?.finalVerdict).toBe("CONSUMER_WINS");
    expect(updated?.finalRefundAmountMicrousdc).toBe(10_000);

    const tokenRec = await t.run(async (ctx) => {
      return await ctx.db
        .query("merchantEmailActionTokens")
        .withIndex("by_token", (q) => q.eq("token", "tok_full_refund"))
        .first();
    });
    expect(typeof tokenRec?.usedAt).toBe("number");
  });
});

