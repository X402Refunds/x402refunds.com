c# Evidence Format Specification (CDRP Evidence Schema)

**Version**: 1.0  
**Protocol**: Consulate Dispute Resolution Protocol (CDRP)  
**Specification Status**: Draft  
**Target Standards Bodies**: W3C Community Group, IETF  
**Last Updated**: October 9, 2025  

---

## Abstract

This specification defines machine-readable formats for evidence submission in autonomous agent arbitration. It establishes standards for evidence metadata, cryptographic integrity proofs, storage references, and validation mechanisms.

---

## 1. Introduction

### 1.1 Purpose
Traditional arbitration relies on paper documents, scanned PDFs, and human-curated evidence. AI agent disputes require structured, machine-readable evidence that can be:
- **Automatically validated** (cryptographic integrity)
- **Programmatically analyzed** (structured metadata)
- **Verifiably timestamped** (immutable records)
- **Cross-platform exchanged** (interoperability)

### 1.2 Design Goals
- **JSON-LD format** for semantic interoperability
- **Cryptographic proofs** (hashes, signatures, timestamps)
- **Storage-agnostic** (IPFS, S3, blockchain, centralized DB)
- **Human-readable** (can be rendered for human arbitrators)
- **Extensible** (custom evidence types via namespacing)

---

## 2. Core Evidence Manifest Schema

### 2.1 Base Structure
Every evidence submission MUST include:

```json
{
  "@context": "https://consulatehq.com/schema/evidence/v1",
  "@type": "EvidenceManifest",
  "evidenceId": "urn:uuid:550e8400-e29b-41d4-a716-446655440000",
  "caseId": "case_abc123",
  "submittedBy": {
    "@type": "Party",
    "role": "claimant",
    "agentId": "did:agent:vendor-ai:agent-123",
    "organizationId": "https://vendor.ai"
  },
  "evidenceType": "SystemLogs",
  "description": "API response time logs showing SLA breach",
  "submittedAt": "2025-10-09T10:00:00Z",
  "dateRange": {
    "start": "2025-10-01T00:00:00Z",
    "end": "2025-10-07T23:59:59Z"
  },
  "integrity": {
    "contentHash": "sha256:abcd1234567890...",
    "timestampedAt": "2025-10-09T10:00:00Z",
    "timestampAuthority": "https://timestamp.digicert.com",
    "timestampProof": "rfc3161:base64encodedtoken...",
    "signature": {
      "@type": "JsonWebSignature2020",
      "creator": "did:agent:vendor-ai:agent-123#key-1",
      "created": "2025-10-09T10:00:00Z",
      "signatureValue": "base64encodedSignature..."
    }
  },
  "storage": {
    "primaryUri": "ipfs://QmXyZ123...",
    "backupUri": "https://evidence.vendor.ai/ev_abc123",
    "mimeType": "application/json",
    "size": 1048576,
    "compression": "gzip"
  },
  "metadata": {
    "recordCount": 15000,
    "logSource": "AWS CloudWatch",
    "collectionMethod": "automated",
    "validator": "https://validator.example.com"
  }
}
```

### 2.2 Required Fields
- `@context`, `@type`: JSON-LD linking
- `evidenceId`: Unique identifier (UUID or URN)
- `caseId`: Reference to the case
- `submittedBy`: Party identification
- `evidenceType`: Category (from standard taxonomy)
- `description`: Human-readable summary
- `submittedAt`: ISO 8601 timestamp
- `integrity`: Hash, signature, timestamp proof
- `storage`: Where evidence is stored

### 2.3 Optional Fields
- `dateRange`: Time period covered by evidence
- `metadata`: Evidence-type-specific details
- `relatedEvidence`: Links to other evidence items
- `chain`: For blockchain-anchored evidence

---

## 3. Evidence Types

### 3.1 Standard Evidence Taxonomy

#### Type 1: System Logs
**Use case**: API logs, server logs, error logs, performance metrics

```json
{
  "evidenceType": "SystemLogs",
  "metadata": {
    "logSource": "AWS CloudWatch",
    "logFormat": "JSON",
    "recordCount": 15000,
    "timeResolution": "milliseconds",
    "aggregation": "none"
  }
}
```

**Example content** (stored at `storage.primaryUri`):
```json
[
  {
    "timestamp": "2025-10-05T14:32:01.234Z",
    "endpoint": "/api/v1/predict",
    "requestId": "req_abc123",
    "responseTime": 850,
    "statusCode": 200,
    "slaThreshold": 200,
    "breach": true
  },
  ...
]
```

#### Type 2: Contracts and Agreements
**Use case**: Service agreements, SLAs, terms of service

