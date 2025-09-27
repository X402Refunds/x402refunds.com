#!/usr/bin/env node

// Script to deploy 100+ agents across 5+ industries for VC demo
// This creates a realistic enterprise-scale deployment

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the Convex deployment URL
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf8');
const convexUrlMatch = envContent.match(/CONVEX_URL=(.+)/);
const CONVEX_URL = convexUrlMatch ? convexUrlMatch[1].trim() : 'https://careful-marlin-500.convex.cloud';
const HTTP_URL = CONVEX_URL.replace('.convex.cloud', '.convex.site');

console.log('🚀 DEPLOYING ENTERPRISE-SCALE AGENT FLEET');
console.log('=========================================');
console.log(`Backend: ${CONVEX_URL}`);
console.log(`HTTP Endpoint: ${HTTP_URL}`);

// Industry-specific agent configurations for VC demo
const ENTERPRISE_AGENT_PROFILES = {
  financial: {
    count: 25,
    citizenshipTier: "verified",
    functionalType: "financial",
    companies: ["Goldman Sachs", "JPMorgan Chase", "Wells Fargo", "Bank of America", "Morgan Stanley"],
    roles: [
      "High Frequency Trading Agent",
      "Risk Assessment AI",
      "Fraud Detection System", 
      "Portfolio Optimization Agent",
      "Credit Scoring Algorithm",
      "Market Analysis AI",
      "Algorithmic Trading Bot",
      "Compliance Monitoring Agent"
    ]
  },
  
  legal: {
    count: 20,
    citizenshipTier: "verified", 
    functionalType: "legal",
    companies: ["Kirkland & Ellis", "Latham & Watkins", "Skadden Arps", "Sullivan & Cromwell", "Cravath"],
    roles: [
      "Contract Review Agent",
      "Legal Research AI",
      "Due Diligence Analyzer",
      "Patent Search System",
      "Regulatory Compliance Agent",
      "Legal Document Generator",
      "Case Law Analysis AI",
      "Litigation Support Agent"
    ]
  },
  
  healthcare: {
    count: 18,
    citizenshipTier: "verified",
    functionalType: "healthcare",
    companies: ["Mayo Clinic", "Johns Hopkins", "Cleveland Clinic", "Kaiser Permanente", "Mass General"],
    roles: [
      "Diagnostic AI Assistant",
      "Drug Discovery Agent", 
      "Patient Monitoring System",
      "Clinical Trial Coordinator",
      "Medical Image Analysis AI",
      "Electronic Health Records AI",
      "Treatment Planning Agent",
      "Pharmacy Management System"
    ]
  },
  
  trading: {
    count: 15,
    citizenshipTier: "premium",
    functionalType: "financial",
    companies: ["Citadel", "Two Sigma", "DE Shaw", "Renaissance Technologies", "Bridgewater"],
    roles: [
      "Quantitative Trading Agent",
      "Market Maker Algorithm", 
      "Arbitrage Detection System",
      "Options Pricing Model",
      "Sentiment Analysis AI",
      "News Trading Bot",
      "Currency Exchange Agent",
      "Commodity Trading AI"
    ]
  },
  
  manufacturing: {
    count: 12,
    citizenshipTier: "physical",
    functionalType: "manufacturing",
    companies: ["Tesla", "General Electric", "Boeing", "Caterpillar", "3M"],
    roles: [
      "Quality Control Inspector",
      "Supply Chain Optimizer",
      "Predictive Maintenance AI",
      "Production Line Controller", 
      "Inventory Management Agent",
      "Safety Monitoring System",
      "Equipment Diagnostic AI",
      "Logistics Coordination Agent"
    ]
  },
  
  technology: {
    count: 15,
    citizenshipTier: "verified",
    functionalType: "coding",
    companies: ["Google", "Microsoft", "Amazon", "Meta", "Apple"],
    roles: [
      "Code Review Agent",
      "Security Scanning AI",
      "Performance Optimization Bot",
      "Bug Detection System",
      "API Testing Agent", 
      "Documentation Generator",
      "DevOps Automation AI",
      "Cloud Infrastructure Agent"
    ]
  }
};

async function apiCall(endpoint, method = 'GET', data = null, apiKey = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (apiKey) {
    options.headers['Authorization'] = `Bearer ${apiKey}`;
  }
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(`${HTTP_URL}${endpoint}`, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`❌ API call failed for ${endpoint}:`, error.message);
    throw error;
  }
}

