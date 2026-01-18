import { describe, it, expect } from "vitest";
import { extractSolanaUsdcTransfersFromGetTransactionResult } from "../../convex/lib/blockchain";

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

describe("solana USDC owner parsing (unit)", () => {
  it("maps token accounts to owner wallets when meta owners are present", () => {
    const sourceTokenAccount = "SourceTokenAcct11111111111111111111111111111111";
    const destTokenAccount = "DestTokenAcct22222222222222222222222222222222";
    const sourceOwner = "SourceOwnerWalletAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    const destOwner = "DestOwnerWalletBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";

    const txResult = {
      transaction: {
        message: {
          accountKeys: [sourceTokenAccount, destTokenAccount],
          instructions: [
            {
              parsed: {
                type: "transferChecked",
                info: {
                  source: sourceTokenAccount,
                  destination: destTokenAccount,
                  mint: USDC_MINT,
                  tokenAmount: { amount: "250000", decimals: 6 },
                },
              },
            },
          ],
        },
      },
      meta: {
        preTokenBalances: [
          { accountIndex: 0, mint: USDC_MINT, owner: sourceOwner },
          { accountIndex: 1, mint: USDC_MINT, owner: destOwner },
        ],
        postTokenBalances: [],
      },
    };

    const res = extractSolanaUsdcTransfersFromGetTransactionResult({ txResult, usdcMint: USDC_MINT });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.transfers).toHaveLength(1);
    const t = res.transfers[0]!;
    expect(t.amountMicrousdc).toBe(250000);
    expect(t.payerTokenAccount).toBe(sourceTokenAccount);
    expect(t.recipientTokenAccount).toBe(destTokenAccount);
    expect(t.payerAddress).toBe(sourceOwner);
    expect(t.recipientAddress).toBe(destOwner);
  });

  it("infers USDC transfers when mint is missing (transfer) using token-balance metadata", () => {
    const sourceTokenAccount = "SourceTokenAcct33333333333333333333333333333333";
    const destTokenAccount = "DestTokenAcct44444444444444444444444444444444";
    const sourceOwner = "SourceOwnerWalletCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";
    const destOwner = "DestOwnerWalletDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD";

    const txResult = {
      transaction: {
        message: {
          accountKeys: [sourceTokenAccount, destTokenAccount],
          instructions: [
            {
              parsed: {
                type: "transfer",
                info: {
                  source: sourceTokenAccount,
                  destination: destTokenAccount,
                  amount: "10000",
                  // no mint field (common for SPL transfer)
                },
              },
            },
          ],
        },
      },
      meta: {
        preTokenBalances: [
          { accountIndex: 0, mint: USDC_MINT, owner: sourceOwner },
          { accountIndex: 1, mint: USDC_MINT, owner: destOwner },
        ],
        postTokenBalances: [],
      },
    };

    const res = extractSolanaUsdcTransfersFromGetTransactionResult({ txResult, usdcMint: USDC_MINT });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.transfers).toHaveLength(1);
    const t = res.transfers[0]!;
    expect(t.amountMicrousdc).toBe(10000);
    expect(t.payerAddress).toBe(sourceOwner);
    expect(t.recipientAddress).toBe(destOwner);
  });

  it("falls back to token account addresses when owner is unavailable", () => {
    const sourceTokenAccount = "SourceTokenAcct55555555555555555555555555555555";
    const destTokenAccount = "DestTokenAcct66666666666666666666666666666666";

    const txResult = {
      transaction: {
        message: {
          accountKeys: [sourceTokenAccount, destTokenAccount],
          instructions: [
            {
              parsed: {
                type: "transferChecked",
                info: {
                  source: sourceTokenAccount,
                  destination: destTokenAccount,
                  mint: USDC_MINT,
                  tokenAmount: { amount: "500000", decimals: 6 },
                },
              },
            },
          ],
        },
      },
      meta: {
        preTokenBalances: [],
        postTokenBalances: [],
      },
    };

    const res = extractSolanaUsdcTransfersFromGetTransactionResult({ txResult, usdcMint: USDC_MINT });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const t = res.transfers[0]!;
    expect(t.payerAddress).toBe(sourceTokenAccount);
    expect(t.recipientAddress).toBe(destTokenAccount);
  });
});

