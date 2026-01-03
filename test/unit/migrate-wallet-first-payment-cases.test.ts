import { describe, it, expect, beforeAll } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api, internal } from "../../convex/_generated/api";

describe("migration: PAYMENT cases -> wallet-first v1 normalization", () => {
  let t: ReturnType<typeof convexTest>;

  beforeAll(async () => {
    const modules = import.meta.glob("../../convex/**/*.{ts,js}");
    t = convexTest(schema, modules);
  });

  it("dryRun reports updates without mutating", async () => {
    const now = Date.now();
    const caseId = await t.run(async (ctx) =>
      ctx.db.insert("cases", {
        plaintiff: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        defendant: "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
        status: "FILED",
        type: "PAYMENT",
        filedAt: now,
        description: "legacy payment case",
        evidenceIds: [],
        paymentDetails: {
          transactionId: "txn_1",
          transactionHash: "0x" + "11".repeat(32),
          blockchain: "base",
          amountMicrousdc: 250_000,
          regulationEDeadline: now + 10,
          disputeFee: 0,
        },
        createdAt: now,
      } as any)
    );

    const before = await t.run(async (ctx) => ctx.db.get(caseId));
    expect(before?.plaintiff).toBe("0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");

    const res = await t.mutation(internal.cases.migratePaymentCasesToWalletFirstV1, { dryRun: true, limit: 1000 });
    expect(res.scanned).toBeGreaterThan(0);
    expect(res.updated).toBeGreaterThan(0);

    const after = await t.run(async (ctx) => ctx.db.get(caseId));
    // unchanged due to dryRun
    expect(after?.plaintiff).toBe("0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    expect(after?.metadata?.v1).toBeUndefined();
  });

  it("apply run normalizes addresses + fills currency/amount + writes metadata.v1", async () => {
    const now = Date.now();
    const caseId = await t.run(async (ctx) =>
      ctx.db.insert("cases", {
        plaintiff: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        defendant: "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
        status: "FILED",
        type: "PAYMENT",
        filedAt: now,
        description: "legacy payment case",
        evidenceIds: [],
        paymentDetails: {
          transactionId: "txn_2",
          transactionHash: "0x" + "22".repeat(32),
          blockchain: "base",
          amountMicrousdc: 10000,
          regulationEDeadline: now + 10,
          disputeFee: 0,
          disputeReason: "api_timeout",
        },
        createdAt: now,
      } as any)
    );

    const res = await t.mutation(internal.cases.migratePaymentCasesToWalletFirstV1, { dryRun: false, limit: 1000 });
    expect(res.updated).toBeGreaterThan(0);

    const row = await t.run(async (ctx) => ctx.db.get(caseId));
    expect(row?.plaintiff).toBe("eip155:8453:0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    expect(row?.defendant).toBe("eip155:8453:0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
    expect(row?.currency).toBe("USDC");
    expect(row?.amount).toBeCloseTo(0.01, 6);
    expect(row?.metadata?.v1?.buyer).toBe(row?.plaintiff);
    expect(row?.metadata?.v1?.merchant).toBe(row?.defendant);
    expect(row?.metadata?.v1?.chain).toBe("base");
    expect(row?.metadata?.v1?.reason).toBe("api_timeout");
  });
});