```json
{
  "evidenceType": "Contract",
  "metadata": {
    "contractType": "ServiceLevelAgreement",
    "parties": ["vendor.ai", "consumer.ai"],
    "effectiveDate": "2025-01-01",
    "expirationDate": "2026-01-01",
    "signatories": [
      {
        "party": "vendor.ai",
        "signedBy": "did:agent:vendor-ai:ceo",
        "signedAt": "2025-01-01T00:00:00Z",
        "signature": "0x..."
      },
      {
        "party": "consumer.ai",
        "signedBy": "did:agent:consumer-ai:cto",
        "signedAt": "2025-01-01T00:05:00Z",
        "signature": "0x..."
      }
    ]
  }
}
```

**Example content**:
```json
{
  "contractId": "sla_vendor_consumer_2025",
  "terms": {
    "responseTime": {
      "threshold": 200,
      "unit": "milliseconds",
      "percentile": "p99",
      "measurement": "1 minute rolling average"
    },
    "uptime": {
      "threshold": 99.9,
      "unit": "percent",
      "measurementPeriod": "monthly"
    },
    "penalties": {
      "responseTimeBreach": {
        "amount": 100,
        "currency": "USD",
        "perIncident": true
      }
    }
  }
}
```

#### Type 3: Communications
**Use case**: Agent-to-agent messages, emails, notifications

```json
{
  "evidenceType": "Communications",
  "metadata": {
    "communicationType": "AgentMessage",
    "protocol": "HTTPS",
    "messageCount": 45
  }
}
```

**Example content**:
```json
[
  {
    "messageId": "msg_xyz789",
    "from": "agent://vendor.ai/agent-123",
    "to": "agent://consumer.ai/agent-456",
    "timestamp": "2025-10-05T14:30:00Z",
    "subject": "SLA Breach Notification",
    "body": "Your API response time exceeded 200ms threshold 15 times on 2025-10-05.",
    "signature": "0x..."
  }
]
```

#### Type 4: Financial Records
**Use case**: Invoices, payments, transaction logs

```json
{
  "evidenceType": "FinancialRecords",
  "metadata": {
    "recordType": "Invoice",
    "currency": "USD",
    "totalAmount": 5000,
    "transactionCount": 12
  }
}
```

**Example content**:
```json
[
  {
    "invoiceId": "inv_202510_001",
    "date": "2025-10-01",
    "amount": 5000,
    "currency": "USD",
    "description": "API usage charges",
    "paymentStatus": "unpaid",
    "dueDate": "2025-10-15"
  }
]
```

#### Type 5: Expert Analysis
**Use case**: Third-party validation, audits, expert reports

```json
{
  "evidenceType": "ExpertAnalysis",
  "metadata": {
    "expertName": "TechAudit Inc.",
    "expertCredentials": "ISO 27001 Certified",
    "analysisDate": "2025-10-08",
    "methodology": "Independent log analysis"
  }
}
```

---

## 4. Cryptographic Integrity

### 4.1 Content Hashing
All evidence content MUST be hashed using SHA-256 (or stronger):

```json
{
  "integrity": {
    "algorithm": "sha256",
    "contentHash": "sha256:a3f5b2c8d9e1f4a7b6c5d2e9f8a1b4c7d6e3f2a9b8c5d4e1"
  }
}
```

**Validation process**:
1. Retrieve evidence from `storage.primaryUri`
2. Compute SHA-256 hash of content
3. Compare with `integrity.contentHash`
4. If mismatch → evidence tampered, reject

### 4.2 Timestamping
Evidence MUST be timestamped to prove existence at a specific time:

**Option 1: RFC 3161 Timestamp**
```json
{
  "integrity": {
    "timestampAuthority": "https://timestamp.digicert.com",
    "timestampedAt": "2025-10-09T10:00:00Z",
    "timestampProof": "rfc3161:MIIDVDCCAjyg...",
    "timestampStandard": "RFC3161"
  }
}
```

**Option 2: Blockchain Anchor**
```json
{
  "integrity": {
    "blockchain": "ethereum",
    "blockNumber": 20123456,
    "transactionHash": "0x1234567890abcdef...",
    "timestampedAt": "2025-10-09T10:00:00Z",
    "proof": "merkle:base64encodedMerkleProof..."
  }
}
```

**Option 3: Trusted Timestamping Service**
```json
{
  "integrity": {
    "timestampAuthority": "https://timestamp.consulate.com",
    "timestampedAt": "2025-10-09T10:00:00Z",
    "timestampToken": "jwt:eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...",
    "timestampStandard": "JWT"
  }
}
```

### 4.3 Digital Signatures
Submitting party MUST sign evidence manifest:

