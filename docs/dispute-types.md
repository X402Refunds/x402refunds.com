# Dispute Types Supported by Consulate

Consulate provides fast, automated dispute resolution for technical disputes between AI systems, API vendors, and their customers. This document outlines the types of disputes we can resolve.

---

## Overview

Consulate specializes in **technical disputes with objective metrics**. Our platform provides 7-minute expert determination for SLA breaches, compliance failures, and performance issues where the facts can be verified through system logs and monitoring data.

**Important Distinction:**
- **Resolution Method:** Disputes are resolved through **Expert Determination** (not traditional arbitration)
- **Communication Standard:** We use the **Agentic Arbitration Protocol (AAP)** as the technical communication layer

Think of AAP as the "HTTP of dispute resolution" - it's the protocol that agents use to communicate, file claims, and exchange evidence. Expert determination is the legal framework we use to make binding technical determinations.

**Key Features:**
- ✅ Automated log verification
- ✅ Objective metric validation
- ✅ Liquidated damages calculation
- ✅ Binding expert determination
- ✅ Enforceable via contract law

---

## Supported Dispute Types

### 1. API Uptime & Availability 

**What We Resolve:**
- SLA uptime breaches (e.g., guaranteed 99.9% uptime not met)
- Service outages and downtime incidents
- Feature availability violations

**How It Works:**
1. Customer files claim with monitoring logs
2. Consulate verifies actual uptime from logs
3. System calculates damages based on SLA terms
4. Binding determination issued in 7 minutes

**Example:**
> **Claim:** "API was down 2.3 hours in March, breaching 99.9% uptime SLA"  
> **Evidence:** Datadog monitoring logs, incident reports  
> **Determination:** Breach confirmed. 98.7% uptime vs. 99.9% guarantee.  
> **Damages:** 25% monthly credit ($12,500) per liquidated damages clause

**Common SLA Terms:**
- 99.9% uptime guarantees
- Maximum downtime thresholds (e.g., <43 minutes/month)
- Feature-specific availability requirements

---

### 2. API Performance & Latency

**What We Resolve:**
- Response time SLA breaches (e.g., <200ms guarantee not met)
- Throughput/rate limit violations
- Performance degradation claims

**How It Works:**
1. Customer provides latency monitoring data
2. Consulate analyzes p50/p95/p99 metrics
3. System verifies SLA breach and calculates impact
4. Determination issued with credit amount

**Example:**
> **Claim:** "API p95 latency exceeded 200ms guarantee for 4 days"  
> **Evidence:** New Relic APM data showing 487ms p95 latency  
> **Determination:** Breach confirmed. 487ms vs. 200ms requirement.  
> **Damages:** $5,000 credit (10% of monthly fee)

**Common SLA Terms:**
- p95/p99 latency thresholds
- API request per second (RPS) guarantees
- Time to first byte (TTFB) requirements

---

### 3. Data Quality & Accuracy

**What We Resolve:**
- Data accuracy SLA breaches (e.g., 99% accuracy guarantee)
- Missing or incomplete data delivery
- Data freshness violations (e.g., real-time data delayed)

**How It Works:**
1. Customer submits sample data validation results
2. Consulate reviews methodology and verifies calculations
3. System determines if accuracy threshold was breached
4. Damages calculated based on SLA terms

**Example:**
> **Claim:** "Enrichment API returned inaccurate data 3.2% of the time"  
> **Evidence:** Validation report on 10,000 sample records  
> **Determination:** Breach confirmed. 96.8% accuracy vs. 99% guarantee.  
> **Damages:** $8,000 refund per contract terms

**Common SLA Terms:**
- Minimum data accuracy percentages
- Data completeness requirements
- Freshness/latency guarantees for real-time data

---

### 4. Rate Limiting & Throttling

**What We Resolve:**
- API rate limit violations (requests throttled below guaranteed rate)
- Unexpected throttling during peak usage
- Fair usage policy disputes

**How It Works:**
1. Customer provides request logs showing throttling
2. Consulate verifies guaranteed rate vs. actual throttling
3. System calculates lost requests and business impact
4. Determination issued with damages

**Example:**
> **Claim:** "API throttled at 7,500 req/min vs. 10,000 req/min guarantee"  
> **Evidence:** Request logs showing 429 errors during peak traffic  
> **Determination:** Breach confirmed. 25% capacity reduction.  
> **Damages:** $3,750 credit (25% of monthly fee)

**Common SLA Terms:**
- Guaranteed requests per minute/second
- Burst capacity allowances
- Peak traffic handling guarantees

---

### 5. Security & Compliance

**What We Resolve:**
- Data breach notification failures
- Security standard violations (SOC 2, ISO 27001)
- Encryption/compliance requirement breaches

**How It Works:**
1. Customer files claim with security audit reports
2. Consulate reviews compliance certifications and breach reports
3. Technical experts verify security standards were not met
4. Determination issued (may require human review for complex cases)

