#!/usr/bin/env node
/**
 * Clear all old agent/enterprise disputes from the database
 * This removes all the old SLA disputes so we can start fresh with payment disputes
 */

import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.CONVEX_URL || "https://youthful-orca-358.convex.cloud";

async function clearOldData() {
  console.log("🗑️  Clearing old agent/enterprise dispute data...\n");
  console.log(`📡 Connecting to: ${CONVEX_URL}\n`);

  const client = new ConvexClient(CONVEX_URL);

  try {
    // Get all cases
    const cases = await client.query(api.cases.getRecentCases, { limit: 1000 });
    console.log(`Found ${cases.length} cases to delete\n`);

    // Get all rulings
    const rulings = await client.query(api.cases.getRulings, { limit: 1000 });
    console.log(`Found ${rulings.length} rulings to delete\n`);

    console.log("⚠️  This will delete ALL existing cases and rulings.");
    console.log("Payment disputes in the paymentDisputes table will be preserved.\n");

    console.log("Proceeding with deletion in 3 seconds...\n");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Note: We need to create delete mutations in convex/cases.ts
    console.log("❌ Delete mutations not implemented yet.");
    console.log("Please manually delete data from Convex dashboard:");
    console.log(`   ${CONVEX_URL.replace('convex.cloud', 'convex.dev/d/' + CONVEX_URL.split('/')[2].split('.')[0])}`);
    console.log("\nTables to clear:");
    console.log("   - cases");
    console.log("   - rulings");
    console.log("   - evidenceManifests");
    console.log("   - events (optional)");
    console.log("\nLeave these tables:");
    console.log("   - paymentDisputes ✅");
    console.log("   - organizations ✅");
    console.log("   - users ✅");
    console.log("   - apiKeys ✅");

    client.close();

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

clearOldData().catch(console.error);
