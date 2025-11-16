#!/usr/bin/env node
/**
 * Migration: Fix cases with finalVerdict but wrong status
 * 
 * Updates all cases that have finalVerdict set but status is not DECIDED/CLOSED
 * to have status = DECIDED
 */

import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.CONVEX_URL || "https://youthful-orca-358.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

async function fixDecidedCases() {
  try {
    console.log("🔍 Finding cases with finalVerdict but wrong status...\n");

    // Get all recent cases
    const cases = await client.query("cases:getRecentCases", { limit: 500 });
    
    // Find cases with finalVerdict but not DECIDED/CLOSED status
    const brokenCases = cases.filter(c => 
      c.finalVerdict && !['DECIDED', 'CLOSED'].includes(c.status)
    );
    
    console.log(`Found ${brokenCases.length} cases to fix\n`);
    
    if (brokenCases.length === 0) {
      console.log("✅ No cases need fixing!");
      return;
    }
    
    console.log("📝 Cases to update:");
    brokenCases.slice(0, 10).forEach(c => {
      console.log(`  ${c._id} - Status: ${c.status} → DECIDED`);
    });
    
    if (brokenCases.length > 10) {
      console.log(`  ... and ${brokenCases.length - 10} more`);
    }
    
    console.log("\n🚀 Starting migration...\n");
    
    let updated = 0;
    let failed = 0;
    
    for (const case_ of brokenCases) {
      try {
        // Use public mutation to update case status
        await client.mutation("cases:updateCaseStatusPublic", {
          caseId: case_._id,
          status: "DECIDED"
        });
        updated++;
        
        if (updated % 10 === 0) {
          console.log(`  Progress: ${updated}/${brokenCases.length}`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to update ${case_._id}:`, error.message);
        failed++;
      }
    }
    
    console.log("\n✅ Migration complete!");
    console.log(`  Updated: ${updated} cases`);
    console.log(`  Failed: ${failed} cases`);
    
    if (failed > 0) {
      console.log("\n⚠️ Some cases failed to update. Check errors above.");
    } else {
      console.log("\n🎉 All cases successfully updated!");
      console.log("Cases with finalVerdict will now show as 'resolved' in the registry");
    }
    
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

fixDecidedCases();

