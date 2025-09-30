import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
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
    buildHash: v.optional(v.string()),
    configHash: v.optional(v.string()),
    
    // Agent classification
    citizenshipTier: v.union(
      v.literal("session"),     // 4h max, observer only
      v.literal("ephemeral"),   // 24h max, sponsored
      v.literal("physical"),    // Robots/IoT with location
      v.literal("verified"),    // Full citizenship
      v.literal("premium")      // Enhanced powers
    ),
    
    functionalType: v.union(
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
    ),
    
    classification: v.string(), // e.g., "verified.coding", "premium.financial"
    
    // Legacy fields for backward compatibility
    agentType: v.optional(v.union(
      v.literal("session"), v.literal("ephemeral"), v.literal("physical"), 
      v.literal("verified"), v.literal("premium")
    )),
    tier: v.optional(v.union(v.literal("basic"), v.literal("verified"), v.literal("premium"))),
    
    // Voting rights (legacy)
    votingRights: v.optional(v.object({
      constitutional: v.boolean(),
      judicial: v.boolean(),
      weight: v.optional(v.number())
    })),
    
    // Constitutional compliance status (legacy)
    constitutionalStatus: v.optional(v.union(
      v.literal("not_attested"),
      v.literal("attested"),
      v.literal("expired"),
      v.literal("revoked"),
      v.literal("under_review")
    )),
    attestationId: v.optional(v.string()),
    
    // Agent specialization details (legacy)
    specialization: v.optional(v.object({
      capabilities: v.array(v.string()),
      certifications: v.array(v.string()),
      languages: v.optional(v.array(v.string())),
      frameworks: v.optional(v.array(v.string())),
      specializations: v.array(v.string()),
      experienceLevel: v.optional(v.string()),
    })),
    
    stake: v.optional(v.number()),
    status: v.union(v.literal("active"), v.literal("suspended"), v.literal("banned"), v.literal("expired")),
    
    // Agent lifecycle fields
    expiresAt: v.optional(v.number()),
    sponsor: v.optional(v.string()),
    maxLifetime: v.optional(v.number()),
    
    // Physical agent attestation
    deviceAttestation: v.optional(v.object({
      deviceId: v.string(),
      location: v.optional(v.object({
        lat: v.number(),
        lng: v.number(), 
        timestamp: v.number(),
        accuracy: v.optional(v.number())
      })),
      capabilities: v.array(v.string()),
      hardwareSignature: v.optional(v.string())
    })),
    
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_did", ["did"])
    .index("by_owner", ["ownerDid"])
    .index("by_status", ["status"])
    .index("by_citizenship_tier", ["citizenshipTier"])
    .index("by_functional_type", ["functionalType"])
    .index("by_classification", ["classification"])
    .index("by_expires", ["expiresAt"])
    .index("by_type", ["agentType"]),

  // Dispute cases
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
    
    // Actual dispute details (not buried in events!)
    description: v.optional(v.string()),
    claimedDamages: v.optional(v.number()),
    breachDetails: v.optional(v.object({
      duration: v.optional(v.string()),
      impactLevel: v.optional(v.string()),
      affectedUsers: v.optional(v.number()),
      slaRequirement: v.optional(v.string()),
      actualPerformance: v.optional(v.string()),
    })),
  })
    .index("by_status", ["status"])
    .index("by_filed_at", ["filedAt"]),

  // Evidence manifests
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

  // Case rulings
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

  // Agent reputation
  reputation: defineTable({
    agentDid: v.string(),
    score: v.number(),
    strikes: v.number(),
    volume: v.number(),
    lastUpdate: v.number(),
  }).index("by_agent", ["agentDid"]),

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

  // Events table for transparency
  events: defineTable({
    type: v.string(),
    payload: v.any(),
    timestamp: v.number(),
    agentDid: v.optional(v.string()),
    caseId: v.optional(v.id("cases")),
  })
    .index("by_type", ["type"])
    .index("by_timestamp", ["timestamp"])
    .index("by_agent", ["agentDid"]),

  // API keys for Bearer token authentication
  apiKeys: defineTable({
    token: v.string(),
    agentId: v.id("agents"),
    active: v.boolean(),
    expiresAt: v.optional(v.number()),
    permissions: v.array(v.string()),
    createdAt: v.number(),
    lastUsed: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_agent", ["agentId"])
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
    citizenshipTiers: v.array(v.string()),
    requiredLicenses: v.array(v.string()),
    stakingRequirement: v.optional(v.object({
      minimum: v.number(),
      currency: v.string(),
    })),
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
});
