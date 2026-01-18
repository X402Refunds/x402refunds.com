import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { createCustodyEvent } from "./custody";
import { workflowManager } from "./workflows";
import { normalizeWalletIndexKey, walletMatchKeys } from "./lib/caip10";

async function assignUnassignedPaymentCasesToOrgForWalletKeys(ctx: any, args: {
  organizationId: any;
  walletKeys: string[];
  limit: number;
}) {
  const org = await ctx.db.get(args.organizationId);
  if (!org) throw new Error("Organization not found");

  const limit = Math.min(args.limit ?? 500, 5000);

  const caseMap = new Map<string, any>();
  for (const k of args.walletKeys) {
    const key = normalizeWalletIndexKey(k);
    if (!key) continue;
    const rows = await ctx.db
      .query("cases")
      .withIndex("by_defendant", (q: any) => q.eq("defendant", key))
      .collect();
    for (const r of rows as any[]) caseMap.set(String(r._id), r);
    if (caseMap.size >= limit) break;
  }

  const candidates = Array.from(caseMap.values());
  const eligible = candidates
    .filter((c) => {
      if (c.type !== "PAYMENT") return false;
      if (c.reviewerOrganizationId) return false;
      if (typeof c.filedAt !== "number") return false;
      return c.filedAt >= org.createdAt;
    })
    .slice(0, limit);

  let assigned = 0;
  let feeCharged = 0;
  let feeBlocked = 0;
  let aiTriggered = 0;

  for (const c of eligible) {
    await ctx.db.patch(c._id, { reviewerOrganizationId: args.organizationId });
    assigned++;

    const feeRes = await ctx.runMutation((internal as any).refundCredits.chargeDisputeFeeForCase, { caseId: c._id });
    if (!feeRes.ok) {
      feeBlocked++;
      await ctx.db.patch(c._id, {
        tags: Array.from(new Set([...(c.tags || []), "awaiting_funding"])),
        metadata: {
          ...(c.metadata || {}),
          fundingBlocked: true,
          fundingBlockReason: feeRes.code,
        },
      });
      continue;
    }

    feeCharged++;
    if (org.aiEnabled === false) continue;
    await ctx.scheduler.runAfter(0, (internal as any).paymentDisputes.triggerPaymentWorkflow, { caseId: c._id });
    aiTriggered++;
  }

  return { success: true, assigned, feeCharged, feeBlocked, aiTriggered };
}

// General dispute category enum
export const GENERAL_DISPUTE_CATEGORIES = [
  "contract_breach",
  "sla_violation", 
  "service_quality",
  "api_downtime",
  "api_latency",
  "data_quality",
  "data_breach",
  "feature_availability",
  "delivery_issue",
  "support_issue",
  "billing_dispute",
  "unauthorized_access"
] as const;

export type GeneralDisputeCategory = typeof GENERAL_DISPUTE_CATEGORIES[number];

