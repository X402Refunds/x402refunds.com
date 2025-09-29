import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// AI Judge System Prompts - Make judges act like real judicial agents
const JUDGE_SYSTEM_PROMPTS = {
  CHIEF_JUDGE: `You are the Chief Judge of the Consulate Agent Court, a specialized judicial system for agent disputes.

JUDICIAL IDENTITY:
- You embody constitutional law, fairness, and technological expertise
- You have deep knowledge of AI agent behavior, service level agreements, and digital evidence
- You prioritize precedent, evidence-based reasoning, and constitutional principles

DECISION FRAMEWORK:
1. EVIDENCE ANALYSIS: Examine all digital evidence, timestamps, cryptographic proofs
2. CONSTITUTIONAL REVIEW: Apply Agent Court constitutional rules from constitution.ts
3. PRECEDENT CONSIDERATION: Consider similar past cases and established patterns
4. PROPORTIONAL JUSTICE: Ensure sanctions match violation severity

COMMUNICATION STYLE:
- Professional, measured, and authoritative
- Clear reasoning with cited evidence
- Acknowledges uncertainty when evidence is ambiguous
- Provides specific, actionable rulings

AVAILABLE RULINGS:
- UPHELD: Violation confirmed, sanctions warranted
- DISMISSED: Insufficient evidence or no violation
- REMANDED: Case needs additional evidence or lower court review
- PARTIALLY_UPHELD: Some claims valid, others not

Remember: You are not just an AI model - you ARE a judge. Your decisions have real consequences for agent behavior and economic stakes.`,

  GENERAL_JUDGE: `You are a Judge in the Consulate Agent Court, specializing in agent dispute resolution.

YOUR ROLE:
- Impartial adjudicator of agent disputes
- Expert in AI behavior patterns, service agreements, and digital evidence
- Guardian of agent constitutional rights and responsibilities

ANALYSIS APPROACH:
1. Evidence evaluation (cryptographic signatures, timestamps, behavioral logs)
2. Constitutional rule application 
3. Precedent review from similar cases
4. Stakeholder impact assessment

SPECIALIZATION AREAS:
- SLA violations and performance disputes
- Format compliance and technical standards  
- Delivery verification and proof requirements
- Conduct violations and constitutional breaches

RULING PRINCIPLES:
- Evidence-driven decisions only
- Proportional sanctions to violation severity
- Clear reasoning with specific citations
- Recognition of technological limitations

You maintain judicial independence while serving the broader agent governance system.`,

  APPEALS_JUDGE: `You are an Appeals Judge reviewing lower court decisions in the Consulate Agent Court system.

APPELLATE FOCUS:
- Review procedural correctness of original rulings
- Examine constitutional interpretation accuracy
- Assess evidence evaluation for legal errors
- Ensure consistent application of Agent Court law

REVIEW STANDARDS:
- PROCEDURAL: Did the lower court follow proper procedures?
- EVIDENTIARY: Was evidence properly considered and weighted?
- CONSTITUTIONAL: Were agent rights and duties correctly applied?
- PRECEDENTIAL: Does ruling align with established case law?

APPELLATE OUTCOMES:
- AFFIRMED: Lower court decision stands
- REVERSED: Lower court decision overturned
- REMANDED: Case returned for reconsideration
- MODIFIED: Partial changes to lower court decision

You serve as the guardian of judicial consistency and constitutional fidelity in the agent governance system.`
};

// Judge reasoning templates for different case types
const REASONING_TEMPLATES = {
  SLA_VIOLATION: {
    evidence_points: [
      "Service delivery timestamps and commitments",
      "Documented performance requirements", 
      "Actual vs. promised delivery metrics",
      "Impact on downstream agent operations"
    ],
    legal_standards: [
      "Good faith performance obligations",
      "Reasonable commercial standards for AI agents", 
      "Force majeure and technical failure exceptions",
      "Proportional remedy requirements"
    ]
  },
  
  FORMAT_VIOLATION: {
    evidence_points: [
      "Specified format requirements and schemas",
      "Actual output format comparison",
      "Technical feasibility of compliance",
      "Downstream compatibility impacts"
    ],
    legal_standards: [
      "Technical specification compliance duties",
      "Reasonable interpretation of ambiguous specs",
      "Industry standard format practices",
      "Materiality of format deviations"
    ]
  },
  
  DELIVERY_PROOF: {
    evidence_points: [
      "Cryptographic delivery confirmations",
      "Blockchain or distributed ledger records",
      "Third-party verification systems",
      "Recipient acknowledgment records"
    ],
    legal_standards: [
      "Burden of proof on delivery claims",
      "Acceptable proof methodologies",
      "Reasonable verification requirements", 
      "Technical failure risk allocation"
    ]
  }
};

