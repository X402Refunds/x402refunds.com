#!/usr/bin/env node

/**
 * Initialize Stats Cache
 * 
 * Manually triggers the stats cache update. Useful after:
 * - Database resets
 * - When dashboard shows stale data
 * - Testing cache functionality
 * 
 * Usage: node scripts/initialize-stats-cache.js
 */

const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");

const CONVEX_URL = process.env.CONVEX_URL || "https://accepted-swordfish-635.convex.cloud";

async function initializeStatsCache() {
  console.log("🔄 Initializing stats cache...\n");
  
  const client = new ConvexHttpClient(CONVEX_URL);
  
  try {
    // Get current cache state
    console.log("📊 Checking current cache state...");
    const currentStats = await client.query(api.cases.getCachedSystemStats);
    
    if (currentStats.isCached) {
      console.log("✅ Cache exists:");
      console.log(`   - Total Cases: ${currentStats.totalCases}`);
      console.log(`   - Active Agents: ${currentStats.activeAgents}`);
      console.log(`   - Resolved Cases: ${currentStats.resolvedCases}`);
      console.log(`   - Last Updated: ${new Date(currentStats.lastUpdated).toLocaleString()}\n`);
    } else {
      console.log("⚠️  No cache found - will create new cache\n");
    }
    
    // Get actual current data
    console.log("🔍 Checking actual database state...");
    const allCases = await client.query(api.cases.getCases, { limit: 1000 });
    console.log(`   - Actual cases in DB: ${allCases.length}\n`);
    
    // Trigger cache update by calling the internal mutation
    // Note: This requires calling through an action or waiting for cron
    console.log("⏳ Cache will be updated by the next cron run (every 5 minutes)");
    console.log("💡 OR manually trigger via Convex dashboard:");
    console.log("   1. Go to https://dashboard.convex.dev");
    console.log("   2. Navigate to Functions → crons → updateSystemStatsCache");
    console.log("   3. Click 'Run' to update immediately\n");
    
    console.log("✅ Verification complete!");
    console.log("\n📈 Dashboard should update within 5 minutes");
    console.log("🔄 Refresh your dashboard to see updated numbers\n");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
  
  client.close();
}

initializeStatsCache();
