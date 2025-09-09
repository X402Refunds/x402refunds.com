"use client";

import { ConvexProvider as BaseConvexProvider } from "convex/react";
import { ConvexReactClient } from "convex/react";

// Handle missing environment variable gracefully for CI builds
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function ConvexProvider({ children }: { children: React.ReactNode }) {
  // If no Convex URL (e.g., during CI build), render without provider
  if (!convex) {
    return <>{children}</>;
  }
  
  return <BaseConvexProvider client={convex}>{children}</BaseConvexProvider>;
}
