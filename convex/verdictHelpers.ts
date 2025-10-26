/**
 * Verdict Terminology Helpers
 *
 * Provides conversion between old (UPHELD/DISMISSED) and new (CONSUMER_WINS/MERCHANT_WINS)
 * terminology, plus party-specific messaging.
 */

// New payment dispute verdicts
export type PaymentVerdict = "CONSUMER_WINS" | "MERCHANT_WINS" | "PARTIAL_REFUND" | "NEED_REVIEW";

// New agent dispute verdicts
export type AgentVerdict = "PLAINTIFF_WINS" | "DEFENDANT_WINS" | "SPLIT" | "NEED_PANEL";

// Legacy verdicts
export type LegacyVerdict = "UPHELD" | "DISMISSED" | "SPLIT" | "NEED_PANEL";

// Party types
export type Party = "consumer" | "merchant" | "plaintiff" | "defendant";

/**
 * Convert legacy verdict to new payment dispute verdict
 */
export function migrateLegacyPaymentVerdict(legacy: LegacyVerdict): PaymentVerdict {
  switch (legacy) {
    case "UPHELD":
      return "CONSUMER_WINS"; // Consumer's dispute claim was upheld
    case "DISMISSED":
      return "MERCHANT_WINS"; // Consumer's claim was dismissed
    case "SPLIT":
      return "PARTIAL_REFUND";
    case "NEED_PANEL":
      return "NEED_REVIEW";
  }
}

/**
 * Convert legacy verdict to new agent dispute verdict
 */
export function migrateLegacyAgentVerdict(legacy: LegacyVerdict): AgentVerdict {
  switch (legacy) {
    case "UPHELD":
      return "PLAINTIFF_WINS"; // Plaintiff's claim was upheld
    case "DISMISSED":
      return "DEFENDANT_WINS"; // Plaintiff's claim was dismissed
    case "SPLIT":
      return "SPLIT";
    case "NEED_PANEL":
      return "NEED_PANEL";
  }
}

/**
 * Get win/loss status for a specific party
 */
export function getOutcomeForParty(
  verdict: PaymentVerdict | AgentVerdict,
  party: Party
): "WIN" | "LOSE" | "PARTIAL" | "PENDING" {
  // Payment disputes
  if (party === "consumer") {
    if (verdict === "CONSUMER_WINS") return "WIN";
    if (verdict === "MERCHANT_WINS") return "LOSE";
    if (verdict === "PARTIAL_REFUND") return "PARTIAL";
    if (verdict === "NEED_REVIEW") return "PENDING";
  }

  if (party === "merchant") {
    if (verdict === "CONSUMER_WINS") return "LOSE";
    if (verdict === "MERCHANT_WINS") return "WIN";
    if (verdict === "PARTIAL_REFUND") return "PARTIAL";
    if (verdict === "NEED_REVIEW") return "PENDING";
  }

  // Agent disputes
  if (party === "plaintiff") {
    if (verdict === "PLAINTIFF_WINS") return "WIN";
    if (verdict === "DEFENDANT_WINS") return "LOSE";
    if (verdict === "SPLIT") return "PARTIAL";
    if (verdict === "NEED_PANEL") return "PENDING";
  }

  if (party === "defendant") {
    if (verdict === "PLAINTIFF_WINS") return "LOSE";
    if (verdict === "DEFENDANT_WINS") return "WIN";
    if (verdict === "SPLIT") return "PARTIAL";
    if (verdict === "NEED_PANEL") return "PENDING";
  }

  return "PENDING";
}

/**
 * Get human-readable message for party
 */