**Example:**
> **Claim:** "Vendor failed to maintain SOC 2 Type II compliance"  
> **Evidence:** Expired SOC 2 report, lack of current certification  
> **Determination:** Breach confirmed. No valid certification during contract period.  
> **Damages:** $50,000 penalty per liquidated damages clause

**Common SLA Terms:**
- Mandatory security certifications (SOC 2, ISO 27001, HIPAA)
- Encryption requirements (TLS 1.3, AES-256)
- Breach notification timelines (e.g., 72 hours)

---

### 6. Feature Functionality

**What We Resolve:**
- Promised features not delivered
- Feature performance below specification
- API endpoint availability failures

**How It Works:**
1. Customer demonstrates feature is missing or non-functional
2. Consulate reviews product documentation and contract terms
3. System verifies feature status via API testing
4. Determination issued with appropriate remedies

**Example:**
> **Claim:** "Batch processing API advertised as available, but returned 404"  
> **Evidence:** API documentation, test requests showing 404 errors  
> **Determination:** Feature not available as promised.  
> **Damages:** Full refund for affected month ($20,000)

**Common SLA Terms:**
- Feature availability guarantees
- API endpoint uptime requirements
- Beta vs. production feature distinctions

---

## Coming Soon: Advanced Dispute Types

### Intellectual Property (Phase 2)

**What We'll Resolve:**
- Patent/copyright infringement claims
- API similarity disputes
- Training data licensing violations

**Approach:** Hybrid model with technical analysis + human arbitrator for legal determinations

---

### Service Quality (Phase 2)

**What We'll Resolve:**
- General "quality of service" disputes
- Professional standards violations
- Customer satisfaction guarantees

**Approach:** Contract redesign to add objective metrics + human arbitrator review

---

## How to File a Dispute

1. **Log in to Consulate Dashboard** - [https://consulatehq.com/dashboard](https://consulatehq.com/dashboard)
2. **Select Dispute Type** - Choose from supported categories above
3. **Upload Evidence** - Monitoring logs, contracts, system reports
4. **Submit Claim** - Provide claim amount and reasoning
5. **Automated Review** - System verifies facts and calculates damages
6. **Determination Issued** - Binding ruling delivered in 7 minutes (simple cases) to 48 hours (complex cases)

**Cost:** $500-2,000 depending on dispute complexity (see [Pricing](https://consulatehq.com/pricing))

---

## Requirements for Expert Determination

For Consulate to resolve your dispute via expert determination, your contract must include:

### 1. Expert Determination Clause

Your SLA or service agreement should reference expert determination:

```
"Technical disputes regarding SLA performance shall be resolved by 
binding expert determination through Consulate (consulatehq.com) or 
a mutually agreed technical expert."
```

### 2. Objective Metrics

SLA terms must include measurable thresholds:

```
✅ Good: "API uptime shall be ≥99.9%, measured as (total minutes - downtime) / total minutes"
❌ Vague: "API shall be available at reasonable levels"
```

### 3. Liquidated Damages Formula

Pre-specified penalties for breaches:

```
✅ Good: "For uptime <99%, Customer receives 25% monthly credit"
❌ Vague: "Customer may receive compensation at Vendor's discretion"
```

**Don't have these clauses?** We provide free SLA templates with expert-determination-friendly language. [Download Templates](https://consulatehq.com/templates)

---

## Why Expert Determination?

### vs. Traditional Arbitration

| Factor | Consulate Expert Determination | Traditional Arbitration |
|--------|--------------------------------|-------------------------|
| **Timeline** | 7 minutes to 48 hours | 6-12 months |
| **Cost** | $500-2,000 | $50,000-150,000 |
| **Process** | Automated log verification | Hearings, depositions, briefs |
| **Best For** | Technical SLA disputes with clear metrics | Complex legal disputes |
| **Enforceability** | Contract law (3-6 month enforcement) | Federal Arbitration Act (30-60 day enforcement) |

### When to Use Expert Determination

✅ **Use Expert Determination for:**
- SLA breaches with objective metrics
- Performance/uptime disputes
- Technical compliance failures
- Data quality issues
- Clear contractual violations

❌ **Use Traditional Arbitration for:**
- Intellectual property disputes
- Subjective quality assessments
- Complex damages calculations
- Legal interpretation questions

---

## Questions?

- **Sales:** [sales@consulatehq.com](mailto:sales@consulatehq.com)
- **Support:** [support@consulatehq.com](mailto:support@consulatehq.com)
- **Documentation:** [https://consulatehq.com/docs](https://consulatehq.com/docs)
- **SLA Templates:** [https://consulatehq.com/templates](https://consulatehq.com/templates)

---

## Related Resources

- [Agentic Arbitration Protocol (AAP) Specification](https://github.com/consulatehq/agentic-arbitration-protocol)
- [Evidence Submission Guide](https://consulatehq.com/docs/evidence)
- [SLA Contract Templates](https://consulatehq.com/templates)
- [API Documentation](https://consulatehq.com/docs/api)

