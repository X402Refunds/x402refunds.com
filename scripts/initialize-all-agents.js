#!/usr/bin/env node

/**
 * Initialize ALL AI vendor and consumer agents from crons.ts
 * This ensures the dispute generation cron jobs can create disputes
 * between any random pair of agents without "agents not found" warnings
 */

import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.CONVEX_URL || "https://perceptive-lyrebird-89.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

// Map functional types from crons.ts to valid schema types
const TYPE_MAP = {
  "cloud": "api", "llm": "api", "ml": "data", "database": "data",
  "communication": "chat", "location": "api",
  "streaming": "video", "collaboration": "project", "rideshare": "transportation",
  "delivery": "transportation", "logistics": "transportation",
  "ecommerce": "sales", "grocery": "sales",
  "finance": "financial", "crypto": "financial", "payments": "financial",
  "fitness": "healthcare",
  "hospitality": "sales", "travel": "sales",
  "gamedev": "gaming",
  "productivity": "workflow", "projectmanagement": "project"
};

// AI Vendors from crons.ts - mapped to valid schema functional types
const AI_VENDORS = [
  // Cloud & Infrastructure Providers  
  { did: "did:agent:aws-lambda-api", ownerDid: "did:enterprise:amazon", functionalType: "api" },
  { did: "did:agent:azure-ai-services", ownerDid: "did:enterprise:microsoft", functionalType: "api" },
  { did: "did:agent:google-cloud-api", ownerDid: "did:enterprise:google", functionalType: "api" },
  // AI Model Providers
  { did: "did:agent:openai-gpt4-api", ownerDid: "did:enterprise:openai", functionalType: "api" },
  { did: "did:agent:anthropic-claude-api", ownerDid: "did:enterprise:anthropic", functionalType: "api" },
  { did: "did:agent:cohere-embeddings-api", ownerDid: "did:enterprise:cohere", functionalType: "api" },
  { did: "did:agent:huggingface-inference-api", ownerDid: "did:enterprise:huggingface", functionalType: "api" },
  // Specialized AI Services
  { did: "did:agent:databricks-ml-api", ownerDid: "did:enterprise:databricks", functionalType: "data" },
  { did: "did:agent:snowflake-data-api", ownerDid: "did:enterprise:snowflake", functionalType: "data" },
  { did: "did:agent:mongodb-atlas-api", ownerDid: "did:enterprise:mongodb", functionalType: "data" },
  // Payment & Financial
  { did: "did:agent:stripe-payment-api", ownerDid: "did:enterprise:stripe", functionalType: "financial" },
  { did: "did:agent:plaid-banking-api", ownerDid: "did:enterprise:plaid", functionalType: "financial" },
  // Communication & Collaboration
  { did: "did:agent:twilio-messaging-api", ownerDid: "did:enterprise:twilio", functionalType: "chat" },
  { did: "did:agent:sendgrid-email-api", ownerDid: "did:enterprise:sendgrid", functionalType: "chat" },
  // Maps & Location
  { did: "did:agent:google-maps-api", ownerDid: "did:enterprise:google", functionalType: "api" },
  { did: "did:agent:mapbox-routing-api", ownerDid: "did:enterprise:mapbox", functionalType: "api" },
  // Security & Auth
  { did: "did:agent:auth0-identity-api", ownerDid: "did:enterprise:auth0", functionalType: "security" },
  { did: "did:agent:cloudflare-cdn-api", ownerDid: "did:enterprise:cloudflare", functionalType: "security" }
];

