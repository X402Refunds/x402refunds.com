import { describe, it, expect } from "vitest";
import { build402ResponseBody, buildTopupPaymentRequirement, USDC_BASE_MAINNET } from "../../dashboard/src/lib/x402-topup";

describe("x402 top-up requirements (Base)", () => {
  it("builds a v1 402 response with a single requirement", () => {
    const req = buildTopupPaymentRequirement({
      amountMicrousdc: 250_000,
      payTo: "0x0000000000000000000000000000000000000001",
      resourceUrl: "https://example.com/api/billing/topup",
    });

    expect(req.scheme).toBe("exact");
    expect(req.network).toBe("base");
    expect(req.asset).toBe(USDC_BASE_MAINNET);
    expect(req.maxAmountRequired).toBe("250000");
    expect(req.payTo).toBe("0x0000000000000000000000000000000000000001");
    expect(req.extra.name).toBe("USD Coin");
    expect(req.extra.version).toBe("2");

    const body = build402ResponseBody({ requirement: req });
    expect(body.x402Version).toBe(1);
    expect(Array.isArray(body.accepts)).toBe(true);
    expect(body.accepts).toHaveLength(1);
    expect(body.accepts[0]).toMatchObject(req);
  });
});


