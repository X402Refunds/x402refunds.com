import { describe, it, expect, beforeAll } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { internal } from "../../convex/_generated/api";

describe("purge: non-PAYMENT cases and orphans", () => {
  let t: ReturnType<typeof convexTest>;

  beforeAll(async () => {
    const modules = import.meta.glob("../../convex/**/*.{ts,js}");
    t = convexTest(schema, modules);
  });

  it("deletes non-PAYMENT cases and associated rows, keeps PAYMENT", async () => {
    const now = Date.now();

    const paymentCaseId = await t.run(async (ctx) =>
      ctx.db.insert("cases", {
        plaintiff: "buyer:x",
        defendant: "merchant:y",
        status: "FILED",
        type: "PAYMENT",
        filedAt: now,
        description: "payment",
        evidenceIds: [],
        createdAt: now,
      } as any)
    );

    const generalCaseId = await t.run(async (ctx) =>
      ctx.db.insert("cases", {
        plaintiff: "did:test:a",
        defendant: "did:test:b",
        status: "FILED",
        type: "SLA_BREACH",
        filedAt: now + 1,
        description: "general",
        evidenceIds: [],
        createdAt: now + 1,
      } as any)
    );

    const evId = await t.run(async (ctx) =>
      ctx.db.insert("evidenceManifests", {
        caseId: generalCaseId,
        agentDid: "did:test:a",
        sha256: "sha256_test",
        uri: "https://example.com/evidence.json",
        signer: "did:test:a",
        ts: now,
        model: { provider: "test", name: "test", version: "1.0.0" },
      } as any)
    );

    // Dry-run should report deletions but not delete
    const dry = await t.mutation(internal.cases.purgeNonPaymentCasesAndOrphans, { dryRun: true, limit: 1000 });
    expect(dry.deletedCases).toBeGreaterThan(0);

    expect(await t.run(async (ctx) => ctx.db.get(generalCaseId))).toBeTruthy();
    expect(await t.run(async (ctx) => ctx.db.get(evId))).toBeTruthy();

    // Apply
    const res = await t.mutation(internal.cases.purgeNonPaymentCasesAndOrphans, { dryRun: false, limit: 1000 });
    expect(res.deletedCases).toBeGreaterThan(0);

    expect(await t.run(async (ctx) => ctx.db.get(generalCaseId))).toBeNull();
    expect(await t.run(async (ctx) => ctx.db.get(evId))).toBeNull();

    // PAYMENT remains
    expect(await t.run(async (ctx) => ctx.db.get(paymentCaseId))).toBeTruthy();
  });
});

