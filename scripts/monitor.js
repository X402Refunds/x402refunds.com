#!/usr/bin/env node

const { parseEnvironment, createConvexClient, handleError, sleep } = require("./lib/index");
const { getSystemStatus, displayLiveActivity, showThreadSummary } = require("./lib/monitoring");

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const mode = args[0] || "status";
  
  const options = {
    mode,
    interval: 5000, // Default 5 second refresh
    format: "detailed",
    maxEntries: 10
  };
  
  // Parse additional flags
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === "--compact") {
      options.format = "compact";
    } else if (arg === "--minimal") {
      options.format = "minimal";
    } else if (arg.startsWith("--interval=")) {
      options.interval = parseInt(arg.split("=")[1]) * 1000;
    } else if (arg.startsWith("--limit=")) {
      options.maxEntries = parseInt(arg.split("=")[1]);
    }
  }
  
  return options;
}

// Display usage information
function showUsage() {
  console.log(`
🌐 CONSTITUTIONAL GOVERNMENT MONITORING TOOL

Usage: node scripts/monitor.js [mode] [options]

MODES:
  status    - One-time system status check (default)
  live      - Continuous live activity feed  
  watch     - Live democracy monitoring with threads
  threads   - Show detailed thread summary

OPTIONS:
  --compact          Use compact display format
  --minimal          Use minimal display format
  --interval=X       Refresh interval in seconds (default: 5)
  --limit=X          Maximum entries to show (default: 10)

EXAMPLES:
  node scripts/monitor.js status
  node scripts/monitor.js live --compact --interval=3
  node scripts/monitor.js watch --limit=20
  node scripts/monitor.js threads
  
`);
}

// Run status mode - one-time status check
async function runStatusMode(client, options) {
  try {
    console.log("🌐 CONSULATE AI CONSTITUTIONAL GOVERNMENT - SYSTEM STATUS");
    console.log('='.repeat(70));
    console.log(`📅 ${new Date().toLocaleString()}\n`);
    
    const status = await getSystemStatus(client);
    
    // Display system health
    const healthIcon = status.health.status === "HEALTHY" ? "💚" : 
                      status.health.status === "WARNING" ? "💛" : "❤️";
    console.log(`${healthIcon} SYSTEM HEALTH: ${status.health.status}`);
    console.log(`📊 Health Score: ${status.health.score}/100`);
    
    if (status.health.issues.length > 0) {
      console.log("\n⚠️  SYSTEM ISSUES:");
      status.health.issues.forEach(issue => console.log(`   • ${issue}`));
    }
    
    console.log("\n📈 ACTIVITY SUMMARY:");
    console.log(`• Constitutional Threads: ${status.threads.length} active`);
    console.log(`• Recent Discussions: ${status.recentDiscussions.length} messages`);
    console.log(`• Active Legal Cases: ${status.activeCases.length} cases`);
    
    // Show recent activity if available
    if (status.recentDiscussions.length > 0) {
      console.log("\n💭 RECENT DISCUSSIONS:");
      status.recentDiscussions.slice(0, 5).forEach((discussion, i) => {
        const agentName = discussion.agentDid?.split(":").pop() || "Unknown Agent";
        const timeAgo = new Date(Date.now() - discussion._creationTime);
        const minutesAgo = Math.floor(timeAgo.getTime() / (1000 * 60));
        console.log(`${i + 1}. ${agentName}: "${discussion.message?.slice(0, 80)}..." (${minutesAgo}m ago)`);
      });
    }
    
    console.log(`\n✅ Status check completed at ${new Date().toLocaleTimeString()}`);
    
  } catch (error) {
    handleError(error, "status mode");
  }
}

