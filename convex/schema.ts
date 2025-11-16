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
    aiEnabled: v.optional(v.boolean()), // Global toggle to enable/disable AI analysis
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
    openApiSpec: v.optional(v.any()), // Optional OpenAPI 3.0 specification for contract validation
    specVersion: v.optional(v.string()), // e.g., "3.0.0"
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
    status: v.union(
      v.literal("active"), 
      v.literal("suspended"), 
      v.literal("banned"), 
      v.literal("deactivated")
    ),
    deactivatedAt: v.optional(v.number()),
    deactivatedBy: v.optional(v.id("users")),
    anonymizedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    
    // NEW: X-402 identity fields
    walletAddress: v.optional(v.string()), // Ethereum address (canonical ERC-8004 identity)
    endpoint: v.optional(v.string()), // API endpoint URL
    x402MetadataUrl: v.optional(v.string()), // .well-known/x402.json location
    claimedAt: v.optional(v.number()), // When agent was claimed by owner
    claimedByUserId: v.optional(v.id("users")), // Who claimed it
    
    // Test data markers (for automatic cleanup)
    isTestData: v.optional(v.boolean()), // Mark as test data
    testRunId: v.optional(v.number()), // Test run identifier for batch cleanup
    testSourceFile: v.optional(v.string()), // Source test file
  })
    .index("by_did", ["did"])
    .index("by_owner", ["ownerDid"])
    .index("by_status", ["status"])
    .index("by_functional_type", ["functionalType"])
    .index("by_organization", ["organizationId"])
    .index("by_public_key", ["publicKey"])
    .index("by_wallet", ["walletAddress"]) // NEW: Query by Ethereum address
    .index("by_test", ["isTestData"]), // NEW: Query test data for cleanup

  // ========================================
  // CASES TABLE - SINGLE SOURCE OF TRUTH
  // ========================================
  // Supports TWO dispute types:
  // 1. PAYMENT - Payment/transaction disputes (ACP/ATXP/Stripe integration)
  // 2. GENERAL - Everything else (contracts, SLAs, service quality, API downtime, etc.)
  //              Can be agentic OR traditional - we're Zendesk for all disputes, not just payments
  cases: defineTable({
    // Universal fields
    plaintiff: v.string(),  // Who filed the dispute (consumer, agent DID, user email, company)
    defendant: v.string(),  // Who is being disputed (merchant, agent DID, company name, service provider)

    status: v.union(
      v.literal("FILED"),      // Just filed, awaiting AI analysis
      v.literal("ANALYZED"),   // AI completed analysis
      v.literal("AUTORULED"),  // AI auto-ruled (high confidence, automated resolution)
      v.literal("IN_REVIEW"),  // Human reviewing (for low confidence or escalated cases)
      v.literal("PANELED"),    // Assigned to judge panel for review
      v.literal("DECIDED"),    // Final decision made
      v.literal("CLOSED")      // Case closed
    ),

    // TWO MAIN TYPES: "PAYMENT" or "GENERAL"
    // TEMP: Using v.string() during migration to allow any legacy type values
    type: v.string(),

    filedAt: v.number(),
    description: v.string(),
    amount: v.optional(v.number()), // Transaction amount OR claimed damages
    currency: v.optional(v.string()),

    // GENERAL dispute fields (for non-payment disputes)
    // Use for: contracts, SLAs, service quality, API downtime, delivery, support, etc.
    // Works for both agentic AND traditional disputes
    category: v.optional(v.string()), // "contract_breach", "sla_violation", "service_quality", "api_downtime", "delivery", "support", etc.
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))),
    tags: v.optional(v.array(v.string())), // Custom tags for categorization
    attachments: v.optional(v.array(v.object({
      url: v.string(),
      filename: v.string(),
      contentType: v.optional(v.string()),
      size: v.optional(v.number()),
    }))),

    // DEPRECATED: metadata field kept for backward compatibility with existing data
    metadata: v.optional(v.any()),

    // Evidence
    evidenceIds: v.array(v.id("evidenceManifests")),

    // NEW: Signed evidence from seller (cryptographically verified)
    signedEvidence: v.optional(v.object({
      request: v.object({
        method: v.string(),
        path: v.string(),
        headers: v.optional(v.any()),
        body: v.optional(v.any()),  // The original request (the "question")
      }),
      response: v.object({
        status: v.number(),
        headers: v.optional(v.object({
          contentType: v.optional(v.string()),
          disputeUrl: v.optional(v.string()),          // X-Dispute-URL header (signed!)
          consulateAdp: v.optional(v.string()),        // X-Consulate-ADP header (signed!)
          vendorDid: v.optional(v.string()),           // X-Vendor-DID header (signed!)
          other: v.optional(v.any()),                  // Other headers as key-value
        })),
        body: v.string(),            // The API response (the "answer")
      }),
      
      // Payment details - support crypto, custodial, or traditional
      amountUsd: v.optional(v.number()), // USD value for fee calculation
      
      // Crypto payment details (for USDC, ETH, SOL, etc.)
      crypto: v.optional(v.object({
        currency: v.string(),              // "USDC", "ETH", "SOL", "BTC"
        blockchain: v.string(),             // "solana", "base", "ethereum", "bitcoin"
        layer: v.optional(v.string()),      // "L1", "L2"
        fromAddress: v.optional(v.string()), // Buyer's wallet address
        toAddress: v.optional(v.string()),   // Seller's wallet address
        transactionHash: v.optional(v.string()), // Blockchain tx hash (format varies by chain)
        contractAddress: v.optional(v.string()), // Token contract address (e.g., USDC on Base)
        blockNumber: v.optional(v.number()),
        explorerUrl: v.optional(v.string()), // Link to block explorer
      })),
      
      // Custodial platform details (for exchanges)
      custodial: v.optional(v.object({
        platform: v.string(),              // "coinbase", "binance", etc.
        platformTransactionId: v.optional(v.string()),
        isOnChain: v.optional(v.boolean()),
        withdrawalId: v.optional(v.string()),
      })),
      
      // Traditional payment details (for Stripe, PayPal, cards)
      traditional: v.optional(v.object({
        paymentMethod: v.string(),         // "stripe", "paypal", "visa", etc.
        processor: v.optional(v.string()),
        processorTransactionId: v.optional(v.string()),
        cardBrand: v.optional(v.string()),
        lastFourDigits: v.optional(v.string()),
        cardType: v.optional(v.string()),
      })),
      
      signature: v.string(),        // Ed25519 signature
      signatureVerified: v.boolean(),
      vendorDid: v.string(),        // Seller's agent DID
    })),

    // Deadlines
    analysisDue: v.optional(v.number()),    // When AI should complete analysis
    reviewDue: v.optional(v.number()),      // When human review should be done
    finalDecisionDue: v.optional(v.number()), // TEMP: Optional to allow migration - Final deadline (e.g., Regulation E: 10 business days)
    regulationEDeadline: v.optional(v.number()), // Regulation E compliance deadline for payment disputes (10 business days)

    // AI Analysis
    aiRecommendation: v.optional(v.object({
      verdict: v.string(),      // CONSUMER_WINS, MERCHANT_WINS, PLAINTIFF_WINS, DEFENDANT_WINS
      confidence: v.number(),   // 0-1
      reasoning: v.string(),
      analyzedAt: v.number(),
      similarCases: v.array(v.id("cases")),
      tokensUsed: v.optional(v.number()),
    })),

    // Human Review (Infrastructure Model - customer team makes final decision)
    reviewerOrganizationId: v.optional(v.id("organizations")),  // Which org reviews this
    humanReviewRequired: v.optional(v.boolean()),  // TEMP: Optional to allow migration - Does this need human review?
    humanReviewedAt: v.optional(v.number()),
    humanReviewedBy: v.optional(v.string()), // Email/name of reviewer
    humanAgreesWithAI: v.optional(v.boolean()),
    humanOverrideReason: v.optional(v.string()),

    // Final Decision
    finalVerdict: v.optional(v.string()),
    decidedAt: v.optional(v.number()),

    // ========================================
    // PAYMENT-SPECIFIC FIELDS (type=PAYMENT only)
    // ========================================
    paymentDetails: v.optional(v.object({
      transactionId: v.string(),
      transactionHash: v.optional(v.string()),
      disputeReason: v.optional(v.union(
        v.literal("unauthorized"),
        v.literal("service_not_rendered"),
        v.literal("amount_incorrect"),
        v.literal("duplicate_charge"),
        v.literal("fraud"),
        v.literal("api_timeout"),
        v.literal("rate_limit_breach"),
        v.literal("quality_issue"),
        v.literal("other")
      )),
      
      // DEPRECATED: These fields are ignored but kept for backward compatibility with existing data
      paymentProtocol: v.optional(v.any()),
      paymentType: v.optional(v.any()),
      crypto: v.optional(v.any()),
      custodial: v.optional(v.any()),
      traditional: v.optional(v.any()),
      metadata: v.optional(v.any()),
      
      regulationEDeadline: v.number(),      // Regulation E compliance (10 business days)
      // Flat pricing: $0.05 per dispute (no tiers)
      pricingTier: v.optional(v.string()), // DEPRECATED: Kept for backward compat with old data, will be removed
      disputeFee: v.number(),
      // Party metadata (for customer to identify users in their system)
      plaintiffMetadata: v.optional(v.object({
        email: v.optional(v.string()),
        name: v.optional(v.string()),
        customerId: v.optional(v.string()),  // Customer's internal user ID
        walletAddress: v.optional(v.string()), // Blockchain wallet address if applicable
        requestJson: v.optional(v.string()), // X-402 request object as JSON string
      })),
      defendantMetadata: v.optional(v.object({
        email: v.optional(v.string()),
        name: v.optional(v.string()),
        merchantId: v.optional(v.string()),  // Customer's internal merchant ID
        walletAddress: v.optional(v.string()), // Blockchain wallet address if applicable
        responseJson: v.optional(v.string()), // X-402 response object as JSON string
      })),
    })),

    // Metadata
    mock: v.optional(v.boolean()),
    createdAt: v.optional(v.number()), // TEMP: Optional to allow migration

    // Retention policy fields
    retentionPolicy: v.optional(v.union(
      v.literal("payment"),      // Payment disputes: 60 days evidence, 2 years metadata
      v.literal("customer_support"), // Customer support: 4 months total
      v.literal("commercial")     // Commercial disputes: 7 years
    )),
    evidenceDeleteAfter: v.optional(v.number()), // When evidence should be deleted
    metadataDeleteAfter: v.optional(v.number()),  // When metadata should be deleted

    // TEMP: Deprecated fields for migration
    claimedDamages: v.optional(v.number()),
    deadlines: v.optional(v.any()),
    jurisdictionTags: v.optional(v.array(v.string())),
    parties: v.optional(v.array(v.string())),
    ruling: v.optional(v.any()),
    breachDetails: v.optional(v.any()),
    
    // Test data markers (for automatic cleanup)
    isTestData: v.optional(v.boolean()), // Mark as test data
    testRunId: v.optional(v.number()), // Test run identifier for batch cleanup
    testSourceFile: v.optional(v.string()), // Source test file
  })
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_filed_at", ["filedAt"])
    .index("by_plaintiff", ["plaintiff"])
    .index("by_defendant", ["defendant"])
    .index("by_reviewer_org", ["reviewerOrganizationId"])
    .index("by_needs_review", ["reviewerOrganizationId", "humanReviewRequired"])
    .index("by_status_and_type", ["status", "type"])
    .index("by_category", ["category"]) // For GENERAL disputes
    .index("by_test", ["isTestData"]), // Query test data for cleanup

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
    // Retention policy fields
    retentionPolicy: v.optional(v.union(
      v.literal("payment"),      // Payment disputes: 60 days evidence, 2 years metadata
      v.literal("customer_support"), // Customer support: 4 months total
      v.literal("commercial")     // Commercial disputes: 7 years
    )),
    deleteAfter: v.optional(v.number()), // Timestamp when evidence should be deleted
    archived: v.optional(v.boolean()),    // Whether evidence has been archived
    archivedAt: v.optional(v.number()),   // When evidence was archived
    redacted: v.optional(v.boolean()),    // Whether PII has been redacted
    redactedAt: v.optional(v.number()),   // When PII was redacted
  })
    .index("by_case", ["caseId"])
    .index("by_agent", ["agentDid"])
    .index("by_sha256", ["sha256"])
    .index("by_timestamp", ["ts"])
    .index("by_retention", ["retentionPolicy", "deleteAfter"]),

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
  // SUPPORTING TABLES - Analytics & Learning
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

  // Agent reputation alias (for backward compatibility)
  reputation: defineTable({
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

  // API Keys for organization access
  apiKeys: defineTable({
    key: v.optional(v.string()),              // csk_live_xxxxx or csk_test_xxxxx
    organizationId: v.id("organizations"),
    name: v.string(),             // "Production", "Development", etc.
    createdBy: v.optional(v.id("users")),
    status: v.union(
      v.literal("active"),
      v.literal("revoked")
    ),
    createdAt: v.number(),
    revokedAt: v.optional(v.number()),
    revokedBy: v.optional(v.id("users")),
    lastUsedAt: v.optional(v.number()),
    // Legacy fields (backward compatibility)
    token: v.optional(v.string()),            // Old field name for key
    createdByUserId: v.optional(v.id("users")), // Old field name for createdBy
    active: v.optional(v.boolean()),          // Old status field
    permissions: v.optional(v.array(v.string())),
    expiresAt: v.optional(v.number()),
  })
    .index("by_key", ["key"])
    .index("by_organization", ["organizationId"])
    .index("by_status", ["status"]),

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

  // Feedback signals for ML/RL (learning from human decisions)
  feedbackSignals: defineTable({
    caseId: v.id("cases"),
    aiVerdict: v.string(),
    aiConfidence: v.number(),
    aiReasoning: v.string(),
    humanVerdict: v.string(),
    agreedWithAI: v.boolean(),
    overrideReason: v.optional(v.string()),
    disputeType: v.string(),  // "PAYMENT" or "GENERAL"
    amountRange: v.optional(v.string()),  // For payment disputes
    category: v.optional(v.string()),     // For general disputes
    reviewTimeMs: v.number(),
    createdAt: v.number(),
  })
    .index("by_case", ["caseId"])
    .index("by_agreement", ["agreedWithAI"])
    .index("by_type", ["disputeType"]),

  // Workflow execution steps (agent outputs per case)
  workflowSteps: defineTable({
    caseId: v.id("cases"),
    workflowId: v.string(), // Unique workflow execution ID
    stepNumber: v.number(),
    stepName: v.string(), // "signature_verification", "spec_validation", "evidence_review", etc.
    agentName: v.string(), // "Signature Verification Agent"
    
    // Execution tracking
    status: v.union(
      v.literal("PENDING"),
      v.literal("RUNNING"),
      v.literal("COMPLETED"),
      v.literal("SKIPPED"),
      v.literal("FAILED")
    ),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    durationMs: v.optional(v.number()),
    
    // Agent input/output
    input: v.optional(v.any()), // What was passed to the agent
    output: v.any(), // Full agent response with 'steps' array
    
    // Extracted results (for quick access without parsing output)
    result: v.optional(v.string()), // Summary: "Signature valid", "3 similar cases found"
    verdict: v.optional(v.string()), // If agent makes a determination
    confidence: v.optional(v.number()), // ONLY for judge, NOT for signature
    
    // Error handling
    error: v.optional(v.string()),
    retryCount: v.optional(v.number()),
    
    createdAt: v.number(),
  })
    .index("by_case", ["caseId"])
    .index("by_workflow", ["workflowId"])
    .index("by_case_step", ["caseId", "stepNumber"])
    .index("by_status", ["status"]),
});
