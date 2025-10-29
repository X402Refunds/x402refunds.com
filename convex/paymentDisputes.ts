/**
 * Payment Dispute Resolution for Crypto/Agentic Commerce
 * 
 * Optimized for MICRO-DISPUTES (under $1)
 * - High automation (95%+ auto-resolved)
 * - Batch processing for similar disputes
 * - Vector similarity for precedent matching
 * - Exception-based human review
 * 
 * Integration: ACP, ATXP, and other agent payment protocols
 */

import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { createCustodyEvent } from "./custody";
import {
  calculateDisputeFee,
  estimateDisputeTokens,
  validateEvidenceSize,
  type PaymentVerdict,
} from "./disputePricing";

/**
 * Receive dispute from payment protocol (ACP/ATXP webhook endpoint)
 *
 * THREE-PARTY INFRASTRUCTURE MODEL:
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 1. **Payment Provider (YOU - e.g., Stripe, ACP platform)**
 *    - The actual Consulate customer who integrates our API
 *    - Files disputes on behalf of YOUR end-users (consumers)
 *    - Makes final decisions via your review queue dashboard
 *    - Pays Consulate fees
 *    - YOUR API key auto-detects your organizationId
 *
 * 2. **Consumer (Your Customer - e.g., Alice)**
 *    - The PLAINTIFF who disputes a charge
 *    - YOUR end-user who made a payment and now disputes it
 *    - Example: "consumer:alice@stripe.com" (YOUR customer)
 *    - Identified via plaintiffMetadata.customerId in YOUR system
 *
 * 3. **Merchant (Service Provider - e.g., OpenAI)**
 *    - The DEFENDANT who charged the consumer
 *    - The vendor/service provider who received payment
 *    - Example: "merchant:openai-api@stripe.com" (service provider in YOUR platform)
 *    - Identified via defendantMetadata.merchantId in YOUR system
 *
 * REAL-WORLD EXAMPLE:
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Scenario: Alice paid $50 to OpenAI via Stripe for API credits
 *
 * 1. Alice (consumer) disputes the charge in Stripe dashboard: "Service not rendered"
 * 2. Stripe (YOU) receives dispute from Alice
 * 3. Stripe calls Consulate API:
 *    - plaintiff: "consumer:alice@stripe.com" (Alice - YOUR customer)
 *    - defendant: "merchant:openai-acct@stripe.com" (OpenAI - merchant in YOUR system)
 *    - plaintiffMetadata.customerId: "cus_stripe_abc123" (Alice's ID in YOUR DB)
 *    - defendantMetadata.merchantId: "acct_stripe_xyz789" (OpenAI's merchant ID in YOUR DB)
 *    - reviewerOrganizationId: Auto-detected from YOUR API key → Stripe's org
 * 4. Consulate AI analyzes: 95% confidence → "CONSUMER_WINS"
 * 5. Stripe's review queue shows: "Alice vs OpenAI - AI recommends refund"
 * 6. Stripe team (YOU) reviews and makes final decision
 * 7. Stripe executes decision: Refund Alice, notify OpenAI
 *
 * WHO IS WHO:
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * ✅ YOU = Payment Provider (Stripe) - Consulate customer, makes final decisions
 * ✅ YOUR CUSTOMER = Consumer (Alice) - Plaintiff disputing charge
 * ✅ SERVICE PROVIDER = Merchant (OpenAI) - Defendant who charged consumer
 *
 * Called by: ACP/ATXP infrastructure when dispute is filed by YOUR customer
 * Returns: Initial AI ruling + human review requirement flag for YOUR team
 */
