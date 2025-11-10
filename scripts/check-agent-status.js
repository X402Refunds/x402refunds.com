#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.CONVEX_URL || "https://perceptive-lyrebird-89.convex.cloud";

async function main() {
  const wallet = process.argv[2] || "0x49af4074577ea313c5053cbb7560ac39e34b05e8";
  const client = new ConvexHttpClient(CONVEX_URL);

  console.log(`🔍 Checking agent with wallet: ${wallet}\n`);

  // 1. Check if agent exists
  const agent = await client.query(api.agents.getAgentByWallet, { 
    walletAddress: wallet 
  });

  if (!agent) {
    console.log("❌ Agent not found in database");
    console.log("\nℹ️  The agent may need to be created first.");
    console.log("   Agents are automatically created when disputes are filed against them.");
    process.exit(1);
  }

  console.log("✅ Agent found:");
  console.log(`   DID: ${agent.did}`);
  console.log(`   Name: ${agent.name || "N/A"}`);
  console.log(`   Status: ${agent.status}`);
  console.log(`   Organization ID: ${agent.organizationId || "NOT SET"}`);
  console.log(`   Created: ${new Date(agent.createdAt).toISOString()}`);

  // 2. Check for unclaimed agents
  const unclaimedAgents = await client.query(api.agents.listUnclaimedAgents, { limit: 100 });
  const isInUnclaimedList = unclaimedAgents.some(a => a.walletAddress?.toLowerCase() === wallet.toLowerCase());
  
  console.log(`\n📋 Unclaimed agents list: ${unclaimedAgents.length} total`);
  console.log(`   Your agent in list: ${isInUnclaimedList ? "YES ✅" : "NO ❌"}`);

  // 3. Check for cases/disputes
  const allCases = await client.query(api.cases.getRecentCases, { limit: 1000 });
  const agentCases = allCases.filter(c => {
    const defendantMatch = 
      c.defendant?.toLowerCase() === wallet.toLowerCase() || 
      c.defendant === agent.did;
    const plaintiffMatch = 
      c.plaintiff?.toLowerCase() === wallet.toLowerCase() ||
      c.plaintiff === agent.did;
    return defendantMatch || plaintiffMatch;
  });

  console.log(`\n⚖️  Cases/Disputes: ${agentCases.length} found`);
  if (agentCases.length > 0) {
    agentCases.forEach(c => {
      console.log(`\n   📁 Case ${c._id}:`);
      console.log(`      Status: ${c.status}`);
      console.log(`      Filed: ${new Date(c.filedAt).toLocaleDateString()}`);
      console.log(`      Plaintiff: ${c.plaintiff}`);
      console.log(`      Defendant: ${c.defendant}`);
      console.log(`      Type: ${c.type}`);
      console.log(`      Reviewer Org: ${c.reviewerOrganizationId || "NOT SET ❌"}`);
      console.log(`      Amount: ${c.amount ? `$${c.amount}` : "N/A"}`);
    });
  } else {
    console.log("   ⚠️  No disputes found");
  }

  // 4. Explain the issue
  console.log(`\n\n💡 ANALYSIS:`);
  console.log("=" .repeat(60));
  
  if (agent.status !== "unclaimed") {
    console.log(`\n❌ ISSUE: Agent status is "${agent.status}"`);
    console.log(`   Must be "unclaimed" to show in Unclaimed Agents list`);
    
    if (agent.status === "active" && agent.organizationId) {
      console.log(`\n✅ GOOD NEWS: Agent is already claimed!`);
      console.log(`   Linked to organization: ${agent.organizationId}`);
      console.log(`\n📍 WHERE TO FIND DISPUTES:`);
      console.log(`   Go to: Dashboard → Main page`);
      console.log(`   Disputes should appear in your organization's case list`);
    } else if (agent.status === "active" && !agent.organizationId) {
      console.log(`\n⚠️  ISSUE: Agent is active but not linked to any organization`);
      console.log(`   This shouldn't happen. Manual intervention needed.`);
    }
  } else {
    console.log(`\n✅ Agent has "unclaimed" status`);
    console.log(`   Should appear in Unclaimed Agents page`);
    console.log(`\n   If not appearing, check:`);
    console.log(`   1. Clear browser cache and refresh`);
    console.log(`   2. Check that Vercel deployment finished`);
    console.log(`   3. Wait 1-2 minutes for Convex sync`);
  }

  if (agentCases.length === 0) {
    console.log(`\n⚠️  WARNING: No disputes found against this agent`);
    console.log(`   This could mean:`);
    console.log(`   1. The dispute hasn't been filed yet`);
    console.log(`   2. The defendant wallet address in the dispute doesn't match`);
    console.log(`   3. The dispute was filed against a different identifier (DID vs wallet)`);
  } else {
    const casesWithoutOrg = agentCases.filter(c => !c.reviewerOrganizationId);
    if (casesWithoutOrg.length > 0) {
      console.log(`\n⚠️  ${casesWithoutOrg.length} case(s) missing reviewerOrganizationId`);
      console.log(`   These won't show in your organization dashboard`);
      console.log(`\n   To fix: Run backfill script with organization ID`);
    }
  }

  console.log("\n" + "=".repeat(60));
}

main().catch(err => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});

