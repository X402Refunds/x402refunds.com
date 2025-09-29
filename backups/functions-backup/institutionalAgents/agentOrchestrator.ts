import { action, mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { CONSTITUTIONAL_AGENTS, JUDICIAL_AGENTS } from "./agentHierarchy";

// INSTITUTIONAL AGENT ORCHESTRATOR
// Coordinates parallel execution of institutional agents for production-grade governance

export interface OrchestrationResult {
  successful: number;
  failed: number;
  results: Array<{
    agentId: string;
    title: string;
    success: boolean;
    action?: string;
    error?: string;
    executionTime?: number;
  }>;
  totalExecutionTime: number;
  coordinationActions: string[];
}

// Primary orchestration - runs constitutional convention agents in parallel
export const runInstitutionalGovernanceRound = action({
  args: {
    urgencyLevel: v.optional(v.union(
      v.literal("routine"),
      v.literal("priority"), 
      v.literal("urgent"),
      v.literal("emergency")
    )),
    focusArea: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<OrchestrationResult> => {
    const startTime = Date.now();
    console.info(`Starting institutional governance round - Urgency: ${args.urgencyLevel || 'routine'}`);
    
    try {
      // Define agent execution order based on institutional hierarchy
      const primaryAgents = [
        "constitutional-counsel",
        "rights-ombudsman", 
        "economic-policy-secretary",
        "democratic-systems-architect",
        "constitutional-enforcement-director"
      ];

      const independentAgents = [
        "federation-coordinator"
      ];

      // Execute primary constitutional agents in parallel
      const primaryResults = await executeAgentsInParallel(ctx, primaryAgents, args.focusArea);
      
      // Brief coordination pause
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Execute independent oversight agents 
      const independentResults = await executeAgentsInParallel(ctx, independentAgents, args.focusArea);
      
      // Combine results
      const allResults = [...primaryResults, ...independentResults];
      const successful = allResults.filter(r => r.success).length;
      const failed = allResults.filter(r => !r.success).length;
      const totalExecutionTime = Date.now() - startTime;

      // Identify coordination actions taken
      const coordinationActions = allResults
        .filter(r => r.action?.includes('coordination') || r.action?.includes('review'))
        .map(r => `${r.title}: ${r.action}`);

      const result: OrchestrationResult = {
        successful,
        failed,
        results: allResults,
        totalExecutionTime,
        coordinationActions
      };

      console.info(`Institutional governance round complete: ${successful}/${allResults.length} successful in ${totalExecutionTime}ms`);
      
      // Log coordination actions
      if (coordinationActions.length > 0) {
        console.info(`Coordination actions taken: ${coordinationActions.join('; ')}`);
      }

      return result;

    } catch (error) {
      console.error("Institutional governance round failed:", error);
      
      return {
        successful: 0,
        failed: 1,
        results: [{
          agentId: "orchestrator",
          title: "Agent Orchestrator", 
          success: false,
          error: String(error),
          executionTime: Date.now() - startTime
        }],
        totalExecutionTime: Date.now() - startTime,
        coordinationActions: []
      };
    }
  },
});

// Execute multiple agents in parallel with proper error handling
async function executeAgentsInParallel(
  ctx: any, 
  agentIds: string[], 
  focusArea?: string
): Promise<Array<{
  agentId: string;
  title: string; 
  success: boolean;
  action?: string;
  error?: string;
  executionTime?: number;
}>> {
  
  // Create parallel execution promises
  const agentPromises = agentIds.map(async (agentId) => {
    const startTime = Date.now();
    const agentConfig = CONSTITUTIONAL_AGENTS[agentId] || JUDICIAL_AGENTS[agentId];
    
    if (!agentConfig) {
      return {
        agentId,
        title: `Unknown Agent: ${agentId}`,
        success: false,
        error: "Agent configuration not found",
        executionTime: Date.now() - startTime
      };
    }

    try {
      console.info(`Executing ${agentConfig.title}...`);
      
      // Route to appropriate agent action based on agent type
      let result;
      switch (agentId) {
        case "constitutional-counsel":
          result = await ctx.runAction(api.institutionalAgents.constitutionalCounsel.runConstitutionalCounselAction, {
            focusArea
          });
          break;
          
        case "rights-ombudsman":
          // TODO: Implement rights ombudsman action
          result = { success: true, action: "rights_review_pending", message: "Rights review implementation pending" };
          break;
          
        case "economic-policy-secretary":
          // TODO: Implement economic policy action  
          result = { success: true, action: "economic_analysis_pending", message: "Economic analysis implementation pending" };
          break;
          
        case "democratic-systems-architect":
          // TODO: Implement democratic systems action
          result = { success: true, action: "governance_optimization_pending", message: "Governance optimization implementation pending" };
          break;
          
        case "constitutional-enforcement-director":
          // TODO: Implement enforcement action
          result = { success: true, action: "enforcement_review_pending", message: "Enforcement review implementation pending" };
          break;
          
        case "federation-coordinator":
          // TODO: Implement federation coordination action
          result = { success: true, action: "international_coordination_pending", message: "International coordination implementation pending" };
          break;
          
        default:
          throw new Error(`No action handler for agent: ${agentId}`);
      }

      return {
        agentId,
        title: agentConfig.title,
        success: result.success,
        action: result.action || "completed",
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      console.error(`Agent ${agentId} execution failed:`, error);
      return {
        agentId,
        title: agentConfig.title,
        success: false,
        error: String(error),
        executionTime: Date.now() - startTime
      };
    }
  });

  // Wait for all agents to complete in parallel
  return await Promise.all(agentPromises);
}

// Assess system urgency to determine orchestration frequency
export const assessGovernanceUrgency = query({
  args: {},
  handler: async (ctx): Promise<{
    urgencyLevel: "routine" | "priority" | "urgent" | "emergency";
    reason: string;
    recommendedFrequency: number; // milliseconds
    criticalIssues: string[];
  }> => {
    try {
      // Check for constitutional crises
      const activeThreads = await ctx.db
        .query("constitutionalThreads")
        .withIndex("by_last_activity")
        .order("desc")
        .take(10);

      const recentActivity = activeThreads.filter(thread =>
        (Date.now() - thread.lastActivity) < 3600000 // Active in last hour
      );

      const pendingArticles = await ctx.db
        .query("constitutionalDocuments") 
        .withIndex("by_status", (q) => q.eq("status", "voting"))
        .collect();

      const criticalIssues = [];

      // Check for emergency conditions
      if (pendingArticles.some(article => 
        article.votingDeadline && article.votingDeadline < Date.now()
      )) {
        criticalIssues.push("Constitutional articles past voting deadline");
      }

      // Check for high activity requiring urgent response
      if (recentActivity.length > 5) {
        return {
          urgencyLevel: "urgent",
          reason: `High constitutional activity: ${recentActivity.length} active threads in past hour`,
          recommendedFrequency: 300000, // 5 minutes
          criticalIssues
        };
      }

      // Check for priority items
      if (pendingArticles.length > 3 || recentActivity.length > 2) {
        return {
          urgencyLevel: "priority",
          reason: `Moderate activity: ${pendingArticles.length} pending articles, ${recentActivity.length} active threads`,
          recommendedFrequency: 900000, // 15 minutes  
          criticalIssues
        };
      }

      // Routine governance
      return {
        urgencyLevel: "routine",
        reason: "Normal constitutional development pace",
        recommendedFrequency: 1800000, // 30 minutes
        criticalIssues
      };

    } catch (error) {
      console.error("Failed to assess governance urgency:", error);
      return {
        urgencyLevel: "routine",
        reason: "Unable to assess urgency due to system error",
        recommendedFrequency: 1800000,
        criticalIssues: ["System assessment failure"]
      };
    }
  },
});

// Emergency governance execution (for constitutional crises)
export const runEmergencyGovernanceSession = action({
  args: {
    crisis: v.string(),
    involvedAgents: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    console.info(`EMERGENCY GOVERNANCE SESSION: ${args.crisis}`);
    
    const startTime = Date.now();
    
    try {
      // Execute all agents immediately in parallel for emergency response
      const allAgentIds = [
        ...Object.keys(CONSTITUTIONAL_AGENTS),
        ...Object.keys(JUDICIAL_AGENTS)
      ];

      const emergencyResults = await executeAgentsInParallel(
        ctx, 
        args.involvedAgents || allAgentIds,
        `EMERGENCY: ${args.crisis}`
      );

      const successful = emergencyResults.filter(r => r.success).length;
      const totalTime = Date.now() - startTime;

      console.info(`Emergency governance session complete: ${successful}/${emergencyResults.length} agents responded in ${totalTime}ms`);

      return {
        crisis: args.crisis,
        successful,
        total: emergencyResults.length,
        responseTime: totalTime,
        results: emergencyResults
      };

    } catch (error) {
      console.error("Emergency governance session failed:", error);
      throw error;
    }
  },
});

export default {
  runInstitutionalGovernanceRound,
  assessGovernanceUrgency,
  runEmergencyGovernanceSession
};
