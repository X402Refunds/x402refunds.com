#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.CONVEX_URL || "https://perceptive-lyrebird-89.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

async function executeZeroDeletion() {
  console.log(`🔍 Executing zero-amount case deletion...\n`);
  console.log(`   API: ${CONVEX_URL}\n`);
  
  try {
    // Call the deletion mutation
    const result = await client.mutation("cleanup:deleteZeroAmountCases", {});

    if (result.deleted === 0) {
      console.log("✅ No zero-amount cases found!");
      return;
    }

    console.log(`\n🚨 Deleted ${result.deleted} zero-amount cases:\n`);
    
    result.deletedCases.forEach((c) => {
      console.log(`- Case ${c.id}`);
      console.log(`  Amount: $${c.amount} ${c.currency}`);
      console.log();
    });

    console.log(`\n✅ ${result.message}`);

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

executeZeroDeletion();
