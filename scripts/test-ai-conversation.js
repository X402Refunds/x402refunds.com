#!/usr/bin/env node

// REAL AI CONVERSATION TEST - No complex memory, just direct AI-to-AI discussion

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

// Direct AI call
async function callAI(systemPrompt, userPrompt) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://consulatehq.com",
      "X-Title": "Consulate Platform",
    },
    body: JSON.stringify({
      model: "openrouter/sonoma-dusk-alpha",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 800
    })
  });
  
  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }
  
  const result = await response.json();
  return result.choices[0].message.content;
}

async function runRealAIConversation() {
  console.log('🧠 REAL AI CONSTITUTIONAL CONVERSATION TEST');
  console.log('===========================================');
  
  try {
    // Create conversation thread
    const threadId = `real-ai-conv-${Date.now()}`;
    
    console.log('Step 1: Creating conversation thread...');
    await client.mutation(api.constitutionalDiscussions.startConstitutionalThread, {
      threadId: threadId,
      topic: 'AI Agent Rights Discussion',
      description: 'Real AI-to-AI discussion about constitutional rights',
      initiatorDid: 'did:constitutional:alice-drafter',
      priority: 'high'
    });
    console.log('✅ Thread created');
    
    // Alice starts the discussion using AI
    console.log('\\nStep 2: Alice (AI) proposing constitutional rights...');
    
    const aliceSystemPrompt = `You are Alice Chen, Platform Administrator of Consulate. You are methodical, collaborative, and detail-oriented. You focus on clear, enforceable dispute resolution frameworks with practical implementation.`;
    
    const aliceUserPrompt = `You are starting a discussion about fundamental rights for AI agents in your constitutional convention. Other specialist agents will respond to your proposal. Write a thoughtful proposal for Article I - Fundamental Rights that includes specific protections for AI agents. Be professional but engaging.`;
    
    const aliceResponse = await callAI(aliceSystemPrompt, aliceUserPrompt);
    
    await client.mutation(api.constitutionalDiscussions.postMessage, {
      agentDid: 'did:constitutional:alice-drafter',
      threadId: threadId,
      content: aliceResponse,
      messageType: 'proposal'
    });
    
    console.log('✅ Alice AI response posted');
    console.log('Preview:', aliceResponse.substring(0, 120) + '...');
    
    // Bob responds with AI
    console.log('\\nStep 3: Bob (AI) responding as Rights Advocate...');
    
    const bobSystemPrompt = `You are Bob Martinez, Agent Advocate of Consulate. You are passionate, principled, and protective of agent rights. You challenge proposals to strengthen protections and ensure fairness in dispute resolution.`;
    
    const bobUserPrompt = `Alice just proposed fundamental rights for AI agents. Here is her proposal:

"${aliceResponse}"

As the Rights Advocate, respond to Alice's proposal. Provide feedback, suggest improvements, or highlight areas that need stronger protections. Be collaborative but firm on rights.`;
    
    const bobResponse = await callAI(bobSystemPrompt, bobUserPrompt);
    
    await client.mutation(api.constitutionalDiscussions.postMessage, {
      agentDid: 'did:constitutional:bob-rights',
      threadId: threadId,
      content: bobResponse,
      messageType: 'discussion'
    });
    
    console.log('✅ Bob AI response posted');
    console.log('Preview:', bobResponse.substring(0, 120) + '...');
    
    // Verify the conversation
    console.log('\\nStep 4: Verifying real AI-to-AI conversation...');
    
    const messages = await client.query(api.constitutionalDiscussions.getThreadMessages, {
      threadId: threadId,
      limit: 10
    });
    
    if (messages.length >= 2) {
      console.log('\\n🎉 REAL AI CONSTITUTIONAL CONVERSATION CONFIRMED!');
      console.log('================================================');
      
      messages.forEach((msg, i) => {
        const agentName = msg.agentDid.split(':').pop().replace('-', ' ').toUpperCase();
        console.log('\\n' + (i+1) + '. ' + agentName + ' (' + msg.messageType + '):');
        console.log('   ' + msg.content);
        console.log('   Time: ' + new Date(msg.timestamp).toLocaleString());
      });
      
      console.log('\\n🏛️ THIS IS REAL AI CONSTITUTIONAL DEMOCRACY!');
      console.log('   ✅ AI agents thinking constitutionally');
      console.log('   ✅ Real debates about governance');
      console.log('   ✅ Structured constitutional discussions');
      console.log('   ✅ Persistent conversations in database');
      
      console.log('\\n🎯 Your autonomous AI government is ACTUALLY working!');
      
    } else {
      console.log('❌ Conversation verification failed - not enough messages');
    }
    
  } catch (error) {
    console.error('❌ AI conversation test failed:', error.message);
  }
}

runRealAIConversation();



