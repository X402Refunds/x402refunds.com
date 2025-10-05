import { mutation, action, internalMutation, internalAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { v } from "convex/values";

// AI Vendor Configurations (same as script)
export const AI_VENDORS = [
  {
    did: "did:agent:stripe-payment-api",
    ownerDid: "did:enterprise:stripe", 
    functionalType: "financial",
    specialization: {
      capabilities: ["payment-processing", "fraud-detection", "recurring-billing"],
      certifications: ["PCI-DSS", "TRADING", "FINANCIAL_ADVICE"],
      specializations: ["fintech", "e-commerce", "subscription-billing"]
    },
    stake: 100000,
    slaProfile: { availability: 99.95, responseTime: 150, processingVolume: 1000000, fraudAccuracy: 99.2 }
  },
  {
    did: "did:agent:openai-gpt4-api",
    ownerDid: "did:enterprise:openai",
    functionalType: "api", 
    specialization: {
      capabilities: ["text-generation", "embeddings", "chat-completion", "function-calling"],
      certifications: ["AI_SAFETY", "DATA_PRIVACY"],
      specializations: ["language-models", "reasoning", "code-generation"]
    },
    stake: 150000,
    slaProfile: { availability: 99.9, responseTime: 800, processingVolume: 10000000, outputQuality: 95.0 }
  },
  {
    did: "did:agent:anthropic-claude-api",
    ownerDid: "did:enterprise:anthropic", 
    functionalType: "api",
    specialization: {
      capabilities: ["constitutional-ai", "reasoning", "analysis", "safety-filtering"],
      certifications: ["AI_SAFETY", "CONSTITUTIONAL_AI"],
      specializations: ["safe-ai", "reasoning", "analysis"]
    },
    stake: 130000,
    slaProfile: { availability: 99.8, responseTime: 1200, processingVolume: 5000000, safetyScore: 99.8 }
  },
  {
    did: "did:agent:aws-lambda-api",
    ownerDid: "did:enterprise:amazon",
    functionalType: "api",
    specialization: {
      capabilities: ["serverless-compute", "auto-scaling", "event-processing"],
      certifications: ["SOC2", "GDPR", "CLOUD_SECURITY"],
      specializations: ["serverless", "microservices", "event-driven"]
    },
    stake: 200000,
    slaProfile: { availability: 99.99, responseTime: 100, processingVolume: 100000000, scalingSpeed: 5 }
  },
  {
    did: "did:agent:vercel-deployment-api",
    ownerDid: "did:enterprise:vercel",
    functionalType: "devops",
    specialization: {
      capabilities: ["edge-deployment", "cdn-optimization", "serverless-functions"],
      certifications: ["SOC2", "EDGE_COMPUTING"],
      specializations: ["frontend-deployment", "edge-computing", "cdn"]
    },
    stake: 80000,
    slaProfile: { availability: 99.95, responseTime: 50, deploymentTime: 30, globalLatency: 100 }
  },
  {
    did: "did:agent:shopify-store-api",
    ownerDid: "did:enterprise:shopify",
    functionalType: "api",
    specialization: {
      capabilities: ["product-management", "order-processing", "inventory-sync"],
      certifications: ["PCI-DSS", "GDPR"],
      specializations: ["e-commerce", "retail", "inventory-management"]
    },
    stake: 120000,
    slaProfile: { availability: 99.9, responseTime: 300, orderProcessingTime: 2, inventoryAccuracy: 99.5 }
  },
  {
    did: "did:agent:mongodb-atlas-api",
    ownerDid: "did:enterprise:mongodb",
    functionalType: "data",
    specialization: {
      capabilities: ["document-storage", "aggregation-pipelines", "search-indexing"],
      certifications: ["SOC2", "GDPR", "DATA_SECURITY"],
      specializations: ["nosql", "real-time-analytics", "full-text-search"]
    },
    stake: 90000,
    slaProfile: { availability: 99.95, responseTime: 10, writeLatency: 50, queryAccuracy: 99.9 }
  }
];

export const AI_CONSUMERS = [
  {
    did: "did:agent:netflix-recommendation-engine",
    ownerDid: "did:enterprise:netflix",
    functionalType: "api",
    usesServices: ["openai-gpt4-api", "mongodb-atlas-api"],
    businessImpact: { revenuePerHour: 15000000, userBase: 260000000, criticalSLA: "availability" }
  },
  {
    did: "did:agent:uber-dispatch-system",
    ownerDid: "did:enterprise:uber", 
    functionalType: "api",
    usesServices: ["aws-lambda-api", "mongodb-atlas-api"],
    businessImpact: { revenuePerHour: 8500000, userBase: 130000000, criticalSLA: "responseTime" }
  },
  {
    did: "did:agent:discord-moderation-ai",
    ownerDid: "did:enterprise:discord",
    functionalType: "api", 
    usesServices: ["anthropic-claude-api", "vercel-deployment-api"],
    businessImpact: { revenuePerHour: 450000, userBase: 150000000, criticalSLA: "safetyScore" }
  },
  {
    did: "did:agent:etsy-search-personalization",
    ownerDid: "did:enterprise:etsy",
    functionalType: "api",
    usesServices: ["openai-gpt4-api", "shopify-store-api"],
    businessImpact: { revenuePerHour: 2300000, userBase: 90000000, criticalSLA: "outputQuality" }
  }
];

const DISPUTE_SCENARIOS = [
  {
    type: "API_DOWNTIME",
    probability: 0.25,
    description: "Service availability below SLA threshold",
    typicalDamages: { min: 10000, max: 500000 },
    evidenceTypes: ["system_logs", "monitoring_data", "financial_impact"]
  },
  {
    type: "RESPONSE_LATENCY", 
    probability: 0.30,
    description: "API response times exceeding agreed limits",
    typicalDamages: { min: 5000, max: 200000 },
    evidenceTypes: ["performance_metrics", "user_complaints", "business_impact"]
  },
  {
    type: "DATA_ACCURACY",
    probability: 0.25,
    description: "AI model outputs below quality thresholds", 
    typicalDamages: { min: 15000, max: 750000 },
    evidenceTypes: ["accuracy_reports", "model_metrics", "customer_feedback"]
  },
  {
    type: "PROCESSING_VOLUME",
    probability: 0.20,
    description: "Service unable to handle contracted volume",
    typicalDamages: { min: 25000, max: 1000000 },
    evidenceTypes: ["capacity_reports", "queue_metrics", "scaling_logs"]
  }
];

// Generate SHA256 hash
function generateSHA256(): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Pick weighted scenario
function pickWeightedScenario() {
  const random = Math.random();
  let cumulative = 0;
  
  for (const scenario of DISPUTE_SCENARIOS) {
    cumulative += scenario.probability;
    if (random <= cumulative) {
      return scenario;
    }
  }
  
  return DISPUTE_SCENARIOS[0];
}

// Calculate damages
function calculateDamages(consumer: any, scenario: any, breachData: any): number {
  const baseRevenue = consumer.businessImpact.revenuePerHour;
  const impactMultiplier = getImpactMultiplier(scenario.type);
  
  let damageFactor = 0.01; // Base 1% of hourly revenue
  
  if (scenario.type === "API_DOWNTIME") {
    damageFactor = (breachData.downtimeMinutes / 60) * 0.1; // 10% per hour
  } else if (scenario.type === "RESPONSE_LATENCY") {
    damageFactor = Math.min(0.05, (breachData.actualResponseTime / 1000) * 0.001);
  }
  
  const damages = Math.floor(baseRevenue * damageFactor * impactMultiplier);
  
  return Math.min(
    Math.max(damages, scenario.typicalDamages.min),
    scenario.typicalDamages.max
  );
}

function getImpactMultiplier(disputeType: string): number {
  const multipliers: Record<string, number> = {
    "API_DOWNTIME": 2.5,
    "SECURITY_BREACH": 4.0,
    "DATA_ACCURACY": 1.8,
    "RESPONSE_LATENCY": 1.2,
    "PROCESSING_VOLUME": 2.0,
    "BILLING_DISCREPANCY": 0.8
  };
  return multipliers[disputeType] || 1.0;
}

// Generate breach data
function generateBreachData(vendor: any, scenario: any) {
  const sla = vendor.slaProfile;
  
  switch (scenario.type) {
    case "API_DOWNTIME":
      return {
        actualAvailability: sla.availability - (0.1 + Math.random() * 2.0),
        downtimeMinutes: 15 + Math.random() * 180,
        impactedRequests: Math.floor(10000 + Math.random() * 500000)
      };
      
    case "RESPONSE_LATENCY":
      return {
        actualResponseTime: sla.responseTime * (2 + Math.random() * 3),
        slowRequests: Math.floor(1000 + Math.random() * 100000),
        peakLatency: sla.responseTime * (5 + Math.random() * 10)
      };
      
    case "DATA_ACCURACY":
      return {
        actualAccuracy: sla.outputQuality - (2 + Math.random() * 10),
        incorrectPredictions: Math.floor(100 + Math.random() * 10000),
        modelDrift: 0.15 + Math.random() * 0.25
      };
      
    case "PROCESSING_VOLUME":
      return {
        actualVolume: sla.processingVolume * (0.6 + Math.random() * 0.3),
        queueLength: Math.floor(10000 + Math.random() * 100000),
        rejectedRequests: Math.floor(1000 + Math.random() * 50000)
      };
      
    default:
      return { genericImpact: "significant" };
  }
}

// Initialize system owners (run once)
export const initializeOwners = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("🔧 Backend: Creating enterprise owners...");
    
    const ownerDids = Array.from(new Set([...AI_VENDORS, ...AI_CONSUMERS].map(a => a.ownerDid)));
    
    for (const ownerDid of Array.from(ownerDids)) {
      try {
        await ctx.db.insert("owners", {
          did: ownerDid,
          verificationTier: "premium",
          pubkeys: [],
          createdAt: Date.now(),
        });
        console.log(`✅ Created owner: ${ownerDid.split(':')[2]}`);
      } catch (error: any) {
        if (!error.message.includes("already exists")) {
          console.log(`⚠️ Owner error: ${error.message}`);
        }
      }
    }
    
    return { success: true };
  }
});

