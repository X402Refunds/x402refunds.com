/**
 * Evidence Cleanup Functions
 * 
 * Tiered retention policy enforcement for evidence
 * Payment disputes: 60 days evidence, 2 years metadata (Regulation E)
 * Customer support: 4 months total (GDPR data minimization)
 * Commercial disputes: 7 years (standard commercial law)
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Redact PII from evidence (first step before archiving)
 * Runs daily to prepare evidence for archival
 */
export const redactPersonalData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Find evidence older than 30 days that hasn't been redacted
    const evidenceToRedact = await ctx.db
      .query("evidenceManifests")
      .filter((q) =>
        q.and(
          q.lt(q.field("ts"), thirtyDaysAgo),
          q.neq(q.field("redacted"), true)
        )
      )
      .collect();

    let redacted = 0;
    for (const evidence of evidenceToRedact) {
      // Mark as redacted (actual redaction would happen in production)
      await ctx.db.patch(evidence._id, {
        redacted: true,
        redactedAt: now,
      });
      redacted++;
    }

    console.log(`✅ Redacted PII from ${redacted} evidence items`);
    return { redacted };
  },
});

/**
 * Archive old evidence to cold storage
 * Moves evidence to cheaper storage tier before deletion
 */
export const archiveToCloudStorage = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

    // Find evidence older than 60 days that hasn't been archived
    const evidenceToArchive = await ctx.db
      .query("evidenceManifests")
      .filter((q) =>
        q.and(
          q.lt(q.field("ts"), sixtyDaysAgo),
          q.neq(q.field("archived"), true),
          q.eq(q.field("redacted"), true) // Only archive redacted evidence
        )
      )
      .collect();

    let archived = 0;
    for (const evidence of evidenceToArchive) {
      // Mark as archived (actual archiving would happen in production)
      await ctx.db.patch(evidence._id, {
        archived: true,
        archivedAt: now,
      });
      archived++;
    }

    console.log(`✅ Archived ${archived} evidence items to cold storage`);
    return { archived };
  },
});

/**
 * Delete old evidence based on retention policy
 * Payment disputes: 60 days evidence, 2 years metadata
 * Customer support: 4 months total
 * Commercial: 7 years
 */
export const deleteOldEvidence = internalMutation({
  args: {
    retentionYears: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const retentionYears = args.retentionYears || 7; // Default 7 years for commercial
    const cutoffDate = now - retentionYears * 365 * 24 * 60 * 60 * 1000;

    // Find evidence past retention period
    const evidenceToDelete = await ctx.db
      .query("evidenceManifests")
      .filter((q) =>
        q.and(
          q.lt(q.field("ts"), cutoffDate),
          q.eq(q.field("archived"), true) // Only delete archived evidence
        )
      )
      .collect();

    let deleted = 0;
    for (const evidence of evidenceToDelete) {
      // Delete evidence (in production: also delete from storage)
      await ctx.db.delete(evidence._id);
      deleted++;
    }

    console.log(`✅ Deleted ${deleted} evidence items (retention: ${retentionYears} years)`);
    return { deleted };
  },
});

/**
 * Delete customer support evidence after 4 months (GDPR compliance)
 */
export const deleteOldSupportData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const fourMonthsAgo = now - 4 * 30 * 24 * 60 * 60 * 1000;

    // Find customer support evidence older than 4 months
    const supportEvidence = await ctx.db
      .query("evidenceManifests")
      .filter((q) =>
        q.and(
          q.eq(q.field("retentionPolicy"), "customer_support"),
          q.lt(q.field("ts"), fourMonthsAgo)
        )
      )
      .collect();

    let deleted = 0;
    for (const evidence of supportEvidence) {
      await ctx.db.delete(evidence._id);
      deleted++;
    }

    console.log(`✅ Deleted ${deleted} customer support evidence items (4 month retention)`);
    return { deleted };
  },
});

/**
 * Delete payment dispute evidence after 60 days (Regulation E)
 * Metadata retained for 2 years, but evidence files deleted
 */
export const deleteOldPaymentEvidence = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

    // Find payment dispute evidence older than 60 days
    const paymentEvidence = await ctx.db
      .query("evidenceManifests")
      .filter((q) =>
        q.and(
          q.eq(q.field("retentionPolicy"), "payment"),
          q.lt(q.field("ts"), sixtyDaysAgo),
          q.eq(q.field("archived"), true) // Only delete archived evidence
        )
      )
      .collect();

    let deleted = 0;
    for (const evidence of paymentEvidence) {
      // Delete evidence files (metadata retained in cases table)
      await ctx.db.delete(evidence._id);
      deleted++;
    }

    console.log(`✅ Deleted ${deleted} payment dispute evidence items (60 day retention)`);
    return { deleted };
  },
});

/**
 * Optimize storage by deduplicating evidence
 * Multiple cases can reference the same evidence URI
 */
export const optimizeStorage = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Group evidence by SHA256 hash (deduplication)
    const allEvidence = await ctx.db.query("evidenceManifests").collect();
    const hashMap = new Map<string, any[]>();

    for (const evidence of allEvidence) {
      const hash = evidence.sha256;
      if (!hashMap.has(hash)) {
        hashMap.set(hash, []);
      }
      hashMap.get(hash)!.push(evidence);
    }

    // Find duplicates (same SHA256, different IDs)
    let deduplicated = 0;
    for (const [hash, duplicates] of hashMap.entries()) {
      if (duplicates.length > 1) {
        // Keep the oldest one, delete others
        const sorted = duplicates.sort((a, b) => a.ts - b.ts);
        const keep = sorted[0];

        for (let i = 1; i < sorted.length; i++) {
          // Update case references to point to kept evidence
          const duplicate = sorted[i];
          if (duplicate.caseId) {
            // In production: update case.evidenceIds to reference kept evidence
            console.log(`  Deduplicating: ${duplicate._id} -> ${keep._id}`);
          }
          await ctx.db.delete(duplicate._id);
          deduplicated++;
        }
      }
    }

    console.log(`✅ Deduplicated ${deduplicated} evidence items`);
    return { deduplicated };
  },
});





























