/**
 * Damage Calculation Agent
 * 
 * Specialized agent for calculating financial damages and refund amounts
 * Handles complex financial analysis for dispute resolution
 */

import { Agent, createTool } from "@convex-dev/agent";
import { components } from "../_generated/api";
import { openrouter, DEFAULT_MODEL } from "../lib/openrouter";
import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { z } from "zod";

// Calculate damages tool
const calculateDamages = createTool({
  description: "Calculate recommended refund or damage amount based on dispute type and evidence.",
  args: z.object({
    transactionAmount: z.number().describe("Original transaction amount"),
    disputeType: z.string().describe("Type of dispute (unauthorized, fraud, service_not_rendered, etc.)"),
    evidence: z.any().optional().describe("Additional evidence for calculation"),
  }),
  handler: async (ctx, args) => {
    // Basic damage calculation logic
    // This can be enhanced with more sophisticated financial analysis

    let baseAmount = args.transactionAmount;
    let additionalDamages = 0;
    let reasoning = "";

    // Different calculation logic based on dispute type
    switch (args.disputeType) {
      case "unauthorized":
      case "fraud":
        // Full refund for unauthorized charges
        baseAmount = args.transactionAmount;
        additionalDamages = 0;
        reasoning = "Full refund required for unauthorized/fraudulent transaction";
        break;

      case "service_not_rendered":
        // Full refund if service never delivered
        baseAmount = args.transactionAmount;
        additionalDamages = 0;
        reasoning = "Full refund required - service was never delivered";
        break;

      case "amount_incorrect":
        // Calculate difference between charged and agreed amount
        // This would need evidence to determine correct amount
        baseAmount = args.transactionAmount;
        additionalDamages = 0;
        reasoning = "Refund difference between charged and agreed amount";
        break;

      case "quality_issue":
        // Partial refund based on quality degradation
        baseAmount = args.transactionAmount * 0.5; // 50% refund default
        additionalDamages = 0;
        reasoning = "Partial refund due to quality issues - estimated 50% degradation";
        break;

      case "api_timeout":
      case "rate_limit_breach":
        // Partial refund or service credit
        baseAmount = args.transactionAmount * 0.75; // 75% refund
        additionalDamages = 0;
        reasoning = "Partial refund due to service interruption";
        break;

      default:
        baseAmount = args.transactionAmount;
        reasoning = "Defaulting to full transaction amount - review needed";
    }

    return {
      success: true,
      recommendedRefund: baseAmount + additionalDamages,
      baseAmount,
      additionalDamages,
      reasoning,
      confidence: 0.7, // Moderate confidence - human review recommended
    };
  },
});

// Define Damage Calculation Agent
export const damageCalculationAgent = new Agent(components.agent, {
  name: "Damage Calculation Agent",
  languageModel: openrouter.chat(DEFAULT_MODEL),
  instructions: `You are a financial damage calculation specialist for a dispute resolution platform. Your job is to calculate fair refund amounts.

CRITICAL RULES:
1. Calculate refunds based on dispute type and evidence
2. Consider transaction amount, service quality, and harm caused
3. Be fair to both parties - not punitive
4. Provide clear reasoning for your calculations
5. Flag cases that need human review for complex calculations

Calculation Guidelines:
- Unauthorized/Fraud: Full refund
- Service Not Rendered: Full refund
- Quality Issues: Partial refund (typically 25-75% depending on severity)
- Service Interruption: Partial refund or service credit
- Amount Incorrect: Refund difference

Your output should include:
- Recommended refund amount
- Calculation breakdown
- Reasoning
- Confidence score (0-1)
- Flag if human review needed`,
  tools: {
    calculateDamages,
  },
  maxSteps: 5,
});

// Export as action for workflow integration
export const calculateRefund = internalAction({
  args: {
    caseId: v.id("cases"),
    transactionAmount: v.number(),
    disputeType: v.string(),
  },
  handler: async (ctx, args) => {
    const result = await damageCalculationAgent.generateText(
      ctx,
      { userId: args.caseId },
      {
        prompt: `Calculate refund for case ${args.caseId}. Transaction amount: $${args.transactionAmount}, Dispute type: ${args.disputeType}`,
      }
    );

    return {
      success: true,
      calculation: result.text,
      // Don't include result.steps - contains non-Convex types
    };
  },
});

