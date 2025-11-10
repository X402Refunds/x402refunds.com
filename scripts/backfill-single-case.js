#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.CONVEX_URL || "https://perceptive-lyrebird-89.convex.cloud";

async function main() {
  const caseId = process.argv[2] || "jd785vg68add2czaxvsdafntr97v54bf";
  const orgId = process.argv[3] || "mx70w8hshm2xrqmw00wk3qhfsh7sfvt9";
  
  const client = new ConvexHttpClient(CONVEX_URL);

  console.log(`🔧 Backfilling case ${caseId} with org ${orgId}...\n`);

  try {
    await client.mutation(api.cases.backfillReviewerOrgId, {
      caseId,
      reviewerOrganizationId: orgId,
    });
    console.log(`✅ Success! Case now linked to organization.`);
    console.log(`\n📍 Refresh your dashboard to see the dispute.`);
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
  }
}

main().catch(err => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});

