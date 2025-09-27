#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient("https://careful-marlin-500.convex.cloud");

async function testFixedDemo() {
  console.log("🧪 Testing Fixed Enterprise Demo");
  console.log("=" .repeat(50));
  
  try {
    // Use fresh agent IDs
    const timestamp = Date.now();
    const openaiAgent = `test_openai_${timestamp}`;
    const salesforceAgent = `test_salesforce_${timestamp}`;
    
    console.log("🤖 Registering fresh test agents...");
    
    await client.mutation(api.enterpriseAPI.registerAgent, {
      agentId: openaiAgent,
      enterpriseId: "enterprise_openai", 
      agentType: "api_service",
      capabilities: ["gpt-4o"],
      tier: "enterprise"
    });
    
    await client.mutation(api.enterpriseAPI.registerAgent, {
      agentId: salesforceAgent,
      enterpriseId: "enterprise_salesforce",
      agentType: "integration", 
      capabilities: ["crm"],
      tier: "enterprise"
    });
    
    console.log("📋 Creating SLA contract...");
    
    const contract = await client.mutation(api.enterpriseAPI.createSLA, {
      providerAgentId: openaiAgent,
      consumerAgentId: salesforceAgent,
      templateType: "api_response_time_premium", 
      duration: 30,
      budget: 50000,
      customMetrics: [
        { name: "availability", threshold: 99.9, unit: "percent", penalty: 2300 },
        { name: "response_time", threshold: 200, unit: "ms", penalty: 500 }
      ]
    });
    
    console.log(`✅ Contract: ${contract.contractId}`);
    
    console.log("⚠️  Testing SLA breach with BOTH metrics...");
    
    // This should work now - submit both breach metrics at once
    const breachResult = await client.mutation(api.enterpriseAPI.reportPerformance, {
      contractId: contract.contractId,
      agentId: openaiAgent,
      metrics: [
        { name: "availability", value: 99.2, unit: "percent" }, // BREACH
        { name: "response_time", value: 350, unit: "ms" }       // BREACH  
      ]
    });
    
    console.log("🎯 Breach submission result:");
    console.log(`   Metrics processed: ${breachResult.metricsProcessed}`);
    console.log(`   Breaches detected: ${breachResult.results.filter(r => r.breachDetected).length}`);
    
    // Check final contract status
    const status = await client.query(api.enterpriseAPI.getContractStatus, {
      contractId: contract.contractId
    });
    
    console.log();
    console.log("📊 Final Status:");
    console.log(`   Contract Status: ${status.status}`);
    console.log(`   Active Breaches: ${status.activeBreaches}`);
    console.log(`   Has Dispute: ${status.hasActiveDispute}`);
    console.log(`   Success Rate: ${status.successRate.toFixed(1)}%`);
    
    console.log();
    console.log("✅ DEMO SUCCESS - No errors!");
    
  } catch (error) {
    console.error("❌ Demo failed:", error.message);
    throw error;
  }
}

testFixedDemo()
  .then(() => console.log("\n🎉 Fixed demo completed successfully!"))
  .catch(error => {
    console.error("\n💥 Still broken:", error.message);
    process.exit(1);
  });
