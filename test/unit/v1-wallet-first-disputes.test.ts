import { describe, it, expect, beforeAll } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";
import { internal } from "../../convex/_generated/api";
import { privateKeyToAccount } from "viem/accounts";

describe("v1 wallet-first disputes (unit)", () => {
  let t: ReturnType<typeof convexTest>;

  beforeAll(async () => {
    const modules = import.meta.glob("../../convex/**/*.{ts,js}");
    t = convexTest(schema, modules);
  });

  it("creates a wallet-first dispute in cases with buyer/merchant mapping", async () => {
    const res = await t.mutation(api.pool.cases_fileWalletPaymentDispute, {
      buyer: "buyer:alice",
      merchant: "eip155:8453:0x0000000000000000000000000000000000000001",
      merchantOrigin: "https://localhost",
      txHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      chain: "base",
      amountMicrousdc: "10000",
      reason: "api_timeout",
      evidenceUrlOrHash: "https://example.com/logs/timeout.json",
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const row = await t.run(async (ctx) => ctx.db.get(res.disputeId));
    expect(row).toBeTruthy();
    expect(row.plaintiff).toBe("buyer:alice");
    expect(row.defendant).toBe("eip155:8453:0x0000000000000000000000000000000000000001");
    expect(row.metadata?.poolStatus).toBe("FILED");
  });

  it("lists disputes by merchant (CAIP-10 normalized)", async () => {
    const merchantRaw = "eip155:8453:0x00000000000000000000000000000000000000AA";
    const merchantNormalized = "eip155:8453:0x00000000000000000000000000000000000000aa";

    const d1 = await t.mutation(api.pool.cases_fileWalletPaymentDispute, {
      buyer: "buyer:a",
      merchant: merchantRaw,
      merchantOrigin: "https://localhost",
      reason: "r1",
    });
    expect(d1.ok).toBe(true);

    const d2 = await t.mutation(api.pool.cases_fileWalletPaymentDispute, {
      buyer: "buyer:b",
      merchant: merchantRaw,
      merchantOrigin: "https://localhost",
      reason: "r2",
    });
    expect(d2.ok).toBe(true);

    const listed = await t.query(api.pool.cases_listWalletDisputesByMerchant, {
      merchant: merchantRaw,
      limit: 10,
    });

    expect(listed.ok).toBe(true);
    if (!listed.ok) return;
    expect(listed.disputes.length).toBeGreaterThanOrEqual(2);
    for (const row of listed.disputes) {
      expect(row.defendant).toBe(merchantNormalized);
    }
  });

  it("topup credit is idempotent by (chain, txHash, logIndex) and increments balance once", async () => {
    const merchant = "eip155:8453:0x00000000000000000000000000000000000000bb";
    const txHash = "0x" + "11".repeat(32);
    const logIndex = 0;

    const first = await t.mutation(api.pool.topup_creditMerchantBalanceFromTx, {
      merchant,
      blockchain: "base",
      txHash,
      sourceTransferLogIndex: logIndex,
      amountMicrousdc: 250_000,
      payerAddress: "0x0000000000000000000000000000000000000003",
      recipientAddress: "0x0000000000000000000000000000000000000004",
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.creditedMicrousdc).toBe(250_000);
    expect(first.newBalanceMicrousdc).toBe(250_000);

    const second = await t.mutation(api.pool.topup_creditMerchantBalanceFromTx, {
      merchant,
      blockchain: "base",
      txHash,
      sourceTransferLogIndex: logIndex,
      amountMicrousdc: 250_000,
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.creditedMicrousdc).toBe(250_000);
    expect(second.newBalanceMicrousdc).toBe(250_000);

    const merchantNormalized = "eip155:8453:0x00000000000000000000000000000000000000bb";
    const balance = await t.run(async (ctx) =>
      ctx.db
        .query("merchantBalances")
        // @ts-expect-error convex-test query typing
        .withIndex("by_wallet_currency", (q) => q.eq("walletAddress", merchantNormalized).eq("currency", "USDC"))
        .first()
    );
    expect(balance).toBeTruthy();
    expect(balance.availableBalance).toBeCloseTo(0.25, 6);

    const topups = await t.run(async (ctx) =>
      ctx.db
        .query("merchantTopups")
        // @ts-expect-error convex-test query typing
        .withIndex("by_source_triplet", (q) => q.eq("blockchain", "base").eq("txHash", txHash).eq("sourceTransferLogIndex", logIndex))
        .collect()
    );
    expect(topups.length).toBe(1);
  });

  it("arbiter deny resolution is signature-gated and nonce replay-protected", async () => {
    const arbiterPk = "0x1111111111111111111111111111111111111111111111111111111111111111";
    const arbiter = privateKeyToAccount(arbiterPk);
    process.env.ARBITER_IDENTITY = `eip155:8453:${arbiter.address}`;

    const created = await t.mutation(api.pool.cases_fileWalletPaymentDispute, {
      buyer: "buyer:bob",
      merchant: "eip155:8453:0x0000000000000000000000000000000000000002",
      merchantOrigin: "https://localhost",
      reason: "service_not_rendered",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const timestampMs = Date.now();
    const nonce = "0x" + "22".repeat(32);
    const message =
      [
        "x402disputes:resolve:v1",
        `disputeId=${created.disputeId}`,
        `outcome=deny`,
        `refundAmountMicrousdc=`,
        `timestamp=${timestampMs}`,
        `nonce=${nonce}`,
      ].join("\n") + "\n";
    const signature = await arbiter.signMessage({ message });

    const r1 = await t.mutation(internal.pool.arbiter_resolveDispute, {
      disputeId: created.disputeId,
      outcome: "deny",
      timestampMs,
      nonce,
      signature,
    });

    expect(r1.ok).toBe(true);
    expect(r1.status).toBe("DENIED");

    const r2 = await t.mutation(internal.pool.arbiter_resolveDispute, {
      disputeId: created.disputeId,
      outcome: "deny",
      timestampMs,
      nonce,
      signature,
    });
    expect(r2.ok).toBe(false);
    expect(r2.code).toBe("REPLAY");
  });

  it("arbiter resolve rejects stale timestamp", async () => {
    const arbiterPk = "0x2222222222222222222222222222222222222222222222222222222222222222";
    const arbiter = privateKeyToAccount(arbiterPk);
    process.env.ARBITER_IDENTITY = `eip155:8453:${arbiter.address}`;

    const created = await t.mutation(api.pool.cases_fileWalletPaymentDispute, {
      buyer: "buyer:stale",
      merchant: "eip155:8453:0x0000000000000000000000000000000000000002",
      merchantOrigin: "https://localhost",
      reason: "service_not_rendered",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const timestampMs = Date.now() - 10 * 60_000; // 10 minutes ago (outside 5m window)
    const nonce = "0x" + "33".repeat(32);
    const message =
      [
        "x402disputes:resolve:v1",
        `disputeId=${created.disputeId}`,
        `outcome=deny`,
        `refundAmountMicrousdc=`,
        `timestamp=${timestampMs}`,
        `nonce=${nonce}`,
      ].join("\n") + "\n";
    const signature = await arbiter.signMessage({ message });

    const r = await t.mutation(internal.pool.arbiter_resolveDispute, {
      disputeId: created.disputeId,
      outcome: "deny",
      timestampMs,
      nonce,
      signature,
    });
    expect(r.ok).toBe(false);
    expect(r.code).toBe("STALE_TIMESTAMP");
  });

  it("arbiter resolve rejects wrong signer (UNAUTHORIZED)", async () => {
    const arbiterPk = "0x3333333333333333333333333333333333333333333333333333333333333333";
    const arbiter = privateKeyToAccount(arbiterPk);
    process.env.ARBITER_IDENTITY = `eip155:8453:${arbiter.address}`;

    const attacker = privateKeyToAccount("0x4444444444444444444444444444444444444444444444444444444444444444");

    const created = await t.mutation(api.pool.cases_fileWalletPaymentDispute, {
      buyer: "buyer:attacked",
      merchant: "eip155:8453:0x0000000000000000000000000000000000000002",
      merchantOrigin: "https://localhost",
      reason: "service_not_rendered",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const timestampMs = Date.now();
    const nonce = "0x" + "44".repeat(32);
    const message =
      [
        "x402disputes:resolve:v1",
        `disputeId=${created.disputeId}`,
        `outcome=deny`,
        `refundAmountMicrousdc=`,
        `timestamp=${timestampMs}`,
        `nonce=${nonce}`,
      ].join("\n") + "\n";
    const signature = await attacker.signMessage({ message });

    const r = await t.mutation(internal.pool.arbiter_resolveDispute, {
      disputeId: created.disputeId,
      outcome: "deny",
      timestampMs,
      nonce,
      signature,
    });
    expect(r.ok).toBe(false);
    expect(r.code).toBe("UNAUTHORIZED");
  });
});

