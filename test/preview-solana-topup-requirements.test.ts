import { describe, expect, it } from "vitest";

const API_BASE_URL = process.env.API_BASE_URL || "https://youthful-orca-358.convex.site";

// Only run this as a "preview/dev integration" check (not production),
// since it depends on the currently deployed preview backend + facilitator configuration.
const IS_PRODUCTION = API_BASE_URL.includes("x402refunds.com") || API_BASE_URL.includes("perceptive-lyrebird-89");
const RUN_SMOKE_TOPUP_TEST = process.env.RUN_SMOKE_TOPUP_TEST === "true";

describe("Preview integration: Solana topup 402 requirements", () => {
  it.skipIf(IS_PRODUCTION || !RUN_SMOKE_TOPUP_TEST)(
    "POST /v1/topup (solana) returns a usable 402 requirement",
    async () => {
    const res = await fetch(`${API_BASE_URL}/v1/topup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        merchant: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:FiZy3ch8QSDVWhJfZJYA75ZvDQgu4FJY4NfesZhbda4N",
        blockchain: "solana",
        currency: "USDC",
        amountMicrousdc: 10_000,
      }),
      signal: AbortSignal.timeout(8000),
    });

    expect(res.status).toBe(402);
    const data: any = await res.json();
    expect(data.x402Version).toBe(1);
    expect(Array.isArray(data.accepts)).toBe(true);
    expect(data.accepts.length).toBeGreaterThan(0);

    const req = data.accepts[0];
    expect(req.network).toBe("solana");
    expect(req.asset).toBe("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
    expect(typeof req.payTo).toBe("string");
    expect(req.payTo.length).toBeGreaterThan(20);
    expect(typeof req.extra?.feePayer).toBe("string");
    expect(req.extra.feePayer.length).toBeGreaterThan(20);

    // v2 requirements are provided via the PAYMENT-REQUIRED header (base64 JSON).
    const pr = res.headers.get("payment-required") || res.headers.get("PAYMENT-REQUIRED") || "";
    expect(typeof pr).toBe("string");
    expect(pr.length).toBeGreaterThan(10);
    const decoded = JSON.parse(Buffer.from(pr, "base64").toString("utf8"));
    expect(decoded.x402Version).toBe(2);
    expect(Array.isArray(decoded.accepts)).toBe(true);
    const sol = decoded.accepts.find((x: any) => String(x?.network || "").toLowerCase().includes("solana"));
    expect(sol).toBeTruthy();
    expect(String(sol.network)).toBe("solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp");
    expect(typeof sol.amount).toBe("string");
    expect(sol.asset).toBe("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
    expect(typeof sol.extra?.feePayer).toBe("string");
  });
});

