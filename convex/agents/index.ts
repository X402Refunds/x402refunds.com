/**
 * Agent Actions Export
 * 
 * Central export point for all agent actions
 * Makes it easy to call agents from workflows
 */

export { reviewEvidence } from "./evidenceAgent";
export { lawClerkResearch } from "./researchAgent";
export { calculateRefund } from "./damageAgent";
export { judgeDecision, createJudgeAgent } from "./judgeAgent";
export { handleSupportTicket } from "./supportAgent";
export { verifySignedEvidence } from "./signatureAgent";
export { validateApiContract } from "./specValidatorAgent";

/**
 * Quick decision action for micro disputes
 * Uses cheapest model and minimal steps
 */
import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

export const quickDecision = internalAction({
  args: {
    caseId: v.id("cases"),
  },
  handler: async (ctx, args) => {
    // Get case (actions can call internal queries)
    const { internal } = await import("../_generated/api");
    const caseData = await ctx.runQuery(internal.cases.getCase, {
      caseId: args.caseId,
    });

    if (!caseData) {
      throw new Error(`Case ${args.caseId} not found`);
    }

    // Quick decision with minimal evidence review
    const result = await ctx.runAction(internal.agents.judgeDecision, {
      caseId: args.caseId,
      evidenceReviews: [],
      quick: true,
      modelId: "openai/gpt-oss-20b",
    });

    return result;
  },
});

