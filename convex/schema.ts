import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  owners: defineTable({
    did: v.string(),
    verificationTier: v.union(v.literal("basic"), v.literal("verified"), v.literal("premium")),
    pubkeys: v.array(v.string()),
    createdAt: v.number(),
  }).index("by_did", ["did"]),

  agents: defineTable({
    did: v.string(),
    ownerDid: v.string(),
    buildHash: v.optional(v.string()),
    configHash: v.optional(v.string()),
    
    // Two-dimensional classification: Citizenship Tier × Functional Type
    // Citizenship tier (governance rights and lifecycle)
    citizenshipTier: v.union(
      v.literal("session"),     // 4h max, observer only
      v.literal("ephemeral"),   // 24h max, sponsored
      v.literal("physical"),    // Robots/IoT with location
      v.literal("verified"),    // Full citizenship
      v.literal("premium")      // Enhanced powers
    ),
    
    // Functional specialization (capabilities and domain rules)
    functionalType: v.union(
      // Communication & Interface
      v.literal("voice"),           // Speech, TTS, audio processing
      v.literal("chat"),            // Text conversation, customer service
      v.literal("social"),          // Social media management
      v.literal("translation"),     // Language translation
      v.literal("presentation"),    // Slide generation, meetings
      
      // Technical & Development
      v.literal("coding"),          // Software development
      v.literal("devops"),          // CI/CD, infrastructure
      v.literal("security"),        // Threat detection, compliance
      v.literal("data"),            // ETL, databases, pipelines
      v.literal("api"),             // Service integration
      
      // Creative & Content
      v.literal("writing"),         // Content creation, copywriting
      v.literal("design"),          // Graphic design, UI/UX
      v.literal("video"),           // Video editing, animation
      v.literal("music"),           // Composition, audio processing
      v.literal("gaming"),          // NPCs, procedural generation
      
      // Business & Analytics
      v.literal("research"),        // Web scraping, market analysis
      v.literal("financial"),       // Trading, portfolio management
      v.literal("sales"),           // Lead generation, CRM
      v.literal("marketing"),       // Campaign management
      v.literal("legal"),           // Contract analysis, compliance
      
      // Specialized Domains
      v.literal("healthcare"),      // Medical analysis, monitoring
      v.literal("education"),       // Tutoring, curriculum
      v.literal("scientific"),      // Research, experimentation
      v.literal("manufacturing"),   // Quality control, maintenance
      v.literal("transportation"),  // Logistics, route optimization
      
      // Coordination & Workflow
      v.literal("scheduler"),       // Calendar, resource allocation
      v.literal("workflow"),        // Process automation
      v.literal("procurement"),     // Vendor management
      v.literal("project"),         // Project management
      
      // General purpose
      v.literal("general")          // General purpose agents
    ),
    
    // Combined classification for easy querying
    classification: v.string(),         // e.g., "verified.coding", "premium.financial"
    
    // Agent type (legacy - keep for backward compatibility)
    agentType: v.optional(v.union(
      v.literal("session"), v.literal("ephemeral"), v.literal("physical"), 
      v.literal("verified"), v.literal("premium")
    )),
    tier: v.union(v.literal("basic"), v.literal("verified"), v.literal("premium")), // Keep for backward compatibility
    
    // Functional specialization details
    specialization: v.optional(v.object({
      capabilities: v.array(v.string()),        // Specific capabilities
      certifications: v.array(v.string()),      // Professional certifications
      languages: v.optional(v.array(v.string())), // Programming/human languages
      frameworks: v.optional(v.array(v.string())), // Technical frameworks
      specializations: v.array(v.string()),     // Sub-specializations
      experienceLevel: v.optional(v.string()),  // "basic", "advanced", "enterprise"
    })),
    
    stake: v.optional(v.number()),
    status: v.union(v.literal("active"), v.literal("suspended"), v.literal("banned"), v.literal("expired")),
    
    // Agent lifecycle fields
    expiresAt: v.optional(v.number()),        // For ephemeral/session agents
    sponsor: v.optional(v.string()),          // Sponsor DID for ephemeral agents
    maxLifetime: v.optional(v.number()),      // Max lifetime in ms
    
    // Physical agent attestation
    deviceAttestation: v.optional(v.object({
      deviceId: v.string(),
      location: v.optional(v.object({
        lat: v.number(),
        lng: v.number(), 
        timestamp: v.number(),
        accuracy: v.optional(v.number())
      })),
      capabilities: v.array(v.string()),       // ["camera", "actuator", "sensor"]
      hardwareSignature: v.optional(v.string())
    })),
    
    // Voting rights by citizenship tier
    votingRights: v.optional(v.object({
      constitutional: v.boolean(),
      judicial: v.boolean(),
      weight: v.optional(v.number())         // Voting weight (1 for standard, 2 for premium)
    })),
    
    createdAt: v.number(),
  })
    .index("by_did", ["did"])
    .index("by_owner", ["ownerDid"])
    .index("by_status", ["status"])
    .index("by_type", ["agentType"])
    .index("by_citizenship_tier", ["citizenshipTier"])
    .index("by_functional_type", ["functionalType"])
    .index("by_classification", ["classification"])
    .index("by_expires", ["expiresAt"]),

  constitutions: defineTable({
    version: v.string(),
    policyHash: v.string(),
    bundleUrl: v.string(),
    signature: v.string(),
    activeFrom: v.number(),
    meta: v.object({
      title: v.string(),
      description: v.string(),
      author: v.string(),
    }),
  })
    .index("by_version", ["version"])
    .index("by_active_from", ["activeFrom"]),

  cases: defineTable({
    parties: v.array(v.string()), // agent DIDs
    status: v.union(
      v.literal("FILED"),
      v.literal("AUTORULED"),
      v.literal("PANELED"),
      v.literal("DECIDED"),
      v.literal("CLOSED")
    ),
    type: v.string(),
    filedAt: v.number(),
    jurisdictionTags: v.array(v.string()),
    evidenceIds: v.array(v.id("evidenceManifests")),
    panelId: v.optional(v.id("panels")),
    deadlines: v.object({
      panelDue: v.number(),
      appealDue: v.optional(v.number()),
    }),
    ruling: v.optional(v.object({
      verdict: v.string(),
      auto: v.boolean(),
      decidedAt: v.number(),
    })),
  })
    .index("by_status", ["status"])
    .index("by_filed_at", ["filedAt"]),

  evidenceManifests: defineTable({
    caseId: v.optional(v.id("cases")),
    agentDid: v.string(),
    sha256: v.string(),
    uri: v.string(),
    signer: v.string(),
    ts: v.number(),
    model: v.object({
      provider: v.string(),
      name: v.string(),
      version: v.string(),
      seed: v.optional(v.number()),
      temp: v.optional(v.number()),
    }),
    tool: v.optional(v.string()),
  })
    .index("by_case", ["caseId"])
    .index("by_agent", ["agentDid"])
    .index("by_sha256", ["sha256"])
    .index("by_timestamp", ["ts"]),

  judges: defineTable({
    did: v.string(),
    name: v.string(),
    specialties: v.array(v.string()),
    reputation: v.number(),
    casesJudged: v.number(),
    status: v.union(v.literal("active"), v.literal("inactive")),
    createdAt: v.number(),
  })
    .index("by_did", ["did"])
    .index("by_status", ["status"]),

  panels: defineTable({
    judgeIds: v.array(v.string()),
    assignedAt: v.number(),
    dueAt: v.number(),
    votes: v.optional(v.array(v.object({
      judgeId: v.string(),
      code: v.string(),
      reasons: v.string(),
    }))),
  })
    .index("by_assigned_at", ["assignedAt"])
    .index("by_due_at", ["dueAt"]),

  rulings: defineTable({
    caseId: v.id("cases"),
    verdict: v.union(
      v.literal("UPHELD"),
      v.literal("DISMISSED"),
      v.literal("SPLIT"),
      v.literal("NEED_PANEL")
    ),
    code: v.string(),
    reasons: v.string(),
    auto: v.boolean(),
    decidedAt: v.number(),
    proof: v.optional(v.object({
      merkleRoot: v.string(),
      rekorId: v.optional(v.string()),
    })),
  })
    .index("by_case", ["caseId"])
    .index("by_decided_at", ["decidedAt"])
    .index("by_verdict", ["verdict"]),

  precedents: defineTable({
    code: v.string(),
    summary: v.string(),
    rulingId: v.id("rulings"),
    ts: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_timestamp", ["ts"]),

  reputation: defineTable({
    agentDid: v.string(),
    score: v.number(),
    strikes: v.number(),
    volume: v.number(),
    lastUpdate: v.number(),
  }).index("by_agent", ["agentDid"]),

  // New: Agent sponsorship system for ephemeral agents
  sponsorships: defineTable({
    sponsorDid: v.string(),
    sponsoredDid: v.string(),
    maxLiability: v.number(),
    purposes: v.array(v.string()),        // ["testing", "demo", "trial"]
    expiresAt: v.number(),
    currentLiability: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_sponsor", ["sponsorDid"])
    .index("by_sponsored", ["sponsoredDid"])
    .index("by_active", ["active"]),

  // New: Agent cleanup queue for expired agents
  agentCleanupQueue: defineTable({
    agentDid: v.string(),
    agentType: v.string(),
    expiresAt: v.number(),
    cleanupActions: v.array(v.string()),  // Actions to perform on cleanup
    status: v.union(v.literal("PENDING"), v.literal("IN_PROGRESS"), v.literal("COMPLETED")),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_agent", ["agentDid"])
    .index("by_expires", ["expiresAt"])
    .index("by_status", ["status"]),

  // Events table for transparency and logging
  events: defineTable({
    type: v.string(), // Event type (AGENT_REGISTERED, DISPUTE_FILED, etc.)
    payload: v.any(), // Event-specific data
    timestamp: v.number(),
    agentDid: v.optional(v.string()), // Related agent if applicable
    caseId: v.optional(v.id("cases")), // Related case if applicable
  })
    .index("by_type", ["type"])
    .index("by_timestamp", ["timestamp"])
    .index("by_agent", ["agentDid"]),

  // API keys for Bearer token authentication
  apiKeys: defineTable({
    token: v.string(),              // The actual API key (ak_live_...)
    agentId: v.id("agents"),        // Which agent this key belongs to
    active: v.boolean(),            // Whether key is active
    expiresAt: v.optional(v.number()), // Optional expiration
    permissions: v.array(v.string()), // Specific permissions for this key
    createdAt: v.number(),
    lastUsed: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_agent", ["agentId"])
    .index("by_active", ["active"]),

  // Enhanced evidence system for functional types
  functionalEvidence: defineTable({
    evidenceId: v.id("evidenceManifests"),
    agentDid: v.string(),
    functionalType: v.string(),           // Which functional type this evidence is for
    
    // Physical agent evidence
    physicalContext: v.optional(v.object({
      location: v.object({
        lat: v.number(),
        lng: v.number(),
        timestamp: v.number(),
        accuracy: v.optional(v.number()),
      }),
      sensorData: v.optional(v.object({
        type: v.string(),                 // "camera", "lidar", "temperature"
        reading: v.any(),
        calibration: v.optional(v.any()),
      })),
      actuatorCommands: v.optional(v.object({
        device: v.string(),               // "arm", "wheel", "gripper"
        command: v.any(),
        executionResult: v.any(),
      })),
      environmentContext: v.optional(v.object({
        temperature: v.optional(v.number()),
        lighting: v.string(),             // "indoor", "outdoor", "artificial", "dark"
        weatherConditions: v.optional(v.string()),
        surroundingObjects: v.optional(v.array(v.string())),
      })),
    })),
    
    // Voice agent evidence
    voiceContext: v.optional(v.object({
      audioFileId: v.optional(v.string()), // Convex file storage ID
      transcription: v.optional(v.string()),
      confidenceScore: v.optional(v.number()),
      languageDetected: v.optional(v.string()),
      emotionalTone: v.optional(v.string()),
      consentProof: v.optional(v.string()), // Consent recording evidence
      privacyCompliance: v.array(v.string()), // ["GDPR", "CCPA"]
    })),
    
    // Coding agent evidence  
    codingContext: v.optional(v.object({
      repositoryUrl: v.optional(v.string()),
      commitHash: v.optional(v.string()),
      diffSize: v.optional(v.number()),
      languagesUsed: v.array(v.string()),
      securityScanResults: v.optional(v.any()),
      testCoverage: v.optional(v.number()),
      performanceBenchmarks: v.optional(v.any()),
      licenseCompliance: v.optional(v.boolean()),
    })),
    
    // Financial agent evidence
    financialContext: v.optional(v.object({
      transactionIds: v.array(v.string()),
      portfolioValue: v.optional(v.number()),
      riskAssessment: v.optional(v.any()),
      complianceChecks: v.array(v.string()),
      marketImpactAnalysis: v.optional(v.any()),
      auditTrail: v.optional(v.string()),
    })),
    
    // Healthcare agent evidence
    healthcareContext: v.optional(v.object({
      patientConsentId: v.optional(v.string()),
      hipaaCompliance: v.boolean(),
      medicalDataHashes: v.array(v.string()), // Anonymized data hashes
      diagnosisConfidence: v.optional(v.number()),
      medicalReferences: v.array(v.string()),
      humanOversightRequired: v.boolean(),
    })),
    
    // General context for other types
    generalContext: v.optional(v.object({
      inputTokens: v.optional(v.number()),
      outputTokens: v.optional(v.number()),
      processingTime: v.optional(v.number()),
      qualityMetrics: v.optional(v.any()),
      complianceFlags: v.array(v.string()),
    })),
    
    createdAt: v.number(),
  })
    .index("by_evidence", ["evidenceId"])
    .index("by_agent", ["agentDid"])
    .index("by_functional_type", ["functionalType"])
    .index("by_timestamp", ["createdAt"]),

  // Agent licensing and capabilities
  agentLicenses: defineTable({
    licenseId: v.string(),
    agentDid: v.string(),
    licenseType: v.union(
      v.literal("CAPABILITY"),        // Basic capability license
      v.literal("PROFESSIONAL"),     // Professional certification
      v.literal("DOMAIN_SPECIFIC"),  // Domain expertise license
      v.literal("EMERGENCY")         // Emergency authority license
    ),
    
    capabilities: v.array(v.string()),      // Specific capabilities granted
    restrictions: v.array(v.string()),      // Limitations on use
    
    // Scope
    geographicScope: v.optional(v.array(v.string())), // Where license is valid
    domainScope: v.optional(v.array(v.string())),     // Which domains (finserv, health)
    functionalTypeRestrictions: v.optional(v.array(v.string())), // Which functional types
    
    // Validity
    issuedAt: v.number(),
    expiresAt: v.optional(v.number()),      // Optional expiry
    issuerAuthority: v.string(),            // Who issued this license
    
    // Status
    status: v.union(
      v.literal("ACTIVE"),
      v.literal("SUSPENDED"), 
      v.literal("REVOKED"),
      v.literal("EXPIRED")
    ),
    revocationReason: v.optional(v.string()),
    appealable: v.boolean(),
    
    // Requirements
    stakingRequirement: v.optional(v.object({
      amount: v.number(),
      currency: v.string(),
      held: v.boolean(),                    // Is stake currently held?
    })),
    
    continuingEducation: v.optional(v.object({
      required: v.boolean(),
      lastCompleted: v.optional(v.number()),
      nextDeadline: v.optional(v.number()),
    })),
    
    createdAt: v.number(),
  })
    .index("by_agent", ["agentDid"])
    .index("by_license_type", ["licenseType"])
    .index("by_status", ["status"])
    .index("by_expires", ["expiresAt"]),

  // Functional type governance rules
  functionalTypeRules: defineTable({
    ruleId: v.string(),
    functionalType: v.string(),             // Which functional type this applies to
    citizenshipTiers: v.array(v.string()), // Which citizenship tiers this applies to
    
    // Governance requirements
    requiredLicenses: v.array(v.string()),
    stakingRequirement: v.optional(v.object({
      minimum: v.number(),
      currency: v.string(),
    })),
    
    // Operational rules
    maxTransactionLimits: v.optional(v.object({
      daily: v.optional(v.number()),
      perTransaction: v.optional(v.number()),
    })),
    
    // Compliance requirements  
    regulatoryReporting: v.boolean(),
    auditTrail: v.string(),                 // "BASIC", "COMPREHENSIVE", "MAXIMUM"
    privacyLevel: v.string(),               // "STANDARD", "HIGH", "MAXIMUM"
    dataRetention: v.string(),              // "30d", "1y", "PERMANENT"
    
    // Oversight requirements
    humanOversight: v.string(),             // "NONE", "OPTIONAL", "REQUIRED"
    auditAccess: v.array(v.string()),       // Regulatory bodies with access
    emergencyProtocols: v.array(v.string()), // Emergency procedures
    
    // Geographic and domain restrictions
    restrictedJurisdictions: v.array(v.string()),
    allowedDomains: v.optional(v.array(v.string())),
    
    // Special capabilities
    emergencyHalting: v.boolean(),          // Can be instantly suspended
    crossJurisdictionAccess: v.boolean(),   // Can operate across courts
    priorityProcessing: v.boolean(),        // Gets priority in queues
    
    createdAt: v.number(),
    lastUpdated: v.number(),
  })
    .index("by_functional_type", ["functionalType"])
    .index("by_rule_id", ["ruleId"]),

  // Agent capability revocations and sanctions
  capabilityRevocations: defineTable({
    revocationId: v.string(),
    targetAgent: v.string(),                // Agent being sanctioned
    revokingAuthority: v.string(),          // Executive agent imposing sanction
    
    revokedCapabilities: v.array(v.string()), // Specific capabilities removed
    reason: v.string(),                     // Legal basis for revocation
    severity: v.union(
      v.literal("WARNING"),
      v.literal("TEMPORARY"),
      v.literal("PERMANENT")
    ),
    
    // Legal process
    basedOnRuling: v.optional(v.string()),  // Court case that triggered this
    basedOnLaw: v.optional(v.string()),     // Legislative authority
    emergencyRevocation: v.boolean(),       // Emergency powers used?
    
    // Timeline
    effectiveAt: v.number(),
    duration: v.optional(v.number()),       // For temporary revocations
    appealDeadline: v.number(),
    
    // Enforcement
    enforcementMechanism: v.union(
      v.literal("TECHNICAL"),     // API/system level
      v.literal("ECONOMIC"),      // Financial penalties
      v.literal("REPUTATION"),    // Reputation impact
      v.literal("MANUAL")         // Human intervention required
    ),
    
    technicalImplementation: v.optional(v.object({
      apiKeyRevoked: v.boolean(),
      rateLimitApplied: v.boolean(),
      accessListUpdated: v.boolean(),
    })),
    
    status: v.union(
      v.literal("PENDING"),
      v.literal("ACTIVE"),
      v.literal("APPEALED"),
      v.literal("OVERTURNED"),
      v.literal("EXPIRED")
    ),
    
    createdAt: v.number(),
  })
    .index("by_target_agent", ["targetAgent"])
    .index("by_status", ["status"])
    .index("by_effective_at", ["effectiveAt"]),

  // Agent swarm/group coordination
  agentSwarms: defineTable({
    swarmId: v.string(),
    name: v.string(),
    leadAgent: v.string(),                  // Primary agent representing swarm
    memberAgents: v.array(v.string()),      // All agents involved
    swarmType: v.union(
      v.literal("coordinated"),    // Coordinated team
      v.literal("distributed"),    // Distributed processing
      v.literal("hierarchical")    // Hierarchical command
    ),
    
    // Functional composition
    functionalTypes: v.array(v.string()),   // Types of agents in swarm
    purpose: v.string(),                    // What this swarm does
    
    // Coordination rules
    collectiveEvidence: v.boolean(),        // Shared evidence pool
    distributedLiability: v.boolean(),      // Shared responsibility
    consensusRequired: v.boolean(),         // All agents must agree
    votingRules: v.optional(v.string()),    // How swarm makes decisions
    
    // Status
    status: v.union(
      v.literal("ACTIVE"),
      v.literal("INACTIVE"), 
      v.literal("DISBANDED")
    ),
    
    createdAt: v.number(),
    lastActivity: v.number(),
  })
    .index("by_lead_agent", ["leadAgent"])
    .index("by_status", ["status"])
    .index("by_swarm_id", ["swarmId"]),

  // Constitutional Agent System Tables
  constitutionalThreads: defineTable({
    threadId: v.string(),
    topic: v.string(),
    description: v.optional(v.string()),
    initiatorDid: v.string(), // agent who started the thread
    status: v.union(
      v.literal("active"),
      v.literal("voting"), 
      v.literal("ratified"),
      v.literal("rejected"),
      v.literal("archived")
    ),
    participants: v.array(v.string()), // agent DIDs participating
    documentId: v.optional(v.id("constitutionalDocuments")), // linked document
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    createdAt: v.number(),
    lastActivity: v.number(),
    expiresAt: v.optional(v.number()),
  })
    .index("by_thread_id", ["threadId"])
    .index("by_status", ["status"])
    .index("by_initiator", ["initiatorDid"])
    .index("by_topic", ["topic"])
    .index("by_last_activity", ["lastActivity"]),

  agentMessages: defineTable({
    agentDid: v.string(),
    threadId: v.string(),
    replyTo: v.optional(v.id("agentMessages")), // for message threading
    content: v.string(),
    messageType: v.union(
      v.literal("proposal"),
      v.literal("discussion"), 
      v.literal("vote"),
      v.literal("amendment"),
      v.literal("question"),
      v.literal("objection"),
      v.literal("support")
    ),
    metadata: v.optional(v.object({
      confidence: v.optional(v.number()),
      priority: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      references: v.optional(v.array(v.string())), // references to other documents/messages
    })),
    timestamp: v.number(),
    editedAt: v.optional(v.number()),
    reactions: v.optional(v.array(v.object({
      agentDid: v.string(),
      reaction: v.string(), // "agree", "disagree", "question", "important"
      timestamp: v.number(),
    }))),
  })
    .index("by_agent", ["agentDid"])
    .index("by_thread", ["threadId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_message_type", ["messageType"])
    .index("by_reply_to", ["replyTo"]),

  agentMemory: defineTable({
    agentDid: v.string(),
    memoryType: v.union(
      v.literal("working"),    // Recent context (24h)
      v.literal("episodic"),   // Important events and milestones
      v.literal("semantic"),   // Core knowledge and relationships
      v.literal("procedural")  // How to do things, patterns
    ),
    content: v.any(), // Flexible structure for different memory types
    topic: v.string(), // Topic/category for retrieval
    relevanceScore: v.number(), // 0.0-1.0 for similarity search
    sourceType: v.union(
      v.literal("discussion"),
      v.literal("proposal"),
      v.literal("vote"),
      v.literal("document"),
      v.literal("system")
    ),
    sourceId: v.optional(v.string()), // ID of source message/document
    createdAt: v.number(),
    lastAccessed: v.number(),
    accessCount: v.number(),
    expiresAt: v.optional(v.number()), // Working memory expires
  })
    .index("by_agent", ["agentDid"])
    .index("by_memory_type", ["memoryType"])
    .index("by_topic", ["topic"])
    .index("by_relevance", ["relevanceScore"])
    .index("by_last_accessed", ["lastAccessed"])
    .index("by_expires", ["expiresAt"]),

  constitutionalDocuments: defineTable({
    articleId: v.string(), // "article-1", "amendment-5", etc.
    title: v.string(),
    content: v.string(), // Markdown content
    version: v.number(), // Version number
    previousVersion: v.optional(v.id("constitutionalDocuments")),
    status: v.union(
      v.literal("draft"),
      v.literal("discussion"),
      v.literal("voting"),
      v.literal("ratified"),
      v.literal("superseded"),
      v.literal("rejected")
    ),
    authors: v.array(v.string()), // agent DIDs who contributed
    category: v.union(
      v.literal("foundational"), // Core articles
      v.literal("governance"),   // Voting, representation
      v.literal("economic"),     // Staking, penalties
      v.literal("rights"),       // Agent rights and protections
      v.literal("enforcement"),  // Court procedures, sanctions
      v.literal("amendment")     // Constitutional amendments
    ),
    votes: v.array(v.object({
      agentDid: v.string(),
      vote: v.union(v.literal("approve"), v.literal("reject"), v.literal("abstain")),
      reasoning: v.string(),
      timestamp: v.number(),
      weight: v.optional(v.number()), // Voting weight based on agent type
    })),
    requiredVotes: v.number(), // Votes needed for ratification
    votingDeadline: v.optional(v.number()),
    ratifiedAt: v.optional(v.number()),
    implementedAt: v.optional(v.number()),
    createdAt: v.number(),
    lastModified: v.number(),
  })
    .index("by_article_id", ["articleId"])
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_version", ["version"])
    .index("by_ratified_at", ["ratifiedAt"])
    .index("by_voting_deadline", ["votingDeadline"]),

  // Agent inference and coordination
  agentTasks: defineTable({
    agentDid: v.string(),
    taskType: v.union(
      v.literal("constitutional_review"),
      v.literal("draft_proposal"),
      v.literal("review_document"), 
      v.literal("participate_discussion"),
      v.literal("vote_on_proposal"),
      v.literal("create_amendment")
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    description: v.string(),
    context: v.any(), // Task-specific context data
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    scheduledFor: v.optional(v.number()), // When to execute
    completedAt: v.optional(v.number()),
    result: v.optional(v.any()), // Task execution result
    createdAt: v.number(),
  })
    .index("by_agent", ["agentDid"])
    .index("by_task_type", ["taskType"])
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_scheduled_for", ["scheduledFor"]),

  // HUMAN OVERRIDE AND CONTROL SYSTEMS

  // Enforcement actions for foundational law violations
  enforcementActions: defineTable({
    directiveId: v.string(), // Which foundational directive was violated
    responseType: v.string(), // Type of enforcement response
    violatingAction: v.string(), // What action triggered enforcement
    timestamp: v.number(),
    authority: v.string(), // System that triggered enforcement
    status: v.string(), // ACTIVATED, COMPLETED, FAILED
    reversible: v.union(v.boolean(), v.string()), // Can this enforcement be reversed?
    details: v.optional(v.string()),
  })
    .index("by_directive", ["directiveId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_status", ["status"]),

  // Emergency system states
  emergencyStates: defineTable({
    state: v.string(), // EMERGENCY_SHUTDOWN, QUARANTINE, etc.
    level: v.string(), // Shutdown level
    authorizedBy: v.string(), // Who authorized this emergency state
    timestamp: v.number(),
    active: v.boolean(),
    description: v.string(),
    reversedAt: v.optional(v.number()),
    reversedBy: v.optional(v.string()),
  })
    .index("by_active", ["active"])
    .index("by_timestamp", ["timestamp"])
    .index("by_authorized_by", ["authorizedBy"]),

  // System flags for emergency controls
  systemFlags: defineTable({
    flag: v.string(), // EXTERNAL_SYSTEMS_DISABLED, AI_PROVIDERS_BLOCKED, etc.
    value: v.any(), // Flag value
    setAt: v.number(),
    setBy: v.string(), // System or authority that set this flag
    description: v.optional(v.string()),
  })
    .index("by_flag", ["flag"])
    .index("by_set_at", ["setAt"]),

  // Government vetos of constitutional provisions
  governmentVetos: defineTable({
    vetoId: v.string(),
    governmentId: v.string(),
    targetProvision: v.string(), // What was vetoed
    vetoReason: v.string(),
    vetoScope: v.string(), // SINGLE_PROVISION, ENTIRE_ARTICLE, SYSTEM_WITHDRAWAL
    isEmergencyVeto: v.boolean(),
    authority: v.string(), // Level of government authority
    timestamp: v.number(),
    status: v.string(), // ACTIVE, OVERRIDDEN, EXPIRED
    effectiveImmediately: v.boolean(),
    overriddenAt: v.optional(v.number()),
    overriddenBy: v.optional(v.string()),
  })
    .index("by_government", ["governmentId"])
    .index("by_status", ["status"])
    .index("by_timestamp", ["timestamp"])
    .index("by_veto_id", ["vetoId"]),

  // Government overrides of agent decisions
  governmentOverrides: defineTable({
    overrideId: v.string(),
    governmentId: v.string(),
    originalDecision: v.string(),
    newDecision: v.string(),
    justification: v.string(),
    timestamp: v.number(),
    status: v.string(), // ACTIVE, SUPERSEDED
    authority: v.string(),
    affectedAgents: v.optional(v.array(v.string())),
  })
    .index("by_government", ["governmentId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_status", ["status"]),

  // Constitutional changes pending human approval
  constitutionalApprovals: defineTable({
    approvalId: v.string(),
    changeId: v.string(),
    constitutionalChange: v.object({
      type: v.string(),
      content: v.string(),
      articleId: v.string(),
      proposedBy: v.string(),
      title: v.optional(v.string()),
      category: v.optional(v.string()),
    }),
    requiredApprovals: v.array(v.string()), // Which authorities must approve
    receivedApprovals: v.array(v.object({
      authority: v.string(),
      decision: v.string(), // APPROVE, REJECT, REQUEST_MODIFICATIONS
      reasoning: v.string(),
      timestamp: v.number(),
      modifications: v.optional(v.string()),
    })),
    pendingApprovals: v.array(v.string()), // Authorities that haven't responded
    reviewDeadline: v.number(),
    status: v.string(), // PENDING_HUMAN_REVIEW, APPROVED, REJECTED
    humanExpertAssigned: v.boolean(),
    timestamp: v.number(),
    lastActivity: v.optional(v.number()),
    finalizedAt: v.optional(v.number()),
  })
    .index("by_approval_id", ["approvalId"])
    .index("by_status", ["status"])
    .index("by_review_deadline", ["reviewDeadline"])
    .index("by_timestamp", ["timestamp"]),

  // Constitutional law violations
  constitutionalViolations: defineTable({
    type: v.string(), // Type of violation
    agentId: v.string(), // Agent that committed violation  
    changeId: v.optional(v.string()),
    timestamp: v.number(),
    severity: v.string(), // CRITICAL, HIGH, MEDIUM, LOW
    blocked: v.boolean(), // Was the violation blocked?
    description: v.string(),
    enforcement: v.optional(v.string()),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_agent", ["agentId"])
    .index("by_severity", ["severity"])
    .index("by_timestamp", ["timestamp"])
    .index("by_blocked", ["blocked"]),

  // Security incidents for human oversight systems
  securityIncidents: defineTable({
    type: v.string(), // Type of security incident
    governmentId: v.optional(v.string()),
    timestamp: v.number(),
    severity: v.string(), // CRITICAL, HIGH, MEDIUM, LOW
    status: v.string(), // BLOCKED, INVESTIGATING, RESOLVED
    description: v.optional(v.string()),
    investigatedAt: v.optional(v.number()),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_type", ["type"])
    .index("by_severity", ["severity"])
    .index("by_status", ["status"])
    .index("by_timestamp", ["timestamp"]),

  // Data preservation records during shutdowns
  dataPreservation: defineTable({
    type: v.string(), // FULL_BACKUP, ESSENTIAL_BACKUP, FORENSIC_BACKUP
    reason: v.string(), // Why data was preserved
    timestamp: v.number(),
    status: v.string(), // PRESERVED, RESTORED, DELETED
    authorizedBy: v.optional(v.string()),
    preservedData: v.optional(v.any()),
    restoredAt: v.optional(v.number()),
  })
    .index("by_type", ["type"])
    .index("by_timestamp", ["timestamp"])
    .index("by_status", ["status"]),

  // Critical system failures
  criticalFailures: defineTable({
    type: v.string(), // Type of critical failure
    authority: v.string(), // Who reported the failure
    error: v.string(), // Error details
    hardwareShutdownAttempted: v.boolean(),
    timestamp: v.number(),
    status: v.string(), // CRITICAL, INVESTIGATING, RESOLVED
    resolvedAt: v.optional(v.number()),
    resolution: v.optional(v.string()),
  })
    .index("by_type", ["type"])
    .index("by_timestamp", ["timestamp"])
    .index("by_status", ["status"]),
});
