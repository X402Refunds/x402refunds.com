#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.CONVEX_URL || "https://perceptive-lyrebird-89.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

async function deleteRemainingETH() {
  console.log(`🔍 Deleting remaining ETH disputes...\n`);
  
  try {
    // Delete with lower threshold (anything over 10 ETH)
    const result = await client.mutation("cleanup:deleteLargeAmountCases", {
      maxAmountUSD: 1_000_000,
      maxAmountETH: 10, // Lower threshold to catch the 250 ETH case
    });

    if (result.deleted === 0) {
      console.log("✅ No more invalid disputes found!");
      return;
    }

    console.log(`\n🚨 Found and deleted ${result.deleted} more disputes:\n`);
    
    result.deletedCases.forEach((c) => {
      console.log(`- Case ${c.id}`);
      console.log(`  Amount: $${c.amount.toLocaleString()} ${c.currency}`);
      console.log();
    });

    console.log(`\n✅ ${result.message}`);

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

deleteRemainingETH();
