/**
 * Blockchain Query Library
 * 
 * Queries blockchain explorers to verify X-402 payment transactions
 * and extract payment details (amount, currency, from/to addresses)
 */

import { action } from "../_generated/server";
import { v } from "convex/values";

/**
 * Blockchain Explorer API Endpoints
 */
const EXPLORER_APIS = {
  base: "https://api.basescan.org/api",
  ethereum: "https://api.etherscan.io/api",
  polygon: "https://api.polygonscan.com/api",
  arbitrum: "https://api.arbiscan.io/api",
  optimism: "https://api-optimistic.etherscan.io/api",
  solana: "https://api.solscan.io" // Different API structure
} as const;

/**
 * Query transaction details from blockchain explorer
 * 
 * For X-402 disputes, we need to verify:
 * 1. Transaction exists and is confirmed
 * 2. From/to addresses match plaintiff/defendant
 * 3. Amount matches what was paid
 * 4. Currency/token used
 */
export const queryTransaction = action({
  args: {
    blockchain: v.string(),
    transactionHash: v.string(),
  },
  handler: async (ctx, { blockchain, transactionHash }) => {
    try {
      // Get API key from environment (if needed)
      const apiKeys = {
        base: process.env.BASESCAN_API_KEY,
        ethereum: process.env.ETHERSCAN_API_KEY,
        polygon: process.env.POLYGONSCAN_API_KEY,
        arbitrum: process.env.ARBISCAN_API_KEY,
        optimism: process.env.OPTIMISM_ETHERSCAN_API_KEY,
      };

      if (blockchain === "solana") {
        return await querySolanaTransaction(transactionHash);
      }

      // Query EVM chain explorer
      const explorerUrl = EXPLORER_APIS[blockchain as keyof typeof EXPLORER_APIS];
      if (!explorerUrl) {
        throw new Error(`Unsupported blockchain: ${blockchain}`);
      }

      const apiKey = apiKeys[blockchain as keyof typeof apiKeys];
      const url = `${explorerUrl}?module=proxy&action=eth_getTransactionByHash&txhash=${transactionHash}&apikey=${apiKey || ""}`;

      console.log(`🔍 Querying ${blockchain} blockchain for tx: ${transactionHash}`);
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.error || !data.result) {
        return {
          success: false,
          error: data.error?.message || "Transaction not found",
          transactionHash,
          blockchain
        };
      }

      const tx = data.result;

      // Parse transaction details
      const result = {
        success: true,
        transactionHash,
        blockchain,
        fromAddress: tx.from,
        toAddress: tx.to,
        value: BigInt(tx.value).toString(),
        blockNumber: parseInt(tx.blockNumber, 16),
        timestamp: null, // Need separate call for timestamp
        
        // For token transfers, need to decode input
        currency: tx.value === "0x0" ? "USDC" : "ETH", // Simplified - needs token detection
        amountUsd: null, // Need price conversion
        
        confirmed: true // If we got it, it's confirmed
      };

      console.log(`✅ Transaction found:`, result);
      return result;

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
 * Query Solana transaction (different API structure)
 */
async function querySolanaTransaction(signature: string) {
  try {
    // Solana uses RPC, not REST API
    const response = await fetch("https://api.mainnet-beta.solana.com", {
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
    
    // Parse Solana transaction (complex structure)
    return {
      success: true,
      transactionHash: signature,
      blockchain: "solana",
      fromAddress: tx.transaction?.message?.accountKeys?.[0] || "unknown",
      toAddress: tx.transaction?.message?.accountKeys?.[1] || "unknown",
      value: "0", // Need to parse instruction data
      currency: "SOL",
      confirmed: true
    };

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
 * Returns simulated transaction data
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
      value: "250000000000000000", // 0.25 USDC (6 decimals)
      currency: "USDC",
      amountUsd: 0.25,
      blockNumber: 12345678,
      timestamp: Date.now(),
      confirmed: true
    };
  }
});

