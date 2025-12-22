/**
 * x402r Integration Configuration
 * 
 * Centralized feature flag and settings for x402r escrow arbitration
 * Ensures minimal blast radius with isolated configuration
 */

// Feature flag - STARTS DISABLED
export const X402R_CONFIG = {
  // Feature flag - controls all x402r functionality
  enabled: process.env.X402R_ENABLED === "true",
  
  // Network configuration
  network: (process.env.X402R_NETWORK || "base-mainnet") as "base-mainnet" | "base-sepolia",
  rpcUrl: process.env.X402R_RPC_URL || "https://mainnet.base.org",
  
  // Contract addresses (will be set via environment variables)
  // NOTE: These need to be obtained from x402r team for mainnet deployment
  contracts: {
    escrowFactory: process.env.X402R_ESCROW_FACTORY || "",
    depositRelay: process.env.X402R_DEPOSIT_RELAY || "",
  },
  
  // Arbiter configuration
  arbiterAddress: process.env.X402R_ARBITER_ADDRESS || "",
  arbiterPrivateKey: process.env.X402R_ARBITER_PRIVATE_KEY || "",
  
  // Safety limits to prevent expensive operations
  maxGasPrice: parseInt(process.env.X402R_MAX_GAS_PRICE || "100"), // gwei
  maxAmountUsd: parseInt(process.env.X402R_MAX_AMOUNT_USD || "10000"), // USD
  
  // Operational settings
  enableWhitelist: process.env.X402R_ENABLE_WHITELIST === "true", // For staged rollout
  whitelistAddresses: (process.env.X402R_WHITELIST_ADDRESSES || "").split(",").filter(Boolean),
};

/**
 * Check if x402r integration is enabled
 */
export function isX402rEnabled(): boolean {
  return X402R_CONFIG.enabled;
}

/**
 * Require x402r to be enabled, throw error if not
 * Use in functions that should only run when x402r is active
 */
export function requireX402rEnabled(): void {
  if (!isX402rEnabled()) {
    throw new Error("x402r support is not enabled");
  }
}

/**
 * Validate that required configuration is present
 * Returns array of missing configuration items
 */
export function validateConfig(): string[] {
  const missing: string[] = [];
  
  if (!X402R_CONFIG.contracts.escrowFactory) {
    missing.push("X402R_ESCROW_FACTORY");
  }
  
  if (!X402R_CONFIG.contracts.depositRelay) {
    missing.push("X402R_DEPOSIT_RELAY");
  }
  
  if (!X402R_CONFIG.arbiterAddress) {
    missing.push("X402R_ARBITER_ADDRESS");
  }
  
  if (!X402R_CONFIG.arbiterPrivateKey) {
    missing.push("X402R_ARBITER_PRIVATE_KEY");
  }
  
  if (!X402R_CONFIG.rpcUrl) {
    missing.push("X402R_RPC_URL");
  }
  
  return missing;
}

/**
 * Check if an address is whitelisted (for staged rollout)
 */
export function isWhitelisted(address: string): boolean {
  // If whitelist not enabled, all addresses allowed
  if (!X402R_CONFIG.enableWhitelist) {
    return true;
  }
  
  // Check if address is in whitelist
  return X402R_CONFIG.whitelistAddresses.includes(address.toLowerCase());
}

/**
 * Get network chain ID for viem
 */
export function getChainId(): number {
  return X402R_CONFIG.network === "base-mainnet" ? 8453 : 84532;
}

/**
 * Check if gas price is acceptable
 */
export function isGasPriceAcceptable(gasPriceGwei: number): boolean {
  return gasPriceGwei <= X402R_CONFIG.maxGasPrice;
}

/**
 * Check if amount requires manual review
 */
export function requiresManualReview(amountUsd: number): boolean {
  return amountUsd > X402R_CONFIG.maxAmountUsd;
}

