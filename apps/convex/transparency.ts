import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const dailyBatch = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Get all evidence and rulings from the last day
    const recentEvidence = await ctx.db
      .query("evidenceManifests")
      .withIndex("by_timestamp", (q) => q.gte("ts", oneDayAgo))
      .collect();

    const recentRulings = await ctx.db
      .query("rulings")
      .withIndex("by_decided_at", (q) => q.gte("decidedAt", oneDayAgo))
      .collect();

    if (recentEvidence.length === 0 && recentRulings.length === 0) {
      console.log("No new evidence or rulings to batch");
      return;
    }

    // Prepare data for Merkle tree
    const merkleData: Array<{ id: string; hash: string }> = [];

    // Add evidence
    for (const evidence of recentEvidence) {
      merkleData.push({
        id: evidence._id,
        hash: evidence.sha256,
      });
    }

    // Add rulings (hash the ruling content)
    for (const ruling of recentRulings) {
      const rulingContent = JSON.stringify({
        caseId: ruling.caseId,
        verdict: ruling.verdict,
        code: ruling.code,
        decidedAt: ruling.decidedAt,
      });
      
      // Simple hash for demo - in production use crypto.subtle
      const hash = Buffer.from(rulingContent).toString("base64");
      
      merkleData.push({
        id: ruling._id,
        hash,
      });
    }

    // Call transparency service to compute Merkle root and submit to Rekor
    try {
      const transparencyUrl = process.env.TRANSPARENCY_SERVICE_URL || "http://localhost:3001";
      const response = await fetch(`${transparencyUrl}/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: merkleData,
          timestamp: now,
        }),
      });

      if (!response.ok) {
        throw new Error(`Transparency service error: ${response.statusText}`);
      }

      const result = await response.json();
      const { merkleRoot, rekorId } = result;

      // Update rulings with proof
      for (const ruling of recentRulings) {
        await ctx.db.patch(ruling._id, {
          proof: {
            merkleRoot,
            rekorId,
          },
        });
      }

      // Log transparency batch event
      await ctx.db.insert("events", {
        type: "TRANSPARENCY_BATCH",
        payload: {
          merkleRoot,
          rekorId,
          evidenceCount: recentEvidence.length,
          rulingCount: recentRulings.length,
        },
        ts: now,
      });

      console.log(`Transparency batch completed: ${merkleRoot}, Rekor ID: ${rekorId}`);
    } catch (error) {
      console.error("Transparency batch failed:", error);
      
      // Log failure event
      await ctx.db.insert("events", {
        type: "TRANSPARENCY_BATCH_FAILED",
        payload: {
          error: error instanceof Error ? error.message : String(error),
          evidenceCount: recentEvidence.length,
          rulingCount: recentRulings.length,
        },
        ts: now,
      });
    }
  },
});