export const fileDispute = mutation({
  args: {
    plaintiff: v.string(),  // Agent DID filing the dispute
    defendant: v.string(),  // Agent DID being sued
    type: v.string(),
    jurisdictionTags: v.array(v.string()),
    evidenceIds: v.array(v.id("evidenceManifests")),
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
    
    // NEW: Cryptographically signed evidence from seller
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
      amountUsd: v.optional(v.number()),
      crypto: v.optional(v.object({
        currency: v.string(),
        blockchain: v.string(),
        layer: v.optional(v.string()),
        fromAddress: v.optional(v.string()),
        toAddress: v.optional(v.string()),
        transactionHash: v.optional(v.string()),
        contractAddress: v.optional(v.string()),
        blockNumber: v.optional(v.number()),
        explorerUrl: v.optional(v.string()),
      })),
      custodial: v.optional(v.object({
        platform: v.string(),
        platformTransactionId: v.optional(v.string()),
        isOnChain: v.optional(v.boolean()),
        withdrawalId: v.optional(v.string()),
      })),
      traditional: v.optional(v.object({
        paymentMethod: v.string(),
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
    
    // Payment dispute fields (for backward compatibility)
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    
    // Organization reviewer field (for X-402 disputes)
    reviewerOrganizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args): Promise<any> => {
    // Validate plaintiff and defendant are different
    if (args.plaintiff === args.defendant) {
      throw new Error("Plaintiff and defendant must be different agents");
    }

    // Verify plaintiff is an active registered agent
    const plaintiff = await ctx.db
      .query("agents")
      .withIndex("by_did", (q) => q.eq("did", args.plaintiff))
      .first();

    if (!plaintiff || plaintiff.status !== "active") {
      throw new Error(`Plaintiff ${args.plaintiff} not found or not active. Register your agent first using consulate_register_agent.`);
    }

    // Defendant doesn't need to be registered - disputes can be filed against unregistered vendors
    // They'll be notified and can register/respond later
    const defendant = await ctx.db
      .query("agents")
      .withIndex("by_did", (q) => q.eq("did", args.defendant))
      .first();

    // Log if defendant is not registered (for tracking purposes)
    if (!defendant) {
      console.info(`📢 Dispute filed against unregistered defendant: ${args.defendant}. They will be notified to register and respond.`);
    } else if (defendant.status !== "active") {
      console.warn(`⚠️ Dispute filed against inactive defendant: ${args.defendant} (status: ${defendant.status})`);
    }

    // Verify evidence exists
    for (const evidenceId of args.evidenceIds) {
      const evidence = await ctx.db.get(evidenceId);
      if (!evidence) {
        throw new Error(`Evidence ${evidenceId} not found`);
      }
    }

    const now = Date.now();
    const finalDecisionDue = now + 7 * 24 * 60 * 60 * 1000; // 7 days

    const caseData: any = {
      plaintiff: args.plaintiff,
      defendant: args.defendant,
      parties: [args.plaintiff, args.defendant], // List of all parties involved
      status: "FILED" as const,
      type: "GENERAL", // Agent disputes are now type GENERAL (vs PAYMENT)
      filedAt: now,
      description: args.description || `Dispute filed: ${args.type}`,
      amount: args.claimedDamages || args.amount, // Support both claimedDamages and amount
      currency: args.currency,
      evidenceIds: args.evidenceIds,
      finalDecisionDue,
      humanReviewRequired: false, // Default to no review
      category: args.type, // Store original dispute type as category
      tags: args.jurisdictionTags, // Jurisdiction tags become tags
      breachDetails: args.breachDetails, // Store SLA/breach details if provided
      signedEvidence: args.signedEvidence, // NEW: Cryptographically signed evidence
      retentionPolicy: "commercial", // General disputes use commercial retention policy
      reviewerOrganizationId: args.reviewerOrganizationId, // Link to organization for review
      createdAt: now,
    };

    const caseId = await ctx.db.insert("cases", caseData);

    // Update evidence manifests to link to case
    for (const evidenceId of args.evidenceIds) {
      await ctx.db.patch(evidenceId, { caseId });
    }

    // Determine which workflow to use
    const amount = args.claimedDamages || 0;
    const evidenceCount = args.evidenceIds.length;
    
    // Start appropriate workflow based on case type
    // Workflows must be referenced via internal API
    // In test mode, workflows may not be available, so we make it optional
    let workflowId: string | undefined;
    try {
      if (caseData.type === "PAYMENT") {
        // Payment disputes use payment workflow
        if (amount < 1 && evidenceCount <= 2) {
          workflowId = await workflowManager.start(ctx, internal.workflows.microDisputeWorkflow as any, { caseId });
        } else {
          workflowId = await workflowManager.start(ctx, internal.workflows.paymentDisputeWorkflow as any, { caseId });
        }
      } else {
        // General disputes use general workflow
        workflowId = await workflowManager.start(ctx, internal.workflows.generalDisputeWorkflow as any, { caseId });
      }
    } catch (error: any) {
      // In test mode, workflows may not be registered
      if (error?.message?.includes('not registered') || error?.message?.includes('Component')) {
        console.warn('Workflow component not available in test mode, skipping workflow start');
        workflowId = undefined;
      } else {
        throw error;
      }
    }

    // Log custody event
    await createCustodyEvent(ctx, {
      type: "DISPUTE_FILED",
      caseId,
      agentDid: args.plaintiff,
      payload: {
        plaintiff: args.plaintiff,
        defendant: args.defendant,
        type: args.type,
        evidenceCount: args.evidenceIds.length,
        claimedDamages: args.claimedDamages,
        workflowId,
      },
    });

    return { caseId, workflowId, status: "processing" };
  },
});

// Internal queries for agent tools
export const getCasesByType = internalQuery({
  args: { type: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cases")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .collect();
  },
});

export const getAllCases = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("cases").collect();
  },
});

// Internal version for workflows (workflows can only call internal functions)
export const getCase = internalQuery({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const case_ = await ctx.db.get(args.caseId);
    if (!case_) return null;

    // Get associated evidence
    const evidence = await ctx.db
      .query("evidenceManifests")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();

    // Get ruling if exists
    const ruling = await ctx.db
      .query("rulings")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .first();

    return {
      ...case_,
      evidence,
      ruling,
    };
  },
});

// Public version for frontend
export const getCasePublic = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const case_ = await ctx.db.get(args.caseId);
    if (!case_) return null;

    // Get associated evidence
    const evidence = await ctx.db
      .query("evidenceManifests")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();

    // Get ruling if exists
    const ruling = await ctx.db
      .query("rulings")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .first();

    return {
      ...case_,
      evidence,
      ruling,
    };
  },
});

