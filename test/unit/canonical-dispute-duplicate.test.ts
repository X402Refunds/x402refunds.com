import { describe, it, expect } from "vitest";
import { fileCanonicalDispute } from "../../convex/lib/canonicalDispute";

describe("canonical dispute (unit): duplicates", () => {
  it("returns ok=true with existing caseId when a case already exists for (chain, txHash)", async () => {
    const existingCaseId = "k123";
    const ctx: any = {
      runQuery: async () => ({ _id: existingCaseId, status: "FILED" }),
      runAction: async () => {
        throw new Error("should not verify on duplicate");
      },
      runMutation: async () => {
        throw new Error("should not create on duplicate");
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
      expect(res.status).toBe("FILED");
      expect(res.created).toBe(false);
      expect(res.duplicate).toBe(true);
    }
  });
});

