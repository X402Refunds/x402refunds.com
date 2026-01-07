import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

type VerificationKey = {
  merchant: string;
  origin: string;
  supportEmail: string;
};

function normalizeOrigin(origin: string): string | null {
  try {
    const u = new URL(origin);
    if (u.protocol !== "https:") return null;
    // Canonicalize to origin (drops path/query/hash)
    return u.origin;
  } catch {
    return null;
  }
}

export const getVerification = internalQuery({
  args: {
    merchant: v.string(),
    origin: v.string(),
    supportEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const origin = normalizeOrigin(args.origin);
    if (!origin) return null;
    return await ctx.db
      .query("merchantEmailVerifications")
      .withIndex("by_tuple", (q) =>
        q
          .eq("merchant", args.merchant)
          .eq("origin", origin)
          .eq("supportEmail", args.supportEmail),
      )
      .first();
  },
});

export const createOrReuseVerificationToken = internalMutation({
  args: {
    merchant: v.string(),
    origin: v.string(),
    supportEmail: v.string(),
    caseId: v.optional(v.id("cases")),
    // Optional: allow callers to force another email if needed.
    forceSend: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ token: string; shouldSend: boolean; origin: string }> => {
    const now = Date.now();
    const origin = normalizeOrigin(args.origin);
    if (!origin) {
      throw new Error("Invalid origin (must be https:// and parseable)");
    }

    const existing = await ctx.db
      .query("merchantEmailVerificationTokens")
      .withIndex("by_tuple", (q) =>
        q
          .eq("merchant", args.merchant)
          .eq("origin", origin)
          .eq("supportEmail", args.supportEmail),
      )
      .order("desc")
      .first();

    // If there’s an unexpired token, reuse it and only re-send at most once per hour (unless forced).
    if (
      existing &&
      !existing.confirmedAt &&
      existing.expiresAt > now &&
      typeof existing.token === "string"
    ) {
      // Track the latest dispute that triggered verification so we can send a separate dispute email after confirmation.
      if (args.caseId && (!existing.caseId || String(existing.caseId) !== String(args.caseId))) {
        await ctx.db.patch(existing._id, { caseId: args.caseId });
      }

      const canSend =
        Boolean(args.forceSend) ||
        !existing.lastSentAt ||
        now - existing.lastSentAt > 60 * 60 * 1000;

      if (canSend) {
        await ctx.db.patch(existing._id, { lastSentAt: now });
      }

      return { token: existing.token, shouldSend: canSend, origin };
    }

    const token = crypto.randomUUID();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days
    await ctx.db.insert("merchantEmailVerificationTokens", {
      token,
      merchant: args.merchant,
      origin,
      supportEmail: args.supportEmail,
      caseId: args.caseId,
      createdAt: now,
      lastSentAt: now,
      expiresAt,
    });

    return { token, shouldSend: true, origin };
  },
});

export const confirmVerificationToken = internalMutation({
  args: {
    token: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ ok: boolean; merchant?: string; origin?: string; supportEmail?: string; caseId?: string; reason?: string }> => {
    const now = Date.now();
    const rec = await ctx.db
      .query("merchantEmailVerificationTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!rec) return { ok: false, reason: "INVALID_TOKEN" };
    if (rec.confirmedAt) {
      return {
        ok: true,
        merchant: rec.merchant,
        origin: rec.origin,
        supportEmail: rec.supportEmail,
        caseId: rec.caseId ? String(rec.caseId) : undefined,
      };
    }
    if (rec.expiresAt <= now) return { ok: false, reason: "EXPIRED_TOKEN" };

    await ctx.db.patch(rec._id, { confirmedAt: now });

    const existing = await ctx.db
      .query("merchantEmailVerifications")
      .withIndex("by_tuple", (q) =>
        q
          .eq("merchant", rec.merchant)
          .eq("origin", rec.origin)
          .eq("supportEmail", rec.supportEmail),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { verifiedAt: now, updatedAt: now });
    } else {
      await ctx.db.insert("merchantEmailVerifications", {
        merchant: rec.merchant,
        origin: rec.origin,
        supportEmail: rec.supportEmail,
        verifiedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    return {
      ok: true,
      merchant: rec.merchant,
      origin: rec.origin,
      supportEmail: rec.supportEmail,
      caseId: rec.caseId ? String(rec.caseId) : undefined,
    };
  },
});