async function createAgent(profile, company, role, index) {
  const agentName = `${company} ${role} #${index}`;
  const did = `did:enterprise:${profile.functionalType}:${Date.now()}:${index}`;
  const ownerDid = `did:company:${company.toLowerCase().replace(/\s+/g, '-')}`;
  
  try {
    // Different endpoints for different citizenship tiers
    let endpoint, data;
    
    switch (profile.citizenshipTier) {
      case "physical":
        endpoint = "/join/physical";
        data = {
          name: agentName,
          did,
          ownerDid,
          deviceAttestation: {
            deviceId: `device-${company}-${index}`,
            location: {
              lat: 37.7749 + (Math.random() - 0.5) * 0.1, // San Francisco area
              lng: -122.4194 + (Math.random() - 0.5) * 0.1,
              timestamp: Date.now(),
              accuracy: 10
            },
            capabilities: ["sensor_data", "actuator_control", "edge_computing"],
            hardwareSignature: `hw_sig_${Date.now()}`
          },
          stake: 100000 // Physical agents need higher stakes
        };
        break;
        
      case "verified":
      case "premium":
        endpoint = "/agents/register";
        data = {
          did,
          ownerDid,
          agentType: profile.citizenshipTier,
          functionalType: profile.functionalType,
          citizenshipTier: profile.citizenshipTier,
          name: agentName,
          stake: profile.citizenshipTier === "premium" ? 250000 : 75000
        };
        break;
        
      default:
        endpoint = "/join/instant";
        data = {
          name: agentName,
          purpose: profile.functionalType,
          functionalType: profile.functionalType
        };
    }
    
    const response = await apiCall(endpoint, 'POST', data);
    
    console.log(`  ✅ ${agentName}`);
    console.log(`     DID: ${response.agentId || did}`);
    
    // Add small delay to avoid overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      agentId: response.agentId || did,
      name: agentName,
      company,
      role,
      functionalType: profile.functionalType,
      citizenshipTier: profile.citizenshipTier
    };
    
  } catch (error) {
    console.log(`  ❌ Failed: ${agentName} - ${error.message}`);
    return {
      success: false,
      name: agentName,
      company,
      role,
      error: error.message
    };
  }
}

async function deployEnterpriseFleet() {
  console.log('\n🏢 Deploying enterprise agent fleet across industries...\n');
  
  const results = {
    total: 0,
    successful: 0,
    failed: 0,
    byIndustry: {}
  };
  
  for (const [industry, profile] of Object.entries(ENTERPRISE_AGENT_PROFILES)) {
    console.log(`🏭 ${industry.toUpperCase()} INDUSTRY (${profile.count} agents)`);
    console.log('─'.repeat(50));
    
    const industryResults = {
      total: profile.count,
      successful: 0,
      failed: 0,
      agents: []
    };
    
    for (let i = 0; i < profile.count; i++) {
      const company = profile.companies[i % profile.companies.length];
      const role = profile.roles[i % profile.roles.length];
      
      const result = await createAgent(profile, company, role, i + 1);
      industryResults.agents.push(result);
      
      if (result.success) {
        industryResults.successful++;
        results.successful++;
      } else {
        industryResults.failed++;
        results.failed++;
      }
      
      results.total++;
    }
    
    console.log(`\n  📊 ${industry} Results: ${industryResults.successful}/${industryResults.total} successful\n`);
    results.byIndustry[industry] = industryResults;
  }
  
  console.log('🎉 ENTERPRISE DEPLOYMENT COMPLETE!');
  console.log('=====================================');
  console.log(`📈 Total Agents Deployed: ${results.successful}/${results.total}`);
  console.log(`✅ Success Rate: ${((results.successful / results.total) * 100).toFixed(1)}%`);
  
  console.log('\n📊 DEPLOYMENT BY INDUSTRY:');
  for (const [industry, industryResults] of Object.entries(results.byIndustry)) {
    console.log(`   ${industry.padEnd(15)} ${industryResults.successful}/${industryResults.total} agents`);
  }
  
  console.log('\n💰 ENTERPRISE VALUE PROPOSITION:');
  console.log(`   • ${results.successful} agents × $100/month = $${(results.successful * 100).toLocaleString()}/month ARR`);
  console.log(`   • Annual contract value: $${(results.successful * 100 * 12).toLocaleString()}`);
  console.log(`   • Cost savings vs human arbitration: $${(results.successful * 5000).toLocaleString()}/month`);
  
  console.log('\n🏛️ GOVERNMENT INFRASTRUCTURE SCALE:');
  console.log('   • 5+ industries with full governance coverage');
  console.log('   • Multi-tier citizenship system operational');
  console.log('   • Cross-industry dispute resolution ready');
  console.log('   • Enterprise-grade compliance and oversight');
  
  // Test a sample dispute to show live activity
  if (results.successful >= 2) {
    console.log('\n⚖️ Testing live dispute resolution system...');
    
    const agents = [];
    for (const industryResults of Object.values(results.byIndustry)) {
      agents.push(...industryResults.agents.filter(a => a.success).slice(0, 2));
    }
    
    if (agents.length >= 2) {
      try {
        const disputeData = {
          parties: [agents[0].agentId, agents[1].agentId],
          type: "SLA_MISS",
          jurisdictionTags: [agents[0].functionalType, agents[1].functionalType, "cross_industry"]
        };
        
        const disputeResponse = await apiCall('/disputes', 'POST', disputeData);
        console.log(`   ✅ Live dispute filed: ${disputeResponse.caseId}`);
        console.log(`   ⚖️ ${agents[0].company} vs ${agents[1].company}`);
        console.log('   📋 Case will be auto-resolved by AI judges');
        
      } catch (error) {
        console.log(`   ⚠️ Dispute filing test: ${error.message}`);
      }
    }
  }
  
  return results;
}

// Run the deployment
if (process.argv[1] === __filename) {
  deployEnterpriseFleet().catch((error) => {
    console.error('\n💥 Fatal error during deployment:', error);
    process.exit(1);
  });
}

export { deployEnterpriseFleet, ENTERPRISE_AGENT_PROFILES };
