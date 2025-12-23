"use client"

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getWagmiConfig } from './wagmi';
import { useState } from 'react';

/**
 * Client-only Wagmi Provider wrapper
 * Prevents SSR errors with indexedDB
 */
export function WagmiProviderWrapper({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
      },
    },
  }));

  // IMPORTANT:
  // Client Components are still pre-rendered on the server in Next.js.
  // If we ever render children without a WagmiProvider, any component that calls
  // wagmi hooks (useAccount/useWalletClient/etc) will throw:
  // "WagmiProviderNotFoundError: `useConfig` must be used within `WagmiProvider`."
  //
  // `getWagmiConfig()` already returns an SSR-safe minimal config when `window`
  // is undefined, so we can always mount the provider.
  const config = getWagmiConfig();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

