"use client";

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://perceptive-lyrebird-89.convex.cloud';

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
          if (!token) {
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
