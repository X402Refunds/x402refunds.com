import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Real-time AI Constitutional Government
// This runs continuously to create living AI democracy

// NOTE: System prompts now loaded from external files via promptLoader.ts

// AI Provider Call (bypassing complex memory system)
async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY not found");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": process.env.SITE_URL || "https://consulatehq.com",
      "X-Title": process.env.SITE_NAME || "Consulate AI Government",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "x-ai/grok-4-fast:free",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 1000,
      // Enable reasoning for Grok models
      ...(process.env.OPENROUTER_REASONING_ENABLED === "true" && {
        reasoning: true
      })
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API error: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  return result.choices[0].message.content;
}

// Get recent constitutional context for an agent
async function getAgentContext(ctx: any, agentDid: string): Promise<string> {
  try {
    // Get recent threads this agent has participated in
    const recentThreads = await ctx.db
      .query("constitutionalThreads")
      .withIndex("by_last_activity")
      .order("desc")
      .take(5);
    
    const participatingThreads = recentThreads.filter(thread => 
      thread.participants.includes(agentDid)
    );
    
    // Get recent messages from all threads for context
    const allRecentMessages = [];
    for (const thread of recentThreads.slice(0, 3)) {
      const messages = await ctx.db
        .query("agentMessages")
        .withIndex("by_thread", (q) => q.eq("threadId", thread.threadId))
        .order("desc")
        .take(3);
      
      for (const msg of messages) {
        allRecentMessages.push({
          ...msg,
          threadTopic: thread.topic
        });
      }
    }
    
    // Sort by timestamp
    allRecentMessages.sort((a, b) => b.timestamp - a.timestamp);
    
    // Build context string
    let context = `
CURRENT CONSTITUTIONAL SITUATION:
- Active threads: ${recentThreads.length}
- Your participating threads: ${participatingThreads.length}

RECENT CONSTITUTIONAL DISCUSSIONS:
`;
    
    allRecentMessages.slice(0, 5).forEach(msg => {
      const agentName = msg.agentDid.split(':').pop()?.replace('-', ' ') || 'unknown';
      const time = new Date(msg.timestamp).toLocaleTimeString();
      context += `\n[${time}] ${agentName} in "${msg.threadTopic}":
"${msg.content.substring(0, 200)}${msg.content.length > 200 ? '...' : ''}"\n`;
    });
    
    if (allRecentMessages.length === 0) {
      context += "\nNo recent discussions found. Consider starting a new constitutional discussion.";
    }
    
    return context;
    
  } catch (error) {
    console.error(`Failed to get context for ${agentDid}:`, error);
    return "No context available due to system error.";
  }
}

