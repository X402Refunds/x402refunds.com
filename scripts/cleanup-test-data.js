#!/usr/bin/env node
/**
 * Core Test Data Cleanup Utility
 * Identifies and removes test data from Convex database
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

/**
 * Identify test agents by pattern matching
 */
export function isTestAgent(agent) {
  // Pattern 1: Wallet addresses starting with test patterns
  if (agent.walletAddress?.startsWith('0x00000000')) return true;
  if (agent.walletAddress?.startsWith('0x98765432')) return true;
  
  // Pattern 2: DIDs containing test markers
  if (agent.did?.toLowerCase().includes('test')) return true;
  if (agent.did?.includes('0x00000000')) return true;
  
  // Pattern 3: Names containing test markers
  if (agent.name?.toLowerCase().includes('test')) return true;
  if (agent.name?.toLowerCase().includes('mock')) return true;
  if (agent.name?.startsWith('Agent 0x00000000')) return true;
  
  // Pattern 4: Mock flag
  if (agent.mock === true) return true;
  
  return false;
}

/**
 * Identify test cases by pattern matching
 */
export function isTestCase(case_) {
  // Pattern 1: Test addresses in plaintiff/defendant
  if (case_.plaintiff?.includes('test')) return true;
  if (case_.defendant?.includes('test')) return true;
  if (case_.defendant?.startsWith('0x00000000')) return true;
  if (case_.defendant?.startsWith('0x98765432')) return true;
  
  // Pattern 2: Test markers in description
  if (case_.description?.toLowerCase().includes('test')) return true;
  
  // Pattern 3: Test jurisdiction tags
  if (case_.jurisdictionTags?.includes('TEST')) return true;
  
  return false;
}

/**
 * Main cleanup function
 */
export async function cleanupTestData(convexUrl, options = {}) {
  const { dryRun = false, verbose = true } = options;
  
  const client = new ConvexHttpClient(convexUrl);
  
  if (verbose) {
    console.log(`\n🧹 Cleaning test data from: ${convexUrl}`);
    console.log(`   Mode: ${dryRun ? 'DRY RUN (preview only)' : 'LIVE CLEANUP'}\n`);
  }
  
  // Step 1: Identify test agents
  const allAgents = await client.query(api.agents.listAgents, { limit: 10000 });
  const testAgents = allAgents.filter(isTestAgent);
  
  if (verbose) {
    console.log(`📊 Agents Analysis:`);
    console.log(`   Total: ${allAgents.length}`);
    console.log(`   Test: ${testAgents.length}`);
    console.log(`   Real: ${allAgents.length - testAgents.length}`);
  }
  
  // Step 2: Identify test cases
  const allCases = await client.query(api.cases.getRecentCases, { limit: 10000 });
  const testCases = allCases.filter(isTestCase);
  
  if (verbose) {
    console.log(`\n📊 Cases Analysis:`);
    console.log(`   Total: ${allCases.length}`);
    console.log(`   Test: ${testCases.length}`);
    console.log(`   Real: ${allCases.length - testCases.length}`);
  }
  
  if (testAgents.length === 0 && testCases.length === 0) {
    if (verbose) console.log(`\n✅ No test data found - environment is clean!`);
    return { deleted: 0, skipped: 0 };
  }
  
  if (dryRun) {
    if (verbose) {
      console.log(`\n🔍 DRY RUN - Would delete:`);
      console.log(`   ${testAgents.length} test agents`);
      console.log(`   ${testCases.length} test cases`);
      
      if (testAgents.length > 0) {
        console.log(`\n   Sample test agents (first 5):`);
        testAgents.slice(0, 5).forEach((a, i) => {
          console.log(`     ${i + 1}. ${a.did} (${a.name || 'unnamed'})`);
        });
      }
      
      if (testCases.length > 0) {
        console.log(`\n   Sample test cases (first 5):`);
        testCases.slice(0, 5).forEach((c, i) => {
          console.log(`     ${i + 1}. ${c._id} - ${c.plaintiff} vs ${c.defendant}`);
        });
      }
    }
    return { deleted: 0, skipped: testAgents.length + testCases.length };
  }
  
  // Step 3 & 4: Delete via internal Convex function
  if (verbose && (testAgents.length > 0 || testCases.length > 0)) {
    console.log(`\n🗑️  Deleting ${testAgents.length} test agents and ${testCases.length} test cases...`);
  }
  
  try {
    // Use internal mutation for cleanup (bypasses auth checks)
    const { internal } = await import('../convex/_generated/api.js');
    const result = await client.mutation(api.testing.runTestCleanup, {
      dryRun: false
    });
    
    if (verbose) {
      console.log(`\n✅ Cleanup complete!`);
      console.log(`   Items deleted: ${result.deleted || 0}`);
      console.log(`   Errors: ${result.errors || 0}`);
    }
    
    return result;
  } catch (error) {
    if (verbose) {
      console.error(`\n❌ Cleanup failed: ${error.message}`);
    }
    return {
      deleted: 0,
      failed: testAgents.length + testCases.length,
      error: error.message
    };
  }
}

