import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

function normalizeMerchantId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  if (/^eip155:\d+:0x[a-fA-F0-9]{40}$/.test(s)) {
    const m = s.match(/^eip155:(\d+):(0x[a-fA-F0-9]{40})$/);
    if (!m) return null;
    return `eip155:${m[1]}:${m[2].toLowerCase()}`;
  }
  if (/^0x[a-fA-F0-9]{40}$/.test(s)) return `eip155:8453:${s.toLowerCase()}`;
  if (/^solana:[^:]+:[1-9A-HJ-NP-Za-km-z]{32,64}$/.test(s)) return s;
  return null;
}

function normalizeEmail(value: string): string | null {
  const s = value.trim().toLowerCase();
  if (s.length < 3 || s.length > 320) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return null;
  return s;
}

function deriveSellerEndpointUrl(caseData: any): string | null {
  const meta = caseData?.metadata && typeof caseData.metadata === "object" ? caseData.metadata : {};
  const v1 = meta?.v1 && typeof meta.v1 === "object" ? meta.v1 : {};
  const v1Url = typeof v1?.sellerEndpointUrl === "string" ? String(v1.sellerEndpointUrl).trim() : "";
  if (v1Url) {
    try {
      const u = new URL(v1Url);
      if (u.protocol === "https:" && u.pathname && u.pathname !== "/") return u.toString();
    } catch {
      // ignore
    }
  }

  const reqJson = caseData?.paymentDetails?.plaintiffMetadata?.requestJson;
  if (typeof reqJson === "string" && reqJson.trim()) {
    try {
      const parsed = JSON.parse(reqJson) as any;
      const url = typeof parsed?.url === "string" ? String(parsed.url).trim() : "";
      if (!url || !url.startsWith("https://")) return null;
      const u = new URL(url);
      if (u.pathname && u.pathname !== "/") return u.toString();
    } catch {
      // ignore
    }
  }

  return null;
}

function deriveOriginFromSellerEndpointUrl(value: string): string | null {
  try {
    const u = new URL(value);
    if (u.protocol !== "https:") return null;
    return u.origin;
  } catch {
    return null;
  }
}

/**
 * Migrate merchant email verification records to use the origin derived from sellerEndpointUrl.
 * Only updates tuples where cases indicate a single canonical origin for (merchant, supportEmail).
 */
export const migrateMerchantEmailVerificationOrigins = internalMutation({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const dryRun = Boolean(args.dryRun);
    const now = Date.now();

    const cases = await ctx.db.query("cases").withIndex("by_filed_at").order("asc").collect();

    const originsByKey = new Map<string, Set<string>>();
    let casesWithMerchant = 0;
    let casesWithSupportEmail = 0;
    let casesWithSellerEndpoint = 0;
    let casesWithOrigin = 0;
    for (const c of cases as any[]) {
      if (c?.type !== "PAYMENT") continue;
      const merchant = normalizeMerchantId(String(c?.defendant || ""));
      if (!merchant) continue;
      casesWithMerchant += 1;

      const supportEmailRaw =
        typeof c?.metadata?.v1?.paymentSupportEmail === "string"
          ? String(c.metadata.v1.paymentSupportEmail)
          : typeof c?.paymentDetails?.defendantMetadata?.email === "string"
            ? String(c.paymentDetails.defendantMetadata.email)
            : "";
      const supportEmail = supportEmailRaw ? normalizeEmail(supportEmailRaw) : null;
      if (!supportEmail) continue;
      casesWithSupportEmail += 1;

      const sellerEndpointUrl = deriveSellerEndpointUrl(c);
      if (!sellerEndpointUrl) continue;
      casesWithSellerEndpoint += 1;
      const origin = deriveOriginFromSellerEndpointUrl(sellerEndpointUrl);
      if (!origin) continue;
      casesWithOrigin += 1;

      const key = `${merchant}::${supportEmail}`;
      const existing = originsByKey.get(key) ?? new Set<string>();
      existing.add(origin);
      originsByKey.set(key, existing);
    }

    const canonicalOriginByKey = new Map<string, string>();
    let ambiguousKeys = 0;
    for (const [key, origins] of originsByKey.entries()) {
      if (origins.size === 1) {
        canonicalOriginByKey.set(key, Array.from(origins)[0]);
      } else {
        ambiguousKeys += 1;
      }
    }

    let verificationUpdates = 0;
    const verifications = await ctx.db.query("merchantEmailVerifications").collect();
    for (const row of verifications as any[]) {
      const merchant = String(row?.merchant || "").trim();
      const supportEmail = normalizeEmail(String(row?.supportEmail || ""));
      if (!merchant || !supportEmail) continue;
      const key = `${merchant}::${supportEmail}`;
      const targetOrigin = canonicalOriginByKey.get(key);
      if (!targetOrigin || targetOrigin === row.origin) continue;
      verificationUpdates += 1;
      if (!dryRun) {
        await ctx.db.patch(row._id, { origin: targetOrigin, updatedAt: now });
      }
    }

    let tokenUpdates = 0;
    const tokens = await ctx.db.query("merchantEmailVerificationTokens").collect();
    for (const row of tokens as any[]) {
      const merchant = String(row?.merchant || "").trim();
      const supportEmail = normalizeEmail(String(row?.supportEmail || ""));
      if (!merchant || !supportEmail) continue;
      const key = `${merchant}::${supportEmail}`;
      const targetOrigin = canonicalOriginByKey.get(key);
      if (!targetOrigin || targetOrigin === row.origin) continue;
      tokenUpdates += 1;
      if (!dryRun) {
        await ctx.db.patch(row._id, { origin: targetOrigin });
      }
    }

    let actionTokenUpdates = 0;
    const actionTokens = await ctx.db.query("merchantEmailActionTokens").collect();
    for (const row of actionTokens as any[]) {
      const merchant = String(row?.merchant || "").trim();
      const supportEmail = normalizeEmail(String(row?.supportEmail || ""));
      if (!merchant || !supportEmail) continue;
      const key = `${merchant}::${supportEmail}`;
      const targetOrigin = canonicalOriginByKey.get(key);
      if (!targetOrigin || targetOrigin === row.origin) continue;
      actionTokenUpdates += 1;
      if (!dryRun) {
        await ctx.db.patch(row._id, { origin: targetOrigin });
      }
    }

    return {
      ok: true,
      dryRun,
      scannedCases: cases.length,
      casesWithMerchant,
      casesWithSupportEmail,
      casesWithSellerEndpoint,
      casesWithOrigin,
      keysWithSingleOrigin: canonicalOriginByKey.size,
      keysWithMultipleOrigins: ambiguousKeys,
      verificationUpdates,
      tokenUpdates,
      actionTokenUpdates,
    };
  },
});
