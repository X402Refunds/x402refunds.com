#!/usr/bin/env node

/**
 * Delete disputes with absurdly large amounts
 * These are test disputes that are inflating the "In Disputes Now" metric
 */
import { ConvexHttpClient } from "convex/browser";

// Use production API by default, or override with CONVEX_URL env var
const CONVEX_URL = process.env.CONVEX_URL || "https://api.x402refunds.com";

const client = new ConvexHttpClient(CONVEX_URL);

// Consider amounts > $1 million USD or > 1000 ETH as invalid test data
const MAX_REASONABLE_AMOUNT_USD = 1_000_000;
const MAX_REASONABLE_AMOUNT_ETH = 1000;

async function deleteInvalidDisputes() {
  console.log("🔍 Deleting disputes with invalid amounts...\n");
  console.log(`   API: ${CONVEX_URL}`);
  console.log(`   Max reasonable amounts:`);
  console.log(`   - USD: $${MAX_REASONABLE_AMOUNT_USD.toLocaleString()}`);
  console.log(`   - ETH: ${MAX_REASONABLE_AMOUNT_ETH.toLocaleString()}\n`);

  try {
    // Call the cleanup mutation
    const result = await client.mutation("cleanup:deleteLargeAmountCases", {
      maxAmountUSD: MAX_REASONABLE_AMOUNT_USD,
      maxAmountETH: MAX_REASONABLE_AMOUNT_ETH,
    });

    if (result.deleted === 0) {
      console.log("✅ No invalid disputes found!");
      return;
    }

    console.log(`\n🚨 Found and deleted ${result.deleted} disputes with invalid amounts:\n`);
    
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

deleteInvalidDisputes();
