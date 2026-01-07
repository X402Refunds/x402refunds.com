import { describe, it, expect, beforeAll } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";

describe("payment disputes (unit): defendantMetadata merchantOrigin", () => {
  let t: ReturnType<typeof convexTest>;

  beforeAll(async () => {
    const modules = import.meta.glob("../../convex/**/*.{ts,js}");
    t = convexTest(schema, modules);
  });

  it("receivePaymentDispute accepts defendantMetadata.merchantOrigin", async () => {
    const res = await t.action(api.paymentDisputes.receivePaymentDispute, {
      transactionHash: "0x" + "11".repeat(32),
      blockchain: "base",
      recipientAddress: "0x0000000000000000000000000000000000000001",
      description: "Testing schema: allow merchantOrigin in defendantMetadata",
      // Keep minimal but include the field that previously failed validation.
      defendantMetadata: {
        merchantOrigin: "https://merchant.example",
        responseJson: JSON.stringify({ status: 500, body: { error: "Internal Server Error" } }),
      },
      plaintiffMetadata: {
        requestJson: JSON.stringify({ method: "POST", url: "https://merchant.example/v1/chat" }),
      },
      evidenceUrls: [],
    });

    expect(res).toBeTruthy();
    expect(typeof res.caseId).toBe("string");
  });
});

