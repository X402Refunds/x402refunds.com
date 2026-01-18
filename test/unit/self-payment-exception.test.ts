import { describe, expect, it } from "vitest";
import { allowSelfPaymentRefundToProceed } from "../../convex/lib/selfPaymentException";

describe("self payment exception (demo-only)", () => {
  it("allows the hardcoded Solana demo wallet for demo-agents origin", () => {
    expect(
      allowSelfPaymentRefundToProceed({
        sourceChain: "solana",
        payerAddress: "FiZy3ch8QSDVWhJfZJYA75ZvDQgu4FJY4NfesZhbda4N",
        recipientAddress: "FiZy3ch8QSDVWhJfZJYA75ZvDQgu4FJY4NfesZhbda4N",
        merchantOrigin: "https://api.x402refunds.com",
        sellerEndpointUrl: "https://api.x402refunds.com/demo-agents/image-generator",
      }),
    ).toBe(true);
  });

  it("does not allow other wallets", () => {
    expect(
      allowSelfPaymentRefundToProceed({
        sourceChain: "solana",
        payerAddress: "OtherWallet1111111111111111111111111111111111",
        recipientAddress: "OtherWallet1111111111111111111111111111111111",
        merchantOrigin: "https://api.x402refunds.com",
        sellerEndpointUrl: "https://api.x402refunds.com/demo-agents/image-generator",
      }),
    ).toBe(false);
  });

  it("does not allow if not demo-agents origin", () => {
    expect(
      allowSelfPaymentRefundToProceed({
        sourceChain: "solana",
        payerAddress: "FiZy3ch8QSDVWhJfZJYA75ZvDQgu4FJY4NfesZhbda4N",
        recipientAddress: "FiZy3ch8QSDVWhJfZJYA75ZvDQgu4FJY4NfesZhbda4N",
        merchantOrigin: "https://evil.example",
        sellerEndpointUrl: "https://api.x402refunds.com/demo-agents/image-generator",
      }),
    ).toBe(false);
  });

  it("does not allow Base chain", () => {
    expect(
      allowSelfPaymentRefundToProceed({
        sourceChain: "base",
        payerAddress: "0xabc",
        recipientAddress: "0xabc",
        merchantOrigin: "https://api.x402refunds.com",
        sellerEndpointUrl: "https://api.x402refunds.com/demo-agents/image-generator",
      }),
    ).toBe(false);
  });
});

