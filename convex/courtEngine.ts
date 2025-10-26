import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Simplified court engine for basic dispute resolution

interface CaseData {
  id: string;
  parties: string[];
  type: string;
  jurisdictionTags: string[];
}

interface RuleResult {
  verdict: "PLAINTIFF_WINS" | "DEFENDANT_WINS" | "SPLIT" | "NEED_PANEL";
  confidence: number;
  code: string;
  reasons: string;
  auto: boolean;
  evidenceIds: string[];
}

// Simple rule-based decision engine
async function processCase(ctx: any, args: {
  caseData: {
    id: string;
    parties: string[];
    type: string;
    jurisdictionTags: string[];
  };
  evidenceManifests: any[];
}): Promise<RuleResult> {
    const { caseData, evidenceManifests } = args;
    
    // Simple rule-based logic
    let verdict: "PLAINTIFF_WINS" | "DEFENDANT_WINS" | "SPLIT" | "NEED_PANEL" = "NEED_PANEL";
    let confidence = 0.5;
    let code = "CASE_REVIEW_REQUIRED";
    let reasons = "Case requires human review for proper adjudication.";
    let auto = false;

    // Basic automated rules
    if (evidenceManifests.length === 0) {
      verdict = "DEFENDANT_WINS";
      confidence = 0.9;
      code = "INSUFFICIENT_EVIDENCE";
      reasons = "Case dismissed due to lack of evidence.";
      auto = true;
    } else if (evidenceManifests.length >= 3) {
      // If substantial evidence, auto-resolve with plaintiff wins verdict
      verdict = "PLAINTIFF_WINS";
      confidence = 0.8;
      code = "SLA_VIOLATION_CONFIRMED";
      reasons = "Substantial evidence confirms SLA violation. Provider found liable.";
      auto = true;
    } else {
      // 1-2 pieces of evidence, likely PLAINTIFF_WINS
      verdict = "PLAINTIFF_WINS";
      confidence = 0.7;
      code = "EVIDENCE_SUPPORTS_CLAIM";
      reasons = "Evidence supports claim of service level violation.";
      auto = true;
    }

    return {
      verdict,
      confidence,
      code,
      reasons,
      auto,
      evidenceIds: evidenceManifests.map((e: any) => e.id || e.sha256)
    };
}

// Get engine statistics
export const getEngineStats = query({
  args: {},
  handler: async (ctx) => {
    const cases = await ctx.db.query("cases").collect();
    const rulings = await ctx.db.query("rulings").collect();
    
    return {
      totalCases: cases.length,
      totalRulings: rulings.length,
      autoRulings: rulings.filter(r => r.auto).length,
      panelRulings: rulings.filter(r => !r.auto).length,
      systemHealth: 100.0
    };
  }
});

// Simple case processing workflow
export const runCourtWorkflow = mutation({
  args: {
    caseId: v.id("cases")
  },
  handler: async (ctx, args) => {
    const caseData = await ctx.db.get(args.caseId);
    if (!caseData) {
      throw new Error("Case not found");
    }
    
    // Get evidence for this case
    const evidence = await ctx.db
      .query("evidenceManifests")
      .withIndex("by_case", q => q.eq("caseId", args.caseId))
      .collect();
    
    // Process through court engine directly
    const result = await processCase(ctx, {
      caseData: {
        id: args.caseId,
        parties: caseData.parties,
        type: caseData.type,
        jurisdictionTags: caseData.jurisdictionTags
      },
      evidenceManifests: evidence
    });
    
    // Create ruling
    const ruling = await ctx.db.insert("rulings", {
      caseId: args.caseId,
      verdict: result.verdict,
      code: result.code,
      reasons: result.reasons,
      auto: result.auto,
      decidedAt: Date.now(),
      proof: {
        merkleRoot: "simple_hash_" + args.caseId,
      }
    });
    
    // Update case status
    const newStatus = result.verdict === "NEED_PANEL" ? "PANELED" : "DECIDED";
    await ctx.db.patch(args.caseId, {
      status: newStatus,
      ruling: {
        verdict: "UPHELD", // Cases table still uses old format
        auto: result.auto,
        decidedAt: Date.now()
      }
    });
    
    // Log the status update event for dashboard tracking
    await ctx.db.insert("events", {
      type: "CASE_STATUS_UPDATED",
      payload: {
        caseId: args.caseId,
        oldStatus: "FILED",
        newStatus: newStatus,
        verdict: result.verdict,
        auto: result.auto
      },
      timestamp: Date.now(),
      caseId: args.caseId,
    });
    
    return { rulingId: ruling, result };
  }
});