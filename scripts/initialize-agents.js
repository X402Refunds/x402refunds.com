#!/usr/bin/env node

/**
 * Initialize AI vendor and consumer agents for dispute generation
 */

import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.CONVEX_URL || "https://perceptive-lyrebird-89.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

async function initializeAgents() {
  console.log("🚀 Initializing AI agents...\n");
  
  try {
    // Call the initializeAgents mutation
    const result = await client.mutation("disputeEngine:initializeAgents", {});
    
    console.log("\n✅ Agent initialization complete!");
    console.log(`   Registered: ${result.registered} agents`);
    console.log("\n🎯 Dispute generation cron jobs will now have agents to work with!");
    
  } catch (error) {
    console.error("❌ Failed to initialize agents:", error.message);
    process.exit(1);
  }
}

initializeAgents();
