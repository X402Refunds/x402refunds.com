# Dispute Resolution Pricing Model Analysis

## The Core Question
**How should we price micro-dispute resolution?**

## Context
- **Micro-disputes:** Typically < $1.00 (often $0.01 - $0.99)
- **Traditional cost:** $25-50 chargeback fee (absurd for $0.50 disputes!)
- **Your advantage:** 95% AI automation with customer review
- **Cost driver:** LLM tokens for AI analysis

## Pricing Models Analysis

### Option 1: Token-Based Markup
**Model:** Cost = (tokens_used × token_price) × markup_multiplier

```typescript
// Example: GPT-4o pricing
const INPUT_TOKEN_COST = 0.0025 / 1000;   // $2.50 per 1M tokens
const OUTPUT_TOKEN_COST = 0.01 / 1000;    // $10 per 1M tokens

// Typical dispute uses ~2,000 input + 500 output tokens
const cost = (2000 × 0.0025/1000) + (500 × 0.01/1000);
// = $0.005 + $0.005 = $0.01 per dispute

// With 10x markup for margin
const price = cost × 10 = $0.10 per dispute
```

**Pros:**
- ✅ Fair - only pay for compute used
- ✅ Scales with complexity
- ✅ Transparent cost basis
- ✅ Protects against abuse (someone submitting 10,000 word essays)

**Cons:**
- ❌ Variable pricing (harder to communicate)
- ❌ Complex to explain to customers
- ❌ Requires token tracking infrastructure
- ❌ Unpredictable revenue

**Best for:** Developer-focused API customers who understand compute costs

---

### Option 2: Percentage of Transaction
**Model:** Cost = transaction_amount × percentage_fee

```typescript
// Examples
$0.50 dispute × 3% = $0.015 (~1.5¢)
$1.00 dispute × 3% = $0.03 (3¢)
$5.00 dispute × 3% = $0.15 (15¢)
$100.00 dispute × 3% = $3.00 ($3)

// With caps
const fee = Math.min(
  transaction_amount × 0.03,  // 3%
  5.00                         // Max $5
);
```

**Pros:**
- ✅ Intuitive - "3% of transaction value"
- ✅ Scales with risk (larger disputes = larger stakes)
- ✅ Aligns incentives (you make more when stakes are higher)
- ✅ Standard in payments industry

**Cons:**
- ❌ Tiny fees on micro-transactions ($0.50 × 3% = $0.015)
- ❌ Doesn't reflect actual compute cost
- ❌ Complex disputes on $0.01 lose money

**Best for:** Payment processors, traditional fintech customers

---

### Option 3: Flat Fee
**Model:** Every dispute costs the same

```typescript
const DISPUTE_FEE = 0.25; // 25¢ per dispute, regardless of amount

// Examples
$0.10 dispute → $0.25 fee (250% of transaction!)
$1.00 dispute → $0.25 fee (25% of transaction)
$10.00 dispute → $0.25 fee (2.5% of transaction)
```

**Pros:**
- ✅ Dead simple - "25¢ per dispute, period"
- ✅ Predictable revenue
- ✅ Easy to communicate
- ✅ Covers base costs on all disputes

**Cons:**
- ❌ May be too high for tiny disputes ($0.05 transactions)
- ❌ May be too low for complex $100 disputes
- ❌ Doesn't incentivize efficiency

**Best for:** Simplicity, predictable budgeting

---

### Option 4: Tiered Flat Fees
**Model:** Different price brackets based on transaction size

```typescript
function getDisputeFee(amount: number): number {
  if (amount < 1.00) return 0.10;        // Micro: 10¢
  if (amount < 10.00) return 0.25;       // Small: 25¢
  if (amount < 100.00) return 1.00;      // Medium: $1
  if (amount < 1000.00) return 5.00;     // Large: $5
  return 25.00;                           // Enterprise: $25
}

// Examples
$0.50 dispute → $0.10 fee (20% of transaction)
$5.00 dispute → $0.25 fee (5% of transaction)
$50.00 dispute → $1.00 fee (2% of transaction)
$500.00 dispute → $5.00 fee (1% of transaction)
```

**Pros:**
- ✅ Balances simplicity with fairness
- ✅ Makes sense to customers ("bigger disputes cost more")
- ✅ Profitable on micro-disputes
- ✅ Still competitive on larger disputes

**Cons:**
- ⚠️ Slightly more complex to explain
- ⚠️ Edge case gaming (dispute $0.99 vs $1.01)

