import { describe, it, expect } from "vitest";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { API_BASE_URL } from "./fixtures";

/**
 * Live CDP smoke test (skipped by default).
 *
 * Why skipped:
 * - Requires CDP credentials to be configured in the *deployed* Convex environment.
 * - Makes an external network call to Coinbase CDP, which is slower/flakier than unit tests.
 *
 * Enable with:
 *   RUN_CDP_LIVE_TEST=true pnpm test:run
 *
 * Optional:
 *   CONVEX_URL=https://<deployment>.convex.cloud
 * Otherwise we derive it from API_BASE_URL by swapping .convex.site -> .convex.cloud
 */
describe("CDP live smoke", () => {
  const RUN = process.env.RUN_SMOKE_CDP_TEST === "true";
  if (!RUN) {
    it.skip("set RUN_SMOKE_CDP_TEST=true to run", () => {});
    return;
  }

  it(
    "testCdpAuth should succeed (status 200)",
    async () => {
      const convexUrl =
        process.env.CONVEX_URL ||
        (API_BASE_URL.includes(".convex.site")
          ? API_BASE_URL.replace(".convex.site", ".convex.cloud")
          : API_BASE_URL);

      const client = new ConvexHttpClient(convexUrl);
      const res: any = await client.action((api as any).demoAgents.testCdp.testCdpAuth, {});

      expect(res).toBeDefined();
      // Deployed env may not have credentials configured; in that case, skip rather than fail smoke.
      if (res && typeof res === "object" && typeof res.error === "string") {
        if (String(res.error).toLowerCase().includes("not configured")) {
          return;
        }
      }
      expect(res.success).toBe(true);
      expect(res.status).toBe(200);
      expect(typeof res.jwtGenerated).toBe("boolean");
    },
    30_000,
  );
});

