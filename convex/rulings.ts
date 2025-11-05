/**
 * Rulings Management
 * 
 * Handles creation and management of dispute rulings
 */

import { internalMutation, internalQuery, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Finalize a ruling from workflow
 */
export const finalizeRuling = internalMutation({
  args: {
    caseId: v.id("cases"),
    verdict: v.string(),
    reasoning: v.string(),
    confidence: v.number(),
    auto: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Convert verdict to proper type
    const verdictType = args.verdict as
      | "PLAINTIFF_WINS"
      | "DEFENDANT_WINS"
      | "SPLIT"
      | "NEED_PANEL"
      | "CONSUMER_WINS"
      | "MERCHANT_WINS"
      | "PARTIAL_REFUND"
      | "NEED_REVIEW";

    const rulingId = await ctx.db.insert("rulings", {
      caseId: args.caseId,
      verdict: verdictType,
      code: args.auto ? "AUTO_RULED" : "WORKFLOW_RULED",
      reasons: args.reasoning,
      auto: args.auto,
      decidedAt: Date.now(),
      proof: {
        merkleRoot: `ruling_${args.caseId}_${Date.now()}`,
      },
    });

    // Update case with AI recommendation
    await ctx.db.patch(args.caseId, {
      aiRecommendation: {
        verdict: args.verdict,
        confidence: args.confidence,
        reasoning: args.reasoning,
        analyzedAt: Date.now(),
        similarCases: [],
      },
      finalVerdict: args.verdict,
      decidedAt: Date.now(),
    });

    return rulingId;
  },
});

/**
 * Get ruling by case ID (for tools)
 */
export const getRulingByCaseId = internalQuery({
  args: {
    caseId: v.id("cases"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rulings")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .first();
  },
});