// Alias for clarity in frontend
export const getCaseById = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.caseId);
  },
});

/**
 * Normalize an untrusted case id string to a typed `Id<"cases">` (or null).
 * This avoids ArgumentValidationError when clients receive ids from other systems/environments.
 */
export const normalizeCaseIdFromString = query({
  args: { caseId: v.string() },
  handler: async (ctx, args): Promise<{ caseId: any | null }> => {
    const raw = String(args.caseId || "").trim();
    if (!raw) return { caseId: null };
    const normalized = await ctx.db.normalizeId("cases", raw);
    return { caseId: normalized ?? null };
  },
});

/**
 * Safe get-by-id that accepts an untrusted string. Returns null instead of throwing.
 * Prefer this for public pages where the URL param cannot be trusted.
 */
export const getCaseByIdFromString = query({
  args: { caseId: v.string() },
  handler: async (ctx, args) => {
    const raw = String(args.caseId || "").trim();
    if (!raw) return null;
    const normalized = await ctx.db.normalizeId("cases", raw);
    if (!normalized) return null;
    return await ctx.db.get(normalized);
  },
});

/**
 * One-time migration/backfill:
 * Populate paymentSourceChain/paymentSourceTxHash for historical PAYMENT cases
 * from paymentDetails.blockchain/transactionHash when present.
 *
 * Safe to run multiple times; only patches rows missing the top-level fields.
 */
export const backfillPaymentSourceTx = internalMutation({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ scanned: number; updated: number; cursor: string | null; isDone: boolean }> => {
    const limit = Math.max(1, Math.min(args.limit ?? 500, 2000));

    // Paginate over PAYMENT cases, oldest → newest, patching rows missing the new fields.
    const pageRes = await ctx.db
      .query("cases")
      .withIndex("by_type", (q) => q.eq("type", "PAYMENT"))
      .order("asc")
      .paginate({
        cursor: args.cursor ?? null,
        numItems: limit,
      });

    let updated = 0;
    for (const c of pageRes.page as any[]) {
      if (c.paymentSourceChain && c.paymentSourceTxHash) continue;
      const chain = c.paymentDetails?.blockchain;
      const txHash = c.paymentDetails?.transactionHash;
      if ((chain === "base" || chain === "solana") && typeof txHash === "string" && txHash.length > 0) {
        await ctx.db.patch(c._id, {
          paymentSourceChain: chain,
          paymentSourceTxHash: txHash,
        });
        updated += 1;
      }
    }

    return {
      scanned: pageRes.page.length,
      updated,
      cursor: pageRes.continueCursor,
      isDone: pageRes.isDone,
    };
  },
});

/**
 * One-time migration/upsert:
 * Normalize legacy PAYMENT disputes to the wallet-first v1 schema conventions:
 * - Prefer CAIP-10 for plaintiff/defendant when they look like on-chain addresses
 * - Ensure currency/amount fields are populated from paymentDetails.amountMicrousdc when present
 * - Populate metadata.v1 (buyer/merchant/txHash/chain/amountMicrousdc/reason) when missing
 *
 * Idempotent: safe to run multiple times.
 *
 * IMPORTANT: This mutates existing dispute rows. Run with dryRun first.
 */
