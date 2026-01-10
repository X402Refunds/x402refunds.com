/**
 * Topup (x402 v1/v2):
 * - First call returns 402 with PAYMENT-REQUIRED (v2 header) and body accepts[] (v1).
 * - Second call can be:
 *   - v2: PAYMENT-SIGNATURE (requires you to sign + settle via facilitator)
 *   - v1: X-PAYMENT (requires you to sign + settle via facilitator)
 *   - tx hash forwarding: X-402-Transaction-Hash (verify on-chain only)
 *
 * This example demonstrates the discovery step only.
 *
 * Usage:
 *   MERCHANT=eip155:8453:0x... AMOUNT_MICROUSDC=10000 node docs/examples/topup-flow.mjs
 */

const API_BASE = process.env.X402DISPUTES_API_BASE || "https://api.x402refunds.com";
const merchant = process.env.MERCHANT || "eip155:8453:0x0000000000000000000000000000000000000001";
const amountMicrousdc = process.env.AMOUNT_MICROUSDC || "10000";

const res = await fetch(`${API_BASE}/v1/topup`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ merchant, amountMicrousdc, currency: "USDC" }),
});

const body = await res.json().catch(() => ({}));
const paymentRequired = res.headers.get("PAYMENT-REQUIRED");

console.log("status", res.status);
console.log("PAYMENT-REQUIRED header present?", Boolean(paymentRequired));
if (paymentRequired) console.log("PAYMENT-REQUIRED", paymentRequired.substring(0, 80) + "…");
console.log("body", body);

