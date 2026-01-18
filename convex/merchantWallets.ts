import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { normalizeWalletIndexKey } from "./lib/caip10";

/**
 * Read-only lookup of a merchant wallet mapping.
 * Used by intake flows to route cases to the liable organization and seller profile.
 */
export const getMerchantWalletMapping = internalQuery({
  args: { walletCaip10: v.string() },
  handler: async (ctx, args) => {
    const wallet = normalizeWalletIndexKey(args.walletCaip10);
    if (!wallet) return null;
    return await ctx.db
      .query("merchantWallets")
      .withIndex("by_wallet", (q) => q.eq("walletCaip10", wallet))
      .first();
  },
});

/**
 * Upsert a merchant profile + wallet mapping for a liable organization.
 * Intended for marketplaces/proxies that want to register supported payTo routes.
 */
export const upsertMerchantProfileAndWallet = internalMutation({
  args: {
    liableOrganizationId: v.id("organizations"),
    walletCaip10: v.string(),
    notificationEmail: v.optional(v.string()),
    name: v.optional(v.string()),
    isPrimary: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const wallet = normalizeWalletIndexKey(args.walletCaip10);
    if (!wallet || !wallet.includes(":")) {
      throw new Error("walletCaip10 must be a CAIP-10 identifier");
    }

    // If wallet already mapped, patch profile fields best-effort and keep liability stable.
    const existing = await ctx.db
      .query("merchantWallets")
      .withIndex("by_wallet", (q) => q.eq("walletCaip10", wallet))
      .first();

    const email = typeof args.notificationEmail === "string" && args.notificationEmail.trim() ? args.notificationEmail.trim() : undefined;
    const name = typeof args.name === "string" && args.name.trim() ? args.name.trim() : undefined;

    if (existing) {
      // If this wallet is already mapped to a different org, refuse (prevents hijacking).
      if (String(existing.liableOrganizationId) !== String(args.liableOrganizationId)) {
        throw new Error("Wallet is already mapped to a different liable organization");
      }

      // Patch profile details if provided.
      if (email || name) {
        await ctx.db.patch(existing.merchantProfileId, {
          ...(email ? { notificationEmail: email } : {}),
          ...(name ? { name } : {}),
          updatedAt: now,
        });
      }

      await ctx.db.patch(existing._id, {
        ...(typeof args.isPrimary === "boolean" ? { isPrimary: args.isPrimary } : {}),
        updatedAt: now,
      });

      return { ok: true as const, merchantWalletId: existing._id, merchantProfileId: existing.merchantProfileId, walletCaip10: wallet, created: false as const };
    }

    // Reuse an existing merchant profile for this org+email when possible.
    let merchantProfileId: any = null;
    if (email) {
      const existingProfile = await ctx.db
        .query("merchantProfiles")
        .withIndex("by_notification_email", (q) => q.eq("notificationEmail", email))
        .filter((q) => q.eq(q.field("organizationId"), args.liableOrganizationId))
        .first();
      if (existingProfile?._id) {
        merchantProfileId = existingProfile._id;
        // Best-effort: keep name up to date if provided.
        if (name && existingProfile.name !== name) {
          await ctx.db.patch(existingProfile._id, { name, updatedAt: now });
        }
      }
    }

    if (!merchantProfileId) {
      // Create a new merchant profile (scoped to org) and map the wallet.
      merchantProfileId = await ctx.db.insert("merchantProfiles", {
        ...(name ? { name } : {}),
        ...(email ? { notificationEmail: email } : {}),
        organizationId: args.liableOrganizationId,
        createdAt: now,
        updatedAt: now,
      });
    }

    const merchantWalletId = await ctx.db.insert("merchantWallets", {
      walletCaip10: wallet,
      merchantProfileId,
      liableOrganizationId: args.liableOrganizationId,
      ...(typeof args.isPrimary === "boolean" ? { isPrimary: args.isPrimary } : {}),
      createdAt: now,
      updatedAt: now,
    });

    return { ok: true as const, merchantWalletId, merchantProfileId, walletCaip10: wallet, created: true as const };
  },
});

