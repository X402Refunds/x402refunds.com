#!/usr/bin/env node
/**
 * Manually trigger demo dispute generation
 * This calls the internal cron function to generate a dispute immediately
 */

import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.CONVEX_URL || "https://perceptive-lyrebird-89.convex.cloud";

async function generateDispute() {
  console.log("🎬 Manually triggering demo dispute generation...\n");
  console.log(`📡 Connecting to: ${CONVEX_URL}\n`);
  
  const client = new ConvexClient(CONVEX_URL);
  
  try {
    console.log("🧠 Generating demo dispute...");
    
    // Call the new public mutation to generate a dispute
    const result = await client.mutation(api.crons.triggerDisputeGeneration, {});
    
    if (result.success) {
      console.log(`\n✅ ${result.message}`);
      console.log(`   Case ID: ${result.caseId}`);
      console.log(`   Type: ${result.disputeType}`);
      console.log(`   Parties: ${result.parties.join(" vs ")}`);
      console.log("\n🎉 Dispute created successfully!");
      console.log("   Refresh the page to see it: https://www.consulatehq.com/demo/cases/\n");
    } else {
      console.log(`\n❌ Failed to generate dispute: ${result.message}`);
      console.log("\n💡 Tip: Make sure there are at least 2 active agents registered.");
      console.log("   Check agents at: https://www.consulatehq.com/demo/agents/\n");
    }
    
    // Query existing cases to show current state
    const recentCases = await client.query(api.cases.getRecentCases, { 
      limit: 10,
      mockOnly: true 
    });
    
    console.log(`📊 Total demo cases: ${recentCases.length}`);
    
    if (recentCases.length > 0) {
      console.log("\n📋 Recent demo cases:");
      recentCases.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.type}: ${c.description?.slice(0, 50)}...`);
        console.log(`      Status: ${c.status}, Filed: ${new Date(c.filedAt).toLocaleString()}`);
      });
    }
    
    client.close();
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

generateDispute().catch(console.error);

