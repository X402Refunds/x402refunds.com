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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['convex/**/*.ts'],
      exclude: [
        'convex/_generated/**',
        'convex/**/*.test.ts',
        'convex/**/*.spec.ts',
        '**/*.d.ts',
        '**/node_modules/**',
        '**/dist/**',
      ],
      thresholds: {
        lines: 40,
        functions: 70,
        branches: 70,
        statements: 40,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './convex'),
      '@test': resolve(__dirname, './test'),
    },
  },
});
