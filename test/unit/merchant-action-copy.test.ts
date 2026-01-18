import { describe, it, expect } from "vitest";
import { buildMerchantActionCopy } from "../../convex/lib/merchantActionCopy";

describe("merchant action copy (unit)", () => {
  it("refund flow: no Decision, no case tracking link, includes Basescan label + link", () => {
    const text = buildMerchantActionCopy({
      isReject: false,
      caseId: "jd780r2cdjf90h1tg4qenqyzyn7ysb0r",
      refundScheduled: true,
      refundStatus: "PROCESSING",
      refundTxHash: "0x" + "11".repeat(32),
    });

    expect(text).not.toContain("Decision:");
    expect(text).not.toContain("x402refunds.com/cases/");
    expect(text).toContain("Track refund on blockchain:");
    expect(text).toContain("basescan.org/tx/");
    expect(text).not.toContain("Note: on-chain confirmations can take a minute.");
  });

  it("reject flow: includes Case ID, no tracking links", () => {
    const text = buildMerchantActionCopy({
      isReject: true,
      caseId: "jd780r2cdjf90h1tg4qenqyzyn7ysb0r",
      refundScheduled: false,
    });

    expect(text).toContain("All set — dispute rejected.");
    expect(text).toContain("Case:");
    expect(text).not.toContain("Track refund on Basescan:");
    expect(text).not.toContain("basescan.org/tx/");
    expect(text).not.toContain("x402refunds.com/cases/");
  });

  it("refund flow: no tx yet uses proactive Basescan wording", () => {
    const text = buildMerchantActionCopy({
      isReject: false,
      caseId: "jd780r2cdjf90h1tg4qenqyzyn7ysb0r",
      refundScheduled: true,
      refundStatus: "PROCESSING",
      refundTxHash: null,
      explorerUrl: null,
    });

    expect(text).toContain("Track refund on blockchain (link will appear once the transaction is submitted).");
  });

  it("uses Solscan wording for Solana tx hashes", () => {
    const sig = "4Fo4zkrtA15RqoWhhU8tymdwRKExn6bBgCUFarmvsHb9ZXvDYypMB21ob58Ct5mo3z5gNGGmEJdeck4zTc6NWyGE";
    const text = buildMerchantActionCopy({
      isReject: false,
      caseId: "jd_sol",
      refundScheduled: true,
      refundStatus: "PROCESSING",
      refundTxHash: sig,
    });
    expect(text).toContain("Track refund on blockchain:");
    expect(text).toContain(`https://solscan.io/tx/${sig}`);
  });
});

