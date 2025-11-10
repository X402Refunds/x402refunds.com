/**
 * Wagmi Configuration for Ethereum Wallet Connection
 * Used for X-402 agent claiming flow
 * 
 * NOTE: Config is created lazily to avoid SSR issues with indexedDB
 */

import { createConfig, http, type Config } from 'wagmi';
import { base, mainnet, polygon, arbitrum, optimism } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

let wagmiConfigInstance: Config | null = null;

/**
 * Get or create wagmi config (client-side only)
 * This prevents SSR errors with indexedDB
 */
export function getWagmiConfig(): Config {
  if (typeof window === 'undefined') {
    // Return a minimal config for SSR (won't be used)
    return createConfig({
      chains: [base],
      connectors: [],
      transports: { [base.id]: http() },
    }) as Config;
  }

  if (!wagmiConfigInstance) {
    wagmiConfigInstance = createConfig({
      chains: [base, mainnet, polygon, arbitrum, optimism],
      connectors: [
        injected(),
        walletConnect({ 
          projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'placeholder' 
        }),
      ],
      transports: {
        [base.id]: http(),
        [mainnet.id]: http(),
        [polygon.id]: http(),
        [arbitrum.id]: http(),
        [optimism.id]: http(),
      },
    });
  }

  return wagmiConfigInstance;
}

// Export for backward compatibility (but prefer getWagmiConfig)
export const wagmiConfig = getWagmiConfig();

