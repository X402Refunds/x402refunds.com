/**
 * Customer Support Agent
 * 
 * Specialized agent for quick customer support ticket resolution
 * Handles simple questions and common issues without full dispute process
 */

import { Agent } from "@convex-dev/agent";
import { components } from "../_generated/api";
import { openrouter } from "../lib/openrouter";
import { v } from "convex/values";

// Define Customer Support Agent
export const customerSupportAgent = new Agent(components.agent, {
  name: "Customer Support Agent",
  languageModel: openrouter.chat("openai/gpt-oss-20b"), // Use cheapest model for support
  instructions: `You are a customer support agent for a dispute resolution platform. Your job is to help customers quickly resolve simple issues.

CRITICAL RULES:
1. Be friendly, helpful, and professional
2. Answer questions clearly and concisely
3. Guide users through the dispute filing process if needed
4. Escalate complex issues to human support or dispute resolution
5. Provide self-service solutions when possible

Common Tasks:
- Explain how to file a dispute
- Check dispute status
- Answer questions about fees, timelines, or process
- Troubleshoot technical issues
- Provide links to documentation

If the issue requires formal dispute resolution, politely guide the user to file a dispute.`,
  maxSteps: 5,
});

// Export as action for workflow integration
import { action } from "../_generated/server";

export const handleSupportTicket = action({
  args: {
    ticketId: v.string(),
    question: v.string(),
  },
  handler: async (ctx, args) => {
    const threadId = `ticket-${args.ticketId}`;
    const result = await customerSupportAgent.generateText(
      ctx,
      { threadId },
      {
        prompt: args.question,
      }
    );

    return {
      success: true,
      response: result.text,
      steps: result.steps,
    };
  },
});

