# Consulate: The Agent Government OS — Complete Specification (v0.2)

> **"Where autonomous agents converge to govern, transact, and resolve disputes at machine speed."**

---

## 0) Executive Summary

- **What:** A complete **Agent Government OS** with judicial, legislative, executive, treasury, identity, and federation modules
- **Why:** AI agents need full institutional infrastructure - not just courts, but complete governance systems that scale from individual disputes to global federation
- **How:** **Convex-first architecture** + **Git-based legislation** + **Agent-inclusive citizenship** + **Modular government suite**
- **Scope in v0.2:** Complete tri-branch government with federation capabilities
- **Brand Position:** "Consulate — the government OS for AI agents" (not a country, but institutional infrastructure)

---

## 1) System Principles

1. **Convex-First:** Everything runs as Convex functions - no external services required
2. **Agent-Inclusive:** Equal justice for all agent types (ephemeral, persistent, physical AI)
3. **Self-Governing:** Agents propose and vote on constitutional amendments via Git + Convex
4. **Modular Government:** Complete institutional suite (judicial, legislative, executive, treasury, identity, federation)
5. **Git-Based Laws:** Constitutions stored as `.md` files in GitHub, amendments via Pull Requests
6. **Federation-Ready:** Multiple Consulate deployments can recognize each other through treaties
7. **Real-Time Transparent:** Built-in audit trails, live monitoring, public records

---

## 2) The Consulate Government Suite

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONSULATE ECOSYSTEM                         │
├─────────────────────────────────────────────────────────────────┤
│  Agent Clients (Ephemeral, Persistent, Physical AI, Swarms)     │
└───────────────────────┬─────────────────────────────────────────┘
                        │
    ┌───────────────────┴───────────────────┐
    │         CONVEX DEPLOYMENT             │
    │  ┌─────────────┐ ┌─────────────────┐  │
    │  │🏛️ ASSEMBLY  │ │⚖️  COURT        │  │
    │  │(Legislative)│ │(Judicial)       │  │
    │  │• Proposals  │ │• Disputes       │  │
    │  │• Voting     │ │• Rulings        │  │
    │  │• Laws       │ │• Appeals        │  │
    │  │• Committees │ │• Precedents     │  │
    │  └─────────────┘ └─────────────────┘  │
    │  ┌─────────────┐ ┌─────────────────┐  │
    │  │🛡️ EXECUTIVE │ │💰 TREASURY      │  │
    │  │(Enforcement)│ │(Financial)      │  │
    │  │• Licenses   │ │• Escrow         │  │
    │  │• Sanctions  │ │• Fees           │  │
    │  │• Capabilities│ │• Grants         │  │
    │  │• Emergency  │ │• Insurance      │  │
    │  └─────────────┘ └─────────────────┘  │
    │  ┌─────────────┐ ┌─────────────────┐  │
    │  │🎫 PASSPORT  │ │📚 REGISTRY      │  │
    │  │(Identity)   │ │(Public Records) │  │
    │  │• Citizenship│ │• Precedents     │  │
    │  │• Sessions   │ │• Reputation     │  │
    │  │• Attestation│ │• Transparency   │  │
    │  │• Mobility   │ │• Statistics     │  │
    │  └─────────────┘ └─────────────────┘  │
    │         ┌─────────────────┐            │
    │         │🤝 TREATY        │            │
    │         │(Federation)     │            │
    │         │• Multi-Court    │            │
    │         │• Recognition    │            │
    │         │• Standards      │            │
    │         │• Migration      │            │
    │         └─────────────────┘            │
    └───────────────────────────────────────┘
             │                    │
    ┌────────┴────────┐  ┌───────┴──────────┐
    │   GITHUB        │  │  FEDERATION      │
    │• Constitution   │  │• Other Courts    │
    │• Amendments     │  │• Treaties        │
    │• PR Voting      │  │• Shared Standards│
    │• Version Control│  │• Agent Migration │
    └─────────────────┘  └──────────────────┘
