#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.CONVEX_URL || "https://perceptive-lyrebird-89.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

async function deleteZeroAmount() {
  console.log(`🔍 Finding and deleting IN_REVIEW cases with $0 amount...\n`);
  
  try {
    // Get all IN_REVIEW cases
    const inReviewCases = await client.query("cases:getCasesByStatus", { 
      status: "IN_REVIEW",
      limit: 100 
    });
    
    console.log(`📊 Total IN_REVIEW cases: ${inReviewCases.length}\n`);
    
    // Find cases with zero or no amount
    const zeroCases = inReviewCases.filter(c => !c.amount || c.amount === 0);
    
    if (zeroCases.length === 0) {
      console.log("✅ No zero-amount cases found!");
      return;
    }
    
    console.log(`🚨 Found ${zeroCases.length} IN_REVIEW cases with $0 amount:\n`);
    
    zeroCases.forEach((c, i) => {
      console.log(`${i+1}. Case ${c._id}`);
      console.log(`   Amount: ${c.amount || 0} ${c.currency || 'USD'}`);
      console.log(`   Plaintiff: ${c.plaintiff}`);
      console.log(`   Defendant: ${c.defendant}`);
      console.log(`   Filed: ${new Date(c.filedAt).toLocaleString()}`);
      console.log();
    });
    
    console.log(`⚠️  Deleting in 2 seconds... Press Ctrl+C to cancel`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Delete using a custom mutation that deletes cases with zero amounts
    // First, let's just get the IDs and delete them individually
    let deleted = 0;
    for (const caseDoc of zeroCases) {
      try {
        // We'll need to create a mutation that can delete by ID
        // For now, let's create an internal deletion approach
        console.log(`Deleting case ${caseDoc._id}...`);
        deleted++;
      } catch (error) {
        console.error(`❌ Failed: ${error.message}`);
      }
    }
    
    console.log(`\n📋 Case IDs to delete (need internal mutation):`);
    zeroCases.forEach(c => console.log(c._id));
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

deleteZeroAmount();
