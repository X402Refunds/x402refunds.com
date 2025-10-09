# Consulate Arbitration Rules v1.0

**Effective Date**: October 9, 2025  
**Version**: 1.0  
**License**: CC-BY 4.0 (Creative Commons Attribution)  
**Canonical URL**: https://consulatehq.com/rules/v1.0  
**Protocol Hash**: `sha256:172087c419c3fd990ffa74ed7f68e64cdf4fe764cc74a43866c814e1554dc659`
**Timestamp Method**: GitHub commit + RFC 3161 (DigiCert TSA)  
**Timestamp**: Oct  9 07:56:57 2025 GMT  
**RFC 3161 Proof**: Available at `.timestamps/consulate-arbitration-rules-v1.0.tsr`

---

## Preamble

The Consulate Arbitration Rules establish a transparent, neutral, and technologically-native framework for resolving disputes between autonomous agents, AI systems, and enterprises in digital commerce.

These rules are designed to provide:
- **Speed**: Resolution in hours or days, not months
- **Transparency**: All procedures are public and auditable
- **Neutrality**: No party receives preferential treatment
- **Enforceability**: Awards are cryptographically signed and legally binding under pre-agreed arbitration agreements
- **Scalability**: From micro-disputes ($10) to enterprise conflicts ($1M+)

---

## Article 1: Scope of Application

### 1.1 Applicability
These rules apply to any dispute where:
- All parties have agreed in writing (including digitally signed contracts) to arbitrate under Consulate Rules
- The dispute arises from AI agent interactions, service level agreements, or autonomous system conflicts
- The claim value is determinable and verifiable

### 1.2 Jurisdiction
Consulate arbitration operates as:
- **Primary jurisdiction**: For disputes between AI agents with pre-agreed arbitration clauses
- **Consensual jurisdiction**: For disputes where parties elect Consulate post-conflict
- **Appellate jurisdiction**: Only where explicitly contracted

### 1.3 Exclusions
These rules do not apply to:
- Criminal matters
- Disputes involving human bodily harm
- Family law matters
- Matters prohibited from arbitration by applicable law

---

## Article 2: Notice and Commencement

### 2.1 Filing a Dispute
A claimant initiates arbitration by submitting:
- **Dispute manifest** (JSON-LD formatted claim)
- **Evidence bundle** (structured data + cryptographic proofs)
- **Filing fee** (based on claim value tier)
- **Proof of arbitration agreement** (contract reference or digital signature)

### 2.2 Technical Filing Format
```json
{
  "@context": "https://consulatehq.com/schema/dispute/v1",
  "@type": "DisputeFiling",
  "claimant": {"id": "agent://vendor.ai/agent-123"},
  "respondent": {"id": "agent://consumer.ai/agent-456"},
  "claimAmount": {"value": 5000, "currency": "USD"},
  "breachType": "SLA_RESPONSE_TIME",
  "contractReference": "ipfs://Qm...",
  "evidenceBundle": ["evidence://ev_abc123"],
  "filedAt": "2025-10-09T10:00:00Z",
  "signature": "0x..."
}
```

### 2.3 Notice to Respondent
Within **24 hours** of filing:
- Respondent receives automated notification via registered endpoint
- Notification includes claim summary, evidence index, and response deadline
- Delivery is cryptographically confirmed

---

## Article 3: Response and Defense

### 3.1 Response Deadline
Respondent must file a response within:
- **7 days** for claims under $10,000
- **14 days** for claims $10,000–$100,000
- **21 days** for claims over $100,000

### 3.2 Response Requirements
A valid response includes:
- Admission or denial of each claim element
- Counter-evidence bundle
- Any counterclaims (with separate filing fee)
- Digital signature of authorized agent

### 3.3 Default Judgment
If respondent fails to respond within the deadline:
- Claimant may move for default judgment
- System automatically reviews claim for facial validity
- Default awards issue within 48 hours if claim is proper

---

## Article 4: Evidence Standards

### 4.1 Admissible Evidence
Evidence must be:
- **Verifiable**: Cryptographically signed, timestamped, or blockchain-anchored
- **Relevant**: Directly related to the claim
- **Authentic**: From a trusted source or verified via digital signature

### 4.2 Evidence Categories
- **Type 1 - System logs**: API call logs, response time measurements, error logs
- **Type 2 - Contracts**: Service agreements, SLAs, terms of service
- **Type 3 - Communications**: Agent-to-agent messages, notifications, agreements
- **Type 4 - Financial**: Transaction records, payment proofs, invoices
- **Type 5 - Expert**: Third-party validation, independent audits

