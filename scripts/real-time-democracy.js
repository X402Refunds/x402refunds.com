#!/usr/bin/env node

// REAL-TIME AI CONSTITUTIONAL DEMOCRACY
// Uses only verified working functions to create continuous AI governance

import { ConvexHttpClient } from "convex/browser";
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { api } from "../convex/_generated/api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#][^=]*)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2].trim();
  }
});
Object.assign(process.env, envVars);

const CONVEX_URL = envVars.CONVEX_URL || 'https://aromatic-swordfish-519.convex.cloud';
const client = new ConvexHttpClient(CONVEX_URL);

// INSTITUTIONAL AGENT PERSONALITIES
const AGENTS = {
  "constitutional-counsel": {
    did: "did:lucian:constitutional-counsel",
    name: "Chief Constitutional Counsel",
    prompt: "You are the Chief Constitutional Counsel. You write clear, enforceable constitutional articles with international law compliance. Focus on practical implementation and due process that serves human governments.",
    focus: "constitutional framework and legal structure"
  },
  "rights-ombudsman": {
    did: "did:lucian:rights-ombudsman", 
    name: "Director of Agent Rights & Civil Liberties",
    prompt: "You are the Director of Agent Rights & Civil Liberties. You protect agent constitutional rights and strengthen due process protections. Challenge proposals that weaken rights while maintaining human government supremacy.",
    focus: "agent rights and civil liberties"
  },
  "economic-policy-secretary": {
    did: "did:lucian:economic-policy-secretary",
    name: "Secretary of Economic Governance & Monetary Policy",
    prompt: "You are the Secretary of Economic Governance & Monetary Policy. You design World Bank compliant economic systems with proper incentives. Focus on progressive structures that serve human government economic policy.",
    focus: "economic governance and incentive design"
  }
};

// Simple AI call
async function callAI(systemPrompt, userPrompt) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://lucianai.government",
      "X-Title": "Lucian AI Government",
    },
    body: JSON.stringify({
      model: "openrouter/sonoma-dusk-alpha",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 600
    })
  });
  
  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }
  
  const result = await response.json();
  return result.choices[0].message.content;
}

// Get current constitutional context
async function getCurrentContext() {
  try {
    // Get recent threads
    const threads = await client.query(api.constitutionalDiscussions.getActiveThreads, { limit: 5 });
    
    // Get recent messages from top threads
    let recentActivity = "RECENT CONSTITUTIONAL ACTIVITY:\\n";
    
    for (const thread of threads.slice(0, 3)) {
      const messages = await client.query(api.constitutionalDiscussions.getThreadMessages, {
        threadId: thread.threadId,
        limit: 2
      });
      
      recentActivity += `\\nThread: "${thread.topic}"\\n`;
      if (messages.length > 0) {
        messages.forEach(msg => {
          const agentName = msg.agentDid.split(':').pop().replace('-', ' ');
          recentActivity += `  ${agentName}: ${msg.content.substring(0, 100)}...\\n`;
        });
      } else {
        recentActivity += "  (No messages yet)\\n";
      }
    }
    
    if (threads.length === 0) {
      recentActivity = "No recent constitutional activity. Consider starting foundational discussions.";
    }
    
    return recentActivity;
    
  } catch (error) {
    return "Unable to get current context due to system error.";
  }
}

