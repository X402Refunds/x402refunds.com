import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.{idea,git,cache,output,temp}/**'],
    testTimeout: 10000,
    setupFiles: ['./test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './convex'),
      '@test': resolve(__dirname, './test'),
    },
  },
});
