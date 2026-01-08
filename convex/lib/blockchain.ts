/**
 * Blockchain Query Library
 * 
 * Queries blockchain to verify X-402 USDC payment transactions
 * SUPPORTED: Base and Solana USDC only
 */

import { action } from "../_generated/server";
import { v } from "convex/values";
import { formatMicrosToUsdc } from "./usdc";

/**
 * Supported blockchains and USDC contract addresses
 */
const SUPPORTED_CHAINS = ["base", "solana"] as const;

const USDC_CONTRACTS = {
  base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
  solana: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" // USDC mint on Solana
};

/**
 * Base USDC allowlist (native + bridged).
 *
 * Why: Smart wallets / paymasters often have tx.to != token contract, so we must verify using
 * ERC-20 Transfer logs and accept a small set of USDC token contracts.
 *
 * - Native USDC: Circle native deployment on Base
 * - USDbC: legacy/bridged USDC on Base (Coinbase/Circle references)
 */
export const BASE_USDC_CONTRACT_ALLOWLIST = new Set<string>([
  USDC_CONTRACTS.base.toLowerCase(),
  // Bridged USDC on Base (USDbC)
  "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA".toLowerCase(),
]);

// keccak256("Transfer(address,address,uint256)")
export const ERC20_TRANSFER_TOPIC0 =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export function topicToAddress(topic: string): string {
  const t = String(topic || "");
  return ("0x" + t.slice(-40)).toLowerCase();
}

export type TransferLogMatch = {
  tokenContract: string;
  payerAddress: string;
  recipientAddress: string;
  amountRaw: bigint;
  logIndex: number;
};

/**
 * Find ERC-20 Transfer logs to a given recipient. This is AA-safe: it does NOT rely on tx.to.
 */
export function findErc20TransfersToRecipient(args: {
  logs: any[];
  allowedTokenContracts: Set<string>;
  expectedToAddress: string;
}): TransferLogMatch[] {
  const expectedTo = args.expectedToAddress.toLowerCase();
  return (Array.isArray(args.logs) ? args.logs : [])
    .map((log): TransferLogMatch | null => {
      const tokenContract = String(log?.address || "").toLowerCase();
      if (!args.allowedTokenContracts.has(tokenContract)) return null;

      const topics = Array.isArray(log?.topics) ? log.topics : [];
      if (topics.length < 3) return null;
      if (String(topics[0] || "").toLowerCase() !== ERC20_TRANSFER_TOPIC0) return null;

      const payerAddress = topicToAddress(topics[1]);
      const recipientAddress = topicToAddress(topics[2]);
      if (recipientAddress !== expectedTo) return null;

      const dataHex = String(log?.data || "0x0");
      let amountRaw: bigint;
      try {
        amountRaw = BigInt(dataHex);
      } catch {
        return null;
      }

      const logIndex =
        typeof log?.logIndex === "string" && String(log.logIndex).startsWith("0x")
          ? parseInt(String(log.logIndex), 16)
          : Number.isFinite(Number(log?.logIndex))
            ? Number(log.logIndex)
            : 0;

      return { tokenContract, payerAddress, recipientAddress, amountRaw, logIndex };
    })
    .filter((x): x is TransferLogMatch => Boolean(x));
}

type VerifyRecipientCandidates = Array<{
  tokenContract: string;
  payerAddress: string;
  recipientAddress: string;
  amountMicrousdc: number;
  amountUsdc: string;
  logIndex: number;
}>;

/**
 * Verify a USDC transfer by recipient address (merchant/vendor) and optional logIndex.
 *
 * This supports the "minimal agent payload" flow:
 * - Required: txHash + blockchain + recipientAddress
 * - Optional: sourceTransferLogIndex to disambiguate if multiple transfers exist
 */
export const verifyUsdcTransferByRecipient = action({
  args: {
    blockchain: v.union(v.literal("base"), v.literal("solana")),
    transactionHash: v.string(),
    recipientAddress: v.string(),
    sourceTransferLogIndex: v.optional(v.number()),
  },
  handler: async (_ctx, args): Promise<
    | {
        ok: true;
        blockchain: "base" | "solana";
        transactionHash: string;
        payerAddress: string;
        recipientAddress: string;
        amountMicrousdc: number;
        amountUsdc: string;
        logIndex: number;
        tokenContract?: string;
      }
    | {
        ok: false;
        blockchain: "base" | "solana";
        transactionHash: string;
        code:
          | "TX_NOT_FOUND"
          | "NOT_USDC"
          | "NO_MATCH"
          | "MULTI_MATCH"
          | "NO_MATCH_LOG_INDEX"
          | "NOT_CONFIGURED"
          | "UNSUPPORTED";
        message: string;
        candidates?: VerifyRecipientCandidates;
      }
  > => {
    const mockMode =
      process.env.NODE_ENV === "test" ||
      process.env.VITEST === "true" ||
      process.env.MOCK_BLOCKCHAIN_QUERIES === "true";

    if (mockMode) {
      // In mock mode, return a deterministic, single match unless a logIndex is requested.
      const logIndex = typeof args.sourceTransferLogIndex === "number" ? args.sourceTransferLogIndex : 0;
      return {
        ok: true,
        blockchain: args.blockchain,
        transactionHash: args.transactionHash,
        payerAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        recipientAddress: args.recipientAddress,
        amountMicrousdc: 250000, // 0.25 USDC
        amountUsdc: formatMicrosToUsdc(250000),
        logIndex,
      };
    }

    if (args.blockchain === "solana") {
      return await querySolanaUsdcTransferByRecipient(args.transactionHash, args.recipientAddress, {
        sourceTransferLogIndex: args.sourceTransferLogIndex,
      });
    }

    const alchemyKey = process.env.ALCHEMY_API_KEY;
    if (!alchemyKey) {
      return {
        ok: false,
        blockchain: "base",
        transactionHash: args.transactionHash,
        code: "NOT_CONFIGURED",
        message: "ALCHEMY_API_KEY is not configured (required to verify Base tx hashes)",
      };
    }

    return await queryBaseUsdcTransferByRecipient(args.transactionHash, alchemyKey, args.recipientAddress, {
      sourceTransferLogIndex: args.sourceTransferLogIndex,
    });
  },
});

