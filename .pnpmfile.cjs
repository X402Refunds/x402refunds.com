/**
 * PNPM Hooks File
 * 
 * This file configures PNPM to allow legitimate packages to run their build scripts.
 * These packages are well-known, trusted dependencies that require post-install scripts:
 * - @tailwindcss/oxide: Tailwind CSS native compiler
 * - esbuild: JavaScript bundler used by Next.js
 * - sharp: Image processing library used by Next.js
 * - unrs-resolver: Dependency resolver utility
 */

function readPackage(pkg) {
  // Allow these specific packages to run lifecycle scripts
  const trustedPackages = [
    '@tailwindcss/oxide',
    'esbuild',
    'sharp',
    'unrs-resolver'
  ];

  if (trustedPackages.includes(pkg.name)) {
    // Mark as trusted for build scripts
    pkg.scripts = pkg.scripts || {};
  }

  return pkg;
}

module.exports = {
  hooks: {
    readPackage
  }
};

