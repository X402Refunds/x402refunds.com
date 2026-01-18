import { describe, expect, it } from "vitest";
import { extractTxHashFromFacilitatorSettleBody, parseFacilitatorSettleFailure } from "../../convex/lib/x402Settlement";

describe("facilitator settle tx hash extraction", () => {
  it("extracts from { transaction }", () => {
    const tx = "0x" + "a".repeat(64);
    expect(extractTxHashFromFacilitatorSettleBody({ bodyText: JSON.stringify({ transaction: tx }) })).toBe(tx);
  });

  it("extracts from { transactionHash }", () => {
    const tx = "0x" + "b".repeat(64);
    expect(extractTxHashFromFacilitatorSettleBody({ bodyText: JSON.stringify({ transactionHash: tx }) })).toBe(tx);
  });

  it("extracts nested result.signature (Solana)", () => {
    const sig = "DEXVS3su4dZQWTvvPnLDJLRK1CeeKG6K3QqdzthgAkNV";
    expect(
      extractTxHashFromFacilitatorSettleBody({ bodyText: JSON.stringify({ result: { signature: sig } }) }),
    ).toBe(sig);
  });

  it("accepts a raw Solana signature string", () => {
    const sig = "FiZy3ch8QSDVWhJfZJYA75ZvDQgu4FJY4NfesZhbda4N";
    expect(extractTxHashFromFacilitatorSettleBody({ bodyText: sig })).toBe(sig);
  });

  it("extracts from base64(JSON({ success, transaction }))", () => {
    const tx = "0x" + "c".repeat(64);
    const b64 = Buffer.from(JSON.stringify({ success: true, transaction: tx }), "utf8").toString("base64");
    expect(extractTxHashFromFacilitatorSettleBody({ bodyText: b64 })).toBe(tx);
  });

  it("parses facilitator settle failure errorReason", () => {
    const body = JSON.stringify({ success: false, errorReason: "scheme_mismatch", transaction: "" });
    expect(parseFacilitatorSettleFailure(body)?.errorReason).toBe("scheme_mismatch");
  });
});

