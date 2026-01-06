import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

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

/**
 * Secret-gated cleanup helper: delete specific cases by ID.
 * NOTE: This is destructive. Use only for test/demo cleanup.
 */
export const runDeleteSpecificCases = mutation({
  args: {
    secret: v.string(),
    caseIds: v.array(v.string()),
  },
  handler: async (ctx, args): Promise<{ deleted: number; failed: number }> => {
    const expected = process.env.MIGRATIONS_SECRET;
    if (!expected) throw new Error("MIGRATIONS_SECRET is not configured");
    if (args.secret !== expected) throw new Error("Unauthorized");

    const ids = (args.caseIds || []).filter(Boolean);
    if (ids.length === 0) return { deleted: 0, failed: 0 };
    if (ids.length > 50) throw new Error("Too many caseIds (max 50)");

    // Call the existing internal mutation. It expects v.id("cases") typed IDs,
    // but we accept strings here and cast for operational flexibility.
    const res = await (ctx.runMutation as any)((internal as any).testing.deleteSpecificCases, {
      caseIds: ids as any,
    });

    return {
      deleted: typeof res?.deleted === "number" ? res.deleted : 0,
      failed: typeof res?.failed === "number" ? res.failed : 0,
    };
  },
});
