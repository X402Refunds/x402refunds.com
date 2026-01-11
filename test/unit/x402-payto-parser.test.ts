import { describe, it, expect } from "vitest";
import { parseX402PayTo } from "../../convex/lib/x402PayTo";

describe("x402 payTo parser (unit)", () => {
  it("parses v1 accepts[] body payTo candidates", () => {
    const body = JSON.stringify({
      x402Version: 1,
      accepts: [
        { scheme: "exact", network: "base", payTo: "0xAbcDEF0000000000000000000000000000000000" },
        { scheme: "exact", network: "solana", payTo: "7rQpJf5cVj7yZ2m3Hk9fK3s8gGv8kGkE3nRZQGq8n6cF" },
      ],
    });

    const res = parseX402PayTo({ status: 402, paymentRequiredHeader: null, bodyText: body });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.versionDetected).toBe(1);
    expect(res.payToCandidates).toContain("0xAbcDEF0000000000000000000000000000000000");
    expect(res.payToCandidates).toContain("7rQpJf5cVj7yZ2m3Hk9fK3s8gGv8kGkE3nRZQGq8n6cF");
  });

  it("parses v2 PAYMENT-REQUIRED base64 JSON payTo candidates", () => {
    const payload = {
      x402Version: 2,
      payment_required: { payTo: "0x9876543210987654321098765432109876543210" },
    };
    const header = Buffer.from(JSON.stringify(payload), "utf8").toString("base64");

    const res = parseX402PayTo({ status: 402, paymentRequiredHeader: header, bodyText: null });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.versionDetected).toBe(2);
    expect(res.payToCandidates).toContain("0x9876543210987654321098765432109876543210");
  });
});

