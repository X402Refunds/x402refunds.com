/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove deprecated appDir option - it's now default in Next.js 14
  env: {
    CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
  },
}

module.exports = nextConfig