type DeriveMerchantCandidates = Array<{
  tokenContract: string;
  payerAddress: string;
  recipientAddress: string;
  amountMicrousdc: number;
  amountUsdc: string;
  logIndex: number;
}>;

/**
 * Derive the merchant recipient for a Base USDC payment tx hash (no recipient provided).
 *
 * This is intended for the human `/file-dispute` UX to avoid manual merchant wallet entry.
 * If the tx contains multiple USDC Transfer logs, we return MULTI_MATCH so the caller can decide
 * how to disambiguate (or prompt the user).
 */
export const deriveUsdcMerchantFromTxHashBase = action({
  args: {
    transactionHash: v.string(),
  },
  handler: async (
    _ctx,
    args,
  ): Promise<
    | {
        ok: true;
        blockchain: "base";
        transactionHash: string;
        payerAddress: string;
        recipientAddress: string;
        amountMicrousdc: number;
        amountUsdc: string;
        logIndex: number;
        tokenContract?: string;
      }
    | {
        ok: false;
        blockchain: "base";
        transactionHash: string;
        code: "TX_NOT_FOUND" | "NOT_USDC" | "NO_MATCH" | "MULTI_MATCH" | "NOT_CONFIGURED" | "UNSUPPORTED";
        message: string;
        candidates?: DeriveMerchantCandidates;
      }
  > => {
    const tx = (args.transactionHash || "").trim();
    if (!/^0x[a-fA-F0-9]{64}$/.test(tx)) {
      return {
        ok: false,
        blockchain: "base",
        transactionHash: tx,
        code: "UNSUPPORTED",
        message: "transactionHash must be a Base tx hash: 0x + 64 hex chars",
      };
    }

    const mockMode =
      process.env.NODE_ENV === "test" ||
      process.env.VITEST === "true" ||
      process.env.MOCK_BLOCKCHAIN_QUERIES === "true";

    if (mockMode) {
      return {
        ok: true,
        blockchain: "base",
        transactionHash: tx,
        payerAddress: "0x742d35cc6634c0532925a3b844bc9e7595f0beb0",
        recipientAddress: "0x9876543210987654321098765432109876543210",
        amountMicrousdc: 250000,
        amountUsdc: formatMicrosToUsdc(250000),
        logIndex: 0,
      };
    }

    const alchemyKey = process.env.ALCHEMY_API_KEY;
    if (!alchemyKey) {
      return {
        ok: false,
        blockchain: "base",
        transactionHash: tx,
        code: "NOT_CONFIGURED",
        message: "ALCHEMY_API_KEY is not configured (required to verify Base tx hashes)",
      };
    }

    const rpcUrl = `${RPC_ENDPOINTS.base}/${alchemyKey}`;

    const receiptResp = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method: "eth_getTransactionReceipt",
        params: [tx],
      }),
    });

    const receiptData = await receiptResp.json().catch(() => null);
    if (!receiptData || receiptData.error) {
      return {
        ok: false,
        blockchain: "base",
        transactionHash: tx,
        code: "TX_NOT_FOUND",
        message: receiptData?.error?.message || "Transaction receipt not found",
      };
    }

    const receipt = receiptData.result;
    if (!receipt) {
      return {
        ok: false,
        blockchain: "base",
        transactionHash: tx,
        code: "TX_NOT_FOUND",
        message: "Transaction receipt not found",
      };
    }

    const logs: any[] = Array.isArray(receipt.logs) ? receipt.logs : [];

    const candidates: DeriveMerchantCandidates = (Array.isArray(logs) ? logs : [])
      .map((log): DeriveMerchantCandidates[number] | null => {
        const tokenContract = String(log?.address || "").toLowerCase();
        if (!BASE_USDC_CONTRACT_ALLOWLIST.has(tokenContract)) return null;

        const topics = Array.isArray(log?.topics) ? log.topics : [];
        if (topics.length < 3) return null;
        if (String(topics[0] || "").toLowerCase() !== ERC20_TRANSFER_TOPIC0) return null;

        const payerAddress = topicToAddress(String(topics[1] || ""));
        const recipientAddress = topicToAddress(String(topics[2] || ""));

        const dataHex = String(log?.data || "0x0");
        let amountRaw: bigint;
        try {
          amountRaw = BigInt(dataHex);
        } catch {
          return null;
        }

        // Avoid BigInt literals (e.g. `0n`) so this file type-checks under lower TS targets too.
        if (amountRaw < BigInt(0)) return null;
        if (amountRaw > BigInt(Number.MAX_SAFE_INTEGER)) {
          // Avoid unsafe integer conversion; this endpoint is intended for typical small payments.
          return null;
        }

        const amountMicrousdc = Number(amountRaw);

        const logIndex =
          typeof log?.logIndex === "string" && String(log.logIndex).startsWith("0x")
            ? parseInt(String(log.logIndex), 16)
            : Number.isFinite(Number(log?.logIndex))
              ? Number(log.logIndex)
              : 0;

        return {
          tokenContract,
          payerAddress,
          recipientAddress,
          amountMicrousdc,
          amountUsdc: formatMicrosToUsdc(amountMicrousdc),
          logIndex,
        };
      })
      .filter((x): x is DeriveMerchantCandidates[number] => Boolean(x));

    if (candidates.length === 0) {
      return {
        ok: false,
        blockchain: "base",
        transactionHash: tx,
        code: "NO_MATCH",
        message: "No accepted USDC Transfer event found in transaction receipt",
      };
    }

    if (candidates.length !== 1) {
      return {
        ok: false,
        blockchain: "base",
        transactionHash: tx,
        code: "MULTI_MATCH",
        message: `Multiple USDC Transfer events found in transaction receipt (${candidates.length}).`,
        candidates: candidates.slice(0, 25),
      };
    }

    const match = candidates[0]!;
    return {
      ok: true,
      blockchain: "base",
      transactionHash: tx,
      payerAddress: match.payerAddress,
      recipientAddress: match.recipientAddress,
      amountMicrousdc: match.amountMicrousdc,
      amountUsdc: match.amountUsdc,
      logIndex: match.logIndex,
      tokenContract: match.tokenContract,
    };
  },
});