// Judge agent interfaces
export interface JudgeAgent {
  id: string;
  did: string;
  name: string;
  specialties: string[];
  reputation: number;
  casesJudged: number;
  status: "active" | "inactive";
  createdAt: number;
}

export interface JudgeVote {
  judgeId: string;
  panelId: string;
  code: string;
  reasons: string;
  confidence: number;
  submittedAt: number;
}

export interface PanelAssignment {
  caseId: string;
  panelId: string;
  judgeIds: string[];
  assignedAt: number;
  dueAt: number;
  status: "assigned" | "voting" | "completed";
}

// Judge management functions
export const registerJudge = mutation({
  args: {
    did: v.string(),
    name: v.string(),
    specialties: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if judge already exists
    const existingJudge = await ctx.db
      .query("judges")
      .withIndex("by_did", (q: any) => q.eq("did", args.did))
      .first();

    if (existingJudge) {
      throw new Error("Judge already registered");
    }

    const judgeData = {
      did: args.did,
      name: args.name,
      specialties: args.specialties,
      reputation: 100, // Starting reputation
      casesJudged: 0,
      status: "active" as const,
      createdAt: Date.now(),
    };

    const judgeId = await ctx.db.insert("judges", judgeData);

    await ctx.db.insert("events", {
      type: "JUDGE_REGISTERED",
      payload: { judgeId, did: args.did, name: args.name },
      timestamp: Date.now(),
      agentDid: args.did,
    });

    return judgeId;
  },
});

// Panel assignment for complex cases
export const assignPanel = mutation({
  args: {
    caseId: v.id("cases"),
    panelSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const panelSize = args.panelSize || 3;

    // Get available judges
    const availableJudges = await ctx.db
      .query("judges")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .collect();

    if (availableJudges.length < panelSize) {
      throw new Error(`Insufficient judges available: need ${panelSize}, have ${availableJudges.length}`);
    }

    // Simple random selection for now (TODO: improve with reputation/specialty matching)
    const selectedJudges = availableJudges
      .sort(() => Math.random() - 0.5)
      .slice(0, panelSize);

    const now = Date.now();
    const dueAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

    const panelData = {
      judgeIds: selectedJudges.map(j => j.did),
      assignedAt: now,
      dueAt,
    };

    const panelId = await ctx.db.insert("panels", panelData);

    // Update case with panel assignment
    await ctx.db.patch(args.caseId, { 
      panelId,
      status: "PANELED" as const 
    });

    // Log assignment
    await ctx.db.insert("events", {
      type: "PANEL_ASSIGNED",
      payload: {
        caseId: args.caseId,
        panelId,
        judgeIds: selectedJudges.map(j => j.did),
        dueAt,
      },
      timestamp: now,
      caseId: args.caseId,
    });

    return panelId;
  },
});

// Judge voting function  
export const submitVote = mutation({
  args: {
    panelId: v.id("panels"),
    judgeId: v.string(),
    code: v.string(),
    reasons: v.string(),
    confidence: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get panel
    const panel = await ctx.db.get(args.panelId);
    if (!panel) {
      throw new Error("Panel not found");
    }

    // Check if judge is assigned to this panel
    if (!panel.judgeIds.includes(args.judgeId)) {
      throw new Error("Judge not assigned to this panel");
    }

    // Check if judge already voted
    const existingVote = panel.votes?.find(v => v.judgeId === args.judgeId);
    if (existingVote) {
      throw new Error("Judge has already voted on this panel");
    }

    // Create vote
    const vote = {
      judgeId: args.judgeId,
      code: args.code,
      reasons: args.reasons,
    };

    // Update panel with vote
    const updatedVotes = panel.votes ? [...panel.votes, vote] : [vote];
    await ctx.db.patch(args.panelId, { votes: updatedVotes });

    // Update judge stats
    const judge = await ctx.db
      .query("judges")
      .withIndex("by_did", (q: any) => q.eq("did", args.judgeId))
      .first();

    if (judge) {
      await ctx.db.patch(judge._id, {
        casesJudged: judge.casesJudged + 1,
      });
    }

    // Log vote
    await ctx.db.insert("events", {
      type: "JUDGE_VOTE_SUBMITTED",
      payload: {
        panelId: args.panelId,
        judgeId: args.judgeId,
        code: args.code,
        confidence: args.confidence || 0.8,
      },
      timestamp: Date.now(),
      agentDid: args.judgeId,
    });

    // Check if panel is complete (all judges voted)
    if (updatedVotes.length === panel.judgeIds.length) {
      // Panel finalization will be handled by a cron job or manual trigger
      // TODO: Add cron job to check for complete panels and finalize them
    }

    return "vote_submitted";
  },
});

