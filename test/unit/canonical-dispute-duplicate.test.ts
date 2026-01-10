import { describe, it, expect } from "vitest";
import { fileCanonicalDispute } from "../../convex/lib/canonicalDispute";

describe("canonical dispute (unit): duplicates", () => {
  it("returns ok=true with existing caseId when receivePaymentDispute throws DUPLICATE_PAYMENT_DISPUTE", async () => {
    const existingCaseId = "k123";
    const ctx: any = {
      runQuery: async () => null,
      runAction: async () => {
        throw new Error(
          `DUPLICATE_PAYMENT_DISPUTE:${JSON.stringify({
            existingCaseId,
            status: "received",
          })}`,
        );
      },
    };

    const res = await fileCanonicalDispute(ctx, {
      merchant: `eip155:8453:${("0x" + "2".repeat(40)) as any}`,
      merchantApiUrl: "https://api.example.com/v1/image",
      txHash: "0x" + "1".repeat(64),
      description: "Paid, but the result was unsatisfactory.",
      evidenceUrls: [],
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.caseId).toBe(existingCaseId);
      expect(res.trackingUrl).toBe(`https://x402refunds.com/cases/${existingCaseId}`);
      expect(res.status).toBe("received");
      expect(res.created).toBe(false);
      expect(res.duplicate).toBe(true);
    }
  });
});

