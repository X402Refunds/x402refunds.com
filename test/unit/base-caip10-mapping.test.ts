import { describe, expect, it } from "vitest";
import { baseAddressToCaip10, normalizeMerchantToCaip10Base } from "../../dashboard/src/lib/caip10";

describe("baseAddressToCaip10 (frontend mapping)", () => {
  it("lowercases and prefixes eip155:8453", () => {
    expect(baseAddressToCaip10("0x00000000000000000000000000000000000000AA")).toBe(
      "eip155:8453:0x00000000000000000000000000000000000000aa",
    );
  });

  it("rejects invalid addresses", () => {
    expect(() => baseAddressToCaip10("not-an-address")).toThrow();
    expect(() => baseAddressToCaip10("0x123")).toThrow();
  });
});

describe("normalizeMerchantToCaip10Base (frontend merchant input)", () => {
  it("accepts raw 0x addresses and normalizes to eip155:8453", () => {
    const res = normalizeMerchantToCaip10Base("0x00000000000000000000000000000000000000AA");
    expect(res.caip10).toBe("eip155:8453:0x00000000000000000000000000000000000000aa");
  });

  it("accepts Base CAIP-10 input and lowercases address", () => {
    const res = normalizeMerchantToCaip10Base("eip155:8453:0x00000000000000000000000000000000000000AA");
    expect(res.caip10).toBe("eip155:8453:0x00000000000000000000000000000000000000aa");
  });

  it("accepts Solana CAIP-10 input", () => {
    const res = normalizeMerchantToCaip10Base(
      "solana:5eykt4GNfsw7SU33zdhhrELoMu3gFmT33EpFdpEfmgbf:FiZy3ch8QSDVWhJfZJYA75ZvDQgu4FJY4NfesZhbda4N",
    );
    expect(res.caip10).toBe(
      "solana:5eykt4GNfsw7SU33zdhhrELoMu3gFmT33EpFdpEfmgbf:FiZy3ch8QSDVWhJfZJYA75ZvDQgu4FJY4NfesZhbda4N",
    );
  });

  it("rejects invalid input", () => {
    const res = normalizeMerchantToCaip10Base("not-an-address");
    expect(res.caip10).toBe(null);
    expect(typeof res.error).toBe("string");
  });
});

