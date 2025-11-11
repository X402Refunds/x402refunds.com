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
  // Create a custom useAuth that ensures token is fetched with template
  const clerkAuth = useAuth();
  
  const auth = {
    ...clerkAuth,
    getToken: async () => {
      if (!clerkAuth.isSignedIn) return null;
      return await clerkAuth.getToken({ template: "convex" });
    },
  };
  
  // Debug: Log token retrieval for troubleshooting
  useEffect(() => {
    if (auth.isLoaded && auth.isSignedIn) {
      console.log('[Convex Auth] User is signed in, fetching token...');
      auth.getToken({ template: "convex" })
        .then((token) => {
          if (!token) {
            console.warn('[Convex Auth] No token retrieved - check Clerk JWT template "convex"');
          } else {
            console.log('[Convex Auth] Token retrieved successfully');
          }
        })
        .catch((error) => {
          console.error('[Convex Auth] Error getting token:', error);
        });
    } else if (auth.isLoaded) {
      console.log('[Convex Auth] User not signed in');
    }
  }, [auth]);

  // Gate ConvexProvider on isLoaded to prevent auth issues
  if (!auth.isLoaded) {
    return <div>Loading...</div>;
  }

  // Return a custom useAuth function that ensures template is used
  const useAuthWithTemplate = () => auth;

  return (
    <ConvexProviderWithClerk 
      client={convex} 
      useAuth={useAuthWithTemplate}
    >
      {children}
    </ConvexProviderWithClerk>
  );
}