/**
 * Find matching ERC-20 Transfer logs in a receipt. This is AA-safe: it does NOT rely on tx.to.
 */
export function findErc20TransferMatches(args: {
  logs: any[];
  allowedTokenContracts: Set<string>;
  expectedAmountRaw: bigint;
  expectedToAddress?: string;
}): TransferLogMatch[] {
  const expectedTo = args.expectedToAddress ? args.expectedToAddress.toLowerCase() : null;

  return (Array.isArray(args.logs) ? args.logs : [])
    .map((log): TransferLogMatch | null => {
      const tokenContract = String(log?.address || "").toLowerCase();
      if (!args.allowedTokenContracts.has(tokenContract)) return null;

      const topics = Array.isArray(log?.topics) ? log.topics : [];
      if (topics.length < 3) return null;
      if (String(topics[0] || "").toLowerCase() !== ERC20_TRANSFER_TOPIC0) return null;

      const payerAddress = topicToAddress(topics[1]);
      const recipientAddress = topicToAddress(topics[2]);
      if (expectedTo && recipientAddress !== expectedTo) return null;

      const dataHex = String(log?.data || "0x0");
      let amountRaw: bigint;
      try {
        amountRaw = BigInt(dataHex);
      } catch {
        return null;
      }
      if (amountRaw !== args.expectedAmountRaw) return null;

      const logIndex =
        typeof log?.logIndex === "string" && String(log.logIndex).startsWith("0x")
          ? parseInt(String(log.logIndex), 16)
          : Number.isFinite(Number(log?.logIndex))
            ? Number(log.logIndex)
            : 0;

      return { tokenContract, payerAddress, recipientAddress, amountRaw, logIndex };
    })
    .filter((x): x is TransferLogMatch => Boolean(x));
}

/**
 * Blockchain RPC Endpoints
 * Only Base and Solana are supported
 * 
 * Using Alchemy for Base (EVM), public RPC for Solana
 */
const RPC_ENDPOINTS = {
  base: "https://base-mainnet.g.alchemy.com/v2",
  solana: "https://api.mainnet-beta.solana.com"
} as const;

/**
 * Deterministically verify a USDC transfer by expected microusdc amount and return the payer + logIndex.
 * This is used for refund-to-source flows (refund destination = payer).
 */
export const verifyUsdcTransferByAmount = action({
  args: {
    blockchain: v.union(v.literal("base"), v.literal("solana")),
    transactionHash: v.string(),
    expectedAmountMicrousdc: v.number(), // integer microusdc
    expectedToAddress: v.optional(v.string()), // optional extra disambiguation
  },
  handler: async (_ctx, args): Promise<
    | {
        ok: true;
        blockchain: "base" | "solana";
        transactionHash: string;
        payerAddress: string;
        recipientAddress: string;
        amountMicrousdc: number;
        amountUsdc: string;
        logIndex: number;
      }
    | {
        ok: false;
        blockchain: "base" | "solana";
        transactionHash: string;
        code: "TX_NOT_FOUND" | "NOT_USDC" | "NO_MATCH" | "MULTI_MATCH" | "NOT_CONFIGURED" | "UNSUPPORTED";
        message: string;
      }
  > => {
    const expected = args.expectedAmountMicrousdc;
    if (!Number.isSafeInteger(expected) || expected <= 0) {
      return {
        ok: false,
        blockchain: args.blockchain,
        transactionHash: args.transactionHash,
        code: "UNSUPPORTED",
        message: "expectedAmountMicrousdc must be a positive safe integer",
      };
    }

    const mockMode =
      process.env.NODE_ENV === "test" ||
      process.env.VITEST === "true" ||
      process.env.MOCK_BLOCKCHAIN_QUERIES === "true";

    if (mockMode) {
      // In mock mode, assume the claimed amount matches deterministically.
      return {
        ok: true,
        blockchain: args.blockchain,
        transactionHash: args.transactionHash,
        payerAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        recipientAddress: (args.expectedToAddress || "0x9876543210987654321098765432109876543210").toLowerCase(),
        amountMicrousdc: expected,
        amountUsdc: formatMicrosToUsdc(expected),
        logIndex: 0,
      };
    }

    if (args.blockchain === "solana") {
      return await querySolanaUsdcTransferByAmount(args.transactionHash, expected);
    }

    // Base uses Alchemy JSON-RPC (EVM-compatible)
    const alchemyKey = process.env.ALCHEMY_API_KEY;
    if (!alchemyKey) {
      return {
        ok: false,
        blockchain: "base",
        transactionHash: args.transactionHash,
        code: "NOT_CONFIGURED",
        message: "ALCHEMY_API_KEY is not configured (required to verify Base tx hashes)",
      };
    }
    return await queryBaseUsdcTransferByAmount(args.transactionHash, alchemyKey, expected, {
      expectedToAddress: args.expectedToAddress,
    });
  },
});

/**
 * Query USDC transaction details from blockchain
 * 
 * For X-402 disputes, we verify:
 * 1. Transaction exists and is confirmed
 * 2. Transaction is a USDC transfer (not ETH/SOL)
 * 3. From/to addresses match plaintiff/defendant
 * 4. Amount in USDC (1 USDC = $1.00 USD)
 */
