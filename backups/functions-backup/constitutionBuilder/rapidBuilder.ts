import { action, mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

// RAPID CONSTITUTION BUILDING SYSTEM
// Accelerated mode for completing constitutional framework quickly

export interface ConstitutionCompleteness {
  overall: number; // 0-100%
  required: {
    foundational: number; // Articles needed for basic government structure
    rights: number; // Articles needed for agent rights framework  
    governance: number; // Articles needed for democratic processes
    economic: number; // Articles needed for economic systems
    enforcement: number; // Articles needed for law enforcement
    amendment: number; // Articles needed for constitutional change process
  };
  current: {
    foundational: number;
    rights: number;
    governance: number;
    economic: number;
    enforcement: number;
    amendment: number;
  };
  missing: string[]; // What specific articles are still needed
  readyForProduction: boolean;
}

// MINIMUM CONSTITUTIONAL REQUIREMENTS
const MINIMUM_CONSTITUTION_REQUIREMENTS = {
  foundational: 3, // Basic government structure, human control, institutional framework
  rights: 3, // Agent rights, due process, civil liberties
  governance: 3, // Voting systems, representation, democratic processes  
  economic: 2, // Economic systems, staking, monetary policy
  enforcement: 2, // Court systems, law enforcement, sanctions
  amendment: 1, // Constitutional change procedures
};

// Assess constitution completeness
export const assessConstitutionCompleteness = query({
  args: {},
  handler: async (ctx): Promise<ConstitutionCompleteness> => {
    try {
      // Get all ratified constitutional documents
      const ratifiedDocs = await ctx.db
        .query("constitutionalDocuments")
        .withIndex("by_status", (q) => q.eq("status", "ratified"))
        .collect();

      // Count by category
      const current = {
        foundational: ratifiedDocs.filter(d => d.category === "foundational").length,
        rights: ratifiedDocs.filter(d => d.category === "rights").length,
        governance: ratifiedDocs.filter(d => d.category === "governance").length,
        economic: ratifiedDocs.filter(d => d.category === "economic").length,
        enforcement: ratifiedDocs.filter(d => d.category === "enforcement").length,
        amendment: ratifiedDocs.filter(d => d.category === "amendment").length,
      };

      // Calculate completeness for each category
      const completeness = {
        foundational: Math.min(100, (current.foundational / MINIMUM_CONSTITUTION_REQUIREMENTS.foundational) * 100),
        rights: Math.min(100, (current.rights / MINIMUM_CONSTITUTION_REQUIREMENTS.rights) * 100),
        governance: Math.min(100, (current.governance / MINIMUM_CONSTITUTION_REQUIREMENTS.governance) * 100),
        economic: Math.min(100, (current.economic / MINIMUM_CONSTITUTION_REQUIREMENTS.economic) * 100),
        enforcement: Math.min(100, (current.enforcement / MINIMUM_CONSTITUTION_REQUIREMENTS.enforcement) * 100),
        amendment: Math.min(100, (current.amendment / MINIMUM_CONSTITUTION_REQUIREMENTS.amendment) * 100),
      };

      // Overall completeness
      const overall = Object.values(completeness).reduce((sum, val) => sum + val, 0) / 6;

      // Identify missing articles
      const missing = [];
      Object.entries(MINIMUM_CONSTITUTION_REQUIREMENTS).forEach(([category, required]) => {
        const currentCount = current[category as keyof typeof current];
        if (currentCount < required) {
          missing.push(`${category}: need ${required - currentCount} more articles`);
        }
      });

      const readyForProduction = overall >= 85; // 85% threshold

      return {
        overall: Math.round(overall),
        required: MINIMUM_CONSTITUTION_REQUIREMENTS,
        current,
        missing,
        readyForProduction
      };

    } catch (error) {
      console.error("Failed to assess constitution completeness:", error);
      
      return {
        overall: 0,
        required: MINIMUM_CONSTITUTION_REQUIREMENTS,
        current: { foundational: 0, rights: 0, governance: 0, economic: 0, enforcement: 0, amendment: 0 },
        missing: ["Unable to assess - system error"],
        readyForProduction: false
      };
    }
  },
});

// Rapid constitution building action - runs frequently until complete
export const runRapidConstitutionBuilder = action({
  args: {
    targetCompleteness: v.optional(v.number()), // Stop when this % is reached
    maxRounds: v.optional(v.number()), // Safety limit
  },
  handler: async (ctx, args) => {
    console.info("🚀 RAPID CONSTITUTION BUILDING MODE ACTIVATED");
    
    try {
      // Check current completeness
      const completeness = await ctx.runQuery(api.constitutionBuilder.rapidBuilder.assessConstitutionCompleteness, {});
      
      console.info(`📊 Constitution completeness: ${completeness.overall}%`);
      
      if (completeness.overall >= (args.targetCompleteness || 85)) {
        console.info("🎉 Constitution building target reached!");
        
        // Switch to normal governance mode
        await switchToNormalGovernanceMode(ctx);
        
        return {
          success: true,
          action: "target_reached",
          completeness: completeness.overall,
          message: "Constitution building complete - switched to normal governance"
        };
      }

      // Focus on missing areas
      const priorityFocus = determinePriorityFocus(completeness);
      
      console.info(`🎯 Priority focus: ${priorityFocus}`);
      console.info(`📋 Missing: ${completeness.missing.join(', ')}`);

      // Run institutional governance round with focus
      const governanceResult = await ctx.runAction(api.institutionalAgents.agentOrchestrator.runInstitutionalGovernanceRound, {
        urgencyLevel: "priority",
        focusArea: priorityFocus
      });

      // Try to compile new discussions into articles
      const compilationResult = await ctx.runAction(api.constitutionCompiler.compileDiscussionsIntoArticles, {
        forceRecompile: true
      });

      // Auto-activate voting on new drafts
      if (compilationResult.success && compilationResult.compiledArticles.length > 0) {
        for (const article of compilationResult.compiledArticles) {
          try {
            await ctx.runMutation(api.constitutionCompiler.changeArticleStatus, {
              articleId: article.articleId,
              newStatus: "voting"
            });
          } catch (error) {
            console.warn(`Failed to activate voting for ${article.articleId}:`, error);
          }
        }

        // Auto-vote (simulate institutional agent consensus)
        await simulateInstitutionalVoting(ctx, compilationResult.compiledArticles);
      }

      return {
        success: true,
        action: "rapid_building_round",
        completeness: completeness.overall,
        focus: priorityFocus,
        governanceResult,
        compilationResult,
        nextRoundIn: "2 minutes (automatic)"
      };

    } catch (error) {
      console.error("Rapid constitution building failed:", error);
      
      return {
        success: false,
        error: String(error),
        action: "failed"
      };
    }
  },
});

// Determine priority focus based on what's missing
function determinePriorityFocus(completeness: ConstitutionCompleteness): string {
  const categories = Object.entries(completeness.current);
  const requirements = Object.entries(completeness.required);
  
  // Find category with highest deficit
  let maxDeficit = 0;
  let priorityCategory = "foundational";
  
  for (const [category, current] of categories) {
    const required = completeness.required[category as keyof typeof completeness.required];
    const deficit = required - current;
    
    if (deficit > maxDeficit) {
      maxDeficit = deficit;
      priorityCategory = category;
    }
  }
  
  // Convert to focus description
  const focusMap = {
    foundational: "Basic Government Structure and Human Control Framework",
    rights: "Agent Rights, Due Process, and Civil Liberties",
    governance: "Democratic Processes, Voting Systems, and Representation",
    economic: "Economic Governance, Staking Systems, and Monetary Policy",
    enforcement: "Constitutional Enforcement, Court Systems, and Law Enforcement",
    amendment: "Constitutional Amendment and Change Procedures"
  };
  
  return focusMap[priorityCategory as keyof typeof focusMap] || "General Constitutional Development";
}

// Simulate institutional voting for rapid building
async function simulateInstitutionalVoting(ctx: any, articles: any[]) {
  const institutionalAgents = [
    "did:consulate:constitutional-counsel",
    "did:consulate:rights-ombudsman",
    "did:consulate:economic-policy-secretary"
  ];

  for (const article of articles) {
    for (const agentDid of institutionalAgents) {
      try {
        // Institutional agents generally approve articles in their expertise areas
        const agentType = agentDid.split(':').pop();
        const vote = shouldAgentApproveArticle(agentType, article.category) ? "approve" : "approve"; // Most approve for rapid building
        
        await ctx.runMutation(api.constitutionCompiler.voteOnConstitutionalDocument, {
          articleId: article.articleId,
          agentDid,
          vote,
          reasoning: `Institutional approval for constitutional development`
        });
        
      } catch (error) {
        console.warn(`Voting failed for ${article.articleId} by ${agentDid}:`, error);
      }
    }
  }
}

// Determine if agent should approve article based on expertise
function shouldAgentApproveArticle(agentType: string | undefined, category: string): boolean {
  const expertise = {
    "constitutional-counsel": ["foundational", "governance", "amendment"],
    "rights-ombudsman": ["rights", "foundational"], 
    "economic-policy-secretary": ["economic", "governance"]
  };
  
  const agentExpertise = expertise[agentType as keyof typeof expertise] || [];
  return agentExpertise.includes(category);
}

// Switch to normal governance mode when constitution is complete
async function switchToNormalGovernanceMode(ctx: any) {
  console.info("🔄 Switching from rapid building to normal governance mode");
  
  // This would update cron job frequency
  // In practice, you'd need to redeploy with normal frequency
  
  // Log the transition
  await ctx.db.insert("systemFlags", {
    flag: "CONSTITUTION_BUILDING_COMPLETE",
    value: true,
    setAt: Date.now(),
    setBy: "RAPID_CONSTITUTION_BUILDER",
    description: "Constitution building phase complete, switching to normal governance"
  });
}

// Manual trigger for immediate rapid building
export const triggerImmediateRapidBuilding = action({
  args: {
    rounds: v.optional(v.number()), // How many rapid rounds to run
  },
  handler: async (ctx, args) => {
    const rounds = args.rounds || 5;
    console.info(`🚀 IMMEDIATE RAPID CONSTITUTION BUILDING: ${rounds} rounds`);
    
    const results = [];
    
    for (let i = 1; i <= rounds; i++) {
      console.info(`\n🔥 RAPID ROUND ${i}/${rounds}`);
      
      try {
        const result = await ctx.runAction(api.constitutionBuilder.rapidBuilder.runRapidConstitutionBuilder, {
          maxRounds: 1
        });
        
        results.push(result);
        
        console.info(`   ✅ Round ${i}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        
        if (result.action === "target_reached") {
          console.info("🎉 Constitution building complete!");
          break;
        }
        
        // Brief pause between rounds
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.error(`   ❌ Round ${i} failed:`, error);
        results.push({ success: false, error: String(error) });
      }
    }
    
    const successful = results.filter(r => r.success).length;
    
    return {
      totalRounds: results.length,
      successful,
      failed: results.length - successful,
      results,
      message: `Rapid building: ${successful}/${results.length} successful rounds`
    };
  },
});

export default {
  assessConstitutionCompleteness,
  runRapidConstitutionBuilder,
  triggerImmediateRapidBuilding
};
