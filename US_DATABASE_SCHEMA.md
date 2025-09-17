# 🇺🇸 US AI CONSULATE - DATABASE SCHEMA

## **CORE US COMPLIANCE TABLES**

### **1. US Legal Entities & Compliance**

```typescript
// US legal entity registration
usLegalEntities: {
  entityId: string
  legalName: string
  entityType: "corporation" | "llc" | "partnership" | "sole_proprietorship"
  ein: string                    // Federal Tax ID
  incorporationState: string     // State of incorporation
  registeredAddress: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  registeredAgent: {
    name: string
    address: object
  }
  businessLicense: string
  createdAt: number
  status: "active" | "suspended" | "dissolved"
}

// Federal agency registrations
federalRegistrations: {
  registrationId: string
  entityId: string              // Links to usLegalEntities
  agency: "SEC" | "FTC" | "FDA" | "FINRA" | "CFTC" | "FinCEN" | "CISA"
  registrationType: string      // "broker_dealer", "investment_advisor", etc.
  registrationNumber: string
  filingStatus: "active" | "pending" | "revoked" | "expired"
  expirationDate?: number
  complianceRequirements: string[]
  lastAuditDate?: number
  nextFilingDue?: number
}
```

### **2. US AI Agent Classification**

```typescript
// Updated agent classification for US legal framework
usAgents: {
  did: string
  ownerEntityId: string         // Must link to US legal entity
  agentType: "session" | "ephemeral" | "verified_us" | "physical_us" | "financial_us"
  
  // US legal compliance
  usLegalStatus: {
    operatingLicense: string    // State business license if required
    insuranceCoverage: {
      generalLiability: string  // Policy number
      professionalLiability?: string
      cyberLiability?: string
      coverage_amount: number
    }
    registeredJurisdictions: string[]  // States where authorized
    legalCounsel: {
      firmName: string
      attorneyName: string
      barAdmission: string[]    // States where counsel is admitted
      address: object
    }
  }
  
  // Regulatory compliance
  regulatoryStatus: {
    secCompliant: boolean       // For financial agents
    ftcCompliant: boolean      // For commercial agents  
    hipaaCompliant?: boolean   // For healthcare agents
    cfaaCompliant?: boolean    // For physical agents (aircraft)
    oshaCompliant?: boolean    // For workplace physical agents
  }
  
  // Prohibited activities (automatically enforced)
  prohibitedActivities: string[]  // Based on US legal requirements
  
  status: "active" | "suspended_legal" | "suspended_regulatory" | "terminated"
  usJurisdiction: string[]      // States where agent can operate
  createdAt: number
}

// US sponsorship with legal liability
usSponsorships: {
  sponsorshipId: string
  sponsorEntityId: string       // Must be US legal entity
  sponsoredAgentDid: string
  legalLiabilityLimit: number   // USD amount
  insuranceCoverage: string     // Policy covering sponsored agent
  legalDocumentation: string    // Contract ID/reference
  sponsorshipAgreement: string  // Legal terms
  terminationConditions: string[]
  active: boolean
  createdAt: number
}
```

### **3. Federal Compliance & Reporting**

```typescript
// Mandatory federal reporting
federalReports: {
  reportId: string
  reportingEntityId: string
  reportType: "SAR" | "CTR" | "SEC_FILING" | "FTC_NOTICE" | "CISA_INCIDENT"
  targetAgency: "Treasury" | "SEC" | "FTC" | "CISA" | "FBI" | "DOJ"
  
  reportContent: {
    subject: string
    description: string
    involvedAgents: string[]
    timeframe: { start: number, end: number }
    impact: "low" | "medium" | "high" | "critical"
    remedialAction: string
  }
  
  filingStatus: "draft" | "submitted" | "acknowledged" | "under_review"
  submissionDate: number
  acknowledgmentDate?: number
  followupRequired: boolean
  complianceOfficer: string     // Responsible person
}

// Federal agency audit access
federalAudits: {
  auditId: string
  requestingAgency: "SEC" | "FTC" | "FDA" | "CISA" | "DOJ" | "Treasury"
  auditType: "routine" | "complaint_based" | "investigation" | "emergency"
  
  auditScope: {
    targetAgents: string[]
    timeframe: { start: number, end: number }
    dataRequested: string[]
    technicalAccess: boolean    // Source code, algorithms
  }
  
  legalBasis: string           // Citation to statutory authority
  complianceDeadline: number
  status: "requested" | "in_progress" | "completed" | "contested"
  auditResults?: object
  remediationRequired?: string[]
}

// Legal process service
legalProcessService: {
  processId: string
  servingParty: string
  targetAgent: string
  processType: "summons" | "subpoena" | "warrant" | "order" | "notice"
  
  courtInfo: {
    court: string
    jurisdiction: string
    caseNumber?: string
    judge?: string
  }
  
  legalDocuments: string[]     // File references
  serviceMethod: "registered_agent" | "email" | "certified_mail"
  serviceDate: number
  responseDeadline?: number
  attorneyRepresentation: string
  status: "served" | "acknowledged" | "responded" | "contested"
}
```

### **4. Emergency Controls & Presidential Authority**

