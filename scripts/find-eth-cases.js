#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.CONVEX_URL || "https://youthful-orca-358.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

async function findETHCases() {
  console.log(`🔍 Finding ETH cases in: ${CONVEX_URL}\n`);
  
  try {
    // Get recent cases
    const recentCases = await client.query("cases:getRecentCases", { limit: 100 });
    console.log(`📊 Total recent cases: ${recentCases.length}\n`);
    
    // Filter for ETH cases
    const ethCases = recentCases.filter(c => 
      c.currency === "ETH" || 
      (c.currency && c.currency.includes("ETH"))
    );
    
    console.log(`💰 Found ${ethCases.length} ETH cases:\n`);
    
    // Sort by amount descending
    ethCases.sort((a, b) => (b.amount || 0) - (a.amount || 0));
    
    ethCases.slice(0, 20).forEach((c, i) => {
      console.log(`${i+1}. Case ${c._id}`);
      console.log(`   Amount: ${c.amount} ${c.currency}`);
      console.log(`   Status: ${c.status}`);
      console.log(`   Filed: ${new Date(c.filedAt).toLocaleString()}`);
      console.log(`   Plaintiff: ${c.plaintiff}`);
      console.log(`   Defendant: ${c.defendant}`);
      console.log();
    });
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
  }
}

findETHCases();
