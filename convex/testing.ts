/**
 * Testing utilities for cleanup and test data management
 * DO NOT EXPORT AS PUBLIC - internal/admin use only
 */

import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Identify test agents by pattern matching
 */
function isTestAgent(agent: any): boolean {
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
  
  // Pattern 5: Test marker field
  if (agent.isTestData === true) return true;
  
  return false;
}

/**
 * Identify test cases by pattern matching
 */
function isTestCase(case_: any): boolean {
  // Pattern 1: Test addresses in plaintiff/defendant
  if (case_.plaintiff?.includes('test')) return true;
  if (case_.defendant?.includes('test')) return true;
  if (case_.defendant?.startsWith('0x00000000')) return true;
  if (case_.defendant?.startsWith('0x98765432')) return true;
  
  // Pattern 2: Test markers in description
  if (case_.description?.toLowerCase().includes('test')) return true;
  
  // Pattern 3: Test jurisdiction tags
  if (case_.jurisdictionTags?.includes('TEST')) return true;
  
  // Pattern 4: Test marker field
  if (case_.isTestData === true) return true;
  
  return false;
}

/**
 * Delete test data from the database
 * WARNING: This bypasses all authorization checks - use with caution!
 */
export const cleanupTestData = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
    testRunId: v.optional(v.number()), // Delete only data from specific test run
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? false;
    
    console.log(`🧹 Test data cleanup ${dryRun ? '(DRY RUN)' : '(LIVE)'}`);
    
    // Step 1: Find test agents
    const allAgents = await ctx.db.query("agents").collect();
    let testAgents = allAgents.filter(isTestAgent);
    
    // Filter by testRunId if provided
    if (args.testRunId) {
      testAgents = testAgents.filter(a => a.testRunId === args.testRunId);
    }
    
    console.log(`Found ${testAgents.length} test agents (of ${allAgents.length} total)`);
    
    // Step 2: Find test cases
    const allCases = await ctx.db.query("cases").collect();
    let testCases = allCases.filter(isTestCase);
    
    // Filter by testRunId if provided
    if (args.testRunId) {
      testCases = testCases.filter(c => c.testRunId === args.testRunId);
    }
    
    console.log(`Found ${testCases.length} test cases (of ${allCases.length} total)`);
    
    if (testAgents.length === 0 && testCases.length === 0) {
      console.log('✅ No test data found');
      return { deleted: 0, errors: 0 };
    }
    
    if (dryRun) {
      console.log(`Would delete ${testAgents.length} agents and ${testCases.length} cases`);
      return { deleted: 0, errors: 0, wouldDelete: testAgents.length + testCases.length };
    }
    
    let deleted = 0;
    let errors = 0;
    
    // Step 3: Delete test agents (hard delete)
    for (const agent of testAgents) {
      try {
        // Delete reputation record first
        const reputation = await ctx.db
          .query("agentReputation")
          .withIndex("by_agent", (q) => q.eq("agentDid", agent.did))
          .first();
        
        if (reputation) {
          await ctx.db.delete(reputation._id);
        }
        
        // Delete agent
        await ctx.db.delete(agent._id);
        deleted++;
        
        if (deleted % 50 === 0) {
          console.log(`   Deleted ${deleted}/${testAgents.length} agents...`);
        }
      } catch (error: any) {
        console.error(`Failed to delete agent ${agent.did}: ${error.message}`);
        errors++;
      }
    }
    
    // Step 4: Delete test cases
    for (const case_ of testCases) {
      try {
        // Just delete the case (no paymentDisputes table in schema)
        await ctx.db.delete(case_._id);
        deleted++;
      } catch (error: any) {
        console.error(`Failed to delete case ${case_._id}: ${error.message}`);
        errors++;
      }
    }
    
    console.log(`✅ Cleanup complete: ${deleted} items deleted, ${errors} errors`);
    
    return {
      deleted,
      errors,
      agentsDeleted: testAgents.length - errors,
      casesDeleted: testCases.length,
    };
  },
});

/**
 * Public mutation wrapper (for calling from scripts)
 * Requires admin auth in production
 */
/**
 * Delete test agents in batches (collect all, delete in batches)
 */