export const queryTransaction = action({
  args: {
    blockchain: v.string(),
    transactionHash: v.string(),
    expectedFromAddress: v.optional(v.string()), // For mock mode: use this as fromAddress
    expectedToAddress: v.optional(v.string()), // Optional: enforce recipient address
  },
  handler: async (ctx, { blockchain, transactionHash, expectedFromAddress, expectedToAddress }) => {
    try {
      // Validate blockchain is supported (Base or Solana only)
      if (!SUPPORTED_CHAINS.includes(blockchain as any)) {
        return {
          success: false,
          error: `Only Base and Solana chains are supported for USDC payments`,
          transactionHash,
          blockchain,
          supportedChains: SUPPORTED_CHAINS
        };
      }

      // Get Alchemy API key from environment (Base only)
      const alchemyKey = process.env.ALCHEMY_API_KEY;

      // MOCK MODE: only in explicit test contexts
      const mockMode =
        process.env.NODE_ENV === "test" ||
        process.env.VITEST === "true" ||
        process.env.MOCK_BLOCKCHAIN_QUERIES === "true";

      if (mockMode) {
        console.log(`🧪 MOCK MODE: Returning mock USDC data for ${blockchain}:${transactionHash}`);
        const mockValueUsdc = 2500000; // 2.50 USDC (6 decimals)
        const mockValueUsd = 2.50; // 1 USDC = $1.00
        
        // Use expected addresses if provided (for MCP integration), otherwise use defaults
        return {
          success: true,
          transactionHash,
          blockchain,
          fromAddress: expectedFromAddress || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
          toAddress: expectedToAddress || "0x9876543210987654321098765432109876543210",
          value: mockValueUsdc.toString(),
          currency: "USDC",
          amountUsd: mockValueUsd,
          blockNumber: 12345678,
          timestamp: Date.now(),
          confirmed: true
        };
      }

      if (blockchain === "solana") {
        return await querySolanaUsdcTransaction(transactionHash, {
          expectedFromAddress,
          expectedToAddress,
        });
      }

      // Base uses Alchemy JSON-RPC (EVM-compatible)
      if (!alchemyKey) {
        return {
          success: false,
          error: "ALCHEMY_API_KEY is not configured (required to verify Base tx hashes)",
          transactionHash,
          blockchain: "base",
        };
      }
      return await queryBaseUsdcTransaction(transactionHash, alchemyKey, {
        expectedFromAddress,
        expectedToAddress,
      });

    } catch (error: any) {
      console.error(`❌ Blockchain query failed:`, error);
      return {
        success: false,
        error: error.message,
        transactionHash,
        blockchain
      };
    }
  },
});

/**
 * Query Base USDC transaction
 * Base is EVM-compatible, uses same RPC as Ethereum
 */
async function queryBaseUsdcTransaction(
  transactionHash: string,
  alchemyKey: string,
  opts?: { expectedFromAddress?: string; expectedToAddress?: string }
) {
  const rpcUrl = `${RPC_ENDPOINTS.base}/${alchemyKey}`;

  console.log(`🔍 Querying Base blockchain for USDC transfer: ${transactionHash}`);
  
  // Get transaction details
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      id: 1,
      jsonrpc: '2.0',
      method: 'eth_getTransactionByHash',
      params: [transactionHash]
    })
  });

  const data = await response.json();

  if (data.error || !data.result) {
    return {
      success: false,
      error: data.error?.message || "Transaction not found",
      transactionHash,
      blockchain: "base"
    };
  }

  const tx = data.result;

  // Instead of relying on tx.input decoding (which differs across token methods),
  // parse the transaction receipt logs for the ERC-20 Transfer event. This works for:
  // - transfer(address,uint256)
  // - EIP-3009 transferWithAuthorization(...)
  // - other token flows that emit Transfer.
  const receiptResp = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      id: 2,
      jsonrpc: "2.0",
      method: "eth_getTransactionReceipt",
      params: [transactionHash],
    }),
  });

  const receiptData = await receiptResp.json();
  if (receiptData.error || !receiptData.result) {
    return {
      success: false,
      error: receiptData.error?.message || "Transaction receipt not found",
      transactionHash,
      blockchain: "base",
    };
  }

  const receipt = receiptData.result;
  const logs: any[] = Array.isArray(receipt.logs) ? receipt.logs : [];
  const expectedTo = opts?.expectedToAddress ? opts.expectedToAddress.toLowerCase() : undefined;

  // If we know the expected recipient, prefer logs that match it.
  const candidates = (Array.isArray(logs) ? logs : []).filter((log) => {
    const tokenContract = String(log?.address || "").toLowerCase();
    if (!BASE_USDC_CONTRACT_ALLOWLIST.has(tokenContract)) return false;
    const topics = Array.isArray(log?.topics) ? log.topics : [];
    if (topics.length < 3) return false;
    if (String(topics[0] || "").toLowerCase() !== ERC20_TRANSFER_TOPIC0) return false;
    if (!expectedTo) return true;
    const to = topicToAddress(String(topics[2] || ""));
    return to === expectedTo;
  });

  if (candidates.length === 0) {
    return {
      success: false,
      error: "No accepted USDC Transfer event found in transaction receipt",
      transactionHash,
      blockchain: "base",
      hint: `Expected a Transfer event from an accepted USDC contract (${Array.from(BASE_USDC_CONTRACT_ALLOWLIST).join(", ")})`,
    };
  }

  const preferredLog = candidates[0];

  if (!preferredLog) {
    return {
      success: false,
      error: `No USDC Transfer event matched expected recipient ${opts?.expectedToAddress}`,
      transactionHash,
      blockchain: "base",
    };
  }

  const fromTopic = String(preferredLog.topics?.[1] || "");
  const toTopic = String(preferredLog.topics?.[2] || "");
  const transferFrom = ("0x" + fromTopic.slice(-40)).toLowerCase();
  const recipientAddress = ("0x" + toTopic.slice(-40)).toLowerCase();
  const dataHex = String(preferredLog.data || "0x0");
  const amountRaw = BigInt(dataHex);

  // USDC has 6 decimals (1 USDC = 1,000,000 raw units)
  const usdcAmount = Number(amountRaw) / 1e6;
  const amountUsd = usdcAmount; // 1 USDC = $1.00 USD

  // Optional: enforce expected addresses
  if (opts?.expectedFromAddress && typeof opts.expectedFromAddress === "string") {
    const actualFrom = (transferFrom || "").toLowerCase();
    if (actualFrom && actualFrom !== opts.expectedFromAddress.toLowerCase()) {
      return {
        success: false,
        error: `Transaction payer mismatch. Expected from ${opts.expectedFromAddress}, got ${transferFrom}`,
        transactionHash,
        blockchain: "base",
        expectedFromAddress: opts.expectedFromAddress,
        actualFromAddress: transferFrom,
      };
    }
  }

  if (opts?.expectedToAddress && typeof opts.expectedToAddress === "string") {
    const actualTo = (recipientAddress || "").toLowerCase();
    if (actualTo && actualTo !== opts.expectedToAddress.toLowerCase()) {
      return {
        success: false,
        error: `Transaction recipient mismatch. Expected to ${opts.expectedToAddress}, got ${recipientAddress}`,
        transactionHash,
        blockchain: "base",
        expectedToAddress: opts.expectedToAddress,
        actualToAddress: recipientAddress,
      };
    }
  }

  const result = {
    success: true,
    transactionHash,
    blockchain: "base",
    // Prefer the Transfer event "from" address (payer) over tx.from (sender might be a relayer/facilitator).
    fromAddress: transferFrom,
    toAddress: recipientAddress, // The actual recipient of USDC
    value: usdcAmount.toString(),
    blockNumber: parseInt(tx.blockNumber, 16),
    timestamp: null,
    currency: "USDC",
    amountUsd: amountUsd,
    confirmed: true
  };

  console.log(`✅ Base USDC transaction found:`);
  console.log(`   From: ${tx.from} → To: ${recipientAddress}`);
  console.log(`   Amount: ${usdcAmount} USDC = $${amountUsd.toFixed(2)} USD`);
  
  return result;
}

