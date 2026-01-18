/**
 * Hardcoded exception for demo-only self-payments.
 *
 * Context:
 * - In production demo flows, the same wallet may act as both payer and merchant.
 * - Refund-to-source normally blocks this as SELF_PAYMENT (no-op / waste credits).
 * - For a single, known demo wallet we allow it to proceed for UX/testing convenience.
 *
 * IMPORTANT:
 * - Keep this extremely narrow. This is effectively an allowlisted behavior change.
 */

const DEMO_SELF_PAYMENT_SOLANA_ADDRESS = "FiZy3ch8QSDVWhJfZJYA75ZvDQgu4FJY4NfesZhbda4N";
const DEMO_MERCHANT_ORIGIN = "https://api.x402refunds.com";

export function allowSelfPaymentRefundToProceed(args: {
  sourceChain: "base" | "solana";
  payerAddress: string;
  recipientAddress: string;
  merchantOrigin?: string;
  sellerEndpointUrl?: string;
}): boolean {
  if (args.sourceChain !== "solana") return false;
  if (!args.payerAddress || !args.recipientAddress) return false;
  if (args.payerAddress !== args.recipientAddress) return false;

  // Hardcoded single-wallet allowlist.
  if (args.recipientAddress !== DEMO_SELF_PAYMENT_SOLANA_ADDRESS) return false;

  // Only allow for our demo-agent ecosystem.
  if (args.merchantOrigin !== DEMO_MERCHANT_ORIGIN) return false;
  if (typeof args.sellerEndpointUrl !== "string" || !args.sellerEndpointUrl.includes("/demo-agents/")) return false;

  return true;
}

