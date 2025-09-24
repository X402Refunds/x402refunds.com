import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for Convex static file serving
  output: 'export',
  
  // Configure base path to match Convex static mount at /app
  basePath: '/app',
  
  // Configure trailing slash for consistent URL handling
  trailingSlash: true,
  
  // Configure image optimization for static export
  images: {
    unoptimized: true,
  },
  
  // Ensure proper asset handling
  assetPrefix: process.env.NODE_ENV === 'production' ? '/app' : '',
};

export default nextConfig;
