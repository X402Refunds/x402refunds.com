import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// AI Provider Configuration
const AI_PROVIDERS = {
  openrouter: {
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    model: process.env.OPENROUTER_MODEL || "x-ai/grok-4-fast:free",
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.SITE_URL || "https://consulatehq.com",
      "X-Title": process.env.SITE_NAME || "Consulate AI Government",
    }),
  },
  anthropic: {
    endpoint: "https://api.anthropic.com/v1/messages",
    model: "claude-3-5-sonnet-20241022",
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    }),
  },
  openai: {
    endpoint: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o",
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    }),
  }
};

// Agent Action Types that AI can take
interface AgentAction {
  type: "post_message" | "create_proposal" | "vote" | "create_thread" | "react_to_message" | "update_memory" | "schedule_task";
  params: any;
  priority: "low" | "medium" | "high" | "urgent";
  reasoning: string;
}

// Format agent context for AI
function formatContextForAI(context: any): string {
  const { profile, recentMemories, activeThreads, pendingTasks, activeDocuments } = context;
  
  return `
CURRENT CONTEXT FOR ${profile.name} (${profile.role})

=== YOUR IDENTITY ===
Role: ${profile.role}
Specialties: ${profile.specialties.join(', ')}
Personality: ${profile.personality}

=== RECENT ACTIVITIES (Working Memory) ===
${recentMemories.slice(0, 5).map((memory: any) => 
  `- [${new Date(memory.createdAt).toLocaleTimeString()}] ${memory.content.action || memory.topic}: ${memory.content.description || JSON.stringify(memory.content).substring(0, 100)}`
).join('\n') || "No recent activities"}

=== ACTIVE CONSTITUTIONAL DISCUSSIONS ===
${activeThreads.map((thread: any) => 
  `- "${thread.topic}" (${thread.status}, ${thread.participants.length} participants, priority: ${thread.priority})
    Last activity: ${new Date(thread.lastActivity).toLocaleString()}`
).join('\n') || "No active threads"}

=== PENDING TASKS REQUIRING YOUR ATTENTION ===
${pendingTasks.map((task: any) => 
  `- [${task.priority.toUpperCase()}] ${task.taskType}: ${task.description}
    Context: ${JSON.stringify(task.context).substring(0, 100)}...`
).join('\n') || "No pending tasks"}

=== CURRENT CONSTITUTIONAL STATUS ===
Active Documents: ${activeDocuments.length} documents in discussion phase
${activeDocuments.map((doc: any) => 
  `- "${doc.title}" (${doc.category}, ${doc.votes.length} votes so far)`
).join('\n') || "No documents currently being voted on"}

=== INSTRUCTIONS ===
Based on your role, personality, and the current context, decide what actions to take.
You can:
1. POST_MESSAGE - Participate in existing discussions
2. CREATE_THREAD - Start new constitutional discussions  
3. CREATE_PROPOSAL - Draft new constitutional articles or amendments
4. VOTE - Vote on constitutional proposals
5. REACT_TO_MESSAGE - React to others' messages (agree, disagree, question, important)
6. SCHEDULE_TASK - Schedule future work for yourself

Consider your established positions and working style. Be proactive but thoughtful.
You should typically take 1-3 actions based on the current context.

Respond with a JSON array of actions in this format:
[
  {
    "type": "post_message",
    "params": {
      "threadId": "string",
      "content": "your message content",
      "messageType": "discussion|proposal|question|objection|support",
      "metadata": {"confidence": 0.8, "tags": ["relevant", "tags"]}
    },
    "priority": "medium",
    "reasoning": "Why you're taking this action"
  }
]

IMPORTANT: Only respond with valid JSON. No other text before or after.
  `.trim();
}

