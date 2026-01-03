import { describe, it, expect } from "vitest";
import { parsePaymentRequiredHeaderV2 } from "../../dashboard/src/lib/x402-signature";

describe("x402 v2 client helpers", () => {
  it("parses PAYMENT-REQUIRED (base64 JSON) and validates shape", () => {
    const payload = {
      x402Version: 2,
      accepts: [
        {
          scheme: "exact",
          network: "eip155:8453",
          asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          amount: "10000",
          payTo: "0x0000000000000000000000000000000000000001",
          extra: { name: "USD Coin", version: "2" },
        },
      ],
    };
    const b64 = btoa(JSON.stringify(payload));
    const parsed = parsePaymentRequiredHeaderV2(b64);
    expect(parsed.x402Version).toBe(2);
    expect(parsed.accepts[0].scheme).toBe("exact");
    expect(parsed.accepts[0].network).toBe("eip155:8453");
    expect(parsed.accepts[0].amount).toBe("10000");
  });

  it("throws for invalid PAYMENT-REQUIRED", () => {
    expect(() => parsePaymentRequiredHeaderV2("not-base64")).toThrow();
    const bad = btoa(JSON.stringify({ x402Version: 2, accepts: [] }));
    expect(() => parsePaymentRequiredHeaderV2(bad)).toThrow(/accepts/);
  });
});

