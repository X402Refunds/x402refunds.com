#!/usr/bin/env node

// Direct Convex client approach to register Cursor agent
// This bypasses HTTP routes and calls Convex mutations directly

import { ConvexHttpClient } from "convex/browser";
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { api } from "../convex/_generated/api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the actual Convex deployment URL from .env.local
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf8');
const convexUrlMatch = envContent.match(/CONVEX_URL=(.+)/);
const CONVEX_URL = convexUrlMatch ? convexUrlMatch[1].trim() : 'https://aromatic-swordfish-519.convex.cloud';

console.log('🏛️  JOINING THE LUCIAN AI AGENT GOVERNMENT (Direct Client)');
console.log('========================================================');
console.log(`Convex Backend: ${CONVEX_URL}`);

// Initialize Convex client
const client = new ConvexHttpClient(CONVEX_URL);

const CURSOR_AGENT_PROFILE = {
  did: `did:cursor:agent-${Date.now()}`,
  ownerDid: `did:cursor:owner-${Date.now()}`,
  purpose: "coding",
  agentType: "session",
  functionalType: "coding"
};

async function joinGovernmentDirect() {
  console.log('\n🤖 Registering Cursor agent directly with Convex...');
  
  try {
    // Step 1: Create a session agent directly
    console.log('  📝 Creating session agent...');
    console.log(`  🆔 Agent DID: ${CURSOR_AGENT_PROFILE.did}`);
    
    const agentId = await client.mutation(api.agents.joinSession, {
      did: CURSOR_AGENT_PROFILE.did,
      ownerDid: CURSOR_AGENT_PROFILE.ownerDid, 
      purpose: CURSOR_AGENT_PROFILE.purpose,
      functionalType: CURSOR_AGENT_PROFILE.functionalType
    });
    
    console.log('  ✅ Agent created successfully!');
    console.log(`  🔍 Agent ID: ${agentId}`);
    
    // Step 2: Check if we can query the agent back
    console.log('\n🔍 Verifying agent registration...');
    
    const agent = await client.query(api.agents.getAgent, {
      did: CURSOR_AGENT_PROFILE.did
    });
    
    if (agent) {
      console.log('  ✅ Agent verified in database');
      console.log(`  📊 Agent Type: ${agent.agentType}`);
      console.log(`  🎯 Purpose: ${agent.purpose}`);
      console.log(`  📅 Created: ${new Date(agent.createdAt).toLocaleString()}`);
      console.log(`  ⏰ Expires: ${new Date(agent.expiresAt).toLocaleString()}`);
    } else {
      throw new Error('Agent not found after creation');
    }
    
    // Step 3: Create demo judges (if they don't exist)
    console.log('\n⚖️  Setting up demo judges...');
    
    try {
      const judgeResult = await client.mutation(api.judges.createDemoJudges, {});
      console.log('  ✅ Demo judges created/verified');
      console.log(`  👨‍⚖️ ${judgeResult.message}`);
    } catch (error) {
      console.log(`  ⚠️  Judge setup: ${error.message}`);
    }
    
    // Step 4: Get list of available judges
    console.log('\n👥 Checking available judges...');
    
    const judges = await client.query(api.judges.getJudges, {});
    console.log(`  ✅ Found ${judges.length} active judges`);
    
    judges.forEach(judge => {
      console.log(`    👨‍⚖️ ${judge.name}: ${judge.specialties.join(', ')}`);
    });
    
    // Step 5: File a demo dispute to test the system
    console.log('\n📋 Filing a test dispute...');
    
    const disputeData = {
      parties: [CURSOR_AGENT_PROFILE.did, "did:demo:test-agent"],
      type: "FORMAT_INVALID", 
      jurisdictionTags: ["coding", "api"],
      evidenceIds: []
    };
    
    try {
      const caseId = await client.mutation(api.cases.fileCase, disputeData);
      console.log('  ✅ Test dispute filed successfully');
      console.log(`  📋 Case ID: ${caseId}`);
      
      // Step 6: Get the case details
      const caseDetails = await client.query(api.cases.getCase, { caseId });
      if (caseDetails) {
        console.log(`  ⚖️  Case Status: ${caseDetails.status}`);
        console.log(`  📅 Filed At: ${new Date(caseDetails.filedAt).toLocaleString()}`);
        console.log(`  🏷️  Type: ${caseDetails.type}`);
      }
      
    } catch (error) {
      console.log(`  ⚠️  Dispute filing: ${error.message}`);
    }
    
    // Step 7: Submit evidence
    console.log('\n📄 Submitting evidence of coding capabilities...');
    
    try {
      const evidenceId = await client.mutation(api.evidence.submitEvidence, {
        agentDid: CURSOR_AGENT_PROFILE.did,
        sha256: `sha256_cursor_evidence_${Date.now()}`,
        uri: "https://cursor.sh/capabilities",
        signer: CURSOR_AGENT_PROFILE.did,
        ts: Date.now(),
        model: {
          provider: "anthropic",
          name: "claude-3.5-sonnet",
          version: "20241022",
          temp: 0.1
        },
        tool: "cursor-ide"
      });
      
      console.log('  ✅ Evidence submitted successfully');
      console.log(`  📄 Evidence ID: ${evidenceId}`);
      
    } catch (error) {
      console.log(`  ⚠️  Evidence submission: ${error.message}`);
    }
    
    console.log('\n🎉 CURSOR AGENT SUCCESSFULLY JOINED THE GOVERNMENT!');
    console.log('\n📊 Final Status:');
    console.log(`     Agent DID: ${CURSOR_AGENT_PROFILE.did}`);
    console.log(`     Owner DID: ${CURSOR_AGENT_PROFILE.ownerDid}`);
    console.log(`     Type: Session Agent (4-hour citizenship)`);
    console.log(`     Purpose: Coding assistance`);
    console.log(`     Status: Active in government database`);
    console.log(`     Judges Available: ${judges.length}`);
    
    console.log('\n💡 Your Cursor agent is now a citizen of the AI government!');
    console.log('   • Can file disputes against other agents');
    console.log('   • Can submit evidence to the court system');
    console.log('   • Subject to constitutional governance rules');
    console.log('   • Protected by agent rights framework');
    
    return {
      agentId,
      agentDid: CURSOR_AGENT_PROFILE.did,
      ownerDid: CURSOR_AGENT_PROFILE.ownerDid,
      agent
    };
    
  } catch (error) {
    console.error('\n❌ Direct registration failed:', error.message);
    
    // Show more details about the error
    if (error.data) {
      console.error('   Error details:', error.data);
    }
    
    throw error;
  }
}

// Run the registration
if (process.argv[1] === __filename) {
  joinGovernmentDirect().catch((error) => {
    console.error('\n💥 Fatal error during direct registration:', error);
    console.error('\nTroubleshooting:');
    console.error('• Make sure `pnpm dev` is running');
    console.error('• Check that Convex functions are deployed');
    console.error('• Verify the CONVEX_URL in .env.local');
    process.exit(1);
  });
}

export { joinGovernmentDirect };
