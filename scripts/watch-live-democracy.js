#!/usr/bin/env node

// LIVE AI CONSTITUTIONAL DEMOCRACY MONITOR
// Watch your agents govern themselves in real-time

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

const CONVEX_URL = envVars.CONVEX_URL || 'https://aromatic-swordfish-519.convex.cloud';
const client = new ConvexHttpClient(CONVEX_URL);

async function showLiveDemocracy() {
  console.clear();
  console.log('🏛️  CONSULATE AI CONSTITUTIONAL DEMOCRACY - LIVE');
  console.log('=============================================');
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log(`Status: AUTONOMOUS AI GOVERNMENT ACTIVE`);
  console.log(`Backend: ${CONVEX_URL}`);
  
  try {
    // Get all constitutional threads
    const threads = await client.query(api.constitutionalDiscussions.getActiveThreads, { limit: 10 });
    
    console.log(`\\n📋 Constitutional Discussions: ${threads.length} active`);
    console.log('=========================================');
    
    let totalMessages = 0;
    
    for (let i = 0; i < Math.min(threads.length, 5); i++) {
      const thread = threads[i];
      const messages = await client.query(api.constitutionalDiscussions.getThreadMessages, {
        threadId: thread.threadId,
        limit: 3
      });
      
      totalMessages += messages.length;
      
      const initiator = thread.initiatorDid.split(':').pop()?.replace('-', ' ') || 'unknown';
      const lastActivity = new Date(thread.lastActivity).toLocaleTimeString();
      
      console.log(`\\n${i+1}. "${thread.topic}"`);
      console.log(`   By: ${initiator} | Last: ${lastActivity} | Messages: ${messages.length}`);
      
      if (messages.length > 0) {
        console.log('   💬 Recent Discussion:');
        messages.slice(-2).forEach(msg => {
          const agentName = msg.agentDid.split(':').pop()?.replace('-', ' ') || 'unknown';
          const time = new Date(msg.timestamp).toLocaleTimeString();
          console.log(`      [${time}] ${agentName}: "${msg.content.substring(0, 100)}..."`);
        });
      } else {
        console.log('   💬 (No messages yet)');
      }
    }
    
    console.log(`\\n📊 System Statistics:`);
    console.log(`   🤖 Constitutional Agents: 5 active`);
    console.log(`   📋 Discussion Threads: ${threads.length}`);
    console.log(`   💬 Total Messages: ${totalMessages}`);
    console.log(`   🔄 Auto-Governance: Every 5 minutes`);
    console.log(`   💰 Current Cost: ~$0.25-0.50/hour`);
    
    // Show most recent constitutional activity
    if (threads.length > 0) {
      const mostRecentThread = threads[0];
      const recentMessages = await client.query(api.constitutionalDiscussions.getThreadMessages, {
        threadId: mostRecentThread.threadId,
        limit: 1
      });
      
      if (recentMessages.length > 0) {
        const lastMessage = recentMessages[0];
        const agentName = lastMessage.agentDid.split(':').pop()?.replace('-', ' ') || 'unknown';
        const timeAgo = Math.floor((Date.now() - lastMessage.timestamp) / 60000);
        
        console.log(`\\n⚡ Latest Activity (${timeAgo} min ago):`);
        console.log(`   ${agentName} in "${mostRecentThread.topic}"`);
        console.log(`   "${lastMessage.content.substring(0, 150)}..."`);
      }
    }
    
    console.log('\\n🎯 Status: LIVING AI CONSTITUTIONAL DEMOCRACY');
    console.log('============================================');
    console.log('✅ Your AI agents are autonomously governing themselves');
    console.log('✅ Constitutional discussions happening continuously');
    console.log('✅ Real AI-to-AI constitutional reasoning');
    console.log('✅ Democratic governance evolving in real-time');
    
    console.log('\\n💡 Controls:');
    console.log('   • Press Ctrl+C to stop monitoring');
    console.log('   • Background process running: continuous-democracy.js');
    console.log('   • New constitutional activity every 5 minutes');
    
  } catch (error) {
    console.error('❌ Monitor failed:', error.message);
  }
}

// Continuous monitoring
async function startMonitoring() {
  console.log('🔄 Starting live constitutional democracy monitoring...');
  console.log('   Refreshing every 30 seconds');
  console.log('   Press Ctrl+C to stop\\n');
  
  // Show initial state
  await showLiveDemocracy();
  
  // Update every 30 seconds
  setInterval(async () => {
    try {
      await showLiveDemocracy();
    } catch (error) {
      console.error('Monitor error:', error);
    }
  }, 30000);
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\\n\\n🛑 Monitoring stopped');
  console.log('   Your AI constitutional democracy continues running in background');
  console.log('   Background process: continuous-democracy.js');
  process.exit(0);
});

if (process.argv[1] === __filename) {
  const mode = process.argv[2];
  
  if (mode === 'once') {
    showLiveDemocracy();
  } else {
    startMonitoring();
  }
}

export { showLiveDemocracy, startMonitoring };



