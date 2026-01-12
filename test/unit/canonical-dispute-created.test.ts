import { describe, it, expect } from "vitest";
import { fileCanonicalDispute } from "../../convex/lib/canonicalDispute";

describe("canonical dispute (unit): created", () => {
  it("returns ok=true with created=true/duplicate=false when wallet-first filing succeeds", async () => {
    const newCaseId = "k_new_case";
    const ctx: any = {
      runQuery: async () => null,
      runAction: async () => ({
        ok: true,
        blockchain: "base",
        transactionHash: "0x" + "1".repeat(64),
        payerAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        recipientAddress: "0x" + "2".repeat(40),
        amountMicrousdc: 250000,
        amountUsdc: "0.25",
        logIndex: 0,
      }),
      runMutation: async () => ({ ok: true, disputeId: newCaseId }),
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

