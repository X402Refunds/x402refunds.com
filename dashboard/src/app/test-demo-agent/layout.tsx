"use client";

import { WagmiProviderWrapper } from "@/lib/wagmi-provider";

export default function TestDemoAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defensive wrapper: ensures wagmi hooks used by PaywallApp are always within a WagmiProvider
  // even if the root layout/provider boundary changes.
  return <WagmiProviderWrapper>{children}</WagmiProviderWrapper>;
}


