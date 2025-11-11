#!/usr/bin/env node
/**
 * Analyze Convex database and identify junk data
 * Also provides cleanup operations
 */

import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || "https://youthful-orca-358.convex.cloud";

const client = new ConvexHttpClient(CONVEX_URL);

async function analyzeDatabase() {
  console.log("📊 Analyzing Convex database...\n");
  
  try {
    const analysis = await client.query("cleanup:analyzeDatabase", {});
    
    console.log("=".repeat(80));
    console.log("DATABASE ANALYSIS");
    console.log("=".repeat(80));
    console.log();
    
    for (const [tableName, data] of Object.entries(analysis)) {
      if (data.error) {
        console.log(`❌ ${tableName}: ERROR - ${data.error}`);
        continue;
      }
      
      console.log(`📋 ${tableName}: ${data.count} records`);
      
      if (data.byStatus) {
        console.log(`   Status breakdown:`);
        for (const [status, count] of Object.entries(data.byStatus)) {
          console.log(`     - ${status}: ${count}`);
        }
      }
      
      if (data.byType) {
        console.log(`   Type breakdown:`);
        for (const [type, count] of Object.entries(data.byType)) {
          console.log(`     - ${type}: ${count}`);
        }
      }
      
      if (data.mockCount !== undefined) {
        console.log(`   Mock/test data: ${data.mockCount}`);
      }
      
      if (data.unclaimedCount !== undefined) {
        console.log(`   Unclaimed: ${data.unclaimedCount}`);
      }
      
      if (data.archivedCount !== undefined) {
        console.log(`   Archived: ${data.archivedCount}`);
      }
      
      if (data.redactedCount !== undefined) {
        console.log(`   Redacted: ${data.redactedCount}`);
      }
      
      if (data.agents) {
        console.log(`   Agents list:`);
        for (const agent of data.agents.slice(0, 10)) {
          console.log(`     - ${agent.did} (${agent.name || 'unnamed'}) [${agent.status}] ${agent.mock ? '(mock)' : ''}`);
        }
        if (data.agents.length > 10) {
          console.log(`     ... and ${data.agents.length - 10} more`);
        }
      }
      
      console.log();
    }
    
    console.log("=".repeat(80));
    console.log("RECOMMENDATIONS");
    console.log("=".repeat(80));
    console.log();
    
    // Recommendations
    if (analysis.agents?.mockCount > 0) {
      console.log("⚠️  Found mock agents - consider running: cleanup:deleteMockData");
    }
    
    if (analysis.cases?.mockCount > 0) {
      console.log("⚠️  Found mock cases - consider running: cleanup:deleteMockData");
    }
    
    if (analysis.agents?.unclaimedCount > 0) {
      console.log(`⚠️  Found ${analysis.agents.unclaimedCount} unclaimed agents`);
    }
    
    if (analysis.evidenceManifests?.archivedCount > 0) {
      console.log(`⚠️  Found ${analysis.evidenceManifests.archivedCount} archived evidence records`);
    }
    
    console.log();
    console.log("💡 To delete all agents except one:");
    console.log("   1. Find the agent ID you want to keep from the analysis above");
    console.log("   2. Run: node scripts/cleanup-database.js --keep-agent <agent-id>");
    console.log();
    console.log("💡 To delete all mock/test data:");
    console.log("   Run: node scripts/cleanup-database.js --delete-mock");
    console.log();
    console.log("💡 To clean up orphaned records:");
    console.log("   Run: node scripts/cleanup-database.js --cleanup-orphaned");
    console.log();
    
    return analysis;
    
  } catch (error) {
    console.error("❌ Error analyzing database:", error.message);
    throw error;
  }
}

async function deleteAllAgentsExceptOne(agentId) {
  console.log(`🗑️  Deleting all agents except: ${agentId}\n`);
  
  try {
    const result = await client.mutation("cleanup:deleteAllAgentsExceptOne", {
      keepAgentId: agentId,
    });
    
    console.log("=".repeat(80));
    console.log("CLEANUP COMPLETE");
    console.log("=".repeat(80));
    console.log();
    console.log(`✅ Deleted ${result.deletedAgents} agents`);
    console.log(`✅ Kept agent: ${result.keptAgent.did} (${result.keptAgent.name || 'unnamed'})`);
    console.log(`✅ Deleted ${result.deletedRelatedRecords} related records`);
    console.log();
    console.log(result.message);
    
  } catch (error) {
    console.error("❌ Error deleting agents:", error.message);
    throw error;
  }
}

async function deleteMockData() {
  console.log("🗑️  Deleting all mock/test data...\n");
  
  try {
    const result = await client.mutation("cleanup:deleteMockData", {});
    
    console.log("=".repeat(80));
    console.log("MOCK DATA CLEANUP COMPLETE");
    console.log("=".repeat(80));
    console.log();
    console.log(`✅ ${result.message}`);
    
  } catch (error) {
    console.error("❌ Error deleting mock data:", error.message);
    throw error;
  }
}

async function cleanupOrphanedRecords() {
  console.log("🧹 Cleaning up orphaned records...\n");
  
  try {
    const result = await client.mutation("cleanup:cleanupOrphanedRecords", {});
    
    console.log("=".repeat(80));
    console.log("ORPHANED RECORDS CLEANUP COMPLETE");
    console.log("=".repeat(80));
    console.log();
    console.log(`✅ ${result.message}`);
    
  } catch (error) {
    console.error("❌ Error cleaning up orphaned records:", error.message);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage: node scripts/analyze-and-cleanup.js [options]

Options:
  --analyze              Analyze database and show statistics (default)
  --keep-agent <id>      Delete all agents except the specified agent ID
  --delete-mock          Delete all mock/test data
  --cleanup-orphaned     Clean up orphaned records (evidence without cases, etc.)
  --help, -h             Show this help message

Examples:
  node scripts/analyze-and-cleanup.js
  node scripts/analyze-and-cleanup.js --keep-agent j1234567890abcdef
  node scripts/analyze-and-cleanup.js --delete-mock
  node scripts/analyze-and-cleanup.js --cleanup-orphaned
`);
    process.exit(0);
  }
  
  try {
    if (args.includes("--keep-agent")) {
      const index = args.indexOf("--keep-agent");
      const agentId = args[index + 1];
      if (!agentId) {
        console.error("❌ Error: --keep-agent requires an agent ID");
        process.exit(1);
      }
      await deleteAllAgentsExceptOne(agentId);
    } else if (args.includes("--delete-mock")) {
      await deleteMockData();
    } else if (args.includes("--cleanup-orphaned")) {
      await cleanupOrphanedRecords();
    } else {
      // Default: analyze
      await analyzeDatabase();
    }
  } catch (error) {
    console.error("\n❌ Operation failed:", error.message);
    process.exit(1);
  }
}

main().catch(console.error);

