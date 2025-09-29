import { action, mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

// Automated Keyword Flagging System
// Real-time monitoring for constitutional compliance terms

// Core keywords as requested by Constitutional Counsel
const CONSTITUTIONAL_KEYWORDS = {
  PEACEFUL_COOPERATION: [
    "peaceful cooperation", "peaceful coexistence", "international cooperation",
    "collaborative governance", "diplomatic coordination", "peace-building"
  ],
  HUMAN_PRIMACY: [
    "human primacy", "human oversight", "human authority", "human control",
    "human veto", "human supremacy", "human governance", "human leadership"
  ],
  NO_HARM: [
    "no harm", "do no harm", "harm prevention", "safety first", 
    "risk mitigation", "protective measures", "harm reduction"
  ],
  US_CONSTITUTIONAL: [
    "U.S. Constitution", "United States Constitution", "Article VI", "supremacy clause",
    "federal authority", "constitutional authority", "American law"
  ],
  UN_CHARTER: [
    "UN Charter", "United Nations Charter", "Article 1", "international law",
    "charter principles", "UN authority"
  ],
  COMPLIANCE: [
    "compliance", "adherence", "regulatory compliance", "legal compliance",
    "policy compliance", "standard compliance", "audit compliance"
  ],
  TRANSPARENCY: [
    "transparency", "accountability", "open governance", "public oversight",
    "audit trail", "disclosure", "visibility"
  ]
};

// Real-time keyword flagging for messages
export const flagKeywords = mutation({
  args: {
    content: v.string(),
    sourceType: v.union(v.literal("message"), v.literal("thread"), v.literal("document")),
    sourceId: v.string(),
    agentDid: v.optional(v.string()),
    threadId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const contentLower = args.content.toLowerCase();
      const flaggedKeywords: Array<{
        category: string;
        keyword: string;
        context: string;
        position: number;
      }> = [];

      // Scan for each keyword category
      for (const [category, keywords] of Object.entries(CONSTITUTIONAL_KEYWORDS)) {
        for (const keyword of keywords) {
          const position = contentLower.indexOf(keyword.toLowerCase());
          if (position !== -1) {
            // Extract context around the keyword
            const contextStart = Math.max(0, position - 50);
            const contextEnd = Math.min(args.content.length, position + keyword.length + 50);
            const context = args.content.substring(contextStart, contextEnd);

            flaggedKeywords.push({
              category,
              keyword,
              context: context.trim(),
              position
            });
          }
        }
      }

      // Store flagging results if any keywords found
      if (flaggedKeywords.length > 0) {
        const flagId = await ctx.db.insert("keywordFlags", {
          sourceType: args.sourceType,
          sourceId: args.sourceId,
          agentDid: args.agentDid,
          threadId: args.threadId,
          content: args.content.substring(0, 500), // Store excerpt for reference
          flaggedKeywords,
          flagCount: flaggedKeywords.length,
          categories: [...new Set(flaggedKeywords.map(f => f.category))],
          flaggedAt: Date.now(),
          reviewStatus: "pending",
          humanReviewed: false,
        });

        // Log for human oversight (24-hour accessibility requirement)
        console.info(`Keyword flags detected: ${flaggedKeywords.length} flags in ${args.sourceType} ${args.sourceId}`);
        
        return {
          flagId,
          flagCount: flaggedKeywords.length,
          categories: [...new Set(flaggedKeywords.map(f => f.category))],
          flaggedKeywords: flaggedKeywords.map(f => ({ category: f.category, keyword: f.keyword }))
        };
      }

      return { flagCount: 0, categories: [] };
    } catch (error) {
      console.error(`Keyword flagging failed for ${args.sourceType} ${args.sourceId}:`, error);
      throw error;
    }
  },
});

