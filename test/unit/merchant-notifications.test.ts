import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";

describe("merchant notifications (unit)", () => {
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

  it("does not email when x402.json merchant does not match case merchant (strict match)", async () => {
    // Mock x402.json fetch response (Resend is not expected to be called)
    globalThis.fetch = vi.fn(async (url: any) => {
      const u = String(url);
      if (u.includes("/.well-known/x402.json")) {
        return new Response(
          JSON.stringify({
            x402disputes: {
              merchant: "eip155:8453:0x0000000000000000000000000000000000000002",
              supportEmail: "disputes@merchant.com",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      // If anything tries to call Resend, fail the test.
      throw new Error(`Unexpected fetch: ${u}`);
    }) as any;

    const created = await t.mutation(api.pool.cases_fileWalletPaymentDispute, {
      buyer: "buyer:test",
      merchant: "eip155:8453:0x0000000000000000000000000000000000000001",
      merchantOrigin: "https://merchant.example",
      reason: "api_timeout",
      amountMicrousdc: "10000",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const res = await t.action(api.merchantNotifications.notifyMerchantDisputeFiled, {
      caseId: created.disputeId,
    });

    expect(res.ok).toBe(true);
    expect(res.emailed).toBe(false);
    expect(res.reason).toBe("MERCHANT_MISMATCH");
  });

  it("derives merchantOrigin from paymentDetails.plaintiffMetadata.requestJson and reaches email adapter", async () => {
    const merchantAddress = "0x0000000000000000000000000000000000000001";
    const merchantCaip10 = `eip155:8453:${merchantAddress}`;

    // Mock only the well-known fetch; email adapter should short-circuit with EMAIL_NOT_CONFIGURED
    // (no RESEND_API_KEY/EMAIL_FROM in unit test env).
    globalThis.fetch = vi.fn(async (url: any) => {
      const u = String(url);
      if (u === "https://merchant.example/.well-known/x402.json") {
        return new Response(
          JSON.stringify({
            x402disputes: {
              merchant: merchantCaip10,
              supportEmail: "disputes@merchant.com",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Unexpected fetch: ${u}`);
    }) as any;

    const now = Date.now();
    const caseId = await t.run(async (ctx) => {
      return await ctx.db.insert("cases", {
        plaintiff: "0xbuyer",
        defendant: merchantAddress,
        status: "FILED",
        type: "PAYMENT",
        filedAt: now,
        description: "api_timeout: test",
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
          plaintiffMetadata: {
            requestJson: JSON.stringify({ method: "POST", url: "https://merchant.example/v1/chat" }),
          },
          defendantMetadata: {},
        },
        paymentSourceChain: "base",
        paymentSourceTxHash: "0x" + "11".repeat(32),
      } as any);
    });

    const res = await t.action(api.merchantNotifications.notifyMerchantDisputeFiled, { caseId });
    expect(res.ok).toBe(true);
    expect(res.emailed).toBe(false);
    expect(res.reason).toBe("EMAIL_NOT_CONFIGURED");
  });

  it("gates dispute emails behind email verification and creates a token", async () => {
    const merchantAddress = "0x0000000000000000000000000000000000000003";
    const merchantCaip10 = `eip155:8453:${merchantAddress}`;

    // x402.json fetch should succeed; email sending will be blocked in tests (no RESEND_API_KEY/EMAIL_FROM)
    globalThis.fetch = vi.fn(async (url: any) => {
      const u = String(url);
      if (u === "https://merchant2.example/.well-known/x402.json") {
        return new Response(
          JSON.stringify({
            x402disputes: { merchant: merchantCaip10, supportEmail: "disputes@merchant.com" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Unexpected fetch: ${u}`);
    }) as any;

    const now = Date.now();
    const caseId = await t.run(async (ctx) => {
      return await ctx.db.insert("cases", {
        plaintiff: "0xbuyer",
        defendant: merchantAddress,
        status: "FILED",
        type: "PAYMENT",
        filedAt: now,
        description: "api_timeout: test",
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
          plaintiffMetadata: {
            requestJson: JSON.stringify({ method: "POST", url: "https://merchant2.example/v1/chat" }),
          },
          defendantMetadata: {},
        },
        paymentSourceChain: "base",
        paymentSourceTxHash: "0x" + "11".repeat(32),
      } as any);
    });

    const res = await t.action(api.merchantNotifications.notifyMerchantDisputeFiled, { caseId });
    expect(res.ok).toBe(true);
    expect(res.emailed).toBe(false);
    expect(res.reason).toBe("EMAIL_NOT_CONFIGURED");

    const tokens = await t.run(async (ctx) => {
      return await ctx.db
        .query("merchantEmailVerificationTokens")
        .withIndex("by_tuple", (q) =>
          q
            .eq("merchant", merchantCaip10)
            .eq("origin", "https://merchant2.example")
            .eq("supportEmail", "disputes@merchant.com"),
        )
        .collect();
    });
    expect(tokens.length).toBe(1);
    expect(tokens[0].merchant).toBe(merchantCaip10);
    expect(tokens[0].origin).toBe("https://merchant2.example");
    expect(tokens[0].supportEmail).toBe("disputes@merchant.com");
    expect(typeof tokens[0].token).toBe("string");
  });
});