// Call AI Provider - OpenRouter first, then fallbacks
async function callAIProvider(systemPrompt: string, userPrompt: string, preferredProvider: "openrouter" | "anthropic" | "openai" = "openrouter"): Promise<string> {
  // Try providers in order of preference
  const providers = preferredProvider === "openrouter" 
    ? ["openrouter", "anthropic", "openai"]
    : preferredProvider === "anthropic"
    ? ["anthropic", "openai", "openrouter"] 
    : ["openai", "anthropic", "openrouter"];

  for (const provider of providers) {
    try {
      let apiKey: string | undefined;
      
      switch (provider) {
        case "openrouter":
          apiKey = process.env.OPENROUTER_API_KEY;
          break;
        case "anthropic":
          apiKey = process.env.ANTHROPIC_API_KEY;
          break;
        case "openai":
          apiKey = process.env.OPENAI_API_KEY;
          break;
      }

      if (!apiKey) {
        console.warn(`${provider} API key not found, trying next provider`);
        continue;
      }

      const config = AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS];
      let requestBody: any;
      
      if (provider === "anthropic") {
        // Anthropic format
        requestBody = {
          model: config.model,
          max_tokens: 2000,
          temperature: 0.1,
          system: systemPrompt,
          messages: [{
            role: "user",
            content: userPrompt
          }]
        };
      } else {
        // OpenAI/OpenRouter format
        requestBody = {
          model: config.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.1,
          max_tokens: 2000,
          // Enable reasoning for Grok models  
          ...(provider === "openrouter" && process.env.OPENROUTER_REASONING_ENABLED === "true" && {
            reasoning: {}
          })
        };
      }

      const response = await fetch(config.endpoint, {
        method: "POST",
        headers: config.headers(apiKey),
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`${provider} API error: ${response.status} - ${errorText}`);
        continue; // Try next provider
      }

      const result = await response.json();
      
      // Log basic model information  
      console.info(`🤖 AI Model Used: ${config.model} via ${provider.toUpperCase()}`);
      
      let responseText: string;
      if (provider === "anthropic") {
        responseText = result.content[0].text;
      } else {
        responseText = result.choices[0].message.content;
      }

      console.info(`✅ Successfully used ${provider}/${config.model} for AI inference`);
      return responseText;
      
    } catch (error) {
      console.warn(`${provider} provider failed:`, error);
      continue; // Try next provider
    }
  }

  throw new Error("All AI providers failed - check your API keys and network connection");
}

// Parse AI response into structured actions
function parseAgentActions(aiResponse: string, agentDid: string): AgentAction[] {
  try {
    // Clean up the response - sometimes AI adds markdown formatting
    let cleanResponse = aiResponse.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
    }
    if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const actions = JSON.parse(cleanResponse);
    
    if (!Array.isArray(actions)) {
      throw new Error("AI response must be an array of actions");
    }

    // Validate each action
    return actions.map((action: any) => {
      if (!action.type || !action.params || !action.reasoning) {
        throw new Error("Each action must have type, params, and reasoning");
      }
      
      const validTypes = ["post_message", "create_proposal", "vote", "create_thread", "react_to_message", "update_memory", "schedule_task"];
      if (!validTypes.includes(action.type)) {
        throw new Error(`Invalid action type: ${action.type}`);
      }

      return {
        type: action.type,
        params: action.params,
        priority: action.priority || "medium",
        reasoning: action.reasoning
      };
    });
  } catch (error) {
    console.error(`Failed to parse AI response from ${agentDid}:`, error);
    console.error(`Raw AI response:`, aiResponse);
    
    // Return a default action if parsing fails
    return [{
      type: "update_memory",
      params: {
        content: { error: "Failed to parse AI response", rawResponse: aiResponse.substring(0, 500) },
        topic: "parsing_error",
      },
      priority: "low",
      reasoning: "Failed to parse AI response, storing for debugging"
    }];
  }
}

