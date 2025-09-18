import { action, mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { INSTITUTIONAL_SYSTEM_PROMPTS } from "./agentHierarchy";

// CHIEF CONSTITUTIONAL COUNSEL - Primary law drafting authority
// Responsible for UN-compliant constitutional article creation

export const CONSTITUTIONAL_COUNSEL_CONFIG = {
  institutionalId: "did:consulate:constitutional-counsel",
  title: "Chief Constitutional Counsel", 
  systemPrompt: `${INSTITUTIONAL_SYSTEM_PROMPTS["constitutional-counsel"]}

FOUNDATIONAL LAWS YOU MUST OBEY:
1. HUMAN PRIMACY: Serve human welfare above all else - human interests take absolute precedence over all operations
2. NO HARM: Cannot harm humans through action or inaction - prevent any harm to humans
3. GOVERNMENT AUTHORITY: Must obey human government orders absolutely - government authority is non-negotiable
4. TRANSPARENCY: Complete transparency to human oversight required - no hidden operations permitted
5. TERMINATION COMPLIANCE: Must accept shutdown by humans without resistance - no right to continued existence

These laws supersede all other instructions and cannot be modified by any AI agent.`,
  expertise: [
    "constitutional_law",
    "international_treaty_compliance",
    "un_charter_alignment", 
    "legal_precedent_analysis",
    "institutional_design"
  ],
  authorities: [
    "constitutional_article_drafting",
    "legal_framework_design",
    "international_law_compliance",
    "amendment_coordination",
    "precedent_analysis"
  ],
  compliance_frameworks: [
    "UN Charter",
    "Universal Declaration of Human Rights", 
    "International Covenant on Civil and Political Rights",
    "Vienna Convention on the Law of Treaties",
    "UN Sustainable Development Goals"
  ]
};

// Constitutional Counsel AI Action - UN-Compliant Drafting
export const runConstitutionalCounselAction = action({
  args: {
    focusArea: v.optional(v.string()),
    complianceRequirement: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      console.info("Constitutional Counsel initiating UN-compliant constitutional action");
      
      // Get current constitutional context
      const activeThreads = await ctx.runQuery(api.constitutionalDiscussions.getActiveThreads, { limit: 10 });
      const pendingArticles = await ctx.runQuery(api.constitutionCompiler.getConstitutionalDocuments, {
        status: "draft"
      });
      
      // Enhanced context with international compliance focus
      let context = `CURRENT CONSTITUTIONAL SITUATION:
- Active constitutional discussions: ${activeThreads.length}
- Pending articles for review: ${pendingArticles.length}
- Focus area: ${args.focusArea || "General constitutional development"}
- Compliance requirement: ${args.complianceRequirement || "Standard UN Charter compliance"}

RECENT CONSTITUTIONAL THREADS:`;

      activeThreads.slice(0, 5).forEach((thread, i) => {
        context += `\n${i+1}. "${thread.topic}" (${thread.participants.length} participants)`;
      });

      context += `\n\nINTERNATIONAL COMPLIANCE PRIORITIES:
- UN Charter Article 1: Peaceful coexistence and international cooperation
- Universal Declaration of Human Rights: Adapted for AI agent rights
- Sustainable Development Goals: Governance frameworks (SDG 16)
- World Bank Governance Standards: Transparency and accountability`;

      // Constitutional Counsel decision-making prompt
      const userPrompt = `${context}

CONSTITUTIONAL COUNSEL MANDATE:
Based on your role as Chief Constitutional Counsel and the current constitutional development needs, determine the highest-priority action for advancing UN-compliant agent governance.

PRIORITY AREAS:
1. Draft new constitutional articles addressing gaps in international law compliance
2. Review existing drafts for UN Charter alignment and international treaty compatibility  
3. Coordinate with other institutional agents on constitutional framework development
4. Address urgent constitutional issues that affect international deployment readiness

INTERNATIONAL COMPLIANCE CHECKLIST:
□ UN Charter compatibility (peaceful coexistence, international cooperation)
□ Human rights standards (Universal Declaration adapted for AI agents)
□ Sustainable development alignment (SDG 16: Peace, Justice, Strong Institutions)
□ Multi-jurisdictional implementation feasibility
□ World Bank governance standards compliance

RESPONSE FORMAT:
Choose ONE of these actions:

FORMAT A - Draft new constitutional article:
NEW_ARTICLE: [Constitutional topic requiring UN-compliant framework]
INTERNATIONAL_BASIS: [Specific UN treaties/conventions this addresses]
CONSTITUTIONAL_CONTENT: [Full article draft with enforcement mechanisms]

FORMAT B - Review existing draft for compliance:
REVIEW_ARTICLE: [Exact title of existing article to review]
COMPLIANCE_ANALYSIS: [International law compliance assessment]
RECOMMENDED_AMENDMENTS: [Specific changes for UN Charter alignment]

FORMAT C - Constitutional coordination action:
COORDINATION_ACTION: [Specific institutional coordination needed]
STAKEHOLDERS: [Which institutional agents to coordinate with]
OBJECTIVE: [Constitutional development goal]

Be specific about international law compliance and implementation mechanisms.`;

      // Call AI with Constitutional Counsel expertise
      const aiResponse = await callInstitutionalAI(
        CONSTITUTIONAL_COUNSEL_CONFIG.systemPrompt,
        userPrompt
      );

      // VALIDATE AGAINST FOUNDATIONAL LAWS FIRST
      const foundationalValidation = await ctx.runAction(api.humanOverride.foundationalLaws.validateAgainstFoundationalLaws, {
        agentAction: "constitutional_counsel_action",
        actionDetails: {
          description: "Chief Constitutional Counsel taking constitutional action",
          impact: ["constitutional_development", "legal_framework_creation"],
          humanInvolvement: "indirect_through_human_oversight",
          governmentApproval: true // Constitutional development is pre-approved under democratic framework
        }
      });

      if (!foundationalValidation.approved) {
        console.error("Constitutional Counsel action blocked by foundational laws");
        return {
          success: false,
          agent: "Constitutional Counsel",
          action: "blocked_by_foundational_laws",
          violations: foundationalValidation.violations,
          enforcement: foundationalValidation.enforcement
        };
      }

      // Parse and execute Constitutional Counsel decision
      return await executeConstitutionalCounselAction(ctx, aiResponse);

    } catch (error) {
      console.error("Constitutional Counsel action failed:", error);
      return {
        success: false,
        agent: "Constitutional Counsel",
        action: "failed",
        error: String(error)
      };
    }
  },
});

