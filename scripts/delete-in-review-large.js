#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.CONVEX_URL || "https://youthful-orca-358.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

async function deleteInReviewLarge() {
  console.log(`🔍 Deleting IN_REVIEW cases with large amounts...\n`);
  console.log(`   API: ${CONVEX_URL}\n`);
  
  try {
    // Get all IN_REVIEW cases
    const inReviewCases = await client.query("cases:getCasesByStatus", { 
      status: "IN_REVIEW",
      limit: 500 
    });
    
    console.log(`📊 Total IN_REVIEW cases: ${inReviewCases.length}\n`);
    
    // Find cases with large amounts (anything over $1000 or 1 ETH)
    const largeCases = inReviewCases.filter(c => {
      if (!c.amount) return false;
      const currency = c.currency || "USD";
      
      // Consider large if:
      // - USD/USDC > $1000
      // - ETH > 1 ETH
      // - Any currency > 100000
      return (
        (currency === "USD" && c.amount > 1000) ||
        (currency === "USDC" && c.amount > 1000) ||
        (currency === "ETH" && c.amount > 1) ||
        c.amount > 100000
      );
    });
    
    if (largeCases.length === 0) {
      console.log("✅ No large IN_REVIEW cases found!");
      return;
    }
    
    console.log(`🚨 Found ${largeCases.length} IN_REVIEW cases with large amounts:\n`);
    
    // Show what we're about to delete
    largeCases.slice(0, 10).forEach((c, i) => {
      console.log(`${i+1}. Case ${c._id}`);
      console.log(`   Amount: ${c.amount} ${c.currency || 'USD'}`);
      console.log(`   Plaintiff: ${c.plaintiff}`);
      console.log(`   Defendant: ${c.defendant}`);
      console.log();
    });
    
    if (largeCases.length > 10) {
      console.log(`   ... and ${largeCases.length - 10} more\n`);
    }
    
    console.log(`⚠️  Deleting in 3 seconds... Press Ctrl+C to cancel`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Delete each case using the cleanup mutation
    let deleted = 0;
    let failed = 0;
    
    for (const caseDoc of largeCases) {
      try {
        // We need to create a specific deletion mutation for a single case
        // For now, let's use the cleanup mutation with very tight filter
        console.log(`Deleting case ${caseDoc._id}...`);
        deleted++;
      } catch (error) {
        console.error(`❌ Failed to delete case ${caseDoc._id}:`, error.message);
        failed++;
      }
    }
    
    console.log(`\n✅ Found ${largeCases.length} cases to delete`);
    console.log(`   Use the Convex dashboard to delete individual cases, or we'll create a proper deletion mutation.`);
    
    // Return the case IDs for manual deletion
    console.log(`\n📋 Case IDs to delete:`);
    largeCases.forEach(c => console.log(c._id));
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

deleteInReviewLarge();
