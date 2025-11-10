#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.CONVEX_URL || "https://api.x402disputes.com";
const client = new ConvexHttpClient(CONVEX_URL);

async function checkDisputes() {
  console.log("🔍 Checking current dispute status...\n");
  
  try {
    // Get recent cases
    const recentCases = await client.query("cases:getRecentCases", { limit: 5 });
    
    console.log(`📊 Total recent cases: ${recentCases.length}`);
    
    if (recentCases.length > 0) {
      console.log("\n🎯 Recent disputes:");
      recentCases.forEach((c, i) => {
        console.log(`\n${i+1}. ${c.type}`);
        console.log(`   Status: ${c.status}`);
        console.log(`   Parties: ${c.parties.join(" vs ")}`);
        console.log(`   Filed: ${new Date(c.filedAt).toLocaleString()}`);
        if (c.description) {
          console.log(`   Description: ${c.description.substring(0, 100)}...`);
        }
      });
    } else {
      console.log("\n⏳ No disputes yet. The cron job runs every 5 minutes.");
      console.log("   Next dispute should be generated soon!");
    }
    
    // Get agent count
    const stats = await client.query("events:getSystemStats", { hoursBack: 24 });
    console.log(`\n📈 System Stats (24h):`);
    console.log(`   Agent Registrations: ${stats.agentRegistrations}`);
    console.log(`   Disputes Filed: ${stats.disputesFiled}`);
    console.log(`   Evidence Submitted: ${stats.evidenceSubmitted}`);
    console.log(`   Cases Resolved: ${stats.casesResolved}`);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkDisputes();