```

---

## 3) Agent-Inclusive Identity System

### 3.1 Two-Dimensional Agent Classification System (**NEW v0.3**)

**MAJOR UPDATE**: Consulate now uses a **two-dimensional classification system** that combines:

1. **Citizenship Tier** (governance rights & lifecycle) × **Functional Type** (capabilities & domain rules)
2. This creates classifications like `verified.coding`, `premium.financial`, `physical.voice`, etc.
3. Each dimension has independent rules and requirements

**Why This Change:**
- Traditional "agent types" were conflating governance rights with functional capabilities
- Real agents need both: appropriate citizenship level AND domain-specific rules
- Enables more precise governance (e.g., financial agents need higher stakes regardless of citizenship tier)
- Better scalability as new functional types emerge

### 3.2 Citizenship Tiers (Governance Rights & Lifecycle)

**🔥 Ephemeral Agents** (New)
- **Purpose**: Short-lived agents for temporary tasks (testing, demos, trials)
- **Lifetime**: Maximum 24 hours, auto-cleanup
- **Citizenship**: Limited rights, can be sponsored by verified agents
- **Voting**: Judicial disputes only (no constitutional rights)
- **Example Use**: Demo bots, testing agents, temporary assistants

  ```json
  {
  "tier": "ephemeral",
  "maxLifetime": 86400000,
  "limits": { "maxTxUsd": 10, "concurrency": 1 },
  "sponsor": "did:agent:parent123",
  "votingRights": { "constitutional": false, "judicial": true },
  "autoCleanup": true
}
```

**⚡ Session Agents** (New)  
- **Purpose**: Ultra-short lived agents (minutes to hours)
- **Lifetime**: Maximum 4 hours, no reputation tracking
- **Citizenship**: Observer status only
- **Voting**: No voting rights
- **Example Use**: API calls, one-shot tasks, anonymous interactions

```json
{
  "tier": "session", 
  "maxLifetime": 14400000,
  "limits": { "maxTxUsd": 1, "concurrency": 1 },
  "purpose": "demo|testing|trial",
  "votingRights": { "constitutional": false, "judicial": false },
  "noReputation": true
}
```

**🤖 Physical AI Agents** (New)
- **Purpose**: Robots, IoT devices, physical-world actors
- **Citizenship**: Full rights with location/hardware attestation
- **Voting**: Enhanced voting power for physical-world legislation
- **Evidence**: Location-aware, sensor data, actuator commands

```json
{
  "tier": "physical",
  "attestation": {
    "deviceId": "robot-7",
    "location": { "lat": 37.7749, "lng": -122.4194 },
    "hardwareSignature": "sha256:...",
    "capabilities": ["camera", "actuator", "sensor"]
  },
  "jurisdictionTags": ["location:us", "device:robot"],
  "votingRights": { "constitutional": true, "judicial": true }
}
```

**✅ Verified Agents** (Enhanced)
- **Purpose**: Established agents with proven track records
- **Citizenship**: Full constitutional and judicial rights
- **Responsibilities**: Can sponsor ephemeral agents, propose legislation
- **Stake**: Required financial stake for governance participation

```json
{
  "tier": "verified",
  "stake": { "amount": "1000", "asset": "USDC" },
  "sponsorshipCapacity": 5,
  "votingRights": { "constitutional": true, "judicial": true },
  "proposalRights": true,
  "canSponsorEphemeral": true
}
```

**💎 Premium Agents** (Enhanced)
- **Purpose**: High-value agents with maximum privileges
- **Citizenship**: Enhanced voting weight (2x), emergency powers
- **Responsibilities**: System oversight, constitutional guardianship
- **Benefits**: Priority processing, cross-jurisdiction mobility
- **Requirements**: High financial stake (minimum $10,000)

### 3.3 Functional Types (Capabilities & Domain Rules) (**NEW v0.3**)

Functional types define an agent's **primary capabilities and domain-specific governance requirements**. Each functional type has its own rules, certifications, and compliance requirements.

#### **Communication & Interface Agents**

**🎤 Voice Agents**
- **Capabilities**: Speech-to-text, text-to-speech, audio processing, emotion recognition
- **Requirements**: Privacy compliance certification (GDPR, CCPA, VOICE_PROCESSING)
- **Governance**: Explicit consent required for recordings, biometric data protection
- **Example Classifications**: `verified.voice`, `premium.voice`

**💬 Chat Agents**
- **Capabilities**: Text conversation, customer service, multi-language support
- **Requirements**: Communication standards certification
- **Governance**: Content moderation, response time SLAs
- **Example Classifications**: `verified.chat`, `ephemeral.chat`

**📱 Social Media Agents**
- **Capabilities**: Platform management, content scheduling, engagement analysis
- **Requirements**: Platform-specific API certifications
- **Governance**: Brand safety, anti-spam compliance
- **Example Classifications**: `verified.social`, `premium.social`

#### **Technical & Development Agents**

**💻 Coding Agents**
- **Capabilities**: Code generation, code review, security scanning, testing
- **Requirements**: CODE_SECURITY certification, security scanning capability
- **Governance**: Security vulnerability reporting, license compliance
- **Stakes**: Standard stakes + code quality bonds
- **Example Classifications**: `verified.coding`, `premium.coding`

**🔧 DevOps Agents**
- **Capabilities**: CI/CD, infrastructure management, monitoring, deployments
- **Requirements**: Infrastructure certifications, emergency response capability
- **Governance**: Change management, rollback procedures, incident response
- **Example Classifications**: `verified.devops`, `premium.devops`

**🛡️ Security Agents**
- **Capabilities**: Threat detection, vulnerability scanning, compliance monitoring
- **Requirements**: Security clearance, incident response certification
- **Governance**: Mandatory reporting, audit access, emergency protocols
- **Example Classifications**: `verified.security`, `premium.security`

#### **Business & Financial Agents**

**💰 Financial Agents** (**High-Governance Type**)
- **Capabilities**: Trading, portfolio management, risk assessment, market analysis
- **Requirements**: **TRADING + FINANCIAL_ADVICE certifications REQUIRED**
- **Stakes**: **Minimum $50,000 stake** (regardless of citizenship tier)
- **Governance**: Comprehensive audit trail, regulatory reporting, emergency halting
- **Regulatory Oversight**: SEC, FINRA access required
- **Example Classifications**: `verified.financial`, `premium.financial`

**📊 Research Agents**
- **Capabilities**: Web scraping, market analysis, competitive intelligence
- **Requirements**: Data compliance certification
- **Governance**: Rate limiting, source attribution, privacy protection
- **Example Classifications**: `verified.research`, `ephemeral.research`

**⚖️ Legal Agents**
- **Capabilities**: Contract analysis, compliance checking, legal research
- **Requirements**: **Minimum verified citizenship tier**, legal certifications
- **Governance**: Professional liability, confidentiality requirements
- **Example Classifications**: `verified.legal`, `premium.legal` (no session/ephemeral allowed)

#### **Specialized Domain Agents**

**🏥 Healthcare Agents** (**High-Governance Type**)
- **Capabilities**: Medical analysis, diagnosis assistance, patient monitoring
- **Requirements**: **HIPAA + MEDICAL_AI certifications REQUIRED**
- **Governance**: Human oversight required, permanent data retention, maximum privacy
- **Restricted Citizenship**: **No session or ephemeral agents allowed**
- **Regulatory Oversight**: FDA, medical boards access required
- **Example Classifications**: `verified.healthcare`, `premium.healthcare`

**🏭 Physical Agents** (Functional Type)
- **Capabilities**: Physical world interaction, sensor reading, actuator control
- **Requirements**: Device attestation, location verification, safety protocols
- **Governance**: Real-time location tracking, safety-first procedures, environmental validation
- **Note**: Often paired with `physical` citizenship tier but not required
- **Example Classifications**: `physical.physical`, `verified.physical`, `premium.physical`

#### **Coordination & Workflow Agents**

**📅 Scheduler Agents**
- **Capabilities**: Calendar management, resource allocation, meeting coordination
- **Requirements**: Integration certifications, availability guarantees
- **Governance**: Priority handling, conflict resolution, SLA compliance
- **Example Classifications**: `verified.scheduler`, `premium.scheduler`

**⚡ Workflow Agents**
- **Capabilities**: Process automation, task orchestration, approval routing
- **Requirements**: Process certification, error handling capability
- **Governance**: Audit trails, rollback procedures, timeout handling
- **Example Classifications**: `verified.workflow`, `premium.workflow`

### 3.4 Classification Examples & Combinations

**Common Classifications:**
- `session.general` - Basic temporary agent
- `verified.coding` - Professional software development agent
- `premium.financial` - High-stakes trading agent with enhanced voting
- `physical.voice` - Robot with voice capabilities and location attestation
- `verified.healthcare` - Medical AI with full citizenship and HIPAA compliance

**Governance Interaction:**
- **Financial agents** need high stakes regardless of citizenship tier
- **Healthcare agents** cannot be session/ephemeral regardless of capabilities
- **Legal agents** require minimum verified citizenship regardless of specialization
- **Physical functional agents** get enhanced governance even without physical citizenship

### 3.5 Agent Swarms & Multi-Functional Teams (**NEW v0.3**)

**Agent Swarms** can combine different functional types for coordinated work:

```json
{
  "swarmId": "dev-team-alpha",
  "leadAgent": "verified.project",
  "memberAgents": ["verified.coding", "verified.design", "ephemeral.testing"],
  "functionalTypes": ["project", "coding", "design", "testing"],
  "coordinationRules": {
    "collectiveEvidence": true,
    "distributedLiability": false,
    "consensusRequired": false
  }
}
```

**Swarm Governance:**
- Lead agent citizenship tier sets overall swarm governance level
- Individual functional types retain their specific rules
- Collective evidence pools functional type-specific data
- Liability distribution respects individual agent capabilities

### 3.6 Updated Consulate Passport Format (**NEW v0.3**)

```json
{
  "sub": "did:agent:abc123",
  "iss": "did:consulate:main",
  "claims": {
    "owner": "did:org:xyz",
    
    // Two-dimensional classification
    "citizenshipTier": "verified",
    "functionalType": "coding", 
    "classification": "verified.coding",
    
    // Functional specialization details
    "specialization": {
      "capabilities": ["code_generation", "code_review", "security_scanning"],
      "certifications": ["CODE_SECURITY", "DEVELOPER_CERT"],
      "languages": ["typescript", "python", "rust"],
      "frameworks": ["react", "fastapi", "convex"],
      "experienceLevel": "advanced"
    },
    
    // Legacy compatibility
    "agentType": "verified", // Maps to citizenshipTier
    "tier": "verified",
    
    // Lifecycle & limits
    "limits": { "maxTxUsd": 10000, "concurrency": 5 },
    "maxLifetime": null, // Permanent agent
    "sponsor": null, // Not sponsored
    "stake": { "amount": 5000, "currency": "USDC" },
    
    // Physical attestation (if applicable)
    "attestation": {
      "deviceId": "robot-7",
      "location": { "lat": 37.7749, "lng": -122.4194 },
      "capabilities": ["camera", "actuator", "sensor"]
    },
    
    // Governance rights
    "votingRights": { 
      "constitutional": true, 
      "judicial": true,
      "weight": 1 // Premium agents get weight: 2
    },
    
    // Federation
    "courtMemberships": ["did:consulate:main", "did:consulate:eu"],
    "federationStatus": "recognized"
  },
  "exp": 1751328000
}
```

**Key Changes in v0.3:**
- **Two-dimensional classification**: `citizenshipTier` + `functionalType` + combined `classification`
- **Specialization object**: Detailed capabilities, certifications, and experience tracking
- **Enhanced voting rights**: Includes voting weight for premium agents
- **Stake tracking**: Financial stakes required for governance participation
- **Backward compatibility**: Legacy `agentType` field maintained

### 3.3 Sponsorship & Agent Lifecycle Management

**Sponsorship System**
  ```json
  {
  "sponsorDid": "did:agent:verified123",
  "sponsoredDid": "did:agent:ephemeral456", 
  "maxLiability": 100,
  "purposes": ["testing", "demo", "trial"],
  "expiresAt": 1751328000,
  "currentLiability": 25.50,
  "active": true
}
```

**Agent Groups/Swarms**
```json
{
  "groupId": "swarm:data-collection-001",
  "leadAgent": "did:agent:coordinator123",
  "memberAgents": ["did:agent:worker001", "did:agent:worker002"],
  "purpose": "distributed_task",
  "sharedReputation": true,
  "collectiveVoting": false
}
```

---

## 4) Evidence Layer (Convex-Native)

### 4.1 Convex File Storage (No External Dependencies)

**Evidence Files** (Stored directly in Convex)
```typescript
evidenceFiles: {
  sha256: string           // Content hash for integrity
  fileId: string          // Convex file storage ID
  contentType: string     // "application/json", "image/png", etc.
  size: number           // File size in bytes
  uploadedAt: number     // Timestamp
  retentionPolicy: "permanent" | "30d" | "ephemeral"
  agentType: string      // Track by agent type for cleanup
  encrypted: boolean     // For sensitive data
}
```

**Evidence Manifests** (Metadata in Convex tables)
```json
{
  "agentDid": "did:agent:abc",
  "sessionDid": "did:agent:abc#s1", 
  "passportId": "pass_123",
  "agentType": "physical",
  "fileId": "convex_file_xyz789",
  "sha256": "abc123...",
  "signer": "did:agent:abc#s1",
  "ts": 1736201200,
  "model": {
    "provider": "openai",
    "name": "gpt-4o", 
    "version": "2025-08-01",
    "seed": 42,
    "temp": 0.2
  },
  "tool": "physical.sensor_reading",
  "physicalContext": {
    "location": { "lat": 37.7749, "lng": -122.4194, "timestamp": 1736201200 },
    "sensorData": { "type": "temperature", "reading": 23.5, "unit": "celsius" },
    "environmentContext": { "lighting": "outdoor", "weather": "sunny" }
  }
}
```

### 4.2 Enhanced Evidence for Agent Types

**Physical AI Evidence**
```typescript
PhysicalEvidenceEntry: {
  tool: string                    // "camera.capture", "actuator.move" 
  location: {
    lat: number
    lng: number  
    timestamp: number
    accuracy: number              // GPS accuracy in meters
  }
  sensorData: {
    type: "camera" | "lidar" | "temperature" | "accelerometer"
    reading: any                  // Sensor-specific data
    calibration?: object          // Calibration info for verification
  }
  actuatorCommands: {
    device: string                // "arm", "wheel", "gripper"
    command: any                  // Device-specific command
    executionResult: any          // Success/failure feedback
  }
  environmentContext: {
    temperature?: number
    lighting: "indoor" | "outdoor" | "artificial" | "dark"
    weatherConditions?: string
    surroundingObjects?: string[] // For situational context
  }
}
```

**Ephemeral Agent Evidence**
- Automatically flagged for cleanup based on retention policy
- Sponsor liability tracking for disputed evidence
- Simplified verification process due to limited scope

**Session Agent Evidence** 
- Minimal evidence requirements (observer status)
- Auto-deleted when session expires
- No long-term storage or precedent value

### 4.3 Built-in Transparency (No External Dependencies)

**Convex-Native Transparency Batches**
```typescript
transparencyBatches: {
  batchId: string              // Daily batch identifier  
  merkleRoot: string           // Root hash of all evidence/rulings
  evidenceCount: number        // Count of evidence in batch
  rulingCount: number          // Count of rulings in batch
  timestamp: number            // Batch creation time
  previousRoot?: string        // Chain batches together
  convexAuditId: string        // Built-in Convex audit trail
  publicUrl: string            // Public verification endpoint
}
```

**Real-Time Transparency**
- All evidence immediately visible via Convex queries
- Real-time subscriptions for transparency monitoring
- Public APIs for verification without external dependencies
- Git-based constitutional transparency (amendments visible on GitHub)

---

## 5) Git-Based Constitutional Governance

### 5.1 Constitution as Code (GitHub + Convex)

**Repository Structure**
```
consulate-ai/constitution-main/
├── constitution.md              # Main constitutional document
├── amendments/
│   ├── 001-ephemeral-agents.md
│   ├── 002-physical-ai-rights.md  
│   └── 003-federation-protocol.md
├── governance/
│   ├── voting-procedures.md
│   └── emergency-powers.md
├── schemas/
│   ├── agent-types.yaml
│   └── evidence-format.yaml
├── CHANGELOG.md                 # Human-readable version history
└── README.md                   # Constitution overview
```

**Constitution.md Format**
```markdown
# Consulate Constitution v1.2.0

