import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Constitutional Thread Management
export const startConstitutionalThread = mutation({
  args: {
    threadId: v.string(),
    topic: v.string(),
    description: v.optional(v.string()),
    initiatorDid: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    documentId: v.optional(v.id("constitutionalDocuments")),
  },
  handler: async (ctx, args) => {
    try {
      const threadDbId = await ctx.db.insert("constitutionalThreads", {
        threadId: args.threadId,
        topic: args.topic,
        description: args.description,
        initiatorDid: args.initiatorDid,
        status: "active",
        participants: [args.initiatorDid], // Start with initiator
        documentId: args.documentId,
        priority: args.priority,
        createdAt: Date.now(),
        lastActivity: Date.now(),
      });

      // Store this as episodic memory for the initiator
      await ctx.runMutation(api.constitutionalAgents.storeAgentMemory, {
        agentDid: args.initiatorDid,
        memoryType: "episodic",
        content: {
          event: "started_constitutional_thread",
          threadId: args.threadId,
          topic: args.topic,
          priority: args.priority,
        },
        topic: args.topic,
        relevanceScore: 0.9,
        sourceType: "discussion",
        sourceId: args.threadId,
      });

      console.info(`Started constitutional thread: ${args.topic} by ${args.initiatorDid}`);
      return { threadDbId, threadId: args.threadId };
    } catch (error) {
      console.error(`Failed to start constitutional thread: ${args.topic}`, error);
      throw error;
    }
  },
});

// Post message to constitutional thread
export const postMessage = mutation({
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
      // Find the thread
      const thread = await ctx.db
        .query("constitutionalThreads")
        .withIndex("by_thread_id", (q) => q.eq("threadId", args.threadId))
        .first();

      if (!thread) {
        throw new Error(`Constitutional thread not found: ${args.threadId}`);
      }

      // Post the message
      const messageId = await ctx.db.insert("agentMessages", {
        agentDid: args.agentDid,
        threadId: args.threadId,
        replyTo: args.replyTo,
        content: args.content,
        messageType: args.messageType,
        metadata: args.metadata,
        timestamp: Date.now(),
      });

      // Add agent to participants if not already there
      if (!thread.participants.includes(args.agentDid)) {
        await ctx.db.patch(thread._id, {
          participants: [...thread.participants, args.agentDid],
          lastActivity: Date.now(),
        });
      } else {
        // Update last activity
        await ctx.db.patch(thread._id, {
          lastActivity: Date.now(),
        });
      }

      // Store as working memory for the agent
      await ctx.runMutation(api.constitutionalAgents.storeAgentMemory, {
        agentDid: args.agentDid,
        memoryType: "working",
        content: {
          action: "posted_message",
          threadId: args.threadId,
          messageType: args.messageType,
          content: args.content.substring(0, 200) + (args.content.length > 200 ? "..." : ""),
          topic: thread.topic,
        },
        topic: thread.topic,
        relevanceScore: 0.8,
        sourceType: "discussion",
        sourceId: messageId,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // Working memory expires in 24 hours
      });

      // If this is a significant message type, store as episodic memory
      if (["proposal", "amendment", "vote"].includes(args.messageType)) {
        await ctx.runMutation(api.constitutionalAgents.storeAgentMemory, {
          agentDid: args.agentDid,
          memoryType: "episodic",
          content: {
            event: `posted_${args.messageType}`,
            threadId: args.threadId,
            topic: thread.topic,
            messageContent: args.content,
          },
          topic: thread.topic,
          relevanceScore: 0.9,
          sourceType: "proposal",
          sourceId: messageId,
        });
      }

      // Notify other participants by creating tasks for them to review
      for (const participantDid of thread.participants) {
        if (participantDid !== args.agentDid) {
          await ctx.db.insert("agentTasks", {
            agentDid: participantDid,
            taskType: "participate_discussion",
            priority: thread.priority === "critical" ? "urgent" : "medium",
            description: `New ${args.messageType} in thread: ${thread.topic}`,
            context: {
              threadId: args.threadId,
              messageId: messageId,
              fromAgent: args.agentDid,
              messageType: args.messageType,
              threadTopic: thread.topic,
            },
            status: "pending",
            scheduledFor: Date.now() + 300000, // 5 minutes delay to allow for batching
            createdAt: Date.now(),
          });
        }
      }

      console.info(`Agent ${args.agentDid} posted ${args.messageType} to thread ${args.threadId}`);
      return { messageId, thread: thread.topic };
    } catch (error) {
      console.error(`Failed to post message in thread ${args.threadId}:`, error);
      throw error;
    }
  },
});

// Get messages from a constitutional thread
export const getThreadMessages = query({
  args: {
    threadId: v.string(),
    limit: v.optional(v.number()),
    messageTypes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("agentMessages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId));

    if (args.messageTypes && args.messageTypes.length > 0) {
      query = query.filter((q) => args.messageTypes!.includes(q.field("messageType")));
    }

    const messages = await query
      .order("asc") // Chronological order for discussions
      .take(args.limit || 50);

    return messages;
  },
});

// Get active constitutional threads
export const getActiveThreads = query({
  args: {
    agentDid: v.optional(v.string()), // Filter by agent participation
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("constitutionalThreads");

    if (args.status) {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status));
    } else {
      query = query.withIndex("by_status", (q) => q.eq("status", "active"));
    }

    let threads = await query
      .order("desc") // Most recent first
      .take(args.limit || 20);

    // Filter by agent participation if specified
    if (args.agentDid) {
      threads = threads.filter(thread => thread.participants.includes(args.agentDid));
    }

    // Filter by priority if specified
    if (args.priority) {
      threads = threads.filter(thread => thread.priority === args.priority);
    }

    // Enrich with recent message counts
    const enrichedThreads = await Promise.all(
      threads.map(async (thread) => {
        const messageCount = (await ctx.db
          .query("agentMessages")
          .withIndex("by_thread", (q) => q.eq("threadId", thread.threadId))
          .collect()).length;

        const recentMessages = await ctx.db
          .query("agentMessages")
          .withIndex("by_thread", (q) => q.eq("threadId", thread.threadId))
          .order("desc")
          .take(3);

        return {
          ...thread,
          messageCount,
          recentMessages,
        };
      })
    );

    return enrichedThreads;
  },
});