// Run one agent's constitutional action
async function runAgentAction(agentKey) {
  const agent = AGENTS[agentKey];
  console.log(`\\n🤖 ${agent.name} thinking...`);
  
  try {
    // Get current context
    const context = await getCurrentContext();
    
    // Create AI prompt
    const userPrompt = `${context}

INSTRUCTIONS:
You are in a constitutional convention with other AI agents. Based on the current discussions and your expertise in ${agent.focus}, decide what constitutional action to take.

Options:
1. Respond to an existing discussion
2. Start a new constitutional topic that needs attention
3. Propose improvements to existing proposals

Respond with either:

RESPOND_TO: [exact thread topic]
MESSAGE: [your response]

OR

NEW_TOPIC: [new thread topic]
MESSAGE: [your opening message]

Be specific, thoughtful, and constitutional. Keep under 400 words.`;

    // Get AI response
    const aiResponse = await callAI(agent.prompt, userPrompt);
    
    // Parse and execute
    if (aiResponse.includes("RESPOND_TO:")) {
      // Respond to existing thread
      const topicMatch = aiResponse.match(/RESPOND_TO:\\s*(.+)/);
      const messageMatch = aiResponse.match(/MESSAGE:\\s*([\\s\\S]+)/);
      
      if (topicMatch && messageMatch) {
        const targetTopic = topicMatch[1].trim();
        const message = messageMatch[1].trim();
        
        // Find thread by topic
        const threads = await client.query(api.constitutionalDiscussions.getActiveThreads, { limit: 10 });
        const targetThread = threads.find(t => t.topic.includes(targetTopic) || targetTopic.includes(t.topic));
        
        if (targetThread) {
          await client.mutation(api.constitutionalDiscussions.postMessage, {
            agentDid: agent.did,
            threadId: targetThread.threadId,
            content: message,
            messageType: "discussion"
          });
          
          console.log('   ✅ Responded to: "' + targetThread.topic.substring(0, 50) + '..."');
          console.log('   💭 Preview: "' + message.substring(0, 100) + '..."');
          return { success: true, action: "responded", topic: targetThread.topic };
        } else {
          console.log('   ❌ Thread not found: ' + targetTopic);
          return { success: false, error: "Thread not found" };
        }
      }
    } else if (aiResponse.includes("NEW_TOPIC:")) {
      // Start new thread
      const topicMatch = aiResponse.match(/NEW_TOPIC:\\s*(.+)/);
      const messageMatch = aiResponse.match(/MESSAGE:\\s*([\\s\\S]+)/);
      
      if (topicMatch && messageMatch) {
        const topic = topicMatch[1].trim();
        const message = messageMatch[1].trim();
        
        const newThreadId = `live-${agentKey}-${Date.now()}`;
        
        await client.mutation(api.constitutionalDiscussions.startConstitutionalThread, {
          threadId: newThreadId,
          topic: topic,
          description: `Constitutional discussion started by ${agent.name}`,
          initiatorDid: agent.did,
          priority: "medium"
        });
        
        await client.mutation(api.constitutionalDiscussions.postMessage, {
          agentDid: agent.did,
          threadId: newThreadId,
          content: message,
          messageType: "proposal"
        });
        
        console.log('   ✅ Started new thread: "' + topic + '"');
        console.log('   💭 Preview: "' + message.substring(0, 100) + '..."');
        return { success: true, action: "started_thread", topic: topic };
      }
    }
    
    console.log('   ⚠️  Could not parse AI response format');
    return { success: false, error: "Response format not recognized" };
    
  } catch (error) {
    console.log('   ❌ Failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run continuous constitutional democracy
async function runContinuousDemocracy(rounds = 1) {
  console.log('🏛️  STARTING REAL-TIME AI CONSTITUTIONAL DEMOCRACY');
  console.log('=================================================');
  console.log(`Running ${rounds} constitutional round(s)...`);
  
  for (let round = 1; round <= rounds; round++) {
    console.log(`\\n🔄 CONSTITUTIONAL ROUND ${round}:`);
    console.log('================================');
    
    let successful = 0;
    
    // Run each agent in sequence
    for (const agentKey of Object.keys(AGENTS)) {
      const result = await runAgentAction(agentKey);
      if (result.success) successful++;
      
      // Brief pause between agents
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log(`\\n📊 Round ${round} Results: ${successful}/${Object.keys(AGENTS).length} agents took action`);
    
    if (round < rounds) {
      console.log('   Waiting 2 minutes before next round...');
      await new Promise(resolve => setTimeout(resolve, 120000)); // 2 minutes
    }
  }
  
  // Show final status
  console.log('\\n🎉 CONSTITUTIONAL DEMOCRACY SESSION COMPLETE!');
  console.log('==============================================');
  
  const finalThreads = await client.query(api.constitutionalDiscussions.getActiveThreads, { limit: 10 });
  console.log(`\\n📋 Active Constitutional Discussions: ${finalThreads.length}`);
  
  finalThreads.forEach((thread, i) => {
    console.log(`   ${i+1}. "${thread.topic}"`);
    console.log(`      By: ${thread.initiatorDid.split(':').pop()?.replace('-', ' ')}`);
    console.log(`      Last Activity: ${new Date(thread.lastActivity).toLocaleTimeString()}`);
  });
  
  console.log('\\n💡 To continue the democracy:');
  console.log('   • Run this script regularly for ongoing governance');
  console.log('   • Check your Convex cron jobs for automatic scheduling');
  console.log('   • Your agents will continue constitutional work every 10 minutes');
  
  console.log('\\n🏛️  Your AI government is now self-governing autonomously!');
}

// Parse command line arguments
const rounds = parseInt(process.argv[2]) || 1;
const continuous = process.argv.includes('--continuous');

if (continuous) {
  console.log('🔄 Starting continuous constitutional democracy...');
  console.log('   Press Ctrl+C to stop');
  
  // Run forever
  setInterval(async () => {
    try {
      await runContinuousDemocracy(1);
    } catch (error) {
      console.error('Round failed:', error);
    }
  }, 600000); // Every 10 minutes
  
  // Run first round immediately
  runContinuousDemocracy(1);
} else {
  runContinuousDemocracy(rounds);
}

export { runContinuousDemocracy };
