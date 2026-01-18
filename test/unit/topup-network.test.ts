import { describe, expect, it } from "vitest";
import { inferTopupPayNetworkFromMerchant } from "../../dashboard/src/lib/topup-network";

describe("topup network inference", () => {
  it("locks Base when merchant is a 0x address", () => {
    const res = inferTopupPayNetworkFromMerchant("0x0000000000000000000000000000000000000001");
    expect(res.network).toBe("base");
    expect(res.locked).toBe(true);
    expect(res.merchantCaip10).toBe("eip155:8453:0x0000000000000000000000000000000000000001");
  });

  it("locks Base when merchant is Base CAIP-10", () => {
    const res = inferTopupPayNetworkFromMerchant("eip155:8453:0x0000000000000000000000000000000000000001");
    expect(res.network).toBe("base");
    expect(res.locked).toBe(true);
  });

  it("locks Solana when merchant is Solana CAIP-10", () => {
    const res = inferTopupPayNetworkFromMerchant(
      "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:FiZy3ch8QSDVWhJfZJYA75ZvDQgu4FJY4NfesZhbda4N",
    );
    expect(res.network).toBe("solana");
    expect(res.locked).toBe(true);
  });

  it("locks Solana when merchant is raw base58", () => {
    const res = inferTopupPayNetworkFromMerchant("FiZy3ch8QSDVWhJfZJYA75ZvDQgu4FJY4NfesZhbda4N");
    expect(res.network).toBe("solana");
    expect(res.locked).toBe(true);
    expect(res.merchantCaip10?.startsWith("solana:")).toBe(true);
  });
});

