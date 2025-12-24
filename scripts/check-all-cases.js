#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.CONVEX_URL || "https://youthful-orca-358.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

async function checkCases() {
  console.log(`🔍 Checking cases in: ${CONVEX_URL}\n`);
  
  try {
    const analysis = await client.query("cleanup:analyzeDatabase", {});
    
    console.log(`📊 Cases Analysis:`);
    console.log(`   Total: ${analysis.cases.count}`);
    console.log(`   By Type:`, analysis.cases.byType);
    console.log(`   By Status:`, analysis.cases.byStatus);
    
    // Get a few sample cases
    const recentCases = await client.query("cases:getRecentCases", { limit: 10 });
    console.log(`\n📋 Recent ${recentCases.length} cases:`);
    recentCases.forEach((c, i) => {
      console.log(`\n${i+1}. Case ${c._id}`);
      console.log(`   Amount: ${c.amount} ${c.currency || 'USD'}`);
      console.log(`   Status: ${c.status}`);
      console.log(`   Plaintiff: ${c.plaintiff}`);
      console.log(`   Defendant: ${c.defendant}`);
    });
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkCases();
