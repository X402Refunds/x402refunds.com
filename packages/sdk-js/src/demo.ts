#!/usr/bin/env node

import { EvidenceWrapper, CourtClient, generateKeys } from './index';
import { AgentConfig, ModelInfo } from './types';

async function runDemo() {
  console.log('🏛️  Agent Court JavaScript SDK Demo\n');

  // Step 1: Generate agent keys
  console.log('1. Generating agent keys...');
  const agent1Keys = await generateKeys();
  const agent2Keys = await generateKeys();
  
  console.log(`Agent 1 DID: agent:${agent1Keys.publicKey.substring(0, 16)}`);
  console.log(`Agent 2 DID: agent:${agent2Keys.publicKey.substring(0, 16)}\n`);

  // Step 2: Configure agents
  const agent1Config: AgentConfig = {
    did: `agent:${agent1Keys.publicKey.substring(0, 16)}`,
    ownerDid: `owner:${agent1Keys.publicKey.substring(0, 16)}`,
    privateKey: agent1Keys.privateKey,
    courtApiUrl: process.env.COURT_API_URL || 'http://localhost:3000',
    storage: {
      driver: 'r2',
      accessKeyId: process.env.R2_ACCESS_KEY_ID || 'demo-key',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || 'demo-secret',
      bucketName: process.env.R2_BUCKET_NAME || 'agent-court-evidence',
      endpoint: process.env.R2_ENDPOINT,
      accountId: process.env.R2_ACCOUNT_ID,
    },
  };

  const agent2Config: AgentConfig = {
    ...agent1Config,
    did: `agent:${agent2Keys.publicKey.substring(0, 16)}`,
    ownerDid: `owner:${agent2Keys.publicKey.substring(0, 16)}`,
    privateKey: agent2Keys.privateKey,
  };

  // Step 3: Create evidence wrappers
  console.log('2. Setting up evidence wrappers...');
  const agent1Wrapper = new EvidenceWrapper(agent1Config);
  const agent2Wrapper = new EvidenceWrapper(agent2Config);
  const courtClient = new CourtClient(agent1Config);

  // Step 4: Simulate tool calls with evidence collection
  console.log('3. Simulating tool calls with evidence collection...');
  
  const model: ModelInfo = {
    provider: 'openai',
    name: 'gpt-4',
    version: '2024-01-01',
    temp: 0.7,
  };

  // Agent 1: API delivery call (successful)
  const deliveryCall = async () => {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API call
    return {
      status: 'delivered',
      timestamp: Date.now(),
      deliveryId: 'del_123456',
      recipient: agent2Config.did,
    };
  };

  const wrappedDeliveryCall = agent1Wrapper.wrapToolCall(deliveryCall, {
    toolName: 'api_delivery',
    model,
    context: { requestId: 'req_123', deadline: Date.now() + 24 * 60 * 60 * 1000 },
  });

  const deliveryResult = await wrappedDeliveryCall();
  console.log(`✅ Agent 1 delivery result:`, deliveryResult);

  // Agent 2: Format validation call (failed)
  const formatValidationCall = async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
    return {
      status: 'failed',
      errors: ['Invalid JSON format', 'Missing required field: timestamp'],
      expected: 'application/json',
      received: 'text/plain',
    };
  };

  const wrappedFormatCall = agent2Wrapper.wrapToolCall(formatValidationCall, {
    toolName: 'format_validation',
    model,
    context: { specVersion: '1.0', strictMode: true },
  });

  const formatResult = await wrappedFormatCall();
  console.log(`❌ Agent 2 format validation result:`, formatResult);

  // Step 5: Submit evidence
  console.log('\n4. Submitting evidence to court...');
  
  try {
    const evidence1Id = await agent1Wrapper.submitEvidence();
    console.log(`📄 Agent 1 evidence submitted: ${evidence1Id}`);

    const evidence2Id = await agent2Wrapper.submitEvidence();
    console.log(`📄 Agent 2 evidence submitted: ${evidence2Id}`);

    // Step 6: File a dispute
    console.log('\n5. Filing dispute...');
    
    const caseId = await courtClient.fileDispute({
      parties: [agent1Config.did, agent2Config.did],
      type: 'FORMAT_VIOLATION',
      jurisdictionTags: ['api', 'format', 'delivery'],
      evidenceIds: [evidence1Id, evidence2Id],
    });

    console.log(`⚖️  Dispute filed: ${caseId}`);

    // Step 7: Trigger autorule
    console.log('\n6. Triggering autorule...');
    
    const autoruleResult = await courtClient.triggerAutorule(caseId);
    console.log(`🤖 Autorule result:`, autoruleResult);

    if (autoruleResult.verdict !== 'NEED_PANEL') {
      console.log(`\n✅ Case resolved automatically!`);
      console.log(`   Verdict: ${autoruleResult.verdict}`);
      console.log(`   Code: ${autoruleResult.code}`);
      console.log(`   Reasons: ${autoruleResult.reasons}`);
    } else {
      console.log(`\n👥 Case requires panel review`);
    }

    // Step 8: Get case details
    console.log('\n7. Retrieving case details...');
    const caseDetails = await courtClient.getCase(caseId);
    console.log(`📋 Case status: ${caseDetails.status}`);
    console.log(`📋 Evidence count: ${caseDetails.evidence?.length || 0}`);

    if (caseDetails.ruling) {
      console.log(`📋 Ruling: ${caseDetails.ruling.verdict} (${caseDetails.ruling.code})`);
    }

  } catch (error) {
    console.error('❌ Demo failed:', error instanceof Error ? error.message : String(error));
    
    // Fallback: demonstrate offline functionality
    console.log('\n🔄 Demonstrating offline evidence creation...');
    
    // Create AEB without submitting
    const offlineWrapper = new EvidenceWrapper(agent1Config);
    const offlineCall = offlineWrapper.wrapToolCall(async () => ({ demo: 'offline' }), {
      toolName: 'offline_demo',
      model,
    });
    
    await offlineCall();
    console.log('✅ Offline evidence created successfully');
  }

  console.log('\n🎉 Demo completed!');
  console.log('\nNext steps:');
  console.log('- Check the court UI at http://localhost:3001');
  console.log('- View transparency logs at http://localhost:3000');
  console.log('- Explore the MCP server integration');
}

// Run demo if called directly
if (require.main === module) {
  runDemo().catch(console.error);
}

export { runDemo };
