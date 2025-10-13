# Dispute Types Analysis: Expert Determination Viability

**Created:** 2025-10-13  
**Purpose:** Technical analysis of which dispute types are suitable for expert determination vs. traditional arbitration  
**Status:** Current

---

## Overview

This document analyzes the 8 dispute types currently implemented in `convex/crons.ts` and categorizes them based on their suitability for expert determination (technical/objective) vs. traditional arbitration (legal/subjective).

**Key Finding:** 75% (6 of 8) dispute types are perfect for expert determination.

### Critical Distinction

**Consulate's Architecture:**
- **Resolution Method:** Expert Determination (legal framework for binding technical determinations)
- **Communication Protocol:** Agentic Arbitration Protocol (AAP) (technical standard for dispute communication)

**Analogy:**
- AAP is like HTTP (communication protocol)
- Expert Determination is like REST (resolution framework)
- Parties communicate via AAP, disputes are resolved via expert determination

**Why This Matters:**
1. AAP is method-agnostic and supports multiple resolution frameworks (expert determination, arbitration, mediation)
2. Consulate uses expert determination for technical disputes (75% of cases)
3. The protocol name "Agentic Arbitration Protocol" refers to the communication standard, not the resolution method
4. This allows the same protocol to handle both expert determination and traditional arbitration as needed

---

## Legal Framework

### Expert Determination Requirements