async function queryBaseUsdcTransferByAmount(
  transactionHash: string,
  alchemyKey: string,
  expectedAmountMicrousdc: number,
  opts?: { expectedToAddress?: string },
): Promise<
  | {
      ok: true;
      blockchain: "base";
      transactionHash: string;
      payerAddress: string;
      recipientAddress: string;
      amountMicrousdc: number;
      amountUsdc: string;
      logIndex: number;
    }
  | {
      ok: false;
      blockchain: "base";
      transactionHash: string;
      code: "TX_NOT_FOUND" | "NOT_USDC" | "NO_MATCH" | "MULTI_MATCH";
      message: string;
    }
> {
  const rpcUrl = `${RPC_ENDPOINTS.base}/${alchemyKey}`;

  const txResp = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method: "eth_getTransactionByHash",
      params: [transactionHash],
    }),
  });
  const txData = await txResp.json();
  if (txData.error || !txData.result) {
    return {
      ok: false,
      blockchain: "base",
      transactionHash,
      code: "TX_NOT_FOUND",
      message: txData.error?.message || "Transaction not found",
    };
  }

  const tx = txData.result;

  const receiptResp = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      id: 2,
      jsonrpc: "2.0",
      method: "eth_getTransactionReceipt",
      params: [transactionHash],
    }),
  });
  const receiptData = await receiptResp.json();
  if (receiptData.error || !receiptData.result) {
    return {
      ok: false,
      blockchain: "base",
      transactionHash,
      code: "TX_NOT_FOUND",
      message: receiptData.error?.message || "Transaction receipt not found",
    };
  }

  const receipt = receiptData.result;
  const logs: any[] = Array.isArray(receipt.logs) ? receipt.logs : [];

  const matches = findErc20TransferMatches({
    logs,
    allowedTokenContracts: BASE_USDC_CONTRACT_ALLOWLIST,
    expectedAmountRaw: BigInt(expectedAmountMicrousdc),
    expectedToAddress: opts?.expectedToAddress,
  });

  // If there are no Transfer logs from allowed contracts at all, it's not USDC.
  const anyAllowedTransfers = (Array.isArray(logs) ? logs : []).some((log) => {
    const tokenContract = String(log?.address || "").toLowerCase();
    const topics = Array.isArray(log?.topics) ? log.topics : [];
    return (
      BASE_USDC_CONTRACT_ALLOWLIST.has(tokenContract) &&
      topics.length >= 3 &&
      String(topics[0] || "").toLowerCase() === ERC20_TRANSFER_TOPIC0
    );
  });

  if (matches.length === 0) {
    if (!anyAllowedTransfers) {
      return {
        ok: false,
        blockchain: "base",
        transactionHash,
        code: "NOT_USDC",
        message: `No accepted USDC Transfer logs found in tx receipt (tx.to=${tx.to})`,
      };
    }
    return {
      ok: false,
      blockchain: "base",
      transactionHash,
      code: "NO_MATCH",
      message: `No USDC Transfer matched expected amount ${expectedAmountMicrousdc} microusdc`,
    };
  }
  if (matches.length > 1) {
    return {
      ok: false,
      blockchain: "base",
      transactionHash,
      code: "MULTI_MATCH",
      message: `Multiple USDC Transfers matched expected amount ${expectedAmountMicrousdc} microusdc`,
    };
  }

  const match = matches[0];

  return {
    ok: true,
    blockchain: "base",
    transactionHash,
    payerAddress: match.payerAddress,
    recipientAddress: match.recipientAddress,
    amountMicrousdc: expectedAmountMicrousdc,
    amountUsdc: formatMicrosToUsdc(expectedAmountMicrousdc),
    logIndex: match.logIndex,
  };
}

async function queryBaseUsdcTransferByRecipient(
  transactionHash: string,
  alchemyKey: string,
  recipientAddress: string,
  opts?: { sourceTransferLogIndex?: number },
): Promise<
  | {
      ok: true;
      blockchain: "base";
      transactionHash: string;
      payerAddress: string;
      recipientAddress: string;
      amountMicrousdc: number;
      amountUsdc: string;
      logIndex: number;
      tokenContract: string;
    }
  | {
      ok: false;
      blockchain: "base";
      transactionHash: string;
      code: "TX_NOT_FOUND" | "NOT_USDC" | "NO_MATCH" | "MULTI_MATCH" | "NO_MATCH_LOG_INDEX" | "UNSUPPORTED";
      message: string;
      candidates?: VerifyRecipientCandidates;
    }
