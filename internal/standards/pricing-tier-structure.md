# Consulate Pricing Tier Structure

**Version**: 1.0  
**Effective Date**: October 9, 2025  
**Document Type**: Business Model Specification  
**Status**: Draft for Implementation  

---

## Executive Summary

Consulate's pricing is designed to be **90-95% cheaper than traditional arbitration** while maintaining healthy margins through automation. This document defines the three-tier model aligned with dispute complexity and automation level.

---

## Benchmark: Traditional Human Arbitration Costs

| Forum | Typical Fee Model | Average Total Cost |
|-------|------------------|-------------------|
| **AAA** (American Arbitration Association) | Filing fee $925–$8,700 + arbitrator hourly rates ($300–$800/hr) | $30K–$150K per enterprise case |
| **JAMS** | Filing fee $1,750 + hourly rates $500–$1,200/hr | $50K–$250K |
| **ICC / LCIA / SIAC** (International) | % of dispute value (0.5–3%) + institutional admin fees | Often $100K+ |

**Problem**: Enterprises hate arbitration because it's slow (6-18 months) and expensive.

---

## Consulate's Value Proposition

**Speed + Automation** = Radically lower costs

- **95-100% automated** for micro-disputes (under $10K)
- **Semi-automated** (AI + human oversight) for mid-tier ($10K–$1M)
- **Human verification + evidentiary hearings** for enterprise ($1M+)

This allows pricing that is **90-95% cheaper** than legacy arbitration.

---

## Tier 1: Micro / Agentic Tier

### Target Users
- **AI agents** disputing with other AI agents
- **Dispute value**: Under $10,000
- **Volume expectation**: Millions of micro-disputes per month

### Automation Level
- **95-100% automated**
  - AI arbitrators review evidence
  - No human involvement unless appealed
  - Decision in < 24 hours

### Pricing
**Flat fee per case**: $10–$50 (based on claim value)

| Claim Value | Filing Fee | Total Cost |
|------------|-----------|-----------|
| Under $100 | $10 | $10 |
| $100–$1,000 | $25 | $25 |
| $1,000–$5,000 | $35 | $35 |
| $5,000–$10,000 | $50 | $50 |

### Revenue Model
- **High volume, low friction**
- If Consulate processes **1 million micro-disputes/month** at $25 average:
  - Monthly revenue: **$25M**
  - Annual revenue: **$300M**
- Margins: ~90% (mostly compute costs)

### Why This Works
- Traditional arbitration doesn't serve this market (too expensive)
- Agents need fast, cheap dispute resolution
- Network effects: more agents → more disputes → more revenue

---

## Tier 2: SMB / API Tier

### Target Users
- **Enterprises** using AI APIs (OpenAI, Anthropic, etc.)
- **Platform providers** with SLA disputes
- **Dispute value**: $10,000–$1,000,000

### Automation Level
- **Semi-automated** (AI + human oversight)
  - AI judges review and recommend
  - Human arbitrator validates and signs off
  - Decision in 7-21 days

### Pricing
**Percentage of dispute value**: 0.25–0.5%

| Claim Value | Fee Rate | Min Fee | Max Fee |
|------------|---------|---------|---------|
| $10K–$50K | 0.5% | $250 | $250 |
| $50K–$100K | 0.4% | $400 | $400 |
| $100K–$500K | 0.3% | $500 | $1,500 |
| $500K–$1M | 0.25% | $1,250 | $2,500 |

**Cap**: $5,000 per case maximum

### Revenue Model
- **Medium volume, medium margin**
- If Consulate processes **1,000 disputes/month** at $500K average claim:
  - Average fee: 0.3% × $500K = **$1,500/case**
  - Monthly revenue: **$1.5M**
  - Annual revenue: **$18M**
- Margins: ~70% (AI costs + human arbitrator $2,500 flat fee)

### Optional Add-Ons
- **Expedited processing** (7-day turnaround): +50% fee
- **Live hearing** (video conference): +$1,000
- **Expert witness** (third-party validator): Cost pass-through + 10%

---

## Tier 3: Enterprise / Governance Tier

### Target Users
- **Multi-agent systems** or high-value disputes
- **Government procurement** disputes
- **Dispute value**: Over $1,000,000

### Automation Level
- **Human verification + evidentiary hearings**
  - 5-judge panel (3 AI + 2 human)
  - Live evidentiary hearings if requested
  - Full deliberation process
  - Decision in 30-60 days

### Pricing
**Percentage of dispute value**: 1% (capped at $25,000)

| Claim Value | Fee Rate | Min Fee | Max Fee |
|------------|---------|---------|---------|
| $1M–$2.5M | 1% | $10,000 | $25,000 |
| Over $2.5M | 1% | $25,000 | $25,000 (cap) |

**Cap**: $25,000 per case maximum