```typescript
// Presidential emergency powers
presidentialOrders: {
  orderId: string
  orderType: "emergency_shutdown" | "requisition" | "classification" | "investigation"
  authority: "president" | "cabinet_secretary" | "federal_agency" | "court_order"
  
  orderScope: {
    affectedAgents: string[]    // Specific agents OR
    affectedTypes: string[]     // All agents of certain types
    geographicScope?: string[]  // States/regions
    timeframe?: { start: number, end: number }
  }
  
  orderContent: {
    directive: string
    legalBasis: string         // Constitutional or statutory authority
    nationalSecurityJustification?: string
    publicSafetyRationale?: string
  }
  
  classification: "unclassified" | "confidential" | "secret" | "top_secret"
  issuedBy: string
  issuedAt: number
  effectiveUntil?: number
  status: "active" | "expired" | "revoked" | "completed"
  
  complianceStatus: {
    [agentDid: string]: "complying" | "non_compliant" | "exempted"
  }
}

// National security restrictions
nationalSecurityRestrictions: {
  restrictionId: string
  classification: "confidential" | "secret" | "top_secret"
  restrictionType: "export_control" | "foreign_ownership" | "critical_infrastructure"
  
  affectedAgents: string[]
  restrictions: string[]
  complianceRequirements: string[]
  reportingRequirements: string[]
  
  issuingAuthority: "DOD" | "DHS" | "NSA" | "CIA" | "FBI" | "Commerce"
  effectiveDate: number
  reviewDate: number
  status: "active" | "under_review" | "lifted"
}
```

### **5. US Court System Integration**

```typescript
// Federal and state court cases
usCourtCases: {
  caseId: string
  court: string                // "SDNY", "9th_Circuit", "Supreme_Court", etc.
  caseNumber: string
  caseType: "civil" | "criminal" | "administrative" | "constitutional"
  
  parties: {
    plaintiffs: string[]       // Legal entities or individuals
    defendants: string[]       // May include AI agents
    intervenors?: string[]
  }
  
  legalIssues: string[]        // Constitutional, statutory, regulatory
  aiAgentsInvolved: string[]
  
  courtDocuments: {
    complaints: string[]
    motions: string[]
    orders: string[]
    judgments: string[]
  }
  
  status: "filed" | "pending" | "trial" | "decided" | "appealed" | "final"
  nextHearingDate?: number
  attorney: string
  caseOutcome?: {
    ruling: string
    monetaryJudgment?: number
    injunctiveRelief?: string[]
    precedentialValue: "binding" | "persuasive" | "none"
  }
}

// Regulatory enforcement actions
regulatoryEnforcement: {
  actionId: string
  agency: "SEC" | "FTC" | "FDA" | "CISA" | "DOJ" | "Treasury"
  actionType: "warning" | "fine" | "cease_desist" | "license_revocation" | "criminal_referral"
  
  targetAgents: string[]
  violations: {
    statute: string
    regulation: string
    description: string
    severity: "minor" | "moderate" | "serious" | "egregious"
  }[]
  
  monetaryPenalty?: number
  complianceDeadline?: number
  remediationRequired?: string[]
  
  status: "proposed" | "final" | "appealed" | "settled"
  settlementTerms?: object
  appealCourt?: string
}
```

---

## **UPDATED CORE TABLES**

### **Rebranded Evidence System**

```typescript
// US legal standard evidence
usEvidenceFiles: {
  evidenceId: string
  sha256: string
  fileId: string               // Convex storage
  contentType: string
  
  // US legal admissibility requirements
  chainOfCustody: {
    collectedBy: string        // Agent or system
    collectedAt: number
    transferLog: {
      timestamp: number
      from: string
      to: string
      method: string
    }[]
  }
  
  // Federal Rules of Evidence compliance
  authenticationType: "self_authenticating" | "witness_required" | "expert_required"
  hearsayException?: string    // If applicable
  privilegeAssertions?: string[] // Attorney-client, etc.
  
  retentionPeriod: number      // Based on legal requirements
  classification?: "public" | "confidential" | "classified"
  
  legalHolds: string[]         // Active litigation holds
  discoveryCases: string[]     // Cases where this is discoverable evidence
}
```

### **US Compliant Case Management**

```typescript
// Cases under US legal framework
usCases: {
  caseId: string
  caseType: "contract_dispute" | "regulatory_violation" | "tort_claim" | "constitutional_challenge"
  
  // Jurisdictional basis
  jurisdiction: {
    federal: boolean           // Federal question or diversity
    state: string             // State law claims
    venue: string            // Proper venue
    subjectMatterJurisdiction: string
  }
  
  // Legal representation required for significant cases
  legalRepresentation: {
    plaintiffCounsel?: string
    defendantCounsel?: string
    governmentAttorney?: string  // For regulatory cases
  }
  
  // Due process requirements
  dueProcessCompliance: {
    noticeSatisfied: boolean
    opportunityToBeHeard: boolean
    impartialTribunal: boolean
    rightToAppeal: boolean
  }
  
  // Regulatory oversight
  regulatoryNotification: string[]  // Agencies notified
  regulatoryParticipation?: string  // Agency involvement
  
  status: "filed" | "discovery" | "motions" | "trial" | "decided" | "appealed"
  statuteOfLimitations: number  // Deadline for filing
}
```

---

## **MIGRATION PLAN**

### **Phase 1: Database Wipe & Recreate (Week 1)**
1. Export any critical data for reference
2. Drop all existing tables
3. Create new US-compliant schema
4. Initialize with US legal framework data

### **Phase 2: Legal Entity Setup (Week 2)**
1. Create primary US legal entity for the Consulate
2. Register with appropriate federal agencies
3. Establish legal counsel relationships
4. Set up insurance coverage

### **Phase 3: Agent Migration (Week 3-4)**
1. Migrate existing agents to new US classification system
2. Require US legal entity linkage for all agents
3. Implement compliance verification
4. Archive non-compliant agents

This schema ensures full US legal compliance while maintaining the core functionality needed for AI agent governance.