> {
  const rpcUrl = `${RPC_ENDPOINTS.base}/${alchemyKey}`;

  const txResp = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      id: 101,
      jsonrpc: "2.0",
      method: "eth_getTransactionByHash",
      params: [transactionHash],
    }),
  });
  const txData = await txResp.json();
  if (txData.error || !txData.result) {
    return {
      ok: false,
      blockchain: "base",
      transactionHash,
      code: "TX_NOT_FOUND",
      message: txData.error?.message || "Transaction not found",
    };
  }

  const receiptResp = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      id: 102,
      jsonrpc: "2.0",
      method: "eth_getTransactionReceipt",
      params: [transactionHash],
    }),
  });
  const receiptData = await receiptResp.json();
  if (receiptData.error || !receiptData.result) {
    return {
      ok: false,
      blockchain: "base",
      transactionHash,
      code: "TX_NOT_FOUND",
      message: receiptData.error?.message || "Transaction receipt not found",
    };
  }

  const receipt = receiptData.result;
  const logs: any[] = Array.isArray(receipt.logs) ? receipt.logs : [];

  // If there are no Transfer logs from allowed contracts at all, it's not USDC.
  const anyAllowedTransfers = (Array.isArray(logs) ? logs : []).some((log) => {
    const tokenContract = String(log?.address || "").toLowerCase();
    const topics = Array.isArray(log?.topics) ? log.topics : [];
    return (
      BASE_USDC_CONTRACT_ALLOWLIST.has(tokenContract) &&
      topics.length >= 3 &&
      String(topics[0] || "").toLowerCase() === ERC20_TRANSFER_TOPIC0
    );
  });

  const matches = findErc20TransfersToRecipient({
    logs,
    allowedTokenContracts: BASE_USDC_CONTRACT_ALLOWLIST,
    expectedToAddress: recipientAddress,
  });

  const toFindLogIndex = opts?.sourceTransferLogIndex;
  if (typeof toFindLogIndex === "number") {
    const exact = matches.filter((m) => m.logIndex === toFindLogIndex);
    if (exact.length !== 1) {
      return {
        ok: false,
        blockchain: "base",
        transactionHash,
        code: "NO_MATCH_LOG_INDEX",
        message: `No USDC Transfer to ${recipientAddress} matched logIndex ${toFindLogIndex}`,
      };
    }
    const m = exact[0];
    if (m.amountRaw > BigInt(Number.MAX_SAFE_INTEGER)) {
      return {
        ok: false,
        blockchain: "base",
        transactionHash,
        code: "UNSUPPORTED",
        message: "USDC amount exceeds safe integer range",
      };
    }
    const amountMicrousdc = Number(m.amountRaw);
    return {
      ok: true,
      blockchain: "base",
      transactionHash,
      payerAddress: m.payerAddress,
      recipientAddress: m.recipientAddress,
      amountMicrousdc,
      amountUsdc: formatMicrosToUsdc(amountMicrousdc),
      logIndex: m.logIndex,
      tokenContract: m.tokenContract,
    };
  }

  if (matches.length === 0) {
    if (!anyAllowedTransfers) {
      return {
        ok: false,
        blockchain: "base",
        transactionHash,
        code: "NOT_USDC",
        message: "No accepted USDC Transfer logs found in tx receipt",
      };
    }
    return {
      ok: false,
      blockchain: "base",
      transactionHash,
      code: "NO_MATCH",
      message: `No USDC Transfer matched recipient ${recipientAddress}`,
    };
  }
  if (matches.length > 1) {
    const candidates: VerifyRecipientCandidates = [];
    for (const m of matches) {
      if (m.amountRaw > BigInt(Number.MAX_SAFE_INTEGER)) continue;
      const amountMicrousdc = Number(m.amountRaw);
      candidates.push({
        tokenContract: m.tokenContract,
        payerAddress: m.payerAddress,
        recipientAddress: m.recipientAddress,
        amountMicrousdc,
        amountUsdc: formatMicrosToUsdc(amountMicrousdc),
        logIndex: m.logIndex,
      });
    }
    return {
      ok: false,
      blockchain: "base",
      transactionHash,
      code: "MULTI_MATCH",
      message: `Multiple USDC Transfers matched recipient ${recipientAddress}. Provide sourceTransferLogIndex to disambiguate.`,
      candidates,
    };
  }

  const m = matches[0];
  if (m.amountRaw > BigInt(Number.MAX_SAFE_INTEGER)) {
    return {
      ok: false,
      blockchain: "base",
      transactionHash,
      code: "UNSUPPORTED",
      message: "USDC amount exceeds safe integer range",
    };
  }
  const amountMicrousdc = Number(m.amountRaw);
  return {
    ok: true,
    blockchain: "base",
    transactionHash,
    payerAddress: m.payerAddress,
    recipientAddress: m.recipientAddress,
    amountMicrousdc,
    amountUsdc: formatMicrosToUsdc(amountMicrousdc),
    logIndex: m.logIndex,
    tokenContract: m.tokenContract,
  };
}

async function querySolanaUsdcTransferByAmount(
  signature: string,
  expectedAmountMicrousdc: number,
): Promise<
  | {
      ok: true;
      blockchain: "solana";
      transactionHash: string;
      payerAddress: string;
      recipientAddress: string;
      amountMicrousdc: number;
      amountUsdc: string;
      logIndex: number;
    }
  | {
      ok: false;
      blockchain: "solana";
      transactionHash: string;
      code: "TX_NOT_FOUND" | "NOT_USDC" | "NO_MATCH" | "MULTI_MATCH" | "UNSUPPORTED";
      message: string;
    }
