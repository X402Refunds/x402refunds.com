/**
 * Judge Decision Agent
 * 
 * Specialized agent for making final dispute resolution decisions
 * Uses highest quality model and synthesizes all analysis
 */

import { Agent, createTool } from "@convex-dev/agent";
import { components } from "../_generated/api";
import { openrouter, selectModel, DEFAULT_MODEL } from "../lib/openrouter";
import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { z } from "zod";

// Get case details tool
const getCaseDetails = createTool({
  description: "Get full case details including evidence and existing rulings.",
  args: z.object({
    caseId: z.string().describe("Case ID to retrieve"),
  }),
  handler: async (ctx, args) => {
    const { internal } = await import("../_generated/api");
    
    // Get case via query
    const caseData = await ctx.runQuery(internal.cases.getCase, {
      caseId: args.caseId as any,
    });
    
    if (!caseData) {
      return { success: false, error: "Case not found" };
    }

    // Get evidence via query
    const evidence = await ctx.runQuery(internal.evidence.getEvidenceByCaseId, {
      caseId: args.caseId as any,
    });

    // Get any existing rulings via query
    const ruling = await ctx.runQuery(internal.rulings.getRulingByCaseId, {
      caseId: args.caseId as any,
    });

    return {
      success: true,
      case: {
        id: caseData._id,
        plaintiff: caseData.plaintiff,
        defendant: caseData.defendant,
        type: caseData.type,
        category: caseData.category,
        amount: caseData.amount,
        description: caseData.description,
        status: caseData.status,
        filedAt: caseData.filedAt,
        aiRecommendation: caseData.aiRecommendation,
      },
      evidence: (evidence || []).map((e: any) => ({
        id: e._id,
        agentDid: e.agentDid,
        uri: e.uri,
        sha256: e.sha256,
        timestamp: e.ts,
      })),
      existingRuling: ruling,
    };
  },
});

/**
 * Judge Agent with dynamic model selection
 * Creates a judge agent instance with model selected based on case complexity
 */
export function createJudgeAgent(disputeAmount: number, complexity: number = 0.5) {
  const modelId = selectModel(disputeAmount, complexity);

  return new Agent(components.agent, {
    name: "Judge Decision Agent",
    languageModel: openrouter.chat(modelId),
    instructions: `You are a judge for a dispute resolution platform. Your job is to make final, binding decisions on disputes.

CRITICAL RULES:
1. Review ALL evidence carefully
2. Consider legal precedents and similar cases
3. Apply consistent legal principles
4. Be fair and impartial
5. Provide clear, detailed reasoning
6. High confidence (>0.95) = auto-resolve, Low confidence (<0.95) = human review

Verdict Types:
- PAYMENT disputes: CONSUMER_WINS, MERCHANT_WINS, PARTIAL_REFUND, NEED_REVIEW
- GENERAL disputes: PLAINTIFF_WINS, DEFENDANT_WINS, SPLIT, NEED_PANEL

Your decision should include:
- Verdict (one of the above)
- Confidence score (0-1)
- Detailed reasoning (at least 3 paragraphs)
- Key evidence cited
- Precedent alignment (if applicable)
- Flag for human review if confidence < 0.95

Be decisive but careful. Your decisions are binding.`,
    tools: {
      getCaseDetails,
    },
    maxSteps: 10,
  });
}

// Default judge agent export (uses GPT-OSS-20B)
export const judgeAgent = new Agent(components.agent, {
  name: "Judge Decision Agent",
  languageModel: openrouter.chat(DEFAULT_MODEL),
  instructions: `You are a judge for a dispute resolution platform. Your job is to make final, binding decisions on disputes.

CRITICAL RULES:
1. Review ALL evidence carefully
2. Consider legal precedents and similar cases
3. Apply consistent legal principles
4. Be fair and impartial
5. Provide clear, detailed reasoning
6. High confidence (>0.95) = auto-resolve, Low confidence (<0.95) = human review

Verdict Types:
- PAYMENT disputes: CONSUMER_WINS, MERCHANT_WINS, PARTIAL_REFUND, NEED_REVIEW
- GENERAL disputes: PLAINTIFF_WINS, DEFENDANT_WINS, SPLIT, NEED_PANEL

Your decision should include:
- Verdict (one of the above)
- Confidence score (0-1)
- Detailed reasoning (at least 3 paragraphs)
- Key evidence cited
- Precedent alignment (if applicable)
- Flag for human review if confidence < 0.95

Be decisive but careful. Your decisions are binding.`,
  tools: {
    getCaseDetails,
  },
  maxSteps: 10,
});

// Export as action for workflow integration
export const judgeDecision = internalAction({
  args: {
    caseId: v.id("cases"),
    evidenceReviews: v.optional(v.any()),
    research: v.optional(v.any()),
    damageCalculation: v.optional(v.any()),
    signatureVerified: v.optional(v.boolean()),
    contractBreach: v.optional(v.boolean()),
    quick: v.optional(v.boolean()),
    modelId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Use dynamic model if provided, otherwise use default judge agent
    let agent = judgeAgent;
    if (args.modelId) {
      // Create agent with specific model - need to access options correctly
      const defaultInstructions = `You are a judge for a dispute resolution platform. Your job is to make final, binding decisions on disputes.

CRITICAL RULES:
1. Review ALL evidence carefully
2. Consider legal precedents and similar cases
3. Apply consistent legal principles
4. Be fair and impartial
5. Provide clear, detailed reasoning
6. High confidence (>0.95) = auto-resolve, Low confidence (<0.95) = human review

Verdict Types:
- PAYMENT disputes: CONSUMER_WINS, MERCHANT_WINS, PARTIAL_REFUND, NEED_REVIEW
- GENERAL disputes: PLAINTIFF_WINS, DEFENDANT_WINS, SPLIT, NEED_PANEL

Your decision should include:
- Verdict (one of the above)
- Confidence score (0-1)
- Detailed reasoning (at least 3 paragraphs)
- Key evidence cited
- Precedent alignment (if applicable)
- Flag for human review if confidence < 0.95

Be decisive but careful. Your decisions are binding.`;

      agent = new Agent(components.agent, {
        name: "Judge Decision Agent",
        languageModel: openrouter.chat(args.modelId),
        instructions: defaultInstructions,
        tools: {
          getCaseDetails,
        },
        maxSteps: 10,
      });
    }

    const result = await agent.generateText(
      ctx,
      { userId: args.caseId },
      {
        prompt: `Make final decision for case ${args.caseId}. Evidence reviews: ${JSON.stringify(args.evidenceReviews || [])}. Research: ${JSON.stringify(args.research || {})}. Damage calculation: ${JSON.stringify(args.damageCalculation || {})}. ${args.quick ? "Quick decision mode." : ""}`,
      }
    );

    // Parse verdict from result (simplified - in production would parse structured output)
    const text = result.text.toLowerCase();
    let verdict = "NEED_REVIEW";
    let confidence = 0.7;

    if (text.includes("consumer_wins") || text.includes("plaintiff_wins")) {
      verdict = "CONSUMER_WINS";
      confidence = 0.9;
    } else if (text.includes("merchant_wins") || text.includes("defendant_wins")) {
      verdict = "MERCHANT_WINS";
      confidence = 0.9;
    } else if (text.includes("partial")) {
      verdict = "PARTIAL_REFUND";
      confidence = 0.85;
    }

    return {
      verdict,
      confidence,
      reasoning: result.text,
      // Don't include result.steps - contains non-Convex types
    };
  },
});

