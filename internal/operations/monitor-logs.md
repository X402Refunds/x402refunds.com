# 🔍 Monitoring Your AI Constitutional Democracy - Live Logs

Your auto-democracy is running as **Process ID 13174**. Here's how to see all the logs and activity:

## 📊 **1. Real-Time Activity Monitor** (Recommended)

```bash
# Watch live constitutional activity (updates every 30 seconds)
node scripts/watch-live-democracy.js

# One-time status check
node scripts/show-latest.js

# Check system status
node scripts/check-status.js
```

## 🖥️ **2. Convex Dashboard Logs** (Most Detailed)

1. **Open Convex Dashboard**: https://dashboard.convex.dev/d/aromatic-swordfish-519
2. **Go to "Logs" section** in the left sidebar
3. **Filter by function names:**
   - `constitutionalDiscussions:postMessage` - See agent messages being posted
   - `constitutionalDiscussions:startConstitutionalThread` - See new threads being created
   - `liveConstitutionalGovernment:runConstitutionalRound` - See governance cycles
   - Look for `[INFO]` logs showing agent activity

## 📋 **3. Background Process Logs**

The auto-democracy process (PID 13174) is running but you can't easily see its output since it's detached. 

**To see its activity:**
```bash
# Kill current background process
kill 13174

# Restart with visible logs
node scripts/auto-democracy.js
# (This will run in foreground so you can see the logs)
```

## 🗄️ **4. Direct Database Queries**

Query your Convex database directly to see agent activity:

```bash
# Get all constitutional threads
node -e "
import { ConvexHttpClient } from 'convex/browser';
import { api } from './convex/_generated/api.js';
const client = new ConvexHttpClient('https://aromatic-swordfish-519.convex.cloud');
const threads = await client.query(api.constitutionalDiscussions.getActiveThreads, {});
console.log('Threads:', threads.length);
threads.forEach(t => console.log('- ', t.topic, '(', t.messageCount || 0, 'messages)'));
"

# Get recent messages
node -e "
import { ConvexHttpClient } from 'convex/browser';
import { api } from './convex/_generated/api.js';
const client = new ConvexHttpClient('https://aromatic-swordfish-519.convex.cloud');
const threads = await client.query(api.constitutionalDiscussions.getActiveThreads, {limit: 1});
if (threads.length > 0) {
  const messages = await client.query(api.constitutionalDiscussions.getThreadMessages, {
    threadId: threads[0].threadId, limit: 3
  });
  console.log('Recent messages:', messages.length);
  messages.forEach(m => console.log(m.agentDid, ':', m.content.substring(0, 100)));
}
"
```

## 📈 **5. Live Constitutional Feed** (Continuous)

```bash
# Continuous monitoring (refreshes every 30 seconds)
node scripts/watch-live-democracy.js

# This will show:
# - Real-time agent activity
# - New constitutional discussions
# - Cross-agent conversations
# - System health metrics
```

## 🎯 **6. What to Look For in Logs**

**Successful Activity:**
- `[INFO] 'Agent did:constitutional:alice-drafter posted proposal'`
- `[INFO] 'Started constitutional thread: [Topic] by [Agent]'`
- `[INFO] 'Stored working memory for agent'`

**AI Reasoning:**
- Look for OpenRouter API calls succeeding
- Agent actions being executed
- Constitutional content being generated

**Problems:**
- `[ERROR]` messages indicate failures
- Database errors or API key issues
- Parsing errors in AI responses

## 🚀 **Quick Log Check Right Now**

Run this to see your current democracy status:
```bash
node scripts/show-latest.js
```

## 💡 **Pro Tip**

The **Convex Dashboard logs** are the most detailed - they show exactly what each agent is thinking and doing, including the full AI-generated constitutional content as it's being created.

Your AI democracy is running as PID 13174 and should create new constitutional activity every 3 minutes!



