#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.CONVEX_URL || "https://perceptive-lyrebird-89.convex.cloud";

async function main() {
  const caseIds = [
    "jd7eyxspgysxsdydzg43gj08897v5skn",
    "jd78dx8ywxkx2qpgc9qx11jvjx7v5rc1"
  ];
  const orgId = "mx70w8hshm2xrqmw00wk3qhfsh7sfvt9";
  
  const client = new ConvexHttpClient(CONVEX_URL);

  console.log(`🔧 Backfilling ${caseIds.length} cases with organization ID: ${orgId}\n`);

  for (const caseId of caseIds) {
    try {
      console.log(`   Processing case ${caseId}...`);
      await client.mutation(api.cases.backfillReviewerOrgId, {
        caseId,
        reviewerOrganizationId: orgId,
      });
      console.log(`   ✅ Success\n`);
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}\n`);
    }
  }

  console.log("✅ Backfill complete! Refresh your dashboard to see the disputes.");
}

main().catch(err => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});

