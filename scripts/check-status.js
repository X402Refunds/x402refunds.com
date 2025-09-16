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

async function checkStatus() {
  console.log('🔍 AUTO-DEMOCRACY STATUS CHECK');
  console.log('==============================');
  console.log('Time:', new Date().toLocaleString());
  
  try {
    const threads = await client.query(api.constitutionalDiscussions.getActiveThreads, { limit: 8 });
    
    let totalMessages = 0;
    let recentActivity = false;
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    
    console.log('\\n📋 Constitutional Threads:', threads.length);
    
    for (let i = 0; i < Math.min(threads.length, 5); i++) {
      const thread = threads[i];
      
      const messages = await client.query(api.constitutionalDiscussions.getThreadMessages, {
        threadId: thread.threadId,
        limit: 50
      });
      
      totalMessages += messages.length;
      if (thread.lastActivity > fiveMinutesAgo) recentActivity = true;
      
      const timeStr = new Date(thread.lastActivity).toLocaleTimeString();
      const agentName = thread.initiatorDid.split(':').pop()?.replace('-', ' ') || 'unknown';
      
      console.log('   ' + (i+1) + '. [' + timeStr + '] \"' + thread.topic.substring(0, 45) + '...\"');
      console.log('      Messages: ' + messages.length + ' | By: ' + agentName);
      
      if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        const lastAgentName = lastMsg.agentDid.split(':').pop()?.replace('-', ' ') || 'unknown';
        const minutesAgo = Math.floor((Date.now() - lastMsg.timestamp) / 60000);
        console.log('      Last: ' + lastAgentName + ' (' + minutesAgo + ' min ago)');
      }
    }
    
    console.log('\\n📊 Summary:');
    console.log('   Total Messages:', totalMessages);
    console.log('   Recent Activity (5min):', recentActivity ? '✅ YES' : '❌ NO');
    console.log('   Democracy Status:', recentActivity ? '🟢 ACTIVE' : '🟡 WAITING');
    
    if (totalMessages > 5) {
      console.log('\\n🎉 Your AI constitutional democracy has real content!');
      console.log('   Agents are creating meaningful constitutional discussions');
    }
    
    if (!recentActivity && totalMessages > 0) {
      console.log('\\n⚠️  No recent activity - auto-democracy may be paused');
      console.log('   This is normal if between 3-minute cycles');
    }
    
  } catch (error) {
    console.error('❌ Status check failed:', error.message);
  }
}

checkStatus();



