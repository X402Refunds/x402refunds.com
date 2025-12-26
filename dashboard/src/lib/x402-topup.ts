/**
 * X-402 top-up payment requirement builder (Base USDC, gasless signature flow).
 *
 * Mirrors the demo agent's v1 402 response shape so we can reuse:
 * - parsePaymentRequirements(...)
 * - createX402PaymentSignature(...)
 */

export const USDC_BASE_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

export type X402PaymentRequirement = {
  scheme: "exact";
  network: "base";
  maxAmountRequired: string; // raw units (microusdc)
  asset: string; // USDC contract address
  payTo: string; // recipient address
  resource: string;
  description: string;
  mimeType: "application/json";
  maxTimeoutSeconds: number;
  extra: {
    name: "USD Coin";
    version: "2";
  };
};

export function buildTopupPaymentRequirement(args: {
  amountMicrousdc: number;
  payTo: string;
  resourceUrl: string;
}): X402PaymentRequirement {
  return {
    scheme: "exact",
    network: "base",
    maxAmountRequired: String(args.amountMicrousdc),
    asset: USDC_BASE_MAINNET,
    payTo: args.payTo,
    resource: args.resourceUrl,
    description: "x402Disputes billing top-up (Base USDC)",
    mimeType: "application/json",
    maxTimeoutSeconds: 60,
    extra: {
      name: "USD Coin",
      version: "2",
    },
  };
}

export function build402ResponseBody(args: { requirement: X402PaymentRequirement }) {
  return {
    x402Version: 1,
    error: "Payment required (Base USDC, gasless signature)",
    accepts: [args.requirement],
  };
}


