import { describe, expect, it } from "vitest";
import { shouldFallbackSolanaUsdcTransfer } from "../../convex/lib/coinbase";

describe("coinbase solana usdc fallback detection", () => {
  it("matches AccountNotFound without space", () => {
    expect(shouldFallbackSolanaUsdcTransfer("transaction simulation failed with error type: AccountNotFound")).toBe(true);
  });

  it("matches 'account not found' with space", () => {
    expect(shouldFallbackSolanaUsdcTransfer("Account not found")).toBe(true);
  });

  it("matches Solana error code variant", () => {
    expect(shouldFallbackSolanaUsdcTransfer("Solana error #3230000: something")).toBe(true);
  });

  it("does not match unrelated errors", () => {
    expect(shouldFallbackSolanaUsdcTransfer("insufficient funds")).toBe(false);
  });
});