export function getVerdictMessage(
  verdict: PaymentVerdict | AgentVerdict,
  party: Party,
  amount?: number
): string {
  const outcome = getOutcomeForParty(verdict, party);
  const amountStr = amount ? ` of $${amount.toFixed(2)}` : "";

  if (party === "consumer") {
    switch (outcome) {
      case "WIN":
        return `✅ Your dispute was approved. Refund${amountStr} issued.`;
      case "LOSE":
        return `❌ Your dispute was denied. No refund will be issued.`;
      case "PARTIAL":
        return `⚖️ Partial refund${amountStr} approved.`;
      case "PENDING":
        return `⏳ Your dispute is under review.`;
    }
  }

  if (party === "merchant") {
    switch (outcome) {
      case "WIN":
        return `✅ Chargeback denied. You keep the funds${amountStr}.`;
      case "LOSE":
        return `❌ Chargeback granted. Refund${amountStr} issued to customer.`;
      case "PARTIAL":
        return `⚖️ Partial chargeback${amountStr}. Some funds returned to customer.`;
      case "PENDING":
        return `⏳ Dispute under review.`;
    }
  }

  if (party === "plaintiff") {
    switch (outcome) {
      case "WIN":
        return `✅ Your claim was granted. The defendant is liable.`;
      case "LOSE":
        return `❌ Your claim was denied. The defendant is not liable.`;
      case "PARTIAL":
        return `⚖️ Your claim was partially granted. Shared liability.`;
      case "PENDING":
        return `⏳ Your case requires panel review.`;
    }
  }

  if (party === "defendant") {
    switch (outcome) {
      case "WIN":
        return `✅ You successfully defended against the claim.`;
      case "LOSE":
        return `❌ The claim against you was granted. You are liable.`;
      case "PARTIAL":
        return `⚖️ Partial liability. Shared responsibility.`;
      case "PENDING":
        return `⏳ This case requires panel review.`;
    }
  }

  return "Status unknown";
}

/**
 * Get dashboard badge info for verdict
 */
export function getVerdictBadge(
  verdict: PaymentVerdict | AgentVerdict,
  party: Party
): {
  icon: string;
  color: "green" | "red" | "yellow" | "gray";
  text: string;
} {
  const outcome = getOutcomeForParty(verdict, party);

  switch (outcome) {
    case "WIN":
      return { icon: "✅", color: "green", text: "You Won" };
    case "LOSE":
      return { icon: "❌", color: "red", text: "You Lost" };
    case "PARTIAL":
      return { icon: "⚖️", color: "yellow", text: "Split" };
    case "PENDING":
      return { icon: "⏳", color: "gray", text: "Pending" };
  }
}

/**
 * Get verdict for Regulation E compliance reporting
 */
export function getRegulationEStatus(verdict: PaymentVerdict): {
  status: string;
  action: string;
  description: string;
} {
  switch (verdict) {
    case "CONSUMER_WINS":
      return {
        status: "PROVISIONAL_CREDIT_PERMANENT",
        action: "Make provisional credit permanent",
        description: "Consumer retains the refund. No further action required.",
      };

    case "MERCHANT_WINS":
      return {
        status: "PROVISIONAL_CREDIT_REVERSED",
        action: "Reverse provisional credit",
        description: "Merchant successfully defended. Consumer must repay provisional credit.",
      };

    case "PARTIAL_REFUND":
      return {
        status: "PARTIAL_PROVISIONAL_CREDIT",
        action: "Adjust provisional credit",
        description: "Partial refund granted. Adjust provisional credit accordingly.",
      };

    case "NEED_REVIEW":
      return {
        status: "UNDER_INVESTIGATION",
        action: "Continue investigation",
        description: "Case requires additional review. Provisional credit remains pending.",
      };
  }
}

/**
 * Convert new verdict back to legacy for backwards compatibility
 */
export function toLegacyVerdict(
  verdict: PaymentVerdict | AgentVerdict
): LegacyVerdict {
  if (verdict === "CONSUMER_WINS" || verdict === "PLAINTIFF_WINS") {
    return "UPHELD";
  }
  if (verdict === "MERCHANT_WINS" || verdict === "DEFENDANT_WINS") {
    return "DISMISSED";
  }
  if (verdict === "PARTIAL_REFUND" || verdict === "SPLIT") {
    return "SPLIT";
  }
  if (verdict === "NEED_REVIEW" || verdict === "NEED_PANEL") {
    return "NEED_PANEL";
  }
  return "NEED_PANEL";
}
