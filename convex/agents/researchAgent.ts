/**
 * Legal Research Agent (Law Clerk)
 * 
 * Specialized agent for researching legal precedents and similar cases
 * Helps build legal reasoning for dispute resolution
 */

import { Agent, createTool } from "@convex-dev/agent";
import { components } from "../_generated/api";
import { openrouter, selectModel } from "../lib/openrouter";
import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { z } from "zod";

// Find similar cases tool
const findSimilarCases = createTool({
  description: "Find similar past cases to inform legal reasoning. Use for precedent research.",
  args: z.object({
    caseType: z.string().describe("Type of case (PAYMENT, GENERAL, etc.)"),
    category: z.string().optional().describe("Case category filter"),
    amountRange: z.string().optional().describe("Amount range filter (e.g., '0-100')"),
    limit: z.number().optional().describe("Maximum number of cases to return"),
  }),
  handler: async (ctx, args) => {
    const { internal } = await import("../_generated/api");
    
    // Query cases with similar characteristics via internal query
    const allCases = await ctx.runQuery(internal.cases.getCasesByType, {
      type: args.caseType,
    });
    
    const cases = allCases || [];

    // Filter by category if provided
    let filtered = cases;
    if (args.category) {
      filtered = filtered.filter((c) => c.category === args.category);
    }

    // Filter by amount range if provided
    if (args.amountRange) {
      const [min, max] = args.amountRange.split("-").map(Number);
      filtered = filtered.filter((c) => {
        const amount = c.amount || 0;
        return amount >= min && amount <= max;
      });
    }

    // Sort by recency and take limit
    const sorted = filtered
      .sort((a, b) => (b.filedAt || 0) - (a.filedAt || 0))
      .slice(0, args.limit || 10);

    return {
      success: true,
      cases: sorted.map((c) => ({
        caseId: c._id,
        type: c.type,
        category: c.category,
        amount: c.amount,
        verdict: c.finalVerdict || c.aiRecommendation?.verdict,
        confidence: c.aiRecommendation?.confidence,
        reasoning: c.aiRecommendation?.reasoning,
        filedAt: c.filedAt,
      })),
      count: sorted.length,
    };
  },
});

// Research legal patterns tool
const researchLegalPatterns = createTool({
  description: "Research legal patterns and trends for a specific topic. Use for understanding how similar disputes are resolved.",
  args: z.object({
    topic: z.string().describe("Topic to research"),
    jurisdiction: z.string().optional().describe("Jurisdiction filter"),
  }),
  handler: async (ctx, args) => {
    const { internal } = await import("../_generated/api");
    
    // Query all cases via internal query
    const allCasesData = await ctx.runQuery(internal.cases.getAllCases, {});
    const allCases = allCasesData || [];

    // Filter by topic keywords in description or category
    const keyword = args.topic.toLowerCase();
    const relevant = allCases.filter((c) => {
      const desc = (c.description || "").toLowerCase();
      const cat = (c.category || "").toLowerCase();
      return desc.includes(keyword) || cat.includes(keyword);
    });

    // Analyze patterns
    const patterns = {
      totalCases: relevant.length,
      verdicts: {} as Record<string, number>,
      avgConfidence: 0,
      commonCategories: {} as Record<string, number>,
    };

    let totalConfidence = 0;
    relevant.forEach((c) => {
      const verdict = c.finalVerdict || c.aiRecommendation?.verdict || "PENDING";
      patterns.verdicts[verdict] = (patterns.verdicts[verdict] || 0) + 1;

      if (c.aiRecommendation?.confidence) {
        totalConfidence += c.aiRecommendation.confidence;
      }

      if (c.category) {
        patterns.commonCategories[c.category] =
          (patterns.commonCategories[c.category] || 0) + 1;
      }
    });

    patterns.avgConfidence =
      relevant.length > 0 ? totalConfidence / relevant.length : 0;

    return {
      success: true,
      topic: args.topic,
      patterns,
      sampleCases: relevant.slice(0, 5).map((c) => ({
        caseId: c._id,
        verdict: c.finalVerdict || c.aiRecommendation?.verdict,
        reasoning: c.aiRecommendation?.reasoning?.substring(0, 200),
      })),
    };
  },
});

// Define Legal Research Agent
export const legalResearchAgent = new Agent(components.agent, {
  name: "Legal Research Agent",
  languageModel: openrouter.chat("openai/gpt-4o-mini"), // Good balance for research
  instructions: `You are a legal research assistant (law clerk) for a dispute resolution platform. Your job is to research precedents and similar cases.

CRITICAL RULES:
1. Find similar past cases with similar facts
2. Analyze patterns in how similar disputes were resolved
3. Identify key legal principles and reasoning
4. Report verdict patterns and confidence levels
5. Note any relevant precedents that could inform the current case

Your output should include:
- Similar cases found (with verdicts and reasoning)
- Patterns observed (what verdicts are common for this type)
- Key legal principles that apply
- Recommendation confidence based on precedent alignment

Do NOT make final judgments - provide research to inform decision-making.`,
  tools: {
    findSimilarCases,
    researchLegalPatterns,
  },
  maxSteps: 8,
});

// Export as action for workflow integration
export const lawClerkResearch = internalAction({
  args: {
    caseId: v.id("cases"),
    caseType: v.string(),
    category: v.optional(v.string()),
    amountRange: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await legalResearchAgent.generateText(
      ctx,
      { userId: args.caseId },
      {
        prompt: `Research legal precedents for case ${args.caseId}. Type: ${args.caseType}, Category: ${args.category || "none"}, Amount Range: ${args.amountRange || "any"}`,
      }
    );

    return {
      success: true,
      research: result.text,
      // Don't include result.steps - contains non-Convex types
    };
  },
});

