/**
 * OpenRouter Configuration
 * 
 * Provides OpenAI-compatible API client for OpenRouter
 * Centralized model configuration - all agents use GPT-OSS-20B
 */

import { createOpenAI } from "@ai-sdk/openai";

// Initialize OpenRouter as OpenAI-compatible provider
export const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

/**
 * Centralized model configuration
 * All agents use GPT-OSS-20B for cost-effective dispute resolution
 */
export const DEFAULT_MODEL = "openai/gpt-oss-20b";

/**
 * Model selection - always returns GPT-OSS-20B
 * 
 * All agents use the same model for consistency and cost optimization.
 * 
 * @param disputeAmount - Transaction amount or claimed damages (unused, kept for API compatibility)
 * @param complexity - Complexity score 0-1 (unused, kept for API compatibility)
 * @returns Model identifier for OpenRouter (always GPT-OSS-20B)
 */
export function selectModel(
  disputeAmount: number,
  complexity: number = 0.5
): string {
  return DEFAULT_MODEL;
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
    // Legacy models kept for backward compatibility
    "openai/gpt-4o-mini": {
      maxTokens: 16384,
      costPer1kTokens: 0.15, // $0.15 per 1k tokens
    },
    "anthropic/claude-3.5-sonnet": {
      maxTokens: 8192,
      costPer1kTokens: 3.0, // $3.00 per 1k tokens
    },
  };

  // Default to GPT-OSS-20B config
  return (
    configs[modelId] || {
      maxTokens: 8192,
      costPer1kTokens: 0.01,
    }
  );
}

