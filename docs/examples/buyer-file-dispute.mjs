/**
 * Buyer (human or agent): submit a refund request (no API keys).
 *
 * Usage:
 *   node docs/examples/buyer-file-dispute.mjs
 */

const API_BASE = process.env.X402REFUNDS_API_BASE || "https://api.x402refunds.com";

const transactionHash =
  process.env.TRANSACTION_HASH ||
  process.env.TX_HASH ||
  "0x" + "00".repeat(32);
const sellerEndpointUrl =
  process.env.SELLER_ENDPOINT_URL ||
  "https://merchant.example/v1/paid-endpoint";

const payload = {
  blockchain: "base",
  transactionHash,
  sellerEndpointUrl,
  description: "Payment succeeded, then the API request timed out.",
  evidenceUrls: ["https://example.com/logs/timeout.json"],
};

const res = await fetch(`${API_BASE}/v1/refunds`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

const data = await res.json().catch(() => ({}));
if (!res.ok || !data.ok) {
  throw new Error(`Failed: ${res.status} ${JSON.stringify(data)}`);
}

console.log("ok", data);

