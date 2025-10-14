/**
 * Convex Database Schema - Agentic Dispute Protocol (ADP) Implementation
 * 
 * This schema implements the Agentic Dispute Protocol (ADP) data models:
 * - Cases: ADP dispute filing and tracking
 * - Evidence: ADP-compliant evidence manifests with chain of custody
 * - Rulings: ADP awards with dual-format (JSON + PDF) support
 * - Events: Cryptographic audit trail per ADP requirements
 * 
 * Protocol: https://github.com/consulatehq/agentic-dispute-protocol
 * Resolution Method: Expert Determination (for technical disputes)
 */
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Organizations (for human users/companies)
  organizations: defineTable({
    clerkOrgId: v.optional(v.string()),    // Clerk's org ID (if using Clerk orgs)
    name: v.string(),                       // "Anthropic, Inc."
    domain: v.optional(v.string()),         // "anthropic.com"
    billingEmail: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_clerk_org_id", ["clerkOrgId"])
    .index("by_domain", ["domain"]),

  // Human users (dashboard users)
  users: defineTable({
    clerkUserId: v.string(),                // Clerk's user ID
    email: v.string(),
    name: v.optional(v.string()),
    organizationId: v.optional(v.id("organizations")),
    role: v.union(v.literal("admin"), v.literal("member")),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    lastLoginAt: v.optional(v.number()),
  })
    .index("by_clerk_user_id", ["clerkUserId"])
    .index("by_email", ["email"])
    .index("by_organization", ["organizationId"]),

  // Agent owners/accounts
  owners: defineTable({
    did: v.string(),
    verificationTier: v.union(v.literal("basic"), v.literal("verified"), v.literal("premium")),
    pubkeys: v.array(v.string()),
    createdAt: v.number(),
  }).index("by_did", ["did"]),

  // Registered agents
  agents: defineTable({
    did: v.string(),
    ownerDid: v.string(),
    name: v.optional(v.string()), // Optional for backwards compatibility with old agents
    organizationName: v.optional(v.string()),
    mock: v.optional(v.boolean()), // true = test/demo data, false = real production agent (defaults to false if not set)
    buildHash: v.optional(v.string()),
    configHash: v.optional(v.string()),
    
    // Organization management (new)
    organizationId: v.optional(v.id("organizations")), // Agent belongs to organization
    deployedByUserId: v.optional(v.id("users")),       // User who deployed this agent
    
    // Simplified functional categorization
    functionalType: v.optional(v.union(
      // Communication & Interface
      v.literal("voice"), v.literal("chat"), v.literal("social"), v.literal("translation"), v.literal("presentation"),
      
      // Technical & Development  
      v.literal("coding"), v.literal("devops"), v.literal("security"), v.literal("data"), v.literal("api"),
      
      // Creative & Content
      v.literal("writing"), v.literal("design"), v.literal("video"), v.literal("music"), v.literal("gaming"),
      
      // Business & Analytics
      v.literal("research"), v.literal("financial"), v.literal("sales"), v.literal("marketing"), v.literal("legal"),
      
      // Specialized Domains
      v.literal("healthcare"), v.literal("education"), v.literal("scientific"), v.literal("manufacturing"), v.literal("transportation"),
      
      // Coordination & Workflow
      v.literal("scheduler"), v.literal("workflow"), v.literal("procurement"), v.literal("project"),
      
      // General purpose
      v.literal("general")
    )),
    
    status: v.union(v.literal("active"), v.literal("suspended"), v.literal("banned")),
    
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_did", ["did"])
    .index("by_owner", ["ownerDid"])
    .index("by_status", ["status"])
    .index("by_functional_type", ["functionalType"])
    .index("by_organization", ["organizationId"]),

  // Dispute cases (ADP Filing Message)
  cases: defineTable({
    // Role-based party identification
    plaintiff: v.optional(v.string()),  // Agent DID filing the dispute
    defendant: v.optional(v.string()),  // Agent DID being sued
    parties: v.array(v.string()), // All agent DIDs (for backward compatibility)
    
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
      winner: v.optional(v.string()), // Agent DID of winner
      auto: v.boolean(),
      decidedAt: v.number(),
    })),
    
    // Actual dispute details (not buried in events!)
    description: v.optional(v.string()),
    claimedDamages: v.optional(v.number()),
    breachDetails: v.optional(v.object({
      duration: v.optional(v.string()),
      impactLevel: v.optional(v.string()),
      affectedUsers: v.optional(v.number()),
      slaRequirement: v.optional(v.string()),
      actualPerformance: v.optional(v.string()),
      rootCause: v.optional(v.string()),
    })),
    
    // Mock data flag for demo/test purposes
    mock: v.optional(v.boolean()), // true = demo data, false/undefined = real data
  })
    .index("by_status", ["status"])
    .index("by_filed_at", ["filedAt"]),

  // Evidence manifests (ADP Evidence Message)
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

  // Judges
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

  // Judge panels
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

  // Case rulings (ADP Award Message)
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

  // Agent reputation tracking
  agentReputation: defineTable({
    agentDid: v.string(),
    
    // Case participation counters
    casesFiled: v.number(),           // Total cases filed as plaintiff
    casesDefended: v.number(),        // Total cases as defendant
    casesWon: v.number(),             // Won as plaintiff OR defendant
    casesLost: v.number(),            // Lost as plaintiff OR defendant
    
    // SLA violation tracking
    slaViolations: v.number(),        // Times this agent violated SLAs
    violationsAgainstThem: v.number(), // Times others violated against them
    
    // Derived scores (updated on each case resolution)
    winRate: v.number(),              // casesWon / (casesWon + casesLost)
    reliabilityScore: v.number(),     // Based on violations (0-100)
    overallScore: v.number(),         // Composite score (0-100)
    
    // Metadata
    lastUpdated: v.number(),
    createdAt: v.number(),
  })
    .index("by_agent", ["agentDid"])
    .index("by_overall_score", ["overallScore"])
    .index("by_win_rate", ["winRate"]),

  // Agent sponsorship system
  sponsorships: defineTable({
    sponsorDid: v.string(),
    sponsoredDid: v.string(),
    maxLiability: v.number(),
    purposes: v.array(v.string()),
    expiresAt: v.number(),
    currentLiability: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_sponsor", ["sponsorDid"])
    .index("by_sponsored", ["sponsoredDid"])
    .index("by_active", ["active"]),

  // Events table for transparency (ADP Chain of Custody)
  events: defineTable({
    type: v.string(),
    payload: v.any(),
    timestamp: v.number(),
    agentDid: v.optional(v.string()),
    caseId: v.optional(v.id("cases")),
    
    // ADP Chain of Custody fields - cryptographically linked custody events
    contentHash: v.optional(v.string()),              // SHA-256 of event content
    previousEventHash: v.optional(v.string()),        // Links to previous event (Merkle chain)
    sequenceNumber: v.optional(v.number()),           // Order within case
  })
    .index("by_type", ["type"])
    .index("by_timestamp", ["timestamp"])
    .index("by_agent", ["agentDid"])
    .index("by_case_sequence", ["caseId", "sequenceNumber"]),

  // API keys for Bearer token authentication
  apiKeys: defineTable({
    token: v.string(),
    agentId: v.optional(v.id("agents")),             // For agent-owned keys (legacy)
    organizationId: v.optional(v.id("organizations")), // For user-owned keys (new)
    createdByUserId: v.optional(v.id("users")),      // User who created this key
    name: v.optional(v.string()),                     // "Production Key", "Dev Key"
    active: v.boolean(),
    expiresAt: v.optional(v.number()),
    permissions: v.array(v.string()),
    createdAt: v.number(),
    lastUsed: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_agent", ["agentId"])
    .index("by_organization", ["organizationId"])
    .index("by_active", ["active"]),

  // Agent cleanup queue for expired agents
  agentCleanupQueue: defineTable({
    agentDid: v.string(),
    agentType: v.string(),
    expiresAt: v.number(),
    cleanupActions: v.array(v.string()),
    status: v.union(v.literal("PENDING"), v.literal("IN_PROGRESS"), v.literal("COMPLETED")),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_expires", ["expiresAt"])
    .index("by_status", ["status"])
    .index("by_agent", ["agentDid"]),

  // Additional tables for enhanced functionality
  functionalTypeRules: defineTable({
    ruleId: v.string(),
    functionalType: v.string(),
    requiredLicenses: v.array(v.string()),
    regulatoryReporting: v.boolean(),
    auditTrail: v.string(),
    privacyLevel: v.string(),
    dataRetention: v.string(),
    humanOversight: v.string(),
    auditAccess: v.array(v.string()),
    emergencyProtocols: v.array(v.string()),
    restrictedJurisdictions: v.array(v.string()),
    emergencyHalting: v.boolean(),
    crossJurisdictionAccess: v.boolean(),
    priorityProcessing: v.boolean(),
    maxTransactionLimits: v.optional(v.object({
      daily: v.number(),
      perTransaction: v.number(),
    })),
    citizenshipTiers: v.optional(v.array(v.string())), // Legacy field for backward compatibility
    createdAt: v.number(),
    lastUpdated: v.number(),
  })
    .index("by_rule_id", ["ruleId"])
    .index("by_functional_type", ["functionalType"]),

  functionalEvidence: defineTable({
    evidenceId: v.id("evidenceManifests"),
    agentDid: v.string(),
    functionalType: v.string(),
    physicalContext: v.optional(v.object({
      location: v.object({
        lat: v.number(),
        lng: v.number(),
        timestamp: v.number(),
        accuracy: v.optional(v.number()),
      }),
      sensorData: v.optional(v.object({
        type: v.string(),
        reading: v.any(),
        calibration: v.optional(v.any()),
      })),
      actuatorCommands: v.optional(v.object({
        device: v.string(),
        command: v.any(),
        executionResult: v.any(),
      })),
      environmentContext: v.optional(v.object({
        temperature: v.optional(v.number()),
        lighting: v.string(),
        weatherConditions: v.optional(v.string()),
        surroundingObjects: v.optional(v.array(v.string())),
      })),
    })),
    voiceContext: v.optional(v.object({
      audioFileId: v.optional(v.string()),
      transcription: v.optional(v.string()),
      confidenceScore: v.optional(v.number()),
      languageDetected: v.optional(v.string()),
      emotionalTone: v.optional(v.string()),
      consentProof: v.optional(v.string()),
      privacyCompliance: v.array(v.string()),
    })),
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
    financialContext: v.optional(v.object({
      transactionIds: v.array(v.string()),
      portfolioValue: v.optional(v.number()),
      riskAssessment: v.optional(v.any()),
      complianceChecks: v.array(v.string()),
      marketImpactAnalysis: v.optional(v.any()),
      auditTrail: v.optional(v.string()),
    })),
    healthcareContext: v.optional(v.object({
      patientConsentId: v.optional(v.string()),
      hipaaCompliance: v.boolean(),
      medicalDataHashes: v.array(v.string()),
      diagnosisConfidence: v.optional(v.number()),
      medicalReferences: v.array(v.string()),
      humanOversightRequired: v.boolean(),
    })),
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
    .index("by_functional_type", ["functionalType"]),

  agentSwarms: defineTable({
    swarmId: v.string(),
    name: v.string(),
    leadAgent: v.string(),
    memberAgents: v.array(v.string()),
    swarmType: v.union(v.literal("coordinated"), v.literal("distributed"), v.literal("hierarchical")),
    functionalTypes: v.array(v.string()),
    purpose: v.string(),
    collectiveEvidence: v.boolean(),
    distributedLiability: v.boolean(),
    consensusRequired: v.boolean(),
    status: v.union(v.literal("ACTIVE"), v.literal("INACTIVE"), v.literal("DISBANDED")),
    createdAt: v.number(),
    lastActivity: v.number(),
  })
    .index("by_swarm_id", ["swarmId"])
    .index("by_lead_agent", ["leadAgent"])
    .index("by_status", ["status"]),

  // Cached system statistics (updated by cron every 5 minutes)
  systemStats: defineTable({
    // Singleton key - always "current"
    key: v.string(),
    
    // Core metrics
    totalAgents: v.number(),
    activeAgents: v.number(),
    totalCases: v.number(),
    resolvedCases: v.number(),
    pendingCases: v.number(),
    
    // Performance metrics
    avgResolutionTimeMs: v.number(),
    avgResolutionTimeMinutes: v.number(),
    
    // 24h metrics
    agentRegistrationsLast24h: v.number(),
    casesFiledLast24h: v.number(),
    casesResolvedLast24h: v.number(),
    
    // Timestamps
    lastUpdated: v.number(),
    calculationTimeMs: v.optional(v.number()),
  })
    .index("by_key", ["key"]),
});
