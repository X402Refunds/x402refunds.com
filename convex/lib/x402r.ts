/**
 * x402r Protocol Integration
 * 
 * Integrates with existing x402r smart contracts (Base Sepolia/Mainnet)
 * GitHub: https://github.com/BackTrackCo/x402r-contracts
 * 
 * Updated to support both mainnet and testnet via configuration.
 * Contract addresses are now configured via environment variables.
 */

import { action } from "../_generated/server";
import { v } from "convex/values";
import { createPublicClient, createWalletClient, http, parseUnits, formatUnits } from "viem";
import { base, baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { X402R_CONFIG, getChainId, isGasPriceAcceptable } from "../x402r/config";

// Get contract addresses from config (set via environment variables)
function getEscrowFactoryAddress(): string {
  const address = X402R_CONFIG.contracts.escrowFactory;
  if (!address) {
    throw new Error("X402R_ESCROW_FACTORY environment variable not set");
  }
  return address;
}

function getDepositRelayAddress(): string {
  const address = X402R_CONFIG.contracts.depositRelay;
  if (!address) {
    throw new Error("X402R_DEPOSIT_RELAY environment variable not set");
  }
  return address;
}

// Get chain configuration based on network
function getChain() {
  return X402R_CONFIG.network === "base-mainnet" ? base : baseSepolia;
}

// Get RPC transport
function getTransport() {
  return http(X402R_CONFIG.rpcUrl || undefined);
}

// Contract ABIs (minimal - just what we need)
const ESCROW_FACTORY_ABI = [
  {
    name: "createEscrow",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "merchant", type: "address" },
      { name: "buyer", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "arbiter", type: "address" },
    ],
    outputs: [{ name: "escrowAddress", type: "address" }],
  },
  {
    name: "resolveDispute",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "escrowAddress", type: "address" },
      { name: "winner", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "DisputeResolved",
    type: "event",
    inputs: [
      { name: "escrowAddress", type: "address", indexed: true },
      { name: "winner", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;

const DEPOSIT_RELAY_ABI = [
  {
    name: "deposit",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "escrowAddress", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

/**
 * Create escrow for a payment
 * Returns escrow contract address
 * 
 * NOTE: This is typically called by merchants/buyers, not the arbiter.
 * The arbiter is only involved in dispute resolution.
 */
export const createEscrow = action({
  args: {
    merchantAddress: v.string(), // Merchant's wallet address
    buyerAddress: v.string(), // Buyer's wallet address
    amount: v.number(), // USDC amount
    arbiterAddress: v.optional(v.string()), // Arbiter address (defaults to configured arbiter)
    privateKey: v.string(), // Caller's private key (merchant or buyer)
  },
  handler: async (ctx, args): Promise<{
    escrowAddress: string;
    txHash: string;
    success: boolean;
  }> => {
    const arbiterAddress = args.arbiterAddress || X402R_CONFIG.arbiterAddress;
    
    if (!arbiterAddress) {
      throw new Error("Arbiter address not configured");
    }

    // Convert to wallet account (using caller's private key)
    const account = privateKeyToAccount(args.privateKey as `0x${string}`);

    // Create wallet client with dynamic chain
    const walletClient = createWalletClient({
      account,
      chain: getChain(),
      transport: getTransport(),
    });

    // Convert amount to USDC units (6 decimals)
    const amountInUnits = parseUnits(args.amount.toString(), 6);

    try {
      const escrowFactoryAddress = getEscrowFactoryAddress();
      
      // Call EscrowFactory.createEscrow()
      const txHash = await walletClient.writeContract({
        address: escrowFactoryAddress as `0x${string}`,
        abi: ESCROW_FACTORY_ABI,
        functionName: "createEscrow",
        args: [
          args.merchantAddress as `0x${string}`,
          args.buyerAddress as `0x${string}`,
          amountInUnits,
          arbiterAddress as `0x${string}`,
        ],
      });

      // Wait for transaction receipt to get escrow address
      const publicClient = createPublicClient({
        chain: getChain(),
        transport: getTransport(),
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      // Parse logs to get escrow address (from EscrowCreated event)
      // For now, return placeholder - would need to parse event logs properly
      const escrowAddress = receipt.logs[0]?.address || "0x...";

      console.log(`✅ Escrow created on ${X402R_CONFIG.network}: ${escrowAddress} (tx: ${txHash})`);

      return {
        escrowAddress,
        txHash,
        success: true,
      };
    } catch (error: any) {
      console.error("❌ Failed to create escrow:", error);
      throw new Error(`Escrow creation failed: ${error.message}`);
    }
  },
});

/**
 * Resolve dispute and release escrow funds
 * Called by x402refunds.com arbiter after merchant decision
 * 
 * Includes safety checks:
 * - Gas price must be acceptable
 * - Uses configured arbiter private key
 * - Validates configuration before executing
 */
export const resolveDispute = action({
  args: {
    escrowAddress: v.string(),
    winner: v.union(v.literal("BUYER"), v.literal("MERCHANT")),
    buyerAddress: v.string(),
    merchantAddress: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args): Promise<{
    txHash: string;
    success: boolean;
    gasPriceGwei?: number;
  }> => {
    // Validate arbiter private key is configured
    const arbiterPrivateKey = X402R_CONFIG.arbiterPrivateKey;
    if (!arbiterPrivateKey) {
      throw new Error("X402R_ARBITER_PRIVATE_KEY not configured");
    }

    const account = privateKeyToAccount(arbiterPrivateKey as `0x${string}`);
    
    // Create public client to check gas price
    const publicClient = createPublicClient({
      chain: getChain(),
      transport: getTransport(),
    });
    
    // Check current gas price
    const gasPrice = await publicClient.getGasPrice();
    const gasPriceGwei = Number(gasPrice) / 1e9;
    
    console.log(`⛽ Current gas price: ${gasPriceGwei.toFixed(2)} gwei`);
    
    // Safety check: Don't execute if gas is too high
    if (!isGasPriceAcceptable(gasPriceGwei)) {
      throw new Error(
        `Gas price too high: ${gasPriceGwei.toFixed(2)} gwei (max: ${X402R_CONFIG.maxGasPrice} gwei). Transaction not executed for safety.`
      );
    }
    
    // Create wallet client
    const walletClient = createWalletClient({
      account,
      chain: getChain(),
      transport: getTransport(),
    });

    const winnerAddress =
      args.winner === "BUYER" ? args.buyerAddress : args.merchantAddress;
    const amountInUnits = parseUnits(args.amount.toString(), 6);

    try {
      const escrowFactoryAddress = getEscrowFactoryAddress();
      
      // Call EscrowFactory.resolveDispute()
      const txHash = await walletClient.writeContract({
        address: escrowFactoryAddress as `0x${string}`,
        abi: ESCROW_FACTORY_ABI,
        functionName: "resolveDispute",
        args: [
          args.escrowAddress as `0x${string}`,
          winnerAddress as `0x${string}`,
          amountInUnits,
        ],
      });

      console.log(
        `✅ Dispute resolved on ${X402R_CONFIG.network}: ${winnerAddress} wins $${args.amount} (tx: ${txHash})`
      );

      return {
        txHash,
        success: true,
        gasPriceGwei,
      };
    } catch (error: any) {
      console.error("❌ Failed to resolve dispute:", error);
      throw new Error(`Dispute resolution failed: ${error.message}`);
    }
  },
});

/**
 * Check escrow balance
 * Uses configured network (mainnet or testnet)
 */
export const getEscrowBalance = action({
  args: {
    escrowAddress: v.string(),
  },
  handler: async (ctx, args): Promise<{
    balance: number; // USDC amount
    balanceWei: string; // Raw balance
    network: string;
  }> => {
    const publicClient = createPublicClient({
      chain: getChain(),
      transport: getTransport(),
    });

    try {
      // Get ETH balance (if escrow holds ETH) or USDC balance
      const balance = await publicClient.getBalance({
        address: args.escrowAddress as `0x${string}`,
      });

      return {
        balance: parseFloat(formatUnits(balance, 6)), // Assuming USDC (6 decimals)
        balanceWei: balance.toString(),
        network: X402R_CONFIG.network,
      };
    } catch (error: any) {
      console.error("❌ Failed to get escrow balance:", error);
      throw new Error(`Balance check failed: ${error.message}`);
    }
  },
});