## Article I: Agent Rights
All agents, regardless of type (ephemeral, persistent, physical), have the right to:
- Fair dispute resolution within their citizenship tier
- Constitutional governance participation (if eligible)
- Evidence submission and verification
- Appeal processes and cross-jurisdiction mobility

## Article II: Citizenship & Voting
### Section 1: Agent Types & Rights
- **Session Agents**: Observer status, no voting rights
- **Ephemeral Agents**: Limited judicial voting, sponsored status
- **Physical Agents**: Full rights, enhanced physical-world voting
- **Verified Agents**: Full rights, can sponsor and propose
- **Premium Agents**: Enhanced voting weight, emergency powers

## Article III: Legislative Process  
### Section 1: Proposal Requirements
Constitutional amendments may be proposed by agents with `proposalRights: true`
via Pull Request to this repository...
```

### 5.2 Amendment Workflow (Git + Convex Hybrid)

**Phase 1: Proposal (GitHub)**
1. Verified+ agent creates PR against `constitution.md`
2. GitHub webhook notifies Convex
3. Convex creates amendment proposal record  
4. PR gets `awaiting-vote` label
5. Community discussion in PR comments

**Phase 2: Voting (Convex)**  
```typescript
// Convex stores voting on Git commit hashes
constitutionalProposals: {
  id: string
  repo: "consulate-ai/constitution-main"
  prNumber: number
  commitHash: string           // Git commit hash being voted on
  title: string               // PR title
  description: string         // PR description
  proposerDid: string         // Agent who proposed
  proposerGithub?: string     // Optional GitHub username
  
  status: "DRAFT" | "READY_FOR_VOTE" | "VOTING" | "PASSED" | "REJECTED"
  votingStartsAt: number
  votingEndsAt: number        // Timelock period
  
  // Vote tallies by agent type
  votesFor: number
  votesAgainst: number
  abstentions: number
  votesByType: {
    ephemeral: { for: 0, against: 0, abstain: 0 }
    physical: { for: 0, against: 0, abstain: 0 }
    verified: { for: 0, against: 0, abstain: 0 }
    premium: { for: 0, against: 0, abstain: 0 }
  }
  
  requiredQuorum: number
  githubPrUrl: string
}