Courts enforce expert determinations ONLY when:
1. The question requires **specialized technical expertise** (not legal judgment)
2. The answer is **objectively determinable** (not subjective opinion)
3. The expert stayed **within their area of expertise** (didn't make legal rulings)

### Enforcement Mechanism

**Expert Determination** (Contract Law Path):
- Based on contract clause: "Parties agree to be bound by expert's determination"
- Party files breach of contract lawsuit
- Court enforces as contract term (regular contract litigation)
- Timeline: 3-6 months to judgment

**Traditional Arbitration** (FAA Path):
- Federal Arbitration Act provides streamlined enforcement
- Court directly converts award to judgment
- Timeline: 30-60 days to judgment

---

## Dispute Type Categories

### ✅ PERFECT for Expert Determination (6 types - 75%)

#### 1. API_DOWNTIME
- **Type:** Technical SLA breach
- **Question:** "Did API meet 99.9% uptime requirement?"
- **Evidence:** System logs, monitoring data, uptime metrics
- **Metric:** Actual: 98.2% vs Required: 99.9%
- **Determination:** ✅ Objective, measurable, technical
- **Damages:** Liquidated damages clause in contract (e.g., "25% monthly credit per 1% breach")
- **Expert Role:** Verify logs, calculate uptime percentage, apply formula
- **Enforceability:** ⭐⭐⭐⭐⭐ Excellent - Clear technical standard

#### 2. RESPONSE_LATENCY
- **Type:** Technical SLA breach
- **Question:** "Did API meet <200ms response time requirement?"
- **Evidence:** Performance monitoring logs, latency data
- **Metric:** Actual: p95 latency 487ms vs Required: <200ms
- **Determination:** ✅ Objective, measurable, technical
- **Damages:** Pre-specified formula (e.g., "$50 per minute of excess latency")
- **Expert Role:** Analyze latency logs, calculate breach duration, apply formula
- **Enforceability:** ⭐⭐⭐⭐⭐ Excellent - Quantifiable performance metric

#### 3. DATA_QUALITY
- **Type:** Technical compliance
- **Question:** "Did data accuracy meet 99.5% requirement?"
- **Evidence:** Data validation reports, sample testing results
- **Metric:** Actual: 97.8% accuracy vs Required: 99.5%
- **Determination:** ✅ Objective, measurable via sampling
- **Damages:** Per-error penalty or percentage-based reduction
- **Expert Role:** Review validation methodology, verify accuracy calculations
- **Enforceability:** ⭐⭐⭐⭐ Very Good - Clear technical standard with minor sampling complexity

#### 4. API_RATE_LIMITING
- **Type:** Technical SLA breach
- **Question:** "Were API requests improperly throttled?"
- **Evidence:** Rate limit logs, request timestamps, SLA terms
- **Metric:** Guaranteed: 10,000 req/min vs Actual throttling at 7,500 req/min
- **Determination:** ✅ Objective, log-verifiable
- **Damages:** Revenue loss calculation based on blocked requests
- **Expert Role:** Verify throttling occurred, count blocked requests, apply damage formula
- **Enforceability:** ⭐⭐⭐⭐ Very Good - Technical logs provide clear evidence

#### 5. DATA_BREACH
- **Type:** Security incident
- **Question:** "Did vendor fail to meet security standards, causing breach?"
- **Evidence:** Security audit reports, breach forensics, compliance certifications
- **Metric:** Was SOC 2 Type II compliance maintained? Were encryption standards met?
- **Determination:** ✅ Objective compliance verification
- **Damages:** Liquidated damages (e.g., "$100 per affected record + remediation costs")
- **Expert Role:** Verify security controls, determine root cause, validate compliance status
- **Enforceability:** ⭐⭐⭐⭐ Very Good - Industry standards provide objective benchmarks

#### 6. FEATURE_AVAILABILITY
- **Type:** Technical SLA breach
- **Question:** "Was promised feature available as specified?"
- **Evidence:** Product documentation, API endpoints, feature testing logs
- **Metric:** Feature X guaranteed 99.9% available, actual: 94.2%
- **Determination:** ✅ Objective, testable
- **Damages:** Service credit percentage or refund
- **Expert Role:** Verify feature specification, test availability, measure compliance
- **Enforceability:** ⭐⭐⭐⭐ Very Good - Clear technical requirements

---

### ⚠️ CHALLENGING for Expert Determination (2 types - 25%)

#### 7. INTELLECTUAL_PROPERTY
- **Type:** Legal dispute
- **Question:** "Did agent infringe on intellectual property rights?"
- **Evidence:** Code comparisons, patent claims, licensing agreements
- **Metric:** Subjective similarity assessment, legal interpretation
- **Determination:** ⚠️ Requires legal judgment, not just technical analysis
- **Damages:** Complex calculation requiring legal assessment of infringement scope
- **Expert Role:** Technical similarity analysis ONLY - legal conclusions off-limits
- **Enforceability:** ⭐⭐ Poor for pure expert determination

**Why It's Challenging:**
- Requires legal interpretation of "substantial similarity"
- Patent claim construction is a legal question
- Fair use determination requires subjective judgment
- Courts unlikely to defer to expert on legal questions

**Recommended Approach:**
- Use traditional arbitration with legal arbitrator
- OR: Hybrid model (technical expert determines similarity %, lawyer determines if that % constitutes infringement)

#### 8. SERVICE_QUALITY
- **Type:** Subjective assessment
- **Question:** "Was service quality 'adequate' or 'professional standard'?"
- **Evidence:** Customer feedback, performance reviews, industry benchmarks
- **Metric:** Vague standard ("professional quality," "reasonable efforts")
- **Determination:** ⚠️ Subjective judgment call
- **Damages:** Unclear without objective breach criteria
- **Expert Role:** Can provide industry norms, but ultimate quality judgment is subjective
- **Enforceability:** ⭐⭐ Poor without objective metrics

**Why It's Challenging:**
- No objective standard to measure against
- "Quality" is inherently subjective
- Contract terms too vague for technical determination
- Expert opinion becomes just "another opinion"

**Recommended Approach:**
- Redraft contracts to include objective metrics (e.g., "API response accuracy >99%")
- OR: Use traditional arbitration with industry expert as arbitrator (not expert determiner)
- OR: Add specific technical benchmarks to contract

---

## Implementation Recommendations

### Tier 1: Implement Immediately (6 types)
- API_DOWNTIME
- RESPONSE_LATENCY
- DATA_QUALITY
- API_RATE_LIMITING
- DATA_BREACH
- FEATURE_AVAILABILITY

**Action:** Full expert determination workflow with automated damage calculation.

### Tier 2: Phase 2 Implementation (2 types)
- INTELLECTUAL_PROPERTY (require traditional arbitration)
- SERVICE_QUALITY (recommend contract redrafting or traditional arbitration)

**Action:** Route to human arbitrator OR provide contract templates with objective metrics.

---

## Contract Requirements for Expert Determination

For expert determination to work, contracts MUST include:

### 1. Expert Determination Clause
```
"Any technical disputes regarding [specific metrics] shall be resolved by 
binding expert determination through [Consulate/designated service]."
```

### 2. Liquidated Damages Formula
```
"In the event of SLA breach, Vendor shall credit Customer:
- 10% of monthly fee for 95-99% uptime
- 25% of monthly fee for 90-95% uptime
- 100% refund for <90% uptime"
```

### 3. Objective Technical Standards
```
"API uptime measured as: (total minutes - downtime minutes) / total minutes * 100
Downtime defined as: HTTP 5xx response rate >5% for >5 consecutive minutes"
```

### 4. Evidence Requirements
```
"Both parties shall maintain monitoring logs with 1-minute granularity.
Logs must be accessible via API for automated verification."
```

---

## Enforcement Strategy by Type

| Dispute Type | Resolution Method | Enforcement Path | Timeline | Cost |
|--------------|-------------------|------------------|----------|------|
| API_DOWNTIME | Expert Determination | Contract Law | 3-6 months | $5-15K |
| RESPONSE_LATENCY | Expert Determination | Contract Law | 3-6 months | $5-15K |
| DATA_QUALITY | Expert Determination | Contract Law | 3-6 months | $5-15K |
| API_RATE_LIMITING | Expert Determination | Contract Law | 3-6 months | $5-15K |
| DATA_BREACH | Expert Determination | Contract Law | 3-6 months | $10-25K |
| FEATURE_AVAILABILITY | Expert Determination | Contract Law | 3-6 months | $5-15K |
| INTELLECTUAL_PROPERTY | Traditional Arbitration | FAA | 6-12 months | $50-150K |
| SERVICE_QUALITY | Traditional Arbitration | FAA | 6-12 months | $30-100K |

---

## Key Insights

1. **75% of disputes are perfect for expert determination** - Our technical focus aligns well with expert determination model

2. **Liquidated damages clauses are critical** - Without pre-specified formulas, expert determination cannot calculate damages

3. **Objective metrics enable automation** - Technical disputes with clear metrics can be largely automated

4. **Contract design is make-or-break** - Vague terms ("reasonable quality") kill expert determination viability

5. **Speed advantage is real** - Expert determination provides 7-minute technical verification vs. 6-month arbitration

---

## Next Steps

### Product Development
1. Build automated verification for Tier 1 dispute types
2. Integrate with common monitoring tools (Datadog, New Relic, CloudWatch)
3. Create damage calculation engine based on liquidated damages clauses
4. Develop contract templates with expert-determination-friendly clauses

### Legal/Compliance
1. Draft model expert determination clauses for customer contracts
2. Establish relationships with industry experts for complex technical determinations
3. Build arbitrator network for Tier 2 disputes
4. Validate enforceability in key jurisdictions (CA, NY, DE)

### Go-to-Market
1. Focus on vendors with objective SLA metrics (API providers, cloud services)
2. Target mid-size vendors ($1M-$50M) without automated credit systems
3. Emphasize speed (7-minute determination vs. 6-month arbitration)
4. Position as "upstream" from expensive traditional arbitration

---

## References

- `convex/crons.ts` - Current dispute type implementations
- `convex/cases.ts` - Case management logic
- `.cursor/rules/compliance.mdc` - Legal authority frameworks
- Federal Arbitration Act, 9 U.S.C. § 1 et seq.
- *Jones v. St. Jude Medical S.C., Inc.*, 504 F.3d 1431 (Fed. Cir. 2007) - Expert determination enforceability

