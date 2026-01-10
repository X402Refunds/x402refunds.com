#!/usr/bin/env node
/**
 * Create a test case with signed evidence for dashboard visualization
 * This will trigger the full workflow including signature verification
 */

import https from 'https';

const API_BASE = process.env.API_BASE_URL || 'https://api.x402refunds.com';

// Mock Ed25519 signature (for testing)
const mockSignature = Buffer.from('c'.repeat(64)).toString('base64');

async function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      const bodyStr = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('🔧 Creating test case with signed evidence...\n');

  // Step 1: Register vendor agent
  console.log('1️⃣ Registering vendor agent...');
  const vendorPublicKey = 'MCowBQYDK2VwAyEA8Gz8+Kz8+Kz8+Kz8+Kz8+Kz8+Kz8+Kz8+Kz8+Kz8+Kw=';
  const vendorResult = await makeRequest('/agents/register', 'POST', {
    name: 'Test Vendor API Provider',
    publicKey: vendorPublicKey,
    organizationName: 'Test Vendor Org',
    functionalType: 'api',
  });

  if (vendorResult.status !== 200) {
    console.error('❌ Failed to register vendor:', vendorResult.data);
    process.exit(1);
  }

  const vendorDid = vendorResult.data.agentDid;
  console.log(`✅ Vendor registered: ${vendorDid}\n`);

  // Step 2: Create signed evidence payload
  const request = {
    method: 'POST',
    url: '/v1/chat/completions',
    headers: { 'Authorization': 'Bearer sk-123' },
    body: { model: 'gpt-4', messages: [{ role: 'user', content: 'Hello' }] },
  };

  const response = {
    status: 500,
    statusText: 'Internal Server Error',
    body: { error: 'Service unavailable' },
    headers: {},
  };

  const payload = JSON.stringify({
    request,
    response,
    amountUsd: 15.75,
  });

  // Step 3: File dispute with signed evidence
  console.log('2️⃣ Filing dispute with signed evidence...');
  const disputeUrl = `/disputes/claim?vendor=${encodeURIComponent(vendorDid)}`;
  const disputeResult = await makeRequest(disputeUrl, 'POST', {
    transactionId: `test_txn_${Date.now()}`,
    amount: 15.75,
    amountUsd: 15.75,
    complaint: 'API service returned 500 error but still charged customer. Service not rendered.',
    signature: mockSignature,
    request,
    response,
    currency: 'USD',
    buyerEmail: 'test-consumer@example.com',
    buyerId: 'consumer:test-consumer@example.com',
  });

  if (disputeResult.status !== 200) {
    console.error('❌ Failed to file dispute:', disputeResult.data);
    process.exit(1);
  }

  const caseId = disputeResult.data.caseId;
  console.log(`✅ Dispute filed: ${caseId}`);
  console.log(`\n📋 Case Details:`);
  console.log(`   Case ID: ${caseId}`);
  console.log(`   Vendor: ${vendorDid}`);
  console.log(`   Amount: $15.75`);
  console.log(`   Status: FILED`);
  console.log(`   Signed Evidence: ✅ Yes`);
  console.log(`\n🌐 View in dashboard:`);
  console.log(`   https://x402refunds.com/dashboard/disputes/${caseId}`);
  console.log(`\n💡 Note: The case will appear in review queue once AI analysis completes.`);
  console.log(`   Workflow timeline will show signature verification step!`);
}

main().catch(console.error);

