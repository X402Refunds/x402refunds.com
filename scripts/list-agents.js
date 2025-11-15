#!/usr/bin/env node
/**
 * List all agents with their IDs for cleanup selection
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || "https://youthful-orca-358.convex.cloud";

const client = new ConvexHttpClient(CONVEX_URL);

async function listAgents() {
  console.log("📋 Fetching all agents...\n");
  
  try {
    const agents = await client.query(api.agents.listAgents, { limit: 2000 });
    
    console.log(`Found ${agents.length} agents:\n`);
    console.log("=".repeat(100));
    console.log("ID".padEnd(25) + "DID".padEnd(50) + "NAME".padEnd(30) + "STATUS");
    console.log("=".repeat(100));
    
    for (const agent of agents) {
      const id = agent._id;
      const did = agent.did || "N/A";
      const name = (agent.name || "unnamed").substring(0, 28);
      const status = agent.status || "unknown";
      const mock = agent.mock ? " (mock)" : "";
      
      console.log(
        id.padEnd(25) + 
        did.substring(0, 48).padEnd(50) + 
        name.padEnd(30) + 
        status + mock
      );
    }
    
    console.log("=".repeat(100));
    console.log(`\nTotal: ${agents.length} agents`);
    console.log("\n💡 To keep one agent and delete all others:");
    console.log(`   node scripts/analyze-and-cleanup.js --keep-agent <agent-id>`);
    console.log("\nExample:");
    if (agents.length > 0) {
      console.log(`   node scripts/analyze-and-cleanup.js --keep-agent ${agents[0]._id}`);
    }
    
  } catch (error) {
    console.error("❌ Error listing agents:", error.message);
    process.exit(1);
  }
}

listAgents().catch(console.error);












