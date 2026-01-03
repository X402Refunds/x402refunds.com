import { describe, it, expect } from "vitest";
import { API_BASE_URL } from "./fixtures";

/**
 * E2E: Wallet-first v1 API
 *
 * These tests MUST hit a deployed HTTP API (convex.site or api.x402disputes.com),
 * and are intended to catch "route not deployed" failures (404).
 */

function isDeployedHttpBase(url: string) {
  return url.includes(".convex.site") || url.includes("x402disputes.com");
}

describe("E2E: wallet-first /v1/* endpoints", () => {
  const RUN_E2E = process.env.RUN_E2E_WALLET_FIRST === "true";
  if (!RUN_E2E) {
    it.skip("set RUN_E2E_WALLET_FIRST=true to run wallet-first E2E against a deployed API", () => {});
    return;
  }

  it("POST /v1/disputes should exist (not 404) and validate missing merchant", async () => {
    if (!isDeployedHttpBase(API_BASE_URL)) return;

    const res = await fetch(`${API_BASE_URL}/v1/disputes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buyer: "buyer:e2e",
        // missing merchant
      }),
    });

    expect(res.status).not.toBe(404);
    expect(res.status).toBe(400);
    const body = await res.json().catch(() => ({}));
    expect(body.ok).toBe(false);
  });

  it("E2E: buyer can file dispute → merchant can list → buyer can fetch by id", async () => {
    if (!isDeployedHttpBase(API_BASE_URL)) return;

    const merchant = "eip155:8453:0x0000000000000000000000000000000000000001";

    const create = await fetch(`${API_BASE_URL}/v1/disputes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buyer: "buyer:e2e",
        merchant,
        reason: "api_timeout",
        amountMicrousdc: "10000",
        chain: "base",
        txHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      }),
    });

    expect(create.status).not.toBe(404);
    expect(create.status).toBe(200);
    const created = await create.json();
    expect(created.ok).toBe(true);
    expect(typeof created.disputeId).toBe("string");

    const list = await fetch(`${API_BASE_URL}/v1/disputes?merchant=${encodeURIComponent(merchant)}&limit=50`, {
      method: "GET",
    });
    expect(list.status).not.toBe(404);
    expect(list.status).toBe(200);
    const listed = await list.json();
    expect(listed.ok).toBe(true);
    expect(Array.isArray(listed.disputes)).toBe(true);
    expect(listed.disputes.some((d: any) => d?._id === created.disputeId)).toBe(true);

    const getById = await fetch(`${API_BASE_URL}/v1/dispute?id=${encodeURIComponent(created.disputeId)}`, {
      method: "GET",
    });
    expect(getById.status).not.toBe(404);
    expect(getById.status).toBe(200);
    const got = await getById.json();
    expect(got.ok).toBe(true);
    expect(got.dispute?._id).toBe(created.disputeId);
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