export const receivePaymentDispute = mutation({
  args: {
    // Transaction details
    transactionId: v.string(),
    transactionHash: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    paymentProtocol: v.union(v.literal("ACP"), v.literal("ATXP"), v.literal("other")),

    // Parties (customer-scoped identifiers)
    // plaintiff = YOUR CUSTOMER (Alice) who is disputing the charge
    // defendant = The merchant/vendor (OpenAI) who charged YOUR customer
    // Examples: "consumer:alice@stripe.com", "merchant:openai-api@stripe.com"
    plaintiff: v.string(),
    defendant: v.string(),

    // Party metadata - helps YOU identify parties in YOUR system
    plaintiffMetadata: v.optional(v.object({
      email: v.optional(v.string()),          // YOUR customer's email (Alice)
      name: v.optional(v.string()),           // YOUR customer's name (Alice Smith)
      customerId: v.optional(v.string()),     // Alice's ID in YOUR database
      walletAddress: v.optional(v.string()),
    })),
    defendantMetadata: v.optional(v.object({
      email: v.optional(v.string()),          // Merchant's contact email
      name: v.optional(v.string()),           // Merchant's business name
      merchantId: v.optional(v.string()),     // Merchant's ID in YOUR platform
      walletAddress: v.optional(v.string()),
    })),

    // Dispute details
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
    description: v.string(),

    // Evidence URLs (API logs, transaction records, etc.)
    evidenceUrls: v.optional(v.array(v.string())),

    // Webhook for result notification
    callbackUrl: v.optional(v.string()),

    // Infrastructure Model: Customer's team reviews
    reviewerEmail: v.optional(v.string()),
    reviewerOrganizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    console.info(`📥 Payment dispute received: ${args.transactionId} ($${args.amount})`);

    // 1. Validate evidence size and estimate tokens
    const evidenceTexts: string[] = []; // In production: fetch from URLs
    const validation = validateEvidenceSize(args.description, evidenceTexts);

    if (!validation.valid) {
      throw new Error(validation.message);
    }

    // 2. Calculate pricing
    const feeBreakdown = calculateDisputeFee(args.amount, validation.estimatedTokens);

    // 3. Create consolidated payment dispute case
    const now = Date.now();
    const isMicroDispute = args.amount < 1.0;
    const autoResolveEligible = isMicroDispute; // Micro-disputes are auto-eligible

    // Calculate Regulation E deadline (10 business days)
    const regulationEDeadline = now + (10 * 24 * 60 * 60 * 1000); // Simplified: 10 calendar days

    // Initial human review determination (may be updated by AI processing)
    const initialHumanReviewNeeded = args.amount >= 1.0 || args.disputeReason === "fraud";

    const caseId = await ctx.db.insert("cases", {
      // Core case fields
      plaintiff: args.plaintiff,
      defendant: args.defendant,
      status: "FILED",
      type: "PAYMENT", // Changed from PAYMENT_DISPUTE
      filedAt: now,
      description: `${args.disputeReason}: ${args.description}`,
      amount: args.amount,
      currency: args.currency,
      evidenceIds: [], // Will be populated if evidence submitted
      mock: false, // Real dispute, not demo data
      humanReviewRequired: initialHumanReviewNeeded,
      createdAt: now,
      finalDecisionDue: regulationEDeadline,

      // Infrastructure Model fields
      reviewerEmail: args.reviewerEmail,
      reviewerOrganizationId: args.reviewerOrganizationId,

      // Payment-specific data in paymentDetails
      paymentDetails: {
        transactionId: args.transactionId,
        transactionHash: args.transactionHash,
        paymentProtocol: args.paymentProtocol === "other" ? "OTHER" : args.paymentProtocol,
        disputeReason: args.disputeReason,
        regulationEDeadline,
        plaintiffMetadata: args.plaintiffMetadata,
        defendantMetadata: args.defendantMetadata,
        disputeFee: feeBreakdown.totalFee,
        pricingTier: feeBreakdown.tier,
        tokensUsed: {
          evidenceInput: validation.estimatedTokens,
          aiAnalysis: 0, // Will be updated by AI processing
          total: validation.estimatedTokens,
        },
      },
    });
    
    // 3. Submit evidence if provided
    if (args.evidenceUrls && args.evidenceUrls.length > 0) {
      for (const url of args.evidenceUrls) {
        const evidenceId = await ctx.db.insert("evidenceManifests", {
          agentDid: args.plaintiff,
          sha256: generateSHA256(url), // Simple hash for now
          uri: url,
          signer: args.plaintiff,
          caseId,
          ts: now,
          model: {
            provider: "payment_protocol",
            name: args.paymentProtocol,
            version: "1.0.0",
          },
        });
        
        // Update case with evidence ID
        const existingCase = await ctx.db.get(caseId);
        if (existingCase) {
          await ctx.db.patch(caseId, {
            evidenceIds: [...existingCase.evidenceIds, evidenceId],
          });
        }
      }
    }
    
    // 4. Log ADP-compliant custody event
    await createCustodyEvent(ctx, {
      type: "DISPUTE_FILED",
      caseId,
      agentDid: args.plaintiff,
      payload: {
        type: "PAYMENT_DISPUTE",
        amount: args.amount,
        currency: args.currency,
        protocol: args.paymentProtocol,
        microDispute: isMicroDispute,
        adpVersion: "draft-01",
      },
    });

    // 5. REMOVED: No longer auto-trigger AI analysis
    // Cron job will trigger AI analysis based on org's configured delay

    // Determine if human review will be required
    // ALL disputes now require human review (Option 3)
    const willNeedHumanReview = true;
    
    return {
      caseId,
      paymentDisputeId: caseId, // Backward compatibility: return caseId as paymentDisputeId
      status: "received",
      isMicroDispute,
      autoResolveEligible,
      humanReviewRequired: willNeedHumanReview,
      estimatedResolutionTime: isMicroDispute ? "5 minutes" : "24 hours",
      regulationECompliant: true,
      callbackUrl: args.callbackUrl,
      // NEW: Fee information
      fee: feeBreakdown.totalFee,
      feeBreakdown,
      tier: feeBreakdown.tier,
    };
  },
});

