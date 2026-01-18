import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api, internal } from "../../convex/_generated/api";

describe("dexter partner flow (unit)", () => {
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

  it("tags case as dexter partner based on canonical email and routes reviewerOrganizationId", async () => {
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
        autoExecuteEnabled: false,
        maxAutoRefundMicrousdc: 2_000_000,
        platformOpsEmail: "vbkotecha@gmail.com",
        partnerOpsEmail: "refunds@dexter.cash",
        protectedEndpointsMode: "noop_true_poc",
        createdAt: now,
      } as any);
    });

    const created = await t.mutation(api.pool.cases_fileWalletPaymentDispute, {
      blockchain: "base",
      transactionHash: "0x" + "11".repeat(32),
      sellerEndpointUrl: "https://merchant.example/v1/paid",
      origin: "https://merchant.example",
      payer: "eip155:8453:0x00000000000000000000000000000000000000aa",
      merchant: "eip155:8453:0x0000000000000000000000000000000000000001",
      amountMicrousdc: 1_000_000,
      sourceTransferLogIndex: 0,
      description: "test partner routing",
      paymentSupportEmail: "refunds@dexter.cash",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const row = await t.run(async (ctx) => {
      return await ctx.db.get(created.disputeId);
    });
    expect(row).toBeTruthy();
    expect(String((row as any).reviewerOrganizationId)).toBe(String(orgId));
    expect(String((row as any).metadata?.partner?.partnerProgramId)).toBe(String(programId));
    expect(String((row as any).metadata?.partner?.partnerKey)).toBe("dexter");
  });

  it("auto-decides when amount <= $2 and sets a 2-line summary", async () => {
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
        autoExecuteEnabled: false,
        maxAutoRefundMicrousdc: 2_000_000,
        platformOpsEmail: "vbkotecha@gmail.com",
        partnerOpsEmail: "refunds@dexter.cash",
        protectedEndpointsMode: "noop_true_poc",
        createdAt: now,
      } as any);
    });

    const caseId = await t.run(async (ctx) => {
      return await ctx.db.insert("cases", {
        plaintiff: "eip155:8453:0x00000000000000000000000000000000000000aa",
        defendant: "eip155:8453:0x0000000000000000000000000000000000000001",
        status: "FILED",
        type: "PAYMENT",
        filedAt: now,
        description: "api_timeout",
        amount: 1.0,
        currency: "USDC",
        evidenceIds: [],
        createdAt: now,
        reviewerOrganizationId: orgId,
        metadata: {
          partner: { partnerProgramId: String(programId), partnerKey: "dexter", canonicalEmail: "refunds@dexter.cash" },
          v1: { paymentSupportEmail: "refunds@dexter.cash" },
        },
        paymentDetails: {
          transactionId: "0x" + "22".repeat(32),
          transactionHash: "0x" + "22".repeat(32),
          blockchain: "base",
          amountMicrousdc: 1_000_000,
          amountUnit: "microusdc",
          sourceTransferLogIndex: 0,
          disputeFee: 0.05,
          regulationEDeadline: now + 10_000,
          plaintiffMetadata: { requestJson: JSON.stringify({ method: "POST", url: "https://merchant.example/v1" }) },
          defendantMetadata: { responseJson: JSON.stringify({ status: 500 }) },
        },
        paymentSourceChain: "base",
        paymentSourceTxHash: "0x" + "22".repeat(32),
      } as any);
    });

    const res: any = await t.mutation((internal as any).partners.dexterAdjudicateAndMaybeExecute, { caseId });
    expect(res.ok).toBe(true);
    expect(res.verdict).toBe("CONSUMER_WINS");
    expect(typeof res.summary2).toBe("string");
    expect(String(res.summary2).split("\n")).toHaveLength(2);

    const updated = await t.run(async (ctx) => ctx.db.get(caseId));
    expect((updated as any).status).toBe("DECIDED");
    expect((updated as any).finalVerdict).toBe("CONSUMER_WINS");
    expect((updated as any).finalRefundAmountMicrousdc).toBe(1_000_000);
    expect((updated as any).aiRecommendation?.summary2).toBeTruthy();
  });

  it("does not auto-decide when amount > $2 (NEED_REVIEW)", async () => {
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
        autoExecuteEnabled: false,
        maxAutoRefundMicrousdc: 2_000_000,
        platformOpsEmail: "vbkotecha@gmail.com",
        partnerOpsEmail: "refunds@dexter.cash",
        protectedEndpointsMode: "noop_true_poc",
        createdAt: now,
      } as any);
    });

    const caseId = await t.run(async (ctx) => {
      return await ctx.db.insert("cases", {
        plaintiff: "eip155:8453:0x00000000000000000000000000000000000000aa",
        defendant: "eip155:8453:0x0000000000000000000000000000000000000001",
        status: "FILED",
        type: "PAYMENT",
        filedAt: now,
        description: "large refund",
        amount: 2.000001,
        currency: "USDC",
        evidenceIds: [],
        createdAt: now,
        reviewerOrganizationId: orgId,
        metadata: {
          partner: { partnerProgramId: String(programId), partnerKey: "dexter", canonicalEmail: "refunds@dexter.cash" },
          v1: { paymentSupportEmail: "refunds@dexter.cash" },
        },
        paymentDetails: {
          transactionId: "0x" + "33".repeat(32),
          transactionHash: "0x" + "33".repeat(32),
          blockchain: "base",
          amountMicrousdc: 2_000_001,
          amountUnit: "microusdc",
          sourceTransferLogIndex: 0,
          disputeFee: 0.05,
          regulationEDeadline: now + 10_000,
          plaintiffMetadata: {},
          defendantMetadata: {},
        },
        paymentSourceChain: "base",
        paymentSourceTxHash: "0x" + "33".repeat(32),
      } as any);
    });

    const res: any = await t.mutation((internal as any).partners.dexterAdjudicateAndMaybeExecute, { caseId });
    expect(res.ok).toBe(true);
    expect(res.verdict).toBe("NEED_REVIEW");

    const updated = await t.run(async (ctx) => ctx.db.get(caseId));
    expect((updated as any).status).toBe("FILED");
    expect((updated as any).finalVerdict).toBeUndefined();
    expect((updated as any).aiRecommendation?.verdict).toBe("NEED_REVIEW");
  });
});