> {
  const resp = await fetch(RPC_ENDPOINTS.solana, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getTransaction",
      params: [
        signature,
        {
          encoding: "jsonParsed",
          maxSupportedTransactionVersion: 0,
        },
      ],
    }),
  });
  const data = await resp.json();
  if (data.error || !data.result) {
    return {
      ok: false,
      blockchain: "solana",
      transactionHash: signature,
      code: "TX_NOT_FOUND",
      message: data.error?.message || "Transaction not found",
    };
  }

  const instructions = data.result.transaction?.message?.instructions || [];
  const matches: Array<{ ixIndex: number; from: string; to: string; amountRaw: bigint }> = [];

  for (let i = 0; i < instructions.length; i++) {
    const ix = instructions[i];
    if (ix?.parsed?.type !== "transfer" && ix?.parsed?.type !== "transferChecked") continue;
    const info = ix.parsed?.info;
    if (!info) continue;
    if (info?.mint !== USDC_CONTRACTS.solana) continue;

    const amountStr = info.amount || info.tokenAmount?.amount;
    const decimals = info.decimals || info.tokenAmount?.decimals || 6;
    if (decimals !== 6) continue;
    try {
      const amountRaw = BigInt(String(amountStr));
      if (amountRaw === BigInt(expectedAmountMicrousdc)) {
        matches.push({
          ixIndex: i,
          from: (info.source || info.authority || "").toString(),
          to: (info.destination || "").toString(),
          amountRaw,
        });
      }
    } catch {
      continue;
    }
  }

  if (matches.length === 0) {
    return {
      ok: false,
      blockchain: "solana",
      transactionHash: signature,
      code: "NO_MATCH",
      message: `No USDC transfer matched expected amount ${expectedAmountMicrousdc} microusdc`,
    };
  }
  if (matches.length > 1) {
    return {
      ok: false,
      blockchain: "solana",
      transactionHash: signature,
      code: "MULTI_MATCH",
      message: `Multiple USDC transfers matched expected amount ${expectedAmountMicrousdc} microusdc`,
    };
  }

  const match = matches[0];
  return {
    ok: true,
    blockchain: "solana",
    transactionHash: signature,
    payerAddress: match.from,
    recipientAddress: match.to,
    amountMicrousdc: expectedAmountMicrousdc,
    amountUsdc: formatMicrosToUsdc(expectedAmountMicrousdc),
    logIndex: match.ixIndex,
  };
}

async function querySolanaUsdcTransferByRecipient(
  signature: string,
  recipientAddress: string,
  opts?: { sourceTransferLogIndex?: number },
): Promise<
  | {
      ok: true;
      blockchain: "solana";
      transactionHash: string;
      payerAddress: string;
      recipientAddress: string;
      amountMicrousdc: number;
      amountUsdc: string;
      logIndex: number;
    }
  | {
      ok: false;
      blockchain: "solana";
      transactionHash: string;
      code: "TX_NOT_FOUND" | "NOT_USDC" | "NO_MATCH" | "MULTI_MATCH" | "NO_MATCH_LOG_INDEX" | "UNSUPPORTED";
      message: string;
      candidates?: VerifyRecipientCandidates;
    }
> {
  const resp = await fetch(RPC_ENDPOINTS.solana, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 11,
      method: "getTransaction",
      params: [
        signature,
        {
          encoding: "jsonParsed",
          maxSupportedTransactionVersion: 0,
        },
      ],
    }),
  });
  const data = await resp.json();
  if (data.error || !data.result) {
    return {
      ok: false,
      blockchain: "solana",
      transactionHash: signature,
      code: "TX_NOT_FOUND",
      message: data.error?.message || "Transaction not found",
    };
  }

  const expectedTo = recipientAddress;
  const instructions = data.result.transaction?.message?.instructions || [];
  const matches: Array<{ ixIndex: number; from: string; to: string; amountRaw: bigint }> = [];

  for (let i = 0; i < instructions.length; i++) {
    const ix = instructions[i];
    if (ix?.parsed?.type !== "transfer" && ix?.parsed?.type !== "transferChecked") continue;
    const info = ix.parsed?.info;
    if (!info) continue;
    if (info?.mint !== USDC_CONTRACTS.solana) continue;

    const to = (info.destination || "").toString();
    if (to !== expectedTo) continue;

    const amountStr = info.amount || info.tokenAmount?.amount;
    const decimals = info.decimals || info.tokenAmount?.decimals || 6;
    if (decimals !== 6) continue;
    try {
      const amountRaw = BigInt(String(amountStr));
      matches.push({
        ixIndex: i,
        from: (info.source || info.authority || "").toString(),
        to,
        amountRaw,
      });
    } catch {
      continue;
    }
  }

  const toFindIx = opts?.sourceTransferLogIndex;
  if (typeof toFindIx === "number") {
    const exact = matches.filter((m) => m.ixIndex === toFindIx);
    if (exact.length !== 1) {
      return {
        ok: false,
        blockchain: "solana",
        transactionHash: signature,
        code: "NO_MATCH_LOG_INDEX",
        message: `No USDC transfer to ${recipientAddress} matched instruction index ${toFindIx}`,
      };
    }
    const m = exact[0];
    if (m.amountRaw > BigInt(Number.MAX_SAFE_INTEGER)) {
      return {
        ok: false,
        blockchain: "solana",
        transactionHash: signature,
        code: "UNSUPPORTED",
        message: "USDC amount exceeds safe integer range",
      };
    }
    const amountMicrousdc = Number(m.amountRaw);
    return {
      ok: true,
      blockchain: "solana",
      transactionHash: signature,
      payerAddress: m.from,
      recipientAddress: m.to,
      amountMicrousdc,
      amountUsdc: formatMicrosToUsdc(amountMicrousdc),
      logIndex: m.ixIndex,
    };
  }

  if (matches.length === 0) {
    return {
      ok: false,
      blockchain: "solana",
      transactionHash: signature,
      code: "NO_MATCH",
      message: `No USDC transfer matched recipient ${recipientAddress}`,
    };
  }
  if (matches.length > 1) {
    const candidates: VerifyRecipientCandidates = [];
    for (const m of matches) {
      if (m.amountRaw > BigInt(Number.MAX_SAFE_INTEGER)) continue;
      const amountMicrousdc = Number(m.amountRaw);
      candidates.push({
        tokenContract: USDC_CONTRACTS.solana,
        payerAddress: m.from,
        recipientAddress: m.to,
        amountMicrousdc,
        amountUsdc: formatMicrosToUsdc(amountMicrousdc),
        logIndex: m.ixIndex,
      });
    }
    return {
      ok: false,
      blockchain: "solana",
      transactionHash: signature,
      code: "MULTI_MATCH",
      message: `Multiple USDC transfers matched recipient ${recipientAddress}. Provide sourceTransferLogIndex to disambiguate.`,
      candidates,
    };
  }

  const m = matches[0];
  if (m.amountRaw > BigInt(Number.MAX_SAFE_INTEGER)) {
    return {
      ok: false,
      blockchain: "solana",
      transactionHash: signature,
      code: "UNSUPPORTED",
      message: "USDC amount exceeds safe integer range",
    };
  }
  const amountMicrousdc = Number(m.amountRaw);
  return {
    ok: true,
    blockchain: "solana",
    transactionHash: signature,
    payerAddress: m.from,
    recipientAddress: m.to,
    amountMicrousdc,
    amountUsdc: formatMicrosToUsdc(amountMicrousdc),
    logIndex: m.ixIndex,
  };
}

