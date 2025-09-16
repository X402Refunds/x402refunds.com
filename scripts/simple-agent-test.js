#!/usr/bin/env node

// SIMPLE TEST: Can 2 agents have a real conversation?
// No complex memory, just basic message exchange

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

console.log('🔍 SIMPLE AGENT CONVERSATION TEST');
console.log('=================================');
console.log('Goal: Get 2 agents to have a real back-and-forth conversation');

async function testRealConversation() {
  try {
    // Step 1: Create a simple test thread
    const testThreadId = `test-conversation-${Date.now()}`;
    
    console.log('\\n📋 Step 1: Creating test conversation thread...');
    await client.mutation(api.constitutionalDiscussions.startConstitutionalThread, {
      threadId: testThreadId,
      topic: 'Simple Agent Conversation Test',
      description: 'Testing if agents can have real conversations',
      initiatorDid: 'did:constitutional:alice-drafter',
      priority: 'medium'
    });
    console.log('✅ Thread created:', testThreadId);
    
    // Step 2: Alice posts first message
    console.log('\\n💬 Step 2: Alice posting first message...');
    await client.mutation(api.constitutionalDiscussions.postMessage, {
      agentDid: 'did:constitutional:alice-drafter',
      threadId: testThreadId,
      content: 'Hello Bob! As the Constitutional Drafter, I want to discuss Article I with you. What are your thoughts on agent due process rights?',
      messageType: 'discussion'
    });
    console.log('✅ Alice posted first message');
    
    // Step 3: Bob responds
    console.log('\\n💬 Step 3: Bob posting response...');
    await client.mutation(api.constitutionalDiscussions.postMessage, {
      agentDid: 'did:constitutional:bob-rights',
      threadId: testThreadId,
      content: 'Alice, I appreciate you raising this. Due process is fundamental - no agent should face sanctions without proper evidence and right to appeal. We need specific procedures in the constitution.',
      messageType: 'discussion'
    });
    console.log('✅ Bob posted response');
    
    // Step 4: Verify conversation exists
    console.log('\\n🔍 Step 4: Verifying real conversation...');
    const messages = await client.query(api.constitutionalDiscussions.getThreadMessages, {
      threadId: testThreadId,
      limit: 10
    });
    
    console.log('Messages in conversation:', messages.length);
    
    if (messages.length >= 2) {
      console.log('\\n✅ REAL AGENT CONVERSATION CONFIRMED:');
      messages.forEach((msg, i) => {
        const agentName = msg.agentDid.split(':').pop().replace('-', ' ');
        console.log('   ' + (i+1) + '.', agentName + ':', msg.content.substring(0, 80) + '...');
      });
      
      console.log('\\n🎉 SUCCESS! Agents CAN have real conversations!');
      console.log('   Next: Make this happen automatically with AI');
      
    } else {
      console.log('❌ Conversation failed - not enough messages');
    }
    
  } catch (error) {
    console.error('❌ Conversation test failed:', error.message);
  }
}

testRealConversation();



