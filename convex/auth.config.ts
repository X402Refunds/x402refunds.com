import { AuthConfig } from "convex/server";

/**
 * Clerk Authentication Configuration
 * 
 * IMPORTANT: Set CLERK_JWT_ISSUER_DOMAIN in Convex Dashboard → Settings → Environment Variables
 * This should match the "Issuer" field in your Clerk JWT template
 * 
 * Format: https://clerk.yourdomain.com (no trailing slash)
 * 
 * Also ensure:
 * - JWT Template named "convex" exists in Clerk Dashboard → JWT Templates
 * - Template has "aud": "convex" in the claims
 */
const clerkDomain = process.env.CLERK_JWT_ISSUER_DOMAIN || "https://clerk.x402refunds.com";

// Ensure the domain doesn't have a trailing slash
const normalizedDomain = clerkDomain.replace(/\/$/, "");

// Log the domain being used (for debugging)
console.log(`[Auth Config] Clerk JWT issuer domain: ${normalizedDomain}`);
if (!process.env.CLERK_JWT_ISSUER_DOMAIN) {
  console.warn(`[Auth Config] ⚠️ Using fallback domain. Set CLERK_JWT_ISSUER_DOMAIN in Convex Dashboard`);
}

export default {
  providers: [
    {
      domain: normalizedDomain,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;

