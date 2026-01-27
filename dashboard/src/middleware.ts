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
  const host = request.nextUrl.hostname
  const pathname = request.nextUrl.pathname
  const isRefundsHost = host === "x402refunds.com" || host === "www.x402refunds.com"

  if (isRefundsHost && (pathname === "/founder-intro" || pathname === "/founder-intro/")) {
    return NextResponse.redirect("https://www.loom.com/share/84214facab4b4dcda3b7a3837680b787", 308)
  }

  // Force canonical host so /topup works even if one hostname points at a stale deployment.
  // Canonical host: apex (no www)
  if (host === "www.x402refunds.com") {
    const url = request.nextUrl.clone()
    url.host = "x402refunds.com"
    url.protocol = "https:"
    return NextResponse.redirect(url, 308)
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
