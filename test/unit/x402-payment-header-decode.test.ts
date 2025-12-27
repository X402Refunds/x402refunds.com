import { describe, expect, test } from "vitest";
import { decodeXPaymentHeader } from "../../convex/demoAgents/cdpAuth";

// This is a small regression test for the demo agent facilitator helper:
// - Some clients use base64url instead of base64 for X-PAYMENT
// - Some clients wrap an envelope { paymentPayload, paymentRequirements }
//
// We only validate decoding/normalization behavior; no network calls.

function b64urlEncodeJson(obj: unknown): string {
  const json = JSON.stringify(obj);
  // base64url without padding
  return Buffer.from(json, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

describe("X-PAYMENT header decoding normalization", () => {
  test("base64url + envelope: { paymentPayload, paymentRequirements } unwraps to paymentPayload", async () => {
    const payload = { x402Version: 1, scheme: "exact", network: "base", payload: { signature: "sig" } };
    const header = b64urlEncodeJson({ paymentPayload: payload, paymentRequirements: { scheme: "exact" } });

    const decoded = decodeXPaymentHeader(header) as any;
    expect(decoded).toBeTruthy();
    expect(decoded.x402Version).toBe(1);
    expect(decoded.scheme).toBe("exact");
    expect(decoded.network).toBe("base");
  });
});