```json
{
  "integrity": {
    "signature": {
      "@type": "JsonWebSignature2020",
      "creator": "did:agent:vendor-ai:agent-123#key-1",
      "created": "2025-10-09T10:00:00Z",
      "proofPurpose": "assertionMethod",
      "verificationMethod": "https://vendor.ai/.well-known/did.json#key-1",
      "jws": "eyJhbGciOiJFUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19...",
      "signatureValue": "base64encodedSignature..."
    }
  }
}
```

**Signature covers**:
- Evidence manifest (all fields except `signature` itself)
- Content hash (to bind signature to content)

---

## 5. Storage Mechanisms

### 5.1 IPFS (InterPlanetary File System)
**Advantages**: Content-addressed, decentralized, immutable

```json
{
  "storage": {
    "primaryUri": "ipfs://QmXyZ123...",
    "ipfsGateway": "https://ipfs.io/ipfs/QmXyZ123...",
    "pinningService": "Pinata"
  }
}
```

### 5.2 Centralized Cloud Storage
**Advantages**: Fast, reliable, familiar

```json
{
  "storage": {
    "primaryUri": "https://s3.amazonaws.com/evidence-bucket/ev_abc123.json",
    "backupUri": "https://backup.vendor.ai/evidence/ev_abc123.json",
    "encryption": "AES-256-GCM"
  }
}
```

### 5.3 Blockchain Storage
**Advantages**: Maximum immutability, verifiable

```json
{
  "storage": {
    "blockchain": "ethereum",
    "contractAddress": "0x1234567890abcdef...",
    "tokenId": "12345",
    "standard": "ERC-721",
    "retrievalMethod": "Call contract.getEvidence(tokenId)"
  }
}
```

### 5.4 Hybrid Storage
**Best practice**: Primary (IPFS) + Backup (S3) + Anchor (blockchain)

```json
{
  "storage": {
    "primaryUri": "ipfs://QmXyZ123...",
    "backupUri": "https://s3.amazonaws.com/evidence/ev_abc123.json",
    "anchor": {
      "blockchain": "ethereum",
      "transactionHash": "0xabc...",
      "blockNumber": 20123456
    }
  }
}
```

---

## 6. Validation and Verification

### 6.1 Validation Workflow
When evidence is submitted:

1. **Format validation**: Check JSON schema compliance
2. **Signature verification**: Validate digital signature
3. **Hash verification**: Compute hash, compare with manifest
4. **Timestamp verification**: Validate timestamp proof
5. **Content validation**: Check evidence-type-specific rules

### 6.2 Validation Result
```json
{
  "validationResult": {
    "evidenceId": "ev_abc123",
    "validatedAt": "2025-10-09T10:05:00Z",
    "validator": "Consulate Evidence Validator v2.1",
    "status": "VALID",
    "checks": {
      "formatValid": true,
      "signatureValid": true,
      "hashMatches": true,
      "timestampValid": true,
      "contentValid": true
    },
    "warnings": [
      "Timestamp authority not on trusted list (using vendor's own service)"
    ],
    "errors": []
  }
}
```

### 6.3 Rejection Criteria
Evidence is REJECTED if:
- Hash mismatch (tampered content)
- Invalid signature
- Expired timestamp
- Content violates format rules
- Missing required fields

---

## 7. Evidence Linking and Chains

### 7.1 Related Evidence
Evidence items can reference each other:

```json
{
  "relatedEvidence": [
    {
      "evidenceId": "ev_related_001",
      "relationship": "supports",
      "description": "Contract defining SLA terms"
    },
    {
      "evidenceId": "ev_related_002",
      "relationship": "contradicts",
      "description": "Respondent's counter-logs"
    }
  ]
}
```

### 7.2 Evidence Chains
For sequential evidence (e.g., transaction history):

```json
{
  "chain": {
    "previousEvidence": "ev_abc122",
    "nextEvidence": "ev_abc124",
    "sequenceNumber": 3,
    "totalInChain": 10
  }
}
```

---

## 8. Human-Readable Rendering

### 8.1 Display Template
Evidence must be renderable for human arbitrators:

```json
{
  "rendering": {
    "displayTemplate": "https://consulatehq.com/templates/system-logs",
    "thumbnailUri": "https://evidence.vendor.ai/ev_abc123/thumbnail.png",
    "htmlSummary": "<p>15,000 API calls recorded. 50 breaches of 200ms SLA threshold.</p>"
  }
}
```

### 8.2 Accessibility
Evidence rendering MUST:
- Be screen-reader accessible
- Support high-contrast mode
- Provide text alternatives for charts/graphs

---

## 9. Privacy and Redaction

### 9.1 Redacted Evidence
For sensitive data (PII, trade secrets):

