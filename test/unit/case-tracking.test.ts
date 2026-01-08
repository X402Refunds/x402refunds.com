import { describe, it, expect } from "vitest";
import {
  getRefundExplorerUrl,
  getPaymentExplorerUrl,
  getPublicCaseBadge,
  getPublicCaseHeadline,
} from "../../dashboard/src/lib/caseTracking";

describe("case tracking helpers (unit)", () => {
  it("refund explorer url prefers explorerUrl", () => {
    expect(
      getRefundExplorerUrl({ status: "EXECUTED", explorerUrl: "https://basescan.org/tx/0xabc", refundTxHash: null as any }),
    ).toBe("https://basescan.org/tx/0xabc");
  });

  it("refund explorer url falls back to refundTxHash", () => {
    const tx = "0x" + "11".repeat(32);
    expect(getRefundExplorerUrl({ status: "EXECUTED", refundTxHash: tx } as any)).toBe(`https://basescan.org/tx/${tx}`);
  });

  it("refund explorer url returns null when missing", () => {
    expect(getRefundExplorerUrl(null)).toBe(null);
    expect(getRefundExplorerUrl({ status: "PENDING_SEND" } as any)).toBe(null);
  });

  it("payment explorer url returns basescan for base tx hash", () => {
    const tx = "0x" + "22".repeat(32);
    expect(getPaymentExplorerUrl({ paymentDetails: { blockchain: "base", transactionHash: tx } } as any)).toBe(
      `https://basescan.org/tx/${tx}`,
    );
  });

  it("badge/headline: decided + consumer wins + executed => refunded", () => {
    const caseDetails: any = { status: "DECIDED", finalVerdict: "CONSUMER_WINS" };
    const refund: any = { status: "EXECUTED", refundTxHash: "0x" + "33".repeat(32) };
    expect(getPublicCaseBadge(caseDetails, refund)).toBe("Refunded");
    expect(getPublicCaseHeadline(caseDetails, refund)).toContain("sent on-chain");
  });

  it("badge/headline: decided + consumer wins + pending => refunding", () => {
    const caseDetails: any = { status: "DECIDED", finalVerdict: "CONSUMER_WINS" };
    const refund: any = { status: "PENDING_SEND" };
    expect(getPublicCaseBadge(caseDetails, refund)).toBe("Refunding");
    expect(getPublicCaseHeadline(caseDetails, refund)).toContain("processing");
  });

  it("badge/headline: decided + merchant wins => decided/rejected", () => {
    const caseDetails: any = { status: "DECIDED", finalVerdict: "MERCHANT_WINS" };
    expect(getPublicCaseBadge(caseDetails, null)).toBe("Decided");
    expect(getPublicCaseHeadline(caseDetails, null)).toContain("rejected");
  });
});