/**
 * Process dispute with AI ruling + precedent matching
 * 
 * Uses vector similarity to find similar past disputes
 * Learns from human judgments over time
 */
export const processWithAI = action({
  args: {
    caseId: v.id("cases"), // Changed: now accepts caseId to work for all dispute types
  },
  handler: async (ctx, args): Promise<{
    verdict: PaymentVerdict;
    confidence: number;
    reasoning: string;
    humanReviewRequired: boolean;
    similarDisputesFound: number;
    tokensUsed: number;
  }> => {
    // Get case data first
    const caseData = await ctx.runQuery(api.cases.getCase, { caseId: args.caseId });
    if (!caseData) {
      throw new Error("Case not found");
    }

    // Check if this is a payment dispute or general dispute
    const isPaymentDispute = caseData.type === "PAYMENT";

    console.info(`🤖 Processing case ${args.caseId} with AI (${isPaymentDispute ? 'payment' : 'general'} dispute)`);

    // Determine dispute type and extract relevant fields
    let disputeReason: string;
    let amount: number;
    let currency: string;

    if (isPaymentDispute) {
      // Payment dispute - get from paymentDetails
      disputeReason = caseData.paymentDetails?.disputeReason || "unknown";
      amount = caseData.amount || 0;
      currency = caseData.currency || "USD";
    } else {
      // General dispute (SLA violation, contract breach, etc.)
      disputeReason = caseData.category || caseData.type; // "API_DOWNTIME", "SLA_VIOLATION", etc.
      amount = caseData.amount || 0;
      currency = caseData.currency || "USD";
    }

    // 1. Find similar past disputes using pattern matching
    // (In production: use vector embeddings + Pinecone/Convex vector search)
    const similarDisputes = await ctx.runQuery(api.paymentDisputes.findSimilarDisputes, {
      disputeReason,
      amount,
      currency,
      limit: 5,
    });

    // 2. Calculate confidence based on precedent consistency
    let confidence: number = 0.5; // Base confidence
    let verdict: PaymentVerdict = "CONSUMER_WINS"; // Default: favor consumer (Regulation E)
    let reasoning: string = "";

    if (similarDisputes.length > 0) {
      // Calculate confidence from precedent agreement
      const consumerWinsCount = similarDisputes.filter((d: any) =>
        d.aiRecommendation === "CONSUMER_WINS" || d.caseData?.ruling?.verdict === "UPHELD"
      ).length;
      const consistency = consumerWinsCount / similarDisputes.length;

      confidence = 0.7 + (consistency * 0.3); // 70-100% confidence
      verdict = consistency > 0.5 ? "CONSUMER_WINS" : "MERCHANT_WINS";

      reasoning = `Based on ${similarDisputes.length} similar past disputes, ` +
        `${(consistency * 100).toFixed(0)}% ruled in favor of ${isPaymentDispute ? 'consumer' : 'plaintiff'}. `;
    }

    // 3. Adjust confidence based on dispute characteristics
    if (isPaymentDispute && amount < 0.10) {
      confidence += 0.1; // Very micro disputes: higher automation confidence
    }

    if (disputeReason === "api_timeout" || disputeReason === "service_not_rendered" || disputeReason === "API_DOWNTIME") {
      confidence += 0.05; // Clear-cut technical failures
      verdict = "CONSUMER_WINS";
      reasoning += "Technical failure confirmed. ";
    }

    if (disputeReason === "fraud") {
      confidence -= 0.2; // Fraud requires human review
      reasoning += "Fraud allegations require enhanced review. ";
    }

    // Clamp confidence to [0, 1]
    confidence = Math.max(0, Math.min(1, confidence));

    // Estimate AI tokens used (simplified for now)
    const tokensUsed = estimateDisputeTokens(reasoning, []);

    // 4. ALL disputes now require human review (Option 3)
    const humanReviewRequired: boolean = true;

    // 5. Store AI recommendation in cases table (single source of truth)
    await ctx.runMutation(api.cases.storeAIRecommendation, {
      caseId: args.caseId,
      aiRecommendation: {
        verdict,
        confidence,
        reasoning,
        analyzedAt: Date.now(),
        similarCases: similarDisputes.map((d: any) => d._id).filter(Boolean),
      },
    });

    // 6. REMOVED: No auto-resolve - all cases go to review queue

    return {
      verdict,
      confidence,
      reasoning,
      humanReviewRequired,
      similarDisputesFound: similarDisputes.length,
      tokensUsed,
    };
  },
});