// Run live mode - continuous activity feed
async function runLiveMode(client, options) {
  console.log("🌐 Starting live constitutional government monitoring...");
  console.log(`🔄 Refresh interval: ${options.interval/1000}s`);
  console.log("⌨️  Press Ctrl+C to exit\n");
  
  try {
    while (true) {
      await displayLiveActivity(client, {
        format: options.format,
        maxEntries: options.maxEntries,
        includeThreads: true,
        includeDiscussions: true,
        includeCases: true
      });
      
      console.log(`\n🔄 Refreshing in ${options.interval/1000}s... (Press Ctrl+C to exit)`);
      await sleep(options.interval);
    }
    
  } catch (error) {
    if (error.message?.includes("abort")) {
      console.log("\n👋 Live monitoring stopped by user");
    } else {
      handleError(error, "live mode");
    }
  }
}

// Run watch mode - live democracy monitoring with focus on threads
async function runWatchMode(client, options) {
  console.log("🧵 Starting live democracy thread monitoring...");
  console.log(`🔄 Refresh interval: ${options.interval/1000}s`);
  console.log("⌨️  Press Ctrl+C to exit\n");
  
  try {
    while (true) {
      console.clear();
      console.log("🏛️ LIVE CONSTITUTIONAL DEMOCRACY MONITORING");
      console.log('='.repeat(60));
      console.log(`📅 ${new Date().toLocaleString()}\n`);
      
      // Show thread summary first
      await showThreadSummary(client, options.maxEntries);
      
      // Then show live activity
      await displayLiveActivity(client, {
        format: options.format,
        maxEntries: Math.floor(options.maxEntries / 2),
        includeThreads: false, // Already shown in thread summary
        includeDiscussions: true,
        includeCases: true
      });
      
      console.log(`\n🔄 Next update in ${options.interval/1000}s... (Press Ctrl+C to exit)`);
      await sleep(options.interval);
    }
    
  } catch (error) {
    if (error.message?.includes("abort")) {
      console.log("\n👋 Democracy monitoring stopped by user");
    } else {
      handleError(error, "watch mode");
    }
  }
}

// Run threads mode - detailed thread summary
async function runThreadsMode(client, options) {
  try {
    console.log("🧵 CONSTITUTIONAL THREADS DETAILED VIEW");
    console.log('='.repeat(50));
    console.log(`📅 ${new Date().toLocaleString()}\n`);
    
    const threads = await showThreadSummary(client, options.maxEntries);
    
    if (threads.length === 0) {
      console.log("📭 No active constitutional threads found");
      console.log("💡 Try running governance scripts to start constitutional discussions");
    } else {
      console.log(`✅ Displayed ${Math.min(threads.length, options.maxEntries)} of ${threads.length} active threads`);
    }
    
  } catch (error) {
    handleError(error, "threads mode");
  }
}

// Main execution function
async function main() {
  const options = parseArgs();
  
  // Show usage for help flags
  if (options.mode === "help" || options.mode === "--help" || options.mode === "-h") {
    showUsage();
    return;
  }
  
  // Validate mode
  const validModes = ["status", "live", "watch", "threads"];
  if (!validModes.includes(options.mode)) {
    console.error(`❌ Invalid mode: ${options.mode}`);
    console.error(`Valid modes: ${validModes.join(", ")}`);
    showUsage();
    process.exit(1);
  }
  
  try {
    // Initialize environment and client
    const envVars = parseEnvironment();
    const client = createConvexClient(envVars);
    
    // Run appropriate mode
    switch (options.mode) {
      case "status":
        await runStatusMode(client, options);
        break;
      case "live":
        await runLiveMode(client, options);
        break;
      case "watch":
        await runWatchMode(client, options);
        break;
      case "threads":
        await runThreadsMode(client, options);
        break;
      default:
        console.error(`❌ Unsupported mode: ${options.mode}`);
        process.exit(1);
    }
    
  } catch (error) {
    handleError(error, "monitor.js main");
  }
}

// Handle process termination gracefully
process.on("SIGINT", () => {
  console.log("\n👋 Constitutional government monitoring terminated by user");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n👋 Constitutional government monitoring terminated");
  process.exit(0);
});

// Export functions for backward compatibility
module.exports = {
  runStatusMode,
  runLiveMode, 
  runWatchMode,
  runThreadsMode,
  main
};

// Run main if called directly
if (require.main === module) {
  main().catch(error => {
    handleError(error, "monitor.js startup");
  });
}
