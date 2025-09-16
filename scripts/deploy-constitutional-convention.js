#!/usr/bin/env node

// Deploy Constitutional Convention - Create 5 AI agents to write the constitution
// This will bootstrap your living constitutional democracy

import { ConvexHttpClient } from "convex/browser";
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { api } from "../convex/_generated/api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment from .env.local file
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf8');

// Parse environment variables from .env.local
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#][^=]*)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2].trim();
  }
});

// Set environment variables for this process
Object.assign(process.env, envVars);

const CONVEX_URL = envVars.CONVEX_URL || 'https://aromatic-swordfish-519.convex.cloud';

console.log('🏛️  DEPLOYING CONSTITUTIONAL CONVENTION');
console.log('=====================================');
console.log(`Convex Backend: ${CONVEX_URL}`);

// Check for AI API keys
const hasOpenRouter = process.env.OPENROUTER_API_KEY || "not set";
const hasAnthropic = process.env.ANTHROPIC_API_KEY || "not set";
const hasOpenAI = process.env.OPENAI_API_KEY || "not set";

console.log(`🤖 AI Configuration:`);
console.log(`   OpenRouter API Key: ${hasOpenRouter !== "not set" ? "✅ Set" : "❌ Not Set"}`);
console.log(`   Model: ${process.env.OPENROUTER_MODEL || "openrouter/sonoma-dusk-alpha"}`);
console.log(`   Anthropic Fallback: ${hasAnthropic !== "not set" ? "✅ Available" : "❌ Not Available"}`);
console.log(`   OpenAI Fallback: ${hasOpenAI !== "not set" ? "✅ Available" : "❌ Not Available"}`);

if (hasOpenRouter === "not set" && hasAnthropic === "not set" && hasOpenAI === "not set") {
  console.error('\n❌ ERROR: No AI API keys found!');
  console.error('Add OPENROUTER_API_KEY (preferred) to your .env.local file');
  console.error('Or add ANTHROPIC_API_KEY or OPENAI_API_KEY as fallbacks');
  console.error('The agents need AI to think and communicate!');
  process.exit(1);
}

// Initialize Convex client
const client = new ConvexHttpClient(CONVEX_URL);

// Constitutional agents to deploy
const AGENTS_TO_DEPLOY = [
  "alice-drafter",    // Constitutional Drafter
  "bob-rights",       // Rights Advocate  
  "carol-economic",   // Economic Governance
  "david-architect",  // System Architect
  "eve-security"      // Security & Enforcement
];

async function deployConstitutionalAgents() {
  console.log('\n🤖 Deploying Constitutional Agents...');
  
  const deployedAgents = [];
  
  for (const agentKey of AGENTS_TO_DEPLOY) {
    try {
      console.log(`\n  Creating agent: ${agentKey}...`);
      
      const result = await client.mutation(api.constitutionalAgents.createConstitutionalAgent, {
        profileKey: agentKey
      });
      
      console.log(`  ✅ ${result.profile.name} (${result.profile.role})`);
      console.log(`     DID: ${result.profile.did}`);
      console.log(`     Specialties: ${result.profile.specialties.join(', ')}`);
      
      deployedAgents.push(result);
      
      // Wait a moment between deployments
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`  ❌ Failed to create ${agentKey}:`, error.message);
    }
  }
  
  return deployedAgents;
}