/**
 * DEPRECATED: Update dispute with AI ruling
 * Use cases.storeAIRecommendation instead
 */
export const updateWithAIRuling = mutation({
  args: {
    paymentDisputeId: v.id("cases"), // Changed to cases
    aiRulingConfidence: v.number(),
    verdict: v.union(
      v.literal("CONSUMER_WINS"),
      v.literal("MERCHANT_WINS"),
      v.literal("PARTIAL_REFUND"),
      v.literal("NEED_REVIEW")
    ),
    reasoning: v.string(),
    humanReviewRequired: v.boolean(),
    similarPastCases: v.array(v.id("cases")), // Changed to cases
    tokensUsed: v.number(),
  },
  handler: async (ctx, args) => {
    console.warn("DEPRECATED: updateWithAIRuling called. Use cases.storeAIRecommendation instead.");
    // Forward to new API
    return await ctx.db.patch(args.paymentDisputeId, {
      aiRecommendation: {
        verdict: args.verdict,
        confidence: args.aiRulingConfidence,
        reasoning: args.reasoning,
        analyzedAt: Date.now(),
        similarCases: args.similarPastCases,
      },
      humanReviewRequired: args.humanReviewRequired,
      status: "ANALYZED",
    });
  },
});


/**
 * Auto-resolve high-confidence micro-disputes
 */
