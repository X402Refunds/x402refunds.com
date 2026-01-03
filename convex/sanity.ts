import { mutation } from "./_generated/server";
import { v } from "convex/values";

function isEip155Caip10(value: string): boolean {
  return /^eip155:\d+:0x[a-f0-9]{40}$/.test(value);
}

function isBase8453Caip10(value: string): boolean {
  return /^eip155:8453:0x[a-f0-9]{40}$/.test(value);
}

/**
 * Secret-gated sanity check: count PAYMENT cases whose defendant is not CAIP-10
 * (and, optionally, not eip155:8453 specifically).
 *
 * Paginated so it can scan large tables safely.
 */
export const runCountPaymentCasesWithNonCaip10Defendant = mutation({
  args: {
    secret: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    scanned: number;
    walletFirstScanned: number;
    badNonCaip10: number;
    badNonBase8453: number;
    walletFirstBadNonCaip10: number;
    walletFirstBadNonBase8453: number;
    samplesNonCaip10: Array<{ caseId: string; defendant: string | null }>;
    samplesNonBase8453: Array<{ caseId: string; defendant: string | null }>;
    walletFirstSamplesNonCaip10: Array<{ caseId: string; defendant: string | null }>;
    walletFirstSamplesNonBase8453: Array<{ caseId: string; defendant: string | null }>;
    cursor: string | null;
    isDone: boolean;
  }> => {
    const expected = process.env.MIGRATIONS_SECRET;
    if (!expected) throw new Error("MIGRATIONS_SECRET is not configured");
    if (args.secret !== expected) throw new Error("Unauthorized");

    const limit = Math.max(1, Math.min(args.limit ?? 1000, 2000));

    const page = await ctx.db
      .query("cases")
      .withIndex("by_type", (q) => q.eq("type", "PAYMENT"))
      .order("asc")
      .paginate({ cursor: args.cursor ?? null, numItems: limit });

    let badNonCaip10 = 0;
    let badNonBase8453 = 0;
    let walletFirstScanned = 0;
    let walletFirstBadNonCaip10 = 0;
    let walletFirstBadNonBase8453 = 0;
    const samplesNonCaip10: Array<{ caseId: string; defendant: string | null }> = [];
    const samplesNonBase8453: Array<{ caseId: string; defendant: string | null }> = [];
    const walletFirstSamplesNonCaip10: Array<{ caseId: string; defendant: string | null }> = [];
    const walletFirstSamplesNonBase8453: Array<{ caseId: string; defendant: string | null }> = [];

    for (const c of page.page as any[]) {
      const def = typeof c.defendant === "string" ? c.defendant.trim() : "";
      const normalized = def.toLowerCase();
      const walletFirst = !!(c?.metadata && typeof c.metadata === "object" && (c.metadata as any).v1);

      if (!def || !isEip155Caip10(normalized)) {
        badNonCaip10 += 1;
        if (samplesNonCaip10.length < 10) {
          samplesNonCaip10.push({ caseId: String(c._id), defendant: def || null });
        }
      }
      if (!def || !isBase8453Caip10(normalized)) {
        badNonBase8453 += 1;
        if (samplesNonBase8453.length < 10) {
          samplesNonBase8453.push({ caseId: String(c._id), defendant: def || null });
        }
      }

      if (walletFirst) {
        walletFirstScanned += 1;
        if (!def || !isEip155Caip10(normalized)) {
          walletFirstBadNonCaip10 += 1;
          if (walletFirstSamplesNonCaip10.length < 10) {
            walletFirstSamplesNonCaip10.push({ caseId: String(c._id), defendant: def || null });
          }
        }
        if (!def || !isBase8453Caip10(normalized)) {
          walletFirstBadNonBase8453 += 1;
          if (walletFirstSamplesNonBase8453.length < 10) {
            walletFirstSamplesNonBase8453.push({ caseId: String(c._id), defendant: def || null });
          }
        }
      }
    }

    return {
      scanned: page.page.length,
      walletFirstScanned,
      badNonCaip10,
      badNonBase8453,
      walletFirstBadNonCaip10,
      walletFirstBadNonBase8453,
      samplesNonCaip10,
      samplesNonBase8453,
      walletFirstSamplesNonCaip10,
      walletFirstSamplesNonBase8453,
      cursor: page.continueCursor,
      isDone: page.isDone,
    };
  },
});

/**
 * Secret-gated sanity check: count agents.walletAddress rows that are not CAIP-10.
 */
export const runCountAgentsWithNonCaip10WalletAddress = mutation({
  args: {
    secret: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    scanned: number;
    withWallet: number;
    badNonCaip10: number;
    badNonBase8453: number;
    samplesNonCaip10: Array<{ agentId: string; walletAddress: string }>;
    samplesNonBase8453: Array<{ agentId: string; walletAddress: string }>;
    cursor: string | null;
    isDone: boolean;
  }> => {
    const expected = process.env.MIGRATIONS_SECRET;
    if (!expected) throw new Error("MIGRATIONS_SECRET is not configured");
    if (args.secret !== expected) throw new Error("Unauthorized");

    const limit = Math.max(1, Math.min(args.limit ?? 1000, 2000));

    const page = await ctx.db
      .query("agents")
      .withIndex("by_did")
      .order("asc")
      .paginate({ cursor: args.cursor ?? null, numItems: limit });

    let withWallet = 0;
    let badNonCaip10 = 0;
    let badNonBase8453 = 0;
    const samplesNonCaip10: Array<{ agentId: string; walletAddress: string }> = [];
    const samplesNonBase8453: Array<{ agentId: string; walletAddress: string }> = [];

    for (const a of page.page as any[]) {
      const w = typeof a.walletAddress === "string" ? a.walletAddress.trim() : "";
      if (!w) continue;
      withWallet += 1;
      const normalized = w.toLowerCase();

      if (!isEip155Caip10(normalized)) {
        badNonCaip10 += 1;
        if (samplesNonCaip10.length < 10) {
          samplesNonCaip10.push({ agentId: String(a._id), walletAddress: w });
        }
      }
      if (!isBase8453Caip10(normalized)) {
        badNonBase8453 += 1;
        if (samplesNonBase8453.length < 10) {
          samplesNonBase8453.push({ agentId: String(a._id), walletAddress: w });
        }
      }
    }

    return {
      scanned: page.page.length,
      withWallet,
      badNonCaip10,
      badNonBase8453,
      samplesNonCaip10,
      samplesNonBase8453,
      cursor: page.continueCursor,
      isDone: page.isDone,
    };
  },
});

