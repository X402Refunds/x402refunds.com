#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = "https://perceptive-lyrebird-89.convex.cloud";

async function main() {
  const caseId = process.argv[2] || "jd7e198z5hgs7cy6aavtn4r9wx7v4nc3";
  const client = new ConvexHttpClient(CONVEX_URL);

  console.log("🔍 DEBUGGING CASE\n");
  console.log("=" .repeat(80));
  
  // 1. Get the case
  const caseData = await client.query(api.cases.getCase, { caseId });
  
  if (!caseData) {
    console.log("❌ CASE NOT FOUND IN DATABASE");
    process.exit(1);
  }

  console.log("\n📋 CASE DATA:");
  console.log(`   Case ID: ${caseData._id}`);
  console.log(`   Filed: ${new Date(caseData.filedAt).toISOString()}`);
  console.log(`   Status: ${caseData.status}`);
  console.log(`   Type: ${caseData.type}`);
  console.log(`   Plaintiff: ${caseData.plaintiff}`);
  console.log(`   Defendant: ${caseData.defendant}`);
  console.log(`   Amount: $${caseData.amount || 0}`);
  console.log(`   reviewerOrganizationId: ${caseData.reviewerOrganizationId || "❌ NOT SET"}`);

  // 2. Check defendant agent
  console.log("\n🔍 CHECKING DEFENDANT:");
  const defendantId = caseData.defendant;
  console.log(`   ID: ${defendantId}`);
  
  let defendantAgent = null;
  
  // Try wallet lookup
  try {
    defendantAgent = await client.query(api.agents.getAgentByWallet, { 
      walletAddress: defendantId 
    });
  } catch (e) {}
  
  // Try DID lookup if wallet failed
  if (!defendantAgent && defendantId.startsWith("did:")) {
    try {
      defendantAgent = await client.query(api.agents.getAgent, { did: defendantId });
    } catch (e) {}
  }

  if (defendantAgent) {
    console.log(`   ✅ Found: ${defendantAgent.did}`);
    console.log(`   Status: ${defendantAgent.status}`);
    console.log(`   Org ID: ${defendantAgent.organizationId || "❌ NOT SET"}`);
    console.log(`   Name: ${defendantAgent.name}`);
  } else {
    console.log(`   ❌ NOT FOUND`);
  }

  // 3. Check plaintiff agent
  console.log("\n🔍 CHECKING PLAINTIFF:");
  const plaintiffId = caseData.plaintiff;
  console.log(`   ID: ${plaintiffId}`);
  
  let plaintiffAgent = null;
  
  try {
    plaintiffAgent = await client.query(api.agents.getAgentByWallet, { 
      walletAddress: plaintiffId 
    });
  } catch (e) {}
  
  if (!plaintiffAgent && plaintiffId.startsWith("did:")) {
    try {
      plaintiffAgent = await client.query(api.agents.getAgent, { did: plaintiffId });
    } catch (e) {}
  }

  if (plaintiffAgent) {
    console.log(`   ✅ Found: ${plaintiffAgent.did}`);
    console.log(`   Status: ${plaintiffAgent.status}`);
    console.log(`   Org ID: ${plaintiffAgent.organizationId || "❌ NOT SET"}`);
    console.log(`   Name: ${plaintiffAgent.name}`);
  } else {
    console.log(`   ❌ NOT FOUND`);
  }

  // 4. ROOT CAUSE ANALYSIS
  console.log("\n💡 ROOT CAUSE:");
  console.log("=" .repeat(80));
  
  if (!caseData.reviewerOrganizationId) {
    console.log("\n❌ PROBLEM: reviewerOrganizationId NOT SET");
    
    if (defendantAgent?.organizationId) {
      console.log(`\n🔴 CRITICAL BUG: Defendant HAS org (${defendantAgent.organizationId})`);
      console.log("   BUT auto-detection FAILED!");
      console.log("\n   Possible causes:");
      console.log("   1. Code not deployed yet");
      console.log("   2. Different API endpoint used");
      console.log("   3. Agent lookup failed during creation");
      console.log("   4. Variable not passed to mutation");
    } else if (plaintiffAgent?.organizationId) {
      console.log(`\n⚠️  Fallback: Plaintiff has org (${plaintiffAgent.organizationId})`);
      console.log("   Fallback logic should have worked");
    } else {
      console.log("\n   Neither party has organization - expected behavior");
    }
  } else {
    console.log("\n✅ reviewerOrganizationId IS SET");
  }

  // 5. Dashboard query test
  const yourOrgId = "mx70w8hshm2xrqmw00wk3qhfsh7sfvt9";
  console.log(`\n🔍 DASHBOARD QUERY (org: ${yourOrgId}):`);
  
  try {
    const orgCases = await client.query(api.cases.getOrganizationCases, { 
      organizationId: yourOrgId,
      limit: 100
    });
    
    const found = orgCases.find(c => c._id === caseId);
    
    console.log(`   Total cases: ${orgCases.length}`);
    console.log(`   This case found: ${found ? "YES ✅" : "NO ❌"}`);
    
    if (!found && caseData.reviewerOrganizationId === yourOrgId) {
      console.log("\n   🔴 QUERY BUG: Case has correct org but query doesn't return it!");
    }
  } catch (error) {
    console.log(`   ❌ Query failed: ${error.message}`);
  }

  console.log("\n" + "=".repeat(80));
}

main().catch(err => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});