### Revenue Model
- **Low volume, high value**
- If Consulate processes **50 disputes/year** at $5M average claim:
  - Average fee: 1% × $5M = **$25,000/case** (capped)
  - Annual revenue: **$1.25M**
- Margins: ~50% (significant human arbitrator time)

### Optional Add-Ons
- **Panel of 7 judges** (5 AI + 2 human): +$10,000
- **Multi-day hearing** (3+ days): +$5,000/day
- **Expert economic analysis**: Cost pass-through + 10%

---

## Alternative: Subscription / Retainer Model

For enterprises that anticipate **high volume** of disputes, offer **subscription pricing** instead of per-case fees.

### SMB Subscription Tiers

| Tier | Monthly Fee | Included Cases | Overage Fee |
|------|------------|---------------|-------------|
| **Starter** | $5,000/mo | Up to 10 cases | $500/case |
| **Growth** | $15,000/mo | Up to 50 cases | $300/case |
| **Enterprise** | $50,000/mo | Up to 200 cases | $250/case |

### Enterprise Annual Retainers

| Tier | Annual Fee | Included Volume | Benefits |
|------|-----------|----------------|----------|
| **Corporate** | $100K/year | Unlimited micro (<$10K) | Dedicated account manager, API priority |
| **Platform** | $500K/year | Unlimited micro + 100 SMB | Custom integrations, white-label option |
| **Sovereign** | $1M/year | Unlimited all tiers | Regulatory compliance, audit support, custom governance |

### Why Subscriptions Work
- **Predictable revenue** for Consulate
- **Budgeting certainty** for enterprises
- **Incentive alignment**: more disputes = more value to customer
- **Sticky customers**: switching costs are high

---

## Pricing Comparison: Consulate vs. Traditional

### Example Case: $500K SLA Breach Dispute

| Provider | Fee Structure | Total Cost | Timeline |
|---------|--------------|-----------|----------|
| **AAA** | $8,700 filing + $400/hr × 100 hrs | ~$50,000 | 6-12 months |
| **JAMS** | $1,750 filing + $800/hr × 80 hrs | ~$65,000 | 6-12 months |
| **ICC** | 0.5% of value + admin fees | ~$5,000–$10,000 | 12-18 months |
| **Consulate** | 0.3% of value | **$1,500** | 14-21 days |

**Savings**: 92-97% cheaper, 10-20x faster

---

## Revenue Projections (Year 1-3)

### Year 1: Proving Model
- **Micro tier**: 100K disputes × $25 avg = **$2.5M**
- **SMB tier**: 500 disputes × $1,500 avg = **$750K**
- **Enterprise tier**: 10 disputes × $25K = **$250K**
- **Total**: **$3.5M revenue**

### Year 2: Scaling Up
- **Micro tier**: 1M disputes × $25 avg = **$25M**
- **SMB tier**: 5,000 disputes × $1,500 avg = **$7.5M**
- **Enterprise tier**: 50 disputes × $25K = **$1.25M**
- **Subscriptions**: 20 enterprise subs × $100K = **$2M**
- **Total**: **$35.75M revenue**

### Year 3: Market Leader
- **Micro tier**: 10M disputes × $25 avg = **$250M**
- **SMB tier**: 20,000 disputes × $1,500 avg = **$30M**
- **Enterprise tier**: 200 disputes × $25K = **$5M**
- **Subscriptions**: 100 enterprise subs × $200K avg = **$20M**
- **Total**: **$305M revenue**

**Key Insight**: Micro-tier volume is the real revenue driver once agentic ecosystems mature.

---

## Cost Structure

### Fixed Costs (Monthly)
- **Infrastructure** (Convex, Vercel): $5K–$10K
- **Engineering team** (3-5 engineers): $100K
- **Legal/compliance**: $20K
- **Sales/marketing**: $30K
- **Total fixed**: ~$155K/month = $1.86M/year

### Variable Costs (Per Case)
- **Micro tier**: $1–$2 (compute only)
- **SMB tier**: $100–$500 (compute + human arbitrator $2,500 flat fee ÷ cases)
- **Enterprise tier**: $5,000–$10,000 (human arbitrator time, expert fees)

### Margin Analysis

| Tier | Avg Revenue/Case | Avg Cost/Case | Gross Margin |
|------|-----------------|--------------|--------------|
| **Micro** | $25 | $2 | **92%** |
| **SMB** | $1,500 | $300 | **80%** |
| **Enterprise** | $25,000 | $10,000 | **60%** |

**Blended margins**: 85-90% at scale (once micro-tier dominates volume)

---

## Fee Transparency and Trust

### Public Fee Schedule
- All fees published at: https://x402disputes.com/pricing
- No hidden costs
- Fee calculator tool: enter claim value → see exact cost

### Fee Breakdown Disclosure
Every case invoice shows:
- Filing fee
- Arbitrator fees (if applicable)
- Administrative fees
- Add-on fees (hearing, expedited, etc.)
- Total

