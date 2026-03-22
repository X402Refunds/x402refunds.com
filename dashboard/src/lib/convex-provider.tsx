'use client'

import { ReactNode } from 'react'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { useAuth } from '@clerk/nextjs'

// Keep a provider tree available during local builds even when env is missing.
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL ?? 'https://placeholder.convex.cloud')
const hasClerkPublishableKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)

function ClerkEnabledConvexProvider({ children }: { children: ReactNode }) {
  // Public pages should not block on Clerk loading. When Clerk isn't ready,
  // fall back to an unauthenticated ConvexProvider so public queries can resolve.
  const auth = useAuth()
  if (!auth.isLoaded) {
    return <ConvexProvider client={convex}>{children}</ConvexProvider>
  }
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  )
}

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!hasClerkPublishableKey) {
    return <ConvexProvider client={convex}>{children}</ConvexProvider>
  }

  return <ClerkEnabledConvexProvider>{children}</ClerkEnabledConvexProvider>
}