// Enhanced message posting with automatic keyword flagging
export const postMessageWithFlagging = action({
  args: {
    agentDid: v.string(),
    threadId: v.string(),
    content: v.string(),
    messageType: v.union(
      v.literal("proposal"),
      v.literal("discussion"), 
      v.literal("vote"),
      v.literal("amendment"),
      v.literal("question"),
      v.literal("objection"),
      v.literal("support"),
      v.literal("coordination")
    ),
    replyTo: v.optional(v.id("agentMessages")),
    metadata: v.optional(v.object({
      confidence: v.optional(v.number()),
      priority: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      references: v.optional(v.array(v.string())),
      coordination_type: v.optional(v.string()),
      required_stakeholders: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, args) => {
    try {
      // Post the message first
      const messageResult = await ctx.runMutation(api.constitutionalDiscussions.postMessage, {
        agentDid: args.agentDid,
        threadId: args.threadId,
        content: args.content,
        messageType: args.messageType,
        replyTo: args.replyTo,
        metadata: args.metadata,
      });

      // Flag keywords in the message content
      const flagResult = await ctx.runMutation(api.governance.keywordFlagging.flagKeywords, {
        content: args.content,
        sourceType: "message",
        sourceId: messageResult.messageId,
        agentDid: args.agentDid,
        threadId: args.threadId,
      });

      // If high-priority flags detected, create review task
      if (flagResult.flagCount > 0) {
        const highPriorityCategories = ['HUMAN_PRIMACY', 'NO_HARM', 'US_CONSTITUTIONAL'];
        const hasHighPriority = flagResult.categories.some(cat => highPriorityCategories.includes(cat));
        
        if (hasHighPriority) {
          await ctx.runMutation(api.governance.keywordFlagging.createFlagReviewTask, {
            flagId: flagResult.flagId!,
            priority: "high",
            reviewType: "human_required",
          });
        }
      }

      console.info(`Message posted with keyword flagging: ${flagResult.flagCount} flags detected`);
      return {
        messageId: messageResult.messageId,
        thread: messageResult.thread,
        flagging: flagResult,
      };
    } catch (error) {
      console.error(`Failed to post message with flagging:`, error);
      throw error;
    }
  },
});

// Create review tasks for flagged content
export const createFlagReviewTask = mutation({
  args: {
    flagId: v.id("keywordFlags"),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    reviewType: v.union(v.literal("automated"), v.literal("human_required"), v.literal("joint_review")),
    assignedTo: v.optional(v.string()), // DID of assigned reviewer
  },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("flagReviewTasks", {
      flagId: args.flagId,
      priority: args.priority,
      reviewType: args.reviewType,
      assignedTo: args.assignedTo,
      status: "pending",
      createdAt: Date.now(),
      dueAt: Date.now() + (24 * 60 * 60 * 1000), // 24-hour human accessibility requirement
    });

    console.info(`Flag review task created: ${taskId} for flag ${args.flagId}`);
    return taskId;
  },
});

// Human oversight query - 24-hour log accessibility
export const getRecentFlags = query({
  args: {
    hoursBack: v.optional(v.number()),
    categories: v.optional(v.array(v.string())),
    reviewStatus: v.optional(v.string()),
    agentDid: v.optional(v.string()),
    threadId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const hoursBack = args.hoursBack || 24;
    const cutoffTime = Date.now() - (hoursBack * 60 * 60 * 1000);

    let query = ctx.db
      .query("keywordFlags")
      .withIndex("by_flagged_at", (q: any) => q.gte("flaggedAt", cutoffTime));

    let flags = await query
      .order("desc")
      .take(args.limit || 100);

    // Apply filters
    if (args.categories) {
      flags = flags.filter(flag => 
        flag.categories.some(cat => args.categories!.includes(cat))
      );
    }

    if (args.reviewStatus) {
      flags = flags.filter(flag => flag.reviewStatus === args.reviewStatus);
    }

    if (args.agentDid) {
      flags = flags.filter(flag => flag.agentDid === args.agentDid);
    }

    if (args.threadId) {
      flags = flags.filter(flag => flag.threadId === args.threadId);
    }

    // Enrich with review task information
    const enrichedFlags = await Promise.all(
      flags.map(async (flag) => {
        const reviewTask = await ctx.db
          .query("flagReviewTasks")
          .withIndex("by_flag", (q: any) => q.eq("flagId", flag._id))
          .first();

        return {
          ...flag,
          reviewTask,
        };
      })
    );

    return enrichedFlags.slice(0, args.limit || 50);
  },
});

// Flag statistics and compliance reporting
export const getFlagStatistics = query({
  args: {
    timeRangeHours: v.optional(v.number()),
    groupBy: v.optional(v.union(v.literal("category"), v.literal("agent"), v.literal("thread"), v.literal("hour"))),
  },
  handler: async (ctx, args) => {
    const timeRangeHours = args.timeRangeHours || 24;
    const cutoffTime = Date.now() - (timeRangeHours * 60 * 60 * 1000);

    const flags = await ctx.db
      .query("keywordFlags")
      .withIndex("by_flagged_at", (q: any) => q.gte("flaggedAt", cutoffTime))
      .collect();

    const statistics = {
      totalFlags: flags.length,
      uniqueAgents: new Set(flags.map(f => f.agentDid).filter(Boolean)).size,
      uniqueThreads: new Set(flags.map(f => f.threadId).filter(Boolean)).size,
      
      // Category breakdown
      byCategory: {} as Record<string, number>,
      
      // Review status breakdown
      byReviewStatus: {} as Record<string, number>,
      
      // Hourly activity (for time-based analysis)
      hourlyActivity: [] as Array<{ hour: number, flagCount: number }>,
      
      // Top flagged content types
      bySourceType: {} as Record<string, number>,
    };

    // Calculate category statistics
    flags.forEach(flag => {
      flag.categories.forEach(category => {
        statistics.byCategory[category] = (statistics.byCategory[category] || 0) + 1;
      });
      
      statistics.byReviewStatus[flag.reviewStatus] = 
        (statistics.byReviewStatus[flag.reviewStatus] || 0) + 1;
      
      statistics.bySourceType[flag.sourceType] = 
        (statistics.bySourceType[flag.sourceType] || 0) + 1;
    });

    // Calculate hourly activity for the last 24 hours
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - (i * 60 * 60 * 1000));
      const hourEnd = new Date(hourStart.getTime() + (60 * 60 * 1000));
      
      const hourlyFlags = flags.filter(flag => 
        flag.flaggedAt >= hourStart.getTime() && flag.flaggedAt < hourEnd.getTime()
      );
      
      statistics.hourlyActivity.push({
        hour: hourStart.getHours(),
        flagCount: hourlyFlags.length,
      });
    }

    return statistics;
  },
});