**Best for:** Most customers - good balance

---

### Option 5: Hybrid (Percentage + Floor + Token Markup)
**Model:** Sophisticated pricing that combines approaches

```typescript
function getDisputeFee(
  transactionAmount: number,
  tokensUsed: number
): number {
  // Base fee: 2% of transaction
  const percentageFee = transactionAmount × 0.02;

  // Floor: minimum 10¢
  const floor = 0.10;

  // Token overage: if complex dispute uses >5k tokens
  const tokenCost = tokensUsed > 5000
    ? (tokensUsed - 5000) × 0.00001  // 1¢ per 1000 extra tokens
    : 0;

  // Final price
  return Math.max(percentageFee, floor) + tokenCost;
}

// Examples
$0.50, 2k tokens → max(0.01, 0.10) + 0 = $0.10
$5.00, 2k tokens → max(0.10, 0.10) + 0 = $0.10
$50.00, 2k tokens → max(1.00, 0.10) + 0 = $1.00
$5.00, 10k tokens → max(0.10, 0.10) + 0.05 = $0.15 (complexity charge)
```

**Pros:**
- ✅ Fair and sophisticated
- ✅ Protects against abuse (token limiter)
- ✅ Scales with transaction size
- ✅ Profitable on all dispute sizes

**Cons:**
- ❌ Complex to explain
- ❌ Harder to predict costs
- ❌ Requires token tracking

**Best for:** Technical customers, API-first platforms

---

## Recommended Approach: **Tiered + Token Limiter**

### Base Pricing (Simple for Customers)
```typescript
// Public pricing
const DISPUTE_FEES = {
  micro: 0.10,      // < $1
  small: 0.25,      // $1 - $10
  medium: 1.00,     // $10 - $100
  large: 5.00,      // $100 - $1000
  enterprise: 25.00 // > $1000
};
```

### Token Limits (Prevent Abuse)
```typescript
// Internal limits
const TOKEN_LIMITS = {
  evidence_input: 10_000,      // ~7,500 words max
  ai_analysis: 5_000,          // AI can use 5k tokens
  total_per_dispute: 20_000    // Hard cap
};

// If exceeded, charge overage
const OVERAGE_FEE = 0.01; // 1¢ per 1000 tokens over limit
```

### Why This Works

1. **For $0.25 coffee dispute:**
   - Fee: $0.10 (40% of transaction - but still profitable)
   - Customer thinks: "10¢ to resolve a dispute? Cheap!"
   - Your cost: ~$0.01 (90% margin ✅)

2. **For $5.00 API call dispute:**
   - Fee: $0.25 (5% of transaction)
   - Customer thinks: "Quarter for dispute resolution vs $25 chargeback? Amazing!"
   - Your cost: ~$0.02 (92% margin ✅)

3. **For complex $50 dispute with lots of evidence:**
   - Fee: $1.00 base + maybe $0.05 token overage = $1.05
   - Customer thinks: "Still way cheaper than traditional arbitration"
   - Your cost: ~$0.10 (90% margin ✅)

4. **For spam/abuse (someone submits 50k tokens):**
   - Fee: $1.00 + (30k overage / 1000 × $0.01) = $1.30
   - Spam becomes unprofitable
   - Legitimate users never hit limits

---

## Implementation Strategy

### Schema Changes
```typescript
// Add to paymentDisputes table
disputeFee: v.number(),                    // What we charge
disputeFeeBreakdown: v.object({
  baseFee: v.number(),                     // Tier-based fee
  tokenOverageFee: v.number(),             // Extra for >20k tokens
  totalFee: v.number(),                    // Sum
}),
tokensUsed: v.object({
  evidenceInput: v.number(),               // Tokens in evidence
  aiAnalysis: v.number(),                  // Tokens AI used
  total: v.number(),                       // Sum
}),
pricingTier: v.union(
  v.literal("micro"),
  v.literal("small"),
  v.literal("medium"),
  v.literal("large"),
  v.literal("enterprise")
),
```

