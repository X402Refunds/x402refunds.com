#!/usr/bin/env node
/**
 * Demo: Enterprise Agent SLA System
 * 
 * Demonstrates the complete enterprise agent dispute resolution workflow:
 * 1. Register enterprise agents
 * 2. Create SLA templates  
 * 3. Establish SLA contracts
 * 4. Monitor performance
 * 5. Handle breaches and disputes
 */

import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexClient(process.env.CONVEX_URL || "https://grateful-swan-424.convex.cloud");

async function runDemo() {
  console.log("🚀 Enterprise Agent Dispute Resolution Platform Demo\n");
  
  try {
    // Step 1: Create default SLA templates
    console.log("📋 Creating enterprise SLA templates...");
    const templateIds = await client.mutation(api.slaTemplates.createDefaultTemplates, {
      createdBy: "did:enterprise:demo"
    });
    console.log(`✅ Created ${templateIds.length} SLA templates\n`);
    
    // Step 2: Register enterprise agents
    console.log("🏢 Registering enterprise agents...");
    
    const providerAgent = await client.mutation(api.enterpriseAPI.registerAgent, {
      agentId: "did:agent:datacorp-analyzer",
      enterpriseId: "did:enterprise:datacorp",
      agentType: "data_processor",
      capabilities: ["json_analysis", "csv_processing", "real_time_analytics"],
      tier: "professional",
      contactInfo: {
        email: "datacorp@example.com",
        webhook: "https://datacorp.com/agent-webhook"
      }
    });
    
    const consumerAgent = await client.mutation(api.enterpriseAPI.registerAgent, {
      agentId: "did:agent:fintech-monitor", 
      enterpriseId: "did:enterprise:fintech",
      agentType: "monitor",
      capabilities: ["market_monitoring", "alert_generation", "risk_assessment"],
      tier: "enterprise",
      contactInfo: {
        email: "fintech@example.com"
      }
    });
    
    console.log(`✅ Provider agent registered: ${providerAgent.agentId}`);
    console.log(`✅ Consumer agent registered: ${consumerAgent.agentId}\n`);
    
    // Step 3: Discover available services
    console.log("🔍 Discovering available services...");
    const services = await client.query(api.enterpriseAPI.discoverServices, {
      serviceType: "data_processor",
      minReputation: 0,
      limit: 5
    });
    
    console.log(`✅ Found ${services.length} data processing services:`);
    services.forEach(service => {
      console.log(`   - ${service.name} (${service.agentId}) - Reputation: ${service.reputation}`);
    });
    console.log();
    
    // Step 4: Create SLA contract
    console.log("📄 Creating SLA contract...");
    const slaContract = await client.mutation(api.enterpriseAPI.createSLA, {
      providerAgentId: providerAgent.agentId,
      consumerAgentId: consumerAgent.agentId, 
      templateType: "data_processing_standard",
      customMetrics: [
        {
          name: "processing_time",
          threshold: 1800, // 30 minutes instead of 1 hour
          unit: "seconds",
          penalty: 200
        }
      ],
      duration: 30, // 30 days
      budget: 1000
    });
    
    console.log(`✅ SLA contract created: ${slaContract.contractId}`);
    console.log(`   Template: ${slaContract.templateUsed}`);
    console.log(`   Status: ${slaContract.status}\n`);
    
    // Step 5: Submit performance metrics (good performance)
    console.log("📊 Submitting performance metrics (good performance)...");
    const goodPerformance = await client.mutation(api.enterpriseAPI.reportPerformance, {
      contractId: slaContract.contractId,
      agentId: providerAgent.agentId,
      metrics: [
        { name: "processing_time", value: 900, unit: "seconds" }, // 15 minutes - good
        { name: "accuracy", value: 98.5, unit: "percent" },       // High accuracy - good
        { name: "availability", value: 99.8, unit: "percent" }    // High availability - good
      ],
      evidenceUrl: "https://datacorp.com/evidence/performance-001.json"
    });
    
    console.log(`✅ Performance metrics submitted:`);
    goodPerformance.results.forEach(result => {
      const status = result.breachDetected ? `❌ BREACH (${result.severity})` : "✅ OK";
      console.log(`   - ${result.metric}: ${result.value} ${status}`);
    });
    console.log();
    
    // Step 6: Submit performance metrics (breach scenario)
    console.log("⚠️  Submitting performance metrics (SLA breach scenario)...");
    await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay
    
    const breachPerformance = await client.mutation(api.enterpriseAPI.reportPerformance, {
      contractId: slaContract.contractId,
      agentId: providerAgent.agentId,
      metrics: [
        { name: "processing_time", value: 2400, unit: "seconds" }, // 40 minutes - breach!
        { name: "accuracy", value: 92.0, unit: "percent" },        // Low accuracy - breach!
        { name: "availability", value: 97.5, unit: "percent" }     // Lower availability - breach!
      ],
      evidenceUrl: "https://datacorp.com/evidence/performance-002.json"
    });
    
    console.log(`⚠️  Performance metrics with breaches:`);
    breachPerformance.results.forEach(result => {
      const status = result.breachDetected ? `❌ BREACH (${result.severity})` : "✅ OK";
      console.log(`   - ${result.metric}: ${result.value} ${status}`);
    });
    console.log();
    
    // Step 7: Check contract status after breach
    console.log("📈 Checking contract status after breach...");
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for breach processing
    
    const contractStatus = await client.query(api.enterpriseAPI.getContractStatus, {
      contractId: slaContract.contractId
    });
    
    if (contractStatus) {
      console.log(`✅ Contract Status:`);
      console.log(`   - Status: ${contractStatus.status}`);
      console.log(`   - Success Rate: ${contractStatus.successRate.toFixed(1)}%`);
      console.log(`   - Total Interactions: ${contractStatus.totalInteractions}`);
      console.log(`   - Active Breaches: ${contractStatus.activeBreaches}`);
      console.log(`   - Has Active Dispute: ${contractStatus.hasActiveDispute ? 'Yes' : 'No'}`);
      console.log(`   - Performance: ${contractStatus.performance.summary}`);
    }
    console.log();
    
    // Step 8: Check agent reputation
    console.log("🏆 Checking agent reputation...");
    const reputation = await client.query(api.enterpriseAPI.getAgentReputation, {
      agentId: providerAgent.agentId
    });
    
    if (reputation) {
      console.log(`✅ Agent Reputation for ${reputation.agentId}:`);
      console.log(`   - Overall Score: ${reputation.overallScore}/1000`);
      console.log(`   - Trust Level: ${reputation.trustLevel}`);
      console.log(`   - Reliability: ${reputation.reliability}/1000`);
      console.log(`   - Performance: ${reputation.performance}/1000`);
      console.log(`   - Success Rate: ${reputation.successRate.toFixed(1)}%`);
      console.log(`   - Breach Rate: ${reputation.breachRate.toFixed(1)}%`);
      console.log(`   - Badges: [${reputation.badges.join(', ')}]`);
      console.log(`   - Certifications: [${reputation.certifications.join(', ')}]`);
      console.log(`   - Trend: ${reputation.trend}`);
    }
    console.log();
    
    // Step 9: Show available templates
    console.log("📚 Available SLA templates for enterprises:");
    const templates = await client.query(api.slaTemplates.getPopularTemplates, { limit: 10 });
    
    templates.forEach(template => {
      console.log(`✅ ${template.name}`);
      console.log(`   - Type: ${template.serviceType}`);
      console.log(`   - Duration: ${Math.round(template.duration / (24 * 60 * 60 * 1000))} days`);
      console.log(`   - Metrics: ${template.metrics.length} performance metrics`);
      console.log(`   - Base Fee: $${template.baseFee || 'N/A'}`);
      console.log();
    });
    
    console.log("🎉 Demo completed successfully!");
    console.log("\n💡 Key Takeaways:");
    console.log("   • Agents register with enterprise-friendly terminology");
    console.log("   • SLA contracts are created from templates automatically");
    console.log("   • Performance monitoring happens in real-time");
    console.log("   • Breaches are detected and handled automatically");
    console.log("   • Reputation scores are calculated based on performance");
    console.log("   • Critical breaches escalate to formal dispute resolution");
    console.log("   • All powered by the underlying Agent Governance OS!");
    
  } catch (error) {
    console.error("❌ Demo failed:", error.message);
    process.exit(1);
  }
}

// Run the demo
runDemo().catch(console.error);