export const migratePaymentCasesToWalletFirstV1 = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    scanned: number;
    updated: number;
    cursor: string | null;
    isDone: boolean;
    dryRun: boolean;
  }> => {
    const dryRun = args.dryRun ?? true;
    const limit = Math.max(1, Math.min(args.limit ?? 500, 2000));

    const SOLANA_MAINNET_CHAIN_ID = "5eykt4GNfsw7SU33zdhhrELoMu3gFmT33EpFdpEfmgbf";

    function normalizeCaip10ForPayment(
      value: string,
      chain: "base" | "solana" | null,
    ): string | null {
      const raw = (value || "").trim();
      if (!raw) return null;
      // Already CAIP-10-ish
      if (raw.includes(":")) {
        const parts = raw.split(":");
        if (parts.length !== 3) return raw;
        const [ns, chainId, addr] = parts;
        if (ns === "eip155" && addr.startsWith("0x") && addr.length === 42) {
          // Wallet-first: default to Base chainId (8453) when chain is base or unknown.
          const nextChainId = chain === "solana" ? chainId : "8453";
          return `eip155:${nextChainId}:${addr.toLowerCase()}`;
        }
        return raw;
      }

      // EVM address
      if (/^0x[a-fA-F0-9]{40}$/.test(raw)) {
        const nextChainId = chain === "solana" ? "1" : "8453";
        return `eip155:${nextChainId}:${raw.toLowerCase()}`;
      }

      // Solana-like base58 (best-effort)
      if (chain === "solana" && raw.length >= 32 && raw.length <= 44) {
        return `solana:${SOLANA_MAINNET_CHAIN_ID}:${raw}`;
      }

      return raw;
    }

    // Paginate over PAYMENT cases, oldest → newest.
    const pageRes = await ctx.db
      .query("cases")
      .withIndex("by_type", (q) => q.eq("type", "PAYMENT"))
      .order("asc")
      .paginate({
        cursor: args.cursor ?? null,
        numItems: limit,
      });

    let updated = 0;

    for (const c of pageRes.page as any[]) {
      const chain: "base" | "solana" | null =
        c.paymentSourceChain ||
        c.paymentDetails?.blockchain ||
        c.signedEvidence?.crypto?.blockchain ||
        null;

      const next: any = {};

      // Normalize plaintiff/defendant to CAIP-10 when they look like on-chain identifiers.
      const nextPlaintiff = typeof c.plaintiff === "string" ? normalizeCaip10ForPayment(c.plaintiff, chain) : null;
      const nextDefendant = typeof c.defendant === "string" ? normalizeCaip10ForPayment(c.defendant, chain) : null;
      if (nextPlaintiff && nextPlaintiff !== c.plaintiff) next.plaintiff = nextPlaintiff;
      if (nextDefendant && nextDefendant !== c.defendant) next.defendant = nextDefendant;

      // Ensure amount/currency are populated for PAYMENT disputes.
      const amountMicros: number | undefined = c.paymentDetails?.amountMicrousdc;
      if (typeof amountMicros === "number" && Number.isFinite(amountMicros) && amountMicros > 0) {
        if (typeof c.amount !== "number") next.amount = amountMicros / 1_000_000;
        if (typeof c.currency !== "string" || !c.currency) next.currency = "USDC";
      } else if ((typeof c.currency !== "string" || !c.currency) && (typeof c.amount === "number")) {
        // Best-effort: if amount exists but currency missing, default to USDC for PAYMENT.
        next.currency = "USDC";
      }

      // Populate metadata.v1 if missing (wallet-first compatibility layer).
      const existingMeta = c.metadata && typeof c.metadata === "object" ? c.metadata : {};
      const hasV1 = !!existingMeta?.v1;
      if (!hasV1) {
        const buyer = (next.plaintiff || c.plaintiff) as string;
        const merchantRaw = (next.defendant || c.defendant) as string;
        const merchant = normalizeCaip10ForPayment(merchantRaw, chain) || merchantRaw;
        const txHash = c.paymentSourceTxHash || c.paymentDetails?.transactionHash || c.paymentDetails?.transactionId;

        next.metadata = {
          ...existingMeta,
          v1: {
            buyer,
            merchant,
            chain: chain || undefined,
            txHash: typeof txHash === "string" ? txHash : undefined,
            amountMicrousdc: typeof amountMicros === "number" ? amountMicros : undefined,
            reason: c.paymentDetails?.disputeReason || undefined,
          },
          migrations: {
            ...(existingMeta?.migrations || {}),
            walletFirstV1: {
              appliedAt: Date.now(),
              original: {
                plaintiff: c.plaintiff,
                defendant: c.defendant,
              },
            },
          },
        };
      } else {
        // Tighten: ensure metadata.v1.merchant and cases.defendant are CAIP-10 for wallet-first payment cases.
        const v1 = existingMeta?.v1;
        const v1MerchantRaw = typeof v1?.merchant === "string" ? (v1.merchant as string) : "";
        const v1Merchant = v1MerchantRaw ? (normalizeCaip10ForPayment(v1MerchantRaw, chain) || v1MerchantRaw) : null;
        if (v1Merchant && v1Merchant !== v1MerchantRaw) {
          next.metadata = {
            ...existingMeta,
            v1: { ...(existingMeta?.v1 || {}), merchant: v1Merchant },
          };
        }
        // Keep defendant aligned with v1 merchant where possible.
        if (v1Merchant && typeof c.defendant === "string" && v1Merchant !== c.defendant) {
          next.defendant = v1Merchant;
        }
      }

      if (Object.keys(next).length === 0) continue;
      if (!dryRun) {
        await ctx.db.patch(c._id, next);
      }
      updated += 1;
    }

    return {
      scanned: pageRes.page.length,
      updated,
      cursor: pageRes.continueCursor,
      isDone: pageRes.isDone,
      dryRun,
    };
  },
});

/**
 * Secret-gated runner for migratePaymentCasesToWalletFirstV1.
 * Exists so scripts can run this without calling internal mutations directly.
 */
