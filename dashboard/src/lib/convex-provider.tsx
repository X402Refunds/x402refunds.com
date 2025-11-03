"use client";

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

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
  const auth = useAuth();
  
  // Debug: Log token retrieval for troubleshooting
  useEffect(() => {
    if (auth.isLoaded && auth.isSignedIn) {
      auth.getToken({ template: "convex" })
        .then((token) => {
          if (token) {
            console.log('[Convex Auth] Token retrieved successfully');
            // Decode token to verify issuer (just for debugging)
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              console.log('[Convex Auth] Token issuer:', payload.iss);
              console.log('[Convex Auth] Token application ID:', payload.azp);
            } catch {
              // Ignore decode errors
            }
          } else {
            console.warn('[Convex Auth] No token retrieved - check Clerk JWT template "convex"');
          }
        })
        .catch((error) => {
          console.error('[Convex Auth] Error getting token:', error);
        });
    }
  }, [auth]);

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
