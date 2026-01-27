import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from "next/server"

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',           // Landing page
  '/sign-in(.*)', // Sign-in pages
  '/sign-up(.*)', // Sign-up pages
  '/screenshots(.*)', // Public screenshot routes for marketing assets (no auth)
  // Top-ups use x402 payment proof; keep endpoint public to avoid www/apex session issues.
  '/api/billing/topup(.*)',
  // Wallet-first v1 (no-login) pages
  '/topup(.*)',
  '/disputes(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  // Redirect x402refunds.com to Loom video
  const host = request.headers.get("host") || ""
  if (host === "x402refunds.com" || host === "www.x402refunds.com") {
    return NextResponse.redirect("https://www.loom.com/share/84214facab4b4dcda3b7a3837680b787", 308)
  }

  // Protect all non-public routes
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}