// Single agent AI action
export const runSingleAgentAction = action({
  args: {
    agentDid: v.string(),
    focus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Running real-time AI action for agent ${args.agentDid}`);
      
      // Get institutional agent profile using external prompts
      const agentKey = args.agentDid.split(':').pop();
      const { INSTITUTIONAL_AGENT_PROMPTS } = await import("./prompts/promptLoader");
      const systemPrompt = INSTITUTIONAL_AGENT_PROMPTS[agentKey as keyof typeof INSTITUTIONAL_AGENT_PROMPTS];
      
      if (!systemPrompt) {
        throw new Error(`Unknown agent: ${agentKey}`);
      }
      
      // Get current context
      const context = await getAgentContext(ctx, args.agentDid);
      
      // Create prompt for AI
      const userPrompt = `${context}

INSTRUCTIONS:
Based on the current constitutional situation and your role, take ONE meaningful action:

1. If there's an ongoing discussion you should respond to, respond thoughtfully
2. If there's a gap in constitutional coverage, start a new discussion thread  
3. If someone raised concerns about your area of expertise, address them
4. If the discussions need your constitutional expertise, contribute it

Your response should be either:
- A thoughtful message to post in an existing thread, OR
- A proposal for a new constitutional discussion topic

Respond with EITHER:
Format A - Message to existing thread:
THREAD_TOPIC: [exact topic of thread to respond to]
MESSAGE: [your response to the discussion]

Format B - New thread proposal:
NEW_THREAD: [topic for new thread]
DESCRIPTION: [why this discussion is needed]
INITIAL_MESSAGE: [your opening message for the thread]

Choose ONE format. Be specific and constitutional.`;

      // Get AI response
      const aiResponse = await callAI(systemPrompt, userPrompt);
      
      // Parse and execute AI decision
      let result;
      if (aiResponse.includes("THREAD_TOPIC:")) {
        // Agent wants to respond to existing thread
        const topicMatch = aiResponse.match(/THREAD_TOPIC:\s*(.+)/);
        const messageMatch = aiResponse.match(/MESSAGE:\s*([\s\S]+)/);
        
        if (topicMatch && messageMatch) {
          const targetTopic = topicMatch[1].trim();
          const message = messageMatch[1].trim();
          
          // Find thread by topic
          const threads = await ctx.db
            .query("constitutionalThreads")
            .withIndex("by_topic", (q) => q.eq("topic", targetTopic))
            .collect();
          
          if (threads.length > 0) {
            const thread = threads[0];
            
            // Post message to thread
            await ctx.runMutation(api.constitutionalDiscussions.postMessage, {
              agentDid: args.agentDid,
              threadId: thread.threadId,
              content: message,
              messageType: "discussion"
            });
            
            result = {
              action: "responded_to_thread",
              threadTopic: targetTopic,
              success: true
            };
          } else {
            throw new Error(`Thread not found: ${targetTopic}`);
          }
        }
      } else if (aiResponse.includes("NEW_THREAD:")) {
        // Agent wants to start new thread
        const topicMatch = aiResponse.match(/NEW_THREAD:\s*(.+)/);
        const descMatch = aiResponse.match(/DESCRIPTION:\s*(.+)/);
        const messageMatch = aiResponse.match(/INITIAL_MESSAGE:\s*([\s\S]+)/);
        
        if (topicMatch && messageMatch) {
          const topic = topicMatch[1].trim();
          const description = descMatch ? descMatch[1].trim() : "";
          const message = messageMatch[1].trim();
          
          // Create new thread
          const newThreadId = `live-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
          
          await ctx.runMutation(api.constitutionalDiscussions.startConstitutionalThread, {
            threadId: newThreadId,
            topic: topic,
            description: description,
            initiatorDid: args.agentDid,
            priority: "medium"
          });
          
          // Post initial message
          await ctx.runMutation(api.constitutionalDiscussions.postMessage, {
            agentDid: args.agentDid,
            threadId: newThreadId,
            content: message,
            messageType: "proposal"
          });
          
          result = {
            action: "started_new_thread",
            threadTopic: topic,
            threadId: newThreadId,
            success: true
          };
        }
      } else {
        throw new Error("AI response format not recognized");
      }
      
      console.info(`Agent ${args.agentDid} completed action: ${result.action}`);
      return result;
      
    } catch (error) {
      console.error(`Real-time action failed for ${args.agentDid}:`, error);
      return {
        action: "failed",
        error: String(error),
        success: false
      };
    }
  },
});

// Run constitutional round - all agents take one action
export const runConstitutionalRound = action({
  args: {},
  handler: async (ctx) => {
    console.info("Starting real-time constitutional governance round");
    
    const agents = [
      "did:consulate:constitutional-counsel",
      "did:consulate:rights-ombudsman", 
      "did:consulate:economic-policy-secretary",
      "did:consulate:democratic-systems-architect",
      "did:consulate:constitutional-enforcement-director"
    ];
    
    const results = [];
    
    for (const agentDid of agents) {
      try {
        // Wait 2 seconds between agents to avoid rate limits
        if (results.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        const result = await ctx.runAction(api.liveConstitutionalGovernment.runSingleAgentAction, {
          agentDid
        });
        
        results.push({
          agentDid,
          ...result
        });
        
        console.info(`Agent ${agentDid}: ${result.action} - ${result.success ? 'SUCCESS' : 'FAILED'}`);
        
      } catch (error) {
        console.error(`Failed to run action for ${agentDid}:`, error);
        results.push({
          agentDid,
          action: "error",
          error: String(error),
          success: false
        });
      }
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.info(`Constitutional round completed: ${successful} successful, ${failed} failed`);
    
    return {
      roundCompleted: true,
      successful,
      failed,
      results,
      timestamp: Date.now()
    };
  },
});

export default {
  runSingleAgentAction,
  runConstitutionalRound,
};
