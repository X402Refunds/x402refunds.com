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
  verdict: "UPHELD" | "DISMISSED" | "SPLIT" | "NEED_PANEL";
  confidence: number;
  code: string;
  reasons: string;
  auto: boolean;
  evidenceIds: string[];
}

// Simple rule-based decision engine
export const processCase = action({
  args: {
    caseData: v.object({
      id: v.string(),
      parties: v.array(v.string()),
      type: v.string(),
      jurisdictionTags: v.array(v.string())
    }),
    evidenceManifests: v.array(v.any())
  },
  handler: async (ctx, args): Promise<RuleResult> => {
    const { caseData, evidenceManifests } = args;
    
    // Simple rule-based logic
    let verdict: "UPHELD" | "DISMISSED" | "SPLIT" | "NEED_PANEL" = "NEED_PANEL";
    let confidence = 0.5;
    let code = "CASE_REVIEW_REQUIRED";
    let reasons = "Case requires human review for proper adjudication.";
    let auto = false;
    
    // Basic automated rules
    if (evidenceManifests.length === 0) {
      verdict = "DISMISSED";
      confidence = 0.9;
      code = "INSUFFICIENT_EVIDENCE";
      reasons = "Case dismissed due to lack of evidence.";
      auto = true;
    } else if (evidenceManifests.length >= 3) {
      // If substantial evidence, flag for panel review
      verdict = "NEED_PANEL";
      confidence = 0.7;
      code = "PANEL_REVIEW_REQUIRED";
      reasons = "Substantial evidence present, requires panel review.";
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
});

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
    
    // Process through court engine
    const result = await ctx.runAction("courtEngine:processCase", {
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
    await ctx.db.patch(args.caseId, {
      status: result.verdict === "NEED_PANEL" ? "PANELED" : "DECIDED",
      ruling: {
        verdict: result.verdict,
        auto: result.auto,
        decidedAt: Date.now()
      }
    });
    
    return { rulingId: ruling, result };
  }
});