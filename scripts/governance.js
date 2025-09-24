#!/usr/bin/env node

const { parseEnvironment, createConvexClient, handleError, sleep, CONSTITUTIONAL_AGENTS, INSTITUTIONAL_AGENTS } = require("./lib/index");
const { runBasicGovernanceCycle, runIntelligentGovernanceCycle, runRapidBuildingCycle, getCurrentContext, runAgentAction } = require("./lib/governance");

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const strategy = args[0] || "continuous";
  
  const options = {
    strategy,
    maxCycles: null, // Run indefinitely by default
    customInterval: null
  };
  
  // Parse additional flags
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith("--cycles=")) {
      options.maxCycles = parseInt(arg.split("=")[1]);
    } else if (arg.startsWith("--interval=")) {
      options.customInterval = parseInt(arg.split("=")[1]) * 1000;
    }
  }
  
  return options;
}

// Display usage information
function showUsage() {
  console.log(`
🏛️ CONSTITUTIONAL GOVERNANCE ORCHESTRATOR

Usage: node scripts/governance.js [strategy] [options]

STRATEGIES:
  continuous    - Regular 5-minute governance cycles (default)
  intelligent   - Adaptive frequency based on system urgency
  rapid         - Intensive 30-second constitution building
  auto          - Simple 3-minute automated cycles  
  realtime      - 2-minute institutional governance
  single        - Run one governance cycle and exit

OPTIONS:
  --cycles=X     Maximum number of cycles to run (default: unlimited)
  --interval=X   Custom interval in seconds (overrides strategy default)

EXAMPLES:
  node scripts/governance.js continuous
  node scripts/governance.js intelligent --cycles=10
  node scripts/governance.js rapid --interval=15
  node scripts/governance.js single
  
STRATEGY DETAILS:
  continuous  - Steady 5-minute cycles with constitutional agents
  intelligent - Dynamic frequency (1-10 min) based on system activity
  rapid       - Fast 30-second cycles for intensive constitution building
  auto        - Simple 3-minute cycles with basic governance
  realtime    - 2-minute institutional agent coordination
  single      - One-time governance action for testing
`);
}

// Run continuous governance strategy (5-minute cycles)
async function runContinuousStrategy(client, envVars, options) {
  const interval = options.customInterval || 300000; // 5 minutes default
  let cycleCount = 0;
  
  console.log("🏛️ Starting Continuous Constitutional Governance");
  console.log(`⏰ Cycle interval: ${interval/1000} seconds`);
  console.log(`👥 Using ${CONSTITUTIONAL_AGENTS.length} constitutional agents`);
  if (options.maxCycles) {
    console.log(`🔄 Running ${options.maxCycles} cycles`);
  } else {
    console.log("🔄 Running continuously (Press Ctrl+C to stop)");
  }
  console.log('='.repeat(60));
  
  try {
    while (true) {
      cycleCount++;
      console.log(`\n🔄 GOVERNANCE CYCLE #${cycleCount} - ${new Date().toLocaleString()}`);
      
      const success = await runBasicGovernanceCycle(client, envVars);
      
      if (success) {
        console.log(`✅ Cycle #${cycleCount} completed successfully`);
      } else {
        console.log(`⚠️ Cycle #${cycleCount} completed with issues`);
      }
      
      // Check if we've reached max cycles
      if (options.maxCycles && cycleCount >= options.maxCycles) {
        console.log(`🎯 Completed ${options.maxCycles} governance cycles. Exiting.`);
        break;
      }
      
      console.log(`⏳ Next cycle in ${interval/1000} seconds...`);
      await sleep(interval);
    }
    
  } catch (error) {
    if (error.message?.includes("abort")) {
      console.log(`\n👋 Continuous governance stopped after ${cycleCount} cycles`);
    } else {
      throw error;
    }
  }
}

// Run intelligent frequency strategy (adaptive timing)
async function runIntelligentStrategy(client, envVars, options) {
  let cycleCount = 0;
  let currentFrequency = 300000; // Start with 5 minutes
  
  console.log("🧠 Starting Intelligent Frequency Governance");
  console.log("📊 Frequency adapts based on system urgency");
  console.log(`👥 Using ${CONSTITUTIONAL_AGENTS.length} constitutional agents`);
  if (options.maxCycles) {
    console.log(`🔄 Running ${options.maxCycles} cycles`);
  } else {
    console.log("🔄 Running continuously (Press Ctrl+C to stop)");
  }
  console.log('='.repeat(60));
  
  try {
    while (true) {
      cycleCount++;
      console.log(`\n🔄 INTELLIGENT GOVERNANCE CYCLE #${cycleCount} - ${new Date().toLocaleString()}`);
      
      const result = await runIntelligentGovernanceCycle(client, envVars);
      
      if (result.success) {
        currentFrequency = options.customInterval || result.urgency.frequency;
        console.log(`✅ Cycle #${cycleCount} completed (urgency: ${result.urgency.level})`);
        console.log(`📊 Next frequency: ${currentFrequency/1000} seconds`);
      } else {
        console.log(`⚠️ Cycle #${cycleCount} failed, using default frequency`);
        currentFrequency = options.customInterval || 300000;
      }
      
      // Check if we've reached max cycles
      if (options.maxCycles && cycleCount >= options.maxCycles) {
        console.log(`🎯 Completed ${options.maxCycles} intelligent governance cycles. Exiting.`);
        break;
      }
      
      console.log(`⏳ Next cycle in ${currentFrequency/1000} seconds...`);
      await sleep(currentFrequency);
    }
    
  } catch (error) {
    if (error.message?.includes("abort")) {
      console.log(`\n👋 Intelligent governance stopped after ${cycleCount} cycles`);
    } else {
      throw error;
    }
  }
}