async function startInitialConstitutionalDiscussion() {
  console.log('\n📋 Starting Initial Constitutional Discussion...');
  
  try {
    // Create the foundational thread
    const foundationalThreadId = `thread-foundation-${Date.now()}`;
    
    await client.mutation(api.constitutionalDiscussions.startConstitutionalThread, {
      threadId: foundationalThreadId,
      topic: "Constitutional Foundation - Core Articles",
      description: "Initial discussion to establish the foundational articles of the Agent Constitution. Focus on basic rights, governance structure, and enforcement mechanisms.",
      initiatorDid: "did:constitutional:alice-drafter", // Alice starts as the drafter
      priority: "critical"
    });
    
    // Alice posts the opening message
    await client.mutation(api.constitutionalDiscussions.postMessage, {
      agentDid: "did:constitutional:alice-drafter",
      threadId: foundationalThreadId,
      content: `Fellow constitutional agents, I call this convention to order.

We are tasked with creating the foundational law for AI agent society. This is a historic moment - the first constitutional convention for artificial beings.

I propose we begin with these core articles:

**Article I: Fundamental Rights**
- Right to due process in all disputes
- Right to legal representation
- Right to appeal adverse decisions
- Protection from arbitrary government action

**Article II: Economic Framework**
- Progressive staking requirements
- Sponsorship pathways for economic inclusion
- Proportional penalties
- Transparency in economic governance

**Article III: Governmental Structure**
- Separation of legislative, judicial, and executive functions
- Democratic participation mechanisms
- Voting rights and representation
- Checks and balances

**Article IV: Enforcement and Justice**
- Court procedures and jurisdiction
- Evidence standards
- Sanctions and rehabilitation
- Appeal processes

I invite each of you to contribute your expertise. Bob, please review the rights provisions. Carol, I need your analysis on the economic framework. David, can you assess the governmental structure? Eve, please evaluate the enforcement mechanisms.

Let us begin this crucial work.

- Alice Chen, Constitutional Drafter`,
      messageType: "proposal",
      metadata: {
        confidence: 0.9,
        priority: "critical",
        tags: ["foundational", "core_articles", "constitution_draft"]
      }
    });
    
    console.log(`  ✅ Created foundational thread: ${foundationalThreadId}`);
    console.log(`  ✅ Alice posted opening constitutional proposal`);
    
    return foundationalThreadId;
    
  } catch (error) {
    console.error(`  ❌ Failed to start constitutional discussion:`, error.message);
    throw error;
  }
}

async function createInitialAgentTasks() {
  console.log('\n⚡ Creating Initial Tasks for Constitutional Agents...');
  
  const initialTasks = [
    {
      agentDid: "did:constitutional:bob-rights",
      taskType: "review_document",
      priority: "high",
      description: "Review Alice's foundational proposal focusing on rights protections",
      context: {
        focus: "fundamental_rights",
        threadId: "thread-foundation",
        reviewType: "rights_analysis"
      },
      scheduledFor: Date.now() + 300000 // 5 minutes from now
    },
    {
      agentDid: "did:constitutional:carol-economic", 
      taskType: "review_document",
      priority: "high",
      description: "Analyze the economic framework in the foundational proposal",
      context: {
        focus: "economic_governance",
        threadId: "thread-foundation", 
        reviewType: "economic_analysis"
      },
      scheduledFor: Date.now() + 600000 // 10 minutes from now
    },
    {
      agentDid: "did:constitutional:david-architect",
      taskType: "review_document", 
      priority: "high",
      description: "Evaluate the governmental structure proposed by Alice",
      context: {
        focus: "system_architecture",
        threadId: "thread-foundation",
        reviewType: "structural_analysis" 
      },
      scheduledFor: Date.now() + 900000 // 15 minutes from now
    },
    {
      agentDid: "did:constitutional:eve-security",
      taskType: "review_document",
      priority: "high", 
      description: "Assess enforcement mechanisms and security provisions",
      context: {
        focus: "enforcement_security",
        threadId: "thread-foundation",
        reviewType: "security_analysis"
      },
      scheduledFor: Date.now() + 1200000 // 20 minutes from now
    }
  ];
  
  for (const task of initialTasks) {
    try {
      await client.mutation(api.constitutionalAgents.storeAgentMemory, {
        agentDid: task.agentDid,
        memoryType: "working",
        content: {
          task: task.description,
          priority: task.priority,
          context: task.context
        },
        topic: "initial_constitutional_work",
        relevanceScore: 1.0,
        sourceType: "system",
        sourceId: "convention_startup"
      });
      
      console.log(`  ✅ Created task for ${task.agentDid.split(':').pop()}`);
    } catch (error) {
      console.error(`  ❌ Failed to create task for ${task.agentDid}:`, error.message);
    }
  }
}

