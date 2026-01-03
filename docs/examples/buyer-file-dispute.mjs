/**
 * Buyer: file a dispute (no API keys).
 *
 * Usage:
 *   node docs/examples/buyer-file-dispute.mjs
 */

const API_BASE = process.env.X402DISPUTES_API_BASE || "https://api.x402disputes.com";

const merchant = process.env.MERCHANT || "eip155:8453:0x0000000000000000000000000000000000000001";
const buyer = process.env.BUYER || "buyer:anonymous";
const txHash = process.env.TX_HASH || "0x0000000000000000000000000000000000000000000000000000000000000000";

const payload = {
  buyer,
  merchant,
  txHash,
  chain: "base",
  amountMicrousdc: "10000",
  reason: "service_not_rendered",
  evidenceUrlOrHash: "https://example.com/logs/timeout.json",
};

const res = await fetch(`${API_BASE}/v1/disputes`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

const data = await res.json().catch(() => ({}));
if (!res.ok || !data.ok) {
  throw new Error(`Failed: ${res.status} ${JSON.stringify(data)}`);
}

console.log("ok", data);

