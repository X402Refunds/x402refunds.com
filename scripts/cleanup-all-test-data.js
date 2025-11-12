#!/usr/bin/env node
/**
 * Run cleanup repeatedly until all test data is removed
 * Handles Convex read limits by processing in batches
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.argv[2] || process.env.CONVEX_URL || "https://youthful-orca-358.convex.cloud";

async function main() {
  console.log(`🧹 Batch Cleanup - Running until all test data removed`);
  console.log(`   Environment: ${CONVEX_URL}\n`);
  
  const client = new ConvexHttpClient(CONVEX_URL);
  
  let round = 1;
  let totalDeleted = 0;
  
  while (round <= 20) { // Max 20 rounds to prevent infinite loops
    console.log(`\n--- Round ${round} ---`);
    
    try {
      // Delete agents batch
      const agentResult = await client.mutation(api.testing.deleteTestAgentsBatch, {
        maxDeletes: 50
      });
      console.log(`   Agents: ${agentResult.deleted} deleted (${agentResult.totalTestAgents || 0} test agents remaining)`);
      
      // Delete cases batch
      const caseResult = await client.mutation(api.testing.deleteTestCasesBatch, {
        maxDeletes: 50
      });
      console.log(`   Cases: ${caseResult.deleted} deleted (${caseResult.totalTestCases || 0} test cases remaining)`);
      
      const roundTotal = agentResult.deleted + caseResult.deleted;
      totalDeleted += roundTotal;
      
      if (roundTotal === 0) {
        console.log(`\n✅ All test data cleaned! Total deleted: ${totalDeleted}`);
        break;
      }
      
      round++;
      
      // Small delay between rounds
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`\n❌ Round ${round} failed:`, error.message);
      break;
    }
  }
  
  if (round > 20) {
    console.log(`\n⚠️  Stopped after 20 rounds. Total deleted: ${totalDeleted}`);
    console.log(`   Some test data might still remain.`);
  }
  
  // Final count
  console.log(`\n📊 Verifying cleanup...`);
  const remainingAgents = await client.query(api.agents.listAgents, { limit: 1000 });
  const testAgents = remainingAgents.filter(a => 
    a.walletAddress?.startsWith('0x00000000') ||
    a.walletAddress?.startsWith('0x98765432') ||
    a.did?.toLowerCase().includes('test') ||
    a.name?.toLowerCase().includes('test')
  );
  
  console.log(`   Remaining agents: ${remainingAgents.length} (${testAgents.length} look like tests)`);
  
  if (testAgents.length === 0) {
    console.log(`\n✅ SUCCESS: All test data removed!`);
  } else {
    console.log(`\n⚠️  ${testAgents.length} test-like agents still remain`);
  }
}

main().catch(err => {
  console.error("\n❌ Cleanup failed:", err.message);
  process.exit(1);
});

