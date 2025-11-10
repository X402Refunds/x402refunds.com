"use client"

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getWagmiConfig } from './wagmi';
import { useState, useEffect } from 'react';

/**
 * Client-only Wagmi Provider wrapper
 * Prevents SSR errors with indexedDB
 */
export function WagmiProviderWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
      },
    },
  }));

  // Only render wagmi after mount (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get config only on client side
  const config = mounted ? getWagmiConfig() : null;

  // Return children without wagmi during SSR
  if (!mounted || !config) {
    return <>{children}</>;
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

