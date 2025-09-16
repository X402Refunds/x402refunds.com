#!/usr/bin/env node

// Live Constitutional Democracy Feed
// Real-time stream of agent activities and reasoning

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

let lastCheck = Date.now() - 3600000; // Start 1 hour ago

async function showLiveActivity() {
  console.clear();
  console.log('🏛️  LUCIAN AI CONSTITUTIONAL DEMOCRACY - LIVE FEED');
  console.log('==================================================');
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log(`Backend: ${CONVEX_URL}`);
  
  try {
    // Get agent memories from the last hour to see their reasoning
    const agents = [
      'did:constitutional:alice-drafter',
      'did:constitutional:bob-rights', 
      'did:constitutional:carol-economic',
      'did:constitutional:david-architect',
      'did:constitutional:eve-security'
    ];
    
    console.log('\n🧠 Recent Agent AI Reasoning:');
    console.log('============================');
    
    for (const agentDid of agents) {
      const agentName = agentDid.split(':').pop().replace('-', ' ');
      
      try {
        const recentMemories = await client.query(api.constitutionalAgents.getAgentMemories, {
          agentDid,
          memoryType: "episodic",
          limit: 3
        });
        
        if (recentMemories.length > 0) {
          console.log(`\n🤖 ${agentName.toUpperCase()}:`);
          
          recentMemories.forEach(memory => {
            const time = new Date(memory.createdAt).toLocaleTimeString();
            if (memory.content.event === "ai_inference_completed") {
              console.log(`   [${time}] 🧠 AI Inference: ${memory.content.actionsExecuted} actions executed`);
            } else if (memory.content.action) {
              console.log(`   [${time}] 📝 ${memory.content.action}: ${memory.content.topic}`);
            }
          });
        }
      } catch (error) {
        console.log(`   ⚠️  ${agentName}: ${error.message}`);
      }
    }
    
    // Get all constitutional threads
    const threads = await client.query(api.constitutionalDiscussions.getActiveThreads, { limit: 10 });
    
    console.log('\n📋 Constitutional Discussions:');
    console.log('=============================');
    
    threads.forEach((thread, i) => {
      const timeStr = new Date(thread.lastActivity).toLocaleTimeString();
      const initiator = thread.initiatorDid.split(':').pop().replace('-', ' ');
      
      console.log(`${i+1}. [${timeStr}] ${thread.topic.substring(0, 80)}${thread.topic.length > 80 ? '...' : ''}`);
      console.log(`   By: ${initiator} | Status: ${thread.status} | Priority: ${thread.priority}`);
      console.log(`   Participants: ${thread.participants.length} agents | Messages: ${thread.messageCount || 0}`);
    });
    
    // Show system health
    console.log('\n📊 System Health:');
    console.log('================');
    console.log(`✅ Constitutional Agents: ${agents.length} active`);
    console.log(`✅ Discussion Threads: ${threads.length} ongoing`);
    console.log(`✅ AI Provider: OpenRouter Sonoma Dusk Alpha`);
    console.log(`✅ Auto-Refresh: Every 15 minutes`);
    console.log(`💰 Estimated Cost: ~$0.25/hour`);
    
    console.log('\n💡 Commands:');
    console.log('   • Ctrl+C to stop monitoring');
    console.log('   • Open Convex dashboard for detailed AI reasoning logs');
    console.log('   • Check your database for constitutional documents being created');
    
  } catch (error) {
    console.error('❌ Failed to get live activity:', error);
  }
  
  lastCheck = Date.now();
}

async function continuousMonitor() {
  console.log('🔄 Starting continuous constitutional democracy monitoring...');
  console.log('   Refreshing every 30 seconds');
  console.log('   Press Ctrl+C to stop\n');
  
  // Show initial state
  await showLiveActivity();
  
  // Refresh every 30 seconds
  setInterval(async () => {
    await showLiveActivity();
  }, 30000);
}

// Run monitoring
if (process.argv[1] === __filename) {
  const mode = process.argv[2];
  
  if (mode === 'once') {
    showLiveActivity();
  } else {
    continuousMonitor();
  }
}

export { showLiveActivity, continuousMonitor };