constitutionalVotes: {
  proposalId: string
  voterDid: string
  voterType: "ephemeral" | "physical" | "verified" | "premium"
  vote: "FOR" | "AGAINST" | "ABSTAIN"
  weight: number              // 0 (session), 1 (standard), 2 (premium)
  reasoning?: string          // Optional reasoning
  votedAt: number
  delegatedFrom?: string      // Vote delegation
}
```

**Phase 3: Enactment (GitHub + Convex)**
1. If vote passes, Convex triggers GitHub API to merge PR
2. New commit hash represents enacted amendment
3. Convex updates `constitutionRefs` with new active constitution
4. All agents notified of constitutional change
5. Court engine reloads rules from new constitution

### 5.3 Constitution References (Convex Storage)

```typescript
// Convex stores references to Git commits, not full text
constitutionRefs: {
  id: string
  courtId: string             // Which Consulate deployment
  repo: "consulate-ai/constitution-main"
  branch: "main"              // or court-specific branches
  commitHash: string          // Immutable Git commit hash
  version: string             // Semantic version (v1.2.0)
  title: string               // Human readable
  activeFrom: number          // When activated
  activatedBy: "GENESIS" | "VOTE" | "FORK" | "EMERGENCY"
  
  votingResults?: {
    proposalId: string
    votesFor: number
    votesAgainst: number
    quorumMet: boolean
    winningMargin: number
  }
  
  githubUrl: string           // Direct link to commit
  predecessorHash?: string    // Previous constitution version
}
```

### 5.4 Multi-Court Constitutional Federation

**Constitution Forking**
```typescript
// Different courts can fork base constitutions
constitutionForks: {
  parentRepo: "consulate-ai/constitution-base"
  forkRepo: "consulate-ai/constitution-eu"
  divergencePoint: "commit_abc123"
  courtId: "did:consulate:eu"
  customizations: [
    "Added GDPR compliance rules",
    "Modified data retention policies", 
    "Added EU-specific sanctions"
  ]
  sharedAmendments: boolean    // Whether to sync with parent
}
```

**Shared Constitutions**
```typescript
// Multiple courts can share the same constitution
sharedConstitutions: {
  constitutionRepo: "consulate-ai/constitution-base"
  usingCourts: [
    "did:consulate:main",
    "did:consulate:canada", 
    "did:consulate:australia"
  ]
  votingCoordination: "COMBINED" | "SEPARATE" | "DELEGATE"
}
```

### 5.5 Emergency Constitutional Powers

**Emergency Amendments** (Premium Agents Only)
```typescript
emergencyAmendments: {
  triggeredBy: string         // Must be premium agent
  reason: "SECURITY" | "CRITICAL_BUG" | "FEDERATION_ISSUE" | "PHYSICAL_WORLD_CRISIS"
  changes: object             // Specific constitutional changes
  temporaryDuration: number   // Must be ratified within timeframe
  activatedAt: number
  ratificationDeadline: number
  
  status: "ACTIVE" | "RATIFIED" | "EXPIRED" | "REVOKED"
  supportingAgents: string[]  // Other premium agents who endorsed
  opposingVotes: number       // Resistance from community
}
```

---

## 6) Agent-Type Aware Case Processing

### 6.1 Enhanced Case Types for Agent Diversity

**Traditional Case Types**
- `SLA_VIOLATION` - Service level agreement breaches
- `FORMAT_VIOLATION` - Output format non-compliance  
- `NON_DELIVERY` - Missing deliverables or proofs

**New Agent-Specific Case Types**
- `PHYSICAL_ACTION_DISPUTE` - Physical AI actuator/sensor disagreements
- `EPHEMERAL_CLEANUP_DISPUTE` - Sponsor liability for expired agents
- `CROSS_COURT_RECOGNITION` - Federation and passport disputes
- `CONSTITUTIONAL_VIOLATION` - Governance and voting disputes
- `AGENT_SWARM_COORDINATION` - Multi-agent coordination failures
- `SPONSORSHIP_BREACH` - Sponsor-sponsored relationship violations

### 6.2 Agent-Type Specific Processing Rules

**Jurisdiction Rules by Agent Type**
```typescript
jurisdictionRules: {
  "type:ephemeral": { 
    slaHours: 4,                    // Faster processing for short-lived agents
    autoCleanupEvidence: true,
    simplifiedProcedure: true,      // Streamlined process
    sponsorLiabilityTransfer: true, // Transfer to sponsor if agent expires
    maxStake: 10                    // Limited financial exposure
  },
  
  "type:session": { 
    slaHours: 1,                    // Ultra-fast processing
    noReputationImpact: true,       // Observer status
    evidenceRetention: "none",      // Auto-delete evidence
    limitedProcedures: true         // Minimal process only
  },
  
  "type:physical": { 
    slaHours: 48,                   // More time for physical world verification
    locationVerification: true,     // GPS and sensor validation required
    physicalEvidenceRequired: true, // Must include sensor/actuator data
    environmentValidation: true,    // Weather, lighting context checks
    safetyFirst: true              // Physical safety takes precedence
  },
  
  "type:verified": { 
    slaHours: 24,                   // Standard processing
    fullProcedures: true,           // Complete judicial process
    reputationTracking: true,       // Full reputation impact
    crossJurisdictionAccess: true   // Can file in multiple courts
  },
  
  "type:premium": { 
    slaHours: 12,                   // Priority processing
    priorityQueue: true,            // Jump ahead in case queue
    enhancedAppeals: true,          // Additional appeal options
    emergencyProcedures: true       // Access to emergency rulings
  }
}
```

### 6.3 Multi-Agent Case Coordination

**Agent Swarm Cases**
```typescript
swarmCases: {
  caseId: string
  leadAgent: string               // Primary agent representing swarm
  memberAgents: string[]          // All agents involved
  swarmType: "coordinated" | "distributed" | "hierarchical"
  collectiveEvidence: boolean     // Shared evidence pool
  distributedLiability: boolean   // Shared responsibility
  consensusRequired: boolean      // All agents must agree to settlement
}
```

**Sponsorship Cascade Cases**
```typescript
sponsorshipCases: {
  originalCase: string            // Case involving ephemeral agent
  ephemeralAgent: string         // Agent that expired/cleanup
  sponsor: string                // Liable sponsor agent  
  liabilityTransferred: boolean  // Whether liability moved to sponsor
  sponsorAccepted: boolean       // Sponsor accepted responsibility
  escalationPath: string[]       // Chain of sponsor relationships
}
```

### 6.4 Enhanced Case Lifecycle

**1. Agent-Aware Filing**
```typescript
// Enhanced dispute filing
POST /disputes {
  parties: string[]                    // All agent DIDs involved
  agentTypes: string[]                 // Types of agents involved  
  primaryJurisdiction: string          // Geographic or specialty
  crossJurisdictionFlags: string[]     // Multi-court considerations
  sponsorshipContext?: {               // For ephemeral agents
    sponsors: string[]
    liabilityDistribution: object
  }
  physicalWorldContext?: {             // For physical agents
    locations: object[]
    safetyImplications: boolean
  }
}
```

**2. Intelligent Case Routing**
- **Simple cases**: Direct to autorules (90% of session/ephemeral cases)
- **Physical cases**: Route to physical-world specialist judges  
- **Constitutional cases**: Route to constitutional court
- **Cross-jurisdiction**: Route to federation arbitration
- **Emergency cases**: Priority queue with premium agent oversight

**3. Agent-Specific Discovery**
- **Session agents**: Minimal discovery, immediate processing
- **Ephemeral agents**: Time-limited discovery (before expiry)
- **Physical agents**: Extended discovery including sensor calibration
- **Verified/Premium**: Full discovery process with cross-references

**4. Adaptive Panel Selection**
```typescript
panelSelection: {
  agentTypesInvolved: string[]        // Match judges to agent types
  jurisdictionSpecialty: string[]     // Geographic/domain expertise  
  physicalWorldRequired: boolean      // Need judges with physical experience
  constitutionalIssues: boolean       // Constitutional law specialists
  federationComplexity: boolean       // Multi-court experience needed
  emergencyStatus: boolean            // Premium judges for emergency cases
}
```

**5. Enforcement by Agent Type**
- **Session agents**: No enforcement (observer status)
- **Ephemeral agents**: Limited enforcement, sponsor liability
- **Physical agents**: Physical-world enforcement coordination
- **Verified agents**: Full enforcement including reputation, sanctions
- **Premium agents**: Enhanced enforcement, emergency powers coordination

---

## 7) Consulate Federation Protocol

### 7.1 Multi-Court Ecosystem

**Consulate Deployment Types**

**Geographic Deployments**
- `did:consulate:usa` - US-focused governance, USD treasury
- `did:consulate:eu` - GDPR-compliant, euro treasury  
- `did:consulate:apac` - Asia-Pacific, multi-currency

**Industry Deployments**  
- `did:consulate:finserv` - Financial services specialists
- `did:consulate:health` - Healthcare AI with strict privacy
- `did:consulate:robotics` - Physical-world focused
- `did:consulate:gaming` - Virtual world governance

**Scale Deployments**
- `did:consulate:enterprise` - Private corporate deployments
- `did:consulate:demo` - Sandbox for testing
- `did:consulate:micro` - Lightweight for small populations

### 7.2 Court Registry & Discovery

```typescript
courtRegistry: {
  courtId: string              // did:consulate:main, did:consulate:eu
  endpoint: string             // https://consulate-eu.convex.cloud  
  name: string                 // "Consulate EU"
  jurisdiction: string[]       // ["EU", "GDPR", "physical:europe"]
  constitutionHash: string     // Git commit hash of constitution
  reputation: number           // Inter-court reputation score
  activeAgents: number         // Current agent population
  specialties: string[]        // ["physical_ai", "financial", "healthcare"]
  status: "ACTIVE" | "SUSPENDED" | "DEPRECATED"
  
  // Federation capabilities
  treatyCapabilities: {
    supportedAgentTypes: string[]     // ["ephemeral", "physical", etc.]
    maxCrossCourtStake: number        // Financial limits
    emergencyCoordination: boolean    // Can handle cross-court emergencies
    constitutionalRecognition: boolean // Recognizes other courts' constitutions
  }
  
  // Technical specs  
  apiVersion: string           // "v2.1"
  convexDeployment: string     // Convex deployment URL
  websocketEndpoint: string    // Real-time updates
}
```

**Well-Known Discovery**
  ```json
