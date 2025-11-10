/**
 * Ethereum Utility Functions
 * Helpers for displaying addresses, transaction hashes, and blockchain explorer links
 */

export function truncateAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function truncateTxHash(hash: string): string {
  if (!hash) return '';
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

export function getExplorerUrl(chain: string, address: string): string {
  const explorers: Record<string, string> = {
    base: `https://basescan.org/address/${address}`,
    ethereum: `https://etherscan.io/address/${address}`,
    solana: `https://solscan.io/account/${address}`,
    polygon: `https://polygonscan.com/address/${address}`,
    arbitrum: `https://arbiscan.io/address/${address}`,
    optimism: `https://optimistic.etherscan.io/address/${address}`,
  };
  return explorers[chain] || '#';
}

export function getTransactionExplorerUrl(chain: string, hash: string): string {
  const explorers: Record<string, string> = {
    base: `https://basescan.org/tx/${hash}`,
    ethereum: `https://etherscan.io/tx/${hash}`,
    solana: `https://solscan.io/tx/${hash}`,
    polygon: `https://polygonscan.com/tx/${hash}`,
    arbitrum: `https://arbiscan.io/tx/${hash}`,
    optimism: `https://optimistic.etherscan.io/tx/${hash}`,
  };
  return explorers[chain] || '#';
}

export function getExplorerName(chain: string): string {
  const names: Record<string, string> = {
    base: 'Basescan',
    ethereum: 'Etherscan',
    solana: 'Solscan',
    polygon: 'Polygonscan',
    arbitrum: 'Arbiscan',
    optimism: 'Optimistic Etherscan',
  };
  return names[chain] || 'Explorer';
}

export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

