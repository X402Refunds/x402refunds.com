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
  // CDP Server Wallet v2 env vars per Coinbase docs:
  // - CDP_API_KEY_ID
  // - CDP_API_KEY_SECRET
  // - CDP_WALLET_SECRET
  const apiKeyId = process.env.CDP_API_KEY_ID;
  const apiKeySecret = process.env.CDP_API_KEY_SECRET;
  const walletSecret = process.env.CDP_WALLET_SECRET;

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
      if (amount <= 0n) {
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


