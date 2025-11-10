#!/usr/bin/env node
/**
 * Backfill reviewerOrganizationId for X-402 cases based on defendant's organization
 * 
 * Usage: node scripts/backfill-x402-case-org.js <caseId> [defendantWallet]
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.CONVEX_URL || "https://perceptive-lyrebird-89.convex.cloud";

async function main() {
  const caseId = process.argv[2];
  const defendantWallet = process.argv[3];

  if (!caseId) {
    console.error("Usage: node scripts/backfill-x402-case-org.js <caseId> [defendantWallet]");
    process.exit(1);
  }

  const client = new ConvexHttpClient(CONVEX_URL);

  console.log(`🔍 Looking up case: ${caseId}`);

  try {
    // Get case details
    const caseDetails = await client.query(api.cases.getCase, { caseId });
    
    if (!caseDetails) {
      console.error(`❌ Case not found: ${caseId}`);
      process.exit(1);
    }

    console.log(`\n📋 Case Details:`);
    console.log(`   Type: ${caseDetails.type}`);
    console.log(`   Plaintiff: ${caseDetails.plaintiff}`);
    console.log(`   Defendant: ${caseDetails.defendant}`);
    console.log(`   Status: ${caseDetails.status}`);
    console.log(`   Current reviewerOrganizationId: ${caseDetails.reviewerOrganizationId || "NOT SET"}`);

    // If defendantWallet provided, look up agent
    let agentData = null;
    if (defendantWallet) {
      console.log(`\n🔍 Looking up agent by wallet: ${defendantWallet}`);
      agentData = await client.query(api.agents.getAgentByWallet, { 
        walletAddress: defendantWallet.toLowerCase() 
      });
      
      if (!agentData) {
        console.error(`❌ No agent found with wallet: ${defendantWallet}`);
        console.log(`\nℹ️  The agent may need to be claimed first.`);
        process.exit(1);
      }

      console.log(`\n🤖 Agent Details:`);
      console.log(`   DID: ${agentData.did}`);
      console.log(`   Name: ${agentData.name || "N/A"}`);
      console.log(`   Status: ${agentData.status}`);
      console.log(`   Organization ID: ${agentData.organizationId || "NOT SET (unclaimed)"}`);

      if (!agentData.organizationId) {
        console.error(`\n❌ Agent is not claimed yet (no organizationId)`);
        console.log(`\nℹ️  To fix this, the agent owner needs to:`);
        console.log(`   1. Sign in to the dashboard`);
        console.log(`   2. Go to the "Unclaimed Agents" page`);
        console.log(`   3. Claim the agent by proving ownership of the wallet`);
        process.exit(1);
      }

      // Backfill the case with the organization
      console.log(`\n🔧 Backfilling case with reviewerOrganizationId: ${agentData.organizationId}`);
      
      await client.mutation(api.cases.backfillReviewerOrgId, {
        caseId,
        reviewerOrganizationId: agentData.organizationId,
      });

      console.log(`\n✅ Successfully backfilled case ${caseId}`);
      console.log(`   reviewerOrganizationId set to: ${agentData.organizationId}`);
    } else {
      console.log(`\n⚠️  No wallet address provided. To backfill, provide the defendant's wallet address:`);
      console.log(`   node scripts/backfill-x402-case-org.js ${caseId} 0x...`);
    }

  } catch (error) {
    console.error(`\n❌ Error:`, error.message);
    process.exit(1);
  }
}

main();

