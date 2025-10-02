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

// AI Vendors - Verified Companies Only (DIDs auto-generated)
const AI_VENDORS = [
  // Cloud & Infrastructure Providers  
  { ownerDid: "did:enterprise:amazon", name: "AWS Lambda API", organizationName: "Amazon Web Services", functionalType: "api" },
  { ownerDid: "did:enterprise:microsoft", name: "Azure AI Services", organizationName: "Microsoft", functionalType: "api" },
  { ownerDid: "did:enterprise:google", name: "Google Cloud API", organizationName: "Google", functionalType: "api" },
  // AI Model Providers
  { ownerDid: "did:enterprise:openai", name: "OpenAI GPT-4 API", organizationName: "OpenAI", functionalType: "api" },
  { ownerDid: "did:enterprise:anthropic", name: "Anthropic Claude API", organizationName: "Anthropic", functionalType: "api" },
  { ownerDid: "did:enterprise:cohere", name: "Cohere Embeddings API", organizationName: "Cohere", functionalType: "api" },
  { ownerDid: "did:enterprise:huggingface", name: "HuggingFace Inference API", organizationName: "Hugging Face", functionalType: "api" },
  // Specialized AI Services
  { ownerDid: "did:enterprise:databricks", name: "Databricks ML API", organizationName: "Databricks", functionalType: "data" },
  { ownerDid: "did:enterprise:snowflake", name: "Snowflake Data API", organizationName: "Snowflake", functionalType: "data" },
  { ownerDid: "did:enterprise:mongodb", name: "MongoDB Atlas API", organizationName: "MongoDB", functionalType: "data" },
  // Payment & Financial
  { ownerDid: "did:enterprise:stripe", name: "Stripe Payment API", organizationName: "Stripe", functionalType: "financial" },
  { ownerDid: "did:enterprise:plaid", name: "Plaid Banking API", organizationName: "Plaid", functionalType: "financial" },
  // Communication & Collaboration
  { ownerDid: "did:enterprise:twilio", name: "Twilio Messaging API", organizationName: "Twilio", functionalType: "chat" },
  { ownerDid: "did:enterprise:sendgrid", name: "SendGrid Email API", organizationName: "SendGrid", functionalType: "chat" },
  // Maps & Location
  { ownerDid: "did:enterprise:google-maps", name: "Google Maps API", organizationName: "Google Maps", functionalType: "api" },
  { ownerDid: "did:enterprise:mapbox", name: "Mapbox Routing API", organizationName: "Mapbox", functionalType: "api" },
  // Security & Auth
  { ownerDid: "did:enterprise:auth0", name: "Auth0 Identity API", organizationName: "Auth0", functionalType: "security" },
  { ownerDid: "did:enterprise:cloudflare", name: "Cloudflare CDN API", organizationName: "Cloudflare", functionalType: "security" }
];

const AI_CONSUMERS = [
  // Media & Entertainment
  { ownerDid: "did:enterprise:netflix", name: "Netflix Recommendation Engine", organizationName: "Netflix", functionalType: "video" },
  { ownerDid: "did:enterprise:spotify", name: "Spotify Discovery AI", organizationName: "Spotify", functionalType: "music" },
  { ownerDid: "did:enterprise:youtube", name: "YouTube Content Moderation", organizationName: "YouTube", functionalType: "video" },
  // Social & Communication
  { ownerDid: "did:enterprise:discord", name: "Discord Moderation AI", organizationName: "Discord", functionalType: "social" },
  { ownerDid: "did:enterprise:slack", name: "Slack Search AI", organizationName: "Slack", functionalType: "project" },
  { ownerDid: "did:enterprise:twitter", name: "Twitter Recommendation Engine", organizationName: "Twitter", functionalType: "social" },
  // Transportation & Logistics
  { ownerDid: "did:enterprise:uber", name: "Uber Dispatch System", organizationName: "Uber", functionalType: "transportation" },
  { ownerDid: "did:enterprise:doordash", name: "DoorDash Routing AI", organizationName: "DoorDash", functionalType: "transportation" },
  { ownerDid: "did:enterprise:fedex", name: "FedEx Logistics Optimizer", organizationName: "FedEx", functionalType: "transportation" },
  // E-Commerce & Retail
  { ownerDid: "did:enterprise:shopify", name: "Shopify Merchant Analytics", organizationName: "Shopify", functionalType: "sales" },
  { ownerDid: "did:enterprise:amazon-retail", name: "Amazon Product Recommendations", organizationName: "Amazon Retail", functionalType: "sales" },
  { ownerDid: "did:enterprise:instacart", name: "Instacart Inventory Manager", organizationName: "Instacart", functionalType: "sales" },
  // Finance & Fintech
  { ownerDid: "did:enterprise:robinhood", name: "Robinhood Trading Engine", organizationName: "Robinhood", functionalType: "financial" },
  { ownerDid: "did:enterprise:coinbase", name: "Coinbase Fraud Detection", organizationName: "Coinbase", functionalType: "financial" },
  { ownerDid: "did:enterprise:square", name: "Square Payment Processor", organizationName: "Square", functionalType: "financial" },
  // Healthcare & Wellness
  { ownerDid: "did:enterprise:teladoc", name: "Teladoc Diagnosis Assistant", organizationName: "Teladoc", functionalType: "healthcare" },
  { ownerDid: "did:enterprise:peloton", name: "Peloton Personalization AI", organizationName: "Peloton", functionalType: "healthcare" },
  // Travel & Hospitality
  { ownerDid: "did:enterprise:airbnb", name: "Airbnb Pricing Optimizer", organizationName: "Airbnb", functionalType: "sales" },
  { ownerDid: "did:enterprise:booking", name: "Booking Recommendation Engine", organizationName: "Booking.com", functionalType: "sales" },
  // Gaming & Entertainment
  { ownerDid: "did:enterprise:roblox", name: "Roblox Content Safety", organizationName: "Roblox", functionalType: "gaming" },
  { ownerDid: "did:enterprise:unity", name: "Unity Asset Optimizer", organizationName: "Unity", functionalType: "gaming" },
  // SaaS & Productivity
  { ownerDid: "did:enterprise:notion", name: "Notion AI Assistant", organizationName: "Notion", functionalType: "workflow" },
  { ownerDid: "did:enterprise:asana", name: "Asana Task Predictor", organizationName: "Asana", functionalType: "project" },
  { ownerDid: "did:enterprise:figma", name: "Figma Design Assistant", organizationName: "Figma", functionalType: "design" }
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
        ownerDid: agent.ownerDid,
        name: agent.name,
        organizationName: agent.organizationName,
        mock: true, // Mark all script-registered agents as mock data
        functionalType: agent.functionalType || "general",
      };
      
      const result = await client.mutation("agents:joinAgent", agentData);
      registered++;
      console.log(`✅ Registered: ${agent.name} (${agent.organizationName})`);
      console.log(`   DID: ${result.did}`);
      
    } catch (error) {
      if (error.message && error.message.includes("already")) {
        skipped++;
        console.log(`⏭️  Skipped (exists): ${agent.organizationName}`);
      } else {
        errors++;
        console.error(`❌ Error: ${agent.organizationName} - ${error.message}`);
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
