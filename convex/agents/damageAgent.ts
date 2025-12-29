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

function clampMicros(n: number, max: number): number {
  const x = Number.isFinite(n) ? Math.round(n) : 0;
  return Math.max(0, Math.min(max, x));
}

function toMicros(amountUsd: number): number {
  // USDC has 6 decimals.
  return Math.round(amountUsd * 1_000_000);
}

/**
 * Deterministic refund recommendation for payment disputes.
 * Used to compute explicit partial refund amounts (microusdc) that are enforceable by the backend.
 */
export function computeRefundRecommendationMicrousdc(args: {
  transactionAmountUsd: number;
  disputeType: string;
}): { recommendedRefundMicrousdc: number; reasoning: string; confidence: number } {
  const amountUsd = Math.max(0, args.transactionAmountUsd || 0);
  const disputeType = (args.disputeType || "").toLowerCase();

  let recommendedUsd = amountUsd;
  let reasoning = "Defaulting to full transaction amount - review needed";
  let confidence = 0.7;

  switch (disputeType) {
    case "unauthorized":
    case "fraud":
      recommendedUsd = amountUsd;
      reasoning = "Full refund required for unauthorized/fraudulent transaction";
      confidence = 0.85;
      break;
    case "service_not_rendered":
      recommendedUsd = amountUsd;
      reasoning = "Full refund required - service was never delivered";
      confidence = 0.85;
      break;
    case "amount_incorrect":
      recommendedUsd = amountUsd;
      reasoning = "Refund difference between charged and agreed amount (needs validation)";
      confidence = 0.6;
      break;
    case "quality_issue":
      recommendedUsd = amountUsd * 0.5;
      reasoning = "Partial refund due to quality issues - estimated 50% degradation";
      confidence = 0.75;
      break;
    case "api_timeout":
    case "rate_limit_breach":
      recommendedUsd = amountUsd * 0.75;
      reasoning = "Partial refund due to service interruption";
      confidence = 0.75;
      break;
    default:
      break;
  }

  const maxMicros = toMicros(amountUsd);
  const recommendedRefundMicrousdc = clampMicros(toMicros(recommendedUsd), maxMicros);
  return { recommendedRefundMicrousdc, reasoning, confidence };
}

// Calculate damages tool
const calculateDamages = createTool({
  description: "Calculate recommended refund or damage amount based on dispute type and evidence.",
  args: z.object({
    transactionAmount: z.number().describe("Original transaction amount"),
    disputeType: z.string().describe("Type of dispute (unauthorized, fraud, service_not_rendered, etc.)"),
    evidence: z.any().optional().describe("Additional evidence for calculation"),
  }),
  handler: async (ctx, args) => {
    const rec = computeRefundRecommendationMicrousdc({
      transactionAmountUsd: args.transactionAmount,
      disputeType: args.disputeType,
    });
    return {
      success: true,
      recommendedRefund: rec.recommendedRefundMicrousdc / 1_000_000,
      recommendedRefundMicrousdc: rec.recommendedRefundMicrousdc,
      reasoning: rec.reasoning,
      confidence: rec.confidence,
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
    // Deterministic + enforceable output for downstream workflows.
    // (We keep the Agent around for future richer logic, but the workflow requires structured output.)
    const rec = computeRefundRecommendationMicrousdc({
      transactionAmountUsd: args.transactionAmount,
      disputeType: args.disputeType,
    });

    return {
      success: true,
      recommendedRefundMicrousdc: rec.recommendedRefundMicrousdc,
      recommendedRefund: rec.recommendedRefundMicrousdc / 1_000_000,
      reasoning: rec.reasoning,
      confidence: rec.confidence,
    };
  },
});

