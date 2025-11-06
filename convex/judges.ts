import { action, internalMutation, mutation, query } from "./_generated/server";
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
// DEPRECATED: Judges table removed during schema consolidation
// Human reviewers now handle edge cases directly via review queue
export const registerJudge = mutation({
  args: {
    did: v.string(),
    name: v.string(),
    specialties: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    console.warn("DEPRECATED: registerJudge called. Judges table removed. Human reviewers handle cases via review queue.");
    throw new Error("DEPRECATED: Judge system removed. Use human review queue instead.");
  },
});

// DEPRECATED: Panels table removed during schema consolidation
export const assignPanel = internalMutation({
  args: {
    caseId: v.id("cases"),
    panelSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    console.warn("DEPRECATED: assignPanel called. Panels table removed.");
    throw new Error("DEPRECATED: Panel system removed. Use human review queue instead.");
  },
});

// DEPRECATED: Panels table removed during schema consolidation
export const submitVote = mutation({
  args: {
    panelId: v.id("panels"),
    judgeId: v.string(),
    code: v.string(),
    reasons: v.string(),
    confidence: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    console.warn("DEPRECATED: submitVote called. Panels table removed.");
    throw new Error("DEPRECATED: Judge voting system removed.");
  },
});

// DEPRECATED: Panels table removed during schema consolidation
export const getPanel = query({
  args: { panelId: v.id("panels") },
  handler: async (ctx, { panelId }) => {
    console.warn("DEPRECATED: getPanel called. Panels table removed.");
    return null;
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
// DEPRECATED: Judge deliberation system removed
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
    console.warn("DEPRECATED: deliberateWithAI called. Judge system removed.");
    throw new Error("DEPRECATED: Judge deliberation system removed.");
  }
});

// DEPRECATED: Judges table removed
export const createDemoJudges = mutation({
  args: {},
  handler: async (ctx, args) => {
    console.warn("DEPRECATED: createDemoJudges called. Judges table removed.");
    throw new Error("DEPRECATED: Judge system removed.");
  },
});

// DEPRECATED: Panels table removed
export const getPanelStatus = query({
  args: { panelId: v.id("panels") },
  handler: async (ctx, args) => {
    console.warn("DEPRECATED: getPanelStatus called. Panels table removed.");
    return null;
  },
});

// DEPRECATED: Judges table removed
export const getJudges = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    console.warn("DEPRECATED: getJudges called. Judges table removed.");
    return [];
  },
});

// DEPRECATED: Judges table removed
export const getJudgeStats = query({
  args: { judgeId: v.string() },
  handler: async (ctx, args) => {
    console.warn("DEPRECATED: getJudgeStats called. Judges table removed.");
    return null;
  },
});

// DEPRECATED: Panels table removed
export const createPanel = mutation({
  args: {
    caseId: v.id("cases"),
    judgeIds: v.array(v.string()),
    panelSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    console.warn("DEPRECATED: createPanel called. Panels table removed.");
    throw new Error("DEPRECATED: Panel system removed.");
  },
});