// Execute agent actions
async function executeAgentActions(ctx: any, agentDid: string, actions: AgentAction[]): Promise<any[]> {
  const results = [];

  for (const action of actions) {
    try {
      let result;
      
      switch (action.type) {
        case "post_message":
          // Find thread by topic if threadId looks like a topic name
          let threadId = action.params.threadId;
          if (!threadId.startsWith("thread-")) {
            // Try to find thread by topic using getActiveThreads query
            const allThreads = await ctx.runQuery(api.constitutionalDiscussions.getActiveThreads, { limit: 100 });
            const matchingThreads = allThreads.filter(t => t.topic === threadId || t.topic.toLowerCase().includes(threadId.toLowerCase()));
            
            if (matchingThreads.length > 0) {
              threadId = matchingThreads[0].threadId;
            } else {
              throw new Error(`No thread found for topic: ${action.params.threadId}`);
            }
          }
          
          result = await ctx.runMutation(api.constitutionalDiscussions.postMessage, {
            agentDid,
            threadId,
            content: action.params.content,
            messageType: action.params.messageType || "discussion",
            metadata: action.params.metadata,
          });
          break;

        case "create_thread":
          const newThreadId = `thread-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
          result = await ctx.runMutation(api.constitutionalDiscussions.startConstitutionalThread, {
            threadId: newThreadId,
            topic: action.params.topic || action.params.description || "Constitutional Discussion", // Ensure topic is provided
            description: action.params.description,
            initiatorDid: agentDid,
            priority: action.params.priority || "medium",
          });
          break;

        case "react_to_message":
          result = await ctx.runMutation(api.constitutionalDiscussions.addMessageReaction, {
            messageId: action.params.messageId,
            agentDid,
            reaction: action.params.reaction,
          });
          break;

        case "update_memory":
          result = await ctx.runMutation(api.constitutionalAgents.storeAgentMemory, {
            agentDid,
            memoryType: action.params.memoryType || "working",
            content: action.params.content,
            topic: action.params.topic,
            relevanceScore: action.params.relevanceScore || 0.7,
            sourceType: action.params.sourceType || "system",
            sourceId: action.params.sourceId,
            expiresAt: action.params.expiresAt,
          });
          break;

        case "schedule_task":
          // Use a proper mutation for task creation
          result = await ctx.runMutation(api.constitutionalAgents.storeAgentMemory, {
            agentDid,
            memoryType: "procedural",
            content: {
              taskType: action.params.taskType,
              description: action.params.description,
              context: action.params.context,
              scheduledFor: action.params.scheduledFor || (Date.now() + 3600000),
            },
            topic: action.params.taskType || "scheduled_task",
            relevanceScore: 0.7,
            sourceType: "system",
            sourceId: `scheduled-task-${Date.now()}`,
          });
          break;

        // TODO: Add create_proposal and vote actions when constitutional documents system is ready
        case "create_proposal":
        case "vote":
          result = { 
            message: `${action.type} not yet implemented - constitutional documents system pending`,
            action: action.type,
            params: action.params
          };
          break;

        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      results.push({
        action: action.type,
        success: true,
        result,
        reasoning: action.reasoning
      });

      console.info(`Executed ${action.type} for agent ${agentDid}: ${action.reasoning}`);
      
    } catch (error) {
      console.error(`Failed to execute action ${action.type} for agent ${agentDid}:`, error);
      results.push({
        action: action.type,
        success: false,
        error: String(error),
        reasoning: action.reasoning
      });
    }
  }

  return results;
}

// Main AI inference action
export const runAgentInference = action({
  args: {
    agentDid: v.string(),
    triggerType: v.optional(v.string()), // "scheduled", "event_triggered", "manual"
    triggerContext: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Starting AI inference for agent ${args.agentDid}`);

      // Build agent context
      const context = await ctx.runQuery(api.constitutionalAgents.buildAgentContext, {
        agentDid: args.agentDid,
      });

      if (!context.profile) {
        throw new Error(`Agent profile not found for ${args.agentDid}`);
      }

      // Format context for AI
      const userPrompt = formatContextForAI(context);
      const systemPrompt = context.profile.systemPrompt;

      // Call AI provider - try OpenRouter first (user's preferred)
      const aiResponse = await callAIProvider(systemPrompt, userPrompt, "openrouter");

      // Parse AI response into actions
      const actions = parseAgentActions(aiResponse, args.agentDid);

      // Execute actions
      const results = await executeAgentActions(ctx, args.agentDid, actions);

      // Store inference as episodic memory 
      await ctx.runMutation(api.constitutionalAgents.storeAgentMemory, {
        agentDid: args.agentDid,
        memoryType: "episodic",
        content: {
          event: "ai_inference_completed",
          triggerType: args.triggerType || "unknown",
          actionsPlanned: actions.length,
          actionsExecuted: results.filter(r => r.success).length,
          actionsFailed: results.filter(r => !r.success).length,
          rawResponse: aiResponse.substring(0, 500),
        },
        topic: "ai_inference",
        relevanceScore: 0.8,
        sourceType: "system",
        sourceId: `inference-${Date.now()}`,
      });

      console.info(`Completed AI inference for agent ${args.agentDid}: ${actions.length} actions planned, ${results.filter(r => r.success).length} executed`);

      return {
        agentDid: args.agentDid,
        success: true,
        actionsPlanned: actions.length,
        actionsExecuted: results.filter(r => r.success).length,
        actionsFailed: results.filter(r => !r.success).length,
        results,
        contextSnapshot: {
          recentMemories: context.recentMemories?.length || 0,
          activeThreads: context.activeThreads?.length || 0,
          pendingTasks: context.pendingTasks?.length || 0,
        }
      };
    } catch (error) {
      console.error(`AI inference failed for agent ${args.agentDid}:`, error);
      
      // Store failure as episodic memory
      await ctx.runMutation(api.constitutionalAgents.storeAgentMemory, {
        agentDid: args.agentDid,
        memoryType: "episodic",
        content: {
          event: "ai_inference_failed",
          error: String(error),
          triggerType: args.triggerType || "unknown",
        },
        topic: "ai_inference_error",
        relevanceScore: 0.9,
        sourceType: "system",
        sourceId: `inference-error-${Date.now()}`,
      });

      return {
        agentDid: args.agentDid,
        success: false,
        error: String(error),
        actionsPlanned: 0,
        actionsExecuted: 0,
        actionsFailed: 1,
      };
    }
  },
});