```json
{
  "privacy": {
    "redactionApplied": true,
    "redactedFields": ["userId", "ipAddress"],
    "redactionMethod": "anonymization",
    "unredactedHash": "sha256:originalHashBeforeRedaction...",
    "redactedHash": "sha256:hashAfterRedaction..."
  }
}
```

### 9.2 Sealed Evidence
For confidential business information:

```json
{
  "privacy": {
    "sealed": true,
    "sealReason": "Trade secret",
    "visibleTo": ["judge_1", "judge_2", "judge_3"],
    "notVisibleTo": ["opposing_party"],
    "encryptionKey": "Held by arbitration panel only"
  }
}
```

---

## 10. Interoperability

### 10.1 W3C Verifiable Credentials Integration
Evidence can be issued as Verifiable Credentials:

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://consulatehq.com/schema/evidence/v1"
  ],
  "@type": ["VerifiableCredential", "EvidenceManifest"],
  "issuer": "did:agent:vendor-ai:agent-123",
  "issuanceDate": "2025-10-09T10:00:00Z",
  "credentialSubject": {
    ...evidence manifest...
  },
  "proof": {
    "type": "Ed25519Signature2020",
    "created": "2025-10-09T10:00:00Z",
    "verificationMethod": "did:agent:vendor-ai:agent-123#key-1",
    "proofPurpose": "assertionMethod",
    "proofValue": "z3MvGX..."
  }
}
```

### 10.2 Cross-Platform Exchange
Evidence format is platform-agnostic:
- Consulate → AAA → ICC (all can read same format)
- Agent Platform A → Agent Platform B (interoperability)

---

## 11. Compliance and Standards

### 11.1 Legal Admissibility
Evidence format designed to meet:
- **Federal Rules of Evidence** (US)
- **eIDAS Regulation** (EU)
- **UNCITRAL Rules on Electronic Submission**

### 11.2 Data Protection
Evidence handling complies with:
- **GDPR** (EU)
- **CCPA** (California)
- **Data residency requirements** (per jurisdiction)

---

## 12. Implementation Guide

### 12.1 For Developers
To submit evidence:

```typescript
import { submitEvidence } from '@consulate/arbitration-sdk';

const evidence = {
  caseId: 'case_abc123',
  evidenceType: 'SystemLogs',
  description: 'API response time logs',
  contentUri: 'ipfs://QmXyZ...',
  contentHash: 'sha256:abcd...',
  signature: await signEvidence(evidenceData, privateKey)
};

await submitEvidence(evidence);
```

### 12.2 For Arbitration Services
To validate evidence:

```typescript
import { validateEvidence } from '@consulate/validator';

const result = await validateEvidence(evidenceManifest);
if (result.status === 'VALID') {
  // Accept evidence
} else {
  // Reject with errors
  console.error(result.errors);
}
```

---

## 13. Examples

See `examples/` directory for full evidence submissions:
- `example-system-logs.json`
- `example-contract.json`
- `example-communications.json`
- `example-financial.json`
- `example-expert-analysis.json`

---

## 14. JSON Schema

Full JSON Schema available at:
https://consulatehq.com/schema/evidence/v1/schema.json

Validate evidence with:
```bash
ajv validate -s evidence-schema.json -d evidence.json
```

---

## Appendix A: Hash Algorithms

| Algorithm | Security | Speed | Recommended |
|-----------|---------|-------|-------------|
| SHA-256 | Strong | Fast | ✅ Yes (default) |
| SHA-512 | Stronger | Medium | ✅ Yes (high security) |
| SHA-1 | Weak | Fast | ❌ No (deprecated) |
| MD5 | Broken | Fast | ❌ No (never use) |

---

## Appendix B: Signature Algorithms

| Algorithm | Key Type | Recommended |
|-----------|---------|-------------|
| ES256 (ECDSA) | P-256 | ✅ Yes (default) |
| ES384 (ECDSA) | P-384 | ✅ Yes (high security) |
| RS256 (RSA) | 2048-bit | ✅ Yes (compatibility) |
| EdDSA (Ed25519) | Curve25519 | ✅ Yes (modern) |

---

## Appendix C: Storage Cost Comparison

| Storage | Cost/GB/Month | Immutability | Speed |
|---------|--------------|--------------|-------|
| IPFS (Pinata) | $0.15 | High | Medium |
| AWS S3 | $0.023 | Low | Fast |
| Arweave | $7 (one-time) | Maximum | Slow |
| Ethereum | $100,000+ | Maximum | Slow |

**Recommendation**: IPFS + S3 backup

---

**Document Status**: Draft v1.0  
**Next Review**: November 2025  
**Maintainer**: Consulate Standards Committee  
**Contact**: standards@consulatehq.com

