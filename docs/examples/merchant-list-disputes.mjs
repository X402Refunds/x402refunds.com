/**
 * Merchant (public): list disputes for a merchant identity (no API keys).
 *
 * Usage:
 *   MERCHANT=eip155:8453:0x... node docs/examples/merchant-list-disputes.mjs
 */

const API_BASE = process.env.X402DISPUTES_API_BASE || "https://api.x402disputes.com";
const merchant = process.env.MERCHANT || "eip155:8453:0x0000000000000000000000000000000000000001";

const url = `${API_BASE}/v1/disputes?merchant=${encodeURIComponent(merchant)}&limit=50`;
const res = await fetch(url, { method: "GET" });
const data = await res.json().catch(() => ({}));

if (!res.ok || !data.ok) {
  throw new Error(`Failed: ${res.status} ${JSON.stringify(data)}`);
}

console.log(JSON.stringify(data, null, 2));

