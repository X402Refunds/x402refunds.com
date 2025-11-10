#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.CONVEX_URL || "https://perceptive-lyrebird-89.convex.cloud";

async function main() {
  const caseId = process.argv[2];
  
  if (!caseId) {
    console.log("Usage: node scripts/check-case-status.js <caseId>");
    process.exit(1);
  }

  const client = new ConvexHttpClient(CONVEX_URL);

  console.log(`🔍 Checking case: ${caseId}\n`);

  const caseData = await client.query(api.cases.getCase, { caseId });

  if (!caseData) {
    console.log("❌ Case not found");
    process.exit(1);
  }

  console.log("✅ Case found:");
  console.log(`   Status: ${caseData.status}`);
  console.log(`   Type: ${caseData.type}`);
  console.log(`   Filed: ${new Date(caseData.filedAt).toISOString()}`);
  console.log(`   Plaintiff: ${caseData.plaintiff}`);
  console.log(`   Defendant: ${caseData.defendant}`);
  console.log(`   Amount: $${caseData.amount || 0}`);
  console.log(`   Reviewer Org ID: ${caseData.reviewerOrganizationId || "NOT SET ❌"}`);
  console.log(`   Description: ${caseData.description?.substring(0, 100)}...`);
  
  if (!caseData.reviewerOrganizationId) {
    console.log("\n❌ ISSUE: reviewerOrganizationId is missing!");
    console.log("   This case won't show in organization dashboards");
    
    // Check if defendant has an organization
    const defendantId = caseData.defendant;
    console.log(`\n🔍 Checking defendant (${defendantId})...`);
    
    // Try wallet lookup first
    let agent = await client.query(api.agents.getAgentByWallet, { walletAddress: defendantId });
    
    // If not found by wallet, try DID lookup
    if (!agent && defendantId.startsWith("did:")) {
      agent = await client.query(api.agents.getAgent, { did: defendantId });
    }
    
    if (agent) {
      console.log(`   ✅ Agent found: ${agent.did}`);
      console.log(`   Status: ${agent.status}`);
      console.log(`   Organization: ${agent.organizationId || "NOT SET"}`);
      
      if (agent.organizationId) {
        console.log(`\n💡 FIX NEEDED: Backfill with org ID: ${agent.organizationId}`);
        console.log(`   Run: node scripts/backfill-single-case.js ${caseId} ${agent.organizationId}`);
      } else {
        console.log(`\n⚠️  Defendant agent exists but has no organization`);
        console.log(`   Agent needs to be claimed first`);
      }
    } else {
      console.log(`   ❌ Agent not found for: ${defendantId}`);
      console.log(`   This shouldn't happen - agents should be auto-created`);
    }
  } else {
    console.log("\n✅ reviewerOrganizationId is set correctly!");
    console.log(`   Case should appear in org dashboard: ${caseData.reviewerOrganizationId}`);
  }
}

main().catch(err => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});

