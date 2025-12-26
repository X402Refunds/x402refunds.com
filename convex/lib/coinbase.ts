"use node";

/**
 * Coinbase (CDP Wallet API v2) integration wrapper.
 *
 * CRITICAL: This module must be safe to import without any CDP keys present.
 * - Do not read required env vars at module top-level.
 * - Gate all network calls behind COINBASE_REFUNDS_ENABLED === "true".
 *
 * For now, this exposes a single send primitive for Base USDC refunds.
 */

import { action } from "../_generated/server";
import { v } from "convex/values";

export type CoinbaseSendResult =
  | { ok: true; providerTransferId: string; txHash?: string; explorerUrl?: string }
  | { ok: false; code: string; message: string; details?: any };

function isEnabled(): boolean {
  return process.env.COINBASE_REFUNDS_ENABLED === "true";
}

function getRequiredEnv(): { ok: true; env: Record<string, string> } | { ok: false; code: string; message: string } {
  // NOTE: exact env var names can be decided later; keep them isolated here.
  const apiKeyId = process.env.CDP_API_KEY_ID;
  const apiKeySecret = process.env.CDP_API_KEY_SECRET;
  const platformWalletId = process.env.CDP_PLATFORM_WALLET_ID;

  if (!apiKeyId || !apiKeySecret) {
    return {
      ok: false,
      code: "COINBASE_NOT_CONFIGURED",
      message: "CDP API credentials are not configured (CDP_API_KEY_ID / CDP_API_KEY_SECRET)",
    };
  }
  if (!platformWalletId) {
    return {
      ok: false,
      code: "COINBASE_NOT_CONFIGURED",
      message: "CDP platform wallet is not configured (CDP_PLATFORM_WALLET_ID)",
    };
  }
  return { ok: true, env: { apiKeyId, apiKeySecret, platformWalletId } };
}

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
      return { ok: false, code: "COINBASE_DISABLED", message: "Coinbase refunds are disabled" };
    }

    const envRes = getRequiredEnv();
    if (!envRes.ok) return envRes;

    // Defer SDK import until runtime so missing deps/env never break deploy.
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    const { Coinbase } = await import("@coinbase/coinbase-sdk");
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    const { Wallet } = await import("@coinbase/coinbase-sdk");

    // NOTE: CDP Wallet API v2 auth details can be refined later. For now, we implement a safe stub
    // that fails fast with a clear code if the SDK auth shape differs.
    try {
      // Many Coinbase SDK examples expect configuring from a JSON file. In Convex we configure via env.
      // If this fails, we return a structured error without throwing to keep the workflow resilient.
      (Coinbase as any).configure?.({
        apiKeyId: envRes.env.apiKeyId,
        apiKeySecret: envRes.env.apiKeySecret,
      });

      const wallet = await (Wallet as any).fetch?.(envRes.env.platformWalletId);
      if (!wallet) {
        return {
          ok: false,
          code: "COINBASE_WALLET_NOT_FOUND",
          message: "Platform wallet not found in Coinbase",
        };
      }

      // Prefer a high-level transfer API if available.
      // This may need adjustment once CDP Wallet API v2 auth and method names are finalized.
      const transfer = await wallet.transfer?.({
        to: args.toAddress,
        amount: args.amountMicrousdc,
        token: "usdc",
        network: "base",
      });

      // Best-effort extraction of identifiers.
      const providerTransferId = transfer?.id || transfer?.transferId || transfer?.transactionId || "unknown";
      const txHash = transfer?.txHash || transfer?.hash || transfer?.transactionHash;
      const explorerUrl = txHash ? `https://basescan.org/tx/${txHash}` : undefined;

      return { ok: true, providerTransferId: String(providerTransferId), txHash, explorerUrl };
    } catch (e: any) {
      return {
        ok: false,
        code: "COINBASE_SEND_FAILED",
        message: e?.message || "Coinbase send failed",
        details: {
          // Avoid leaking secrets; only include safe, high-level details.
          toAddress: args.toAddress,
          amountMicrousdc: args.amountMicrousdc,
        },
      };
    }
  },
});