export const deleteTestAgentsBatch = mutation({
  args: {
    maxDeletes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const maxDeletes = args.maxDeletes ?? 50; // Delete max 50 per call to stay under limits
    
    // Collect ALL agents (read them all at once)
    const allAgents = await ctx.db.query("agents").collect();
    
    // Filter for test agents
    const testAgents = allAgents.filter(agent => {
      if (agent.walletAddress?.startsWith('0x00000000')) return true;
      if (agent.walletAddress?.startsWith('0x98765432')) return true;
      if (agent.did?.toLowerCase().includes('test')) return true;
      if (agent.did?.includes('0x00000000')) return true;
      if (agent.name?.toLowerCase().includes('test')) return true;
      if (agent.name?.toLowerCase().includes('mock')) return true;
      if (agent.name?.startsWith('Agent 0x00000000')) return true;
      if (agent.mock === true) return true;
      if (agent.isTestData === true) return true;
      return false;
    });
    
    console.log(`Found ${testAgents.length} test agents to delete (of ${allAgents.length} total)`);
    
    let deleted = 0;
    let errors = 0;
    
    // Delete first N test agents only
    const toDelete = testAgents.slice(0, maxDeletes);
    
    for (const agent of toDelete) {
      try {
        // Delete reputation record first (ignore errors)
        try {
          const reputation = await ctx.db
            .query("agentReputation")
            .withIndex("by_agent", (q) => q.eq("agentDid", agent.did))
            .first();
          
          if (reputation) {
            await ctx.db.delete(reputation._id);
          }
        } catch (e) {
          // Ignore
        }
        
        // Delete agent
        await ctx.db.delete(agent._id);
        deleted++;
      } catch (error: any) {
        errors++;
      }
    }
    
    return { deleted, errors, hasMore: testAgents.length > maxDeletes, totalTestAgents: testAgents.length };
  },
});

/**
 * Delete test cases in batches (collect all, delete in batches)
 */
export const deleteTestCasesBatch = mutation({
  args: {
    maxDeletes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const maxDeletes = args.maxDeletes ?? 50;
    
    // Collect ALL cases
    const allCases = await ctx.db.query("cases").collect();
    
    // Filter for test cases
    const testCases = allCases.filter(case_ => {
      if (case_.plaintiff?.includes('test')) return true;
      if (case_.defendant?.includes('test')) return true;
      if (case_.defendant?.startsWith('0x00000000')) return true;
      if (case_.defendant?.startsWith('0x98765432')) return true;
      if (case_.description?.toLowerCase().includes('test')) return true;
      if (case_.jurisdictionTags?.includes('TEST')) return true;
      if (case_.isTestData === true) return true;
      return false;
    });
    
    console.log(`Found ${testCases.length} test cases to delete (of ${allCases.length} total)`);
    
    let deleted = 0;
    let errors = 0;
    
    // Delete first N test cases only
    const toDelete = testCases.slice(0, maxDeletes);
    
    for (const case_ of toDelete) {
      try {
        await ctx.db.delete(case_._id);
        deleted++;
      } catch (error: any) {
        errors++;
      }
    }
    
    return { deleted, errors, hasMore: testCases.length > maxDeletes, totalTestCases: testCases.length };
  },
});

/**
 * Main cleanup - runs both agent and case cleanup
 */
export const runTestCleanup = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.dryRun) {
      // Count test data
      const agents = await ctx.db.query("agents").take(500);
      const testAgents = agents.filter(a => 
        a.walletAddress?.startsWith('0x00000000') ||
        a.walletAddress?.startsWith('0x98765432') ||
        a.did?.toLowerCase().includes('test') ||
        a.name?.toLowerCase().includes('test') ||
        a.mock === true
      );
      
      const cases = await ctx.db.query("cases").take(500);
      const testCases = cases.filter(c =>
        c.defendant?.startsWith('0x00000000') ||
        c.defendant?.startsWith('0x98765432') ||
        c.defendant?.includes('test')
      );
      
      return { wouldDelete: testAgents.length + testCases.length };
    }
    
    // Run both cleanups directly (can't use ctx.internal in mutation)
    // Use deleteTestAgentsBatch and deleteTestCasesBatch separately from scripts
    return { deleted: 0, errors: 0, message: "Use deleteTestAgentsBatch and deleteTestCasesBatch directly" };
  },
});

/**
 * Delete specific cases by ID
 * Used for manual cleanup of specific test disputes
 */
export const deleteSpecificCases = internalMutation({
  args: {
    caseIds: v.array(v.id("cases"))
  },
  handler: async (ctx, args) => {
    let deleted = 0;
    let failed = 0;
    
    for (const caseId of args.caseIds) {
      try {
        await ctx.db.delete(caseId);
        deleted++;
      } catch (error) {
        console.error(`Failed to delete case ${caseId}:`, error);
        failed++;
      }
    }
    
    return { deleted, failed };
  }
});