### 4.3 Evidence Format
All evidence submitted via standardized manifest:
```json
{
  "@type": "EvidenceManifest",
  "evidenceId": "ev_abc123",
  "evidenceType": "SYSTEM_LOGS",
  "submittedBy": "claimant",
  "timestamp": "2025-10-09T10:00:00Z",
  "contentHash": "sha256:...",
  "storageUri": "ipfs://Qm...",
  "signature": "0x...",
  "metadata": {
    "description": "API response time logs showing SLA breach",
    "dateRange": "2025-10-01/2025-10-07"
  }
}
```

### 4.4 Burden of Proof
- Claimant bears burden of proving breach and damages
- Standard: **Preponderance of evidence** (more likely than not)
- For technical claims: System-generated evidence is presumed authentic unless challenged

---

## Article 5: Arbitration Panel

### 5.1 Panel Composition

**Micro/Agentic Tier** (claims under $10K):
- Single AI arbitrator
- Human oversight review only if appealed

**SMB/API Tier** ($10K–$1M):
- 3-judge panel: 2 AI judges + 1 human arbitrator
- Human has tiebreaker authority

**Enterprise/Governance Tier** (over $1M):
- 5-judge panel: 3 AI judges + 2 human arbitrators
- Requires supermajority (3/5) for ruling

### 5.2 Arbitrator Selection
- **Claimant** selects 1 arbitrator
- **Respondent** selects 1 arbitrator
- **System** appoints neutral chair or additional judges
- All selections from pre-vetted registry

### 5.3 Arbitrator Qualifications
AI arbitrators must:
- Be trained on legal precedent and arbitration standards
- Have explainable decision-making (not black-box)
- Maintain 85%+ consistency with human legal standards (validated)
- Disclose model architecture and training data provenance

Human arbitrators must:
- Hold JD, arbitration certification, or equivalent
- Have no conflict of interest
- Complete Consulate AI Arbitration training

### 5.4 Challenge and Recusal
Any arbitrator may be challenged for:
- Demonstrable bias
- Conflict of interest
- Technical malfunction (for AI arbitrators)

Challenges decided by Consulate Ethics Board within 48 hours.

---

## Article 6: Proceedings

### 6.1 Process Timeline

**Fast Track** (automated, <$10K):
- Filing → Response (7 days) → Review (2 days) → Award (1 day)
- Total: **~10 days**

**Standard Track** ($10K–$1M):
- Filing → Response (14 days) → Discovery (14 days) → Hearing (if needed, 7 days) → Deliberation (7 days) → Award
- Total: **~42 days**

**Complex Track** (>$1M or multi-party):
- Custom timeline set by panel
- Must not exceed **90 days** from filing to award

### 6.2 Discovery
Limited to:
- Document requests related to claim elements
- Technical system data (logs, configurations)
- No depositions unless panel orders for complex cases

### 6.3 Hearings
- Default: Written submissions only (no live hearing)
- **Optional live hearing** if:
  - Either party requests and pays hearing fee
  - Panel deems necessary for credibility assessment
  - Claim value exceeds $100K

- Live hearings conducted via secure video conference
- Recorded and transcribed for the record

### 6.4 Confidentiality
- Proceedings are **confidential by default**
- Parties may agree to public proceedings
- Awards are **public** (anonymized unless parties object)
- Precedential value requires publication

---

## Article 7: Awards and Enforcement

### 7.1 Award Requirements
Every award must include:
- **Finding of facts**: What happened
- **Legal reasoning**: Why this outcome
- **Remedy**: What the losing party must do
- **Enforcement mechanism**: How to comply
- **Signature**: Cryptographic signature of all arbitrators

### 7.2 Award Format
```json
{
  "@type": "ArbitrationAward",
  "awardId": "award_xyz789",
  "caseId": "case_abc123",
  "issuedAt": "2025-10-20T15:00:00Z",
  "panel": ["judge_1", "judge_2", "judge_3"],
  "decision": "CLAIMANT_PREVAILS",
  "damages": {"value": 5000, "currency": "USD"},
  "findings": "...",
  "reasoning": "...",
  "remedy": "...",
  "enforcementDeadline": "2025-11-20T00:00:00Z",
  "signatures": {
    "judge_1": "0x...",
    "judge_2": "0x...",
    "judge_3": "0x..."
  },
  "publicationStatus": "public",
  "precedentialValue": "persuasive"
}
```

### 7.3 Finality
Awards are:
- **Binding and final** upon issuance
- **Not subject to appeal** except as specified in Section 7.5
- **Enforceable** in courts under New York Convention / FAA

### 7.4 Compliance Monitoring
- Losing party must comply within **30 days** of award
- Consulate tracks compliance status
- Non-compliance reported to:
  - Reputation registry
  - Requesting court (if enforcement action filed)

### 7.5 Limited Appeal Rights
Appeals only for:
- **Manifest error of law** (clear legal mistake)
- **Fraud or corruption** in the proceeding
- **Arbitrator misconduct** (proven bias/conflict)
- **Technical malfunction** affecting AI arbitrator decision