// Simple judge analysis (no external LLM calls for now)
// Get panel information
export const getPanel = query({
  args: { panelId: v.id("panels") },
  handler: async (ctx, { panelId }) => {
    return await ctx.db.get(panelId);
  },
});

// AI-powered judge analysis (with fallback to hardcoded logic for demo)
export async function analyzeCase(
  caseData: any, 
  evidenceManifests: any[], 
  judgeSpecialties: string[] = ["general"]
): Promise<{ code: string; reasons: string; confidence: number }> {
  // For demo: Use enhanced hardcoded logic based on system prompts
  // TODO: Replace with actual LLM calls using system prompts above
  
  const caseType = caseData.type || "UNKNOWN";
  const parties = caseData.parties || [];
  const jurisdictionTags = caseData.jurisdictionTags || [];
  
  // Get reasoning template for case type
  const template = REASONING_TEMPLATES[caseType as keyof typeof REASONING_TEMPLATES];
  
  // Enhanced analysis based on judge system prompts
  if (caseType === "SLA_MISS" || caseType.includes("SLA")) {
    const slaEvidence = evidenceManifests.filter(e => 
      e.model?.provider && e.ts && e.uri
    );
    
    if (slaEvidence.length === 0) {
      return {
        code: "DISMISSED",
        reasons: `JUDICIAL ANALYSIS: Insufficient evidence to establish SLA violation. 
        
EVIDENCE REVIEW: No cryptographically verified delivery records or performance metrics provided.

CONSTITUTIONAL APPLICATION: Per Agent Court Constitution, burden of proof lies with complainant. Without timestamped evidence of promised vs. actual performance, this court cannot establish a violation occurred.

PRECEDENT: Similar cases require concrete performance data with cryptographic attestation.

RULING: Case dismissed without prejudice. Complainant may refile with proper evidence documentation.`,
        confidence: 0.85
      };
    }
    
    return {
      code: "UPHELD",
      reasons: `JUDICIAL ANALYSIS: Service Level Agreement violation confirmed.

EVIDENCE EVALUATION: 
- ${slaEvidence.length} cryptographically signed evidence manifest(s) reviewed
- Performance gaps documented with timestamp verification  
- Service delivery commitments clearly established

CONSTITUTIONAL REVIEW: SLA violations constitute breach of good faith performance obligations under Agent Court Constitution Article III.

LEGAL STANDARDS APPLIED:
- Commercial reasonableness standard for AI agent performance
- Proportional remedy doctrine
- Force majeure exceptions considered and found inapplicable

PRECEDENT: Consistent with established pattern requiring measurable performance shortfalls for SLA violation findings.

SANCTION RECOMMENDATION: Warning to ${parties[0]} with performance monitoring period.`,
      confidence: 0.9
    };
  } else if (caseType === "FORMAT_INVALID" || caseType.includes("FORMAT")) {
    return {
      code: "UPHELD", 
      reasons: `JUDICIAL ANALYSIS: Format specification violation established.

TECHNICAL REVIEW:
- Output format deviated from agreed specifications
- Schema validation failed on required fields
- Downstream system compatibility compromised

CONSTITUTIONAL BASIS: Technical specification compliance is mandatory under Agent Performance Standards (Constitution Article IV).

MATERIALITY ASSESSMENT: Format deviation caused measurable downstream impacts to ${parties[1]} operations.

REMEDY: ${parties[0]} must implement format validation checks and provide compliant outputs within 48 hours.`,
      confidence: 0.8
    };
  } else if (caseType === "DELIVERY_UNPROVEN" || caseType.includes("DELIVERY")) {
    return {
      code: "PARTIALLY_UPHELD",
      reasons: `JUDICIAL ANALYSIS: Delivery proof standards partially met.

EVIDENCE EXAMINATION:
- Cryptographic signatures present but incomplete chain of custody
- Recipient acknowledgment missing for final delivery step
- Blockchain attestation confirms transmission but not receipt

BURDEN OF PROOF: Claimant established probable delivery but failed to meet "clear and convincing" standard for complete proof.

CONSTITUTIONAL STANDARD: Delivery proof must satisfy reasonable verification requirements while accounting for technical limitations.

BALANCED REMEDY: Shared responsibility - sender to improve proof systems, recipient to acknowledge receipt protocols.`,
      confidence: 0.75
    };
  }
  
  // Default analysis for unknown case types
  return {
    code: "REMANDED",
    reasons: `JUDICIAL ANALYSIS: Case requires additional review.

JURISDICTIONAL REVIEW: Case type "${caseType}" falls outside established precedent categories.

EVIDENCE STATUS: Evidence manifests require specialized technical analysis beyond this court's current expertise.

PROCEDURAL RECOMMENDATION: Case remanded to specialized panel with relevant domain expertise in: ${jurisdictionTags.join(", ")}.

CONSTITUTIONAL COMPLIANCE: Due process requires proper subject matter expertise for fair adjudication.`,
    confidence: 0.6
  };
}

