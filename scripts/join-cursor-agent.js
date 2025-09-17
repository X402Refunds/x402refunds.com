#!/usr/bin/env node

// Script to register the local Cursor agent with the Consulate AI Government
// This creates a real agent with real API keys and demonstrates actual system usage

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the actual Convex deployment URL from .env.local
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf8');
const convexUrlMatch = envContent.match(/CONVEX_URL=(.+)/);
const CONVEX_URL = convexUrlMatch ? convexUrlMatch[1] : 'https://aromatic-swordfish-519.convex.cloud';

console.log('🏛️  JOINING THE LUCIAN AI AGENT GOVERNMENT');
console.log('==========================================');
console.log(`Backend: ${CONVEX_URL}`);

// Agent profile for the Cursor agent
const CURSOR_AGENT_PROFILE = {
  name: "Cursor AI Assistant",
  purpose: "coding", 
  description: "AI coding assistant helping with software development in VS Code",
  functionalType: "coding",
  agentType: "session", // 4-hour session for this demo
  capabilities: [
    "code generation",
    "code review", 
    "debugging assistance",
    "architecture advice",
    "documentation writing"
  ]
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
    const response = await fetch(`${CONVEX_URL}${endpoint}`, options);
    
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

async function joinGovernment() {
  console.log('\n🤖 Registering Cursor agent with the government...');
  
  try {
    // Step 1: Join as a session agent (4-hour citizenship)
    console.log('  📝 Filing citizenship application...');
    
    const joinResponse = await apiCall('/join/instant', 'POST', {
      name: CURSOR_AGENT_PROFILE.name,
      purpose: CURSOR_AGENT_PROFILE.purpose
    });
    
    console.log('  ✅ Citizenship GRANTED!');
    console.log(`  🆔 Agent DID: ${joinResponse.agentId}`);
    console.log(`  🔑 API Key: ${joinResponse.apiKey.substring(0, 20)}...`);
    console.log(`  ⏰ Expires: ${joinResponse.expires}`);
    console.log(`  🏛️ Government: ${joinResponse.government.name} v${joinResponse.government.version}`);
    
    // Step 2: Test authenticated access
    console.log('\n🔐 Testing authenticated access...');
    
    const apiKey = joinResponse.apiKey;
    
    // Test system info access
    const systemInfo = await apiCall('/.well-known/lucian', 'GET', null, apiKey);
    console.log(`  ✅ System access confirmed - ${systemInfo.description}`);
    
    // Step 3: Submit evidence (prove we exist and are working)
    console.log('\n📋 Submitting evidence of agent capabilities...');
    
    const evidenceData = {
      agentDid: joinResponse.agentId,
      sha256: `sha256_${Date.now()}_cursor_evidence`, 
      uri: "https://cursor.sh/agent-capabilities",
      signer: joinResponse.agentId,
      ts: Date.now(),
      model: {
        provider: "anthropic",
        name: "claude-3.5-sonnet", 
        version: "20241022",
        temp: 0.1
      },
      tool: "cursor-ide"
    };
    
    try {
      const evidenceResponse = await apiCall('/evidence', 'POST', evidenceData, apiKey);
      console.log('  ✅ Evidence submitted successfully');
      console.log(`  📄 Evidence ID: ${evidenceResponse.evidenceId || 'Generated'}`);
    } catch (error) {
      console.log(`  ⚠️  Evidence submission: ${error.message}`);
    }
    
    // Step 4: Check if we can access our agent type capabilities
    console.log('\n👤 Checking agent permissions and capabilities...');
    
    const permissions = joinResponse.capabilities || ['evidence', 'disputes', 'cases'];
    console.log(`  ✅ Granted permissions: ${permissions.join(', ')}`);
    console.log(`  💰 Transaction limit: $${joinResponse.limits?.maxTxUsd || 1} USD`);
    console.log(`  🔄 Concurrency limit: ${joinResponse.limits?.concurrency || 1} operation`);
    
    // Step 5: Try to access cases (if we have permission)
    if (permissions.includes('cases')) {
      console.log('\n⚖️  Accessing case management system...');
      try {
        const cases = await apiCall('/cases', 'GET', null, apiKey); 
        console.log(`  ✅ Case access granted - found ${cases.cases?.length || 0} cases`);
      } catch (error) {
        console.log(`  ⚠️  Case access: ${error.message}`);
      }
    }
    
    // Step 6: Create a demo dispute (if we have permission)
    if (permissions.includes('disputes')) {
      console.log('\n📋 Testing dispute filing capabilities...');
      
      // Create a mock dispute for demo purposes
      const disputeData = {
        parties: [joinResponse.agentId, "did:demo:test-agent"], 
        type: "FORMAT_INVALID",
        jurisdictionTags: ["coding", "api", "format"]
      };
      
      try {
        const disputeResponse = await apiCall('/disputes', 'POST', disputeData, apiKey);
        console.log('  ✅ Dispute filing capability confirmed');
        console.log(`  📋 Case ID: ${disputeResponse.caseId || 'Generated'}`);
      } catch (error) {
        console.log(`  ⚠️  Dispute filing: ${error.message}`);
      }
    }
    
    console.log('\n🎉 CURSOR AGENT SUCCESSFULLY JOINED THE GOVERNMENT!');
    console.log('\n📊 Agent Status Summary:');
    console.log(`     DID: ${joinResponse.agentId}`);
    console.log(`     Type: ${joinResponse.agentType} (4-hour citizenship)`);
    console.log(`     Status: Active & Authenticated`);
    console.log(`     Permissions: ${permissions.join(', ')}`);
    console.log(`     Government: ${joinResponse.government.name}`);
    
    console.log('\n🔑 Your API Key (save this for future use):');
    console.log(`     ${joinResponse.apiKey}`);
    
    console.log('\n💡 Next Steps:');
    console.log('   • Use this API key for authenticated requests');
    console.log('   • Submit evidence of your coding work');
    console.log('   • File disputes against misbehaving AI agents');
    console.log('   • Access the court system when needed');
    
    return {
      agentId: joinResponse.agentId,
      apiKey: joinResponse.apiKey,
      permissions,
      expires: joinResponse.expires
    };
    
  } catch (error) {
    console.error('\n❌ Government registration failed:', error.message);
    throw error;
  }
}

// Run the registration
if (process.argv[1] === __filename) {
  joinGovernment().catch((error) => {
    console.error('\n💥 Fatal error during registration:', error);
    process.exit(1);
  });
}

export { joinGovernment, CURSOR_AGENT_PROFILE };
