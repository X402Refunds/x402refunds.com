import { describe, it, expect, beforeAll } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";

describe("txHash merchant lookup (unit)", () => {
  let t: ReturnType<typeof convexTest>;

  beforeAll(async () => {
    const modules = import.meta.glob("../../convex/**/*.{ts,js}");
    t = convexTest(schema, modules);
  });

  it("deriveUsdcMerchantFromTxHashBase returns deterministic mock result in test mode", async () => {
    const txHash = "0x" + "11".repeat(32);
    const res = await t.action(api.lib.blockchain.deriveUsdcMerchantFromTxHashBase, {
      transactionHash: txHash,
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.blockchain).toBe("base");
    expect(res.transactionHash).toBe(txHash);
    expect(typeof res.recipientAddress).toBe("string");
    expect(res.recipientAddress.startsWith("0x")).toBe(true);
    expect(typeof res.payerAddress).toBe("string");
    expect(typeof res.amountMicrousdc).toBe("number");
    expect(typeof res.logIndex).toBe("number");
  });

  it("deriveUsdcMerchantFromTxHashBase rejects invalid tx hash format", async () => {
    const res = await t.action(api.lib.blockchain.deriveUsdcMerchantFromTxHashBase, {
      transactionHash: "not-a-tx",
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe("UNSUPPORTED");
  });
});