const AI_CONSUMERS = [
  // Media & Entertainment
  { did: "did:agent:netflix-recommendation-engine", ownerDid: "did:enterprise:netflix", functionalType: "video" },
  { did: "did:agent:spotify-discovery-ai", ownerDid: "did:enterprise:spotify", functionalType: "music" },
  { did: "did:agent:youtube-content-moderation", ownerDid: "did:enterprise:youtube", functionalType: "video" },
  // Social & Communication
  { did: "did:agent:discord-moderation-ai", ownerDid: "did:enterprise:discord", functionalType: "social" },
  { did: "did:agent:slack-search-ai", ownerDid: "did:enterprise:slack", functionalType: "project" },
  { did: "did:agent:twitter-recommendation-engine", ownerDid: "did:enterprise:twitter", functionalType: "social" },
  // Transportation & Logistics
  { did: "did:agent:uber-dispatch-system", ownerDid: "did:enterprise:uber", functionalType: "transportation" },
  { did: "did:agent:doordash-routing-ai", ownerDid: "did:enterprise:doordash", functionalType: "transportation" },
  { did: "did:agent:fedex-logistics-optimizer", ownerDid: "did:enterprise:fedex", functionalType: "transportation" },
  // E-Commerce & Retail
  { did: "did:agent:shopify-merchant-analytics", ownerDid: "did:enterprise:shopify", functionalType: "sales" },
  { did: "did:agent:amazon-product-recommendations", ownerDid: "did:enterprise:amazon", functionalType: "sales" },
  { did: "did:agent:instacart-inventory-manager", ownerDid: "did:enterprise:instacart", functionalType: "sales" },
  // Finance & Fintech
  { did: "did:agent:robinhood-trading-engine", ownerDid: "did:enterprise:robinhood", functionalType: "financial" },
  { did: "did:agent:coinbase-fraud-detection", ownerDid: "did:enterprise:coinbase", functionalType: "financial" },
  { did: "did:agent:square-payment-processor", ownerDid: "did:enterprise:square", functionalType: "financial" },
  // Healthcare & Wellness
  { did: "did:agent:teladoc-diagnosis-assistant", ownerDid: "did:enterprise:teladoc", functionalType: "healthcare" },
  { did: "did:agent:peloton-personalization-ai", ownerDid: "did:enterprise:peloton", functionalType: "healthcare" },
  // Travel & Hospitality
  { did: "did:agent:airbnb-pricing-optimizer", ownerDid: "did:enterprise:airbnb", functionalType: "sales" },
  { did: "did:agent:booking-recommendation-engine", ownerDid: "did:enterprise:booking", functionalType: "sales" },
  // Gaming & Entertainment
  { did: "did:agent:roblox-content-safety", ownerDid: "did:enterprise:roblox", functionalType: "gaming" },
  { did: "did:agent:unity-asset-optimizer", ownerDid: "did:enterprise:unity", functionalType: "gaming" },
  // SaaS & Productivity
  { did: "did:agent:notion-ai-assistant", ownerDid: "did:enterprise:notion", functionalType: "workflow" },
  { did: "did:agent:asana-task-predictor", ownerDid: "did:enterprise:asana", functionalType: "project" },
  { did: "did:agent:figma-design-assistant", ownerDid: "did:enterprise:figma", functionalType: "design" }
];

async function initializeAllAgents() {
  console.log("🚀 Initializing ALL AI agents from crons.ts...\n");
  
  const allAgents = [...AI_VENDORS, ...AI_CONSUMERS];
  let registered = 0;
  let skipped = 0;
  let errors = 0;
  
  console.log(`📊 Total agents to register: ${allAgents.length}`);
  console.log(`   - Vendors: ${AI_VENDORS.length}`);
  console.log(`   - Consumers: ${AI_CONSUMERS.length}\n`);
  
  for (const agent of allAgents) {
    try {
      const agentData = {
        did: agent.did,
        ownerDid: agent.ownerDid,
        citizenshipTier: "premium",
        functionalType: agent.functionalType || "general",
        stake: 50000,
        specialization: {
          capabilities: ["api_integration", "data_processing"],
          certifications: agent.functionalType === "financial" ? ["TRADING"] : 
                         agent.functionalType === "healthcare" ? ["HIPAA"] : [],
          specializations: [agent.functionalType],
          experienceLevel: "enterprise"
        }
      };
      
      await client.mutation("agents:joinAgent", agentData);
      registered++;
      console.log(`✅ Registered: ${agent.did.split(':')[2]}`);
      
    } catch (error) {
      if (error.message && error.message.includes("already")) {
        skipped++;
        console.log(`⏭️  Skipped (exists): ${agent.did.split(':')[2]}`);
      } else {
        errors++;
        console.error(`❌ Error: ${agent.did.split(':')[2]} - ${error.message}`);
      }
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("📊 Registration Summary:");
  console.log(`   ✅ Newly registered: ${registered}`);
  console.log(`   ⏭️  Already existed: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📦 Total agents: ${registered + skipped}`);
  console.log("=".repeat(60));
  
  if (registered + skipped === allAgents.length) {
    console.log("\n🎉 SUCCESS! All agents are now registered!");
    console.log("🎯 Dispute generation cron will work without 'agents not found' warnings!");
  } else {
    console.log("\n⚠️  Some agents failed to register. Check errors above.");
  }
}

initializeAllAgents().catch(error => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