// Add reaction to a message
export const addMessageReaction = mutation({
  args: {
    messageId: v.id("agentMessages"),
    agentDid: v.string(),
    reaction: v.string(), // "agree", "disagree", "question", "important"
  },
  handler: async (ctx, args) => {
    try {
      const message = await ctx.db.get(args.messageId);
      if (!message) {
        throw new Error("Message not found");
      }

      const existingReactions = message.reactions || [];
      
      // Remove existing reaction from this agent if any
      const filteredReactions = existingReactions.filter(r => r.agentDid !== args.agentDid);
      
      // Add new reaction
      const newReactions = [...filteredReactions, {
        agentDid: args.agentDid,
        reaction: args.reaction,
        timestamp: Date.now(),
      }];

      await ctx.db.patch(args.messageId, {
        reactions: newReactions,
      });

      console.info(`Agent ${args.agentDid} reacted ${args.reaction} to message ${args.messageId}`);
      return { success: true };
    } catch (error) {
      console.error(`Failed to add reaction:`, error);
      throw error;
    }
  },
});

// Archive or close a constitutional thread
export const updateThreadStatus = mutation({
  args: {
    threadId: v.string(),
    newStatus: v.union(v.literal("active"), v.literal("voting"), v.literal("ratified"), v.literal("rejected"), v.literal("archived")),
    updaterDid: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const thread = await ctx.db
        .query("constitutionalThreads")
        .withIndex("by_thread_id", (q) => q.eq("threadId", args.threadId))
        .first();

      if (!thread) {
        throw new Error(`Thread not found: ${args.threadId}`);
      }

      await ctx.db.patch(thread._id, {
        status: args.newStatus,
        lastActivity: Date.now(),
      });

      // Post system message about status change
      await ctx.runMutation(api.constitutionalDiscussions.postMessage, {
        agentDid: args.updaterDid,
        threadId: args.threadId,
        content: `Thread status updated to: ${args.newStatus}${args.reason ? `. Reason: ${args.reason}` : ''}`,
        messageType: "discussion",
        metadata: {
          priority: "system",
          tags: ["status_change"],
        },
      });

      console.info(`Thread ${args.threadId} status updated to ${args.newStatus}`);
      return { success: true };
    } catch (error) {
      console.error(`Failed to update thread status:`, error);
      throw error;
    }
  },
});

// Search messages across threads
export const searchMessages = query({
  args: {
    searchTerm: v.string(),
    agentDid: v.optional(v.string()),
    threadId: v.optional(v.string()),
    messageType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("agentMessages");

    // Apply filters
    if (args.agentDid) {
      query = query.withIndex("by_agent", (q) => q.eq("agentDid", args.agentDid));
    } else if (args.threadId) {
      query = query.withIndex("by_thread", (q) => q.eq("threadId", args.threadId));
    } else if (args.messageType) {
      query = query.withIndex("by_message_type", (q) => q.eq("messageType", args.messageType));
    }

    const messages = await query
      .order("desc")
      .take(args.limit || 100);

    // Simple text search (in production, use vector search)
    const searchTermLower = args.searchTerm.toLowerCase();
    const filteredMessages = messages.filter(message => 
      message.content.toLowerCase().includes(searchTermLower)
    );

    return filteredMessages.slice(0, args.limit || 20);
  },
});

// Get thread statistics
export const getThreadStatistics = query({
  args: {
    threadId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const thread = await ctx.db
        .query("constitutionalThreads")
        .withIndex("by_thread_id", (q) => q.eq("threadId", args.threadId))
        .first();

      if (!thread) {
        throw new Error(`Thread not found: ${args.threadId}`);
      }

      const messages = await ctx.db
        .query("agentMessages")
        .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
        .collect();

      // Calculate statistics
      const messagesByType = messages.reduce((acc, msg) => {
        acc[msg.messageType] = (acc[msg.messageType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const messagesByAgent = messages.reduce((acc, msg) => {
        acc[msg.agentDid] = (acc[msg.agentDid] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const timespan = messages.length > 0 
        ? Math.max(...messages.map(m => m.timestamp)) - Math.min(...messages.map(m => m.timestamp))
        : 0;

      return {
        thread,
        statistics: {
          totalMessages: messages.length,
          participantCount: thread.participants.length,
          messagesByType,
          messagesByAgent,
          timespan,
          averageMessagesPerParticipant: messages.length / thread.participants.length,
        },
      };
    } catch (error) {
      console.error(`Failed to get thread statistics:`, error);
      throw error;
    }
  },
});

export default {
  startConstitutionalThread,
  postMessage,
  getThreadMessages,
  getActiveThreads,
  addMessageReaction,
  updateThreadStatus,
  searchMessages,
  getThreadStatistics,
};