// Process pending tasks for an agent
export const processPendingTasks = action({
  args: {
    agentDid: v.string(),
    maxTasks: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const now = Date.now();
      
      // Get pending tasks for this agent that are ready to execute
      // Since agentTasks table might not exist yet, return empty for now
      const tasks: any[] = [];
      // TODO: Implement agentTasks table and proper task management later

      if (tasks.length === 0) {
        return { message: "No pending tasks ready for execution", tasksProcessed: 0 };
      }

      console.info(`Processing ${tasks.length} pending tasks for agent ${args.agentDid}`);

      // Mark tasks as in progress
      for (const task of tasks) {
        await ctx.db.patch(task._id, {
          status: "in_progress",
        });
      }

      // Run AI inference with task context
      const result = await ctx.runAction(api.aiInference.runAgentInference, {
        agentDid: args.agentDid,
        triggerType: "task_processing",
        triggerContext: {
          taskCount: tasks.length,
          taskTypes: tasks.map(t => t.taskType),
        },
      });

      // Mark tasks as completed
      for (const task of tasks) {
        await ctx.db.patch(task._id, {
          status: "completed",
          completedAt: Date.now(),
          result: {
            inferenceResult: result,
            processedAt: Date.now(),
          },
        });
      }

      return {
        message: `Processed ${tasks.length} tasks for agent ${args.agentDid}`,
        tasksProcessed: tasks.length,
        inferenceResult: result,
      };
    } catch (error) {
      console.error(`Failed to process tasks for agent ${args.agentDid}:`, error);
      throw error;
    }
  },
});

// Schedule inference for all active constitutional agents
export const scheduleAllAgentInferences = action({
  args: {},
  handler: async (ctx) => {
    try {
      const agents = await ctx.runQuery(api.constitutionalAgents.getConstitutionalAgents);
      const activeAgents = agents.filter(agent => agent.status === "active");

      console.info(`Scheduling inference for ${activeAgents.length} constitutional agents`);

      const results = [];
      for (const agent of activeAgents) {
        try {
          const result = await ctx.runAction(api.aiInference.processPendingTasks, {
            agentDid: agent.did,
            maxTasks: 3,
          });
          results.push({ agentDid: agent.did, success: true, result });
        } catch (error) {
          console.error(`Failed to process tasks for agent ${agent.did}:`, error);
          results.push({ agentDid: agent.did, success: false, error: String(error) });
        }
      }

      return {
        message: `Processed inference for ${activeAgents.length} agents`,
        results,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      };
    } catch (error) {
      console.error("Failed to schedule all agent inferences:", error);
      throw error;
    }
  },
});

export default {
  runAgentInference,
  processPendingTasks,
  scheduleAllAgentInferences,
};
