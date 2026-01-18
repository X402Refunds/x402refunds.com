import { internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import * as apiMod from "./_generated/api.js";

// Avoid TS2589 by importing generated API as JS and treating as any.
const internal: any = (apiMod as any).internal;

function normalizeEmail(s: string): string {
  return s.trim().toLowerCase();
}

async function requireAdminForOrg(
  ctx: any,
  organizationId: any,
): Promise<{ user: any }> {
  const identity = await ctx.auth.getUserIdentity();
  const clerkUserId = identity?.subject;
  if (!clerkUserId) throw new Error("UNAUTHORIZED");

  const orgIdFromIdentity =
    (identity as any)?.orgId ?? (identity as any)?.organizationId ?? (identity as any)?.org ?? null;
  const orgRoleFromIdentity =
    (identity as any)?.orgRole ?? (identity as any)?.organizationRole ?? (identity as any)?.role ?? null;

  // Best-effort: allow Clerk org admins even if our local `users` row hasn't been promoted yet.
  const isIdentityAdmin =
    typeof orgRoleFromIdentity === "string" &&
    (orgRoleFromIdentity === "org:admin" || orgRoleFromIdentity === "admin");
  const isIdentityInOrg = orgIdFromIdentity ? String(orgIdFromIdentity) === String(organizationId) : false;

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_user_id", (q: any) => q.eq("clerkUserId", clerkUserId))
    .first();

  const isUserInOrg = user?.organizationId ? String(user.organizationId) === String(organizationId) : false;
  const isUserAdmin = user?.role === "admin";

  // If we have a user row, require org membership; admin can come from either local role or Clerk org role.
  // If we don't have a user row yet, fall back to identity org role + org match.
  const inOrg = user ? isUserInOrg : isIdentityInOrg;
  const isAdmin = user ? (isUserAdmin || isIdentityAdmin) : isIdentityAdmin;

  if (!inOrg) throw new Error("FORBIDDEN");
  if (!isAdmin) throw new Error("FORBIDDEN");

  return { user: user ?? null };
}

export const getPartnerProgramByCanonicalEmailInternal = internalQuery({
  args: { canonicalEmail: v.string() },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.canonicalEmail);
    if (!email) return null;
    return await ctx.db
      .query("partnerPrograms")
      .withIndex("by_canonical_email", (q: any) => q.eq("canonicalEmail", email))
      .first();
  },
});

export const getPartnerProgramByIdInternal = internalQuery({
  args: { partnerProgramId: v.id("partnerPrograms") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.partnerProgramId);
  },
});

export const getPartnerProgram = query({
  args: { organizationId: v.id("organizations"), partnerKey: v.string() },
  handler: async (ctx, args) => {
    const key = (args.partnerKey || "").trim();
    if (!key) return { ok: false as const, code: "INVALID_REQUEST" as const, message: "partnerKey is required" };

    try {
      await requireAdminForOrg(ctx, args.organizationId);
    } catch (e: any) {
      const msg = e?.message ? String(e.message) : String(e);
      const code = msg === "UNAUTHORIZED" ? "UNAUTHORIZED" : "FORBIDDEN";
      return { ok: false as const, code, message: msg };
    }

    const partnerProgram = await ctx.db
      .query("partnerPrograms")
      .withIndex("by_org_key", (q: any) =>
        q.eq("liableOrganizationId", args.organizationId).eq("partnerKey", key),
      )
      .first();

    return { ok: true as const, partnerProgram: partnerProgram ?? null };
  },
});

