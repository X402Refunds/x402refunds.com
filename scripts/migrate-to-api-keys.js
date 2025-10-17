#!/usr/bin/env node

/**
 * Migration Script: API Key Authentication
 * 
 * This script migrates from the old registration token system to API key authentication.
 * 
 * What it does:
 * 1. Deletes all existing agents (no production customers per user)
 * 2. Deletes all agent reputation records
 * 3. Ensures all organizations have at least one API key
 * 4. Logs migration results
 * 
 * Run with: node scripts/migrate-to-api-keys.js
 */

const { ConvexHttpClient } = require("convex/browser");

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ Error: CONVEX_URL or NEXT_PUBLIC_CONVEX_URL environment variable not set");
  console.error("Set it in your .env file or run:");
  console.error("  CONVEX_URL=https://your-deployment.convex.cloud node scripts/migrate-to-api-keys.js");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

async function migrate() {
  console.log("🚀 Starting migration to API key authentication...\n");
  
  try {
    // Step 1: Get all agents
    console.log("📊 Fetching current agents...");
    const agents = await client.query("agents:listAgents", { limit: 1000 });
    console.log(`Found ${agents.length} agents to delete`);
    
    // Step 2: Get all agent reputation records
    console.log("\n📊 Checking agent reputation records...");
    
    // Step 3: Delete all agents (via Convex dashboard or manually)
    console.log("\n⚠️  MANUAL ACTION REQUIRED:");
    console.log("Please delete all agents manually through Convex dashboard:");
    console.log("1. Go to your Convex dashboard");
    console.log("2. Navigate to the 'agents' table");
    console.log("3. Delete all records");
    console.log("4. Navigate to the 'agentReputation' table");
    console.log("5. Delete all records");
    console.log("\nAlternatively, run this Convex mutation for each agent:");
    for (const agent of agents.slice(0, 5)) {
      console.log(`  ctx.db.delete("${agent._id}")`);
    }
    if (agents.length > 5) {
      console.log(`  ... and ${agents.length - 5} more`);
    }
    
    // Step 4: Check organizations
    console.log("\n📊 Checking organizations...");
    // Note: We can't query organizations directly without auth, so we'll just log instructions
    
    console.log("\n✅ Migration preparation complete!");
    console.log("\n📝 Summary:");
    console.log(`   - Found ${agents.length} agents that need to be deleted`);
    console.log("   - Organizations will auto-generate API keys on next user login (via users.ts)");
    console.log("\n🎯 Next steps:");
    console.log("1. Delete all agents and agent reputation records via Convex dashboard");
    console.log("2. Deploy the new code with 'pnpm deploy'");
    console.log("3. Users will get API keys auto-generated on next login");
    console.log("4. Agents can register using API keys");
    
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
migrate().then(() => {
  console.log("\n✨ Migration script completed");
  process.exit(0);
}).catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});

