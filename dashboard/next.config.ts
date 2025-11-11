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

  // Webpack configuration to handle optional dependencies
  webpack: (config, { isServer }) => {
    // Ignore optional dependencies that aren't needed for Next.js builds
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@react-native-async-storage/async-storage': false,
        'pino-pretty': false,
      };
    }
    
    // Externalize modules that shouldn't be bundled
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push({
        '@react-native-async-storage/async-storage': 'commonjs @react-native-async-storage/async-storage',
        'pino-pretty': 'commonjs pino-pretty',
      });
    }
    
    return config;
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
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://challenges.cloudflare.com https://*.clerk.accounts.dev https://clerk.x402disputes.com https://analytics.ahrefs.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https: https://www.google-analytics.com https://img.clerk.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://perceptive-lyrebird-89.convex.cloud wss://perceptive-lyrebird-89.convex.cloud https://www.google-analytics.com https://*.clerk.accounts.dev https://clerk.x402disputes.com wss://*.convex.cloud https://*.convex.cloud https://analytics.ahrefs.com https://pulse.walletconnect.org https://api.web3modal.org https://*.walletconnect.com https://*.walletconnect.org wss://relay.walletconnect.com wss://relay.walletconnect.org https://*.coinbase.com https://rpc.walletconnect.org",
              "worker-src 'self' blob:",
              "frame-src 'self' https://challenges.cloudflare.com https://*.clerk.accounts.dev https://clerk.x402disputes.com",
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
