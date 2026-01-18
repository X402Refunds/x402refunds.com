import { describe, expect, it } from "vitest";
import { getSolanaAmountMicrousdcFromRequirement } from "../../dashboard/src/lib/x402-solana";

describe("x402 solana requirement amount parsing", () => {
  it("uses amount when present (v2)", () => {
    const v = getSolanaAmountMicrousdcFromRequirement({ amount: "60000" });
    expect(v).toBe(BigInt(60000));
  });

  it("falls back to maxAmountRequired when amount missing (v1-ish)", () => {
    const v = getSolanaAmountMicrousdcFromRequirement({ maxAmountRequired: "60000" });
    expect(v).toBe(BigInt(60000));
  });

  it("throws a helpful error if neither field is present", () => {
    expect(() => getSolanaAmountMicrousdcFromRequirement({})).toThrow(/missing amount/i);
  });
});

