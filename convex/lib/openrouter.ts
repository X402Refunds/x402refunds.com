/**
 * OpenRouter Configuration
 * 
 * Provides OpenAI-compatible API client for OpenRouter
 * Supports dynamic model selection based on dispute complexity
 */

import { createOpenAI } from "@ai-sdk/openai";

// Initialize OpenRouter as OpenAI-compatible provider
export const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

/**
 * Dynamic model selection based on dispute amount and complexity
 * 
 * Strategy:
 * - Micro disputes (<$1): GPT-OSS-20B (fast, cheap, sufficient for simple cases)
 * - Small disputes ($1-10): GPT-4o-mini (good balance)
 * - Medium+ disputes ($10+): Claude 3.5 Sonnet (highest quality for complex cases)
 * 
 * @param disputeAmount - Transaction amount or claimed damages
 * @param complexity - Complexity score 0-1 (default 0.5)
 * @returns Model identifier for OpenRouter
 */
export function selectModel(
  disputeAmount: number,
  complexity: number = 0.5
): string {
  // Micro disputes: use cheapest model
  if (disputeAmount < 1) {
    return "openai/gpt-oss-20b";
  }

  // Small disputes: use efficient model
  if (disputeAmount < 10) {
    return "openai/gpt-4o-mini";
  }

  // Medium+ disputes: use highest quality model
  // If complexity is high, always use Claude 3.5 Sonnet
  if (disputeAmount >= 10 || complexity > 0.7) {
    return "anthropic/claude-3.5-sonnet";
  }

  // Default to GPT-4o-mini for unknown cases
  return "openai/gpt-4o-mini";
}

/**
 * Get model configuration including token limits
 */
export function getModelConfig(modelId: string) {
  const configs: Record<string, { maxTokens: number; costPer1kTokens: number }> = {
    "openai/gpt-oss-20b": {
      maxTokens: 8192,
      costPer1kTokens: 0.01, // $0.01 per 1k tokens
    },
    "openai/gpt-4o-mini": {
      maxTokens: 16384,
      costPer1kTokens: 0.15, // $0.15 per 1k tokens
    },
    "anthropic/claude-3.5-sonnet": {
      maxTokens: 8192,
      costPer1kTokens: 3.0, // $3.00 per 1k tokens
    },
  };

  return (
    configs[modelId] || {
      maxTokens: 8192,
      costPer1kTokens: 0.15,
    }
  );
}

