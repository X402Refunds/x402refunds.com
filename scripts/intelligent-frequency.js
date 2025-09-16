#!/usr/bin/env node

// INTELLIGENT FREQUENCY AGENT GOVERNANCE
// Adapts speed based on activity type and urgency

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
Object.assign(process.env, envVars);

const CONVEX_URL = envVars.CONVEX_URL || 'https://aromatic-swordfish-519.convex.cloud';
const client = new ConvexHttpClient(CONVEX_URL);

// INTELLIGENT FREQUENCY SYSTEM
const FREQUENCY_TIERS = {
  URGENT: {
    interval: 1000,      // 1 second
    description: "Active disputes, emergencies, real-time voting",
    triggers: ["active_disputes", "security_alerts", "emergency_votes"],
    maxCostPerHour: 50   // $50/hour max for urgent stuff
  },
  
  ACTIVE: {
    interval: 60000,     // 1 minute  
    description: "New evidence, constitutional discussions, court processing",
    triggers: ["new_evidence", "active_threads", "pending_cases"],
    maxCostPerHour: 10   // $10/hour for active governance
  },
  
  NORMAL: {
    interval: 300000,    // 5 minutes
    description: "Ongoing constitutional work, routine governance", 
    triggers: ["constitutional_discussions", "agent_registrations"],
    maxCostPerHour: 2    // $2/hour for normal operations
  },
  
  BACKGROUND: {
    interval: 1800000,   // 30 minutes
    description: "Long-term planning, maintenance, archives",
    triggers: ["transparency_tasks", "cleanup", "strategic_planning"],
    maxCostPerHour: 0.5  // $0.50/hour for background
  }
};

// Assess current system urgency
async function assessSystemUrgency() {
  try {
    // Check for active disputes (URGENT)
    const activeCases = await client.query(api.cases.getRecentCases, { limit: 5 });
    const activeDisputes = activeCases.filter(c => c.status === "ACTIVE" || c.status === "IN_PROGRESS");
    
    if (activeDisputes.length > 0) {
      return {
        tier: "URGENT",
        reason: `${activeDisputes.length} active disputes requiring immediate attention`,
        data: activeDisputes
      };
    }
    
    // Check for recent evidence/activity (ACTIVE)
    const recentThreads = await client.query(api.constitutionalDiscussions.getActiveThreads, { limit: 10 });
    const recentActivity = recentThreads.filter(t => 
      (Date.now() - t.lastActivity) < 600000 // Activity in last 10 minutes
    );
    
    if (recentActivity.length > 2) {
      return {
        tier: "ACTIVE", 
        reason: `${recentActivity.length} threads with recent activity`,
        data: recentActivity
      };
    }
    
    // Check for ongoing discussions (NORMAL)
    if (recentThreads.length > 0) {
      return {
        tier: "NORMAL",
        reason: `${recentThreads.length} ongoing constitutional discussions`,
        data: recentThreads
      };
    }
    
    // Default to background
    return {
      tier: "BACKGROUND",
      reason: "No urgent activity, routine governance mode",
      data: null
    };
    
  } catch (error) {
    console.error("Failed to assess urgency:", error);
    return {
      tier: "NORMAL",
      reason: "Unable to assess urgency, defaulting to normal operations",
      data: null
    };
  }
}

// Run constitutional round with cost tracking
async function runSmartGovernanceRound() {
  console.log('\n🧠 INTELLIGENT FREQUENCY GOVERNANCE');
  console.log('==================================');
  console.log('Time:', new Date().toLocaleString());
  
  // Assess current situation
  const urgency = await assessSystemUrgency();
  const tier = FREQUENCY_TIERS[urgency.tier];
  
  console.log(`\n📊 System Assessment:`);
  console.log(`   Urgency Level: ${urgency.tier}`);
  console.log(`   Reason: ${urgency.reason}`);
  console.log(`   Response Frequency: Every ${tier.interval/1000}s`);
  console.log(`   Max Cost/Hour: $${tier.maxCostPerHour}`);
  
  try {
    // Run constitutional round
    const result = await client.action(api.liveConstitutionalGovernment.runConstitutionalRound, {});
    
    console.log(`\n✅ Constitutional Round Complete:`);
    console.log(`   Successful Actions: ${result.successful}`);
    console.log(`   Failed Actions: ${result.failed}`);
    
    // Calculate estimated costs
    const actionsPerHour = 3600000 / tier.interval; // Actions per hour at this frequency
    const estimatedCostPerHour = actionsPerHour * 0.02; // $0.02 per action estimate
    
    console.log(`\n💰 Cost Analysis:`);
    console.log(`   Current Frequency: ${actionsPerHour.toFixed(1)} rounds/hour`);
    console.log(`   Estimated Cost: $${estimatedCostPerHour.toFixed(2)}/hour`);
    console.log(`   Daily Estimate: $${(estimatedCostPerHour * 24).toFixed(2)}`);
    
    if (estimatedCostPerHour > tier.maxCostPerHour) {
      console.log(`   ⚠️  COST WARNING: Exceeding budget for ${urgency.tier} tier`);
    } else {
      console.log(`   ✅ Within budget for ${urgency.tier} operations`);
    }
    
    return {
      success: true,
      tier: urgency.tier,
      nextInterval: tier.interval,
      estimatedCost: estimatedCostPerHour,
      result
    };
    
  } catch (error) {
    console.error("Governance round failed:", error);
    return {
      success: false,
      tier: urgency.tier,
      nextInterval: tier.interval * 2, // Back off on errors
      error: error.message
    };
  }
}

// Main intelligent governance loop
async function runIntelligentGovernance() {
  console.log('🚀 STARTING INTELLIGENT FREQUENCY GOVERNANCE');
  console.log('==========================================');
  console.log('🧠 Adapts frequency based on system urgency');
  console.log('💰 Optimizes for cost efficiency');
  console.log('⚡ Responds faster when needed, slower when quiet');
  console.log('\nPress Ctrl+C to stop\n');
  
  while (true) {
    try {
      const result = await runSmartGovernanceRound();
      
      // Wait for the appropriate interval based on urgency
      console.log(`\n⏰ Next check in ${result.nextInterval/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, result.nextInterval));
      
    } catch (error) {
      console.error("System error:", error);
      console.log("Waiting 60 seconds before retry...");
      await new Promise(resolve => setTimeout(resolve, 60000));
    }
  }
}

// Command line interface
const mode = process.argv[2];

if (mode === 'assess') {
  // Just show current urgency assessment
  assessSystemUrgency().then(urgency => {
    console.log('\n🎯 CURRENT SYSTEM URGENCY:');
    console.log('=========================');
    console.log(`Level: ${urgency.tier}`);
    console.log(`Reason: ${urgency.reason}`);
    console.log(`Recommended Frequency: Every ${FREQUENCY_TIERS[urgency.tier].interval/1000} seconds`);
    console.log(`Max Budget: $${FREQUENCY_TIERS[urgency.tier].maxCostPerHour}/hour`);
  });
} else if (mode === 'single') {
  // Run one intelligent round
  runSmartGovernanceRound().then(result => {
    console.log('\n🎉 Single round complete!');
    console.log('Run with no arguments for continuous operation');
  });
} else {
  // Run continuously with intelligent frequency
  runIntelligentGovernance();
}

export { runSmartGovernanceRound, assessSystemUrgency };
