import { describe, expect, it } from "vitest";

const API_BASE_URL = process.env.API_BASE_URL || "https://youthful-orca-358.convex.site";

// Only run this as a "preview/dev integration" check (not production),
// since it depends on the currently deployed preview backend.
const IS_PRODUCTION = API_BASE_URL.includes("x402refunds.com") || API_BASE_URL.includes("perceptive-lyrebird-89");

describe("Preview integration: Solana blockhash endpoint", () => {
  it.skipIf(IS_PRODUCTION)("GET /demo-agents/solana/blockhash returns ok + blockhash", async () => {
    const res = await fetch(`${API_BASE_URL}/demo-agents/solana/blockhash`, {
      method: "GET",
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });

    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.ok).toBe(true);
    expect(typeof data.blockhash).toBe("string");
    expect(data.blockhash.length).toBeGreaterThan(10);
  });
});