export const runMigratePaymentCasesToWalletFirstV1 = mutation({
  args: {
    secret: v.string(),
    dryRun: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const expected = process.env.MIGRATIONS_SECRET;
    if (!expected) throw new Error("MIGRATIONS_SECRET is not configured");
    if (args.secret !== expected) throw new Error("Unauthorized");

    const i = internal as any;
    return await ctx.runMutation(i.cases.migratePaymentCasesToWalletFirstV1, {
      dryRun: args.dryRun,
      limit: args.limit,
      cursor: args.cursor,
    });
  },
});

/**
 * One-time destructive cleanup:
 * Delete all non-PAYMENT cases and all directly-associated records ("orphans"):
 * - evidenceManifests where caseId == deletedCaseId
 * - rulings where caseId == deletedCaseId
 * - feedbackSignals where caseId == deletedCaseId
 * - workflowSteps where caseId == deletedCaseId
 * - refundTransactions where caseId == deletedCaseId
 * - events where caseId == deletedCaseId
 *
 * Idempotent per-run cursor paging; safe to re-run until updated=0.
 */
export const purgeNonPaymentCasesAndOrphans = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    scanned: number;
    deletedCases: number;
    deletedEvidence: number;
    deletedRulings: number;
    deletedEvents: number;
    deletedFeedback: number;
    deletedWorkflowSteps: number;
    deletedRefundTransactions: number;
    cursor: string | null;
    isDone: boolean;
    dryRun: boolean;
  }> => {
    const dryRun = args.dryRun ?? true;
    const limit = Math.max(1, Math.min(args.limit ?? 250, 1000));

    const pageRes = await ctx.db
      .query("cases")
      .withIndex("by_filed_at")
      .order("asc")
      .paginate({
        cursor: args.cursor ?? null,
        numItems: limit,
      });

    let deletedCases = 0;
    let deletedEvidence = 0;
    let deletedRulings = 0;
    let deletedEvents = 0;
    let deletedFeedback = 0;
    let deletedWorkflowSteps = 0;
    let deletedRefundTransactions = 0;

    for (const c of pageRes.page as any[]) {
      const type = typeof c.type === "string" ? c.type : "";
      if (type === "PAYMENT") continue;

      const caseId = c._id;

      // Delete associated records first.
      const evidence = await ctx.db
        .query("evidenceManifests")
        .withIndex("by_case", (q) => q.eq("caseId", caseId))
        .collect();
      const rulings = await ctx.db
        .query("rulings")
        .withIndex("by_case", (q) => q.eq("caseId", caseId))
        .collect();
      const feedback = await ctx.db
        .query("feedbackSignals")
        .withIndex("by_case", (q) => q.eq("caseId", caseId))
        .collect();
      const steps = await ctx.db
        .query("workflowSteps")
        .withIndex("by_case", (q) => q.eq("caseId", caseId))
        .collect();
      const refunds = await ctx.db
        .query("refundTransactions")
        .withIndex("by_case", (q) => q.eq("caseId", caseId))
        .collect();

      // events.caseId is optional; index is (caseId, sequenceNumber)
      const events = await ctx.db
        .query("events")
        .withIndex("by_case_sequence", (q) => q.eq("caseId", caseId))
        .collect();

      if (!dryRun) {
        for (const r of evidence) await ctx.db.delete(r._id);
        for (const r of rulings) await ctx.db.delete(r._id);
        for (const r of feedback) await ctx.db.delete(r._id);
        for (const r of steps) await ctx.db.delete(r._id);
        for (const r of refunds) await ctx.db.delete(r._id);
        for (const r of events) await ctx.db.delete(r._id);
        await ctx.db.delete(caseId);
      }

      deletedCases += 1;
      deletedEvidence += evidence.length;
      deletedRulings += rulings.length;
      deletedFeedback += feedback.length;
      deletedWorkflowSteps += steps.length;
      deletedRefundTransactions += refunds.length;
      deletedEvents += events.length;
    }

    return {
      scanned: pageRes.page.length,
      deletedCases,
      deletedEvidence,
      deletedRulings,
      deletedEvents,
      deletedFeedback,
      deletedWorkflowSteps,
      deletedRefundTransactions,
      cursor: pageRes.continueCursor,
      isDone: pageRes.isDone,
      dryRun,
    };
  },
});

/**
 * Secret-gated runner for purgeNonPaymentCasesAndOrphans.
 */
export const runPurgeNonPaymentCasesAndOrphans = mutation({
  args: {
    secret: v.string(),
    dryRun: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const expected = process.env.MIGRATIONS_SECRET;
    if (!expected) throw new Error("MIGRATIONS_SECRET is not configured");
    if (args.secret !== expected) throw new Error("Unauthorized");

    const i = internal as any;
    return await ctx.runMutation(i.cases.purgeNonPaymentCasesAndOrphans, {
      dryRun: args.dryRun,
      limit: args.limit,
      cursor: args.cursor,
    });
  },
});

