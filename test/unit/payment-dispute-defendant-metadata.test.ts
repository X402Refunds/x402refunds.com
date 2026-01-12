import { describe, it, expect, beforeAll } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";

describe("payment disputes (unit): defendantMetadata merchantOrigin", () => {
  let t: ReturnType<typeof convexTest>;

  beforeAll(async () => {
    const modules = import.meta.glob("../../convex/**/*.{ts,js}");
    t = convexTest(schema, modules);
  });

  it("wallet-first filing stores merchantOrigin on paymentDetails.defendantMetadata", async () => {
    const created = await t.mutation(api.pool.cases_fileWalletPaymentDispute, {
      blockchain: "base",
      transactionHash: "0x" + "11".repeat(32),
      sellerEndpointUrl: "https://merchant.example/v1/chat",
      origin: "https://merchant.example",
      payer: "eip155:8453:0x00000000000000000000000000000000000000aa",
      merchant: "eip155:8453:0x0000000000000000000000000000000000000001",
      amountMicrousdc: 250_000,
      sourceTransferLogIndex: 0,
      description: "test: store merchantOrigin in defendantMetadata",
      evidenceUrls: [],
    });

    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const row = await t.run(async (ctx: any) => ctx.db.get(created.disputeId));
    expect(row).toBeTruthy();
    expect(row.paymentDetails?.defendantMetadata?.merchantOrigin).toBe("https://merchant.example");
  });
});

