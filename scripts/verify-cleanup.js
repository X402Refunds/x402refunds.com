#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.CONVEX_URL || "https://perceptive-lyrebird-89.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

async function verifyCleanup() {
  console.log(`🔍 Verifying cleanup...\n`);
  
  try {
    // Check IN_REVIEW cases
    const inReviewCases = await client.query("cases:getCasesByStatus", { 
      status: "IN_REVIEW",
      limit: 200 
    });
    
    console.log(`📊 IN_REVIEW Status:`);
    console.log(`   Total cases: ${inReviewCases.length}`);
    
    const totalAmount = inReviewCases.reduce((sum, c) => sum + (c.amount || 0), 0);
    console.log(`   Total amount: $${totalAmount.toFixed(2)}`);
    
    // Check for any remaining large amounts
    const largeCases = inReviewCases.filter(c => {
      if (!c.amount) return false;
      const currency = c.currency || "USD";
      return (
        (currency === "ETH" && c.amount > 10) ||
        (currency === "USD" && c.amount > 10000) ||
        (currency === "USDC" && c.amount > 10000)
      );
    });
    
    if (largeCases.length > 0) {
      console.log(`\n⚠️  Still ${largeCases.length} cases with large amounts:`);
      largeCases.forEach(c => {
        console.log(`   - ${c._id}: ${c.amount} ${c.currency}`);
      });
    } else {
      console.log(`\n✅ No more cases with large amounts!`);
    }
    
    // Check overall statistics
    const analysis = await client.query("cleanup:analyzeDatabase", {});
    console.log(`\n📊 Overall Statistics:`);
    console.log(`   Total cases: ${analysis.cases.count}`);
    console.log(`   By Status:`, analysis.cases.byStatus);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

verifyCleanup();
