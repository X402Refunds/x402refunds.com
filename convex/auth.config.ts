import { AuthConfig } from "convex/server";

/**
 * Clerk Authentication Configuration
 * 
 * IMPORTANT: Set CLERK_FRONTEND_API_URL in Convex Dashboard → Settings → Environment Variables
 * Format: https://your-app.clerk.accounts.dev (no trailing slash)
 * 
 * To find your Clerk domain:
 * 1. Go to Clerk Dashboard → API Keys
 * 2. Look for "Frontend API" URL
 * 3. Copy the full URL (e.g., https://national-treefrog-88.clerk.accounts.dev)
 * 4. Set it as CLERK_FRONTEND_API_URL in Convex Dashboard
 * 
 * Also ensure:
 * - JWT Template named "convex" exists in Clerk Dashboard → JWT Templates
 * - Template can be empty, but must exist
 */
const clerkDomain = process.env.CLERK_FRONTEND_API_URL || "https://national-treefrog-88.clerk.accounts.dev";

// Ensure the domain doesn't have a trailing slash
const normalizedDomain = clerkDomain.replace(/\/$/, "");

// Log the domain being used (for debugging - remove in production if needed)
if (!process.env.CLERK_FRONTEND_API_URL) {
  console.warn(`[Auth Config] Using fallback Clerk domain: ${normalizedDomain}. Set CLERK_FRONTEND_API_URL in Convex Dashboard for production.`);
}

export default {
  providers: [
    {
      domain: normalizedDomain,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;