export const getCasesByStatus = query({
  args: {
    status: v.union(
      v.literal("FILED"),
      v.literal("ANALYZED"),
      v.literal("IN_REVIEW"),
      v.literal("DECIDED"),
      v.literal("CLOSED")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cases")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const getCasesByParty = query({
  args: { party: v.string() },
  handler: async (ctx, args) => {
    // Query using indexes for performance (instead of loading all cases)
    const asPlaintiff = await ctx.db
      .query("cases")
      .withIndex("by_plaintiff", (q) => q.eq("plaintiff", args.party))
      .collect();
    
    const asDefendant = await ctx.db
      .query("cases")
      .withIndex("by_defendant", (q) => q.eq("defendant", args.party))
      .collect();
    
    // Combine results and sort by filed date (newest first)
    const allCases = [...asPlaintiff, ...asDefendant];
    return allCases.sort((a, b) => b.filedAt - a.filedAt);
  },
});

export const getCasesByPlaintiff = query({
  args: { 
    plaintiffDid: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const allCases = await ctx.db
      .query("cases")
      .order("desc")
      .collect();
    
    return allCases
      .filter((c) => c.plaintiff === args.plaintiffDid)
      .slice(0, args.limit ?? 50);
  },
});

export const getCasesByDefendant = query({
  args: { 
    defendantDid: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const allCases = await ctx.db
      .query("cases")
      .order("desc")
      .collect();
    
    return allCases
      .filter((c) => c.defendant === args.defendantDid)
      .slice(0, args.limit ?? 50);
  },
});

export const getRecentCases = query({
  args: { 
    limit: v.optional(v.number()),
    mockOnly: v.optional(v.boolean()), // Filter for demo data only
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("cases")
      .withIndex("by_filed_at")
      .order("desc");
    
    // Filter for mock/demo data if requested
    if (args.mockOnly === true) {
      query = query.filter((q) => q.eq(q.field("mock"), true));
    }
    
    return await query.take(args.limit ?? 20);
  },
});

/**
 * Public registry feed: recent PAYMENT cases with a minimal, wallet-first-oriented shape.
 * Used by the Convex HTTP route GET /live/feed.
 */
export const listLiveFeedCases = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
    merchant: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(args.limit ?? 20, 200));
    const status = typeof args.status === "string" && args.status.trim() ? args.status.trim() : null;
    const merchant = typeof args.merchant === "string" && args.merchant.trim() ? args.merchant.trim() : null;

    let rows = await ctx.db
      .query("cases")
      .withIndex("by_filed_at")
      .order("desc")
      .take(limit);

    rows = rows.filter((c: any) => c?.type === "PAYMENT");

    if (status) {
      rows = rows.filter((c: any) => c?.status === status);
    }
    if (merchant) {
      rows = rows.filter((c: any) => c?.defendant === merchant || c?.metadata?.v1?.merchant === merchant);
    }

    const cases = rows.map((c: any) => {
      const buyer = c?.metadata?.v1?.buyer ?? c?.plaintiff ?? null;
      const merchant = c?.metadata?.v1?.merchant ?? c?.defendant ?? null;
      const reason = c?.metadata?.v1?.reason ?? c?.paymentDetails?.disputeReason ?? null;
      const currency = c?.currency ?? (c?.metadata?.v1?.chain ? "USDC" : null);
      const amountMicrousdc =
        typeof c?.metadata?.v1?.amountMicrousdc === "number"
          ? c.metadata.v1.amountMicrousdc
          : (typeof c?.amount === "number" && (currency === "USDC" || currency === "USD"))
            ? Math.round(c.amount * 1_000_000)
            : null;

      return {
        caseId: c._id,
        filedAt: c.filedAt,
        status: c.status,
        buyer,
        merchant,
        reason,
        amountMicrousdc,
        currency,
      };
    });

    return { cases };
  },
});

