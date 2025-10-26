# AI Ruling Terminology Analysis

## The Problem

Current system uses **"UPHELD" vs "DISMISSED"** for all dispute rulings, including first-time AI rulings. This is confusing because:

1. **"UPHELD" implies an appeal** - In legal terminology, you "uphold" a previous decision when reviewing it
2. **Not party-specific** - Unclear who wins (plaintiff/consumer vs defendant/merchant)
3. **Confusing for merchants** - A merchant reading "UPHELD" doesn't immediately know if they won or lost

## Current Implementation

### Payment Disputes Context
```typescript
// In paymentDisputes.ts
plaintiff: "customer_abc"      // The consumer who filed the chargeback
defendant: "merchant_xyz"      // The merchant/payment provider being disputed

verdict: "UPHELD"              // Means: dispute is valid, customer wins
verdict: "DISMISSED"           // Means: dispute is invalid, merchant wins
```

**Default Behavior:**
```typescript
let verdict: "UPHELD" | "DISMISSED" = "UPHELD";
// Default: favor consumer (Regulation E compliance)
```

### Traditional Cases Context
```typescript
// In cases (agent disputes)
plaintiff: "did:agent:company-a"  // Agent filing the dispute
defendant: "did:agent:company-b"  // Agent being disputed

verdict: "UPHELD"                 // Means: plaintiff's claim is valid
verdict: "DISMISSED"              // Means: plaintiff's claim is invalid
```

## The Terminology Problem

| Current Term | Legal Meaning | Who Wins | Clear? |
|-------------|---------------|----------|--------|
| UPHELD | Appeal court agrees with lower court | Depends on context | ❌ No |
| DISMISSED | Claim thrown out | Defendant | ⚠️ Somewhat |

## Brainstorming Better Terminology

### Option 1: Winner-Based (Clearest for Merchants)
```typescript
type Verdict =
  | "PLAINTIFF_WINS"      // Consumer/claimant wins
  | "DEFENDANT_WINS"      // Merchant/respondent wins
  | "SPLIT"               // Partial refund
  | "NEED_PANEL"          // Escalate to human panel

// For payment disputes specifically:
type PaymentVerdict =
  | "CONSUMER_WINS"       // ✅ Crystal clear
  | "MERCHANT_WINS"       // ✅ Crystal clear
  | "PARTIAL_REFUND"      // ✅ Clear
  | "NEED_REVIEW"         // ✅ Clear
```

**Pros:**
- ✅ Immediately clear who won
- ✅ No legal jargon
- ✅ Perfect for merchant dashboards
- ✅ Works for customer dashboards too

**Cons:**
- ⚠️ Different from legal standards
- ⚠️ Requires mapping if you integrate with legal systems

### Option 2: Claim-Based (Legal Standard)
```typescript
type Verdict =
  | "CLAIM_GRANTED"       // Dispute is valid
  | "CLAIM_DENIED"        // Dispute is invalid
  | "PARTIAL_GRANT"       // Partial validity
  | "INSUFFICIENT_INFO"   // Need more data
```

**Pros:**
- ✅ Clear from plaintiff perspective
- ✅ Common in arbitration
- ✅ More professional/legal sounding

**Cons:**
- ⚠️ Still requires thinking "who is the plaintiff?"
- ⚠️ Merchant has to remember they're the defendant

### Option 3: Chargeback-Based (Industry Standard)
```typescript
// For payment disputes specifically
type PaymentVerdict =
  | "CHARGEBACK_GRANTED"     // Consumer gets refund
  | "CHARGEBACK_DENIED"      // Merchant keeps money
  | "PARTIAL_CHARGEBACK"     // Partial refund
  | "REPRESENTMENT_SUCCESS"  // Merchant successfully disputed chargeback
```

**Pros:**
- ✅ Matches payment industry terminology
- ✅ Familiar to payment processors
- ✅ Clear outcome

**Cons:**
- ⚠️ Only works for payment disputes
- ⚠️ Doesn't work for agent SLA disputes

### Option 4: Liability-Based (Financial Clarity)
```typescript
type Verdict =
  | "PROVIDER_LIABLE"      // Merchant/service provider pays
  | "CONSUMER_LIABLE"      // Consumer pays
  | "SHARED_LIABILITY"     // Split cost
  | "NO_LIABILITY"         // No one pays (error/void)
```

**Pros:**
- ✅ Financial clarity
- ✅ Works for all dispute types
- ✅ Clear who pays

