#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.CONVEX_URL || "https://youthful-orca-358.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

async function findLargeAmounts() {
  console.log(`🔍 Finding cases with large amounts in: ${CONVEX_URL}\n`);
  
  try {
    // Get ALL cases (might be slow)
    const allCases = await client.query("cases:list", {});
    console.log(`📊 Total cases: ${allCases.length}\n`);
    
    // Find cases with large amounts
    const largeCases = allCases.filter(c => {
      if (!c.amount) return false;
      const currency = c.currency || "USD";
      return (
        (currency === "USD" && c.amount > 1000) ||
        (currency === "ETH" && c.amount > 1) ||
        (currency === "USDC" && c.amount > 1000) ||
        c.amount > 10000 // any currency over 10k
      );
    });
    
    console.log(`🚨 Found ${largeCases.length} cases with large amounts:\n`);
    
    // Show top 20 by amount
    const sorted = largeCases.sort((a, b) => (b.amount || 0) - (a.amount || 0)).slice(0, 20);
    sorted.forEach((c, i) => {
      console.log(`${i+1}. Case ${c._id}`);
      console.log(`   Amount: ${c.amount} ${c.currency || 'USD'}`);
      console.log(`   Status: ${c.status}`);
      console.log(`   Filed: ${new Date(c.filedAt).toLocaleString()}`);
      console.log(`   Org: ${c.reviewerOrgId || 'N/A'}`);
      console.log();
    });
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

findLargeAmounts();