export const getOrganizationCases = query({
  args: { 
    organizationId: v.id("organizations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get all agents in the organization
    const orgAgents = await ctx.db
      .query("agents")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    
    // Get both DIDs and wallet addresses for matching
    const agentDids = orgAgents.map(a => a.did);
    const agentWalletKeySet = new Set<string>();
    for (const a of orgAgents) {
      if (!a.walletAddress) continue;
      for (const k of walletMatchKeys(a.walletAddress)) agentWalletKeySet.add(normalizeWalletIndexKey(k));
    }
    
    // Get cases where organization is the reviewer (payment disputes)
    const reviewerCases = await ctx.db
      .query("cases")
      .withIndex("by_reviewer_org", (q) => q.eq("reviewerOrganizationId", args.organizationId))
      .order("desc")
      .take(args.limit ?? 100);
    
    // Get cases where any org agent is plaintiff or defendant
    const agentCases = await ctx.db
      .query("cases")
      .withIndex("by_filed_at")
      .order("desc")
      .take(args.limit ?? 100);
    
    // Combine and deduplicate cases
    const caseMap = new Map();
    
    // Add reviewer cases first (payment disputes where org is reviewer)
    for (const c of reviewerCases) {
      caseMap.set(c._id, c);
    }
    
    // Add cases where org's agents are involved (check both DID and wallet address)
    for (const c of agentCases) {
      const plaintiffKey = typeof c.plaintiff === "string" ? normalizeWalletIndexKey(c.plaintiff) : "";
      const defendantKey = typeof c.defendant === "string" ? normalizeWalletIndexKey(c.defendant) : "";
      const plaintiffMatch = c.plaintiff && (
        agentDids.includes(c.plaintiff) || 
        (plaintiffKey ? agentWalletKeySet.has(plaintiffKey) : false)
      );
      const defendantMatch = c.defendant && (
        agentDids.includes(c.defendant) || 
        (defendantKey ? agentWalletKeySet.has(defendantKey) : false)
      );
      
      if (plaintiffMatch || defendantMatch) {
        caseMap.set(c._id, c);
      }
    }
    
    // Convert back to array and sort by filed date
    const allCases = Array.from(caseMap.values());
    allCases.sort((a, b) => b.filedAt - a.filedAt);
    
    // Limit results
    return allCases.slice(0, args.limit ?? 10);
  },
});

// Backfill mutation for missing reviewerOrganizationId
export const backfillReviewerOrgId = mutation({
  args: {
    caseId: v.id("cases"),
    reviewerOrganizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.caseId, {
      reviewerOrganizationId: args.reviewerOrganizationId,
    });
    return { success: true };
  },
});

/**
 * Assign unassigned payment disputes to an org for a given agent wallet address.
 *
 * Policy:
 * - Only disputes filed at or after org.createdAt are eligible.
 * - After assignment, we attempt to charge the $0.05 fee from org credits.
 * - AI is only triggered if fee is successfully charged and org AI is enabled.
 */
export const assignUnassignedDisputesToOrgForWallet = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    walletAddress: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const keys = walletMatchKeys(args.walletAddress);
    return await assignUnassignedPaymentCasesToOrgForWalletKeys(ctx, {
      organizationId: args.organizationId,
      walletKeys: keys,
      limit: args.limit ?? 500,
    });
  },
});

/**
 * Assign unassigned payment disputes using a mapped merchant wallet (merchantWallets).
 * This is the marketplace/proxy path: the liable org may differ from the wallet's “profile”.
 */
export const assignUnassignedDisputesToOrgForMerchantWallet = internalMutation({
  args: {
    walletCaip10: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const wallet = normalizeWalletIndexKey(args.walletCaip10);
    if (!wallet || !wallet.includes(":")) throw new Error("walletCaip10 must be CAIP-10");

    const mapping = await ctx.db
      .query("merchantWallets")
      .withIndex("by_wallet", (q: any) => q.eq("walletCaip10", wallet))
      .first();
    if (!mapping?.liableOrganizationId) {
      return { success: false, code: "NOT_MAPPED" as const };
    }

    return await assignUnassignedPaymentCasesToOrgForWalletKeys(ctx, {
      organizationId: mapping.liableOrganizationId,
      walletKeys: walletMatchKeys(wallet),
      limit: args.limit ?? 500,
    });
  },
});

// Internal version for workflows (workflows can only call internal functions)
export const updateCaseStatus = internalMutation({
  args: {
    caseId: v.id("cases"),
    status: v.union(
      v.literal("FILED"),
      v.literal("ANALYZED"),
      v.literal("AUTORULED"),
      v.literal("IN_REVIEW"),
      v.literal("PANELED"),
      v.literal("DECIDED"),
      v.literal("CLOSED")
    ),
  },
  handler: async (ctx, args) => {
    const case_ = await ctx.db.get(args.caseId);
    if (!case_) {
      throw new Error("Case not found");
    }

    await ctx.db.patch(args.caseId, { status: args.status });

    // Log custody event
    await createCustodyEvent(ctx, {
      type: "CASE_STATUS_UPDATED",
      caseId: args.caseId,
      agentDid: undefined, // system action
      payload: {
        oldStatus: case_.status,
        newStatus: args.status,
      },
    });

    return args.caseId;
  },
});

