"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://perceptive-lyrebird-89.convex.cloud';

// Debug logging
if (typeof window !== 'undefined') {
  console.log('[Convex] Initializing with URL:', convexUrl);
  console.log('[Convex] Environment variable:', process.env.NEXT_PUBLIC_CONVEX_URL);
}

const convex = new ConvexReactClient(convexUrl);

export default function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
