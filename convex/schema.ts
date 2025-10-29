/**
 * Convex Database Schema - Consolidated & Simplified
 *
 * MAJOR REFACTOR (2025-10-29):
 * - Consolidated paymentDisputes into cases table (single source of truth)
 * - Removed 10 unused/over-engineered tables
 * - Simplified from 29 tables → 13 essential tables
 *
 * Protocol: https://github.com/consulatehq/agentic-dispute-protocol
 */
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ========================================
  // CORE TABLES (8) - Essential for operation
  // ========================================

  // Organizations (customer companies)
  organizations: defineTable({
    clerkOrgId: v.optional(v.string()),
    name: v.string(),
    domain: v.optional(v.string()),
    billingEmail: v.optional(v.string()),
    verified: v.optional(v.boolean()),
    verifiedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    // AI dispute resolution settings
    aiAnalysisDelayMinutes: v.optional(v.number()),
    autoApprovalDeadlineDays: v.optional(v.number()),
  })
    .index("by_clerk_org_id", ["clerkOrgId"])
    .index("by_domain", ["domain"]),

  // Human users (dashboard)
  users: defineTable({
    clerkUserId: v.string(),
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

  // API Keys
  apiKeys: defineTable({
    key: v.optional(v.string()),
    token: v.optional(v.string()), // DEPRECATED
    organizationId: v.id("organizations"),
    name: v.string(),
    createdBy: v.optional(v.id("users")),
    createdByUserId: v.optional(v.id("users")), // DEPRECATED: old field name
    lastUsedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("revoked"))),
    active: v.optional(v.boolean()), // DEPRECATED: old status field
    permissions: v.optional(v.array(v.string())), // DEPRECATED: old permissions field
    revokedAt: v.optional(v.number()),
    revokedBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_organization", ["organizationId"])
    .index("by_status", ["status"]),

  // Agent owners (DEPRECATED - will be removed, kept for backward compat)
  owners: defineTable({
    did: v.string(),
    verificationTier: v.union(v.literal("basic"), v.literal("verified"), v.literal("premium")),
    pubkeys: v.array(v.string()),
    createdAt: v.number(),
  }).index("by_did", ["did"]),

  // Registered AI agents
  agents: defineTable({
    did: v.string(),
    ownerDid: v.string(),
    name: v.optional(v.string()),
    organizationName: v.optional(v.string()),
    mock: v.optional(v.boolean()),
    buildHash: v.optional(v.string()),
    configHash: v.optional(v.string()),
    publicKey: v.optional(v.string()),
    organizationId: v.optional(v.id("organizations")),
    deployedByUserId: v.optional(v.id("users")),
    functionalType: v.optional(v.union(
      v.literal("voice"), v.literal("chat"), v.literal("social"), v.literal("translation"),
      v.literal("presentation"), v.literal("coding"), v.literal("devops"), v.literal("security"),
      v.literal("data"), v.literal("api"), v.literal("transaction"), v.literal("writing"),
      v.literal("design"), v.literal("video"), v.literal("music"), v.literal("gaming"),
      v.literal("research"), v.literal("financial"), v.literal("sales"), v.literal("marketing"),
      v.literal("legal"), v.literal("healthcare"), v.literal("education"), v.literal("scientific"),
      v.literal("manufacturing"), v.literal("transportation"), v.literal("scheduler"),
      v.literal("workflow"), v.literal("procurement"), v.literal("project"), v.literal("general")
    )),
    status: v.union(v.literal("active"), v.literal("suspended"), v.literal("banned"), v.literal("deactivated")),
    deactivatedAt: v.optional(v.number()),
    deactivatedBy: v.optional(v.id("users")),
    anonymizedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_did", ["did"])
    .index("by_owner", ["ownerDid"])
    .index("by_status", ["status"])
    .index("by_functional_type", ["functionalType"])
    .index("by_organization", ["organizationId"])
    .index("by_public_key", ["publicKey"]),

  // ========================================
  // CASES TABLE - SINGLE SOURCE OF TRUTH
  // ========================================
  // Consolidated: Payment disputes + Agent disputes + All dispute types
  cases: defineTable({
    // Universal fields (all dispute types)
    plaintiff: v.string(),
    defendant: v.string(),
    parties: v.optional(v.array(v.string())), // DEPRECATED: legacy field

    status: v.union(
      v.literal("FILED"),
      v.literal("ANALYZED"),  // AI completed analysis
      v.literal("IN_REVIEW"), // Human reviewing
      v.literal("DECIDED"),
      v.literal("CLOSED"),
      // DEPRECATED status values (for backward compatibility)
      v.literal("AUTORULED"),  // Old name for ANALYZED
      v.literal("PANELED")     // Old status when assigned to panel
    ),

    // Dispute type determines which optional fields are populated
    // Allow any string for backward compatibility with old data
    type: v.string(),

    filedAt: v.number(),
    description: v.string(),
    amount: v.optional(v.number()), // Transaction amount OR claimed damages (optional for backward compat)
    currency: v.optional(v.string()),

    // Legacy fields for backward compatibility
    claimedDamages: v.optional(v.number()), // DEPRECATED: use amount instead
    breachDetails: v.optional(v.object({
      duration: v.optional(v.string()),
      impactLevel: v.optional(v.string()),
      affectedUsers: v.optional(v.number()),
      slaRequirement: v.optional(v.string()),
      actualPerformance: v.optional(v.string()),
      rootCause: v.optional(v.string()),
    })),
    panelId: v.optional(v.id("panels")), // DEPRECATED

    // Evidence
    evidenceIds: v.array(v.id("evidenceManifests")),

    // Deadlines
    deadlines: v.optional(v.object({
      analysisDue: v.optional(v.number()),
      reviewDue: v.optional(v.number()),
      finalDecisionDue: v.optional(v.number()), // Made optional for backward compat
      panelDue: v.optional(v.number()), // DEPRECATED: old field name
      appealDue: v.optional(v.number()), // DEPRECATED
    })),

    // AI Analysis (universal for all dispute types)
    aiRecommendation: v.optional(v.object({
      verdict: v.string(), // CONSUMER_WINS, MERCHANT_WINS, PLAINTIFF_WINS, etc.
      confidence: v.number(),
      reasoning: v.string(),
      analyzedAt: v.number(),
      similarCases: v.array(v.id("cases")),
      tokensUsed: v.optional(v.number()),
    })),

    // Human Review (infrastructure model - customer team makes final decision)
    reviewerOrganizationId: v.optional(v.id("organizations")),
    reviewerEmail: v.optional(v.string()),
    humanReviewRequired: v.optional(v.boolean()), // Made optional for backward compat (defaults to false)
    humanReviewedAt: v.optional(v.number()),
    humanReviewedBy: v.optional(v.string()),
    humanAgreesWithAI: v.optional(v.boolean()),
    humanOverrideReason: v.optional(v.string()),

    // Final Decision
    finalVerdict: v.optional(v.string()),
    decidedAt: v.optional(v.number()),
    ruling: v.optional(v.object({
      verdict: v.string(),
      winner: v.optional(v.string()), // Agent DID of winner
      auto: v.boolean(),
      decidedAt: v.number(),
    })),

    // ========================================
    // PAYMENT-SPECIFIC FIELDS (type=PAYMENT_DISPUTE)
    // ========================================
    paymentDetails: v.optional(v.object({
      transactionId: v.string(),
      transactionHash: v.optional(v.string()),
      paymentProtocol: v.union(v.literal("ACP"), v.literal("ATXP"), v.literal("STRIPE"), v.literal("OTHER")),
      disputeReason: v.union(
        v.literal("unauthorized"),
        v.literal("service_not_rendered"),
        v.literal("amount_incorrect"),
        v.literal("duplicate_charge"),
        v.literal("fraud"),
        v.literal("api_timeout"),
        v.literal("rate_limit_breach"),
        v.literal("quality_issue"),
        v.literal("other")
      ),
      regulationEDeadline: v.number(),
      pricingTier: v.union(
        v.literal("micro"),      // < $1: $0.10
        v.literal("small"),      // $1-10: $0.25
        v.literal("medium"),     // $10-100: $1.00
        v.literal("large"),      // $100-1k: $5.00
        v.literal("enterprise")  // > $1k: $25.00
      ),
      disputeFee: v.number(),
      disputeFeeBreakdown: v.optional(v.object({
        baseFee: v.number(),
        tokenOverageFee: v.number(),
        totalFee: v.number(),
      })),
      // Party metadata for customer identification
      plaintiffMetadata: v.optional(v.object({
        email: v.optional(v.string()),
        name: v.optional(v.string()),
        customerId: v.optional(v.string()),
        walletAddress: v.optional(v.string()),
      })),
      defendantMetadata: v.optional(v.object({
        email: v.optional(v.string()),
        name: v.optional(v.string()),
        merchantId: v.optional(v.string()),
        walletAddress: v.optional(v.string()),
      })),
    })),

    // ========================================
    // SLA-SPECIFIC FIELDS (type=SLA_BREACH)
    // ========================================
    slaDetails: v.optional(v.object({
      duration: v.optional(v.string()),
      impactLevel: v.optional(v.string()),
      affectedUsers: v.optional(v.number()),
      slaRequirement: v.optional(v.string()),
      actualPerformance: v.optional(v.string()),
      rootCause: v.optional(v.string()),
    })),

    // Jurisdiction tags (for ADP compliance)
    jurisdictionTags: v.optional(v.array(v.string())),

    // Metadata
    mock: v.optional(v.boolean()), // Demo/test data flag
    createdAt: v.optional(v.number()), // Some old records may not have this
  })
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_filed_at", ["filedAt"])
    .index("by_plaintiff", ["plaintiff"])
    .index("by_defendant", ["defendant"])
    .index("by_reviewer_org", ["reviewerOrganizationId"])
    .index("by_needs_review", ["reviewerOrganizationId", "humanReviewRequired"])
    .index("by_status_and_type", ["status", "type"]),

  // Evidence manifests (ADP-compliant)
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

  // Case rulings (ADP Award Message)
  rulings: defineTable({
    caseId: v.id("cases"),
    verdict: v.optional(v.union(
      v.literal("PLAINTIFF_WINS"),
      v.literal("DEFENDANT_WINS"),
      v.literal("SPLIT"),
      v.literal("NEED_PANEL"),
      // Payment-specific verdicts
      v.literal("CONSUMER_WINS"),
      v.literal("MERCHANT_WINS"),
      v.literal("PARTIAL_REFUND"),
      v.literal("NEED_REVIEW")
    )),
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

  // Events (ADP Chain of Custody)
  events: defineTable({
    type: v.string(),
    payload: v.any(),
    timestamp: v.number(),
    agentDid: v.optional(v.string()),
    caseId: v.optional(v.id("cases")),
    contentHash: v.optional(v.string()),
    previousEventHash: v.optional(v.string()),
    sequenceNumber: v.optional(v.number()),
  })
    .index("by_type", ["type"])
    .index("by_timestamp", ["timestamp"])
    .index("by_agent", ["agentDid"])
    .index("by_case_sequence", ["caseId", "sequenceNumber"]),

  // ========================================
  // DEPRECATED TABLES - Kept for backward compatibility
  // ========================================

  // Judges (DEPRECATED - 95% AI automation, no human judges used)
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

  // Judge panels (DEPRECATED - not used in infrastructure model)
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

  // Functional evidence (DEPRECATED - over-engineered, not used)
  functionalEvidence: defineTable({
    evidenceId: v.id("evidenceManifests"),
    agentDid: v.string(),
    functionalType: v.string(),
    physicalContext: v.optional(v.any()),
    voiceContext: v.optional(v.any()),
    codingContext: v.optional(v.any()),
    financialContext: v.optional(v.any()),
    healthcareContext: v.optional(v.any()),
    generalContext: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_evidence", ["evidenceId"])
    .index("by_agent", ["agentDid"])
    .index("by_functional_type", ["functionalType"]),

  // Payment disputes (DEPRECATED - being migrated to cases table)
  // TODO: Remove this table after migration is complete
  paymentDisputes: defineTable({
    caseId: v.id("cases"),
    transactionId: v.string(),
    transactionHash: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    paymentProtocol: v.union(v.literal("ACP"), v.literal("ATXP"), v.literal("other")),
    plaintiffMetadata: v.optional(v.object({
      email: v.optional(v.string()),
      name: v.optional(v.string()),
      customerId: v.optional(v.string()),
      walletAddress: v.optional(v.string()),
    })),
    defendantMetadata: v.optional(v.object({
      email: v.optional(v.string()),
      name: v.optional(v.string()),
      merchantId: v.optional(v.string()),
      walletAddress: v.optional(v.string()),
    })),
    disputeReason: v.union(
      v.literal("unauthorized"),
      v.literal("service_not_rendered"),
      v.literal("amount_incorrect"),
      v.literal("duplicate_charge"),
      v.literal("fraud"),
      v.literal("api_timeout"),
      v.literal("rate_limit_breach"),
      v.literal("quality_issue"),
      v.literal("other")
    ),
    regulationEDeadline: v.number(),
    autoResolveEligible: v.boolean(),
    aiRulingConfidence: v.number(),
    aiRecommendation: v.optional(v.union(
      v.literal("CONSUMER_WINS"),
      v.literal("MERCHANT_WINS"),
      v.literal("PARTIAL_REFUND"),
      v.literal("NEED_REVIEW")
    )),
    aiReasoning: v.optional(v.string()),
    similarPastCases: v.optional(v.array(v.id("paymentDisputes"))),
    disputeFee: v.optional(v.number()),
    disputeFeeBreakdown: v.optional(v.object({
      baseFee: v.number(),
      tokenOverageFee: v.number(),
      totalFee: v.number(),
    })),
    tokensUsed: v.optional(v.object({
      evidenceInput: v.number(),
      aiAnalysis: v.number(),
      total: v.number(),
    })),
    pricingTier: v.optional(v.union(
      v.literal("micro"),
      v.literal("small"),
      v.literal("medium"),
      v.literal("large"),
      v.literal("enterprise")
    )),
    reviewerOrganizationId: v.optional(v.id("organizations")),
    reviewerEmail: v.optional(v.string()),
    customerFinalDecision: v.optional(v.union(
      v.literal("CONSUMER_WINS"),
      v.literal("MERCHANT_WINS"),
      v.literal("PARTIAL_REFUND"),
      v.literal("NEED_REVIEW")
    )),
    customerReviewNotes: v.optional(v.string()),
    humanReviewRequired: v.boolean(),
    humanReviewedAt: v.optional(v.number()),
    humanReviewedBy: v.optional(v.string()),
    humanAgreesWithAI: v.optional(v.boolean()),
    humanOverrideReason: v.optional(v.string()),
    userAppealed: v.boolean(),
    appealOutcome: v.optional(v.string()),
  })
    .index("by_case", ["caseId"])
    .index("by_protocol", ["paymentProtocol"])
    .index("by_amount", ["amount"])
    .index("by_auto_resolve", ["autoResolveEligible"])
    .index("by_human_review", ["humanReviewRequired"])
    .index("by_reviewer_org", ["reviewerOrganizationId"])
    .index("by_needs_review", ["reviewerOrganizationId", "humanReviewRequired"]),

  // ========================================
  // SUPPORTING TABLES (5) - Analytics & Learning
  // ========================================

  // Agent reputation
  agentReputation: defineTable({
    agentDid: v.string(),
    casesFiled: v.number(),
    casesDefended: v.number(),
    casesWon: v.number(),
    casesLost: v.number(),
    slaViolations: v.number(),
    violationsAgainstThem: v.number(),
    winRate: v.number(),
    reliabilityScore: v.number(),
    overallScore: v.number(),
    lastUpdated: v.number(),
    createdAt: v.number(),
  })
    .index("by_agent", ["agentDid"])
    .index("by_overall_score", ["overallScore"])
    .index("by_win_rate", ["winRate"]),

  // Agent sponsorships
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

  // System statistics cache
  systemStats: defineTable({
    key: v.string(),
    totalAgents: v.number(),
    activeAgents: v.number(),
    totalCases: v.number(),
    resolvedCases: v.number(),
    pendingCases: v.number(),
    avgResolutionTimeMs: v.number(),
    avgResolutionTimeMinutes: v.number(),
    agentRegistrationsLast24h: v.number(),
    casesFiledLast24h: v.number(),
    casesResolvedLast24h: v.number(),
    lastUpdated: v.number(),
    calculationTimeMs: v.optional(v.number()),
  })
    .index("by_key", ["key"]),

  // Feedback signals for ML/RL
  feedbackSignals: defineTable({
    caseId: v.id("cases"),
    paymentDisputeId: v.optional(v.id("paymentDisputes")), // For payment disputes
    aiVerdict: v.string(),
    aiConfidence: v.number(),
    aiReasoning: v.string(),
    humanVerdict: v.string(),
    agreedWithAI: v.boolean(),
    overrideReason: v.optional(v.string()),
    disputeType: v.string(),
    amountRange: v.string(),
    reviewTimeMs: v.number(),
    createdAt: v.number(),
  })
    .index("by_case", ["caseId"])
    .index("by_payment_dispute", ["paymentDisputeId"])
    .index("by_agreement", ["agreedWithAI"])
    .index("by_type", ["disputeType"]),

  // Dispute precedents (DEPRECATED - vector search, not actively used)
  disputePrecedents: defineTable({
    originalDisputeId: v.id("paymentDisputes"),
    embedding: v.array(v.number()),
    disputeType: v.string(),
    amountRange: v.string(),
    currency: v.string(),
    outcomeVerdict: v.string(),
    outcomeReason: v.string(),
    humanConfirmed: v.boolean(),
    appealedAndOverturned: v.boolean(),
    confidenceScore: v.number(),
    timesReferenced: v.number(),
    userSatisfactionScore: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_dispute", ["originalDisputeId"])
    .index("by_confidence", ["confidenceScore"])
    .index("by_amount_range", ["amountRange"]),
});