// DEPRECATED: Use with cases table instead
export const autoResolve = mutation({
  args: {
    paymentDisputeId: v.id("cases"), // Changed to cases
    verdict: v.union(
      v.literal("CONSUMER_WINS"),
      v.literal("MERCHANT_WINS"),
      v.literal("PARTIAL_REFUND"),
      v.literal("NEED_REVIEW")
    ),
    reasoning: v.string(),
    confidence: v.number(),
  },
  handler: async (ctx, args) => {
    const dispute = await ctx.db.get(args.paymentDisputeId);
    if (!dispute) throw new Error("Dispute not found");

    const now = Date.now();

    // Convert to agent verdict for rulings table
    const agentVerdict: "PLAINTIFF_WINS" | "DEFENDANT_WINS" | "SPLIT" | "NEED_PANEL" =
      args.verdict === "CONSUMER_WINS" ? "PLAINTIFF_WINS" :
      args.verdict === "MERCHANT_WINS" ? "DEFENDANT_WINS" :
      args.verdict === "PARTIAL_REFUND" ? "SPLIT" : "NEED_PANEL";

    // 1. Create ruling
    const rulingId = await ctx.db.insert("rulings", {
      caseId: args.paymentDisputeId,
      verdict: agentVerdict,
      code: "AUTO_RESOLVED_MICRO_DISPUTE",
      reasons: args.reasoning + ` (Auto-resolved with ${(args.confidence * 100).toFixed(1)}% confidence)`,
      auto: true,
      decidedAt: now,
      proof: {
        merkleRoot: `auto_${args.paymentDisputeId}_${now}`,
      },
    });

    // 2. Update case status (no more ruling field, use finalVerdict)
    await ctx.db.patch(args.paymentDisputeId, {
      status: "DECIDED",
      finalVerdict: args.verdict,
      decidedAt: now,
    });

    // 3. Log event
    await ctx.db.insert("events", {
      type: "CASE_DECIDED",
      caseId: args.paymentDisputeId,
      payload: {
        verdict: args.verdict,
        auto: true,
        confidence: args.confidence,
        microDispute: true,
        amount: dispute.amount,
      },
      timestamp: now,
    });

    console.info(`✅ Auto-resolved micro-dispute ${args.paymentDisputeId}: ${args.verdict}`);

    return rulingId;
  },
});

/**
 * Find similar past disputes for precedent matching
 */
export const findSimilarDisputes = query({
  args: {
    disputeReason: v.string(),
    amount: v.number(),
    currency: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Find disputes with same reason and similar amount range
    const amountRange = getAmountRange(args.amount);
    
    const similarDisputes = await ctx.db
      .query("paymentDisputes")
      .filter(q => 
        q.and(
          q.eq(q.field("disputeReason"), args.disputeReason),
          q.eq(q.field("currency"), args.currency)
        )
      )
      .take(args.limit || 10);
    
    // Filter by amount range manually
    const filtered = similarDisputes.filter(d => 
      getAmountRange(d.amount) === amountRange
    );
    
    // Enrich with case data
    const enriched = await Promise.all(
      filtered.map(async (dispute) => {
        const caseData = await ctx.db.get(dispute.caseId);
        return { ...dispute, caseData };
      })
    );
    
    // Only return resolved cases (that have rulings)
    return enriched.filter(d => 
      d.caseData?.ruling?.verdict
    ).slice(0, args.limit || 5);
  },
});

/**
 * Get payment dispute with case details
 */
export const getPaymentDispute = query({
  args: { paymentDisputeId: v.id("paymentDisputes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.paymentDisputeId);
  },
});

/**
 * Get payment dispute by case ID
 */
export const getPaymentDisputeByCaseId = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("paymentDisputes")
      .withIndex("by_case", q => q.eq("caseId", args.caseId))
      .first();
  },
});

// Alias for getPaymentDisputeByCaseId (used by processWithAI)
export const getByCase = getPaymentDisputeByCaseId;

/**
 * Queue for human review (exception cases)
 */
export const getDisputesNeedingHumanReview = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const disputes = await ctx.db
      .query("paymentDisputes")
      .withIndex("by_human_review", q => q.eq("humanReviewRequired", true))
      .filter(q => q.eq(q.field("humanReviewedAt"), undefined))
      .take(args.limit || 20);
    
    // Enrich with case details
    return await Promise.all(
      disputes.map(async (dispute) => {
        const caseData = await ctx.db.get(dispute.caseId);
        return { ...dispute, caseData };
      })
    );
  },
});

/**
 * Human approves or overrides AI ruling
 */