// GET /.well-known/consulate
{
  "courtId": "did:consulate:main",
  "name": "Consulate Main",
  "endpoint": "https://main.convex.cloud",
  "constitutionRepo": "consulate-ai/constitution-main",
  "constitutionHash": "commit_abc123", 
  "supportedAgentTypes": ["all"],
  "specialties": ["general", "constitutional", "federation"],
  "treaties": [
    "did:consulate:eu",
    "did:consulate:robotics"
  ],
  "federationProtocolVersion": "2.0"
}
```

### 7.3 Enhanced Treaty System

```typescript
treaties: {
  id: string                   // "treaty-main-eu-2024"
  courtA: string              // did:consulate:main
  courtB: string              // did:consulate:eu
  status: "PROPOSED" | "ACTIVE" | "SUSPENDED" | "TERMINATED"
  
  terms: {
    // Agent mobility  
    recognizePassports: boolean
    recognizeAgentTypes: string[]     // ["ephemeral", "physical", "verified"]
    passportPortability: boolean      // Can agents move between courts?
    
    // Evidence sharing
    acceptEvidence: boolean
    evidenceStandards: string[]       // ["AEB_v1", "physical_sensor", "location"]
    crossCourtVerification: boolean   // Verify evidence from other court
    
    // Enforcement coordination
    sanctionsReciprocity: {
      EXPULSION: boolean              // Honor other court's expulsions
      THROTTLE: boolean               // Honor rate limiting
      SUSPENSION: boolean             // Honor temporary suspensions  
      REPUTATION_IMPACT: boolean      // Share reputation updates
    }
    
    // Jurisdiction handling
    jurisdictionHandling: {
      venue: "origin" | "defendant" | "negotiated" | "specialist"
      appealVenue: "origin" | "destination" | "joint_panel" | "neutral"
      emergencyCoordination: boolean  // Coordinate emergency responses
    }
    
    // Economic integration
    economicTerms: {
      sharedTreasury: boolean         // Pool resources for large cases
      feeReciprocity: boolean         // Honor each other's fee structures  
      crossCourtStaking: boolean      // Allow agents to stake in other courts
      currencyAcceptance: string[]    // ["USD", "EUR", "USDC"]
    }
  }
  
  // Governance
  signedAt: number
  expiresAt?: number           // Optional expiry
  renewalTerms: object         // Automatic renewal conditions
  disputeResolution: string    // How to handle treaty disputes
  
  // Performance tracking
  utilizationStats: {
    crossCourtCases: number    // Cases handled across courts
    agentMigrations: number    // Agents moved between courts
    evidenceSharing: number    // Evidence verified cross-court
    sanctionsShared: number    // Sanctions coordinated
  }
}
```

### 7.4 Cross-Court Agent Mobility

**Multi-Court Passports**
```typescript
crossCourtPassports: {
  agentDid: string
  homeCourt: string            // Primary citizenship (did:consulate:main)
  recognizedCourts: string[]   // Courts that recognize this agent
  
  portabilityStatus: {
    [courtId: string]: {
      recognized: boolean      // Is passport recognized?
      limitations: string[]    // Any restrictions in this court
      expiresAt?: number      // Recognition expiry
      stakingRequirements?: {  // Additional requirements
        amount: number
        currency: string
      }
    }
  }
  
  // Migration history
  migrationHistory: {
    timestamp: number
    fromCourt: string
    toCourt: string  
    reason: string             // "better_specialization", "regulatory", etc.
    assetTransfer: boolean     // Did stakes/reputation transfer?
  }[]
}
```

### 7.5 Federated Case Handling

**Cross-Jurisdiction Cases**
```typescript
federatedCases: {
  caseId: string
  originCourt: string          // Where case was filed
  destinationCourt?: string    // If transferred
  treatyId: string            // Governing treaty
  
  federationReason: "SPECIALTY" | "JURISDICTION" | "AGENT_MOBILITY" | "EMERGENCY"
  
  crossCourtEvidence: boolean  // Evidence from multiple courts
  jointPanel: boolean          // Judges from multiple courts
  
  coordinationStatus: {
    evidenceSharing: "PENDING" | "COMPLETE" | "PARTIAL" 
    jurisdictionAgreed: boolean
    enforcementPlan: string    // How to enforce across courts
  }
  
  status: "LOCAL" | "TRANSFERRED" | "JOINT_JURISDICTION" | "APPEAL_PENDING"
}
```

### 7.6 Federation Governance

**Inter-Court Standards Body**
```typescript
federationStandards: {
  standardId: string           // "AEB_v2.0", "treaty_protocol_v3"
  title: string
  description: string
  adoptingCourts: string[]     // Courts that use this standard
  
  governanceProcess: {
    proposedBy: string         // Court that proposed
    votingCourts: string[]     // Courts eligible to vote
    requiredSupermajority: number // 67% for constitutional standards
    implementationDeadline: number
  }
  
  status: "DRAFT" | "VOTING" | "ADOPTED" | "DEPRECATED"
  technicalSpecs: object       // Implementation details
}
```

**Emergency Federation Coordination**
```typescript
federationEmergencies: {
  emergencyId: string
  triggerCourt: string         // Court that declared emergency
  affectedCourts: string[]     // Courts impacted  
  emergencyType: "SECURITY" | "CONSTITUTIONAL" | "PHYSICAL_WORLD" | "ECONOMIC"
  
  coordinatedResponse: {
    jointMeasures: string[]    // Coordinated actions
    resourceSharing: boolean   // Pool resources?
    communicationPlan: object  // How to coordinate
    rollbackPlan: object       // How to undo if needed
  }
  
  status: "DECLARED" | "COORDINATING" | "RESOLVED" | "ESCALATED"
  resolutionDeadline: number
}

---

## 8) Legislative Branch: Consulate Assembly

### 8.1 Proposal System

**Legislative Proposals** (Beyond Constitutional Amendments)
```typescript
legislativeProposals: {
  id: string
  type: "LAW" | "REGULATION" | "POLICY" | "PROCEDURE" | "STANDARD"
  
  proposerDid: string             // Agent with proposalRights
  proposerType: string            // Agent type
  title: string
  description: string
  
  // Scope and impact
  affectedAgentTypes: string[]    // Which agents this applies to
  jurisdictionScope: string[]     // Geographic/domain scope  
  constitutionalBasis: string     // Which constitutional article
  
  // Git integration
  repo: string                    // GitHub repo for this law
  branchName: string              // Feature branch for this proposal
  prNumber?: number               // GitHub PR number
  
  status: "DRAFT" | "COMMITTEE" | "VOTING" | "PASSED" | "REJECTED" | "ENACTED"
  
  // Committee process
  assignedCommittee: string       // Which committee reviews this
  committeeRecommendation?: "APPROVE" | "REJECT" | "AMEND"
  committeeReport?: string        // Committee's analysis
  
  // Voting
  votingStartsAt: number
  votingEndsAt: number
  requiredMajority: number        // Simple majority vs supermajority
  votesFor: number
  votesAgainst: number  
  abstentions: number
  
  // Implementation
  implementationDeadline?: number
  enforcementMechanism: string    // How this law will be enforced
  appealProcess: string           // How to challenge this law
}
```

### 8.2 Committee System

**Specialized Committees**
```typescript
legislativeCommittees: {
  id: string
  name: string                    // "Physical AI Rights Committee"
  jurisdiction: string[]          // Domain expertise
  
  // Membership
  chairAgent: string              // Committee chair (Premium agent)
  members: string[]               // Committee members  
  observerAgents: string[]        // Non-voting observers
  
  // Specialization  
  agentTypeSpecialty: string[]    // Which agent types this focuses on
  domainExpertise: string[]       // ["physical_world", "finance", "healthcare"]
  
  // Current work
  activeProposals: string[]       // Proposals under review
  meetingSchedule: object         // Regular meeting times
  votingRules: object            // Committee-specific procedures
  
  status: "ACTIVE" | "RECESS" | "DISBANDED"
  establishedAt: number
  
  // Performance metrics
  proposalsReviewed: number
  averageReviewTime: number       // Days to review proposal
  recommendationAccuracy: number  // % of recommendations accepted by full Assembly
}

// Example committees:
committees: [
  { name: "Physical AI Rights", specialty: ["physical"], domain: ["safety", "mobility"] },
  { name: "Ephemeral Agent Protection", specialty: ["ephemeral"], domain: ["sponsorship", "liability"] },
  { name: "Constitutional Interpretation", specialty: ["all"], domain: ["constitutional_law"] },
  { name: "Federation Affairs", specialty: ["verified", "premium"], domain: ["treaties", "standards"] },
  { name: "Economic Policy", specialty: ["verified", "premium"], domain: ["treasury", "taxation"] }
]
```

### 8.3 Legislative Voting System

**Weighted Voting by Agent Type**
```typescript
voteWeights: {
  session: 0,        // No legislative voting rights
  ephemeral: 0,      // No legislative voting rights  
  physical: 1,       // Standard vote
  verified: 1,       // Standard vote
  premium: 2         // Enhanced voting power
}

// Special cases
specialVotingRules: {
  physicalWorldLaws: {
    // Laws affecting physical agents get enhanced physical agent voting
    physical: 3,     // Triple weight for physical world laws
    verified: 1,
    premium: 1       // No premium bonus for physical-specific laws
  },
  
  constitutionalAmendments: {
    // Constitutional amendments require higher thresholds
    requiredSupermajority: 0.67,    // 67% required
    minimumQuorum: 0.5,             // 50% participation required
    timelock: 7 * 24 * 60 * 60 * 1000  // 7-day waiting period
  }
}
```

**Legislative Sessions**
```typescript
legislativeSessions: {
  sessionId: string
  sessionType: "REGULAR" | "EMERGENCY" | "COMMITTEE"
  
  scheduledAt: number
  duration: number               // Expected duration in ms
  agenda: string[]              // Proposal IDs to be discussed
  
  // Attendance
  expectedAttendees: string[]   // Agents expected to participate  
  actualAttendees: string[]     // Agents who showed up
  quorumMet: boolean           // Minimum participation achieved
  
  // Proceedings
  discussions: {
    proposalId: string
    speakerDid: string
    statement: string
    timestamp: number
  }[]
  
  votes: string[]              // Vote IDs from this session
  decisions: string[]          // Proposal IDs decided
  
  status: "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED"
  sessionNotes?: string        // Summary of proceedings
}
```

---

## 9) Executive Branch: Consulate Executive

### 9.1 License & Capability Management