**Cons:**
- ⚠️ Sounds very formal
- ⚠️ "Liable" has legal implications

### Option 5: Action-Based (Outcome Focused)
```typescript
type Verdict =
  | "REFUND_ISSUED"        // Money goes back to consumer
  | "NO_REFUND"            // Merchant keeps money
  | "PARTIAL_REFUND"       // Split the difference
  | "MANUAL_REVIEW"        // Human decides
```

**Pros:**
- ✅ Clear action/outcome
- ✅ Great for customer service
- ✅ No legal jargon

**Cons:**
- ⚠️ Assumes dispute is always about money
- ⚠️ Doesn't work for SLA/reputation disputes

## Recommended Approach: Dual Terminology System

### For Payment Disputes (ACP/ATXP Integration)
Use **outcome-based terminology** that merchants and consumers instantly understand:

```typescript
// Consumer-facing
type ConsumerOutcome =
  | "YOU_WIN"              // ✅ You get your money back
  | "YOU_LOSE"             // ❌ No refund
  | "PARTIAL_WIN"          // 💰 Partial refund

// Merchant-facing
type MerchantOutcome =
  | "YOU_WIN"              // ✅ You keep the money
  | "YOU_LOSE"             // ❌ You must refund
  | "PARTIAL_LOSS"         // 💰 Partial refund

// System internal (for cross-compatibility)
type SystemVerdict =
  | "PLAINTIFF_WINS"       // Consumer/claimant wins
  | "DEFENDANT_WINS"       // Merchant/respondent wins
  | "SPLIT"                // Partial
  | "NEED_REVIEW"          // Escalate
```

### For Agent Disputes (Traditional Cases)
Use **claim-based terminology** for professional/legal tone:

```typescript
type CaseVerdict =
  | "CLAIM_GRANTED"        // Plaintiff's dispute is valid
  | "CLAIM_DENIED"         // Plaintiff's dispute is invalid
  | "PARTIAL_GRANT"        // Some validity
  | "NEED_PANEL"           // Human arbitration needed
```

## Implementation Strategy

### Phase 1: Add New Fields (Backward Compatible)
```typescript
// In paymentDisputes schema
aiRecommendation: v.optional(v.union(
  v.literal("UPHELD"),           // Legacy
  v.literal("DISMISSED")         // Legacy
)),
aiRecommendationV2: v.optional(v.union(
  v.literal("CONSUMER_WINS"),    // New
  v.literal("MERCHANT_WINS"),    // New
  v.literal("PARTIAL_REFUND"),   // New
  v.literal("NEED_REVIEW")       // New
)),
```

### Phase 2: Migration Function
```typescript
function migrateVerdict(old: "UPHELD" | "DISMISSED"): Verdict {
  return {
    // System verdict (for API/database)
    system: old === "UPHELD" ? "PLAINTIFF_WINS" : "DEFENDANT_WINS",

    // Consumer-facing message
    consumer: old === "UPHELD"
      ? { status: "YOU_WIN", message: "Your dispute was successful. Refund issued." }
      : { status: "YOU_LOSE", message: "Your dispute was denied." },

    // Merchant-facing message
    merchant: old === "UPHELD"
      ? { status: "YOU_LOSE", message: "Chargeback granted. Funds returned to customer." }
      : { status: "YOU_WIN", message: "Chargeback successfully disputed." },

    // Legal/professional (for reports)
    legal: old === "UPHELD" ? "CLAIM_GRANTED" : "CLAIM_DENIED"
  };
}
```

### Phase 3: Update UI Components
```typescript
// Merchant Dashboard
function MerchantDisputeCard({ dispute }: Props) {
  const outcome = dispute.verdict === "UPHELD"
    ? { icon: "❌", color: "red", text: "You Lost" }
    : { icon: "✅", color: "green", text: "You Won" };

  return (
    <Card>
      <Badge color={outcome.color}>{outcome.icon} {outcome.text}</Badge>
      <Amount>${dispute.amount}</Amount>
    </Card>
  );
}

// Consumer Dashboard
function ConsumerDisputeCard({ dispute }: Props) {
  const outcome = dispute.verdict === "UPHELD"
    ? { icon: "✅", color: "green", text: "Approved" }
    : { icon: "❌", color: "red", text: "Denied" };

  return (
    <Card>
      <Badge color={outcome.color}>{outcome.icon} {outcome.text}</Badge>
      <RefundAmount>${dispute.amount}</RefundAmount>
    </Card>
  );
}
```

## Ideal Configuration by Use Case

