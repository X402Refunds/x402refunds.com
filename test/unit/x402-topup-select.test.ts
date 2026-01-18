import { describe, expect, it } from "vitest";
import { inferX402VersionFromPaymentHeader, selectTopupPaymentRequirements } from "../../convex/lib/x402TopupSelect";

function b64(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj), "utf8").toString("base64");
}

describe("x402 topup requirement selection", () => {
  it("infers v2 from x402Version", () => {
    const header = b64({ x402Version: 2, accepted: {} });
    expect(inferX402VersionFromPaymentHeader(header)).toBe(2);
  });

  it("infers v2 from accepted envelope when version missing", () => {
    const header = b64({ accepted: { network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp" }, payload: {} });
    expect(inferX402VersionFromPaymentHeader(header)).toBe(2);
  });

  it("selects v2 requirement when PAYMENT-SIGNATURE is present", () => {
    const res = selectTopupPaymentRequirements({
      paymentSigHeader: "sig",
      xPaymentHeader: null,
      paymentHeaderFromBody: "",
      paymentRequiredV1: { accepts: [{ marker: "v1" }] },
      paymentRequiredV2: { accepts: [{ marker: "v2" }] },
    });
    expect(res.version).toBe(2);
    expect(res.requirement.marker).toBe("v2");
  });

  it("selects v2 requirement when body paymentHeader is v2", () => {
    const header = b64({ x402Version: 2, accepted: { network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp" } });
    const res = selectTopupPaymentRequirements({
      paymentSigHeader: null,
      xPaymentHeader: null,
      paymentHeaderFromBody: header,
      paymentRequiredV1: { accepts: [{ marker: "v1" }] },
      paymentRequiredV2: { accepts: [{ marker: "v2" }] },
    });
    expect(res.version).toBe(2);
    expect(res.requirement.marker).toBe("v2");
  });

  it("defaults to v1 when paymentHeader is invalid", () => {
    const res = selectTopupPaymentRequirements({
      paymentSigHeader: null,
      xPaymentHeader: null,
      paymentHeaderFromBody: "not-base64",
      paymentRequiredV1: { accepts: [{ marker: "v1" }] },
      paymentRequiredV2: { accepts: [{ marker: "v2" }] },
    });
    expect(res.version).toBe(1);
    expect(res.requirement.marker).toBe("v1");
  });
});

