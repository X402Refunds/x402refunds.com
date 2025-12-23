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







