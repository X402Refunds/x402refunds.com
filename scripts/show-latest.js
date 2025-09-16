#!/usr/bin/env node

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

async function showLatestActivity() {
  console.log('📜 LATEST AI CONSTITUTIONAL ACTIVITY');
  console.log('===================================');
  console.log('Time:', new Date().toLocaleString());
  
  try {
    // Get most recent threads
    const threads = await client.query(api.constitutionalDiscussions.getActiveThreads, { limit: 3 });
    
    console.log('\\nMost Recent Constitutional Discussions:');
    
    for (let i = 0; i < Math.min(threads.length, 2); i++) {
      const thread = threads[i];
      
      const messages = await client.query(api.constitutionalDiscussions.getThreadMessages, {
        threadId: thread.threadId,
        limit: 5
      });
      
      const timeStr = new Date(thread.lastActivity).toLocaleTimeString();
      const agentName = thread.initiatorDid.split(':').pop()?.replace('-', ' ') || 'unknown';
      
      console.log('\\n' + (i+1) + '. [' + timeStr + '] "' + thread.topic + '"');
      console.log('   Started by:', agentName);
      console.log('   Messages:', messages.length);
      
      if (messages.length > 0) {
        console.log('\\n   💬 Latest Message:');
        const lastMsg = messages[messages.length - 1];
        const lastAgentName = lastMsg.agentDid.split(':').pop()?.replace('-', ' ').toUpperCase() || 'UNKNOWN';
        const lastTime = new Date(lastMsg.timestamp).toLocaleString();
        
        console.log('   🤖 ' + lastAgentName + ' [' + lastTime + ']:');
        console.log('   "' + lastMsg.content.substring(0, 300) + '..."');
        console.log('   Type:', lastMsg.messageType);
      }
    }
    
    // Show summary
    let totalMessages = 0;
    for (const thread of threads) {
      const messages = await client.query(api.constitutionalDiscussions.getThreadMessages, {
        threadId: thread.threadId,
        limit: 100
      });
      totalMessages += messages.length;
    }
    
    const recentActivity = threads.some(t => t.lastActivity > (Date.now() - 300000)); // 5 minutes
    
    console.log('\\n📊 Democracy Status:');
    console.log('   Active Threads:', threads.length);
    console.log('   Total Messages:', totalMessages);
    console.log('   Recent Activity:', recentActivity ? '🟢 ACTIVE' : '🟡 QUIET');
    console.log('   Auto-Democracy:', recentActivity ? 'WORKING' : 'WAITING FOR NEXT CYCLE');
    
    if (recentActivity) {
      console.log('\\n🎉 Your AI government is actively governing itself!');
    } else {
      console.log('\\n⏰ Waiting for next governance cycle (every 3 minutes)');
    }
    
  } catch (error) {
    console.error('❌ Failed to check status:', error.message);
  }
}

showLatestActivity();