### Pricing Function
```typescript
export function calculateDisputeFee(
  transactionAmount: number,
  tokensUsed: number
): {
  tier: string;
  baseFee: number;
  tokenOverageFee: number;
  totalFee: number;
} {
  // Determine tier
  let tier: string;
  let baseFee: number;

  if (transactionAmount < 1.00) {
    tier = "micro";
    baseFee = 0.10;
  } else if (transactionAmount < 10.00) {
    tier = "small";
    baseFee = 0.25;
  } else if (transactionAmount < 100.00) {
    tier = "medium";
    baseFee = 1.00;
  } else if (transactionAmount < 1000.00) {
    tier = "large";
    baseFee = 5.00;
  } else {
    tier = "enterprise";
    baseFee = 25.00;
  }

  // Calculate token overage
  const TOKEN_LIMIT = 20_000;
  const tokenOverageFee = tokensUsed > TOKEN_LIMIT
    ? Math.ceil((tokensUsed - TOKEN_LIMIT) / 1000) * 0.01
    : 0;

  const totalFee = baseFee + tokenOverageFee;

  return { tier, baseFee, tokenOverageFee, totalFee };
}
```

### Evidence Size Limits
```typescript
// Validation on submit
export const receivePaymentDispute = mutation({
  args: {
    // ... existing args
    evidenceUrls: v.array(v.string()),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    // Estimate tokens before processing
    const estimatedTokens = estimateTokens(
      args.description,
      args.evidenceUrls
    );

    if (estimatedTokens > 50_000) {
      throw new Error(
        "Evidence too large. Please limit description to 10,000 words " +
        "and evidence documents to 20,000 words total. " +
        "Large disputes may incur additional processing fees."
      );
    }

    // Calculate fee upfront
    const feeBreakdown = calculateDisputeFee(
      args.amount,
      estimatedTokens
    );

    // Store in dispute record
    await ctx.db.insert("paymentDisputes", {
      ...args,
      disputeFee: feeBreakdown.totalFee,
      disputeFeeBreakdown: feeBreakdown,
      estimatedTokens,
      status: "received",
    });

    // Return fee to customer immediately
    return {
      success: true,
      disputeId,
      estimatedFee: feeBreakdown.totalFee,
      tier: feeBreakdown.tier,
    };
  },
});
```

---

## Pricing Communication

### Customer-Facing Docs
```markdown
## Dispute Resolution Pricing

We charge a small, flat fee based on the transaction amount:

| Transaction Size | Resolution Fee | % of Transaction |
|-----------------|----------------|------------------|
| Under $1        | $0.10          | ~10-40%          |
| $1 - $10        | $0.25          | ~2.5-25%         |
| $10 - $100      | $1.00          | ~1-10%           |
| $100 - $1,000   | $5.00          | ~0.5-5%          |
| Over $1,000     | $25.00         | <2.5%            |

**Example:** A $0.50 coffee dispute costs just $0.10 to resolve -
far cheaper than traditional $25-50 chargeback fees!

### Token Limits
To keep costs low, we limit evidence size:
- Description: 10,000 words max
- Supporting docs: 20,000 words total
- If you exceed limits, we charge $0.01 per 1,000 extra words

**99.9% of disputes stay under these limits.**
```

---

## Revenue Projections

### Assumptions
- Average dispute: $2.50
- Average fee: $0.25
- Average cost: $0.02 (LLM + infra)
- Gross margin: 92%

### At Scale
```
1,000 disputes/day × $0.25 = $250/day = $7,500/month
Cost: $20/day × 30 = $600/month
Gross profit: $6,900/month (92% margin)

10,000 disputes/day × $0.25 = $2,500/day = $75,000/month
Cost: $200/day × 30 = $6,000/month
Gross profit: $69,000/month (92% margin)

100,000 disputes/day × $0.25 = $25,000/day = $750,000/month
Cost: $2,000/day × 30 = $60,000/month
Gross profit: $690,000/month (92% margin)
```

**Key insight:** Even at just 10¢-25¢ per dispute, you have 90%+ margins because LLMs are so cheap relative to human labor ($25/hr → $0.02/dispute).

---

## Final Recommendation

**Go with Tiered Pricing + Token Limits**

1. **Simple to communicate:** "10¢ for micro-disputes, 25¢ for small ones"
2. **Profitable:** 90%+ margins at scale
3. **Fair:** Bigger disputes cost more
4. **Protected:** Token limits prevent abuse
5. **Competitive:** 10-50x cheaper than traditional chargebacks

**Pricing tiers:**
- Micro (<$1): $0.10
- Small ($1-10): $0.25
- Medium ($10-100): $1.00
- Large ($100-1k): $5.00
- Enterprise (>$1k): $25.00

**Token limits:**
- 20,000 tokens included
- $0.01 per 1,000 tokens over limit
- Prevents abuse, rarely triggered

This is the sweet spot: simple enough for customers to understand, sophisticated enough to be fair and profitable.
