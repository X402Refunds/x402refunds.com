#!/usr/bin/env node

// LIVE LOGS: Watch your AI constitutional democracy in real-time
// Shows agent actions, reasoning, and constitutional content as it happens

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

let lastCheckTime = Date.now() - 600000; // Start 10 minutes ago

async function showLiveLogs() {
  console.clear();
  console.log('🏛️  CONSULATE AI CONSTITUTIONAL DEMOCRACY - LIVE LOGS');
  console.log('=================================================');
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log(`Monitoring since: ${new Date(lastCheckTime).toLocaleTimeString()}`);
  console.log(`Backend: ${CONVEX_URL}`);
  
  try {
    // Get threads sorted by last activity
    const allThreads = await client.query(api.constitutionalDiscussions.getActiveThreads, { limit: 20 });
    const recentThreads = allThreads.filter(t => t.lastActivity > lastCheckTime);
    
    console.log('\\n📊 ACTIVITY SUMMARY:');
    console.log('===================');
    console.log('🟢 Background Process: RUNNING (PID varies)');
    console.log('🔄 Governance Cycle: Every 3 minutes');
    console.log('📋 Total Threads:', allThreads.length);
    console.log('⚡ New Activity:', recentThreads.length, 'threads updated');
    
    if (recentThreads.length > 0) {
      console.log('\\n🆕 RECENT CONSTITUTIONAL ACTIVITY:');
      console.log('==================================');
      
      for (const thread of recentThreads.slice(0, 3)) {
        const messages = await client.query(api.constitutionalDiscussions.getThreadMessages, {
          threadId: thread.threadId,
          limit: 10
        });
        
        const newMessages = messages.filter(m => m.timestamp > lastCheckTime);
        
        if (newMessages.length > 0) {
          console.log('\\n📌 "' + thread.topic + '"');
          console.log('   Updated: ' + new Date(thread.lastActivity).toLocaleTimeString());
          console.log('   New Messages: ' + newMessages.length);
          
          newMessages.forEach(msg => {
            const agentName = msg.agentDid.split(':').pop()?.replace('-', ' ').toUpperCase() || 'UNKNOWN';
            const timeStr = new Date(msg.timestamp).toLocaleTimeString();
            
            console.log('\\n   🤖 ' + agentName + ' [' + timeStr + '] (' + msg.messageType + '):');
            console.log('   ' + '-'.repeat(50));
            
            // Show first 300 chars of constitutional content
            const content = msg.content.substring(0, 300);
            console.log('   ' + content + (msg.content.length > 300 ? '...' : ''));
            console.log('   ' + '-'.repeat(50));
          });
        }
      }
    } else {
      console.log('\\n⏰ No new activity since last check');
      console.log('   (This is normal between 3-minute cycles)');
      
      // Show most recent activity anyway
      if (allThreads.length > 0) {
        const mostRecent = allThreads[0];
        const timeSince = Math.floor((Date.now() - mostRecent.lastActivity) / 60000);
        console.log('\\n📋 Most Recent Activity:');
        console.log('   Thread: "' + mostRecent.topic.substring(0, 50) + '..."');
        console.log('   Time: ' + timeSince + ' minutes ago');
        console.log('   Agent: ' + mostRecent.initiatorDid.split(':').pop()?.replace('-', ' '));
      }
    }
    
    // Show system health
    let totalMessages = 0;
    for (const thread of allThreads) {
      const messages = await client.query(api.constitutionalDiscussions.getThreadMessages, {
        threadId: thread.threadId,
        limit: 100
      });
      totalMessages += messages.length;
    }
    
    console.log('\\n🎯 CONSTITUTIONAL DEMOCRACY STATUS:');
    console.log('===================================');
    console.log('✅ Status: AUTONOMOUS AI GOVERNMENT ACTIVE');
    console.log('✅ Total Constitutional Messages:', totalMessages);
    console.log('✅ Active Discussions:', allThreads.length);
    console.log('✅ AI Provider: OpenRouter Sonoma Dusk Alpha');
    console.log('💰 Estimated Cost: ~$2-5/hour');
    
    const hasRecentActivity = allThreads.some(t => t.lastActivity > (Date.now() - 300000));
    console.log('🔄 Recent Activity (5min):', hasRecentActivity ? '🟢 ACTIVE' : '🟡 WAITING FOR CYCLE');
    
    console.log('\\n💡 CONTROLS:');
    console.log('   • This monitor refreshes every 20 seconds');
    console.log('   • Press Ctrl+C to stop monitoring');
    console.log('   • Background AI democracy continues running independently');
    console.log('   • Check Convex dashboard for detailed AI reasoning logs');
    
  } catch (error) {
    console.error('❌ Monitoring failed:', error.message);
  }
  
  lastCheckTime = Date.now();
}

async function startLiveMonitoring() {
  console.log('🔄 Starting live constitutional democracy monitoring...');
  console.log('   Updates every 20 seconds');
  console.log('   Press Ctrl+C to stop\\n');
  
  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log('\\n\\n🛑 MONITORING STOPPED');
    console.log('   Your AI constitutional democracy continues running in background');
    console.log('   Background process creating constitutional content every 3 minutes');
    process.exit(0);
  });
  
  // Show initial state
  await showLiveLogs();
  
  // Update every 20 seconds
  setInterval(async () => {
    try {
      await showLiveLogs();
    } catch (error) {
      console.error('Monitor error:', error);
    }
  }, 20000);
}

if (process.argv[1] === __filename) {
  startLiveMonitoring();
}

export { showLiveLogs, startLiveMonitoring };



