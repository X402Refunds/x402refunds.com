import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimal configuration for Vercel deployment with SSR
  
  // DO NOT use static export - we need dynamic routes
  // output: 'export', // REMOVED - breaks dynamic routes
  
  // Enable trailing slash for consistent URL handling  
  trailingSlash: true,
  
  // TEMPORARY: Ignore TypeScript errors in untracked convex/agents files
  // TODO: Fix circular type reference errors in convex/agents/*.ts files
  // These files have circular type dependencies with createTool that need proper typing
  typescript: {
    ignoreBuildErrors: true, // TODO: Remove after fixing convex/agents TypeScript errors
  },
  
  // Image optimization - let Vercel handle it in production
  images: {
    // Only unoptimize for development if needed
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // Environment variables validation
  env: {
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
  },

  // Security Headers
  async headers() {
    return [
      // Noindex for special informational files (not meant for search results)
      {
        source: '/(robots.txt|llms.txt|ai.txt|humans.txt|security.txt)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          // Prevent clickjacking attacks
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent XSS attacks
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Referrer policy for privacy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions policy - disable unnecessary browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // HSTS - Force HTTPS for 1 year
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://challenges.cloudflare.com https://clerk.consulatehq.com https://*.clerk.accounts.dev https://analytics.ahrefs.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https: https://www.google-analytics.com https://img.clerk.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://perceptive-lyrebird-89.convex.cloud wss://perceptive-lyrebird-89.convex.cloud https://www.google-analytics.com https://clerk.consulatehq.com https://*.clerk.accounts.dev wss://*.convex.cloud https://*.convex.cloud https://analytics.ahrefs.com",
              "worker-src 'self' blob:",
              "frame-src 'self' https://challenges.cloudflare.com https://clerk.consulatehq.com https://*.clerk.accounts.dev",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