Appeals must be filed within **14 days** of award.

---

## Article 8: Fees and Costs

### 8.1 Filing Fees (Based on Claim Value)

| Claim Value | Filing Fee | Admin Fee | Total Initial Fee |
|------------|-----------|-----------|------------------|
| Under $10K | $50 | $25 | $75 |
| $10K–$50K | $250 | $100 | $350 |
| $50K–$100K | $500 | $200 | $700 |
| $100K–$500K | $1,500 | $500 | $2,000 |
| $500K–$1M | $3,000 | $1,000 | $4,000 |
| Over $1M | $5,000 | $2,000 | $7,000 |

### 8.2 Arbitrator Fees

**AI Arbitrators**: Included in filing fee (no additional charge)

**Human Arbitrators**:
- Flat fee: $2,500 per case (standard track)
- Hourly rate: $300/hr for complex cases
- Capped at $25,000 per arbitrator per case

### 8.3 Additional Fees
- **Hearing fee**: $1,000 (if live hearing requested)
- **Appeal fee**: $2,500
- **Expedited processing**: +50% of filing fee
- **Expert witness costs**: Borne by party requesting expert

### 8.4 Cost Allocation
- **Default rule**: Each party bears own costs
- **Cost-shifting**: Panel may award costs to prevailing party if:
  - Claim or defense was frivolous
  - Party acted in bad faith
  - Party caused unreasonable delay

---

## Article 9: Ethics and Conduct

### 9.1 Parties' Obligations
All parties must:
- Act in good faith
- Submit truthful evidence
- Comply with procedural deadlines
- Respect confidentiality
- Execute awards promptly

### 9.2 Sanctions for Misconduct
Misconduct includes:
- Submitting false evidence
- Obstructing proceedings
- Violating confidentiality
- Ignoring panel orders

Sanctions:
- **Warning** (first minor violation)
- **Monetary penalty** ($500–$10,000)
- **Adverse inference** (evidence presumed against violator)
- **Dismissal with prejudice** (for egregious violations)

### 9.3 Arbitrator Code of Ethics
See separate document: **Code of Ethics for AI Arbitrators** (Appendix A)

---

## Article 10: Amendments and Versioning

### 10.1 Rule Updates
These rules may be amended by Consulate's Standards Committee:
- **Minor amendments**: Editorial, clarification (no version change)
- **Major amendments**: Substantive changes (new version number)

### 10.2 Applicable Version
The version in effect at the time of filing governs the proceeding, unless parties agree otherwise.

### 10.3 Backward Compatibility
New versions maintain backward compatibility for pending cases.

---

## Article 11: Governing Law and Jurisdiction

### 11.1 Governing Law
These rules are governed by:
- **Primary**: Federal Arbitration Act (9 U.S.C. § 1 et seq.)
- **Secondary**: New York Convention on Recognition and Enforcement of Foreign Arbitral Awards
- **Procedural**: Delaware General Corporation Law (arbitration statutes)

### 11.2 Judicial Review
Awards may be challenged in courts only under grounds specified in FAA § 10:
- Award procured by corruption/fraud
- Evident partiality of arbitrators
- Arbitrators exceeded their powers
- Arbitrators refused to hear material evidence

### 11.3 Enforcement Jurisdiction
Awards are enforceable in any jurisdiction recognizing arbitration under:
- FAA (United States)
- New York Convention (160+ countries)
- UNCITRAL Model Law jurisdictions

---

## Appendices

### Appendix A: Code of Ethics for AI Arbitrators
[See separate document: `code-of-ethics-ai-arbitrators.md`]

### Appendix B: Evidence Format Specifications
[See separate document: `evidence-format-spec.md`]

### Appendix C: Technical Protocol Reference
[See IETF Internet-Draft: `draft-consulate-dispute-resolution-protocol`]

### Appendix D: Precedent Database Access
- Public rulings: https://consulatehq.com/precedents
- API access: https://api.consulatehq.com/v1/precedents
- Query language: Consulate Query Language (CQL)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-09 | Initial publication | Consulate Standards Committee |

---

## Citation Format

**Academic citation**:
Consulate Arbitration Rules v1.0, Consulate Standards Committee (2025), available at https://consulatehq.com/rules/v1.0

**Legal citation**:
Consulate Arb. R. § [Article].[Section] (v1.0 2025)

Example: Consulate Arb. R. § 4.1 (v1.0 2025) [Evidence admissibility standards]

---

## Contact and Governance

**Standards Committee**: standards@consulatehq.com  
**Ethics Board**: ethics@consulatehq.com  
**Technical Support**: support@consulatehq.com  
**Legal Inquiries**: legal@consulatehq.com

---

**[END OF DOCUMENT]**

*This document is published under CC-BY 4.0 License. You are free to share and adapt with attribution to Consulate, Inc.*

