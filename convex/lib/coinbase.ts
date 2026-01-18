"use node";

/**
 * Coinbase (CDP Wallet API v2) integration wrapper.
 *
 * CRITICAL: This module must be safe to import without any CDP keys present.
 * - Do not read required env vars at module top-level.
 * - Gate all network calls behind COINBASE_REFUNDS_ENABLED === "true".
 *
 * This exposes send primitives for Base (EVM) and Solana USDC refunds.
 */

import { action } from "../_generated/server";
import { v } from "convex/values";

export type CoinbaseSendResult =
  | { ok: true; providerTransferId: string; txHash?: string; explorerUrl?: string }
  | { ok: false; code: string; message: string; details?: any };

const SOLANA_USDC_MINT_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

function isEnabled(): boolean {
  return process.env.COINBASE_REFUNDS_ENABLED === "true";
}

function normalizeEnvSecret(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  let s = value.trim();
  // Strip accidental surrounding quotes from copy/paste.
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }
  // Support pasting PEM keys with literal "\n" sequences.
  if (s.includes("\\n")) {
    s = s.replace(/\\n/g, "\n");
  }
  return s.trim();
}

function getRequiredEnv(): { ok: true; env: Record<string, string> } | { ok: false; code: string; message: string } {
  // CDP Server Wallet v2 env vars per Coinbase docs:
  // - CDP_API_KEY_ID
  // - CDP_API_KEY_SECRET
  // - CDP_WALLET_SECRET
  const apiKeyId = normalizeEnvSecret(process.env.CDP_API_KEY_ID);
  const apiKeySecret = normalizeEnvSecret(process.env.CDP_API_KEY_SECRET);
  const walletSecret = normalizeEnvSecret(process.env.CDP_WALLET_SECRET);

  // Platform account naming (preferred). If unset, we fall back to a stable default.
  // Back-compat: if CDP_PLATFORM_WALLET_ID exists from older config, treat it as an account name.
  const platformAccountName =
    process.env.CDP_PLATFORM_ACCOUNT_NAME ||
    process.env.CDP_PLATFORM_WALLET_ID ||
    "x402disputes-platform";

  if (!apiKeyId || !apiKeySecret || !walletSecret) {
    return {
      ok: false,
      code: "COINBASE_NOT_CONFIGURED",
      message:
        "CDP credentials are not configured (CDP_API_KEY_ID / CDP_API_KEY_SECRET / CDP_WALLET_SECRET)",
    };
  }

  return { ok: true, env: { apiKeyId, apiKeySecret, walletSecret, platformAccountName } };
}

export const getOrCreatePlatformEvmAccount = action({
  args: {},
  handler: async (): Promise<
    | { ok: true; name: string; address: string }
    | { ok: false; code: string; message: string }
  > => {
    if (!isEnabled()) {
      return {
        ok: false,
        code: "COINBASE_DISABLED",
        message:
          "Coinbase refunds are disabled (set COINBASE_REFUNDS_ENABLED=true in Convex env vars)",
      };
    }
    const envRes = getRequiredEnv();
    if (!envRes.ok) return envRes;

    try {
      // Defer SDK import until runtime so missing deps/env never break deploy.
      // eslint-disable-next-line @typescript-eslint/consistent-type-imports
      const { CdpClient } = await import("@coinbase/cdp-sdk");

      const cdp = new (CdpClient as any)({
        apiKeyId: envRes.env.apiKeyId,
        apiKeySecret: envRes.env.apiKeySecret,
        walletSecret: envRes.env.walletSecret,
      });

      const account = await cdp.evm.getOrCreateAccount({ name: envRes.env.platformAccountName });
      return { ok: true, name: envRes.env.platformAccountName, address: String(account.address) };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to get/create platform account";
      return { ok: false, code: "COINBASE_ACCOUNT_FAILED", message };
    }
  },
});

export const getOrCreatePlatformSolanaAccount = action({
  args: {},
  handler: async (): Promise<
    | { ok: true; name: string; address: string }
    | { ok: false; code: string; message: string }
  > => {
    if (!isEnabled()) {
      return {
        ok: false,
        code: "COINBASE_DISABLED",
        message:
          "Coinbase refunds are disabled (set COINBASE_REFUNDS_ENABLED=true in Convex env vars)",
      };
    }
    const envRes = getRequiredEnv();
    if (!envRes.ok) return envRes;

    try {
      // Defer SDK import until runtime so missing deps/env never break deploy.
      // eslint-disable-next-line @typescript-eslint/consistent-type-imports
      const { CdpClient } = await import("@coinbase/cdp-sdk");

      const cdp = new (CdpClient as any)({
        apiKeyId: envRes.env.apiKeyId,
        apiKeySecret: envRes.env.apiKeySecret,
        walletSecret: envRes.env.walletSecret,
      });

      const account = await cdp.solana.getOrCreateAccount({ name: envRes.env.platformAccountName });
      return { ok: true, name: envRes.env.platformAccountName, address: String(account.address) };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to get/create platform Solana account";
      return { ok: false, code: "COINBASE_ACCOUNT_FAILED", message };
    }
  },
});

