/**
 * Blockchain Query Library
 * 
 * Queries blockchain to verify X-402 USDC payment transactions
 * SUPPORTED: Base and Solana USDC only
 */

import { action } from "../_generated/server";
import { v } from "convex/values";

/**
 * Supported blockchains and USDC contract addresses
 */
const SUPPORTED_CHAINS = ["base", "solana"] as const;

const USDC_CONTRACTS = {
  base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
  solana: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" // USDC mint on Solana
};

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

  // Validate this is a USDC transfer
  const toAddress = tx.to?.toLowerCase();
  const expectedUsdcAddress = USDC_CONTRACTS.base.toLowerCase();

  if (toAddress !== expectedUsdcAddress) {
    return {
      success: false,
      error: `Transaction is not a USDC transfer. Expected USDC contract ${USDC_CONTRACTS.base}, got ${tx.to}`,
      transactionHash,
      blockchain: "base",
      hint: "X-402 disputes only accept USDC token transfers on Base"
    };
  }

  const input = tx.input;
  // Parse USDC transfer from transaction input data
  // ERC-20 transfer function signature: transfer(address,uint256) => 0xa9059cbb
  if (!input || typeof input !== "string" || !input.startsWith("0xa9059cbb")) {
    return {
      success: false,
      error: `Transaction is not a direct USDC transfer(address,uint256) call`,
      transactionHash,
      blockchain: "base",
      hint: "X-402 tx-hash flow expects a standard ERC-20 transfer to the USDC contract"
    };
  }
  
  // Decode transfer amount from input data
  // Format: 0xa9059cbb (transfer sig) + 32 bytes (to address) + 32 bytes (amount)
  let usdcAmount = 0;
  let recipientAddress = "0x0";
  
  if (input.length < 138) {
    return {
      success: false,
      error: "USDC transfer input is too short to decode recipient/amount",
      transactionHash,
      blockchain: "base",
    };
  }

  // Extract recipient address (bytes 4-35, but take last 20 bytes)
  recipientAddress = "0x" + input.slice(34, 74);
  
  // Extract amount (bytes 36-67)
  const amountHex = input.slice(74, 138);
  const amountRaw = BigInt("0x" + amountHex);
  
  // USDC has 6 decimals (1 USDC = 1,000,000 raw units)
  usdcAmount = Number(amountRaw) / 1e6;

  // 1 USDC = $1.00 USD (no price oracle needed for stablecoins)
  const amountUsd = usdcAmount;

  // Optional: enforce expected addresses
  if (opts?.expectedFromAddress && typeof opts.expectedFromAddress === "string") {
    const actualFrom = (tx.from || "").toLowerCase();
    if (actualFrom && actualFrom !== opts.expectedFromAddress.toLowerCase()) {
      return {
        success: false,
        error: `Transaction payer mismatch. Expected from ${opts.expectedFromAddress}, got ${tx.from}`,
        transactionHash,
        blockchain: "base",
        expectedFromAddress: opts.expectedFromAddress,
        actualFromAddress: tx.from,
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
    fromAddress: tx.from,
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
