import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  // Backend + HTTP tests
  "./vitest.config.ts",
  // Dashboard DOM/component tests
  "./dashboard/vitest.config.ts",
]);