/**
 * Send USDC on Base from the platform wallet to a destination address.
 *
 * This is feature-flagged; when disabled or unconfigured it returns ok:false rather than throwing,
 * so local development/deploy works without secrets.
 */
export const sendUsdcBase = action({
  args: {
    toAddress: v.string(),
    amountMicrousdc: v.number(), // integer microusdc
  },
  handler: async (_ctx, args): Promise<CoinbaseSendResult> => {
    if (!isEnabled()) {
      return {
        ok: false,
        code: "COINBASE_DISABLED",
        message:
          "Coinbase refunds are disabled (set COINBASE_REFUNDS_ENABLED=true in Convex env vars)",
      };
    }

    const envRes = getRequiredEnv();
    if (!envRes.ok) return envRes;

    try {
      // Defer SDK import until runtime so missing deps/env never break deploy.
      // eslint-disable-next-line @typescript-eslint/consistent-type-imports
      const { CdpClient } = await import("@coinbase/cdp-sdk");

      const cdp = new (CdpClient as any)({
        apiKeyId: envRes.env.apiKeyId,
        apiKeySecret: envRes.env.apiKeySecret,
        walletSecret: envRes.env.walletSecret,
      });

      // If the portal UI is broken, this still works: it will create (or reuse) an account by name.
      const sender = await cdp.evm.getOrCreateAccount({ name: envRes.env.platformAccountName });

      const amount = BigInt(args.amountMicrousdc);
      if (amount <= BigInt(0)) {
        return { ok: false, code: "INVALID_AMOUNT", message: "Amount must be > 0" };
      }

      const { transactionHash } = await sender.transfer({
        to: args.toAddress,
        amount,
        token: "usdc",
        network: "base",
      });

      const txHash = transactionHash ? String(transactionHash) : undefined;
      const explorerUrl = txHash ? `https://basescan.org/tx/${txHash}` : undefined;
      return {
        ok: true,
        providerTransferId: txHash || "unknown",
        txHash,
        explorerUrl,
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Coinbase send failed";
      return {
        ok: false,
        code: "COINBASE_SEND_FAILED",
        message,
        details: {
          // Avoid leaking secrets; only include safe, high-level details.
          toAddress: args.toAddress,
          amountMicrousdc: args.amountMicrousdc,
        },
      };
    }
  },
});

/**
 * Send USDC on Solana from the platform wallet to a destination address.
 *
 * CDP Solana transfer API expects amount as atomic units (bigint). USDC uses 6 decimals,
 * so microusdc integers map 1:1 to atomic units.
 */
export const sendUsdcSolana = action({
  args: {
    toAddress: v.string(),
    amountMicrousdc: v.number(), // integer microusdc
  },
  handler: async (_ctx, args): Promise<CoinbaseSendResult> => {
    if (!isEnabled()) {
      return {
        ok: false,
        code: "COINBASE_DISABLED",
        message:
          "Coinbase refunds are disabled (set COINBASE_REFUNDS_ENABLED=true in Convex env vars)",
      };
    }

    const envRes = getRequiredEnv();
    if (!envRes.ok) return envRes;

    const micros = Math.round(args.amountMicrousdc);
    if (!Number.isFinite(micros) || !Number.isSafeInteger(micros) || micros <= 0) {
      return { ok: false, code: "INVALID_AMOUNT", message: "amountMicrousdc must be a positive integer" };
    }

    const solanaNetwork = process.env.SOLANA_NETWORK === "mainnet" ? "mainnet" : "devnet";

    try {
      // Defer SDK import until runtime so missing deps/env never break deploy.
      // eslint-disable-next-line @typescript-eslint/consistent-type-imports
      const { CdpClient } = await import("@coinbase/cdp-sdk");

      const cdp = new (CdpClient as any)({
        apiKeyId: envRes.env.apiKeyId,
        apiKeySecret: envRes.env.apiKeySecret,
        walletSecret: envRes.env.walletSecret,
      });

      const sender = await cdp.solana.getOrCreateAccount({ name: envRes.env.platformAccountName });

      try {
        const { signature } = await sender.transfer({
          to: args.toAddress,
          amount: BigInt(micros),
          token: "usdc",
          network: solanaNetwork,
        });

        const sig = signature ? String(signature) : undefined;
        const explorerUrl = sig ? `https://solscan.io/tx/${sig}` : undefined;
        return {
          ok: true,
          providerTransferId: sig || "unknown",
          txHash: sig,
          explorerUrl,
        };
      } catch (e: unknown) {
        // CDP Solana USDC transfer can fail if the recipient's USDC ATA does not exist.
        // In that case, fall back to building a Solana transaction that creates the ATA
        // idempotently and transfers checked USDC, then let CDP sign/send it.
        const message = e instanceof Error ? e.message : "Coinbase send failed";
        const shouldFallback =
          message.includes("Solana error #3230000") ||
          message.toLowerCase().includes("account not found");

        if (!shouldFallback) {
          throw e;
        }

        // NOTE: Convex runtime can be picky about ESM/CJS interop, so we defensively
        // resolve exports via both named exports and `default`.
        // eslint-disable-next-line @typescript-eslint/consistent-type-imports
        const web3Mod: any = await import("@solana/web3.js");
        const PublicKey = web3Mod?.PublicKey ?? web3Mod?.default?.PublicKey;
        const Transaction = web3Mod?.Transaction ?? web3Mod?.default?.Transaction;
        const SYSVAR_RECENT_BLOCKHASHES_PUBKEY =
          web3Mod?.SYSVAR_RECENT_BLOCKHASHES_PUBKEY ?? web3Mod?.default?.SYSVAR_RECENT_BLOCKHASHES_PUBKEY;

        // eslint-disable-next-line @typescript-eslint/consistent-type-imports
        const splTokenMod: any = await import("@solana/spl-token");
        const getAssociatedTokenAddressSync =
          splTokenMod?.getAssociatedTokenAddressSync ?? splTokenMod?.default?.getAssociatedTokenAddressSync;
        const createAssociatedTokenAccountIdempotentInstruction =
          splTokenMod?.createAssociatedTokenAccountIdempotentInstruction ??
          splTokenMod?.default?.createAssociatedTokenAccountIdempotentInstruction;
        const createTransferCheckedInstruction =
          splTokenMod?.createTransferCheckedInstruction ?? splTokenMod?.default?.createTransferCheckedInstruction;

        if (
          !PublicKey ||
          !Transaction ||
          !SYSVAR_RECENT_BLOCKHASHES_PUBKEY ||
          !getAssociatedTokenAddressSync ||
          !createAssociatedTokenAccountIdempotentInstruction ||
          !createTransferCheckedInstruction
        ) {
          return {
            ok: false,
            code: "COINBASE_SEND_FAILED",
            message: "Solana dependency exports missing (web3.js/spl-token interop)",
            details: {
              solanaNetwork,
              toAddress: args.toAddress,
              amountMicrousdc: args.amountMicrousdc,
              mint: SOLANA_USDC_MINT_MAINNET,
              priorError: message,
            },
          };
        }

        const senderPubkey = new PublicKey(String(sender.address));
        const recipientPubkey = new PublicKey(args.toAddress);
        const mintPubkey = new PublicKey(SOLANA_USDC_MINT_MAINNET);

        // USDC uses 6 decimals on Solana; microusdc maps 1:1 to base units.
        const amount = BigInt(micros);

        // Derive ATAs. `allowOwnerOffCurve=true` keeps this usable for PDAs too.
        const senderAta = getAssociatedTokenAddressSync(mintPubkey, senderPubkey, true);
        const recipientAta = getAssociatedTokenAddressSync(mintPubkey, recipientPubkey, true);

        const tx = new Transaction();
        // Ensure both token accounts exist (idempotent instructions).
        tx.add(
          createAssociatedTokenAccountIdempotentInstruction(
            senderPubkey, // payer
            senderAta,
            senderPubkey, // owner
            mintPubkey
          )
        );
        tx.add(
          createAssociatedTokenAccountIdempotentInstruction(
            senderPubkey, // payer
            recipientAta,
            recipientPubkey, // owner
            mintPubkey
          )
        );
        tx.add(
          createTransferCheckedInstruction(
            senderAta,
            mintPubkey,
            recipientAta,
            senderPubkey,
            amount,
            6
          )
        );

        // CDP backend will set a real recent blockhash; this is a placeholder per docs.
        tx.recentBlockhash = SYSVAR_RECENT_BLOCKHASHES_PUBKEY.toBase58();
        tx.feePayer = senderPubkey;

        const serializedTx = Buffer.from(
          tx.serialize({ requireAllSignatures: false })
        ).toString("base64");

        // CDP accepts "solana" (mainnet) and "solana-devnet" (devnet).
        const sendTxNetwork = solanaNetwork === "mainnet" ? "solana" : "solana-devnet";
        const txResult = await cdp.solana.sendTransaction({
          network: sendTxNetwork,
          transaction: serializedTx,
        });
        const sig = txResult?.signature ? String(txResult.signature) : undefined;
        const explorerUrl = sig ? `https://solscan.io/tx/${sig}` : undefined;
        return {
          ok: true,
          providerTransferId: sig || "unknown",
          txHash: sig,
          explorerUrl,
        };
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Coinbase send failed";
      return {
        ok: false,
        code: "COINBASE_SEND_FAILED",
        message,
        details: {
          toAddress: args.toAddress,
          amountMicrousdc: args.amountMicrousdc,
          solanaNetwork,
          token: "usdc",
          mint: SOLANA_USDC_MINT_MAINNET,
        },
      };
    }
  },
});


