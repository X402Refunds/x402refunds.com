import { mutation } from "./_generated/server";
import { v } from "convex/values";

function normalizeWalletToCaip10Base(walletAddress: string): string | null {
  const raw = walletAddress.trim();
  if (/^0x[a-fA-F0-9]{40}$/.test(raw)) {
    return `eip155:8453:${raw.toLowerCase()}`;
  }
  const m = raw.match(/^eip155:(\d+):(0x[a-fA-F0-9]{40})$/);
  if (m) {
    const chainId = Number(m[1]);
    if (!Number.isSafeInteger(chainId) || chainId <= 0) return null;
    return `eip155:${chainId}:${m[2].toLowerCase()}`;
  }
  return null;
}

/**
 * Secret-gated migration runner: normalize agents.walletAddress to CAIP-10.
 * - 0x... -> eip155:8453:0x...
 * - eip155:<n>:0x... -> lowercases the address portion
 */
export const runMigrateAgentWalletsToCaip10 = mutation({
  args: {
    secret: v.string(),
    dryRun: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ scanned: number; updated: number; cursor: string | null; isDone: boolean; dryRun: boolean }> => {
    const expected = process.env.MIGRATIONS_SECRET;
    if (!expected) throw new Error("MIGRATIONS_SECRET is not configured");
    if (args.secret !== expected) throw new Error("Unauthorized");

    const dryRun = args.dryRun ?? true;
    const limit = Math.max(1, Math.min(args.limit ?? 500, 2000));

    const page = await ctx.db
      .query("agents")
      .withIndex("by_did")
      .order("asc")
      .paginate({ cursor: args.cursor ?? null, numItems: limit });

    let updated = 0;
    for (const agent of page.page as any[]) {
      const w = typeof agent.walletAddress === "string" ? agent.walletAddress.trim() : "";
      if (!w) continue;
      const normalized = normalizeWalletToCaip10Base(w);
      if (!normalized) continue;
      if (normalized === agent.walletAddress) continue;

      if (!dryRun) {
        await ctx.db.patch(agent._id, { walletAddress: normalized });
      }
      updated += 1;
    }

    return {
      scanned: page.page.length,
      updated,
      cursor: page.continueCursor,
      isDone: page.isDone,
      dryRun,
    };
  },
});

