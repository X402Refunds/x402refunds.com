import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./test/e2e",
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    headless: true,
    baseURL: process.env.FRONTEND_BASE_URL || "http://127.0.0.1:3100",
  },
  reporter: [["list"]],
  webServer: process.env.FRONTEND_BASE_URL
    ? undefined
    : {
        command: "PORT=3100 pnpm --filter dashboard dev",
        url: "http://127.0.0.1:3100",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});

