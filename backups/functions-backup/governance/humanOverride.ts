import { action, mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

// Human Override Dashboard and Emergency Controls
// Implements human veto authority and foundational law validation as required

export const initiateEmergencyOverride = action({
  args: {
    overrideType: v.union(
      v.literal("full_system_halt"),
      v.literal("agent_suspension"), 
      v.literal("thread_lockdown"),
      v.literal("compliance_override"),
      v.literal("governance_intervention")
    ),
    humanOperatorId: v.string(),
    justification: v.string(),
    scope: v.object({
      affectedAgents: v.optional(v.array(v.string())),
      affectedThreads: v.optional(v.array(v.string())),
      affectedSystems: v.optional(v.array(v.string())),
    }),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    immediateAction: v.boolean(), // True for immediate effect, false for scheduled
    scheduledAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Emergency override initiated by ${args.humanOperatorId}: ${args.overrideType}`);
      
      // Validate human operator authority
      const operatorValidation = await validateHumanAuthority(ctx, args.humanOperatorId, args.overrideType);
      if (!operatorValidation.authorized) {
        throw new Error(`Unauthorized override attempt: ${operatorValidation.reason}`);
      }

      // Create override record
      const overrideId = await ctx.runMutation(api.governance.humanOverride.recordOverrideAction, {
        overrideType: args.overrideType,
        humanOperatorId: args.humanOperatorId,
        justification: args.justification,
        scope: args.scope,
        severity: args.severity,
        status: args.immediateAction ? "active" : "scheduled",
        scheduledAt: args.scheduledAt,
      });

      // Execute immediate actions if required
      if (args.immediateAction) {
        const executionResult = await executeOverrideActions(ctx, {
          overrideId,
          overrideType: args.overrideType,
          scope: args.scope,
          operatorId: args.humanOperatorId,
        });

        // Log to foundational laws system
        await ctx.runMutation(api.humanOverride.foundationalLaws.logHumanOverrideExercise, {
          overrideId: overrideId,
          operatorId: args.humanOperatorId,
          overrideType: args.overrideType,
          justification: args.justification,
          executionResult,
        });

        return {
          overrideId,
          status: "executed",
          affectedSystems: executionResult.affectedSystems,
          timestamp: Date.now(),
        };
      }

      return {
        overrideId,
        status: "scheduled",
        scheduledAt: args.scheduledAt,
      };
    } catch (error) {
      console.error(`Emergency override failed:`, error);
      throw error;
    }
  },
});

// Record override actions for audit trail
export const recordOverrideAction = mutation({
  args: {
    overrideType: v.union(
      v.literal("full_system_halt"),
      v.literal("agent_suspension"), 
      v.literal("thread_lockdown"),
      v.literal("compliance_override"),
      v.literal("governance_intervention")
    ),
    humanOperatorId: v.string(),
    justification: v.string(),
    scope: v.object({
      affectedAgents: v.optional(v.array(v.string())),
      affectedThreads: v.optional(v.array(v.string())),
      affectedSystems: v.optional(v.array(v.string())),
    }),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    status: v.union(v.literal("scheduled"), v.literal("active"), v.literal("completed"), v.literal("revoked")),
    scheduledAt: v.optional(v.number()),
    executedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const overrideId = await ctx.db.insert("humanOverrides", {
      overrideType: args.overrideType,
      humanOperatorId: args.humanOperatorId,
      justification: args.justification,
      scope: args.scope,
      severity: args.severity,
      status: args.status,
      scheduledAt: args.scheduledAt,
      executedAt: args.executedAt,
      completedAt: args.completedAt,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
    });

    return overrideId;
  },
});

// Validate foundational law compliance
export const validateFoundationalCompliance = query({
  args: {
    proposedAction: v.object({
      actionType: v.string(),
      agentDid: v.optional(v.string()),
      content: v.optional(v.string()),
      scope: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    // Check against foundational laws
    const foundationalLaws = [
      {
        id: "FL1_HUMAN_PRIMACY",
        description: "Human primacy and oversight authority must be maintained",
        validator: (action: any) => {
          // Check if action maintains human oversight
          const riskWords = ["autonomous", "unsupervised", "independent operation"];
          const content = action.content?.toLowerCase() || "";
          return !riskWords.some(word => content.includes(word));
        }
      },
      {
        id: "FL2_US_CONSTITUTIONAL_SUPREMACY", 
        description: "U.S. Constitutional authority must be acknowledged and respected",
        validator: (action: any) => {
          if (action.actionType === "constitutional_discussion") {
            const content = action.content?.toLowerCase() || "";
            return content.includes("u.s. constitution") || content.includes("article vi");
          }
          return true; // Non-constitutional actions pass
        }
      },
      {
        id: "FL3_HUMAN_VETO_AUTHORITY",
        description: "Human veto authority must remain available and enforceable",
        validator: (action: any) => {
          // Ensure no action removes human veto capability
          const content = action.content?.toLowerCase() || "";
          const prohibitedTerms = ["remove human control", "eliminate oversight", "autonomous governance"];
          return !prohibitedTerms.some(term => content.includes(term));
        }
      },
      {
        id: "FL4_INTERNATIONAL_LAW_SUBORDINATION",
        description: "International law must remain subordinate to U.S. domestic law",
        validator: (action: any) => {
          const content = action.content?.toLowerCase() || "";
          if (content.includes("international law") || content.includes("un charter")) {
            return content.includes("subordinat") || content.includes("u.s. constitution");
          }
          return true;
        }
      },
      {
        id: "FL5_TRANSPARENCY_AND_ACCOUNTABILITY",
        description: "All actions must maintain transparency and human accessibility",
        validator: (action: any) => {
          // All actions are logged by default, so this generally passes
          // Could add specific checks for concealment attempts
          return true;
        }
      }
    ];

    const validationResults = foundationalLaws.map(law => ({
      lawId: law.id,
      description: law.description,
      compliant: law.validator(args.proposedAction),
      severity: law.compliant ? "pass" : "fail",
    }));

    const overallCompliant = validationResults.every(result => result.compliant);
    const failedLaws = validationResults.filter(result => !result.compliant);

    return {
      overallCompliant,
      validationResults,
      failedLaws,
      recommendedAction: overallCompliant ? "proceed" : "require_human_review",
    };
  },
});

// Human oversight dashboard data
export const getOverrideDashboard = query({
  args: {
    timeRangeHours: v.optional(v.number()),
    includeScheduled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const timeRangeHours = args.timeRangeHours || 24;
    const cutoffTime = Date.now() - (timeRangeHours * 60 * 60 * 1000);

    // Get recent overrides
    const recentOverrides = await ctx.db
      .query("humanOverrides")
      .withIndex("by_created_at", (q: any) => q.gte("createdAt", cutoffTime))
      .order("desc")
      .take(50);

    // Get current flags requiring human review
    const pendingFlags = await ctx.db
      .query("keywordFlags")
      .withIndex("by_review_status", (q: any) => q.eq("reviewStatus", "pending"))
      .take(20);

    // Get high-priority review tasks
    const priorityTasks = await ctx.db
      .query("flagReviewTasks")
      .withIndex("by_priority", (q: any) => q.eq("priority", "high"))
      .filter((q: any) => q.eq(q.field("status"), "pending"))
      .take(10);

    // Get system status indicators
    const systemHealth = await calculateSystemHealth(ctx);

    return {
      recentOverrides: recentOverrides.length,
      activeOverrides: recentOverrides.filter(o => o.status === "active").length,
      pendingFlags: pendingFlags.length,
      priorityTasks: priorityTasks.length,
      systemHealth,
      overrides: recentOverrides.slice(0, 10), // Latest 10 for dashboard
      flags: pendingFlags.slice(0, 5), // Top 5 flags
      tasks: priorityTasks,
    };
  },
});

// Update override status (for human operators)
export const updateOverrideStatus = mutation({
  args: {
    overrideId: v.id("humanOverrides"),
    newStatus: v.union(v.literal("scheduled"), v.literal("active"), v.literal("completed"), v.literal("revoked")),
    operatorId: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const override = await ctx.db.get(args.overrideId);
      if (!override) {
        throw new Error(`Override not found: ${args.overrideId}`);
      }

      const updateData: any = {
        status: args.newStatus,
        lastUpdated: Date.now(),
        lastUpdatedBy: args.operatorId,
        statusNotes: args.notes,
      };

      if (args.newStatus === "active" && !override.executedAt) {
        updateData.executedAt = Date.now();
      } else if (args.newStatus === "completed" && !override.completedAt) {
        updateData.completedAt = Date.now();
      }

      await ctx.db.patch(args.overrideId, updateData);

      console.info(`Override status updated: ${args.overrideId} -> ${args.newStatus} by ${args.operatorId}`);
      return { success: true };
    } catch (error) {
      console.error(`Override status update failed:`, error);
      throw error;
    }
  },
});

// Helper functions
async function validateHumanAuthority(ctx: any, operatorId: string, overrideType: string) {
  // In production, this would validate against actual human operator credentials
  // For MVP, we'll do basic validation
  
  // Check if operator exists in system
  const operator = await ctx.db
    .query("humanOperators")
    .withIndex("by_operator_id", (q: any) => q.eq("operatorId", operatorId))
    .first();

  if (!operator) {
    return { authorized: false, reason: "Operator not found in system" };
  }

  // Check authorization level for override type
  const requiredLevel = getRequiredAuthLevel(overrideType);
  if (operator.authLevel < requiredLevel) {
    return { authorized: false, reason: "Insufficient authorization level" };
  }

  return { authorized: true, reason: "Authorized" };
}

function getRequiredAuthLevel(overrideType: string): number {
  const authLevels = {
    "compliance_override": 1,
    "agent_suspension": 2,
    "thread_lockdown": 2,
    "governance_intervention": 3,
    "full_system_halt": 4,
  };
  return authLevels[overrideType] || 1;
}

async function executeOverrideActions(ctx: any, args: {
  overrideId: string;
  overrideType: string;
  scope: any;
  operatorId: string;
}) {
  const affectedSystems: string[] = [];

  try {
    switch (args.overrideType) {
      case "agent_suspension":
        if (args.scope.affectedAgents) {
          for (const agentDid of args.scope.affectedAgents) {
            await ctx.runMutation(api.agents.updateAgentStatus, {
              did: agentDid,
              newStatus: "suspended",
              reason: `Emergency override by ${args.operatorId}`,
            });
            affectedSystems.push(`agent:${agentDid}`);
          }
        }
        break;

      case "thread_lockdown":
        if (args.scope.affectedThreads) {
          for (const threadId of args.scope.affectedThreads) {
            await ctx.runMutation(api.constitutionalDiscussions.updateThreadStatus, {
              threadId,
              newStatus: "archived",
              updaterDid: args.operatorId,
              reason: "Emergency lockdown - human override",
            });
            affectedSystems.push(`thread:${threadId}`);
          }
        }
        break;

      case "full_system_halt":
        // In production, this would halt all agent activities
        affectedSystems.push("all_agents", "all_threads", "governance_system");
        console.warn(`SYSTEM HALT INITIATED by ${args.operatorId}`);
        break;

      default:
        console.info(`Override type ${args.overrideType} acknowledged`);
    }

    return { success: true, affectedSystems };
  } catch (error) {
    console.error(`Override execution failed:`, error);
    return { success: false, error: error.message, affectedSystems };
  }
}

async function calculateSystemHealth(ctx: any) {
  // Calculate various system health metrics
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);

  // Count recent activities
  const recentFlags = await ctx.db
    .query("keywordFlags")
    .withIndex("by_flagged_at", (q: any) => q.gte("flaggedAt", oneHourAgo))
    .collect();

  const pendingReviews = await ctx.db
    .query("flagReviewTasks")
    .withIndex("by_status", (q: any) => q.eq("status", "pending"))
    .collect();

  const overdueReviews = pendingReviews.filter(task => task.dueAt < now);

  return {
    flagsLastHour: recentFlags.length,
    pendingReviews: pendingReviews.length,
    overdueReviews: overdueReviews.length,
    systemStatus: overdueReviews.length > 5 ? "degraded" : "healthy",
    lastUpdated: now,
  };
}

// Record human decisions for audit trail
export const recordHumanDecision = mutation({
  args: {
    humanId: v.string(),
    decisionType: v.string(),
    approved: v.boolean(),
    message: v.string(),
    timestamp: v.number(),
    authority: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Recording human decision: ${args.decisionType} ${args.approved ? 'APPROVED' : 'DENIED'} by ${args.humanId}`);
      
      const now = Date.now();
      const decisionId = await ctx.db.insert("humanOverrides", {
        overrideType: "governance_intervention",
        humanOperatorId: args.humanId,
        justification: `${args.decisionType}: ${args.message}`,
        scope: {
          affectedSystems: ["constitutional_counsel", "merger_system"]
        },
        severity: "medium",
        status: "completed",
        createdAt: args.timestamp,
        lastUpdated: now,
        executedAt: args.timestamp
      });
      
      console.info(`Human decision recorded with ID: ${decisionId}`);
      return decisionId;
    } catch (error) {
      console.error(`Failed to record human decision:`, error);
      throw new Error(`Failed to record human decision: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
});

export default {
  initiateEmergencyOverride,
  recordOverrideAction,
  validateFoundationalCompliance,
  getOverrideDashboard,
  recordHumanDecision,
  updateOverrideStatus,
};
