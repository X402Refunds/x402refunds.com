import { describe, it, expect, beforeAll } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { internal } from "../../convex/_generated/api";

describe("merchant email verification (unit)", () => {
  let t: ReturnType<typeof convexTest>;

  beforeAll(async () => {
    const modules = import.meta.glob("../../convex/**/*.{ts,js}");
    t = convexTest(schema, modules);
  });

  it("returns newlyConfirmed only for the first successful confirmation", async () => {
    const now = Date.now();
    const token = "tok_test_verify";
    const merchant = "eip155:8453:0x0000000000000000000000000000000000000001";
    const origin = "https://merchant.example";
    const supportEmail = "support@merchant.example";

    await t.run(async (ctx) => {
      await ctx.db.insert("merchantEmailVerificationTokens", {
        token,
        merchant,
        origin,
        supportEmail,
        createdAt: now,
        lastSentAt: now,
        expiresAt: now + 60_000,
      } as any);
    });

    const first = await t.mutation(internal.merchantEmailVerification.confirmVerificationToken, { token });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.newlyConfirmed).toBe(true);

    const second = await t.mutation(internal.merchantEmailVerification.confirmVerificationToken, { token });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.newlyConfirmed).toBe(false);
  });
});

