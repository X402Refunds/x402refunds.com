import { describe, it, expect } from "vitest";
import { buildMerchantRefundExecutedEmailCopy } from "../../convex/lib/merchantRefundEmailCopy";

describe("merchant refund executed email copy (unit)", () => {
  it("uses explorerUrl when present", () => {
    const text = buildMerchantRefundExecutedEmailCopy({
      caseId: "jd780r2cdjf90h1tg4qenqyzyn7ysb0r",
      amountMicrousdc: 123_456,
      explorerUrl: "https://basescan.org/tx/0xabc",
      refundTxHash: "0x" + "11".repeat(32),
    });

    expect(text).toContain("Refund processed");
    expect(text).toContain("Track refund on Basescan:");
    expect(text).toContain("https://basescan.org/tx/0xabc");
  });

  it("falls back to basescan from refundTxHash", () => {
    const tx = "0x" + "22".repeat(32);
    const text = buildMerchantRefundExecutedEmailCopy({
      caseId: "jd780r2cdjf90h1tg4qenqyzyn7ysb0r",
      amountMicrousdc: 1_000_000,
      explorerUrl: null,
      refundTxHash: tx,
    });

    expect(text).toContain("basescan.org/tx/");
    expect(text).toContain(`https://basescan.org/tx/${tx}`);
  });
});

