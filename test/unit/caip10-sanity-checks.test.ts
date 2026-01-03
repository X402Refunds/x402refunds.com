import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";

describe("sanity CAIP-10 counters", () => {
  it("counts non-CAIP10 PAYMENT defendants and non-CAIP10 agent wallets", async () => {
    const modules = import.meta.glob("../../convex/**/*.{ts,js}");
    const t = convexTest(schema, modules);

    // Seed PAYMENT cases (one good, one bad)
    await t.run(async (ctx) =>
      ctx.db.insert("cases", {
      plaintiff: "buyer:test",
      defendant: "eip155:8453:0x0000000000000000000000000000000000000001",
      status: "FILED",
      type: "PAYMENT",
      filedAt: Date.now(),
      description: "ok",
      currency: "USDC",
      evidenceIds: [],
      metadata: { v1: { buyer: "buyer:test", merchant: "eip155:8453:0x0000000000000000000000000000000000000001" } },
      createdAt: Date.now(),
    } as any)
    );

    await t.run(async (ctx) =>
      ctx.db.insert("cases", {
      plaintiff: "buyer:test",
      defendant: "merchant:api@example.com",
      status: "FILED",
      type: "PAYMENT",
      filedAt: Date.now(),
      description: "bad",
      currency: "USDC",
      evidenceIds: [],
      metadata: { v1: { buyer: "buyer:test", merchant: "merchant:api@example.com" } },
      createdAt: Date.now(),
    } as any)
    );

    // Seed agents (one wallet, good CAIP-10)
    await t.run(async (ctx) =>
      ctx.db.insert("agents", {
      did: "did:agent:test",
      ownerDid: "did:owner:test",
      name: "Test",
      organizationName: "Org",
      organizationId: undefined,
      publicKey: "pk",
      status: "active",
      mock: true,
      walletAddress: "eip155:8453:0x0000000000000000000000000000000000000001",
      createdAt: Date.now(),
    } as any)
    );

    // Set secret for sanity mutations.
    process.env.MIGRATIONS_SECRET = "test-secret";

    const casesRes = await t.mutation(api.sanity.runCountPaymentCasesWithNonCaip10Defendant, {
      secret: "test-secret",
      limit: 1000,
    });

    expect(casesRes.badNonCaip10).toBe(1);
    expect(casesRes.walletFirstBadNonCaip10).toBe(1);

    const agentsRes = await t.mutation(api.sanity.runCountAgentsWithNonCaip10WalletAddress, {
      secret: "test-secret",
      limit: 1000,
    });

    expect(agentsRes.withWallet).toBe(1);
    expect(agentsRes.badNonCaip10).toBe(0);
  });
});

