import { describe, it, expect } from "vitest";
import { API_BASE_URL } from "./fixtures";

/**
 * E2E: Wallet-first v1 API
 *
 * These tests MUST hit a deployed HTTP API (convex.site or api.x402refunds.com),
 * and are intended to catch "route not deployed" failures (404).
 */

function isDeployedHttpBase(url: string) {
  return url.includes(".convex.site") || url.includes("x402refunds.com");
}

describe("E2E: wallet-first /v1/* endpoints", () => {
  const RUN_E2E = process.env.RUN_E2E_WALLET_FIRST === "true";
  if (!RUN_E2E) {
    it.skip("set RUN_E2E_WALLET_FIRST=true to run wallet-first E2E against a deployed API", () => {});
    return;
  }

  it("POST /v1/refunds should exist (not 404) and validate missing fields", async () => {
    if (!isDeployedHttpBase(API_BASE_URL)) return;

    const res = await fetch(`${API_BASE_URL}/v1/refunds`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // empty
      }),
    });

    expect(res.status).not.toBe(404);
    expect(res.status).toBe(400);
    const body = await res.json().catch(() => ({}));
    expect(body.ok).toBe(false);
  });

  it("POST /v1/refunds should not 404 for a well-formed request (may fail on chain verification)", async () => {
    if (!isDeployedHttpBase(API_BASE_URL)) return;

    const create = await fetch(`${API_BASE_URL}/v1/refunds`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blockchain: "base",
        transactionHash: "0x" + "00".repeat(32),
        sellerEndpointUrl: "https://merchant.example/v1/paid",
        description: "api_timeout",
      }),
    });

    expect(create.status).not.toBe(404);
    expect([200, 400, 500]).toContain(create.status);
    const created = await create.json().catch(() => ({}));
    expect(typeof created.ok).toBe("boolean");
  });

  it("POST /v1/topup should exist (not 404) and validate missing merchant", async () => {
    if (!isDeployedHttpBase(API_BASE_URL)) return;

    const res = await fetch(`${API_BASE_URL}/v1/topup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountMicrousdc: "10000",
        currency: "USDC",
      }),
    });

    expect(res.status).not.toBe(404);
    expect(res.status).toBe(400);
  });

  it("POST /v1/topup discovery: either returns 402 (if deposit configured) or 500 NOT_CONFIGURED", async () => {
    if (!isDeployedHttpBase(API_BASE_URL)) return;

    const res = await fetch(`${API_BASE_URL}/v1/topup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant: "eip155:8453:0x0000000000000000000000000000000000000001",
        amountMicrousdc: "10000",
        currency: "USDC",
      }),
    });

    expect(res.status).not.toBe(404);

    if (res.status === 402) {
      const pr = res.headers.get("PAYMENT-REQUIRED");
      expect(typeof pr === "string" && pr.length > 0).toBe(true);
      const body = await res.json().catch(() => ({}));
      expect(body.x402Version).toBe(1);
      expect(Array.isArray(body.accepts)).toBe(true);
      return;
    }

    // Not configured (missing deposit address) returns 500 with NOT_CONFIGURED.
    expect(res.status).toBe(500);
    const body = await res.json().catch(() => ({}));
    expect(body.ok).toBe(false);
    expect(body.code).toBe("NOT_CONFIGURED");
  });

  // Arbiter resolution is internal-only (no public HTTP endpoint).
});

