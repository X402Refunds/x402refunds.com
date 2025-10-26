/**
 * Dispute Resolution Pricing Utilities
 *
 * Tiered pricing model for micro-dispute resolution:
 * - Micro (<$1): $0.10
 * - Small ($1-10): $0.25
 * - Medium ($10-100): $1.00
 * - Large ($100-1k): $5.00
 * - Enterprise (>$1k): $25.00
 *
 * Plus token overage fees for complex disputes
 */

export type PricingTier = "micro" | "small" | "medium" | "large" | "enterprise";

export interface DisputeFeeBreakdown {
  tier: PricingTier;
  baseFee: number;
  tokenOverageFee: number;
  totalFee: number;
}

// Pricing constants
const PRICING_TIERS = {
  micro: { threshold: 1.00, fee: 0.10 },
  small: { threshold: 10.00, fee: 0.25 },
  medium: { threshold: 100.00, fee: 1.00 },
  large: { threshold: 1000.00, fee: 5.00 },
  enterprise: { threshold: Infinity, fee: 25.00 },
};

const TOKEN_LIMIT = 20_000; // 20k tokens included
const TOKEN_OVERAGE_RATE = 0.01 / 1000; // $0.01 per 1000 tokens

/**
 * Calculate dispute resolution fee based on transaction amount and token usage
 */
export function calculateDisputeFee(
  transactionAmount: number,
  tokensUsed: number = 0
): DisputeFeeBreakdown {
  // Determine pricing tier
  let tier: PricingTier;
  let baseFee: number;

  if (transactionAmount < PRICING_TIERS.micro.threshold) {
    tier = "micro";
    baseFee = PRICING_TIERS.micro.fee;
  } else if (transactionAmount < PRICING_TIERS.small.threshold) {
    tier = "small";
    baseFee = PRICING_TIERS.small.fee;
  } else if (transactionAmount < PRICING_TIERS.medium.threshold) {
    tier = "medium";
    baseFee = PRICING_TIERS.medium.fee;
  } else if (transactionAmount < PRICING_TIERS.large.threshold) {
    tier = "large";
    baseFee = PRICING_TIERS.large.fee;
  } else {
    tier = "enterprise";
    baseFee = PRICING_TIERS.enterprise.fee;
  }

  // Calculate token overage fee
  const tokenOverageFee = tokensUsed > TOKEN_LIMIT
    ? Math.ceil((tokensUsed - TOKEN_LIMIT)) * TOKEN_OVERAGE_RATE
    : 0;

  const totalFee = baseFee + tokenOverageFee;

  return {
    tier,
    baseFee,
    tokenOverageFee,
    totalFee: parseFloat(totalFee.toFixed(2)), // Round to cents
  };
}

/**
 * Estimate tokens from text content
 * Rough approximation: 1 token ≈ 0.75 words
 */
export function estimateTokens(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.ceil(words / 0.75);
}

/**
 * Estimate tokens from dispute evidence
 */
export function estimateDisputeTokens(
  description: string,
  evidenceTexts: string[] = []
): number {
  let total = estimateTokens(description);

  for (const evidence of evidenceTexts) {
    total += estimateTokens(evidence);
  }

  return total;
}

/**
 * Validate that evidence doesn't exceed recommended limits
 */
export function validateEvidenceSize(
  description: string,
  evidenceTexts: string[] = []
): { valid: boolean; estimatedTokens: number; message?: string } {
  const estimatedTokens = estimateDisputeTokens(description, evidenceTexts);

  // Soft limit warning at 20k
  if (estimatedTokens > TOKEN_LIMIT && estimatedTokens <= 50_000) {
    return {
      valid: true,
      estimatedTokens,
      message: `Your evidence uses ~${estimatedTokens.toLocaleString()} tokens. ` +
        `This exceeds the ${TOKEN_LIMIT.toLocaleString()} token limit and will incur ` +
        `a $${((estimatedTokens - TOKEN_LIMIT) * TOKEN_OVERAGE_RATE).toFixed(2)} overage fee.`,
    };
  }

  // Hard limit at 50k
  if (estimatedTokens > 50_000) {
    return {
      valid: false,
      estimatedTokens,
      message: `Evidence too large (~${estimatedTokens.toLocaleString()} tokens). ` +
        `Please limit description to 10,000 words and evidence documents to ` +
        `20,000 words total. Maximum: 50,000 tokens.`,
    };
  }

  return { valid: true, estimatedTokens };
}

/**
 * Get human-readable pricing tier description
 */
export function getPricingTierDescription(tier: PricingTier): string {
  const descriptions = {
    micro: "Micro-dispute (< $1.00)",
    small: "Small dispute ($1 - $10)",
    medium: "Medium dispute ($10 - $100)",
    large: "Large dispute ($100 - $1,000)",
    enterprise: "Enterprise dispute (> $1,000)",
  };
  return descriptions[tier];
}

/**
 * Get fee explanation for customer
 */
export function getFeexplanation(
  transactionAmount: number,
  feeBreakdown: DisputeFeeBreakdown
): string {
  const { tier, baseFee, tokenOverageFee, totalFee } = feeBreakdown;

  let explanation = `Dispute resolution fee: $${totalFee.toFixed(2)}\n`;
  explanation += `- Base fee (${tier}): $${baseFee.toFixed(2)}\n`;

  if (tokenOverageFee > 0) {
    explanation += `- Token overage: $${tokenOverageFee.toFixed(2)}\n`;
  }

  const percentage = ((totalFee / transactionAmount) * 100).toFixed(1);
  explanation += `\nThis is ${percentage}% of your $${transactionAmount.toFixed(2)} transaction.`;

  return explanation;
}