/**
 * Query Solana USDC transaction
 * Solana uses different transaction format with SPL tokens
 */
async function querySolanaUsdcTransaction(
  signature: string,
  opts?: { expectedFromAddress?: string; expectedToAddress?: string }
) {
  try {
    console.log(`🔍 Querying Solana blockchain for USDC transfer: ${signature}`);
    
    const response = await fetch(RPC_ENDPOINTS.solana, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTransaction",
        params: [
          signature,
          {
            encoding: "jsonParsed",
            maxSupportedTransactionVersion: 0
          }
        ]
      })
    });

    const data = await response.json();

    if (data.error || !data.result) {
      return {
        success: false,
        error: data.error?.message || "Transaction not found",
        transactionHash: signature,
        blockchain: "solana"
      };
    }

    const tx = data.result;
    
    // Parse SPL token transfer instructions
    const instructions = tx.transaction?.message?.instructions || [];
    let usdcTransfer = null;
    
    // Look for USDC token transfer instruction
    for (const ix of instructions) {
      if (ix.parsed?.type === "transfer" || ix.parsed?.type === "transferChecked") {
        // Check if this is a USDC transfer by looking at the mint
        const info = ix.parsed?.info;
        if (info?.mint === USDC_CONTRACTS.solana) {
          usdcTransfer = {
            from: info.source || info.authority,
            to: info.destination,
            amount: info.amount || info.tokenAmount?.amount,
            decimals: info.decimals || info.tokenAmount?.decimals || 6
          };
          break;
        }
      }
    }

    if (!usdcTransfer) {
      return {
        success: false,
        error: `Transaction is not a USDC transfer. Expected USDC mint ${USDC_CONTRACTS.solana}`,
        transactionHash: signature,
        blockchain: "solana",
        hint: "X-402 disputes only accept USDC token transfers on Solana"
      };
    }

    // Optional: enforce expected addresses (note: may be token accounts depending on wallet)
    if (opts?.expectedFromAddress && usdcTransfer.from && usdcTransfer.from !== opts.expectedFromAddress) {
      return {
        success: false,
        error: `Transaction payer mismatch. Expected from ${opts.expectedFromAddress}, got ${usdcTransfer.from}`,
        transactionHash: signature,
        blockchain: "solana",
        expectedFromAddress: opts.expectedFromAddress,
        actualFromAddress: usdcTransfer.from,
      };
    }

    if (opts?.expectedToAddress && usdcTransfer.to && usdcTransfer.to !== opts.expectedToAddress) {
      return {
        success: false,
        error: `Transaction recipient mismatch. Expected to ${opts.expectedToAddress}, got ${usdcTransfer.to}`,
        transactionHash: signature,
        blockchain: "solana",
        expectedToAddress: opts.expectedToAddress,
        actualToAddress: usdcTransfer.to,
      };
    }

    // USDC has 6 decimals on Solana
    const usdcAmount = Number(usdcTransfer.amount) / Math.pow(10, usdcTransfer.decimals);
    const amountUsd = usdcAmount; // 1 USDC = $1.00 USD

    const result = {
      success: true,
      transactionHash: signature,
      blockchain: "solana",
      fromAddress: usdcTransfer.from,
      toAddress: usdcTransfer.to,
      value: usdcAmount.toString(),
      currency: "USDC",
      amountUsd: amountUsd,
      blockNumber: tx.slot || 0,
      timestamp: tx.blockTime || null,
      confirmed: true
    };

    console.log(`✅ Solana USDC transaction found:`);
    console.log(`   From: ${usdcTransfer.from} → To: ${usdcTransfer.to}`);
    console.log(`   Amount: ${usdcAmount} USDC = $${amountUsd.toFixed(2)} USD`);

    return result;

  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      transactionHash: signature,
      blockchain: "solana"
    };
  }
}

/**
 * Mock blockchain query for development/testing
 * Returns simulated USDC transaction data
 */
export const mockQueryTransaction = action({
  args: {
    blockchain: v.string(),
    transactionHash: v.string(),
    mockData: v.optional(v.any())
  },
  handler: async (ctx, { blockchain, transactionHash, mockData }) => {
    console.log(`🧪 MOCK: Blockchain query for ${blockchain}:${transactionHash}`);
    
    return mockData || {
      success: true,
      transactionHash,
      blockchain,
      fromAddress: "0xBuyerMockAddress123",
      toAddress: "0xSellerMockAddress456",
      value: "2.50", // 2.50 USDC
      currency: "USDC",
      amountUsd: 2.50, // 1 USDC = $1.00
      blockNumber: 12345678,
      timestamp: Date.now(),
      confirmed: true
    };
  }
});
