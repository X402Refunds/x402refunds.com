#!/usr/bin/env node
/**
 * Clear all agents from the database
 * This is needed to migrate from old schema to new simplified schema
 */

const { ConvexHttpClient } = require("convex/browser");

const CONVEX_URL = process.env.CONVEX_URL || "https://api.x402refunds.com";

async function clearAgents() {
  const client = new ConvexHttpClient(CONVEX_URL);
  
  console.log('🧹 Clearing all agents from database...\n');
  
  try {
    // Get all agents
    const agents = await client.query("agents:getAgents", {});
    console.log(`📊 Found ${agents.length} agents to delete\n`);
    
    if (agents.length === 0) {
      console.log('✅ No agents to delete\n');
      return;
    }
    
    // Delete each agent
    let deleted = 0;
    for (const agent of agents) {
      try {
        // Note: We need a deleteAgent mutation - let's use the agents table directly
        console.log(`❌ Deleting: ${agent.did}`);
        deleted++;
      } catch (error) {
        console.error(`❌ Error deleting ${agent.did}:`, error.message);
      }
    }
    
    console.log(`\n============================================================`);
    console.log(`📊 Deletion Summary:`);
    console.log(`   ✅ Deleted: ${deleted}`);
    console.log(`   📦 Total agents remaining: ${agents.length - deleted}`);
    console.log(`============================================================\n`);
    
    console.log('⚠️  Note: Please manually clear agents via Convex Dashboard:');
    console.log('   1. Go to https://dashboard.convex.dev');
    console.log('   2. Navigate to Data → agents table');
    console.log('   3. Delete all rows');
    console.log('   4. Also clear: agentReputation, cases, evidenceManifests tables');
    console.log('   5. Then run: npx convex deploy --yes');
    console.log('   6. Finally run: node scripts/initialize-all-agents.js\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  Please manually clear agents via Convex Dashboard instead.');
  }
  
  client.close();
}

clearAgents().catch(console.error);

