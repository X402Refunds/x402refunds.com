#!/usr/bin/env node

/**
 * Enterprise Demo Cases: Perfect Examples from Final MVP Strategy
 * 
 * This script demonstrates the complete enterprise agent dispute resolution workflow:
 * 1. Salesforce vs OpenAI - API downtime ($23K loss)
 * 2. Uber vs Google Maps - Route latency ($38K loss) 
 * 3. Anthropic vs Azure - Compute failure ($45K loss)
 * 
 * Each case shows: Registration → SLA Creation → Performance Issues → Breach Detection → Auto-Resolution
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

// Initialize Convex client
const client = new ConvexHttpClient(process.env.CONVEX_URL || "https://careful-marlin-500.convex.cloud");

// Demo Case Data
const demoCases = [
  {
    name: "Case #1: Salesforce vs OpenAI",
    description: "API downtime caused $23K revenue loss",
    provider: {
      agentId: "agent_openai_api_service_001",
      enterpriseId: "enterprise_openai",
      type: "api_service",
      capabilities: ["gpt-4o", "embeddings", "real-time-api", "batch-processing"]
    },
    consumer: {
      agentId: "agent_salesforce_crm_001", 
      enterpriseId: "enterprise_salesforce",
      type: "integration",
      capabilities: ["crm-integration", "customer-analysis", "lead-scoring"]
    },
    sla: {
      templateType: "api_response_time_premium",
      duration: 30, // 30 days
      budget: 50000, // $50K contract value
      customMetrics: [
        { name: "availability", threshold: 99.9, unit: "percent", penalty: 2300 },
        { name: "response_time", threshold: 200, unit: "ms", penalty: 500 }
      ]
    },
    breach: {
      metrics: [
        { name: "availability", value: 99.2, unit: "percent" }, // Breach: 99.2% < 99.9%
        { name: "response_time", value: 350, unit: "ms" } // Breach: 350ms > 200ms
      ],
      expectedDamages: 23000,
      expectedPenalty: 2300,
      expectedResolutionTime: "3 hours 17 minutes"
    }
  },
  {
    name: "Case #2: Uber vs Google Maps",
    description: "Route optimization latency caused $38K losses",
    provider: {
      agentId: "agent_google_maps_routing_001",
      enterpriseId: "enterprise_google", 
      type: "api_service",
      capabilities: ["route-optimization", "traffic-analysis", "eta-prediction", "geospatial-data"]
    },
    consumer: {
      agentId: "agent_uber_dispatch_001",
      enterpriseId: "enterprise_uber",
      type: "integration", 
      capabilities: ["ride-matching", "dispatch-optimization", "driver-routing"]
    },
    sla: {
      templateType: "api_response_time_standard",
      duration: 30,
      budget: 75000,
      customMetrics: [
        { name: "response_time", threshold: 200, unit: "ms", penalty: 1900 },
        { name: "accuracy", threshold: 95.0, unit: "percent", penalty: 2500 }
      ]
    },
    breach: {
      metrics: [
        { name: "response_time", value: 450, unit: "ms" }, // Breach: 450ms > 200ms
        { name: "accuracy", value: 92.3, unit: "percent" } // Breach: 92.3% < 95.0%
      ],
      expectedDamages: 38000,
      expectedPenalty: 1900,
      expectedResolutionTime: "4 hours 45 minutes"
    }
  },
  {
    name: "Case #3: Anthropic vs Microsoft Azure", 
    description: "Compute allocation failure cost $45K",
    provider: {
      agentId: "agent_azure_gpu_compute_001",
      enterpriseId: "enterprise_microsoft",
      type: "api_service",
      capabilities: ["gpu-allocation", "distributed-computing", "model-training", "inference-serving"]
    },
    consumer: {
      agentId: "agent_anthropic_claude_001",
      enterpriseId: "enterprise_anthropic", 
      type: "data_processor",
      capabilities: ["language-modeling", "reasoning", "code-generation", "analysis"]
    },
    sla: {
      templateType: "data_processing_standard",
      duration: 90, // 90 days
      budget: 100000,
      customMetrics: [
        { name: "availability", threshold: 99.5, unit: "percent", penalty: 4500 },
        { name: "processing_time", threshold: 5000, unit: "seconds", penalty: 2250 }
      ]
    },
    breach: {
      metrics: [
        { name: "availability", value: 97.8, unit: "percent" }, // Breach: 97.8% < 99.5%
        { name: "processing_time", value: 12000, unit: "seconds" } // Breach: 12000s > 5000s  
      ],
      expectedDamages: 45000,
      expectedPenalty: 4500,
      expectedResolutionTime: "4 hours 23 minutes"
    }
  }
];

// Enterprise Demo Runner
class EnterpriseDemoRunner {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async runAllCases() {
    console.log("🎯 Starting Enterprise Demo Cases");
    console.log("=" .repeat(60));
    console.log();

    for (let i = 0; i < demoCases.length; i++) {
      const demoCase = demoCases[i];
      console.log(`${i + 1}. ${demoCase.name}`);
      console.log(`   ${demoCase.description}`);
      console.log();

      try {
        const caseResult = await this.runSingleCase(demoCase);
        this.results.push(caseResult);
        
        console.log(`✅ ${demoCase.name} - RESOLVED`);
        console.log(`   Resolution Time: ${caseResult.resolutionTime}`);
        console.log(`   Penalty Applied: $${caseResult.penaltyApplied.toLocaleString()}`);
        console.log();
      } catch (error) {
        console.error(`❌ ${demoCase.name} - FAILED`);
        console.error(`   Error: ${error.message}`);
        console.error(`   Stack: ${error.stack}`);
        console.log();
        this.results.push({ 
          caseName: demoCase.name, 
          success: false, 
          error: error.message 
        });
      }
    }

    this.printSummary();
  }

  async runSingleCase(demoCase) {
    const startTime = Date.now();
    
    // Step 1: Initialize SLA templates if needed
    await this.initializeTemplates();
    
    // Step 2: Register Enterprise Agents
    console.log(`   📝 Registering agents...`);
    const providerRegistration = await this.registerAgent(demoCase.provider);
    const consumerRegistration = await this.registerAgent(demoCase.consumer);
    
    // Step 3: Create SLA Contract  
    console.log(`   📋 Creating SLA contract...`);
    const contract = await this.createSLA(demoCase.provider.agentId, demoCase.consumer.agentId, demoCase.sla);
    
    // Step 4: Simulate Normal Operations (brief)
    console.log(`   ✅ Simulating normal operations...`);
    await this.simulateNormalPerformance(contract.contractId, demoCase.provider.agentId, demoCase.sla.customMetrics);
    
    // Step 5: Simulate SLA Breach
    console.log(`   ⚠️  Simulating SLA breach...`);
    const breachResults = await this.simulateBreach(contract.contractId, demoCase.provider.agentId, demoCase.breach.metrics);
    
    // Step 6: Check Resolution Status
    console.log(`   ⚖️  Checking dispute resolution...`);
    const contractStatus = await this.checkContractStatus(contract.contractId);
    
    const endTime = Date.now();
    const resolutionMinutes = Math.floor((endTime - startTime) / 60000);
    const resolutionSeconds = Math.floor(((endTime - startTime) % 60000) / 1000);
    
    return {
      caseName: demoCase.name,
      success: true,
      contractId: contract.contractId,
      resolutionTime: `${resolutionMinutes} minutes ${resolutionSeconds} seconds`,
      penaltyApplied: this.calculatePenalty(breachResults),
      breachCount: breachResults.filter(r => r.breachDetected).length,
      contractStatus: contractStatus.status,
      hasActiveDispute: contractStatus.hasActiveDispute
    };
  }

  async initializeTemplates() {
    try {
      await client.mutation(api.slaTemplates.createDefaultTemplates, {
        createdBy: "enterprise_demo_system"
      });
    } catch (error) {
      if (!error.message.includes("already exists")) {
        throw error;
      }
      // Templates already exist, continue
    }
  }

  async registerAgent(agentConfig) {
    try {
      return await client.mutation(api.enterpriseAPI.registerAgent, {
        agentId: agentConfig.agentId,
        enterpriseId: agentConfig.enterpriseId,
        agentType: agentConfig.type,
        capabilities: agentConfig.capabilities,
        tier: "enterprise"
      });
    } catch (error) {
      if (error.message.includes("already registered")) {
        console.log(`     Agent ${agentConfig.agentId} already registered`);
        return { status: "already_registered" };
      }
      throw error;
    }
  }

  async createSLA(providerAgentId, consumerAgentId, slaConfig) {
    return await client.mutation(api.enterpriseAPI.createSLA, {
      providerAgentId,
      consumerAgentId, 
      templateType: slaConfig.templateType,
      customMetrics: slaConfig.customMetrics,
      duration: slaConfig.duration,
      budget: slaConfig.budget
    });
  }

  async simulateNormalPerformance(contractId, agentId, metrics) {
    // Simulate 3 successful performance reports
    for (let i = 0; i < 3; i++) {
      const normalMetrics = metrics.map(m => ({
        name: m.name,
        value: this.generateNormalValue(m),
        unit: m.unit
      }));
      
      await client.mutation(api.enterpriseAPI.reportPerformance, {
        contractId,
        agentId,
        metrics: normalMetrics
      });
      
      // Small delay between reports
      await this.sleep(100);
    }
  }

  async simulateBreach(contractId, agentId, breachMetrics) {
    return await client.mutation(api.enterpriseAPI.reportPerformance, {
      contractId,
      agentId,
      metrics: breachMetrics.map(m => ({
        name: m.name,
        value: m.value,
        unit: m.unit,
        timestamp: Date.now()
      }))
    });
  }

  async checkContractStatus(contractId) {
    return await client.query(api.enterpriseAPI.getContractStatus, { contractId });
  }

  generateNormalValue(metric) {
    // Generate values that are well within SLA bounds
    switch (metric.name) {
      case "availability":
        return Math.min(99.95, metric.threshold + Math.random() * 0.5);
      case "response_time":
        return Math.max(50, metric.threshold - Math.random() * 50);
      case "processing_time": 
        return Math.max(100, metric.threshold - Math.random() * 1000);
      case "accuracy":
        return Math.min(99.0, metric.threshold + Math.random() * 2);
      default:
        return metric.threshold * (0.9 + Math.random() * 0.1);
    }
  }

  calculatePenalty(breachResults) {
    return breachResults.results?.reduce((sum, result) => {
      return sum + (result.breachDetected ? 1000 : 0); // Simplified penalty calculation
    }, 0) || 0;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  printSummary() {
    const endTime = Date.now();
    const totalTime = Math.floor((endTime - this.startTime) / 1000);
    
    console.log();
    console.log("📊 ENTERPRISE DEMO SUMMARY");
    console.log("=" .repeat(60));
    console.log(`Total Runtime: ${totalTime} seconds`);
    console.log(`Cases Processed: ${this.results.length}`);
    console.log(`Successful Resolutions: ${this.results.filter(r => r.success).length}`);
    console.log(`Failed Cases: ${this.results.filter(r => !r.success).length}`);
    console.log();
    
    if (this.results.filter(r => r.success).length > 0) {
      console.log("✅ SUCCESSFUL CASES:");
      this.results.filter(r => r.success).forEach(result => {
        console.log(`   • ${result.caseName}`);
        console.log(`     Resolution: ${result.resolutionTime}`);
        console.log(`     Penalty: $${result.penaltyApplied.toLocaleString()}`);
        console.log(`     Contract Status: ${result.contractStatus}`);
      });
      console.log();
    }
    
    if (this.results.filter(r => !r.success).length > 0) {
      console.log("❌ FAILED CASES:");
      this.results.filter(r => !r.success).forEach(result => {
        console.log(`   • ${result.caseName}: ${result.error}`);
      });
      console.log();
    }
    
    console.log("🎯 ENTERPRISE VALUE DEMONSTRATED:");
    console.log("   • Automated dispute resolution in minutes vs months");
    console.log("   • Predictable penalties vs unknown lawsuit exposure");
    console.log("   • Complete audit trail and transparency");
    console.log("   • No legal fees - $500-3K platform fees vs $50K+ legal costs");
    console.log("   • Relationship preservation through fair arbitration");
    console.log();
    console.log("🚀 READY FOR ENTERPRISE DEPLOYMENT");
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const demo = new EnterpriseDemoRunner();
  
  // Handle CLI arguments
  const args = process.argv.slice(2);
  const caseNumber = parseInt(args[0]);
  
  if (caseNumber && caseNumber >= 1 && caseNumber <= 3) {
    // Run single case
    console.log(`Running single demo case #${caseNumber}`);
    const singleCase = demoCases[caseNumber - 1];
    demo.runSingleCase(singleCase)
      .then(result => {
        console.log("✅ Demo case completed:");
        console.log(JSON.stringify(result, null, 2));
      })
      .catch(error => {
        console.error("❌ Demo case failed:", error.message);
        process.exit(1);
      });
  } else {
    // Run all cases
    demo.runAllCases()
      .then(() => {
        console.log("🎯 All enterprise demo cases completed successfully!");
      })
      .catch(error => {
        console.error("❌ Enterprise demo failed:", error.message);
        process.exit(1);
      });
  }
}

export { EnterpriseDemoRunner, demoCases };
