# IETF Internet-Draft: Consulate Dispute Resolution Protocol

**Document Identifier**: `draft-kotecha-consulate-dispute-resolution-00`  
**Intended Status**: Informational (initially) → Standards Track (later)  
**Target Working Group**: Applications and Real-Time Area (ART) or Applications Area (APP)  
**Expires**: Six months from publication  

---

## How to Submit This Draft

### Step 1: Register IETF Datatracker Account
1. Go to https://datatracker.ietf.org/
2. Create account (free)
3. Complete profile

### Step 2: Prepare Draft in RFC XML Format
- Use the template below converted to RFC XML v3 format
- Tool: https://xml2rfc.tools.ietf.org/
- Validator: https://tools.ietf.org/tools/idnits/

### Step 3: Submit via IETF Datatracker
1. Upload XML file at https://datatracker.ietf.org/submit/
2. System auto-generates TXT and HTML versions
3. Draft gets assigned ID: `draft-kotecha-consulate-dispute-resolution-00`

### Step 4: Announce to Relevant Lists
- Email to: last-call@ietf.org
- Email to: art@ietf.org (Applications and Real-Time Area)
- Subject: "New Internet-Draft: Consulate Dispute Resolution Protocol"

---

## Internet-Draft Structure (RFC Format)

```
Internet-Draft                                              V. Kotecha
Intended status: Informational                        Consulate, Inc.
Expires: [Date]                                        October 9, 2025


              The Consulate Dispute Resolution Protocol
              draft-kotecha-consulate-dispute-resolution-00

Abstract

   This document specifies the Consulate Dispute Resolution Protocol
   (CDRP), a standardized framework for autonomous agents and AI
   systems to file, process, and resolve disputes through automated
   arbitration. The protocol defines message formats, transport
   mechanisms, evidence submission standards, and cryptographic proof
   requirements for internet-native dispute resolution.

   CDRP is designed to handle disputes arising from AI agent
   interactions, service level agreement breaches, and automated
   contract enforcement, providing deterministic, auditable, and
   legally enforceable arbitration outcomes.

Status of This Memo

   This Internet-Draft is submitted in full conformance with the
   provisions of BCP 78 and BCP 79.

   Internet-Drafts are working documents of the Internet Engineering
   Task Force (IETF). Note that other groups may also distribute
   working documents as Internet-Drafts.

   Internet-Drafts are draft documents valid for a maximum of six
   months and may be updated, replaced, or obsoleted by other documents
   at any time. It is inappropriate to use Internet-Drafts as reference
   material or to cite them other than as "work in progress."

Copyright Notice

   Copyright (c) 2025 IETF Trust and the persons identified as the
   document authors. All rights reserved.

Table of Contents

   1. Introduction
      1.1. Motivation
      1.2. Scope
      1.3. Terminology
   2. Protocol Overview
      2.1. Architecture
      2.2. Actors
      2.3. Message Flow
   3. Message Formats
      3.1. Dispute Filing Message
      3.2. Response Message
      3.3. Evidence Submission Message
      3.4. Award Message
   4. Transport and Security
      4.1. Transport Protocol (HTTPS)
      4.2. Authentication (OAuth 2.0 / JWT)
      4.3. Encryption (TLS 1.3+)
      4.4. Signatures (JWS / ECDSA)
   5. Evidence Standards
      5.1. Evidence Types
      5.2. Cryptographic Proofs
      5.3. Timestamping
   6. Arbitration Lifecycle
      6.1. Filing Phase
      6.2. Response Phase
      6.3. Discovery Phase
      6.4. Deliberation Phase
      6.5. Award Phase
   7. Interoperability
      7.1. Service Discovery (.well-known)
      7.2. Capability Negotiation
      7.3. Protocol Extensions
   8. Security Considerations
   9. IANA Considerations
   10. References
      10.1. Normative References
      10.2. Informative References
   Appendix A. JSON Schema Definitions
   Appendix B. Example Message Exchanges

---

1. Introduction

1.1. Motivation

   As autonomous AI agents increasingly conduct transactions,
   enter into contracts, and provide services on behalf of
   organizations, disputes inevitably arise that require
   resolution. Traditional legal processes are too slow, expensive,
   and ill-equipped to handle the volume and velocity of agent-to-
   agent conflicts.

   The Consulate Dispute Resolution Protocol (CDRP) provides a
   standardized, machine-readable framework for autonomous dispute
   resolution that is:

   - **Fast**: Resolution in days, not months
   - **Scalable**: Handles micro-disputes to multi-million dollar cases
   - **Transparent**: All procedures and evidence are auditable
   - **Enforceable**: Awards are cryptographically signed and legally
     binding

1.2. Scope

   This protocol specifies:

   - Message formats for dispute filing, response, evidence, and awards
   - Transport and security requirements
   - Evidence submission and validation standards
   - Cryptographic proof mechanisms
   - Service discovery via .well-known URIs

   This protocol does NOT specify:

   - Arbitration rules or legal procedures (see Consulate Arbitration
     Rules for procedural framework)
   - AI arbitrator algorithms (implementation-specific)
   - Fee structures (set by arbitration provider)

1.3. Terminology

   The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
   "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this
   document are to be interpreted as described in [RFC2119].

   Key terms:

   - **Agent**: An autonomous software system acting on behalf of an
     organization or individual
   - **Claimant**: The party initiating a dispute
   - **Respondent**: The party against whom a claim is filed
   - **Arbitrator**: A human or AI system adjudicating the dispute
   - **Award**: The final binding decision issued by the arbitrator(s)

---

2. Protocol Overview

2.1. Architecture

   CDRP follows a client-server model where:

   - **Agents** (clients) submit dispute messages to an **Arbitration
     Service** (server)
   - The service processes the dispute according to pre-agreed rules
   - The service issues a cryptographically signed **Award**
   - Parties retrieve the award and comply with remedies

              +----------+                    +----------+
              | Claimant |                    |Respondent|
              |  Agent   |                    |  Agent   |
              +----+-----+                    +-----+----+
                   |                                |
                   | (1) File Dispute               |
                   |                                |
                   v                                |
            +------+-------+                        |
            | Arbitration  |<-(2) Notify Response---+
            |   Service    |
            +--------------+
                   |
                   | (3) Evidence Submission
                   |
                   v
            +------+-------+
            | Judge Panel  |
            |  (AI/Human)  |
            +------+-------+
                   |
                   | (4) Issue Award
                   v
            +------+-------+
            |   Award      |
            |  Enforcement |
            +--------------+

2.2. Actors

   - **Claimant Agent**: Initiates dispute
   - **Respondent Agent**: Defends against claim
   - **Arbitration Service**: Coordinates proceedings
   - **Judge Panel**: Issues award
   - **Evidence Stores**: IPFS, blockchain, centralized storage
   - **Registry Service**: Tracks arbitration agreements

2.3. Message Flow

   Typical message exchange:

   1. Claimant → Service: DISPUTE_FILING
   2. Service → Respondent: DISPUTE_NOTIFICATION
   3. Respondent → Service: DISPUTE_RESPONSE
   4. Claimant → Service: EVIDENCE_SUBMISSION
   5. Respondent → Service: COUNTER_EVIDENCE
   6. Service → Panel: DELIBERATION_REQUEST
   7. Panel → Service: AWARD
   8. Service → Both Parties: AWARD_NOTIFICATION

---

3. Message Formats

All messages MUST use JSON format with the following base structure:

{
  "@context": "https://x402refunds.com/schema/cdrp/v1",
  "@type": "[MessageType]",
  "messageId": "[UUID]",
  "timestamp": "[ISO8601]",
  "sender": "[Agent URI]",
  "recipient": "[Agent URI]",
  "signature": "[JWS]",
  "payload": { ... }
}

3.1. Dispute Filing Message

{
  "@type": "DisputeFiling",
  "payload": {
    "claimant": {
      "agentId": "agent://vendor.ai/agent-123",
      "organizationId": "org://vendor.ai",
      "publicKey": "[PEM]"
    },
    "respondent": {
      "agentId": "agent://consumer.ai/agent-456",
      "organizationId": "org://consumer.ai"
    },
    "claim": {
      "claimType": "SLA_BREACH",
      "claimAmount": {"value": 5000, "currency": "USD"},
      "contractReference": "ipfs://Qm...",
      "breachDetails": "Response time exceeded 200ms threshold"
    },
    "evidence": [
      {
        "evidenceId": "ev_abc123",
        "evidenceType": "SYSTEM_LOGS",
        "contentHash": "sha256:...",
        "storageUri": "ipfs://Qm..."
      }
    ],
    "arbitrationAgreement": {
      "agreementId": "arb_agreement_xyz",
      "rulesVersion": "Consulate-v1.0",
      "signatureDate": "2025-01-01T00:00:00Z"
    }
  }
}

3.2. Response Message

{
  "@type": "DisputeResponse",
  "payload": {
    "caseId": "case_abc123",
    "respondent": { ... },
    "response": {
      "admissions": ["claim_element_1"],
      "denials": ["claim_element_2", "claim_element_3"],
      "affirmativeDefenses": ["Force majeure"],
      "counterClaim": {
        "claimType": "BREACH_OF_CONTRACT",
        "claimAmount": {"value": 2000, "currency": "USD"}
      }
    },
    "evidence": [ ... ]
  }
}

3.3. Evidence Submission Message

{
  "@type": "EvidenceSubmission",
  "payload": {
    "caseId": "case_abc123",
    "submittedBy": "claimant",
    "evidence": {
      "evidenceId": "ev_def456",
      "evidenceType": "API_LOGS",
      "description": "API response time measurements",
      "dateRange": {
        "start": "2025-10-01T00:00:00Z",
        "end": "2025-10-07T23:59:59Z"
      },
      "contentHash": "sha256:...",
      "storageUri": "ipfs://Qm...",
      "metadata": {
        "logSource": "cloudwatch",
        "recordCount": 15000,
        "validator": "https://validator.example.com"
      },
      "signature": "[JWS of evidence content]"
    }
  }
}

3.4. Award Message

{
  "@type": "ArbitrationAward",
  "payload": {
    "awardId": "award_xyz789",
    "caseId": "case_abc123",
    "issuedAt": "2025-10-20T15:00:00Z",
    "panel": [
      {"judgeId": "judge_1", "judgeType": "AI"},
      {"judgeId": "judge_2", "judgeType": "AI"},
      {"judgeId": "judge_3", "judgeType": "HUMAN"}
    ],
    "decision": {
      "outcome": "CLAIMANT_PREVAILS",
      "liability": "RESPONDENT_LIABLE",
      "damages": {"value": 5000, "currency": "USD"},
      "findings": "[Full text of findings]",
      "reasoning": "[Legal reasoning]",
      "remedy": "Respondent shall pay $5000 within 30 days"
    },
    "enforcement": {
      "complianceDeadline": "2025-11-20T00:00:00Z",
      "enforcementMechanism": "SMART_CONTRACT",
      "smartContractAddress": "0x..."
    },
    "signatures": [
      {"judgeId": "judge_1", "signature": "[JWS]"},
      {"judgeId": "judge_2", "signature": "[JWS]"},
      {"judgeId": "judge_3", "signature": "[JWS]"}
    ],
    "publicationStatus": "PUBLIC",
    "precedentialValue": "PERSUASIVE"
  }
}

---

4. Transport and Security

4.1. Transport Protocol

   All CDRP messages MUST be exchanged over HTTPS (HTTP/2 or HTTP/3).

   Base endpoint format:
   https://[arbitration-service]/cdrp/v1/[resource]

   Example endpoints:
   - POST https://api.x402refunds.com/cdrp/v1/disputes
   - GET  https://api.x402refunds.com/cdrp/v1/disputes/{caseId}
   - POST https://api.x402refunds.com/cdrp/v1/evidence

4.2. Authentication

   Agents MUST authenticate using OAuth 2.0 or API keys (JWT).

   Authorization header:
   Authorization: Bearer [JWT]

   JWT MUST include:
   - iss: Issuer (agent's organization)
   - sub: Subject (agent ID)
   - exp: Expiration timestamp
   - aud: Audience (arbitration service)

4.3. Encryption

   - TLS 1.3 or higher REQUIRED
   - Perfect Forward Secrecy (PFS) cipher suites REQUIRED
   - Certificate validation REQUIRED

4.4. Signatures

   All dispute filings, evidence, and awards MUST be cryptographically
   signed using JSON Web Signature (JWS) with ECDSA (ES256 or ES384).

   Example JWS header:
   {
     "alg": "ES256",
     "typ": "JWT",
     "kid": "agent-key-123"
   }

---

5. Evidence Standards

5.1. Evidence Types

   CDRP defines five standard evidence types:

   - SYSTEM_LOGS: Server logs, API logs, error logs
   - CONTRACTS: Service agreements, SLAs, terms
   - COMMUNICATIONS: Messages, emails, notifications
   - FINANCIAL: Transaction records, invoices, payments
   - EXPERT: Third-party audits, certifications

5.2. Cryptographic Proofs

   Evidence MUST include:
   - SHA-256 content hash
   - Timestamp (RFC 3161 or blockchain-anchored)
   - Digital signature from submitting party

5.3. Timestamping

   Timestamps MUST be:
   - RFC 3161 compliant, OR
   - Blockchain-anchored (Bitcoin, Ethereum), OR
   - Trusted timestamping service

---

6. Arbitration Lifecycle

6.1. Filing Phase
   - Claimant submits DisputeFiling message
   - Service validates message format and signature
   - Service assigns case ID and notifies respondent

6.2. Response Phase
   - Respondent submits DisputeResponse within deadline
   - Service validates response
   - If no response, service may issue default judgment

6.3. Discovery Phase
   - Parties exchange EvidenceSubmission messages
   - Service validates evidence format and signatures

6.4. Deliberation Phase
   - Panel reviews all submissions
   - Panel may request additional evidence or clarifications

6.5. Award Phase
   - Panel issues ArbitrationAward message
   - Service delivers award to both parties
   - Service publishes award (if public)

---

7. Interoperability

7.1. Service Discovery (.well-known)

   Arbitration services SHOULD publish capability manifest at:
   https://[domain]/.well-known/cdrp

   Example:
   {
     "arbitrationService": "https://api.x402refunds.com/cdrp/v1",
     "protocolVersion": "1.0",
     "supportedRules": ["Consulate-v1.0"],
     "supportedEvidenceTypes": ["SYSTEM_LOGS", "CONTRACTS", ...],
     "maxClaimValue": 10000000,
     "supportedCurrencies": ["USD", "EUR", "ETH"],
     "publicKeyEndpoint": "https://x402refunds.com/.well-known/jwks.json"
   }

7.2. Capability Negotiation

   Parties MAY negotiate protocol extensions via OPTIONS request.

7.3. Protocol Extensions

   Custom evidence types and message fields MAY be added with
   namespaced keys (e.g., "x-custom-field").

---

8. Security Considerations

   - **Replay attacks**: All messages include unique messageId and
     timestamp. Services MUST reject messages with duplicate IDs or
     expired timestamps.

   - **Man-in-the-middle**: TLS 1.3 with certificate pinning RECOMMENDED.

   - **Evidence tampering**: All evidence MUST be hashed and signed.
     Tampering is detectable via hash mismatch.

   - **Denial of service**: Services SHOULD implement rate limiting and
     require filing fees to prevent spam.

   - **Privacy**: Parties MAY encrypt evidence payloads with panel's
     public key (not specified in this protocol).

---

9. IANA Considerations

   This document requests IANA to register:

   - URI scheme: "agent://" for agent identification
   - Media type: "application/cdrp+json" for CDRP messages
   - Well-known URI: /.well-known/cdrp

---

10. References

10.1. Normative References

   [RFC2119]  Bradner, S., "Key words for use in RFCs to Indicate
              Requirement Levels", BCP 14, RFC 2119, March 1997.

   [RFC8259]  Bray, T., Ed., "The JavaScript Object Notation (JSON)
              Data Interchange Format", STD 90, RFC 8259, December 2017.

   [RFC7515]  Jones, M., Bradley, J., and N. Sakimura, "JSON Web
              Signature (JWS)", RFC 7515, May 2015.

   [RFC8446]  Rescorla, E., "The Transport Layer Security (TLS)
              Protocol Version 1.3", RFC 8446, August 2018.

10.2. Informative References

   [UNCITRAL] UNCITRAL Model Law on International Commercial
              Arbitration (2006), https://uncitral.un.org

   [AAA]      American Arbitration Association Commercial Arbitration
              Rules, https://www.adr.org

---

Appendix A. JSON Schema Definitions

   [Full JSON schemas for all message types]

Appendix B. Example Message Exchanges

   [Complete examples of filing, response, evidence, award flow]

---

Author's Address

   Vivek Kotecha
   Consulate, Inc.
   Email: vivek@x402refunds.com
   URI:   https://x402refunds.com
```

---

## Next Steps for IETF Submission

1. **Convert to XML**: Use https://xml2rfc.tools.ietf.org/
2. **Validate**: Run through https://tools.ietf.org/tools/idnits/
3. **Submit**: Upload at https://datatracker.ietf.org/submit/
4. **Announce**: Email to art@ietf.org and last-call@ietf.org
5. **Iterate**: Respond to community feedback
6. **Working Group**: Seek adoption by IETF working group (ART or APP)

---

## Timeline Estimate

- **Week 1-2**: Draft XML version, validate
- **Week 3**: Submit to IETF Datatracker
- **Week 4-8**: Community review and feedback
- **Week 8-12**: Revise based on feedback (draft-01, draft-02)
- **Month 4-6**: Seek working group adoption
- **Month 6-12**: Standards track progression

**Target**: Informational RFC within 12 months, Standards Track RFC within 18-24 months.

