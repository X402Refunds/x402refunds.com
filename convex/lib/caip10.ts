/**
 * CAIP-10 Account ID Utilities
 * 
 * CAIP-10 format: namespace:chainId:accountAddress
 * Examples:
 * - solana:5eykt4GNfsw7SU33zdhhrELoMu3gFmT33EpFdpEfmgbf:7xYZ...
 * - eip155:1:0x1234...
 * - eip155:8453:0x1234...
 */

export interface Caip10Identifier {
  namespace: string;
  chainId: string;
  address: string;
  original: string;
}

/**
 * Parse CAIP-10 identifier
 */
export function parseCaip10(identifier: string): Caip10Identifier {
  const parts = identifier.split(':');
  
  if (parts.length === 3) {
    return {
      namespace: parts[0],
      chainId: parts[1],
      address: parts[2],
      original: identifier,
    };
  }
  
  // Legacy format: assume it's a raw address
  // Try to detect chain from address format
  if (identifier.startsWith('0x')) {
    // Ethereum-like address
    return {
      namespace: 'eip155',
      chainId: '1',  // Default to Ethereum mainnet
      address: identifier,
      original: identifier,
    };
  } else if (identifier.length >= 32 && identifier.length <= 44) {
    // Solana-like address (base58, 32-44 chars)
    return {
      namespace: 'solana',
      chainId: '5eykt4GNfsw7SU33zdhhrELoMu3gFmT33EpFdpEfmgbf',  // Mainnet
      address: identifier,
      original: identifier,
    };
  }
  
  throw new Error(`Invalid CAIP-10 identifier or address format: ${identifier}`);
}

/**
 * Format address as CAIP-10
 */
export function formatCaip10(
  namespace: string,
  chainId: string,
  address: string
): string {
  return `${namespace}:${chainId}:${address}`;
}

/**
 * Check if identifier is Solana
 */
export function isSolana(identifier: string): boolean {
  const parsed = parseCaip10(identifier);
  return parsed.namespace === 'solana';
}

/**
 * Check if identifier is EVM (Ethereum, Base, etc.)
 */
export function isEvm(identifier: string): boolean {
  const parsed = parseCaip10(identifier);
  return parsed.namespace === 'eip155';
}

/**
 * Extract raw address from CAIP-10 or legacy format
 */
export function extractAddress(identifier: string): string {
  const parsed = parseCaip10(identifier);
  return parsed.address;
}

/**
 * Normalize address to CAIP-10 format
 * If already CAIP-10, return as-is
 * If legacy, convert to CAIP-10
 */
export function normalizeToCaip10(
  address: string,
  defaultNamespace: string = 'solana',
  defaultChainId: string = '5eykt4GNfsw7SU33zdhhrELoMu3gFmT33EpFdpEfmgbf'
): string {
  try {
    const parsed = parseCaip10(address);
    // Already CAIP-10, return original
    if (address.includes(':')) {
      return address;
    }
    // Legacy format, convert
    return formatCaip10(parsed.namespace, parsed.chainId, parsed.address);
  } catch {
    // Failed to parse, assume it's a raw address
    return formatCaip10(defaultNamespace, defaultChainId, address);
  }
}

/**
 * Normalize a wallet identifier into a stable key for DB lookups/comparisons.
 *
 * Rules:
 * - eip155 CAIP-10: lowercase the 0x-address portion only
 * - raw 0x-address: lowercase
 * - solana CAIP-10 and raw base58: preserve case (base58 is case-sensitive)
 *
 * NOTE: This does NOT validate that the identifier is “real”, only normalizes formats.
 */
export function normalizeWalletIndexKey(value: string): string {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (raw.includes(":")) {
    const parts = raw.split(":");
    if (parts.length === 3) {
      const [namespace, chainId, address] = parts;
      if (namespace === "eip155" && /^0x[a-fA-F0-9]{40}$/.test(address)) {
        return `eip155:${chainId}:${address.toLowerCase()}`;
      }
      if (namespace === "solana") {
        // Preserve base58 case.
        return `solana:${chainId}:${address}`;
      }
    }
    return raw;
  }

  if (/^0x[a-fA-F0-9]{40}$/.test(raw)) return raw.toLowerCase();

  // Assume non-0x identifiers (e.g. solana base58) are case-sensitive; preserve.
  return raw;
}

/**
 * Build a small set of lookup keys to find wallet-linked records across legacy storage shapes.
 *
 * For example:
 * - eip155:8453:0xABC... -> [eip155:8453:0xabc..., 0xabc...]
 * - solana:<chain>:FiZy... -> [solana:<chain>:FiZy..., FiZy...]
 */
export function walletMatchKeys(value: string): string[] {
  const raw = String(value || "").trim();
  if (!raw) return [];

  const out = new Set<string>();
  const normalized = normalizeWalletIndexKey(raw);
  if (normalized) out.add(normalized);

  if (normalized.includes(":")) {
    const parts = normalized.split(":");
    if (parts.length === 3) {
      const [namespace, _chainId, address] = parts;
      if (namespace === "eip155" && /^0x[a-f0-9]{40}$/.test(address)) out.add(address);
      if (namespace === "solana") out.add(address);
    }
  }

  return Array.from(out);
}







