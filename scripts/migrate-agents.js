#!/usr/bin/env node

/**
 * Script to migrate existing agents to ensure all schema fields are populated
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const deploymentUrl = process.env.CONVEX_URL || "https://perceptive-lyrebird-89.convex.cloud";

async function migrateAgents() {
  console.log("🔄 Starting agent schema migration...");
  console.log(`📡 Connecting to: ${deploymentUrl}`);
  
  const client = new ConvexHttpClient(deploymentUrl);
  
  try {
    const result = await client.mutation(api.agents.migrateAgentsSchema, {});
    
    console.log("\n✅ Migration complete!");
    console.log(`   Total agents: ${result.totalAgents}`);
    console.log(`   Updated: ${result.updated}`);
    console.log(`   Skipped (already migrated): ${result.skipped}`);
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:");
    console.error(error);
    process.exit(1);
  }
}

migrateAgents();

