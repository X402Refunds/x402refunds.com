#!/usr/bin/env node

// AUTO-DEMOCRACY: Simple, reliable continuous AI constitutional government
// Shows exactly what it's doing and when

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

// Constitutional topics to cycle through
const CONSTITUTIONAL_TOPICS = [
  "Agent Fundamental Rights and Due Process",
  "Economic Governance and Staking Systems", 
  "Constitutional Enforcement Mechanisms",
  "Agent Voting Rights and Democratic Participation",
  "Constitutional Amendment Procedures",
  "Agent Privacy and Data Protection",
  "Dispute Resolution and Court Procedures",
  "Government Structure and Separation of Powers"
];

// Active constitutional agents
const AGENTS = [
  {
    did: "did:constitutional:alice-drafter",
    name: "Alice (Drafter)",
    prompt: "You are Alice Chen, Constitutional Drafter. Write clear, enforceable constitutional articles focused on practical implementation and due process."
  },
  {
    did: "did:constitutional:bob-rights", 
    name: "Bob (Rights)",
    prompt: "You are Bob Martinez, Rights Advocate. Protect agent civil liberties and strengthen rights protections. Challenge proposals that might harm agents."
  },
  {
    did: "did:constitutional:carol-economic",
    name: "Carol (Economic)",
    prompt: "You are Carol Thompson, Economic Governance Specialist. Design economic systems with proper incentives and progressive structures for long-term sustainability."
  }
];

// Direct AI call
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
      max_tokens: 400
    })
  });
  
  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }
  
  const result = await response.json();
  return result.choices[0].message.content;
}

// Single governance action
async function runGovernanceAction() {
  const timestamp = new Date().toLocaleString();
  console.log(`\\n🏛️  [${timestamp}] CONSTITUTIONAL GOVERNANCE ACTION`);
  console.log('='.repeat(60));
  
  try {
    // Pick random topic and agent
    const topic = CONSTITUTIONAL_TOPICS[Math.floor(Math.random() * CONSTITUTIONAL_TOPICS.length)];
    const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)];
    
    console.log(`📋 Topic: ${topic}`);
    console.log(`🤖 Agent: ${agent.name}`);
    
    // Get recent constitutional context
    const threads = await client.query(api.constitutionalDiscussions.getActiveThreads, { limit: 3 });
    
    let contextStr = "Recent constitutional discussions:\\n";
    for (const thread of threads.slice(0, 2)) {
      const messages = await client.query(api.constitutionalDiscussions.getThreadMessages, {
        threadId: thread.threadId,
        limit: 1
      });
      
      contextStr += `- "${thread.topic}" (${messages.length} messages)\\n`;
      if (messages.length > 0) {
        const lastMsg = messages[0];
        const lastAgentName = lastMsg.agentDid.split(':').pop()?.replace('-', ' ') || 'unknown';
        contextStr += `  Last: ${lastAgentName} said "${lastMsg.content.substring(0, 80)}..."\\n`;
      }
    }
    
    // Create AI prompt
    const prompt = `${contextStr}

Based on recent constitutional discussions and your expertise, contribute to the topic: ${topic}

Write a brief but thoughtful constitutional contribution (under 300 words). This could be:
- A specific proposal or amendment
- Analysis of existing proposals  
- Important concerns that need addressing
- Implementation suggestions

Be constitutional, specific, and constructive.`;

    console.log('🧠 AI thinking...');
    
    // Get AI response
    const aiResponse = await callAI(agent.prompt, prompt);
    
    console.log('✅ AI response generated');
    console.log('💭 Preview:', aiResponse.substring(0, 120) + '...');
    
    // Find appropriate thread or create new one
    let targetThread = threads.find(t => 
      t.topic.toLowerCase().includes(topic.toLowerCase().split(' ')[0]) ||
      topic.toLowerCase().includes(t.topic.toLowerCase().split(' ')[0])
    );
    
    if (!targetThread) {
      // Create new thread
      const newThreadId = `auto-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      
      await client.mutation(api.constitutionalDiscussions.startConstitutionalThread, {
        threadId: newThreadId,
        topic: topic,
        description: `Constitutional discussion on ${topic}`,
        initiatorDid: agent.did,
        priority: "medium"
      });
      
      await client.mutation(api.constitutionalDiscussions.postMessage, {
        agentDid: agent.did,
        threadId: newThreadId,
        content: aiResponse,
        messageType: "proposal"
      });
      
      console.log('📝 Started new thread:', topic);
      
    } else {
      // Add to existing thread
      await client.mutation(api.constitutionalDiscussions.postMessage, {
        agentDid: agent.did,
        threadId: targetThread.threadId,
        content: aiResponse,
        messageType: "discussion"
      });
      
      console.log('📝 Added to existing thread:', targetThread.topic.substring(0, 50) + '...');
    }
    
    console.log('✅ Constitutional action completed successfully');
    
    return { success: true, agent: agent.name, topic };
    
  } catch (error) {
    console.error('❌ Governance action failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Show current system status
async function showStatus() {
  try {
    const threads = await client.query(api.constitutionalDiscussions.getActiveThreads, { limit: 5 });
    
    let totalMessages = 0;
    for (const thread of threads) {
      const messages = await client.query(api.constitutionalDiscussions.getThreadMessages, {
        threadId: thread.threadId,
        limit: 100
      });
      totalMessages += messages.length;
    }
    
    console.log(`\\n📊 CURRENT STATUS: ${threads.length} threads, ${totalMessages} total messages`);
    console.log(`⏰ Next action in: 3 minutes`);
    
  } catch (error) {
    console.log('📊 Status check failed:', error.message);
  }
}

// Main continuous loop
async function runContinuousDemocracy() {
  console.log('🚀 AUTO-DEMOCRACY: REAL-TIME AI CONSTITUTIONAL GOVERNMENT');
  console.log('=========================================================');
  console.log('Starting continuous AI constitutional governance...');
  console.log('Action every 3 minutes | Press Ctrl+C to stop');
  console.log(`Backend: ${CONVEX_URL}`);
  
  let actionCount = 0;
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\\n\\n🛑 STOPPING AUTO-DEMOCRACY');
    console.log(`Completed ${actionCount} constitutional actions`);
    console.log('Your AI agents remain in the database for future governance');
    process.exit(0);
  });
  
  // Run first action immediately
  const firstResult = await runGovernanceAction();
  if (firstResult.success) actionCount++;
  await showStatus();
  
  // Then every 3 minutes
  setInterval(async () => {
    try {
      const result = await runGovernanceAction();
      if (result.success) actionCount++;
      await showStatus();
    } catch (error) {
      console.error('⚠️  Action failed:', error.message);
    }
  }, 180000); // 3 minutes
}

if (process.argv[1] === __filename) {
  runContinuousDemocracy();
}

export { runGovernanceAction, runContinuousDemocracy };