export const upsertPartnerProgram = mutation({
  args: {
    organizationId: v.id("organizations"),
    partnerKey: v.string(),
    canonicalEmail: v.string(),
    enabled: v.boolean(),
    autoDecideEnabled: v.boolean(),
    autoExecuteEnabled: v.boolean(),
    maxAutoRefundMicrousdc: v.number(),
    platformOpsEmail: v.string(),
    partnerOpsEmail: v.string(),
    protectedEndpointsMode: v.union(v.literal("noop_true_poc")),
    broadcastUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdminForOrg(ctx, args.organizationId);

    const partnerKey = (args.partnerKey || "").trim();
    if (!partnerKey) throw new Error("partnerKey is required");

    const canonicalEmail = normalizeEmail(args.canonicalEmail);
    if (!canonicalEmail) throw new Error("canonicalEmail is required");

    const platformOpsEmail = normalizeEmail(args.platformOpsEmail);
    const partnerOpsEmail = normalizeEmail(args.partnerOpsEmail);
    if (!platformOpsEmail) throw new Error("platformOpsEmail is required");
    if (!partnerOpsEmail) throw new Error("partnerOpsEmail is required");

    if (!Number.isSafeInteger(args.maxAutoRefundMicrousdc) || args.maxAutoRefundMicrousdc <= 0) {
      throw new Error("maxAutoRefundMicrousdc must be a positive integer");
    }

    // Enforce uniqueness of canonicalEmail across partner programs (best-effort).
    const existingByEmail = await ctx.db
      .query("partnerPrograms")
      .withIndex("by_canonical_email", (q: any) => q.eq("canonicalEmail", canonicalEmail))
      .first();
    if (
      existingByEmail &&
      (String(existingByEmail.liableOrganizationId) !== String(args.organizationId) ||
        String(existingByEmail.partnerKey) !== String(partnerKey))
    ) {
      throw new Error("canonicalEmail is already in use by another partner program");
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("partnerPrograms")
      .withIndex("by_org_key", (q: any) =>
        q.eq("liableOrganizationId", args.organizationId).eq("partnerKey", partnerKey),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        canonicalEmail,
        enabled: args.enabled,
        autoDecideEnabled: args.autoDecideEnabled,
        autoExecuteEnabled: args.autoExecuteEnabled,
        maxAutoRefundMicrousdc: args.maxAutoRefundMicrousdc,
        platformOpsEmail,
        partnerOpsEmail,
        protectedEndpointsMode: args.protectedEndpointsMode,
        broadcastUrl: typeof args.broadcastUrl === "string" && args.broadcastUrl.trim() ? args.broadcastUrl.trim() : undefined,
        updatedAt: now,
      });

      // Backstop: ensure org refund cap is at most this program's max auto-refund amount.
      try {
        await ctx.runMutation(internal.refundCredits.ensureOrgRefundCredits, { organizationId: args.organizationId });
        const credits = await ctx.db
          .query("orgRefundCredits")
          .withIndex("by_organization", (q: any) => q.eq("organizationId", args.organizationId))
          .first();
        if (credits) {
          await ctx.db.patch(credits._id, {
            maxPerCaseMicrousdc: args.maxAutoRefundMicrousdc,
            updatedAt: now,
          });
        }
      } catch {
        // ignore
      }

      return { ok: true as const, id: existing._id, created: false as const };
    }

    const id = await ctx.db.insert("partnerPrograms", {
      liableOrganizationId: args.organizationId,
      partnerKey,
      canonicalEmail,
      enabled: args.enabled,
      autoDecideEnabled: args.autoDecideEnabled,
      autoExecuteEnabled: args.autoExecuteEnabled,
      maxAutoRefundMicrousdc: args.maxAutoRefundMicrousdc,
      platformOpsEmail,
      partnerOpsEmail,
      protectedEndpointsMode: args.protectedEndpointsMode,
      broadcastUrl: typeof args.broadcastUrl === "string" && args.broadcastUrl.trim() ? args.broadcastUrl.trim() : undefined,
      createdAt: now,
      updatedAt: now,
    });

    // Backstop: ensure org refund cap is at most this program's max auto-refund amount.
    try {
      await ctx.runMutation(internal.refundCredits.ensureOrgRefundCredits, { organizationId: args.organizationId });
      const credits = await ctx.db
        .query("orgRefundCredits")
        .withIndex("by_organization", (q: any) => q.eq("organizationId", args.organizationId))
        .first();
      if (credits) {
        await ctx.db.patch(credits._id, {
          maxPerCaseMicrousdc: args.maxAutoRefundMicrousdc,
          updatedAt: now,
        });
      }
    } catch {
      // ignore
    }

    return { ok: true as const, id, created: true as const };
  },
});

