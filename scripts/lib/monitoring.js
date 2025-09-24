const { api } = require("../../convex/_generated/api");
const { formatAgentName, handleError } = require("./index");

// Get comprehensive system status
async function getSystemStatus(client) {
  try {
    console.log("📊 Gathering system status...");
    
    // Get constitutional threads
    const threads = await client.query(api.constitutionalDiscussions.getActiveThreads, {});
    
    // Get recent discussions
    const recentDiscussions = await client.query(api.constitutionalDiscussions.getRecent, {
      limit: 20
    });
    
    // Get active cases
    const activeCases = await client.query(api.cases.getActiveCases, {});
    
    // Calculate system health metrics
    const health = calculateSystemHealth({
      threads: threads?.length || 0,
      recentActivity: recentDiscussions?.length || 0,
      activeCases: activeCases?.length || 0
    });
    
    return {
      threads: threads || [],
      recentDiscussions: recentDiscussions || [],
      activeCases: activeCases || [],
      health,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error("❌ Error getting system status:", error);
    return {
      threads: [],
      recentDiscussions: [],
      activeCases: [],
      health: { score: 0, status: "ERROR", issues: ["Unable to fetch system data"] },
      timestamp: new Date().toISOString()
    };
  }
}

// Display live activity feed with formatting options
async function displayLiveActivity(client, options = {}) {
  try {
    const {
      format = "detailed", // "detailed", "compact", "minimal"
      maxEntries = 10,
      includeThreads = true,
      includeDiscussions = true,
      includeCases = true
    } = options;
    
    console.clear();
    console.log("🌐 LIVE CONSTITUTIONAL GOVERNMENT ACTIVITY");
    console.log('='.repeat(60));
    console.log(`📅 ${new Date().toLocaleString()}\n`);
    
    const status = await getSystemStatus(client);
    
    // Display system health
    const healthIcon = status.health.status === "HEALTHY" ? "💚" : 
                      status.health.status === "WARNING" ? "💛" : "❤️";
    console.log(`${healthIcon} System Health: ${status.health.status} (Score: ${status.health.score}/100)`);
    
    if (status.health.issues.length > 0) {
      console.log("⚠️  Issues:");
      status.health.issues.forEach(issue => console.log(`   • ${issue}`));
    }
    
    console.log();
    
    // Display active threads
    if (includeThreads && status.threads.length > 0) {
      console.log("🧵 ACTIVE CONSTITUTIONAL THREADS:");
      status.threads.slice(0, maxEntries).forEach((thread, i) => {
        const messageCount = thread.messages?.length || 0;
        const lastActivity = thread.lastActivity ? new Date(thread.lastActivity).toLocaleTimeString() : "Unknown";
        
        if (format === "detailed") {
          console.log(`${i + 1}. 📋 ${thread.topic}`);
          console.log(`   💬 ${messageCount} messages | ⏰ Last: ${lastActivity}`);
          if (thread.participants) {
            console.log(`   👥 ${thread.participants.length} participants`);
          }
        } else {
          console.log(`${i + 1}. ${thread.topic} (${messageCount} msgs)`);
        }
      });
      console.log();
    }
    
    // Display recent discussions
    if (includeDiscussions && status.recentDiscussions.length > 0) {
      console.log("💭 RECENT CONSTITUTIONAL DISCUSSIONS:");
      status.recentDiscussions.slice(0, maxEntries).forEach((discussion, i) => {
        const agentName = formatAgentName(discussion.agentDid);
        const timeAgo = getTimeAgo(discussion._creationTime);
        const preview = discussion.message?.slice(0, format === "minimal" ? 50 : 100) + "...";
        
        if (format === "detailed") {
          console.log(`${i + 1}. 🤖 ${agentName} (${timeAgo})`);
          console.log(`   📝 Topic: ${discussion.topic}`);
          console.log(`   💬 "${preview}"`);
        } else {
          console.log(`${i + 1}. ${agentName}: ${preview} (${timeAgo})`);
        }
      });
      console.log();
    }
    
    // Display active cases
    if (includeCases && status.activeCases.length > 0) {
      console.log("⚖️  ACTIVE LEGAL CASES:");
      status.activeCases.slice(0, maxEntries).forEach((case_, i) => {
        const status_ = case_.status || "Unknown";
        const parties = case_.parties?.length || 0;
        
        if (format === "detailed") {
          console.log(`${i + 1}. 📋 Case ${case_._id}`);
          console.log(`   📊 Status: ${status_} | 👥 ${parties} parties`);
          if (case_.description) {
            console.log(`   📄 ${case_.description.slice(0, 100)}...`);
          }
        } else {
          console.log(`${i + 1}. Case ${case_._id} - ${status_} (${parties} parties)`);
        }
      });
      console.log();
    }
    
    // Display summary stats
    console.log("📈 SYSTEM SUMMARY:");
    console.log(`• ${status.threads.length} active constitutional threads`);
    console.log(`• ${status.recentDiscussions.length} recent discussions`);
    console.log(`• ${status.activeCases.length} active legal cases`);
    console.log(`• Last updated: ${new Date().toLocaleTimeString()}`);
    
    return status;
    
  } catch (error) {
    handleError(error, "live activity display");
    return null;
  }
}

// Show thread summary with message details
async function showThreadSummary(client, limit = 5) {
  try {
    const threads = await client.query(api.constitutionalDiscussions.getActiveThreads, {});
    
    if (!threads || threads.length === 0) {
      console.log("📭 No active constitutional threads found");
      return [];
    }
    
    console.log(`🧵 CONSTITUTIONAL THREAD SUMMARY (${threads.length} active threads):\n`);
    
    threads.slice(0, limit).forEach((thread, i) => {
      console.log(`${i + 1}. 📋 ${thread.topic}`);
      console.log(`   🆔 ID: ${thread._id}`);
      console.log(`   💬 Messages: ${thread.messages?.length || 0}`);
      console.log(`   ⏰ Created: ${new Date(thread._creationTime).toLocaleString()}`);
      
      if (thread.messages && thread.messages.length > 0) {
        const lastMessage = thread.messages[thread.messages.length - 1];
        const agentName = formatAgentName(lastMessage.agentDid);
        console.log(`   💭 Last: ${agentName} - "${lastMessage.message?.slice(0, 100)}..."`);
      }
      
      console.log();
    });
    
    return threads;
    
  } catch (error) {
    console.error("❌ Error showing thread summary:", error);
    return [];
  }
}

// Calculate system health score based on activity metrics
function calculateSystemHealth(metrics) {
  let score = 0;
  const issues = [];
  
  // Thread activity scoring (0-40 points)
  if (metrics.threads >= 5) {
    score += 40;
  } else if (metrics.threads >= 3) {
    score += 30;
  } else if (metrics.threads >= 1) {
    score += 20;
  } else {
    issues.push("No active constitutional threads");
  }
  
  // Recent activity scoring (0-30 points)  
  if (metrics.recentActivity >= 10) {
    score += 30;
  } else if (metrics.recentActivity >= 5) {
    score += 20;
  } else if (metrics.recentActivity >= 1) {
    score += 10;
  } else {
    issues.push("Low recent discussion activity");
  }
  
  // Case load scoring (0-30 points)
  if (metrics.activeCases > 0) {
    score += 30; // Active cases indicate system engagement
  } else {
    score += 15; // No cases can be good (peaceful) or bad (disengaged)
  }
  
  // Determine status based on score
  let status;
  if (score >= 80) {
    status = "HEALTHY";
  } else if (score >= 60) {
    status = "WARNING";
    issues.push("Below optimal activity levels");
  } else {
    status = "CRITICAL";
    issues.push("Insufficient system activity");
  }
  
  return { score, status, issues };
}

// Format activity display for consistent output
function formatActivityDisplay(activity, format = "standard") {
  const agentName = formatAgentName(activity.agentDid);
  const timeAgo = getTimeAgo(activity._creationTime);
  const preview = activity.message?.slice(0, 120) + "...";
  
  switch (format) {
    case "compact":
      return `${agentName}: ${activity.message?.slice(0, 50)}... (${timeAgo})`;
    case "detailed":
      return `🤖 ${agentName} - ${timeAgo}\n📝 Topic: ${activity.topic}\n💬 "${preview}"`;
    default:
      return `${agentName} on "${activity.topic}": ${preview} (${timeAgo})`;
  }
}

// Utility function to calculate time ago
function getTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

module.exports = {
  getSystemStatus,
  displayLiveActivity,
  showThreadSummary,
  calculateSystemHealth,
  formatActivityDisplay
};
