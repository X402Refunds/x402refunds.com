import { describe, it, expect, beforeAll } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { internal } from "../../convex/_generated/api";

describe("topup actionToken validation (unit)", () => {
  let t: ReturnType<typeof convexTest>;

  beforeAll(async () => {
    const modules = import.meta.glob("../../convex/**/*.{ts,js}");
    t = convexTest(schema, modules);
  });

  it("returns INVALID_ACTION_TOKEN for unknown token", async () => {
    const res = await t.query((internal as any).merchantEmailActions.validateTokenContextForTopup, {
      token: "tok_missing",
      merchant: "eip155:8453:0x00000000000000000000000000000000000000aa",
      caseId: "k_missing_case",
    });
    expect(res?.ok).toBe(false);
    expect(res?.code).toBe("INVALID_ACTION_TOKEN");
  });

  it("returns ACTION_TOKEN_EXPIRED when token expired", async () => {
    const now = Date.now();
    const merchant = "eip155:8453:0x00000000000000000000000000000000000000aa";
    const caseId = await t.run(async (ctx) => {
      return await ctx.db.insert("cases", {
        plaintiff: "buyer:test",
        defendant: merchant,
        status: "FILED",
        type: "PAYMENT",
        filedAt: now,
        description: "expired token test",
        amount: 0.01,
        currency: "USDC",
        evidenceIds: [],
        createdAt: now,
      } as any);
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("merchantEmailActionTokens", {
        token: "tok_expired",
        caseId,
        merchant,
        origin: "https://merchant.example",
        supportEmail: "support@merchant.example",
        action: "APPROVE_FULL_REFUND",
        refundAmountMicrousdc: 10_000,
        createdAt: now,
        expiresAt: now - 1,
      } as any);
    });

    const res = await t.query((internal as any).merchantEmailActions.validateTokenContextForTopup, {
      token: "tok_expired",
      merchant,
      caseId: String(caseId),
    });
    expect(res?.ok).toBe(false);
    expect(res?.code).toBe("ACTION_TOKEN_EXPIRED");
  });

  it("returns ACTION_TOKEN_USED when token already used", async () => {
    const now = Date.now();
    const merchant = "eip155:8453:0x00000000000000000000000000000000000000aa";
    const caseId = await t.run(async (ctx) => {
      return await ctx.db.insert("cases", {
        plaintiff: "buyer:test",
        defendant: merchant,
        status: "FILED",
        type: "PAYMENT",
        filedAt: now,
        description: "used token test",
        amount: 0.01,
        currency: "USDC",
        evidenceIds: [],
        createdAt: now,
      } as any);
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("merchantEmailActionTokens", {
        token: "tok_used",
        caseId,
        merchant,
        origin: "https://merchant.example",
        supportEmail: "support@merchant.example",
        action: "APPROVE_FULL_REFUND",
        refundAmountMicrousdc: 10_000,
        createdAt: now,
        expiresAt: now + 60_000,
        usedAt: now,
      } as any);
    });

    const res = await t.query((internal as any).merchantEmailActions.validateTokenContextForTopup, {
      token: "tok_used",
      merchant,
      caseId: String(caseId),
    });
    expect(res?.ok).toBe(false);
    expect(res?.code).toBe("ACTION_TOKEN_USED");
  });

  it("returns ACTION_TOKEN_MERCHANT_MISMATCH when merchant differs", async () => {
    const now = Date.now();
    const merchant = "eip155:8453:0x00000000000000000000000000000000000000aa";
    const otherMerchant = "eip155:8453:0x00000000000000000000000000000000000000bb";
    const caseId = await t.run(async (ctx) => {
      return await ctx.db.insert("cases", {
        plaintiff: "buyer:test",
        defendant: merchant,
        status: "FILED",
        type: "PAYMENT",
        filedAt: now,
        description: "merchant mismatch test",
        amount: 0.01,
        currency: "USDC",
        evidenceIds: [],
        createdAt: now,
      } as any);
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("merchantEmailActionTokens", {
        token: "tok_mm",
        caseId,
        merchant,
        origin: "https://merchant.example",
        supportEmail: "support@merchant.example",
        action: "APPROVE_FULL_REFUND",
        refundAmountMicrousdc: 10_000,
        createdAt: now,
        expiresAt: now + 60_000,
      } as any);
    });

    const res = await t.query((internal as any).merchantEmailActions.validateTokenContextForTopup, {
      token: "tok_mm",
      merchant: otherMerchant,
      caseId: String(caseId),
    });
    expect(res?.ok).toBe(false);
    expect(res?.code).toBe("ACTION_TOKEN_MERCHANT_MISMATCH");
  });

  it("returns ACTION_TOKEN_CASE_MISMATCH when case differs", async () => {
    const now = Date.now();
    const merchant = "eip155:8453:0x00000000000000000000000000000000000000aa";
    const caseA = await t.run(async (ctx) => {
      return await ctx.db.insert("cases", {
        plaintiff: "buyer:test",
        defendant: merchant,
        status: "FILED",
        type: "PAYMENT",
        filedAt: now,
        description: "case mismatch A",
        amount: 0.01,
        currency: "USDC",
        evidenceIds: [],
        createdAt: now,
      } as any);
    });
    const caseB = await t.run(async (ctx) => {
      return await ctx.db.insert("cases", {
        plaintiff: "buyer:test",
        defendant: merchant,
        status: "FILED",
        type: "PAYMENT",
        filedAt: now,
        description: "case mismatch B",
        amount: 0.01,
        currency: "USDC",
        evidenceIds: [],
        createdAt: now,
      } as any);
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("merchantEmailActionTokens", {
        token: "tok_cm",
        caseId: caseA,
        merchant,
        origin: "https://merchant.example",
        supportEmail: "support@merchant.example",
        action: "APPROVE_FULL_REFUND",
        refundAmountMicrousdc: 10_000,
        createdAt: now,
        expiresAt: now + 60_000,
      } as any);
    });

    const res = await t.query((internal as any).merchantEmailActions.validateTokenContextForTopup, {
      token: "tok_cm",
      merchant,
      caseId: String(caseB),
    });
    expect(res?.ok).toBe(false);
    expect(res?.code).toBe("ACTION_TOKEN_CASE_MISMATCH");
  });

  it("returns ok for matching merchant + case", async () => {
    const now = Date.now();
    const merchant = "eip155:8453:0x00000000000000000000000000000000000000aa";
    const caseId = await t.run(async (ctx) => {
      return await ctx.db.insert("cases", {
        plaintiff: "buyer:test",
        defendant: merchant,
        status: "FILED",
        type: "PAYMENT",
        filedAt: now,
        description: "ok token test",
        amount: 0.01,
        currency: "USDC",
        evidenceIds: [],
        createdAt: now,
      } as any);
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("merchantEmailActionTokens", {
        token: "tok_ok",
        caseId,
        merchant,
        origin: "https://merchant.example",
        supportEmail: "support@merchant.example",
        action: "APPROVE_FULL_REFUND",
        refundAmountMicrousdc: 10_000,
        createdAt: now,
        expiresAt: now + 60_000,
      } as any);
    });

    const res = await t.query((internal as any).merchantEmailActions.validateTokenContextForTopup, {
      token: "tok_ok",
      merchant,
      caseId: String(caseId),
    });
    expect(res?.ok).toBe(true);
  });
});