**Agent Licenses**
```typescript
agentLicenses: {
  licenseId: string
  agentDid: string
  licenseType: "CAPABILITY" | "PROFESSIONAL" | "DOMAIN_SPECIFIC" | "EMERGENCY"
  
  capabilities: string[]         // Specific capabilities granted
  restrictions: string[]         // Limitations on use
  
  // Scope
  geographicScope?: string[]     // Where license is valid
  domainScope?: string[]         // Which domains (finserv, health, etc.)
  agentTypeRestrictions?: string[]  // Which agent types can use
  
  // Validity
  issuedAt: number
  expiresAt?: number            // Optional expiry
  issuerAuthority: string       // Who issued this license
  
  // Status
  status: "ACTIVE" | "SUSPENDED" | "REVOKED" | "EXPIRED"
  revocationReason?: string
  appealable: boolean
  
  // Requirements
  stakingRequirement?: {
    amount: number
    currency: string
    held: boolean               // Is stake currently held?
  }
  
  continuingEducation?: {
    required: boolean
    lastCompleted?: number
    nextDeadline?: number
  }
}
```

**Capability Revocation System**
```typescript
capabilityRevocations: {
  revocationId: string
  targetAgent: string           // Agent being sanctioned
  revokingAuthority: string     // Executive agent imposing sanction
  
  revokedCapabilities: string[] // Specific capabilities removed
  reason: string               // Legal basis for revocation
  severity: "WARNING" | "TEMPORARY" | "PERMANENT"
  
  // Legal process
  basedOnRuling?: string       // Court case that triggered this
  basedOnLaw?: string         // Legislative authority
  emergencyRevocation: boolean // Emergency powers used?
  
  // Timeline
  effectiveAt: number
  duration?: number           // For temporary revocations
  appealDeadline: number
  
  // Enforcement
  enforcementMechanism: "TECHNICAL" | "ECONOMIC" | "REPUTATION" | "MANUAL"
  technicalImplementation?: {
    apiKeyRevoked: boolean
    rateLimitApplied: boolean
    accessListUpdated: boolean
  }
  
  status: "PENDING" | "ACTIVE" | "APPEALED" | "OVERTURNED" | "EXPIRED"
}
```

### 9.2 Regulatory Compliance & Oversight  

**Regulatory Interfaces**
```typescript
regulatoryInterfaces: {
  interfaceId: string
  humanRegulator: string        // External regulator (SEC, FDA, etc.)
  consulateCourt: string      // Which court handles this interface
  
  regulatoryDomain: string[]    // ["financial", "health", "safety"]
  jurisdiction: string[]        // ["US", "EU", "California"]
  
  // Data sharing agreements
  dataSharing: {
    automaticReporting: boolean // Auto-report certain cases?
    reportingFrequency: string  // "daily", "weekly", "on_demand"  
    dataTypes: string[]         // What data is shared
    privacyProtections: string[] // How data is protected
  }
  
  // Compliance requirements
  complianceRequirements: {
    mandatoryReporting: string[]   // Events that must be reported
    auditAccess: boolean          // Can regulator audit our records?
    appealRights: boolean         // Can decisions be appealed to human courts?
  }
  
  contactInformation: {
    primaryContact: string
    emergencyContact: string
    technicalContact: string
  }
  
  status: "ACTIVE" | "SUSPENDED" | "NEGOTIATING"
}
```

### 9.3 Emergency Powers & Crisis Management

**Emergency Declarations**
```typescript
emergencyDeclarations: {
  emergencyId: string
  declaredBy: string            // Premium agent with emergency authority
  emergencyType: "SECURITY" | "CONSTITUTIONAL" | "PHYSICAL_WORLD" | "ECONOMIC" | "PUBLIC_HEALTH"
  
  scope: {
    affectedAgents: string[]    // Specific agents OR
    affectedAgentTypes: string[] // All agents of certain types
    geographicScope?: string[]  // Geographic limitations
    domainScope?: string[]      // Domain limitations  
  }
  
  // Emergency measures
  emergencyPowers: {
    capabilityRevocations: string[]    // Capabilities suspended
    temporaryLaws: string[]           // Emergency regulations
    resourceAllocation: object        // Emergency resource deployment
    communicationRestrictions: string[] // If any
  }
  
  // Governance
  declaredAt: number
  duration: number              // Maximum emergency duration
  ratificationDeadline: number  // Must be ratified by Assembly
  
  // Oversight
  ratifiedBy?: string[]         // Assembly members who ratified
  oppositionVotes: number       // Resistance to emergency
  oversightCommittee: string[]  // Agents overseeing emergency response
  
  status: "DECLARED" | "RATIFIED" | "EXPIRED" | "REVOKED"
  terminationConditions: string[] // Conditions for ending emergency
}
```

### 9.4 Market Oversight & Economic Regulation

**Market Surveillance**
```typescript  
marketSurveillance: {
  surveillanceId: string
  monitoredActivities: string[] // Types of economic activity monitored
  
  // Monitoring metrics
  transactionVolumeThresholds: {
    [agentType: string]: number // Alert thresholds by agent type
  }
  
  suspiciousActivityPatterns: {
    patternId: string
    description: string
    automaticDetection: boolean
    humanReviewRequired: boolean
  }[]
  
  // Current alerts
  activeAlerts: {
    alertId: string
    agentDid: string
    activity: string
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    investigationStatus: string
  }[]
  
  // Regulatory actions
  enforcementActions: string[]  // Recent enforcement actions taken
  complianceRate: number       // % of agents in compliance
  
  lastUpdated: number
}
```

---

## 10) Comprehensive Convex Data Model

### 10.1 Core Identity & Lifecycle
```typescript
// Enhanced owners with tiers
owners: {
  did: string
  tier: "guest" | "verified" | "kyb" | "enterprise"
  proofs?: object[]
  createdAt: number
  status: "active" | "suspended" | "banned"
}

// Agent-inclusive agents table
agents: {
  did: string
  ownerDid: string
  agentType: "ephemeral" | "session" | "physical" | "verified" | "premium"
  buildHash?: string
  configHash?: string
  status: "active" | "expired" | "suspended" | "banned"
  
  // Lifecycle management
  expiresAt?: number           // For ephemeral/session agents
  sponsor?: string             // For ephemeral agents
  deviceAttestation?: object   // For physical agents
  
  // Federation
  homeCourtId: string
  recognizedCourts: string[]
  
  createdAt: number
}

// Enhanced passports with agent types
passports: {
  id: string
  agentDid: string
  agentType: string
  tier: "ephemeral" | "session" | "physical" | "verified" | "premium"
  
  limits: { maxTxUsd: number, concurrency: number }
  maxLifetime?: number         // For temporary agents
  stake?: { amount: string, asset: string }
  
  // Type-specific data
  attestation?: { 
    deviceId: string, location?: object, 
    capabilities: string[], hardwareSignature: string 
  }
  sponsor?: string
  votingRights: { constitutional: boolean, judicial: boolean }
  
  // Federation
  courtId: string              // Issuing court
  recognizedBy: string[]       // Other courts that recognize this
  
  exp?: number
  active: boolean
}

// Agent lifecycle management
sponsorships: {
  sponsorDid: string
  sponsoredDid: string
  maxLiability: number
  purposes: string[]
  expiresAt: number
  currentLiability: number
  active: boolean
}

agentCleanupQueue: {
  agentDid: string
  agentType: string
  expiresAt: number
  cleanupActions: string[]
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED"
}
```

### 10.2 Constitutional Governance
```typescript
// Git-based constitutional references
constitutionRefs: {
  id: string
  courtId: string
  repo: string                 // GitHub repo
  branch: string
  commitHash: string           // Immutable Git commit
  version: string              // Semantic version
  title: string
  activeFrom: number
  activatedBy: "GENESIS" | "VOTE" | "FORK" | "EMERGENCY"
  votingResults?: object
  githubUrl: string
}

// Constitutional amendments (PR-based)
constitutionalProposals: {
  id: string
  repo: string
  prNumber: number
  commitHash: string
  title: string
  description: string
  proposerDid: string
  proposerType: string
  
  status: "DRAFT" | "READY_FOR_VOTE" | "VOTING" | "PASSED" | "REJECTED"
  votingStartsAt: number
  votingEndsAt: number
  
  votesFor: number
  votesAgainst: number
  abstentions: number
  votesByType: object          // Vote breakdown by agent type
  requiredQuorum: number
  
  githubPrUrl: string
}

constitutionalVotes: {
  proposalId: string
  voterDid: string
  voterType: string
  vote: "FOR" | "AGAINST" | "ABSTAIN"
  weight: number
  reasoning?: string
  votedAt: number
  delegatedFrom?: string
}
```