### 1. **Merchant / Payment Provider** (Your ACP/ATXP Customers)
**Best Terminology:** `MERCHANT_WINS` / `MERCHANT_LOSES` or `CHARGEBACK_DENIED` / `CHARGEBACK_GRANTED`

**Why:**
- They care about: "Do I keep the money or do I refund?"
- They want instant clarity without legal thinking
- They're looking at hundreds of disputes per day
- Dashboard should show: **Win Rate**, **Loss Rate**, **$ Saved**, **$ Lost**

**Example Dashboard:**
```
📊 Dispute Performance (Last 30 Days)
✅ Won: 847 disputes ($12,450)
❌ Lost: 123 disputes ($1,890)
⚖️  Pending: 34 disputes ($567)

Win Rate: 87.3% 📈 (+2.1% vs last month)
```

### 2. **Payment Protocol / Intermediary** (ACP/ATXP Infrastructure)
**Best Terminology:** `PLAINTIFF_WINS` / `DEFENDANT_WINS` (system-level)

**Why:**
- They need role-agnostic terminology
- They don't care who wins, just that disputes resolve
- They need audit trails and compliance reports
- Dashboard should show: **Resolution Time**, **Auto-Resolution Rate**, **Appeal Rate**

**Example Dashboard:**
```
📈 Network Performance
⚡ Avg Resolution: 4.2 minutes
🤖 Auto-Resolved: 94.3%
👤 Human Review: 5.7%
🔄 Appealed: 0.8%

Regulation E Compliance: 100% ✅
(All disputes resolved within 10 business days)
```

### 3. **Consumer** (Rare - usually B2B)
**Best Terminology:** `APPROVED` / `DENIED` or `REFUND_ISSUED` / `NO_REFUND`

**Why:**
- They care about: "Do I get my money back?"
- Simple, clear language
- No legal jargon

## Regulation E Consideration

**Important:** Regulation E requires:
- Consumer is provisionally credited within **10 business days**
- Investigation completed within **45 days** for POS, **90 days** for new accounts
- If merchant wins, bank can reverse provisional credit

**This means:**
- Early AI ruling doesn't change provisional credit
- "UPHELD" (consumer wins) = provisional credit becomes permanent
- "DISMISSED" (merchant wins) = bank reverses provisional credit

**Better terminology for Regulation E context:**
```typescript
type RegEVerdict =
  | "PROVISIONAL_CREDIT_PERMANENT"  // Consumer keeps the refund
  | "PROVISIONAL_CREDIT_REVERSED"   // Consumer must repay
  | "UNDER_INVESTIGATION"            // Still determining
```

## Final Recommendation

### Immediate Fix (Low Effort)
Keep current schema but add helper functions for display:

```typescript
// Add to paymentDisputes.ts
export function getVerdictForParty(
  verdict: "UPHELD" | "DISMISSED",
  party: "consumer" | "merchant"
): "WIN" | "LOSE" {
  if (party === "consumer") {
    return verdict === "UPHELD" ? "WIN" : "LOSE";
  } else {
    return verdict === "UPHELD" ? "LOSE" : "WIN";
  }
}

export function getVerdictMessage(
  verdict: "UPHELD" | "DISMISSED",
  party: "consumer" | "merchant"
): string {
  const isConsumer = party === "consumer";
  const consumerWins = verdict === "UPHELD";

  if (isConsumer) {
    return consumerWins
      ? "✅ Your dispute was approved. Refund issued."
      : "❌ Your dispute was denied.";
  } else {
    return consumerWins
      ? "❌ Chargeback granted. Funds returned to customer."
      : "✅ Chargeback successfully disputed. You keep the funds.";
  }
}
```

### Long-term Solution (Better UX)
Add new verdict system with audience-specific terminology:

```typescript
// New schema field
customerFacingVerdict: v.union(
  v.literal("CONSUMER_WINS"),
  v.literal("MERCHANT_WINS"),
  v.literal("PARTIAL_REFUND")
),
```

---

**TL;DR:**
- Current "UPHELD/DISMISSED" is confusing legal jargon
- Merchants want to see "YOU WIN" vs "YOU LOSE"
- Payment providers want "PLAINTIFF_WINS" vs "DEFENDANT_WINS"
- Consumers want "APPROVED" vs "DENIED"
- Recommend: Add party-specific display logic NOW, migrate terminology LATER

**Next Steps:**
1. Add `getVerdictForParty()` helper function
2. Update merchant dashboard to show "Win/Loss"
3. Plan schema migration for v2 terminology