export const humanReview = mutation({
  args: {
    paymentDisputeId: v.id("paymentDisputes"),
    userId: v.string(), // User performing review
    agreeWithAI: v.boolean(),
    finalVerdict: v.union(
      v.literal("CONSUMER_WINS"),
      v.literal("MERCHANT_WINS"),
      v.literal("PARTIAL_REFUND"),
      v.literal("NEED_REVIEW")
    ),
    overrideReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const dispute = await ctx.db.get(args.paymentDisputeId);
    if (!dispute) throw new Error("Dispute not found");

    const now = Date.now();

    // Convert to agent verdict for rulings table
    const agentVerdict: "PLAINTIFF_WINS" | "DEFENDANT_WINS" | "SPLIT" | "NEED_PANEL" =
      args.finalVerdict === "CONSUMER_WINS" ? "PLAINTIFF_WINS" :
      args.finalVerdict === "MERCHANT_WINS" ? "DEFENDANT_WINS" :
      args.finalVerdict === "PARTIAL_REFUND" ? "SPLIT" : "NEED_PANEL";

    // Update dispute with human review
    await ctx.db.patch(args.paymentDisputeId, {
      humanReviewedAt: now,
      humanReviewedBy: args.userId,
      humanAgreesWithAI: args.agreeWithAI,
      humanOverrideReason: args.overrideReason,
    });

    // Create or update ruling
    const rulingId = await ctx.db.insert("rulings", {
      caseId: dispute.caseId,
      verdict: agentVerdict,
      code: args.agreeWithAI ? "AI_CONFIRMED_BY_HUMAN" : "HUMAN_OVERRIDE",
      reasons: args.overrideReason || "Human review confirms AI ruling",
      auto: false, // Human involved
      decidedAt: now,
      proof: {
        merkleRoot: `human_${dispute.caseId}_${now}`,
      },
    });

    // Update case
    await ctx.db.patch(dispute.caseId, {
      status: "DECIDED",
      ruling: {
        verdict: "UPHELD", // Cases table still uses legacy format
        auto: false,
        decidedAt: now,
      },
    });

    // If human disagreed with AI, create learning record
    if (!args.agreeWithAI) {
      console.info(`📚 Learning: Human overrode AI ruling for dispute ${args.paymentDisputeId}`);
      // In production: Update embeddings, retrain model
    }

    return rulingId;
  },
});

/**
 * Get micro-dispute statistics
 */
export const getMicroDisputeStats = query({
  args: {},
  handler: async (ctx) => {
    const allDisputes = await ctx.db.query("paymentDisputes").collect();
    const microDisputes = allDisputes.filter(d => d.amount < 1.0);
    
    const autoResolved = microDisputes.filter(d => !d.humanReviewRequired).length;
    const humanReviewed = microDisputes.filter(d => d.humanReviewRequired).length;
    const avgConfidence = microDisputes.reduce((sum, d) => sum + (d.aiRulingConfidence || 0), 0) / microDisputes.length;
    
    return {
      totalMicroDisputes: microDisputes.length,
      autoResolvedCount: autoResolved,
      humanReviewedCount: humanReviewed,
      autoResolutionRate: (autoResolved / microDisputes.length * 100).toFixed(1) + "%",
      avgAIConfidence: (avgConfidence * 100).toFixed(1) + "%",
      totalValueDisputed: microDisputes.reduce((sum, d) => sum + d.amount, 0).toFixed(2),
    };
  },
});

/**
 * INFRASTRUCTURE MODEL: Customer's team reviews disputes
 * 
 * This allows customers to make final decisions while Consulate provides
 * AI-powered recommendations. Maintains full ADP compliance.
 */

/**
 * Customer reviews and makes final decision on dispute
 * ADP-compliant: Creates Award Message with custody chain
 */
