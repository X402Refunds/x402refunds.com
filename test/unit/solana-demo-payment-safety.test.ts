import { describe, expect, it } from "vitest";
import { Keypair, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

import { createSolanaExactPaymentTransaction } from "../../dashboard/src/lib/x402-solana";
import { computeEndpointPayToMatch } from "../../convex/merchantNotifications";

describe("Solana demo payment safety", () => {
  it("creates a tx without ATA program instructions", async () => {
    const recentBlockhash = "11111111111111111111111111111111";
    const payer = Keypair.generate().publicKey;
    const feePayer = Keypair.generate().publicKey;
    const payTo = Keypair.generate().publicKey;
    const mint = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"); // USDC mint

    const tx = await createSolanaExactPaymentTransaction({
      recentBlockhash,
      payer,
      feePayer,
      payTo,
      mint,
      amountMicrousdc: 10_000n,
    });

    expect(tx.instructions.length).toBe(1);
    expect(tx.instructions[0]?.programId?.toBase58()).toBe(TOKEN_PROGRAM_ID.toBase58());

    // Ensure the associated-token-account program is not invoked (policy:program_not_allowed).
    const invokedPrograms = tx.instructions.map((ix) => ix.programId.toBase58());
    expect(invokedPrograms).not.toContain("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
  });

  it("computes endpointPayToMatch for EVM merchants case-insensitively", () => {
    const res = computeEndpointPayToMatch({
      expectedMerchant: "eip155:8453:0xAbCdEf0000000000000000000000000000000000",
      payToCandidates: ["0xabcdef0000000000000000000000000000000000"],
    });
    expect(res?.endpointPayToMatch).toBe(true);
    expect(res?.endpointPayToMismatch).toBe(false);
  });

  it("computes endpointPayToMatch for Solana merchants case-sensitively", () => {
    const expected = "FiZy3ch8QSDVWhJfZJYA75ZvDQgu4FJY4NfesZhbda4N";
    const res1 = computeEndpointPayToMatch({
      expectedMerchant: `solana:5eykt4GNfsw7SU33zdhhrELoMu3gFmT33EpFdpEfmgbf:${expected}`,
      payToCandidates: [expected],
    });
    expect(res1?.endpointPayToMatch).toBe(true);

    const res2 = computeEndpointPayToMatch({
      expectedMerchant: `solana:5eykt4GNfsw7SU33zdhhrELoMu3gFmT33EpFdpEfmgbf:${expected}`,
      payToCandidates: [expected.toLowerCase()],
    });
    expect(res2?.endpointPayToMatch).toBe(false);
    expect(res2?.endpointPayToMismatch).toBe(true);
  });
});

