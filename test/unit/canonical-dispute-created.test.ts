import { describe, it, expect } from "vitest";
import { fileCanonicalDispute } from "../../convex/lib/canonicalDispute";

describe("canonical dispute (unit): created", () => {
  it("returns ok=true with created=true/duplicate=false when receivePaymentDispute succeeds", async () => {
    const newCaseId = "k_new_case";
    const ctx: any = {
      runQuery: async () => null,
      runAction: async () => ({ caseId: newCaseId, status: "received", fee: 0 }),
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
      expect(res.caseId).toBe(newCaseId);
      expect(res.created).toBe(true);
      expect(res.duplicate).toBe(false);
    }
  });
});

