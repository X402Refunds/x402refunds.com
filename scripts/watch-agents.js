#!/usr/bin/env node

// Real-time Constitutional Agent Activity Monitor
// Watch your AI agents discuss, debate, and create the constitution

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

const CONVEX_URL = envVars.CONVEX_URL || 'https://aromatic-swordfish-519.convex.cloud';
const client = new ConvexHttpClient(CONVEX_URL);

async function showAgentActivity() {
  console.log('🏛️  LUCIAN AI CONSTITUTIONAL DEMOCRACY - LIVE MONITOR');
  console.log('=====================================================');
  console.log(`Backend: ${CONVEX_URL}`);
  console.log(`Time: ${new Date().toLocaleString()}`);
  
  try {
    // Get constitutional agents
    const agents = await client.query(api.constitutionalAgents.getConstitutionalAgents);
    console.log(`\\n👥 Constitutional Agents: ${agents.length} active`);
    agents.forEach(agent => {
      const profile = agent.profile;
      if (profile) {
        console.log(`   🤖 ${profile.name} (${profile.role})`);
        console.log(`      DID: ${agent.did}`);
        console.log(`      Specialties: ${profile.specialties.join(', ')}`);
      }
    });
    
    // Get active constitutional threads
    const threads = await client.query(api.constitutionalDiscussions.getActiveThreads, { limit: 10 });
    console.log(`\\n📋 Active Constitutional Discussions: ${threads.length}`);
    
    for (const thread of threads) {
      console.log(`\\n📌 "${thread.topic}"`);
      console.log(`   Status: ${thread.status} | Priority: ${thread.priority}`);
      console.log(`   Participants: ${thread.participants.length} agents`);
      console.log(`   Messages: ${thread.messageCount || 0}`);
      console.log(`   Last Activity: ${new Date(thread.lastActivity).toLocaleString()}`);
      
      // Show recent messages
      const messages = await client.query(api.constitutionalDiscussions.getThreadMessages, {
        threadId: thread.threadId,
        limit: 3
      });
      
      if (messages.length > 0) {
        console.log('   💬 Recent Messages:');
        messages.slice(-3).forEach(msg => {
          const agentName = msg.agentDid.split(':').pop().replace('-', ' ');
          const timeStr = new Date(msg.timestamp).toLocaleTimeString();
          console.log(`      [${timeStr}] ${agentName} (${msg.messageType}):`);
          console.log(`         "${msg.content.substring(0, 120)}${msg.content.length > 120 ? '...' : ''}"`);
        });
      }
    }
    
    // Get constitutional documents
    const documents = await client.query(api.constitutionalDiscussions.getActiveThreads, { status: "discussion" });
    console.log(`\\n📜 Constitutional Documents Being Drafted: ${documents.length}`);
    
    // Show recent AI agent activities  
    console.log('\\n🤖 Recent AI Agent Activities:');
    console.log('   (Check your Convex logs for detailed AI inference activity)');
    
    console.log('\\n🎯 Next Steps:');
    console.log('   • Run this script regularly to monitor agent discussions');
    console.log('   • Agents will automatically respond to each others proposals');
    console.log('   • Watch for constitutional articles being drafted and voted on');
    console.log('   • New agents can join discussions and propose amendments');
    
    console.log('\\n💡 Commands to Monitor:');
    console.log('   • node scripts/watch-agents.js  (this script)');
    console.log('   • Check Convex dashboard logs for detailed AI activity');
    console.log('   • Query database tables directly for deep analysis');
    
  } catch (error) {
    console.error('❌ Failed to get agent activity:', error);
  }
}

async function triggerAgentActivity() {
  console.log('\\n⚡ Triggering Agent AI Inference...');
  
  try {
    // Run inference for all constitutional agents
    const result = await client.action(api.aiInference.scheduleAllAgentInferences);
    
    console.log('✅ Agent Inference Results:');
    console.log(`   Agents Processed: ${result.results?.length || 0}`);
    console.log(`   Successful: ${result.successful || 0}`);
    console.log(`   Failed: ${result.failed || 0}`);
    
    if (result.results) {
      result.results.forEach(r => {
        const agentName = r.agentDid.split(':').pop();
        console.log(`   ${agentName}: ${r.success ? '✅' : '❌'}`);
        if (r.result?.actionsExecuted) {
          console.log(`      Actions: ${r.result.actionsExecuted} executed`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Failed to trigger agent activity:', error.message);
  }
}

// Main execution
if (process.argv[1] === __filename) {
  const command = process.argv[2];
  
  if (command === 'trigger') {
    triggerAgentActivity();
  } else {
    showAgentActivity();
  }
}

export { showAgentActivity, triggerAgentActivity };
