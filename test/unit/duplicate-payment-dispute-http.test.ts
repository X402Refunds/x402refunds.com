import { describe, it, expect } from "vitest";
import { parseDuplicatePaymentDisputeError } from "../../convex/lib/duplicateDispute";

describe("parseDuplicatePaymentDisputeError", () => {
  it("parses raw marker JSON", () => {
    const msg = 'DUPLICATE_PAYMENT_DISPUTE:{"existingCaseId":"abc","status":"IN_REVIEW"}';
    expect(parseDuplicatePaymentDisputeError(msg)).toMatchObject({
      existingCaseId: "abc",
      status: "IN_REVIEW",
    });
  });

  it("parses marker when wrapped in Uncaught Error + stack", () => {
    const msg =
      'Uncaught Error: DUPLICATE_PAYMENT_DISPUTE:{"existingCaseId":"abc","status":"IN_REVIEW","finalVerdict":"CONSUMER_WINS"}\n' +
      "    at handler (../convex/paymentDisputes.ts:137:8)\n";
    expect(parseDuplicatePaymentDisputeError(msg)).toMatchObject({
      existingCaseId: "abc",
      status: "IN_REVIEW",
      finalVerdict: "CONSUMER_WINS",
    });
  });

  it("returns null when marker not present", () => {
    expect(parseDuplicatePaymentDisputeError("some other error")).toBeNull();
  });
});

