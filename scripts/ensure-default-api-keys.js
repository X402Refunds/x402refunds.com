#!/usr/bin/env node

/**
 * Migration Script: Ensure Default API Keys for All Organizations
 * 
 * This script ensures that all existing organizations have Production and Development
 * API keys. It's idempotent - safe to run multiple times.
 * 
 * Usage:
 *   node scripts/ensure-default-api-keys.js
 */

const { ConvexHttpClient } = require("convex/browser");

const CONVEX_URL = process.env.CONVEX_URL || "https://youthful-orca-358.convex.site";

async function main() {
  console.log("🔑 Starting API Keys Migration...\n");
  console.log(`📡 Connecting to: ${CONVEX_URL}\n`);

  const client = new ConvexHttpClient(CONVEX_URL);

  try {
    // Get all organizations
    console.log("📋 Fetching all organizations...");
    const organizations = await client.query({ functionName: "users:getOrganizations" });
    
    if (!organizations || organizations.length === 0) {
      console.log("⚠️  No organizations found. Nothing to migrate.");
      return;
    }

    console.log(`✅ Found ${organizations.length} organization(s)\n`);

    let totalProcessed = 0;
    let totalKeysCreated = 0;
    let errors = 0;

    // Process each organization
    for (const org of organizations) {
      try {
        console.log(`🏢 Processing: ${org.name} (${org._id})`);
        
        // Get first user of this org (for createdBy field)
        const orgUsers = await client.query({ 
          functionName: "users:listOrganizationUsers",
          args: { organizationId: org._id }
        });
        const firstUser = orgUsers && orgUsers.length > 0 ? orgUsers[0]._id : undefined;

        // Ensure default API keys
        const result = await client.mutation({ 
          functionName: "apiKeys:ensureDefaultApiKeys",
          args: {
            organizationId: org._id,
            createdByUserId: firstUser,
          }
        });

        if (result.keysCreated && result.keysCreated.length > 0) {
          console.log(`   ✨ Created: ${result.keysCreated.join(", ")}`);
          totalKeysCreated += result.keysCreated.length;
        } else {
          console.log(`   ✓ Already has default keys`);
        }

        totalProcessed++;
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        errors++;
      }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 Migration Summary:");
    console.log("=".repeat(60));
    console.log(`Organizations processed: ${totalProcessed}/${organizations.length}`);
    console.log(`API keys created: ${totalKeysCreated}`);
    console.log(`Errors: ${errors}`);
    console.log("=".repeat(60));

    if (errors === 0) {
      console.log("\n✅ Migration completed successfully!");
    } else {
      console.log("\n⚠️  Migration completed with errors. Please review above.");
      process.exit(1);
    }

  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

// Helper query to get all organizations (add to convex/users.ts if not exists)
// This assumes you have a query that lists all organizations
// You may need to add this query to your convex functions

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