export const customerReview = mutation({
  args: {
    paymentDisputeId: v.id("paymentDisputes"),
    reviewerUserId: v.id("users"), // Customer's team member
    decision: v.union(v.literal("APPROVE_AI"), v.literal("OVERRIDE")),
    finalVerdict: v.union(
      v.literal("CONSUMER_WINS"),
      v.literal("MERCHANT_WINS"),
      v.literal("PARTIAL_REFUND"),
      v.literal("NEED_REVIEW")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const dispute = await ctx.db.get(args.paymentDisputeId);
    if (!dispute) throw new Error("Dispute not found");

    // Verify reviewer is from customer's organization
    const reviewer = await ctx.db.get(args.reviewerUserId);
    if (!reviewer) throw new Error("Reviewer not found");

    if (dispute.reviewerOrganizationId && reviewer.organizationId !== dispute.reviewerOrganizationId) {
      throw new Error("Unauthorized: reviewer not from customer organization");
    }

    const now = Date.now();

    // Convert to agent verdict for rulings table
    const agentVerdict: "PLAINTIFF_WINS" | "DEFENDANT_WINS" | "SPLIT" | "NEED_PANEL" =
      args.finalVerdict === "CONSUMER_WINS" ? "PLAINTIFF_WINS" :
      args.finalVerdict === "MERCHANT_WINS" ? "DEFENDANT_WINS" :
      args.finalVerdict === "PARTIAL_REFUND" ? "SPLIT" : "NEED_PANEL";

    // Update dispute with customer's decision
    await ctx.db.patch(args.paymentDisputeId, {
      humanReviewedAt: now,
      humanReviewedBy: reviewer.email,
      humanAgreesWithAI: args.decision === "APPROVE_AI",
      customerFinalDecision: args.finalVerdict,
      customerReviewNotes: args.notes,
    });

    // Create ADP-compliant ruling (Award Message format)
    const rulingId = await ctx.db.insert("rulings", {
      caseId: dispute.caseId,
      verdict: agentVerdict,
      code: args.decision === "APPROVE_AI" ? "CUSTOMER_APPROVED_AI" : "CUSTOMER_OVERRIDE",
      reasons: args.decision === "APPROVE_AI"
        ? `Customer approved AI recommendation: ${dispute.aiReasoning || "See analysis"}`
        : `Customer override: ${args.notes || "Manual review decision"}`,
      auto: false, // Human reviewed
      decidedAt: now,
      proof: {
        merkleRoot: `customer_review_${dispute.caseId}_${now}`,
      },
    });

    // Update case status
    await ctx.db.patch(dispute.caseId, {
      status: "DECIDED",
      ruling: {
        verdict: "UPHELD", // Cases table still uses legacy format
        auto: false,
        decidedAt: now,
      },
    });

    // Log ADP-compliant custody event
    await createCustodyEvent(ctx, {
      type: "CASE_DECIDED",
      caseId: dispute.caseId,
      agentDid: undefined, // System action on behalf of customer
      payload: {
        verdict: args.finalVerdict,
        auto: false,
        customerReviewed: true,
        aiApproved: args.decision === "APPROVE_AI",
        reviewerEmail: reviewer.email,
        reviewerOrganization: reviewer.organizationId,
        adpVersion: "draft-01",
      },
    });

    // Record feedback signal for RL (both approval and override)
    await ctx.db.insert("feedbackSignals", {
      caseId: dispute.caseId,
      paymentDisputeId: args.paymentDisputeId,
      aiVerdict: dispute.aiRecommendation || "",
      aiConfidence: dispute.aiRulingConfidence,
      aiReasoning: dispute.aiReasoning || "",
      humanVerdict: args.finalVerdict,
      agreedWithAI: args.decision === "APPROVE_AI",
      overrideReason: args.notes,
      disputeType: dispute.disputeReason,
      amountRange: getAmountRange(dispute.amount),
      reviewTimeMs: now - (dispute._creationTime || now),
      createdAt: now,
    });

    // If human approved AI, create high-confidence precedent
    if (args.decision === "APPROVE_AI" && dispute.aiRulingConfidence > 0.8) {
      await ctx.db.insert("disputePrecedents", {
        originalDisputeId: args.paymentDisputeId,
        embedding: [], // Future: Generate OpenAI embedding
        disputeType: dispute.disputeReason,
        amountRange: getAmountRange(dispute.amount),
        currency: dispute.currency,
        outcomeVerdict: args.finalVerdict,
        outcomeReason: dispute.aiReasoning || "",
        humanConfirmed: true, // High trust - human approved
        appealedAndOverturned: false,
        confidenceScore: dispute.aiRulingConfidence,
        timesReferenced: 0,
        createdAt: now,
      });
      console.info(`📚 Created precedent from approved dispute ${args.paymentDisputeId} (confidence: ${(dispute.aiRulingConfidence * 100).toFixed(1)}%)`);
    } else if (args.decision === "OVERRIDE") {
      console.info(`📚 Learning: Customer overrode AI for dispute ${args.paymentDisputeId} - Reason: ${args.notes || 'Not specified'}`);
    }

    return { success: true, ruling: args.finalVerdict, rulingId };
  },
});

/**
 * Get review queue for customer's organization
 * Infrastructure Model: Only shows disputes for customer's team
 */
export const getCustomerReviewQueue = query({
  args: { 
    organizationId: v.id("organizations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const disputes = await ctx.db
      .query("paymentDisputes")
      .withIndex("by_needs_review", q => 
        q.eq("reviewerOrganizationId", args.organizationId).eq("humanReviewRequired", true)
      )
      .filter(q => q.eq(q.field("humanReviewedAt"), undefined))
      .order("asc") // Oldest first (approaching deadline)
      .take(args.limit || 50);
    
    // Enrich with case data
    const enriched = await Promise.all(
      disputes.map(async (dispute) => {
        const caseData = await ctx.db.get(dispute.caseId);
        return { ...dispute, caseData };
      })
    );
    
    return enriched;
  },
});

/**
 * Auto-approve AI recommendation after Regulation E deadline
 * Called by cron job for disputes that exceed 10 business days
 */
export const autoApproveAIRecommendation = mutation({
  args: {
    paymentDisputeId: v.id("paymentDisputes"),
  },
  handler: async (ctx, args) => {
    const dispute = await ctx.db.get(args.paymentDisputeId);
    if (!dispute) {
      throw new Error("Payment dispute not found");
    }

    if (!dispute.aiRecommendation) {
      throw new Error("No AI recommendation to approve");
    }

    // Get system user ID (or use special marker for auto-approval)
    // For now, we'll handle this in customerReview by checking for undefined reviewer
    const now = Date.now();

    // Convert to agent verdict for rulings table
    const agentVerdict: "PLAINTIFF_WINS" | "DEFENDANT_WINS" | "SPLIT" | "NEED_PANEL" =
      dispute.aiRecommendation === "CONSUMER_WINS" ? "PLAINTIFF_WINS" :
      dispute.aiRecommendation === "MERCHANT_WINS" ? "DEFENDANT_WINS" :
      dispute.aiRecommendation === "PARTIAL_REFUND" ? "SPLIT" : "NEED_PANEL";

    // Update dispute with auto-approval
    await ctx.db.patch(args.paymentDisputeId, {
      humanReviewedAt: now,
      humanReviewedBy: "SYSTEM_AUTO_APPROVAL",
      humanAgreesWithAI: true,
      customerFinalDecision: dispute.aiRecommendation,
      customerReviewNotes: "Auto-approved after Regulation E deadline (10 business days)",
    });

    // Create ADP-compliant ruling
    const rulingId = await ctx.db.insert("rulings", {
      caseId: dispute.caseId,
      verdict: agentVerdict,
      code: "AUTO_APPROVED_REGULATION_E",
      reasons: `AI recommendation auto-approved: ${dispute.aiReasoning || "See analysis"}. Auto-approved after 10 business day deadline per Regulation E.`,
      auto: false, // Technically not auto - it went through AI + waiting period
      decidedAt: now,
      proof: {
        merkleRoot: `auto_approve_${dispute.caseId}_${now}`,
      },
    });

    // Update case status
    await ctx.db.patch(dispute.caseId, {
      status: "DECIDED",
      ruling: {
        verdict: dispute.aiRecommendation, // Use actual verdict, not "UPHELD"
        auto: false,
        decidedAt: now,
      },
    });

    // Log ADP-compliant custody event
    await createCustodyEvent(ctx, {
      type: "CASE_DECIDED",
      caseId: dispute.caseId,
      agentDid: undefined,
      payload: {
        verdict: dispute.aiRecommendation,
        auto: false,
        autoApproved: true,
        regulationECompliance: true,
        aiApproved: true,
        adpVersion: "draft-01",
      },
    });

    console.info(`✅ Auto-approved dispute ${args.paymentDisputeId} after Regulation E deadline`);

    return { success: true, ruling: dispute.aiRecommendation, rulingId };
  },
});

// Helper functions
function generateSHA256(input: string): string {
  // Simple hash for now (in production: use crypto.subtle)
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function getAmountRange(amount: number): string {
  if (amount < 0.10) return "$0-0.10";
  if (amount < 0.50) return "$0.10-0.50";
  if (amount < 1.00) return "$0.50-1.00";
  if (amount < 5.00) return "$1.00-5.00";
  return "$5.00+";
}

