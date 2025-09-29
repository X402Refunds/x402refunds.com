import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimal configuration for Vercel deployment with SSR
  
  // DO NOT use static export - we need dynamic routes
  // output: 'export', // REMOVED - breaks dynamic routes
  
  // Enable trailing slash for consistent URL handling  
  trailingSlash: true,
  
  // Image optimization - let Vercel handle it in production
  images: {
    // Only unoptimize for development if needed
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // Environment variables validation
  env: {
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
  },
};

export default nextConfig;
