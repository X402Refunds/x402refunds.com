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
            x402refunds: {
              merchant: "eip155:8453:0x0000000000000000000000000000000000000002",
              supportEmail: "refunds@merchant.com",
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
            x402refunds: {
              merchant: merchantCaip10,
              supportEmail: "refunds@merchant.com",
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
            x402refunds: { merchant: merchantCaip10, supportEmail: "refunds@merchant.com" },
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
            .eq("supportEmail", "refunds@merchant.com"),
        )
        .collect();
    });
    expect(tokens.length).toBe(1);
    expect(tokens[0].merchant).toBe(merchantCaip10);
    expect(tokens[0].origin).toBe("https://merchant2.example");
    expect(tokens[0].supportEmail).toBe("refunds@merchant.com");
    expect(typeof tokens[0].token).toBe("string");
  });

  it("when credits are insufficient, dispute email includes 3 action links and routes approve links through top-up", async () => {
    const prevResendKey = process.env.RESEND_API_KEY;
    const prevEmailFrom = process.env.EMAIL_FROM;
    process.env.RESEND_API_KEY = "test_key";
    process.env.EMAIL_FROM = "refunds@x402refunds.com";

    const merchantAddress = "0x00000000000000000000000000000000000000aa";
    const merchantCaip10 = `eip155:8453:${merchantAddress}`;
    const origin = "https://merchant-lowbalance.example";
    const supportEmail = "refunds@merchant.com";

    let resendPayload: any = null;
    globalThis.fetch = vi.fn(async (url: any, init?: any) => {
      const u = String(url);
      if (u === `${origin}/.well-known/x402.json`) {
        return new Response(
          JSON.stringify({
            x402refunds: { merchant: merchantCaip10, supportEmail },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (u === "https://api.resend.com/emails") {
        resendPayload = JSON.parse(String(init?.body || "{}"));
        return new Response(JSON.stringify({ id: "email_123" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw new Error(`Unexpected fetch: ${u}`);
    }) as any;

    const now = Date.now();
    const caseId = await t.run(async (ctx) => {
      // Mark channel as verified so we send the dispute email (not the verification email).
      await ctx.db.insert("merchantEmailVerifications", {
        merchant: merchantCaip10,
        origin,
        supportEmail,
        verifiedAt: now,
        createdAt: now,
        updatedAt: now,
      } as any);

      return await ctx.db.insert("cases", {
        plaintiff: "0xbuyer",
        defendant: merchantCaip10,
        status: "FILED",
        type: "PAYMENT",
        filedAt: now,
        description: "api_timeout: test",
        amount: 0.01,
        currency: "USDC",
        evidenceIds: [],
        createdAt: now,
        metadata: {
          v1: {
            merchantOrigin: origin,
            amountMicrousdc: 10_000,
            reason: "api_timeout",
            txHash: "0x" + "11".repeat(32),
            chain: "base",
          },
        },
      } as any);
    });

    const res = await t.action(api.merchantNotifications.notifyMerchantDisputeFiled, { caseId });
    expect(res.ok).toBe(true);
    expect(res.emailed).toBe(true);

    expect(resendPayload?.subject).toMatch(/Dispute received/);
    expect(typeof resendPayload?.text).toBe("string");
    const text = String(resendPayload.text);

    // Should include action links.
    expect(text).toContain("Approve full refund:");
    expect(text).toContain("Approve partial refund");
    expect(text).toContain("Reject dispute:");

    // Approve links should route through top-up with actionToken.
    expect(text).toContain(
      `https://x402refunds.com/topup?merchant=${encodeURIComponent(merchantCaip10)}&caseId=${encodeURIComponent(
        String(caseId),
      )}&email=${encodeURIComponent(supportEmail)}`,
    );
    expect(text).toContain("&actionToken=");

    // Reject should remain a one-click action link.
    expect(text).toContain("https://api.x402refunds.com/v1/merchant/action?token=");

    process.env.RESEND_API_KEY = prevResendKey;
    process.env.EMAIL_FROM = prevEmailFrom;
  });

  it("getNotificationStatusForCase returns requiredUsdc and hasSufficientCredits without needing x402.json fetch", async () => {
    const now = Date.now();
    const merchantAddress = "0x00000000000000000000000000000000000000bb";

    const caseId = await t.run(async (ctx) => {
      return await ctx.db.insert("cases", {
        plaintiff: "buyer:test-status",
        defendant: merchantAddress,
        status: "IN_REVIEW",
        type: "PAYMENT",
        filedAt: now,
        description: "test",
        amount: 0.01,
        currency: "USDC",
        evidenceIds: [],
        createdAt: now,
        paymentDetails: {
          transactionId: "tx_test",
          transactionHash: "0x" + "22".repeat(32),
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
        paymentSourceTxHash: "0x" + "22".repeat(32),
        // No merchantOrigin in metadata: forces status helper to avoid fetching x402.json.
      } as any);
    });

    // Ensure merchant has enough credits: 0.06 USDC available.
    await t.run(async (ctx) => {
      await ctx.db.insert("merchantBalances", {
        walletAddress: `eip155:8453:${merchantAddress}`,
        currency: "USDC",
        availableBalance: 0.06,
        lockedBalance: 0,
        totalDeposited: 0.06,
        totalRefunded: 0,
        createdAt: now,
        updatedAt: now,
      } as any);
    });

    const status = await t.action((api as any).merchantNotifications.getNotificationStatusForCase, { caseId });
    expect(status.ok).toBe(true);
    expect(status.requiredUsdc).toBeCloseTo(0.06, 6);
    expect(status.hasSufficientCredits).toBe(true);
    expect(status.supportEmail).toBe(null);
    expect(status.verified).toBe(false);
  });

  it("throttleResendForCase rate limits repeated calls", async () => {
    const now = Date.now();
    const caseId = await t.run(async (ctx) => {
      return await ctx.db.insert("cases", {
        plaintiff: "buyer:test-throttle",
        defendant: "0x00000000000000000000000000000000000000cc",
        status: "FILED",
        type: "PAYMENT",
        filedAt: now,
        description: "test",
        evidenceIds: [],
        createdAt: now,
        metadata: { v1: {} },
      } as any);
    });

    const first = await t.mutation((api as any).merchantNotifications.throttleResendForCase, { caseId });
    expect(first.ok).toBe(true);

    const second = await t.mutation((api as any).merchantNotifications.throttleResendForCase, { caseId });
    expect(second.ok).toBe(false);
    expect(second.code).toBe("RATE_LIMITED");
    expect(typeof second.waitMs).toBe("number");
  });
});