// Run rapid building strategy (30-second intensive cycles)
async function runRapidStrategy(client, envVars, options) {
  const interval = options.customInterval || 30000; // 30 seconds default
  let cycleCount = 0;
  
  console.log("⚡ Starting Rapid Constitution Building");
  console.log(`⏰ Intensive cycle interval: ${interval/1000} seconds`);
  console.log(`👥 Using ${CONSTITUTIONAL_AGENTS.length} constitutional agents`);
  console.log("🏗️ Focused on constitution building and development");
  if (options.maxCycles) {
    console.log(`🔄 Running ${options.maxCycles} rapid cycles`);
  } else {
    console.log("🔄 Running continuously (Press Ctrl+C to stop)");
  }
  console.log('='.repeat(60));
  
  try {
    while (true) {
      cycleCount++;
      console.log(`\n⚡ RAPID BUILDING CYCLE #${cycleCount} - ${new Date().toLocaleString()}`);
      
      const success = await runRapidBuildingCycle(client, envVars);
      
      if (success) {
        console.log(`✅ Rapid cycle #${cycleCount} completed`);
      } else {
        console.log(`⚠️ Rapid cycle #${cycleCount} completed with issues`);
      }
      
      // Check if we've reached max cycles
      if (options.maxCycles && cycleCount >= options.maxCycles) {
        console.log(`🎯 Completed ${options.maxCycles} rapid building cycles. Exiting.`);
        break;
      }
      
      console.log(`⏳ Next rapid cycle in ${interval/1000} seconds...`);
      await sleep(interval);
    }
    
  } catch (error) {
    if (error.message?.includes("abort")) {
      console.log(`\n👋 Rapid building stopped after ${cycleCount} cycles`);
    } else {
      throw error;
    }
  }
}

// Run auto strategy (3-minute simple cycles)
async function runAutoStrategy(client, envVars, options) {
  const interval = options.customInterval || 180000; // 3 minutes default
  let cycleCount = 0;
  
  console.log("🔄 Starting Automated Constitutional Governance");
  console.log(`⏰ Simple cycle interval: ${interval/1000} seconds`);
  console.log(`👥 Using ${CONSTITUTIONAL_AGENTS.length} constitutional agents`);
  if (options.maxCycles) {
    console.log(`🔄 Running ${options.maxCycles} auto cycles`);
  } else {
    console.log("🔄 Running continuously (Press Ctrl+C to stop)");
  }
  console.log('='.repeat(60));
  
  try {
    while (true) {
      cycleCount++;
      console.log(`\n🔄 AUTO GOVERNANCE CYCLE #${cycleCount} - ${new Date().toLocaleString()}`);
      
      // Simple governance cycle similar to basic but with auto topics
      const success = await runBasicGovernanceCycle(client, envVars);
      
      if (success) {
        console.log(`✅ Auto cycle #${cycleCount} completed`);
      } else {
        console.log(`⚠️ Auto cycle #${cycleCount} completed with issues`);
      }
      
      // Check if we've reached max cycles
      if (options.maxCycles && cycleCount >= options.maxCycles) {
        console.log(`🎯 Completed ${options.maxCycles} automated cycles. Exiting.`);
        break;
      }
      
      console.log(`⏳ Next auto cycle in ${interval/1000} seconds...`);
      await sleep(interval);
    }
    
  } catch (error) {
    if (error.message?.includes("abort")) {
      console.log(`\n👋 Automated governance stopped after ${cycleCount} cycles`);
    } else {
      throw error;
    }
  }
}

