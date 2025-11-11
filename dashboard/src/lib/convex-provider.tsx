"use client";

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://perceptive-lyrebird-89.convex.cloud';

console.log('[Convex] Connecting to:', convexUrl);

const convex = new ConvexReactClient(convexUrl, {
  verbose: true, // Enable verbose logging for debugging
  onServerDisconnectError: (message) => {
    console.error('[Convex] WebSocket disconnect error:', message);
  },
});

export default function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  
  // Gate ConvexProvider on isLoaded to prevent auth race condition
  if (!isLoaded) {
    console.log('[Convex] Waiting for Clerk to load...');
    return <div>Loading...</div>;
  }

  console.log('[Convex] Clerk loaded, isSignedIn:', isSignedIn);

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