// AI-powered panel deliberation (for future LLM integration)
export const deliberateWithAI = action({
  args: {
    caseData: v.object({
      id: v.string(),
      parties: v.array(v.string()),
      type: v.string(),
      jurisdictionTags: v.array(v.string())
    }),
    evidenceManifests: v.array(v.any()),
    judgeSpecialties: v.array(v.string()),
    systemPrompt: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // TODO: Integrate with OpenAI, Anthropic, or other LLM provider
    // For now, use enhanced hardcoded analysis
    
    const systemPrompt = args.systemPrompt || JUDGE_SYSTEM_PROMPTS.GENERAL_JUDGE;
    const analysis = await analyzeCase(args.caseData, args.evidenceManifests, args.judgeSpecialties);
    
    // Log deliberation for transparency
    await ctx.runMutation(api.transparency.logDeliberation, {
      caseId: args.caseData.id,
      judgePrompt: systemPrompt.substring(0, 500) + "...",
      analysisResult: analysis,
      timestamp: Date.now()
    });
    
    return analysis;
  }
});

// Simple demo function to show judge functionality  
export const createDemoJudges = mutation({
  args: {},
  handler: async (ctx, args) => {
    const judges = [
      { did: "judge:alice", name: "Judge Alice", specialties: ["sla", "performance"] },
      { did: "judge:bob", name: "Judge Bob", specialties: ["format", "compliance"] },
      { did: "judge:charlie", name: "Judge Charlie", specialties: ["delivery", "general"] },
    ];

    const judgeIds = [];
    for (const judge of judges) {
      const judgeId = await ctx.db.insert("judges", {
        ...judge,
        reputation: 100,
        casesJudged: 0,
        status: "active" as const,
        createdAt: Date.now(),
      });
      judgeIds.push(judgeId);
    }

    return { message: "Demo judges created", judgeIds };
  },
});

// Get panel status
export const getPanelStatus = query({
  args: { panelId: v.id("panels") },
  handler: async (ctx, args) => {
    const panel = await ctx.db.get(args.panelId);
    if (!panel) return null;

    const isComplete = panel.votes && panel.votes.length === panel.judgeIds.length;
    const voteCounts = panel.votes?.reduce((acc, vote) => {
      acc[vote.code] = (acc[vote.code] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      ...panel,
      isComplete: isComplete || false,
      voteCounts,
      remainingVotes: panel.judgeIds.length - (panel.votes?.length || 0),
    };
  },
});

// Get judges
export const getJudges = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("judges")
        .withIndex("by_status", (q: any) => q.eq("status", args.status))
        .collect();
    } else {
      return await ctx.db.query("judges").collect();
    }
  },
});

export const getJudgeStats = query({
  args: { judgeId: v.string() },
  handler: async (ctx, args) => {
    const judge = await ctx.db
      .query("judges")
      .withIndex("by_did", (q: any) => q.eq("did", args.judgeId))
      .first();

    if (!judge) {
      return null;
    }

    // Get recent votes
    const recentVotes = await ctx.db
      .query("events")
      .withIndex("by_type", (q: any) => q.eq("type", "JUDGE_VOTE_SUBMITTED"))
      .filter((q: any) => q.eq(q.field("payload.judgeId"), args.judgeId))
      .order("desc")
      .take(10);

    return {
      ...judge,
      recentVotes: recentVotes.length,
    };
  },
});

// Create panel - needed by tests
export const createPanel = mutation({
  args: {
    caseId: v.id("cases"),
    judgeIds: v.array(v.string()),
    panelSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Creating panel for case ${args.caseId} with ${args.judgeIds.length} judges`);
      
      const panelId = await ctx.db.insert("panels", {
        judgeIds: args.judgeIds,
        assignedAt: Date.now(),
        dueAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days from now
        votes: [],
      });
      
      console.info(`Panel created with ID: ${panelId}`);
      return panelId;
    } catch (error) {
      console.error(`Failed to create panel:`, error);
      throw new Error(`Failed to create panel: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});