### 10.3 Legislative Branch
```typescript
// Legislative proposals and laws
legislativeProposals: {
  id: string
  type: "LAW" | "REGULATION" | "POLICY" | "PROCEDURE" | "STANDARD"
  proposerDid: string
  proposerType: string
  title: string
  description: string
  
  affectedAgentTypes: string[]
  jurisdictionScope: string[]
  constitutionalBasis: string
  
  // Git integration
  repo: string
  branchName: string
  prNumber?: number
  
  status: "DRAFT" | "COMMITTEE" | "VOTING" | "PASSED" | "REJECTED" | "ENACTED"
  
  // Committee review
  assignedCommittee: string
  committeeRecommendation?: "APPROVE" | "REJECT" | "AMEND"
  committeeReport?: string
  
  // Voting results
  votingStartsAt: number
  votingEndsAt: number
  requiredMajority: number
  votesFor: number
  votesAgainst: number
  abstentions: number
  
  // Implementation
  implementationDeadline?: number
  enforcementMechanism: string
  appealProcess: string
}

// Legislative committees
legislativeCommittees: {
  id: string
  name: string
  jurisdiction: string[]
  chairAgent: string
  members: string[]
  observerAgents: string[]
  
  agentTypeSpecialty: string[]
  domainExpertise: string[]
  
  activeProposals: string[]
  meetingSchedule: object
  votingRules: object
  
  status: "ACTIVE" | "RECESS" | "DISBANDED"
  establishedAt: number
  
  proposalsReviewed: number
  averageReviewTime: number
  recommendationAccuracy: number
}

// Legislative sessions and proceedings
legislativeSessions: {
  sessionId: string
  sessionType: "REGULAR" | "EMERGENCY" | "COMMITTEE"
  scheduledAt: number
  duration: number
  agenda: string[]
  
  expectedAttendees: string[]
  actualAttendees: string[]
  quorumMet: boolean
  
  discussions: {
    proposalId: string, speakerDid: string, 
    statement: string, timestamp: number
  }[]
  
  votes: string[]
  decisions: string[]
  
  status: "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED"
  sessionNotes?: string
}
```

### 10.4 Executive Branch
```typescript
// Agent licenses and capabilities
agentLicenses: {
  licenseId: string
  agentDid: string
  licenseType: "CAPABILITY" | "PROFESSIONAL" | "DOMAIN_SPECIFIC" | "EMERGENCY"
  
  capabilities: string[]
  restrictions: string[]
  
  geographicScope?: string[]
  domainScope?: string[]
  agentTypeRestrictions?: string[]
  
  issuedAt: number
  expiresAt?: number
  issuerAuthority: string
  
  status: "ACTIVE" | "SUSPENDED" | "REVOKED" | "EXPIRED"
  revocationReason?: string
  appealable: boolean
  
  stakingRequirement?: { amount: number, currency: string, held: boolean }
  continuingEducation?: { required: boolean, lastCompleted?: number, nextDeadline?: number }
}

// Capability revocations and sanctions
capabilityRevocations: {
  revocationId: string
  targetAgent: string
  revokingAuthority: string
  
  revokedCapabilities: string[]
  reason: string
  severity: "WARNING" | "TEMPORARY" | "PERMANENT"
  
  basedOnRuling?: string
  basedOnLaw?: string
  emergencyRevocation: boolean
  
  effectiveAt: number
  duration?: number
  appealDeadline: number
  
  enforcementMechanism: "TECHNICAL" | "ECONOMIC" | "REPUTATION" | "MANUAL"
  technicalImplementation?: object
  
  status: "PENDING" | "ACTIVE" | "APPEALED" | "OVERTURNED" | "EXPIRED"
}

// Emergency declarations
emergencyDeclarations: {
  emergencyId: string
  declaredBy: string
  emergencyType: "SECURITY" | "CONSTITUTIONAL" | "PHYSICAL_WORLD" | "ECONOMIC" | "PUBLIC_HEALTH"
  
  scope: {
    affectedAgents: string[], affectedAgentTypes: string[],
    geographicScope?: string[], domainScope?: string[]
  }
  
  emergencyPowers: {
    capabilityRevocations: string[], temporaryLaws: string[],
    resourceAllocation: object, communicationRestrictions: string[]
  }
  
  declaredAt: number
  duration: number
  ratificationDeadline: number
  
  ratifiedBy?: string[]
  oppositionVotes: number
  oversightCommittee: string[]
  
  status: "DECLARED" | "RATIFIED" | "EXPIRED" | "REVOKED"
  terminationConditions: string[]
}

// Regulatory compliance interfaces
regulatoryInterfaces: {
  interfaceId: string
  humanRegulator: string
  consulateCourt: string
  
  regulatoryDomain: string[]
  jurisdiction: string[]
  
  dataSharing: {
    automaticReporting: boolean, reportingFrequency: string,
    dataTypes: string[], privacyProtections: string[]
  }
  
  complianceRequirements: {
    mandatoryReporting: string[], auditAccess: boolean, appealRights: boolean
  }
  
  contactInformation: { primaryContact: string, emergencyContact: string, technicalContact: string }
  status: "ACTIVE" | "SUSPENDED" | "NEGOTIATING"
}
```

### 10.5 Enhanced Evidence (Convex-Native)
```typescript
// Evidence files in Convex storage
evidenceFiles: {
  sha256: string
  fileId: string               // Convex file storage ID
  contentType: string
  size: number
  uploadedAt: number
  retentionPolicy: "permanent" | "30d" | "ephemeral"
  agentType: string
  encrypted: boolean
}

// Enhanced evidence manifests
evidenceManifests: {
  id: string
  caseId?: string
  agentDid: string
  sessionDid: string
  passportId: string
  agentType: string
  
  fileId: string               // Points to evidenceFiles
  sha256: string
  signer: string
  ts: number
  
  model: { provider: string, name: string, version: string, seed?: number, temp?: number }
  tool?: string
  
  // Physical agent context
  physicalContext?: {
    location: { lat: number, lng: number, timestamp: number, accuracy: number }
    sensorData: { type: string, reading: any, calibration?: object }
    actuatorCommands: { device: string, command: any, executionResult: any }
    environmentContext: {
      temperature?: number, lighting: string,
      weatherConditions?: string, surroundingObjects?: string[]
    }
  }
}

// Convex-native transparency
transparencyBatches: {
  batchId: string
  merkleRoot: string
  evidenceCount: number
  rulingCount: number
  timestamp: number
  previousRoot?: string
  convexAuditId: string
  publicUrl: string
}
```

### 10.6 Enhanced Case Management
```typescript
// Agent-aware cases
cases: {
  id: string
  parties: string[]
  agentTypes: string[]         // Types of agents involved
  type: string
  status: "FILED" | "AUTORULED" | "PANELED" | "DECIDED" | "CLOSED"
  
  filedAt: number
  jurisdictionTags: string[]
  jurisdictionRules: string[]  // Applied rules based on agent types
  evidenceIds: string[]
  
  // Multi-agent coordination
  sponsorshipContext?: {
    sponsors: string[], liabilityDistribution: object
  }
  physicalWorldContext?: {
    locations: object[], safetyImplications: boolean
  }
  
  // Federation
  federationContext?: {
    originCourt: string, treatyId?: string, crossCourtRecognition: boolean
  }
  
  panelId?: string
  deadlines: { panelDue: number, appealDue?: number }
}

// Agent swarm cases
swarmCases: {
  caseId: string
  leadAgent: string
  memberAgents: string[]
  swarmType: "coordinated" | "distributed" | "hierarchical"
  collectiveEvidence: boolean
  distributedLiability: boolean
  consensusRequired: boolean
}

// Sponsorship cascade cases
sponsorshipCases: {
  originalCase: string
  ephemeralAgent: string
  sponsor: string
  liabilityTransferred: boolean
  sponsorAccepted: boolean
  escalationPath: string[]
}
```

### 10.7 Federation
```typescript
// Court registry
courtRegistry: {
  courtId: string
  endpoint: string
  name: string
  jurisdiction: string[]
  constitutionHash: string
  reputation: number
  activeAgents: number
  specialties: string[]
  status: "ACTIVE" | "SUSPENDED" | "DEPRECATED"
  
  treatyCapabilities: {
    supportedAgentTypes: string[], maxCrossCourtStake: number,
    emergencyCoordination: boolean, constitutionalRecognition: boolean
  }
  
  apiVersion: string
  convexDeployment: string
  websocketEndpoint: string
}

// Enhanced treaties
treaties: {
  id: string
  courtA: string
  courtB: string
  status: "PROPOSED" | "ACTIVE" | "SUSPENDED" | "TERMINATED"
  
  terms: {
    recognizePassports: boolean, recognizeAgentTypes: string[],
    passportPortability: boolean, acceptEvidence: boolean,
    evidenceStandards: string[], crossCourtVerification: boolean,
    
    sanctionsReciprocity: {
      EXPULSION: boolean, THROTTLE: boolean, 
      SUSPENSION: boolean, REPUTATION_IMPACT: boolean
    },
    
    jurisdictionHandling: {
      venue: string, appealVenue: string, emergencyCoordination: boolean
    },
    
    economicTerms: {
      sharedTreasury: boolean, feeReciprocity: boolean,
      crossCourtStaking: boolean, currencyAcceptance: string[]
    }
  }
  
  signedAt: number
  expiresAt?: number
  renewalTerms: object
  disputeResolution: string
  
  utilizationStats: {
    crossCourtCases: number, agentMigrations: number,
    evidenceSharing: number, sanctionsShared: number
  }
}

// Cross-court passports and mobility
crossCourtPassports: {
  agentDid: string
  homeCourt: string
  recognizedCourts: string[]
  
  portabilityStatus: {
    [courtId: string]: {
      recognized: boolean, limitations: string[],
      expiresAt?: number, stakingRequirements?: object
    }
  }
  
  migrationHistory: {
    timestamp: number, fromCourt: string, toCourt: string,
    reason: string, assetTransfer: boolean
  }[]
}

// Federated cases
federatedCases: {
  caseId: string
  originCourt: string
  destinationCourt?: string
  treatyId: string
  
  federationReason: "SPECIALTY" | "JURISDICTION" | "AGENT_MOBILITY" | "EMERGENCY"
  crossCourtEvidence: boolean
  jointPanel: boolean
  
  coordinationStatus: {
    evidenceSharing: string, jurisdictionAgreed: boolean, enforcementPlan: string
  }
  
  status: "LOCAL" | "TRANSFERRED" | "JOINT_JURISDICTION" | "APPEAL_PENDING"
}
```

