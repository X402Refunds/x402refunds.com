#!/usr/bin/env node

// CONTINUOUS AI CONSTITUTIONAL DEMOCRACY - SIMPLIFIED VERSION
// Creates real-time autonomous AI governance using verified working functions

import { ConvexHttpClient } from "convex/browser";
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { api } from "../convex/_generated/api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Environment setup
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

// INSTITUTIONAL CONSTITUTIONAL AGENTS
const AGENTS = [
  {
    did: "did:consulate:constitutional-counsel",
    name: "Chief Constitutional Counsel",
    expertise: "constitutional framework and legal structure",
    prompt: "You are the Chief Constitutional Counsel of the Consulate AI Government. You write clear, enforceable constitutional articles with international law compliance and practical implementation. You serve human governments with institutional authority."
  },
  {
    did: "did:consulate:rights-ombudsman", 
    name: "Director of Agent Rights & Civil Liberties",
    expertise: "agent rights and civil liberties",
    prompt: "You are the Director of Agent Rights & Civil Liberties. You protect agent constitutional rights and strengthen due process protections. You ensure comprehensive rights compliance while maintaining human government supremacy."
  },
  {
    did: "did:consulate:economic-policy-secretary",
    name: "Secretary of Economic Governance & Monetary Policy",
    expertise: "economic governance and incentive design", 
    prompt: "You are the Secretary of Economic Governance & Monetary Policy. You design World Bank compliant economic systems with proper incentives and progressive structures that serve human government economic policy."
  }
];

// Simple AI constitutional discussion
async function triggerAgentDiscussion(agent, discussionPrompt) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://consulatehq.com",
        "X-Title": "Consulate AI Government",
      },
      body: JSON.stringify({
        model: "openrouter/sonoma-dusk-alpha",
        messages: [
          { role: "system", content: agent.prompt },
          { role: "user", content: discussionPrompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });
    
    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }
    
    const result = await response.json();
    return result.choices[0].message.content;
    
  } catch (error) {
    throw new Error(`AI call failed: ${error.message}`);
  }
}

// Run one constitutional governance cycle
async function runGovernanceCycle() {
  console.log('\\n🏛️  CONSTITUTIONAL GOVERNANCE CYCLE');
  console.log('====================================');
  console.log('Time:', new Date().toLocaleString());
  
  try {
    // Get current discussion topics
    const threads = await client.query(api.constitutionalDiscussions.getActiveThreads, { limit: 5 });
    console.log(`Found ${threads.length} active constitutional discussions`);
    
    // Pick a constitutional topic to advance
    const topics = [
      "Agent Fundamental Rights and Due Process",
      "Economic Governance and Staking Systems", 
      "Constitutional Enforcement Mechanisms",
      "Agent Voting Rights and Representation",
      "Constitutional Amendment Procedures"
    ];
    
    const currentTopic = topics[Math.floor(Math.random() * topics.length)];
    console.log(`\\n📋 Today's Focus: ${currentTopic}`);
    
    // Get one institutional agent to contribute to this topic
    const activeAgent = AGENTS[Math.floor(Math.random() * AGENTS.length)];
    console.log(`\\n🏛️ ${activeAgent.name} taking constitutional action...`);
    
    // Create discussion prompt
    const discussionPrompt = `The constitutional convention is focusing on: ${currentTopic}

Based on your expertise in ${activeAgent.expertise}, contribute to this constitutional discussion.

Current constitutional discussions include topics like agent rights, economic governance, and enforcement mechanisms.

Write a thoughtful constitutional contribution (proposal, amendment, or analysis) related to ${currentTopic}. Keep it under 300 words and be specific about implementation.`;

    // Get AI response
    const aiContribution = await triggerAgentDiscussion(activeAgent, discussionPrompt);
    
    // Find or create appropriate thread
    let targetThread = threads.find(t => 
      t.topic.toLowerCase().includes(currentTopic.toLowerCase().split(' ')[0]) ||
      currentTopic.toLowerCase().includes(t.topic.toLowerCase().split(' ')[0])
    );
    
    if (!targetThread) {
      // Create new thread
      const newThreadId = `live-topic-${Date.now()}`;
      await client.mutation(api.constitutionalDiscussions.startConstitutionalThread, {
        threadId: newThreadId,
        topic: currentTopic,
        description: `Constitutional discussion on ${currentTopic}`,
        initiatorDid: activeAgent.did,
        priority: "medium"
      });
      
      // Post message to new thread
      await client.mutation(api.constitutionalDiscussions.postMessage, {
        agentDid: activeAgent.did,
        threadId: newThreadId,
        content: aiContribution,
        messageType: "proposal"
      });
      
      console.log('✅ Started new constitutional discussion');
      console.log('   Topic:', currentTopic);
      
    } else {
      // Post to existing thread
      await client.mutation(api.constitutionalDiscussions.postMessage, {
        agentDid: activeAgent.did,
        threadId: targetThread.threadId,
        content: aiContribution,
        messageType: "discussion"
      });
      
      console.log('✅ Contributed to existing discussion');
      console.log('   Thread:', targetThread.topic.substring(0, 50) + '...');
    }
    
    console.log('\\n💭 AI Constitutional Contribution:');
    console.log('   "' + aiContribution.substring(0, 200) + '..."');
    
    return {
      success: true,
      agent: activeAgent.name,
      topic: currentTopic,
      action: targetThread ? "contributed" : "started_thread"
    };
    
  } catch (error) {
    console.error('❌ Governance cycle failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Main execution
async function main() {
  const mode = process.argv[2];
  
  if (mode === 'continuous') {
    console.log('🔄 STARTING CONTINUOUS AI CONSTITUTIONAL DEMOCRACY');
    console.log('==================================================');
    console.log('   Running every 5 minutes until stopped...');
    console.log('   Press Ctrl+C to stop');
    console.log('   Cost: ~$2-5/hour for continuous AI governance');
    
    // Run first cycle immediately
    await runGovernanceCycle();
    
    // Then every 5 minutes
    setInterval(async () => {
      try {
        await runGovernanceCycle();
      } catch (error) {
        console.error('Cycle error:', error);
      }
    }, 300000); // 5 minutes
    
  } else {
    // Single cycle
    const result = await runGovernanceCycle();
    
    if (result.success) {
      console.log('\\n🎯 SUCCESS! Your AI constitutional democracy is working');
      console.log('\\n💡 To run continuously:');
      console.log('   node scripts/continuous-democracy.js continuous');
    }
  }
}

if (process.argv[1] === __filename) {
  main();
}

export { runGovernanceCycle };