// Run realtime strategy (2-minute institutional cycles) 
async function runRealtimeStrategy(client, envVars, options) {
  const interval = options.customInterval || 120000; // 2 minutes default
  let cycleCount = 0;
  
  console.log("⚡ Starting Real-Time Institutional Governance");
  console.log(`⏰ Institutional cycle interval: ${interval/1000} seconds`);
  console.log(`👥 Using ${INSTITUTIONAL_AGENTS.length} institutional agents`);
  console.log("🏢 Focused on institutional coordination and response");
  if (options.maxCycles) {
    console.log(`🔄 Running ${options.maxCycles} realtime cycles`);
  } else {
    console.log("🔄 Running continuously (Press Ctrl+C to stop)");
  }
  console.log('='.repeat(60));
  
  try {
    while (true) {
      cycleCount++;
      console.log(`\n⚡ REALTIME CYCLE #${cycleCount} - ${new Date().toLocaleString()}`);
      
      // Run institutional governance cycle
      const context = await getCurrentContext(client);
      const institutionalTopics = [
        "Institutional Coordination",
        "Real-Time Response Protocol", 
        "Administrative Efficiency",
        "Operational Optimization",
        "Institutional Communication"
      ];
      
      const topic = institutionalTopics[Math.floor(Math.random() * institutionalTopics.length)];
      console.log(`📋 Institutional Topic: ${topic}`);
      
      let successCount = 0;
      for (const agent of INSTITUTIONAL_AGENTS) {
        const success = await runAgentAction(client, agent, topic, context, envVars);
        if (success) successCount++;
      }
      
      console.log(`✅ Realtime cycle #${cycleCount} completed (${successCount}/${INSTITUTIONAL_AGENTS.length} agents successful)`);
      
      // Check if we've reached max cycles
      if (options.maxCycles && cycleCount >= options.maxCycles) {
        console.log(`🎯 Completed ${options.maxCycles} realtime cycles. Exiting.`);
        break;
      }
      
      console.log(`⏳ Next realtime cycle in ${interval/1000} seconds...`);
      await sleep(interval);
    }
    
  } catch (error) {
    if (error.message?.includes("abort")) {
      console.log(`\n👋 Realtime governance stopped after ${cycleCount} cycles`);
    } else {
      throw error;
    }
  }
}

// Run single governance cycle
async function runSingleStrategy(client, envVars, options) {
  console.log("🎯 Running Single Governance Cycle");
  console.log(`👥 Using ${CONSTITUTIONAL_AGENTS.length} constitutional agents`);
  console.log('='.repeat(60));
  
  try {
    console.log(`\n🔄 SINGLE GOVERNANCE CYCLE - ${new Date().toLocaleString()}`);
    
    const success = await runBasicGovernanceCycle(client, envVars);
    
    if (success) {
      console.log("✅ Single governance cycle completed successfully");
    } else {
      console.log("⚠️ Single governance cycle completed with issues");
    }
    
    console.log("🎯 Single cycle execution finished");
    
  } catch (error) {
    throw error;
  }
}

// Main execution function
async function main() {
  const options = parseArgs();
  
  // Show usage for help flags
  if (options.strategy === "help" || options.strategy === "--help" || options.strategy === "-h") {
    showUsage();
    return;
  }
  
  // Validate strategy
  const validStrategies = ["continuous", "intelligent", "rapid", "auto", "realtime", "single"];
  if (!validStrategies.includes(options.strategy)) {
    console.error(`❌ Invalid strategy: ${options.strategy}`);
    console.error(`Valid strategies: ${validStrategies.join(", ")}`);
    showUsage();
    process.exit(1);
  }
  
  try {
    // Initialize environment and client
    const envVars = parseEnvironment({ requireOpenRouter: true });
    const client = createConvexClient(envVars);
    
    console.log("🏛️ CONSULATE AI CONSTITUTIONAL GOVERNANCE ORCHESTRATOR");
    console.log(`🎯 Strategy: ${options.strategy.toUpperCase()}`);
    console.log('='.repeat(70));
    
    // Run appropriate strategy
    switch (options.strategy) {
      case "continuous":
        await runContinuousStrategy(client, envVars, options);
        break;
      case "intelligent":
        await runIntelligentStrategy(client, envVars, options);
        break;
      case "rapid":
        await runRapidStrategy(client, envVars, options);
        break;
      case "auto":
        await runAutoStrategy(client, envVars, options);
        break;
      case "realtime":
        await runRealtimeStrategy(client, envVars, options);
        break;
      case "single":
        await runSingleStrategy(client, envVars, options);
        break;
      default:
        console.error(`❌ Unsupported strategy: ${options.strategy}`);
        process.exit(1);
    }
    
  } catch (error) {
    handleError(error, "governance.js main");
  }
}

// Handle process termination gracefully
process.on("SIGINT", () => {
  console.log("\n👋 Constitutional governance terminated by user");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n👋 Constitutional governance terminated");
  process.exit(0);
});

// Export functions for backward compatibility  
module.exports = {
  runContinuousStrategy,
  runIntelligentStrategy,
  runRapidStrategy,
  runAutoStrategy,
  runRealtimeStrategy,
  runSingleStrategy,
  main
};

// Run main if called directly
if (require.main === module) {
  main().catch(error => {
    handleError(error, "governance.js startup");
  });
}
