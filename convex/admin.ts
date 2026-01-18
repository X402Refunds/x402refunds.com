import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
// Avoid deep type instantiation in downstream TS projects.
const { internal } = require("./_generated/api") as any;

function normalizeDomain(input: string): string {
  const s = input.trim().toLowerCase();
  return s.replace(/^@/, "");
}

function createApiKeyString(prefix: "csk_live_" | "csk_test_"): string {
  const random = crypto.randomUUID().replace(/-/g, "");
  return `${prefix}${random}`;
}

function requireAdminTokenOrThrow(token: string) {
  const expected = process.env.ADMIN_SETUP_TOKEN;
  if (!expected || !expected.trim()) {
    throw new Error("ADMIN_SETUP_TOKEN is not configured");
  }
  if (!token || token.trim() !== expected.trim()) {
    throw new Error("UNAUTHORIZED");
  }
}

export const adminCreateOrganization = mutation({
  args: {
    adminToken: v.string(),
    name: v.string(),
    domain: v.optional(v.string()),
    billingEmail: v.optional(v.string()),
    // Convenience: initialize refund credits immediately (off-chain).
    initialCreditUsdc: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    requireAdminTokenOrThrow(args.adminToken);

    const name = args.name.trim();
    if (!name) throw new Error("name is required");

    const domain = typeof args.domain === "string" && args.domain.trim() ? normalizeDomain(args.domain) : undefined;
    if (domain) {
      const existing = await ctx.db
        .query("organizations")
        .withIndex("by_domain", (q) => q.eq("domain", domain))
        .first();
      if (existing) {
        throw new Error(`Organization already exists for domain: ${domain}`);
      }
    }

    const now = Date.now();
    const orgId = await ctx.db.insert("organizations", {
      name,
      domain,
      billingEmail: args.billingEmail?.trim() || undefined,
      verified: true,
      verifiedAt: now,
      createdAt: now,
    });

    // Ensure credits row exists, then enable + optionally add an initial top-up.
    await ctx.runMutation(internal.refundCredits.ensureOrgRefundCredits, { organizationId: orgId });
    const credits = await ctx.db
      .query("orgRefundCredits")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .first();
    if (!credits) throw new Error("Failed to create orgRefundCredits row");

    const initialMicros =
      typeof args.initialCreditUsdc === "number" && Number.isFinite(args.initialCreditUsdc) && args.initialCreditUsdc > 0
        ? Math.floor(args.initialCreditUsdc * 1_000_000)
        : 0;

    await ctx.db.patch(credits._id, {
      enabled: true,
      topUpMicrousdc: (credits.topUpMicrousdc || 0) + initialMicros,
      updatedAt: now,
    });

    // Create default API keys for the org (no user required; createdBy is optional).
    const productionKey = createApiKeyString("csk_live_");
    const developmentKey = createApiKeyString("csk_live_");

    await ctx.db.insert("apiKeys", {
      key: productionKey,
      organizationId: orgId,
      name: "Production",
      status: "active",
      createdAt: now,
    });
    await ctx.db.insert("apiKeys", {
      key: developmentKey,
      organizationId: orgId,
      name: "Development",
      status: "active",
      createdAt: now,
    });

    return {
      ok: true as const,
      organizationId: orgId,
      apiKeys: {
        production: productionKey,
        development: developmentKey,
      },
    };
  },
});

export const adminGrantOrganizationCredits = mutation({
  args: {
    adminToken: v.string(),
    organizationId: v.id("organizations"),
    amountUsdc: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireAdminTokenOrThrow(args.adminToken);

    if (!Number.isFinite(args.amountUsdc) || args.amountUsdc <= 0) {
      throw new Error("amountUsdc must be > 0");
    }
    const amountMicros = Math.floor(args.amountUsdc * 1_000_000);

    await ctx.runMutation(internal.refundCredits.ensureOrgRefundCredits, { organizationId: args.organizationId });
    const credits = await ctx.db
      .query("orgRefundCredits")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .first();
    if (!credits) throw new Error("Credits row not found");

    const now = Date.now();
    await ctx.db.patch(credits._id, {
      enabled: true,
      topUpMicrousdc: (credits.topUpMicrousdc || 0) + amountMicros,
      updatedAt: now,
    });

    // Best-effort audit note via events table if it exists in this schema evolution.
    try {
      await ctx.db.insert("events", {
        type: "ADMIN_ORG_CREDITS_GRANTED",
        timestamp: now,
        caseId: undefined,
        agentDid: "admin",
        payload: {
          organizationId: String(args.organizationId),
          amountUsdc: args.amountUsdc,
          note: args.note || null,
        },
      } as any);
    } catch {
      // ignore
    }

    return { ok: true as const };
  },
});

export const adminGetOrganizationByDomain = query({
  args: { adminToken: v.string(), domain: v.string() },
  handler: async (ctx, args) => {
    requireAdminTokenOrThrow(args.adminToken);
    const domain = normalizeDomain(args.domain);
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_domain", (q) => q.eq("domain", domain))
      .first();
    if (!org) return { ok: false as const, code: "NOT_FOUND" as const };
    return { ok: true as const, organization: org };
  },
});

