#!/usr/bin/env node

/**
 * Initialize enterprise owners for all agents
 */

import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.CONVEX_URL || "https://perceptive-lyrebird-89.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

const ENTERPRISE_OWNERS = [
  // Cloud & Infrastructure
  { did: "did:enterprise:amazon", name: "Amazon Web Services", email: "legal@amazon.com" },
  { did: "did:enterprise:microsoft", name: "Microsoft Corporation", email: "legal@microsoft.com" },
  { did: "did:enterprise:google", name: "Google LLC", email: "legal@google.com" },
  
  // AI Model Providers
  { did: "did:enterprise:openai", name: "OpenAI", email: "legal@openai.com" },
  { did: "did:enterprise:anthropic", name: "Anthropic PBC", email: "legal@anthropic.com" },
  { did: "did:enterprise:cohere", name: "Cohere Inc", email: "legal@cohere.ai" },
  { did: "did:enterprise:huggingface", name: "Hugging Face Inc", email: "legal@huggingface.co" },
  
  // Specialized Services
  { did: "did:enterprise:databricks", name: "Databricks Inc", email: "legal@databricks.com" },
  { did: "did:enterprise:snowflake", name: "Snowflake Inc", email: "legal@snowflake.com" },
  { did: "did:enterprise:mongodb", name: "MongoDB Inc", email: "legal@mongodb.com" },
  
  // Payments
  { did: "did:enterprise:stripe", name: "Stripe Inc", email: "legal@stripe.com" },
  { did: "did:enterprise:plaid", name: "Plaid Inc", email: "legal@plaid.com" },
  
  // Communication
  { did: "did:enterprise:twilio", name: "Twilio Inc", email: "legal@twilio.com" },
  { did: "did:enterprise:sendgrid", name: "SendGrid Inc", email: "legal@sendgrid.com" },
  
  // Maps & Location
  { did: "did:enterprise:google-maps", name: "Google Maps Platform", email: "legal@google.com" },
  { did: "did:enterprise:mapbox", name: "Mapbox Inc", email: "legal@mapbox.com" },
  
  // Security
  { did: "did:enterprise:auth0", name: "Auth0 Inc", email: "legal@auth0.com" },
  { did: "did:enterprise:cloudflare", name: "Cloudflare Inc", email: "legal@cloudflare.com" },
  
  // Media & Entertainment
  { did: "did:enterprise:netflix", name: "Netflix Inc", email: "legal@netflix.com" },
  { did: "did:enterprise:spotify", name: "Spotify AB", email: "legal@spotify.com" },
  { did: "did:enterprise:youtube", name: "YouTube LLC", email: "legal@youtube.com" },
  
  // Social
  { did: "did:enterprise:discord", name: "Discord Inc", email: "legal@discord.com" },
  { did: "did:enterprise:slack", name: "Slack Technologies", email: "legal@slack.com" },
  { did: "did:enterprise:twitter", name: "Twitter Inc", email: "legal@twitter.com" },
  
  // Transportation
  { did: "did:enterprise:uber", name: "Uber Technologies", email: "legal@uber.com" },
  { did: "did:enterprise:doordash", name: "DoorDash Inc", email: "legal@doordash.com" },
  { did: "did:enterprise:fedex", name: "FedEx Corporation", email: "legal@fedex.com" },
  
  // E-Commerce
  { did: "did:enterprise:shopify", name: "Shopify Inc", email: "legal@shopify.com" },
  { did: "did:enterprise:amazon-retail", name: "Amazon.com Inc", email: "legal@amazon.com" },
  { did: "did:enterprise:instacart", name: "Instacart Inc", email: "legal@instacart.com" },
  
  // Finance
  { did: "did:enterprise:robinhood", name: "Robinhood Markets", email: "legal@robinhood.com" },
  { did: "did:enterprise:coinbase", name: "Coinbase Inc", email: "legal@coinbase.com" },
  { did: "did:enterprise:square", name: "Block Inc", email: "legal@block.xyz" },
  
  // Healthcare
  { did: "did:enterprise:teladoc", name: "Teladoc Health", email: "legal@teladoc.com" },
  { did: "did:enterprise:peloton", name: "Peloton Interactive", email: "legal@onepeloton.com" },
  
  // Travel
  { did: "did:enterprise:airbnb", name: "Airbnb Inc", email: "legal@airbnb.com" },
  { did: "did:enterprise:booking", name: "Booking.com BV", email: "legal@booking.com" },
  
  // Gaming
  { did: "did:enterprise:roblox", name: "Roblox Corporation", email: "legal@roblox.com" },
  { did: "did:enterprise:unity", name: "Unity Technologies", email: "legal@unity.com" },
  
  // SaaS
  { did: "did:enterprise:notion", name: "Notion Labs Inc", email: "legal@notion.so" },
  { did: "did:enterprise:asana", name: "Asana Inc", email: "legal@asana.com" },
  { did: "did:enterprise:figma", name: "Figma Inc", email: "legal@figma.com" },
];

async function initializeOwners() {
  console.log('🏢 Initializing enterprise owners...\n');
  
  let created = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const owner of ENTERPRISE_OWNERS) {
    try {
      const ownerData = {
        did: owner.did,
        name: owner.name,
        email: owner.email,
        verificationTier: "premium",
        pubkeys: []
      };
      await client.mutation("auth:createOwner", ownerData);
      created++;
      console.log(`✅ Created: ${owner.name}`);
    } catch (error) {
      if (error.message && error.message.includes("already exists")) {
        skipped++;
        console.log(`⏭️  Exists: ${owner.name}`);
      } else {
        errors++;
        console.error(`❌ Error: ${owner.name} - ${error.message || error}`);
      }
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("📊 Owner Creation Summary:");
  console.log(`   ✅ Newly created: ${created}`);
  console.log(`   ⏭️  Already existed: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📦 Total owners: ${created + skipped}`);
  console.log("=".repeat(60));
  
  if (created + skipped === ENTERPRISE_OWNERS.length) {
    console.log("\n🎉 SUCCESS! All enterprise owners are registered!");
  } else {
    console.log("\n⚠️  Some owners failed. Check errors above.");
  }
  
  // ConvexHttpClient doesn't have a close method
}

initializeOwners().catch(error => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

