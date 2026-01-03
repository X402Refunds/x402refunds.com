import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Secret-gated stats helper: count cases by `type` without exposing case data.
 * Paginated to avoid loading the whole table in one run.
 */
export const runCaseTypeCounts = mutation({
  args: {
    secret: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ scanned: number; counts: Record<string, number>; cursor: string | null; isDone: boolean }> => {
    const expected = process.env.MIGRATIONS_SECRET;
    if (!expected) throw new Error("MIGRATIONS_SECRET is not configured");
    if (args.secret !== expected) throw new Error("Unauthorized");

    const limit = Math.max(1, Math.min(args.limit ?? 500, 2000));
    const page = await ctx.db
      .query("cases")
      .withIndex("by_filed_at")
      .order("asc")
      .paginate({ cursor: args.cursor ?? null, numItems: limit });

    const counts: Record<string, number> = {};
    for (const c of page.page as any[]) {
      const t = typeof c.type === "string" && c.type.trim() ? c.type : "(missing)";
      counts[t] = (counts[t] ?? 0) + 1;
    }

    return { scanned: page.page.length, counts, cursor: page.continueCursor, isDone: page.isDone };
  },
});

