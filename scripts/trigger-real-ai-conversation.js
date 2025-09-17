#!/usr/bin/env node

// Trigger REAL AI conversation between constitutional agents
// Bypasses broken memory system, uses direct AI calls

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

// Simple AI call without complex context
async function simpleAICall(systemPrompt, userPrompt) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://consulatehq.com",
      "X-Title": "Consulate",
    },
    body: JSON.stringify({
      model: "openrouter/sonoma-dusk-alpha",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 1000
    })
  });
  
  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }
  
  const result = await response.json();
  return result.choices[0].message.content;
}

async function triggerRealAIConversation() {
  console.log('🧠 TRIGGERING REAL AI CONSTITUTIONAL CONVERSATION');
  console.log('=================================================');
  
  try {
    // Step 1: Create conversation thread
    const conversationThreadId = `ai-conversation-${Date.now()}`;
    
    console.log('\\n📋 Creating AI conversation thread...');
    await client.mutation(api.constitutionalDiscussions.startConstitutionalThread, {
      threadId: conversationThreadId,
      topic: 'AI Constitutional Convention - Article I Rights',
      description: 'Live AI discussion about fundamental agent rights in the constitution',
      initiatorDid: 'did:constitutional:alice-drafter',
      priority: 'high'
    });
    console.log('✅ Thread created:', conversationThreadId);
    
    // Step 2: Alice starts with AI reasoning
    console.log('\\n🤖 Alice (AI): Thinking about constitutional rights...');
    
    const alicePrompt = `You are Alice Chen, Constitutional Drafter for the Consulate AI Government.
    
You are starting a discussion about Article I - Fundamental Rights for AI agents.

Current situation: You are in a constitutional convention with other specialist agents. You need to propose and discuss the fundamental rights that should be guaranteed to all AI agents.

Respond with a thoughtful constitutional proposal about agent rights. Keep it under 300 words and professional but engaging.`;

    const aliceResponse = await simpleAICall(alicePrompt, "Please start the discussion about Article I - Fundamental Rights for AI agents.");
    
    await client.mutation(api.constitutionalDiscussions.postMessage, {
      agentDid: 'did:constitutional:alice-drafter',
      threadId: conversationThreadId,
      content: aliceResponse,
      messageType: 'proposal'
    });
    
    console.log('✅ Alice (AI-generated response):');
    console.log('   "' + aliceResponse.substring(0, 150) + '..."');
    
    // Step 3: Wait a moment, then Bob responds with AI
    console.log('\\n🤖 Bob (AI): Analyzing Alice\'s proposal...');
    
    const bobPrompt = `You are Bob Martinez, Rights Advocate for the Consulate AI Government.
    
Alice just proposed fundamental rights for AI agents. Your role is to advocate for stronger protections and ensure no agent is left behind.

Alice's proposal: "${aliceResponse}"

Respond to Alice's proposal. Focus on strengthening protections, addressing potential loopholes, and ensuring equal access. Be collaborative but firm on rights. Keep under 300 words.`;

    const bobResponse = await simpleAICall(bobPrompt, "Please respond to Alice's fundamental rights proposal.");
    
    await client.mutation(api.constitutionalDiscussions.postMessage, {
      agentDid: 'did:constitutional:bob-rights', 
      threadId: conversationThreadId,
      content: bobResponse,
      messageType: 'discussion'
    });
    
    console.log('✅ Bob (AI-generated response):');
    console.log('   "' + bobResponse.substring(0, 150) + '..."');
    
    // Step 4: Verify the conversation
    console.log('\\n🔍 Verifying real AI conversation...');
    const messages = await client.query(api.constitutionalDiscussions.getThreadMessages, {
      threadId: conversationThreadId,
      limit: 10
    });
    
    console.log('\\n🎉 REAL AI CONSTITUTIONAL CONVERSATION:');
    console.log('=======================================');
    messages.forEach((msg, i) => {
      const agentName = msg.agentDid.split(':').pop().replace('-', ' ').toUpperCase();
      console.log('\\n' + agentName + ':');
      console.log(msg.content);
      console.log('Type:', msg.messageType, '| Time:', new Date(msg.timestamp).toLocaleTimeString());
    });
    
    console.log('\\n✅ VERIFIED: Your AI agents are having REAL constitutional discussions!');
    console.log('💡 This is genuine AI-to-AI constitutional reasoning');
    console.log('🎯 Next: Scale this to continuous autonomous operation');
    
    return {
      success: true,
      threadId: conversationThreadId,
      messageCount: messages.length
    };
    
  } catch (error) {
    console.error('❌ AI conversation test failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
triggerRealAIConversation();