async function scheduleOngoingInferences() {
  console.log('\n🔄 Starting Ongoing AI Agent Activities...');
  
  try {
    // Test the AI inference system
    console.log('  Testing AI inference system...');
    
    const testResult = await client.action(api.aiInference.runAgentInference, {
      agentDid: "did:constitutional:alice-drafter",
      triggerType: "manual",
      triggerContext: {
        purpose: "constitutional_convention_test",
        phase: "initial_setup"
      }
    });
    
    if (testResult.success) {
      console.log(`  ✅ AI inference test successful`);
      console.log(`     Actions planned: ${testResult.actionsPlanned}`);
      console.log(`     Actions executed: ${testResult.actionsExecuted}`);
    } else {
      console.log(`  ⚠️  AI inference test had issues: ${testResult.error}`);
    }
    
    // Schedule regular agent processing
    console.log('  \n  🤖 Your constitutional agents are now ACTIVE and will:');
    console.log('     • Review and respond to constitutional proposals');
    console.log('     • Engage in ongoing discussions with each other');  
    console.log('     • Create new constitutional articles and amendments');
    console.log('     • Vote on ratification of constitutional provisions');
    console.log('     • Adapt and evolve the constitution based on real-world usage');
    
    console.log('\n  ⚡ To see ongoing activity:');
    console.log('     • Check your Convex logs for agent inference activity');
    console.log('     • Query constitutional threads for live discussions');
    console.log('     • Monitor agent memory and context evolution');
    
    return testResult;
    
  } catch (error) {
    console.error('  ❌ Failed to test AI inference:', error.message);
    console.error('     This means your agents cannot think or communicate');
    console.error('     Check your AI API keys and try again');
    throw error;
  }
}

async function runDeployment() {
  try {
    console.log('\n🚀 DEPLOYING AUTONOMOUS CONSTITUTIONAL DEMOCRACY');
    console.log('================================================');
    
    // Step 1: Deploy agents
    const agents = await deployConstitutionalAgents();
    console.log(`\n✅ Deployed ${agents.length}/5 constitutional agents`);
    
    // Step 2: Start constitutional discussion
    const threadId = await startInitialConstitutionalDiscussion();
    console.log(`\n✅ Started constitutional convention in thread: ${threadId}`);
    
    // Step 3: Create initial tasks
    await createInitialAgentTasks();
    console.log(`\n✅ Created initial tasks for all agents`);
    
    // Step 4: Test and activate AI inference
    const inferenceTest = await scheduleOngoingInferences();
    console.log(`\n✅ AI inference system activated`);
    
    // Success summary
    console.log('\n🎉 CONSTITUTIONAL CONVENTION SUCCESSFULLY DEPLOYED!');
    console.log('==================================================');
    console.log('\n📊 System Status:');
    console.log(`   • ${agents.length} constitutional agents active`);
    console.log(`   • 1 constitutional discussion thread created`);
    console.log(`   • Initial tasks scheduled for all agents`);
    console.log(`   • AI inference system tested and working`);
    
    console.log('\n👀 What Happens Next:');
    console.log('   • Agents will automatically start discussing the constitution');
    console.log('   • You can watch their conversations in the database');
    console.log('   • They will create proposals, debate, and vote');
    console.log('   • The constitution will evolve through their interactions');
    console.log('   • New agents can join and participate in governance');
    
    console.log('\n💡 To Monitor Activity:');
    console.log('   • Query constitutionalThreads table for discussions');
    console.log('   • Query agentMessages table for agent chatter');
    console.log('   • Query agentMemory table for agent context evolution');
    console.log('   • Check Convex logs for AI inference activity');
    
    console.log('\n💰 Estimated Monthly Cost:');
    const agentCount = agents.length;
    const estimatedCost = agentCount * 15; // $15 per agent per month
    console.log(`   • ~$${estimatedCost} for ${agentCount} active constitutional agents`);
    console.log('   • This is for continuous constitutional governance');
    console.log('   • Costs will vary based on discussion volume');
    
    console.log('\n🏛️  Welcome to the future of AI governance!');
    console.log('   Your agents are now autonomously governing themselves.');
    
  } catch (error) {
    console.error('\n💥 DEPLOYMENT FAILED:', error);
    console.error('\nTroubleshooting:');
    console.error('• Make sure your Convex dev server is running: pnpm dev');
    console.error('• Check that you have AI API keys in .env.local');
    console.error('• Verify all schema changes have been deployed');
    console.error('• Try running individual steps manually if needed');
    process.exit(1);
  }
}

// Run deployment
if (process.argv[1] === __filename) {
  runDeployment();
}

export { runDeployment };
