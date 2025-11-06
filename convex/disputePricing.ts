/**
 * Dispute Resolution Pricing
 * 
 * FLAT PRICING MODEL FOR MVP:
 * - All disputes: $0.05 (5 cents)
 * - No tiers, no token limits, no complexity
 */

// Keep PaymentVerdict type as it's still used
export type PaymentVerdict = "CONSUMER_WINS" | "MERCHANT_WINS" | "PARTIAL_REFUND" | "NEED_REVIEW";

export interface DisputeFeeBreakdown {
  fee: number;
}

// Flat fee for all disputes
const FLAT_FEE = 0.05;

/**
 * Calculate dispute resolution fee
 * Simple flat rate for MVP: $0.05 for all disputes
 */
export function calculateDisputeFee(
  transactionAmount?: number,
  tokensUsed?: number
): DisputeFeeBreakdown {
  return {
    fee: FLAT_FEE
  };
}

/**
 * Get fee explanation for customer
 */
export function getFeeExplanation(transactionAmount: number): string {
  const percentage = ((FLAT_FEE / transactionAmount) * 100).toFixed(2);
  return `Dispute resolution fee: $${FLAT_FEE.toFixed(2)} (${percentage}% of your $${transactionAmount.toFixed(2)} transaction)`;
}