### No Surprise Billing
- **No hourly rates** (all flat fees or % of value)
- **Caps clearly stated** (max $25K for enterprise tier)
- **Refund policy**: If case dismissed within 7 days, 50% refund

---

## Competitor Positioning

### Consulate vs. Kleros (Blockchain Arbitration)
- **Kleros**: Crowdsourced judges, token-based voting, crypto-native
- **Consulate**: AI judges + human oversight, enterprise-friendly, fiat payment
- **Advantage**: Consulate has legal enforceability (FAA compliance), not just crypto disputes

### Consulate vs. Ross Intelligence / Legal AI
- **Ross/Legal AI**: Legal research tools, not adjudication
- **Consulate**: End-to-end dispute resolution with binding awards
- **Advantage**: Consulate provides outcomes, not just insights

### Consulate vs. Traditional Arbitration (AAA, JAMS, ICC)
- **Traditional**: Human-only, slow, expensive
- **Consulate**: AI-first, fast, cheap
- **Advantage**: 90%+ cost savings, 10-20x speed improvement

---

## Pricing Strategy: Land and Expand

### Phase 1: Land (Free Tier)
- **Offer**: First 1,000 cases **free** for early adopters
- **Goal**: Seed the market, gather testimonials, prove value
- **Timeline**: Months 1-6

### Phase 2: Expand (Paid Tier)
- **Offer**: Standard pricing (micro $10-$50, SMB 0.25-0.5%, enterprise 1%)
- **Goal**: Convert free users to paid, scale volume
- **Timeline**: Months 7-18

### Phase 3: Premium (Subscriptions)
- **Offer**: Annual retainers for high-volume customers
- **Goal**: Lock in large customers, predictable revenue
- **Timeline**: Months 19+

---

## Dynamic Pricing Considerations

### Volume Discounts
- Enterprises with >100 cases/year: **-20% off per-case fees**
- Platforms with >1,000 cases/year: **Custom subscription pricing**

### Industry-Specific Pricing
- **Financial services**: +10% (higher regulatory scrutiny)
- **Healthcare**: +15% (HIPAA compliance overhead)
- **Government**: Custom (RFP-based, often fixed-price contracts)

### Geographic Pricing
- **US/EU/UK**: Standard pricing
- **Emerging markets**: -30% (local purchasing power)

---

## Implementation Checklist

### Week 1-2: Technical
- ✅ Add pricing tiers to Convex schema
- ✅ Implement fee calculation logic
- ✅ Build fee calculator widget for x402disputes.com/pricing

### Week 3-4: Legal
- ✅ Review fee structure with legal counsel (ensure no usury issues)
- ✅ Draft fee disclosure terms (transparency requirements)
- ✅ Update arbitration agreement template to include fee schedule

### Week 5-6: Marketing
- ✅ Publish pricing page on x402disputes.com
- ✅ Create comparison chart (Consulate vs. AAA/JAMS/ICC)
- ✅ Write blog post: "Why AI Arbitration is 90% Cheaper"

### Week 7-8: Sales
- ✅ Train sales team on pricing tiers and subscription options
- ✅ Create ROI calculator for enterprise prospects
- ✅ Prepare case studies showing cost savings

---

## Pricing FAQs

**Q: Why is Consulate so much cheaper than traditional arbitration?**
A: Automation. AI judges handle 95-100% of micro-disputes with zero human labor. Even for complex cases, AI reduces arbitrator time by 70-80%.

**Q: Is this too cheap to be credible?**
A: No. Our cost structure is fundamentally different (compute vs. labor). Legacy arbitration is expensive because of human hourly rates, not because justice is inherently expensive.

**Q: What if the dispute value is contested?**
A: Claimant declares claimed value at filing. If respondent disputes value, panel determines actual value during proceedings and adjusts fee accordingly.

**Q: Can I get a refund if I lose?**
A: No. Arbitration fees are administrative (like court filing fees), not contingent on outcome. However, panel may award costs to prevailing party.

**Q: Do you offer contingency pricing (pay only if I win)?**
A: Not currently. Contingency pricing creates perverse incentives for arbitrators. We maintain neutrality through fixed fees.

**Q: What happens if respondent doesn't pay the award?**
A: Consulate doesn't enforce awards (that's a court's job). However, we:
- Report non-compliance to credit bureaus / reputation systems
- Provide award documentation for enforcement proceedings
- Offer smart contract escrow (optional) for crypto disputes

---

## Next Steps

1. **Review with legal counsel**: Ensure fee structure complies with arbitration law
2. **Build fee calculator**: Widget on x402disputes.com/pricing
3. **Update schema**: Add `pricingTier`, `feeAmount` to `cases` table
4. **Implement billing**: Integrate Stripe for payment processing
5. **Launch pricing page**: Publish publicly within 2 weeks

---

**Document Owner**: Vivek Kotecha  
**Last Updated**: October 9, 2025  
**Next Review**: December 2025 (after first 100 paid cases)

