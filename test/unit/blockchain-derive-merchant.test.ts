import { describe, it, expect, beforeAll } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";

describe("blockchain derive merchant (unit)", () => {
  let t: ReturnType<typeof convexTest>;

  beforeAll(async () => {
    const modules = import.meta.glob("../../convex/**/*.{ts,js}");
    t = convexTest(schema, modules);
  });

  it("deriveUsdcMerchantFromTxHashBase exists and returns ok:true in mock mode", async () => {
    const res = await t.action((api as any).lib.blockchain.deriveUsdcMerchantFromTxHashBase, {
      transactionHash: "0x" + "11".repeat(32),
    });
    expect(res.ok).toBe(true);
    expect(res.blockchain).toBe("base");
    expect(typeof res.recipientAddress).toBe("string");
  });

  it("deriveUsdcMerchantFromTxHashSolana exists and returns ok:true in mock mode", async () => {
    const res = await t.action((api as any).lib.blockchain.deriveUsdcMerchantFromTxHashSolana, {
      transactionHash: "1".repeat(44),
    });
    expect(res.ok).toBe(true);
    expect(res.blockchain).toBe("solana");
    expect(typeof res.recipientAddress).toBe("string");
  });
});