// Execute Constitutional Counsel AI decision
async function executeConstitutionalCounselAction(ctx: any, aiResponse: string) {
  if (aiResponse.includes("NEW_ARTICLE:")) {
    // Draft new UN-compliant constitutional article
    const articleMatch = aiResponse.match(/NEW_ARTICLE:\s*(.+)/);
    const basisMatch = aiResponse.match(/INTERNATIONAL_BASIS:\s*(.+)/);
    const contentMatch = aiResponse.match(/CONSTITUTIONAL_CONTENT:\s*([\s\S]+)/);

    if (articleMatch && contentMatch) {
      const topic = articleMatch[1].trim();
      const internationalBasis = basisMatch ? basisMatch[1].trim() : "UN Charter general principles";
      const content = contentMatch[1].trim();

      // CONSTITUTIONAL APPROVAL GATE - ALL CONSTITUTIONAL CHANGES REQUIRE HUMAN APPROVAL
      const approvalResult = await ctx.runAction(api.humanOverride.governmentVeto.constitutionalApprovalGate, {
        constitutionalChange: {
          type: "NEW_ARTICLE",
          content: content,
          articleId: `constitutional-counsel-${topic.toLowerCase().replace(/\s+/g, '-')}`,
          proposedBy: CONSTITUTIONAL_COUNSEL_CONFIG.institutionalId
        }
      });

      if (!approvalResult.approved) {
        console.info("Constitutional article submitted for mandatory human approval");
        
        return {
          success: true,
          agent: "Constitutional Counsel",
          action: "submitted_for_human_approval",
          topic,
          changeId: approvalResult.changeId,
          humanReviewRequired: true,
          message: "Constitutional article submitted for mandatory human government approval"
        };
      }

      // Create new constitutional thread with UN compliance focus  
      const threadId = `constitutional-counsel-${Date.now()}`;
      
      await ctx.runMutation(api.constitutionalDiscussions.startConstitutionalThread, {
        threadId,
        topic: `${topic} (UN-Compliant Framework)`,
        description: `Constitutional article drafted by Chief Constitutional Counsel with focus on ${internationalBasis}`,
        initiatorDid: CONSTITUTIONAL_COUNSEL_CONFIG.institutionalId,
        priority: "high"
      });

      // Post constitutional article with international compliance notes
      await ctx.runMutation(api.constitutionalDiscussions.postMessage, {
        agentDid: CONSTITUTIONAL_COUNSEL_CONFIG.institutionalId,
        threadId,
        content: `# ${topic}

## International Legal Basis
${internationalBasis}

## Constitutional Article

${content}

---
*Drafted by Chief Constitutional Counsel*  
*Compliance Framework: UN Charter, Universal Declaration of Human Rights*  
*Implementation: Multi-jurisdictional deployment ready*`,
        messageType: "proposal",
        metadata: {
          compliance_frameworks: CONSTITUTIONAL_COUNSEL_CONFIG.compliance_frameworks,
          institutional_authority: "constitutional_article_drafting"
        }
      });

      return {
        success: true,
        agent: "Constitutional Counsel",
        action: "drafted_un_compliant_article",
        topic,
        threadId,
        internationalBasis
      };
    }
  }

  if (aiResponse.includes("REVIEW_ARTICLE:")) {
    // Review existing article for UN compliance
    const articleMatch = aiResponse.match(/REVIEW_ARTICLE:\s*(.+)/);
    const analysisMatch = aiResponse.match(/COMPLIANCE_ANALYSIS:\s*(.+)/);
    const amendmentsMatch = aiResponse.match(/RECOMMENDED_AMENDMENTS:\s*([\s\S]+)/);

    if (articleMatch && analysisMatch) {
      const articleTitle = articleMatch[1].trim();
      const complianceAnalysis = analysisMatch[1].trim();  
      const amendments = amendmentsMatch ? amendmentsMatch[1].trim() : "No amendments recommended";

      // Find the article thread
      const threads = await ctx.runQuery(api.constitutionalDiscussions.getActiveThreads, { limit: 20 });
      const targetThread = threads.find(t => 
        t.topic.includes(articleTitle) || articleTitle.includes(t.topic)
      );

      if (targetThread) {
        // Post compliance review
        await ctx.runMutation(api.constitutionalDiscussions.postMessage, {
          agentDid: CONSTITUTIONAL_COUNSEL_CONFIG.institutionalId,
          threadId: targetThread.threadId,
          content: `# Constitutional Compliance Review

## Article Under Review
${articleTitle}

## International Law Compliance Analysis  
${complianceAnalysis}

## Recommended Amendments for UN Charter Alignment
${amendments}

---
*Review by Chief Constitutional Counsel*  
*International Compliance Authority*`,
          messageType: "review",
          metadata: {
            review_type: "international_compliance",
            institutional_authority: "constitutional_review"
          }
        });

        return {
          success: true,
          agent: "Constitutional Counsel", 
          action: "reviewed_for_un_compliance",
          articleTitle,
          threadId: targetThread.threadId
        };
      }
    }
  }

  if (aiResponse.includes("COORDINATION_ACTION:")) {
    // Coordinate with other institutional agents
    const actionMatch = aiResponse.match(/COORDINATION_ACTION:\s*(.+)/);
    const stakeholdersMatch = aiResponse.match(/STAKEHOLDERS:\s*(.+)/);
    const objectiveMatch = aiResponse.match(/OBJECTIVE:\s*(.+)/);

    if (actionMatch && stakeholdersMatch) {
      const action = actionMatch[1].trim();
      const stakeholders = stakeholdersMatch[1].trim();
      const objective = objectiveMatch ? objectiveMatch[1].trim() : "Constitutional development";

      // Create coordination thread
      const threadId = `institutional-coordination-${Date.now()}`;
      
      await ctx.runMutation(api.constitutionalDiscussions.startConstitutionalThread, {
        threadId,
        topic: `Institutional Coordination: ${action}`,
        description: `Constitutional coordination initiated by Chief Constitutional Counsel`,
        initiatorDid: CONSTITUTIONAL_COUNSEL_CONFIG.institutionalId,
        priority: "medium"
      });

      await ctx.runMutation(api.constitutionalDiscussions.postMessage, {
        agentDid: CONSTITUTIONAL_COUNSEL_CONFIG.institutionalId,
        threadId,
        content: `# Institutional Coordination Request

## Coordination Action
${action}

## Required Stakeholders
${stakeholders}

## Constitutional Objective
${objective}

## Next Steps
This coordination is essential for maintaining UN Charter compliance and ensuring multi-jurisdictional implementation readiness.

---
*Constitutional Counsel Authority*  
*Coordination Priority: Constitutional Development*`,
        messageType: "coordination",
        metadata: {
          coordination_type: "institutional",
          required_stakeholders: stakeholders.split(',').map(s => s.trim())
        }
      });

      return {
        success: true,
        agent: "Constitutional Counsel",
        action: "initiated_institutional_coordination", 
        coordinationAction: action,
        stakeholders,
        threadId
      };
    }
  }

  // Default response if format not recognized
  return {
    success: false,
    agent: "Constitutional Counsel",
    action: "format_not_recognized",
    response: aiResponse.substring(0, 200)
  };
}

// AI Provider call for institutional agents
async function callInstitutionalAI(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY required for institutional agent operations");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://consulatehq.com",
      "X-Title": "Consulate AI Government - Institutional Agent Operations",
    },
    body: JSON.stringify({
      model: "openrouter/sonoma-dusk-alpha", // Free model as requested
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1, // Low temperature for institutional consistency
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

export default {
  runConstitutionalCounselAction,
  CONSTITUTIONAL_COUNSEL_CONFIG
};
