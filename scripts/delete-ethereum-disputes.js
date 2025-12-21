#!/usr/bin/env node
/**
 * Delete Ethereum Test Disputes
 * Removes disputes that were filed before Base/Solana-only restriction
 */

import { ConvexHttpClient } from "convex/browser";
import { internal } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.CONVEX_URL || "https://perceptive-lyrebird-89.convex.cloud";

// Ethereum test disputes to delete
const ETHEREUM_DISPUTE_IDS = [
  "jd760vpbwrkxrganmktdn9emfd7x2zyy",
  "jd76fqg2f008gvfz1evwvaypm17x2s30",
  "jd7308efwnjq8qy7a617dv900h7x2qt9",
  "jd7ffnm4sngzk9g0tphvp9sr2x7x3j5g",
  "jd7ae4gn6fpshyyj86rg0651bn7x2q7m"
];

async function main() {
  const client = new ConvexHttpClient(CONVEX_URL);

  console.log(`🗑️  Deleting ${ETHEREUM_DISPUTE_IDS.length} Ethereum test disputes from ${CONVEX_URL}\n`);

  try {
    // Delete all cases in one batch via internal mutation
    const result = await client.mutation(internal.testing.deleteSpecificCases, {
      caseIds: ETHEREUM_DISPUTE_IDS
    });
    
    console.log(`\n📊 Results:`);
    console.log(`   Deleted: ${result.deleted}`);
    console.log(`   Failed: ${result.failed}`);
    
    if (result.deleted > 0) {
      console.log(`\n✅ Cleanup complete! Refresh your dashboard to see the changes.`);
    }
  } catch (error) {
    console.error(`\n❌ Batch deletion failed: ${error.message}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
