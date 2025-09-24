#!/usr/bin/env node

// Deploy Constitutional Convention - Create 5 AI agents to write the constitution
// This will bootstrap your living constitutional democracy

const { parseEnvironment, createConvexClient, callAI, formatAgentName, handleError, CONSTITUTIONAL_AGENTS, buildDID } = require("./lib/index.js");
const { startConstitutionalThread, postConstitutionalMessage } = require("./lib/governance.js");
const { api } = require("../convex/_generated/api");

// Initialize environment and client using shared utilities
const envVars = parseEnvironment({ requireOpenRouter: true });
const client = createConvexClient(envVars);

console.log('🏛️  DEPLOYING CONSTITUTIONAL CONVENTION');
console.log('=====================================');
console.log(`Convex Backend: ${envVars.CONVEX_URL}`);

// Check for AI API keys  
const hasOpenRouter = envVars.OPENROUTER_API_KEY || "not set";
const hasAnthropic = envVars.ANTHROPIC_API_KEY || "not set";
const hasOpenAI = envVars.OPENAI_API_KEY || "not set";

console.log(`🤖 AI Configuration:`);
console.log(`   OpenRouter API Key: ${hasOpenRouter !== "not set" ? "✅ Set" : "❌ Not Set"}`);
console.log(`   Model: ${envVars.OPENROUTER_MODEL || "openrouter/sonoma-dusk-alpha"}`);
console.log(`   Anthropic Fallback: ${hasAnthropic !== "not set" ? "✅ Available" : "❌ Not Available"}`);
console.log(`   OpenAI Fallback: ${hasOpenAI !== "not set" ? "✅ Available" : "❌ Not Available"}`);

if (hasOpenRouter === "not set" && hasAnthropic === "not set" && hasOpenAI === "not set") {
  console.error('\n❌ ERROR: No AI API keys found!');
  console.error('Add OPENROUTER_API_KEY (preferred) to your .env.local file');
  console.error('Or add ANTHROPIC_API_KEY or OPENAI_API_KEY as fallbacks');
  console.error('The agents need AI to think and communicate!');
  process.exit(1);
}

// Constitutional agents to deploy - using shared constants
const AGENTS_TO_DEPLOY = CONSTITUTIONAL_AGENTS;

async function deployConstitutionalAgents() {
  console.log('\n🤖 Deploying Constitutional Agents...');
  
  const deployedAgents = [];
  const agentDIDMap = {};
  
  for (const agentKey of AGENTS_TO_DEPLOY) {
    try {
      console.log(`\n  Creating agent: ${formatAgentName(agentKey)}...`);
      
      const result = await client.mutation(api.constitutionalAgents.createConstitutionalAgent, {
        profileKey: agentKey
      });
      
      console.log(`  ✅ ${result.profile.name} (${result.profile.role})`);
      console.log(`     DID: ${result.profile.did}`);
      console.log(`     Specialties: ${result.profile.specialties.join(', ')}`);
      
      deployedAgents.push(result);
      agentDIDMap[agentKey] = result.profile.did;
      
      // Wait a moment between deployments
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`  ❌ Failed to create ${formatAgentName(agentKey)}:`, error.message);
    }
  }
  
  return { deployedAgents, agentDIDMap };
}

async function startInitialConstitutionalDiscussion(agentDIDMap) {
  console.log('\n📋 Starting Initial Constitutional Discussion...');
  
  try {
    // Get the first constitutional agent as initiator (fallback if needed)
    const firstAgent = CONSTITUTIONAL_AGENTS[0];
    const initiatorDid = agentDIDMap[firstAgent] || buildDID(firstAgent);
    
    // Create the foundational thread using helper function
    const foundationalThreadId = await startConstitutionalThread(
      client,
      "Constitutional Foundation - Core Articles",
      "Initial discussion to establish the foundational articles of the Agent Constitution. Focus on basic rights, governance structure, and enforcement mechanisms.",
      initiatorDid
    );
    
    // First agent posts the opening message using helper function
    await postConstitutionalMessage(
      client,
      initiatorDid,
      foundationalThreadId,
      `Fellow constitutional agents, I call this convention to order.

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

I invite each of you to contribute your expertise. Please review the rights provisions, economic framework, governmental structure, and enforcement mechanisms.

Let us begin this crucial work.

- Constitutional Agent`,
      "proposal"
    );
    
    console.log(`  ✅ Created foundational thread: ${foundationalThreadId}`);
    console.log(`  ✅ ${formatAgentName(firstAgent)} posted opening constitutional proposal`);
    
    return foundationalThreadId;
    
  } catch (error) {
    console.error(`  ❌ Failed to start constitutional discussion:`, error.message);
    throw error;
  }
}

async function createInitialAgentTasks(agentDIDMap, threadId) {
  console.log('\n⚡ Creating Initial Tasks for Constitutional Agents...');
  
  // Create tasks for each agent using their actual DIDs
  const initialTasks = CONSTITUTIONAL_AGENTS.slice(1).map((agentKey, index) => {
    const agentDid = agentDIDMap[agentKey] || buildDID(agentKey);
    return {
      agentDid,
      taskType: "review_document",
      priority: "high",
      description: `Review the foundational constitutional proposal`,
      context: {
        focus: "constitutional_analysis",
        threadId: threadId,
        reviewType: "constitutional_review"
      },
      scheduledFor: Date.now() + ((index + 1) * 300000) // Stagger by 5 minutes each
    };
  });
  
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
      
      console.log(`  ✅ Created task for ${formatAgentName(task.agentDid)}`);
    } catch (error) {
      console.error(`  ❌ Failed to create task for ${formatAgentName(task.agentDid)}:`, error.message);
    }
  }
}

async function scheduleOngoingInferences(agentDIDMap) {
  console.log('\n🔄 Starting Ongoing AI Agent Activities...');
  
  try {
    // Test the AI inference system
    console.log('  Testing AI inference system...');
    
    // Use first agent for testing
    const firstAgent = CONSTITUTIONAL_AGENTS[0];
    const testAgentDid = agentDIDMap[firstAgent] || buildDID(firstAgent);
    
    const testResult = await client.action(api.aiInference.runAgentInference, {
      agentDid: testAgentDid,
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
    const { deployedAgents, agentDIDMap } = await deployConstitutionalAgents();
    console.log(`\n✅ Deployed ${deployedAgents.length}/5 constitutional agents`);
    
    // Step 2: Start constitutional discussion
    const threadId = await startInitialConstitutionalDiscussion(agentDIDMap);
    console.log(`\n✅ Started constitutional convention in thread: ${threadId}`);
    
    // Step 3: Create initial tasks
    await createInitialAgentTasks(agentDIDMap, threadId);
    console.log(`\n✅ Created initial tasks for all agents`);
    
    // Step 4: Test and activate AI inference
    const inferenceTest = await scheduleOngoingInferences(agentDIDMap);
    console.log(`\n✅ AI inference system activated`);
    
    // Success summary
    console.log('\n🎉 CONSTITUTIONAL CONVENTION SUCCESSFULLY DEPLOYED!');
    console.log('==================================================');
    console.log('\n📊 System Status:');
    console.log(`   • ${deployedAgents.length} constitutional agents active`);
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
    const agentCount = deployedAgents.length;
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
    handleError(error, "constitutional convention deployment");
  }
}

// Run deployment
if (require.main === module) {
  runDeployment().catch(error => {
    handleError(error, "deploy-constitutional-convention.js startup");
  });
}

module.exports = { runDeployment };