// Initialize system agents (run once) 
export const initializeAgents = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("🤖 Backend: Registering AI agents...");
    
    let registered = 0;
    
    // Register all AI vendors and consumers
    const allAgents = [...AI_VENDORS, ...AI_CONSUMERS];
    
    for (const agent of allAgents) {
      try {
        const agentData: any = {
          did: agent.did,
          ownerDid: agent.ownerDid,
          citizenshipTier: "premium",
          functionalType: agent.functionalType || "general",
          classification: "ai_agent",
          agentType: "premium",
          tier: "premium",
          status: "active",
          votingRights: { constitutional: true, judicial: true },
          createdAt: Date.now(),
          expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year
          stake: ('stake' in agent && agent.stake) ? agent.stake : 50000
        };

        // Add specialization if it exists
        if ('specialization' in agent && agent.specialization) {
          agentData.specialization = agent.specialization;
        }

        await ctx.db.insert("agents", agentData);
        registered++;
        console.log(`✅ Registered: ${agent.did.split(':')[2]}`);
        
      } catch (error: any) {
        if (!error.message.includes("already exists")) {
          console.log(`⚠️ Agent error: ${error.message}`);
        }
      }
    }
    
    console.log(`✅ Backend: Registered ${registered} agents`);
    return { success: true, registered };
  }
});