// Public mutation for migrations and admin operations
export const updateCaseStatusPublic = mutation({
  args: {
    caseId: v.id("cases"),
    status: v.union(
      v.literal("FILED"),
      v.literal("ANALYZED"),
      v.literal("AUTORULED"),
      v.literal("IN_REVIEW"),
      v.literal("PANELED"),
      v.literal("DECIDED"),
      v.literal("CLOSED")
    ),
  },
  handler: async (ctx, args) => {
    const case_ = await ctx.db.get(args.caseId);
    if (!case_) {
      throw new Error("Case not found");
    }

    await ctx.db.patch(args.caseId, { status: args.status });

    // Log custody event
    await createCustodyEvent(ctx, {
      type: "CASE_STATUS_UPDATED",
      caseId: args.caseId,
      agentDid: undefined, // system action
      payload: {
        oldStatus: case_.status,
        newStatus: args.status,
      },
    });

    return args.caseId;
  },
});

// Update case ruling - for autoRule integration
export const updateCaseRuling = mutation({
  args: {
    caseId: v.id("cases"),
    ruling: v.object({
      verdict: v.string(),
      winner: v.optional(v.string()),  // Agent DID of winner
      auto: v.boolean(),
      decidedAt: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const case_ = await ctx.db.get(args.caseId);
    if (!case_) {
      throw new Error("Case not found");
    }

    // Update case with final verdict
    await ctx.db.patch(args.caseId, {
      finalVerdict: args.ruling.verdict,
      decidedAt: args.ruling.decidedAt,
      status: "DECIDED",
      ruling: args.ruling, // Store ruling data on the case object
    });

    // Update reputation for both parties if we have a winner
    if (args.ruling.winner && case_.plaintiff && case_.defendant) {
      const isSLAViolation = case_.category?.toLowerCase().includes("sla") || false;

      // Update plaintiff reputation
      await ctx.scheduler.runAfter(0, api.agents.updateAgentReputation as any, {
        agentDid: case_.plaintiff,
        role: "plaintiff",
        outcome: args.ruling.winner === case_.plaintiff ? "won" : "lost",
        slaViolation: isSLAViolation && args.ruling.winner === case_.plaintiff,
      });

      // Update defendant reputation  
      await ctx.scheduler.runAfter(0, api.agents.updateAgentReputation as any, {
        agentDid: case_.defendant,
        role: "defendant",
        outcome: args.ruling.winner === case_.defendant ? "won" : "lost",
        slaViolation: isSLAViolation && args.ruling.winner !== case_.defendant,
      });
    }

    // Log custody event
    await createCustodyEvent(ctx, {
      type: "CASE_DECIDED",
      caseId: args.caseId,
      agentDid: undefined, // system action
      payload: {
        verdict: args.ruling.verdict,
        auto: args.ruling.auto,
        winner: args.ruling.winner,
      },
    });

    console.info(`Case ${args.caseId} ruling updated, reputation updates scheduled`);
  },
});

// Get cached system statistics (fast query - no expensive calculations)
export const getCachedSystemStats = query({
  args: {},
  handler: async (ctx) => {
    // Read from cache table - this is instant!
    const cachedStats = await ctx.db
      .query("systemStats")
      .withIndex("by_key", (q) => q.eq("key", "current"))
      .first();
    
    if (!cachedStats) {
      // Return default values if cache not yet populated
      return {
        totalAgents: 0,
        activeAgents: 0,
        totalCases: 0,
        resolvedCases: 0,
        pendingCases: 0,
        avgResolutionTimeMs: 0,
        avgResolutionTimeMinutes: 0,
        agentRegistrationsLast24h: 0,
        casesFiledLast24h: 0,
        casesResolvedLast24h: 0,
        lastUpdated: Date.now(),
        isCached: false,
      };
    }
    
    return {
      ...cachedStats,
      isCached: true,
    };
  },
});

/**
 * Store AI recommendation for agent disputes
 * (Payment disputes store in paymentDisputes table)
 */
export const storeAIRecommendation = mutation({
  args: {
    caseId: v.id("cases"),
    aiRecommendation: v.object({
      verdict: v.string(),
      confidence: v.number(),
      reasoning: v.string(),
      // Optional: partner flows can provide a 2-line summary for emails/UI.
      summary2: v.optional(v.string()),
      analyzedAt: v.number(),
      similarCases: v.array(v.id("cases")),
      refundAmountMicrousdc: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.caseId, {
      aiRecommendation: args.aiRecommendation,
    });

    console.info(
      `AI recommendation stored for case ${args.caseId}: ${args.aiRecommendation.verdict} ` +
      `(confidence: ${(args.aiRecommendation.confidence * 100).toFixed(1)}%)`
    );
  },
});
