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

  it("does not email when endpoint payTo corroboration is missing", async () => {
    // Nothing should send email if we fail the endpoint payTo safety gate.
    globalThis.fetch = vi.fn(async (url: any) => {
      throw new Error(`Unexpected fetch: ${String(url)}`);
    }) as any;

    const created = await t.mutation(api.pool.cases_fileWalletPaymentDispute, {
      blockchain: "base",
      transactionHash: "0x" + "00".repeat(32),
      sellerEndpointUrl: "https://merchant.example/v1/paid",
      origin: "https://merchant.example",
      payer: "eip155:8453:0x00000000000000000000000000000000000000aa",
      merchant: "eip155:8453:0x0000000000000000000000000000000000000001",
      amountMicrousdc: 10_000,
      sourceTransferLogIndex: 0,
      description: "api_timeout",
      // endpointPayToMatch intentionally omitted/falsey
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const res = await t.action(api.merchantNotifications.notifyMerchantDisputeFiled, {
      caseId: created.disputeId,
    });

    expect(res.ok).toBe(true);
    expect(res.emailed).toBe(false);
    expect(res.reason).toBe("ENDPOINT_PAYTO_UNVERIFIED");
  });

  it("derives merchantOrigin from paymentDetails.plaintiffMetadata.requestJson and reaches email adapter", async () => {
    const merchantAddress = "0x0000000000000000000000000000000000000001";
    const merchantCaip10 = `eip155:8453:${merchantAddress}`;

    // No network calls expected in this unit env: email adapter should short-circuit with EMAIL_NOT_CONFIGURED
    // (no RESEND_API_KEY/EMAIL_FROM).
    globalThis.fetch = vi.fn(async (url: any) => {
      throw new Error(`Unexpected fetch: ${String(url)}`);
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
        metadata: {
          v1: {
            endpointPayToMatch: true,
            merchantOrigin: "https://merchant.example",
            paymentSupportEmail: "refunds@merchant.com",
          },
        },
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

    // No network calls expected in this unit env: email sending will be blocked (no RESEND_API_KEY/EMAIL_FROM)
    globalThis.fetch = vi.fn(async (url: any) => {
      throw new Error(`Unexpected fetch: ${String(url)}`);
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
        metadata: {
          v1: {
            endpointPayToMatch: true,
            merchantOrigin: "https://merchant2.example",
            paymentSupportEmail: "refunds@merchant.com",
          },
        },
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

  it("derives notification origin from sellerEndpointUrl even when merchantOrigin is wrong", async () => {
    const merchantAddress = "0x0000000000000000000000000000000000000004";
    const merchantCaip10 = `eip155:8453:${merchantAddress}`;

    globalThis.fetch = vi.fn(async (url: any) => {
      throw new Error(`Unexpected fetch: ${String(url)}`);
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
        metadata: {
          v1: {
            endpointPayToMatch: true,
            merchantOrigin: "https://wrong.example",
            sellerEndpointUrl: "https://merchant3.example/v1/paid",
            paymentSupportEmail: "refunds@merchant.com",
          },
        },
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
            requestJson: JSON.stringify({ method: "POST", url: "https://merchant3.example/v1/paid" }),
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
            .eq("origin", "https://merchant3.example")
            .eq("supportEmail", "refunds@merchant.com"),
        )
        .collect();
    });

    expect(tokens.length).toBe(1);
    expect(tokens[0].origin).toBe("https://merchant3.example");
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
            paymentSupportEmail: supportEmail,
            amountMicrousdc: 10_000,
            description: "api_timeout",
            transactionHash: "0x" + "11".repeat(32),
            blockchain: "base",
            endpointPayToMatch: true,
          },
        },
      } as any);
    });

    const res = await t.action(api.merchantNotifications.notifyMerchantDisputeFiled, { caseId });
    expect(res.ok).toBe(true);
    expect(res.emailed).toBe(true);

    expect(resendPayload?.subject).toMatch(/Refund request received \(/);
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

  it("Dexter partner case: notifyMerchantDisputeFiled sends to platform ops (bypasses payTo/verification gates)", async () => {
    const prevResendKey = process.env.RESEND_API_KEY;
    const prevEmailFrom = process.env.EMAIL_FROM;
    process.env.RESEND_API_KEY = "test_key";
    process.env.EMAIL_FROM = "refunds@x402refunds.com";

    const now = Date.now();
    const orgId = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", { name: "Dexter", domain: "dexter.cash", createdAt: now } as any);
    });
    const programId = await t.run(async (ctx) => {
      return await ctx.db.insert("partnerPrograms", {
        liableOrganizationId: orgId,
        partnerKey: "dexter",
        canonicalEmail: "refunds@dexter.cash",
        enabled: true,
        autoDecideEnabled: true,
        autoExecuteEnabled: true,
        maxAutoRefundMicrousdc: 2_000_000,
        platformOpsEmail: "vbkotecha@gmail.com",
        partnerOpsEmail: "refunds@dexter.cash",
        protectedEndpointsMode: "noop_true_poc",
        createdAt: now,
      } as any);
    });

    const merchantCaip10 = "eip155:8453:0x00000000000000000000000000000000000000aa";
    const caseId = await t.run(async (ctx) => {
      return await ctx.db.insert("cases", {
        plaintiff: "eip155:8453:0x00000000000000000000000000000000000000bb",
        defendant: merchantCaip10,
        status: "FILED",
        type: "PAYMENT",
        filedAt: now,
        description: "dexter case",
        amount: 1.0,
        currency: "USDC",
        evidenceIds: [],
        createdAt: now,
        reviewerOrganizationId: orgId,
        metadata: {
          partner: { partnerProgramId: String(programId), partnerKey: "dexter", canonicalEmail: "refunds@dexter.cash" },
          v1: {
            // Intentionally omit endpointPayToMatch and email verification setup; partner should bypass.
            merchantOrigin: "https://merchant.example",
            paymentSupportEmail: "refunds@dexter.cash",
            transactionHash: "0x" + "44".repeat(32),
            blockchain: "base",
            amountMicrousdc: 1_000_000,
          },
        },
        paymentDetails: {
          transactionId: "0x" + "44".repeat(32),
          transactionHash: "0x" + "44".repeat(32),
          blockchain: "base",
          amountMicrousdc: 1_000_000,
          amountUnit: "microusdc",
          sourceTransferLogIndex: 0,
          disputeFee: 0.05,
          regulationEDeadline: now + 10_000,
          plaintiffMetadata: {},
          defendantMetadata: {},
        },
        paymentSourceChain: "base",
        paymentSourceTxHash: "0x" + "44".repeat(32),
      } as any);
    });

    const sent: any[] = [];
    globalThis.fetch = vi.fn(async (url: any, init?: any) => {
      const u = String(url);
      if (u === "https://api.resend.com/emails") {
        sent.push(JSON.parse(String(init?.body || "{}")));
        return new Response(JSON.stringify({ id: `email_${sent.length}` }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw new Error(`Unexpected fetch: ${u}`);
    }) as any;

    const res = await t.action(api.merchantNotifications.notifyMerchantDisputeFiled, { caseId });
    expect(res.ok).toBe(true);
    expect(res.emailed).toBe(true);
    expect(sent.length).toBe(1);
    expect(sent[0]?.to?.[0]).toBe("vbkotecha@gmail.com");
    expect(String(sent[0]?.subject || "")).toContain("Refund request received (Dexter)");

    process.env.RESEND_API_KEY = prevResendKey;
    process.env.EMAIL_FROM = prevEmailFrom;
  });

  it("Dexter partner case: notifyMerchantRefundExecuted sends ops executed email + partner processed summary (override to vbkotecha)", async () => {
    const prevResendKey = process.env.RESEND_API_KEY;
    const prevEmailFrom = process.env.EMAIL_FROM;
    process.env.RESEND_API_KEY = "test_key";
    process.env.EMAIL_FROM = "refunds@x402refunds.com";

    const now = Date.now();
    const orgId = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", { name: "Dexter", domain: "dexter.cash", createdAt: now } as any);
    });
    const programId = await t.run(async (ctx) => {
      return await ctx.db.insert("partnerPrograms", {
        liableOrganizationId: orgId,
        partnerKey: "dexter",
        canonicalEmail: "refunds@dexter.cash",
        enabled: true,
        autoDecideEnabled: true,
        autoExecuteEnabled: true,
        maxAutoRefundMicrousdc: 2_000_000,
        platformOpsEmail: "vbkotecha@gmail.com",
        partnerOpsEmail: "refunds@dexter.cash",
        protectedEndpointsMode: "noop_true_poc",
        createdAt: now,
      } as any);
    });

    const caseId = await t.run(async (ctx) => {
      return await ctx.db.insert("cases", {
        plaintiff: "eip155:8453:0x00000000000000000000000000000000000000bb",
        defendant: "eip155:8453:0x00000000000000000000000000000000000000aa",
        status: "DECIDED",
        type: "PAYMENT",
        filedAt: now,
        description: "dexter executed",
        amount: 1.0,
        currency: "USDC",
        evidenceIds: [],
        createdAt: now,
        reviewerOrganizationId: orgId,
        aiRecommendation: {
          verdict: "CONSUMER_WINS",
          confidence: 0.9,
          reasoning: "line1\nline2",
          summary2: "line1\nline2",
          analyzedAt: now,
          similarCases: [],
          refundAmountMicrousdc: 1_000_000,
        },
        metadata: {
          partner: { partnerProgramId: String(programId), partnerKey: "dexter", canonicalEmail: "refunds@dexter.cash" },
          v1: { paymentSupportEmail: "refunds@dexter.cash" },
        },
      } as any);
    });

    const refundId = await t.run(async (ctx) => {
      return await ctx.db.insert("refundTransactions", {
        caseId,
        fromWallet: "eip155:8453:0xdead",
        toWallet: "eip155:8453:0xbeef",
        amount: 1,
        currency: "USDC",
        blockchain: "base",
        status: "EXECUTED",
        amountMicrousdc: 1_000_000,
        sourceChain: "base",
        sourceTxHash: "0x" + "55".repeat(32),
        sourceTransferLogIndex: 0,
        refundTxHash: "0x" + "66".repeat(32),
        explorerUrl: "https://basescan.org/tx/0x" + "66".repeat(32),
        createdAt: now,
      } as any);
    });

    const sent: any[] = [];
    globalThis.fetch = vi.fn(async (url: any, init?: any) => {
      const u = String(url);
      if (u === "https://api.resend.com/emails") {
        sent.push(JSON.parse(String(init?.body || "{}")));
        return new Response(JSON.stringify({ id: `email_${sent.length}` }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw new Error(`Unexpected fetch: ${u}`);
    }) as any;

    const res = await t.action((api as any).merchantNotifications.notifyMerchantRefundExecuted, { caseId, refundId });
    expect(res.ok).toBe(true);
    expect(res.emailed).toBe(true);

    // Should send 2 emails: executed to platform ops + processed summary to vbkotecha override.
    expect(sent.length).toBe(2);
    const toList = sent.map((p) => p?.to?.[0]).sort();
    expect(toList).toEqual(["vbkotecha@gmail.com", "vbkotecha@gmail.com"]);
    expect(String(sent[1]?.text || sent[0]?.text || "")).toContain("AI summary:");
    expect(String(sent[1]?.text || sent[0]?.text || "")).toContain("line1");

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