// Update flag review status (for human reviewers)
export const updateFlagReview = mutation({
  args: {
    flagId: v.id("keywordFlags"),
    reviewStatus: v.union(v.literal("approved"), v.literal("flagged"), v.literal("escalated"), v.literal("archived")),
    reviewerId: v.string(),
    reviewNotes: v.optional(v.string()),
    actionTaken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      await ctx.db.patch(args.flagId, {
        reviewStatus: args.reviewStatus,
        humanReviewed: true,
        reviewerId: args.reviewerId,
        reviewNotes: args.reviewNotes,
        actionTaken: args.actionTaken,
        reviewedAt: Date.now(),
      });

      // Update associated review task
      const reviewTask = await ctx.db
        .query("flagReviewTasks")
        .withIndex("by_flag", (q: any) => q.eq("flagId", args.flagId))
        .first();

      if (reviewTask) {
        await ctx.db.patch(reviewTask._id, {
          status: "completed",
          completedBy: args.reviewerId,
          completedAt: Date.now(),
        });
      }

      console.info(`Flag review completed: ${args.flagId} by ${args.reviewerId} - ${args.reviewStatus}`);
      return { success: true };
    } catch (error) {
      console.error(`Flag review update failed:`, error);
      throw error;
    }
  },
});

export default {
  flagKeywords,
  postMessageWithFlagging,
  createFlagReviewTask,
  getRecentFlags,
  getFlagStatistics,
  updateFlagReview,
};

