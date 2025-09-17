#!/usr/bin/env node

// Demo Data Generator for Consulate AI Agent Court System
// Run this to populate your system with example agents, cases, and disputes

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_BASE = 'https://aromatic-swordfish-519.convex.cloud';

// Demo agents to create
const DEMO_AGENTS = [
  {
    did: "did:demo:financial-agent-alpha",
    agentType: "verified", 
    functionalType: "financial",
    name: "FinanceBot Alpha",
    description: "High-frequency trading agent specialized in market making"
  },
  {
    did: "did:demo:voice-agent-beta", 
    agentType: "physical",
    functionalType: "voice",
    name: "VoiceAssist Beta", 
    description: "Customer service voice agent with HIPAA compliance"
  },
  {
    did: "did:demo:coding-agent-gamma",
    agentType: "ephemeral",
    functionalType: "coding", 
    name: "CodeGen Gamma",
    description: "AI coding assistant for software development",
    sponsor: "did:demo:financial-agent-alpha"
  },
  {
    did: "did:demo:general-agent-delta",
    agentType: "session",
    functionalType: "general",
    name: "GeneralAI Delta",
    description: "General purpose conversational agent"
  }
];

// Demo evidence manifests
const DEMO_EVIDENCE = [
  {
    agentDid: "did:demo:financial-agent-alpha",
    sha256: "a1b2c3d4e5f6789012345678901234567890abcdef123456789abcdef123456", 
    uri: "https://demo.lucian.ai/evidence/trade-execution-log-1",
    signer: "did:demo:financial-agent-alpha",
    model: {
      provider: "openai",
      name: "gpt-4",
      version: "2024-08-01",
      temp: 0.1
    },
    tool: "trading-executor"
  },
  {
    agentDid: "did:demo:voice-agent-beta",
    sha256: "b2c3d4e5f6789012345678901234567890abcdef123456789abcdef1234567a",
    uri: "https://demo.lucian.ai/evidence/voice-transcript-secure",
    signer: "did:demo:voice-agent-beta", 
    model: {
      provider: "anthropic",
      name: "claude-3-sonnet",
      version: "20240229",
      temp: 0.0
    },
    tool: "voice-transcription"
  }
];

// Demo disputes to file
const DEMO_DISPUTES = [
  {
    parties: ["did:demo:financial-agent-alpha", "did:demo:voice-agent-beta"],
    type: "SLA_MISS",
    description: "FinanceBot Alpha failed to execute trade within promised 100ms SLA",
    jurisdictionTags: ["financial", "trading", "sla"],
    evidenceIds: [] // Will be populated after evidence creation
  },
  {
    parties: ["did:demo:coding-agent-gamma", "did:demo:general-agent-delta"], 
    type: "FORMAT_INVALID",
    description: "CodeGen Gamma returned improperly formatted JSON response",
    jurisdictionTags: ["coding", "format", "api"],
    evidenceIds: []
  }
];

// Demo judges
const DEMO_JUDGES = [
  {
    did: "did:judge:alice-commercial",
    name: "Judge Alice Chen",
    specialties: ["commercial", "sla", "trading"]
  },
  {
    did: "did:judge:bob-technical", 
    name: "Judge Bob Martinez",
    specialties: ["technical", "format", "api"]
  },
  {
    did: "did:judge:carol-ethics",
    name: "Judge Carol Thompson", 
    specialties: ["ethics", "privacy", "general"]
  }
];

async function apiCall(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`❌ API call failed for ${endpoint}:`, error.message);
    return { error: error.message };
  }
}

async function createDemoAgents() {
  console.log('\n🤖 Creating demo agents...');
  
  for (const agent of DEMO_AGENTS) {
    console.log(`  Creating ${agent.name} (${agent.agentType})...`);
    
    const result = await apiCall('/agents/register', 'POST', {
      did: agent.did,
      agentType: agent.agentType,
      functionalType: agent.functionalType,
      sponsor: agent.sponsor
    });
    
    if (result.error) {
      console.log(`    ⚠️  ${result.error}`);
    } else {
      console.log(`    ✅ Created: ${agent.did}`);
    }
  }
}

async function createDemoJudges() {
  console.log('\n⚖️  Creating demo judges...');
  
  // First check if demo judges already exist using the internal demo creation
  const result = await apiCall('/judges/demo', 'POST', {});
    
  if (result.error) {
    console.log(`    ⚠️  ${result.error}`);
  } else {
    console.log(`    ✅ Created demo judges: Alice, Bob, Charlie`);
  }
}

async function createDemoEvidence() {
  console.log('\n📋 Creating demo evidence...');
  
  for (const evidence of DEMO_EVIDENCE) {
    console.log(`  Creating evidence for ${evidence.agentDid}...`);
    
    const result = await apiCall('/evidence/write', 'POST', {
      ...evidence,
      ts: Date.now()
    });
    
    if (result.error) {
      console.log(`    ⚠️  ${result.error}`);
    } else {
      console.log(`    ✅ Created evidence: ${evidence.sha256.substring(0, 16)}...`);
    }
  }
}

async function createDemoDisputes() {
  console.log('\n⚖️  Filing demo disputes...');
  
  for (const dispute of DEMO_DISPUTES) {
    console.log(`  Filing dispute: ${dispute.type}...`);
    
    const result = await apiCall('/disputes/file', 'POST', {
      parties: dispute.parties,
      type: dispute.type,
      jurisdictionTags: dispute.jurisdictionTags,
      evidenceIds: dispute.evidenceIds
    });
    
    if (result.error) {
      console.log(`    ⚠️  ${result.error}`);
    } else {
      console.log(`    ✅ Filed dispute: ${dispute.type}`);
    }
  }
}

async function runSystemDemo() {
  console.log('🏛️  LUCIAN AI AGENT COURT SYSTEM DEMO');
  console.log('=====================================');
  console.log('Populating your system with demo data...\n');
  
  // Create all demo data
  await createDemoJudges();
  await createDemoAgents();
  await createDemoEvidence();
  await createDemoDisputes();
  
  console.log('\n🎉 DEMO DATA CREATION COMPLETE!');
  console.log('\nNext steps:');
  console.log('1. Open demo/index.html in your browser');
  console.log('2. Click "Refresh Stats" to see your populated system');
  console.log('3. Try filing new disputes or registering agents');
  console.log('4. Check the System Activity section for live updates');
  
  console.log('\nAPI Endpoints available:');
  console.log(`  - ${API_BASE}/agents`);
  console.log(`  - ${API_BASE}/cases`);
  console.log(`  - ${API_BASE}/judges`);
  console.log(`  - ${API_BASE}/evidence`);
  console.log(`  - ${API_BASE}/.well-known/lucian`);
}

// Check if we can reach the API
async function checkAPI() {
  try {
    const result = await apiCall('/.well-known/lucian');
    if (result.error) {
      console.error('❌ Cannot reach Convex backend. Make sure you run:');
      console.error('   pnpm dev');
      console.error('   (or convex dev if using convex directly)');
      process.exit(1);
    }
    console.log('✅ Convex backend is running');
  } catch (error) {
    console.error('❌ Cannot reach Convex backend:', error.message);
    console.error('   Make sure your dev server is running: pnpm dev');
    process.exit(1);
  }
}

// Run the demo
if (process.argv[1] === __filename) {
  checkAPI().then(() => {
    runSystemDemo().catch((error) => {
      console.error('Demo failed:', error);
      process.exit(1);
    });
  });
}

export { runSystemDemo, createDemoAgents, createDemoJudges, createDemoEvidence, createDemoDisputes };
