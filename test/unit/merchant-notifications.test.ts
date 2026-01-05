import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";

describe("merchant notifications (unit)", () => {
  let t: ReturnType<typeof convexTest>;
  const originalFetch = globalThis.fetch;

  beforeAll(async () => {
    const modules = import.meta.glob("../../convex/**/*.{ts,js}");
    t = convexTest(schema, modules);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("does not email when x402.json merchant does not match case merchant (strict match)", async () => {
    // Mock x402.json fetch response (Resend is not expected to be called)
    globalThis.fetch = vi.fn(async (url: any) => {
      const u = String(url);
      if (u.includes("/.well-known/x402.json")) {
        return new Response(
          JSON.stringify({
            x402disputes: {
              merchant: "eip155:8453:0x0000000000000000000000000000000000000002",
              supportEmail: "disputes@merchant.com",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      // If anything tries to call Resend, fail the test.
      throw new Error(`Unexpected fetch: ${u}`);
    }) as any;

    const created = await t.mutation(api.pool.cases_fileWalletPaymentDispute, {
      buyer: "buyer:test",
      merchant: "eip155:8453:0x0000000000000000000000000000000000000001",
      merchantOrigin: "https://merchant.example",
      reason: "api_timeout",
      amountMicrousdc: "10000",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const res = await t.action(api.merchantNotifications.notifyMerchantDisputeFiled, {
      caseId: created.disputeId,
    });

    expect(res.ok).toBe(true);
    expect(res.emailed).toBe(false);
    expect(res.reason).toBe("MERCHANT_MISMATCH");
  });
});

