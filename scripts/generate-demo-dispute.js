#!/usr/bin/env node
/**
 * Generate Demo Payment Dispute
 * Creates a realistic payment dispute to showcase the resolution system
 */

import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.CONVEX_URL || "https://perceptive-lyrebird-89.convex.cloud";

async function generateDispute() {
  console.log("💳 Generating demo payment dispute...\n");
  console.log(`📡 Connecting to: ${CONVEX_URL}\n`);

  const client = new ConvexClient(CONVEX_URL);

  try {
    console.log("🎲 Creating payment dispute...");

    // Trigger the payment dispute generation
    const result = await client.mutation(api.crons.triggerDisputeGeneration, {});

    if (result.success) {
      console.log(`\n✅ Payment Dispute Created!`);
      console.log(`   Transaction: ${result.paymentDisputeId}`);
      console.log(`   Amount: $${(result.fee || 0).toFixed(2)}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Micro-dispute: ${result.isMicroDispute ? 'Yes' : 'No'}`);
      console.log(`   Auto-resolve eligible: ${result.autoResolveEligible ? 'Yes' : 'No'}`);
      console.log(`   Fee: $${(result.fee || 0).toFixed(2)} (${result.tier} tier)`);
      console.log("\n🎉 Dispute created successfully!");
      console.log("   View all disputes: https://www.x402disputes.com/dashboard/review-queue\n");
    } else {
      console.log(`\n❌ Failed to generate dispute: ${result.reason || 'Unknown error'}`);
    }

    // Query recent payment disputes
    const recentDisputes = await client.query(api.paymentDisputes.listPaymentDisputes, {
      limit: 10
    });

    console.log(`\n📊 Total payment disputes: ${recentDisputes.length}`);

    if (recentDisputes.length > 0) {
      console.log("\n📋 Recent payment disputes:");
      recentDisputes.slice(0, 5).forEach((d, i) => {
        const verdict = d.aiRecommendation || d.customerFinalDecision || 'PENDING';
        console.log(`   ${i + 1}. $${d.amount.toFixed(2)} - ${d.disputeReason}`);
        console.log(`      Verdict: ${verdict}`);
        console.log(`      Fee: $${(d.disputeFee || 0).toFixed(2)}`);
      });
    }

    client.close();

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

generateDispute().catch(console.error);
