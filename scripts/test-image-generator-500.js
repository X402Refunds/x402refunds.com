#!/usr/bin/env node
/**
 * Test script for ImageGenerator500 demo agent
 * 
 * Tests:
 * 1. Request without payment (expects 402)
 * 2. Request with invalid body (expects 400)
 * 3. Request with mock payment (expects 500 in test mode)
 * 
 * Usage:
 *   node scripts/test-image-generator-500.js
 */

const API_BASE_URL = process.env.API_BASE_URL || 'https://api.x402disputes.com';
const ENDPOINT = `${API_BASE_URL}/demo-agents/image-generator-500`;

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function test1_NoPayment() {
  log('\n📋 Test 1: Request without payment (expects 402)', 'cyan');
  
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'a dog playing in the park',
        size: '1024x1024',
        model: 'stable-diffusion-xl'
      })
    });
    
    const data = await response.json();
    
    if (response.status === 402) {
      log('✅ Correct status: 402 Payment Required', 'green');
      
      // Check X-402 headers
      const recipient = response.headers.get('X-402-Recipient');
      const network = response.headers.get('X-402-Network');
      const currency = response.headers.get('X-402-Currency');
      
      log(`   Recipient: ${recipient}`, 'blue');
      log(`   Network: ${network}`, 'blue');
      log(`   Currency: ${currency}`, 'blue');
      
      if (recipient === '0x96BDBD233d4ABC11E7C77c45CAE14194332E7381') {
        log('✅ Correct recipient wallet', 'green');
      } else {
        log('❌ Wrong recipient wallet', 'red');
      }
      
      if (network === 'base') {
        log('✅ Correct network (base)', 'green');
      } else {
        log('❌ Wrong network', 'red');
      }
      
      if (currency === 'USDC') {
        log('✅ Correct currency (USDC)', 'green');
      } else {
        log('❌ Wrong currency', 'red');
      }
      
      log(`   Response body: ${JSON.stringify(data, null, 2)}`, 'blue');
      return true;
    } else {
      log(`❌ Wrong status: ${response.status} (expected 402)`, 'red');
      log(`   Response: ${JSON.stringify(data, null, 2)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return false;
  }
}

async function test2_InvalidBody() {
  log('\n📋 Test 2: Request with invalid body (expects 400)', 'cyan');
  
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Missing required 'prompt' field
        size: '1024x1024'
      })
    });
    
    const data = await response.json();
    
    if (response.status === 400) {
      log('✅ Correct status: 400 Bad Request', 'green');
      
      if (data.error && data.error.includes('prompt')) {
        log('✅ Correct error message (mentions prompt)', 'green');
      } else {
        log('❌ Error message doesn\'t mention prompt', 'red');
      }
      
      log(`   Response: ${JSON.stringify(data, null, 2)}`, 'blue');
      return true;
    } else {
      log(`❌ Wrong status: ${response.status} (expected 400)`, 'red');
      log(`   Response: ${JSON.stringify(data, null, 2)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return false;
  }
}

async function test3_WithMockPayment() {
  log('\n📋 Test 3: Request with mock payment (expects 500 in test mode)', 'cyan');
  log('   Note: This test uses mock transaction hash', 'yellow');
  log('   In production, you would use a real BASE USDC transaction', 'yellow');
  
  try {
    // Mock transaction hash (will be validated in mock mode)
    const mockTxHash = '0xmock' + Date.now().toString(16);
    
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-402-Transaction-Hash': mockTxHash
      },
      body: JSON.stringify({
        prompt: 'a dog playing in the park',
        size: '1024x1024',
        model: 'stable-diffusion-xl'
      })
    });
    
    const data = await response.json();
    
    // In test/mock mode, should return 500 after "verifying" payment
    // In production without real tx, would return 402 payment verification failed
    if (response.status === 500) {
      log('✅ Correct status: 500 Internal Server Error', 'green');
      
      if (data.error && data.error.code === 'model_overloaded') {
        log('✅ Correct error code: model_overloaded', 'green');
      } else {
        log('❌ Wrong error code', 'red');
      }
      
      log(`   Response: ${JSON.stringify(data, null, 2)}`, 'blue');
      return true;
    } else if (response.status === 402) {
      log('⚠️  Status 402: Payment verification failed (expected in production)', 'yellow');
      log('   This is correct behavior when not in mock mode', 'yellow');
      log(`   Response: ${JSON.stringify(data, null, 2)}`, 'blue');
      return true;
    } else {
      log(`❌ Unexpected status: ${response.status}`, 'red');
      log(`   Response: ${JSON.stringify(data, null, 2)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('🚀 Testing ImageGenerator500 Demo Agent', 'cyan');
  log(`   Endpoint: ${ENDPOINT}`, 'blue');
  log(`   Wallet: 0x96BDBD233d4ABC11E7C77c45CAE14194332E7381`, 'blue');
  
  const results = [];
  
  results.push(await test1_NoPayment());
  results.push(await test2_InvalidBody());
  results.push(await test3_WithMockPayment());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  log(`\n${'='.repeat(50)}`, 'cyan');
  if (passed === total) {
    log(`✅ All tests passed! (${passed}/${total})`, 'green');
  } else {
    log(`⚠️  Some tests failed (${passed}/${total} passed)`, 'yellow');
  }
  log('='.repeat(50), 'cyan');
  
  log('\n📝 Next Steps:', 'cyan');
  log('1. Deploy to production: pnpm deploy', 'blue');
  log('2. Test with real Coinbase Payments MCP', 'blue');
  log('3. File a dispute using x402disputes MCP', 'blue');
  
  process.exit(passed === total ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});