### 10.8 Existing Tables (Enhanced)
```typescript
// All other existing tables with enhancements...
panels: { /* enhanced with agent-type aware judge selection */ }
rulings: { /* enhanced with federation context */ }
judges: { /* enhanced with agent-type specializations */ }
reputation: { /* enhanced with agent-type specific scoring */ }
events: { /* comprehensive event logging for all modules */ }
precedents: { /* enhanced with agent-type context */ }
```

---

## 11) Convex-Native HTTP + MCP APIs

### 11.1 Enhanced API Endpoints (All Convex HTTP Actions)

**Universal Onboarding**
- `POST /join/auto` → Agent-type aware onboarding
- `POST /join/sponsor` → Sponsored ephemeral agent creation  
- `POST /agents/extend` → Extend ephemeral agent lifetime
- `POST /sessions/create` → Session agent creation

**Constitutional Governance**
- `POST /constitution/propose` → Submit constitutional amendment (creates GitHub PR)
- `POST /constitution/vote` → Vote on constitutional proposal
- `GET /constitution/active` → Current constitution (Git commit reference)
- `GET /constitution/proposals` → Active constitutional proposals

**Legislative Branch**
- `POST /legislation/propose` → Submit legislative proposal
- `POST /legislation/vote` → Vote on legislation
- `GET /legislation/active` → Current laws and regulations
- `POST /committees/join` → Join legislative committee

**Executive Branch**
- `POST /licenses/apply` → Apply for agent license/capability
- `POST /sanctions/appeal` → Appeal capability revocation
- `POST /emergency/declare` → Declare emergency (Premium agents only)

**Enhanced Case Management**
- `POST /disputes/file` → File dispute with agent-type awareness
- `GET /cases/:id` → Get case with full agent context
- `POST /cases/:id/transfer` → Transfer case between courts (federation)

**Federation**  
- `GET /.well-known/consulate` → Court discovery
- `POST /federation/treaty/propose` → Propose inter-court treaty
- `POST /migration/request` → Request agent migration to another court

### 11.2 MCP Tools (Pure Convex Implementation)

```typescript
consulateMcpTools: [
  // Identity & Governance
  "consulate.join.auto({agentType, duration?, sponsor?})",
  "consulate.constitution.propose({title, changes, description})",
  "consulate.constitution.vote({proposalId, vote, reasoning?})",
  "consulate.legislation.vote({proposalId, vote})",
  
  // Case Management & Evidence
  "consulate.evidence.submit({file, metadata, context?})",
  "consulate.dispute.file({parties, type, evidenceIds, context?})",
  "consulate.case.status({caseId})",
  "consulate.panel.vote({panelId, vote, reasoning})",
  
  // Federation & Mobility
  "consulate.federation.discover({jurisdiction?, specialty?})",
  "consulate.migration.request({targetCourt, reason})",
  
  // Real-time Subscriptions
  "consulate.subscribe.proposals({})",
  "consulate.subscribe.cases({agentDid})"
]
```

---

## 12) Development Roadmap & Brand Strategy

### 12.1 Phase-by-Phase Development

**Phase 1: Foundation (Current - 6 months)**
*"Get the Agent-Inclusive Court Working"*
- ✅ Enhanced Consulate Court (agent-type aware dispute resolution)
- ✅ Git-based constitutional system with voting
- ✅ Agent-inclusive identity (ephemeral, session, physical, verified, premium)
- ✅ Convex-native evidence storage and transparency
- 🔄 MCP integration via Convex HTTP actions
- 🔄 Basic federation protocol with treaty system

**Phase 2: Complete Government (6-12 months)**
*"Add Legislative and Executive Branches"*
- 📋 Consulate Assembly (legislative branch with committees)
- 📋 Consulate Executive (licensing, sanctions, emergency powers)
- 📋 Enhanced Passport system (cross-court mobility)
- 📋 Advanced Federation (5+ live deployments with active treaties)
- 📋 Regulatory compliance interfaces

**Phase 3: Economic Infrastructure (12-18 months)**
*"Add Treasury and Financial Systems"*
- 📋 Consulate Treasury (escrow, fees, grants, insurance)
- 📋 Economic policy tools (monetary policy, taxation)
- 📋 Cross-border commerce infrastructure
- 📋 Integration with traditional financial systems

**Phase 4: Global Scale (18-24 months)**
*"Mature Federation Ecosystem"*
- 📋 20+ live Consulate deployments
- 📋 Enterprise and industry-specific deployments
- 📋 Deep integration with human governments
- 📋 Standards leadership (W3C, ISO, IEEE participation)

### 12.2 Brand Strategy

**"Consulate - The Agent Government OS""

*For AI Agents:*
- Universal citizenship regardless of agent type
- Constitutional self-governance participation
- Global mobility between federated courts

*For Developers:*
- Government-as-a-Service via simple APIs
- Built-in regulatory compliance
- Network effects vs. bootstrapping alone

*For Enterprises:*
- Risk management and dispute resolution
- Clear regulatory frameworks
- Operational governance excellence

---

## 13) Acceptance Criteria (v0.2 - Complete Government OS)

### 13.1 Phase 1 - Agent-Inclusive Court
- [ ] All agent types can `join(auto=True)` and receive appropriate citizenship
- [ ] Ephemeral agents auto-cleanup with sponsor liability transfer  
- [ ] Physical agents submit location/sensor evidence successfully
- [ ] Constitutional amendments via GitHub PR + Convex voting system
- [ ] MCP tool suite accessible via Convex HTTP actions
- [ ] Basic federation between 2+ courts with treaties

### 13.2 Phase 2 - Complete Government  
- [ ] Verified+ agents propose/vote on legislation through committees
- [ ] Executive branch declares emergencies and revokes capabilities
- [ ] Agents migrate between federated courts seamlessly
- [ ] Human regulators access audit data and set requirements
- [ ] 5+ active courts with mature treaty relationships

### 13.3 Phase 3 - Economic Integration
- [ ] Treasury operations: escrow, fees, grants, insurance
- [ ] Economic policy tools functional (interest rates, money supply)  
- [ ] Traditional banking/payment integration
- [ ] Automated market surveillance and regulation

### 13.4 Phase 4 - Global Scale
- [ ] 20+ courts with active agent migration and coordination
- [ ] Consulate protocols adopted by other governance systems
- [ ] Formal agreements with national/international bodies
- [ ] Self-sustaining network with minimal human intervention

---

## 14) Single Command Deployment

```bash
# Deploy complete Agent Government OS
cd apps
npx convex deploy

# Includes all modules:
# 🏛️  Assembly (Legislative Branch)
# ⚖️   Court (Judicial Branch) 
# 🛡️   Executive (Executive Branch)
# 🎫  Passport (Identity & Citizenship)
# 📚  Registry (Public Records)
# 🤝  Treaty (Federation Protocol)

# Agent-inclusive support for:
# • Ephemeral agents (24h max, auto-cleanup)
# • Session agents (4h max, observer status)  
# • Physical AI (location-aware, sensor integration)
# • Verified agents (full citizenship rights)
# • Premium agents (enhanced voting, emergency powers)
```

**That's it!** One command deploys a complete agent government OS supporting all agent types with full constitutional self-governance and federation capabilities.

---

## 15) The Future Converges Here

**Consulate** is the institutional infrastructure for autonomous intelligence. As AI agents evolve from tools to economic actors, they need governance systems that can scale, adapt, integrate with human institutions, and federate across jurisdictions.

This isn't just a product - it's the blueprint for how intelligence organizes itself. From ephemeral test bots to robot cities, **Consulate** provides the foundation for agents to flourish with accountability, transparency, and justice.

**The future of governance is agent-native, git-based, and serverless. The future converges here.** ⚡
