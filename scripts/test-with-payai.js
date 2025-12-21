#!/usr/bin/env node
/**
 * Test ImageGenerator500 Demo Agent with PayAI Facilitator
 * 
 * This script demonstrates how to call the demo endpoint using PayAI's
 * x402 payment flow.
 * 
 * Prerequisites:
 * 1. Install PayAI client: npm install @payai/x402-client (or use axios directly)
 * 2. Have USDC on Base mainnet for payments
 * 
 * Reference: https://facilitator.payai.network/docs
 */

const DEMO_ENDPOINT = "https://api.x402disputes.com/demo-agents/image-generator-500";
const PAYAI_FACILITATOR = "https://facilitator.payai.network";

async function testWithPayAI() {
  console.log("🎨 Testing ImageGenerator500 with PayAI Facilitator\n");
  
  // Step 1: Discovery - GET endpoint for service info
  console.log("📡 Step 1: Discovering service...");
  const discoveryResponse = await fetch(DEMO_ENDPOINT, {
    method: "GET"
  });
  
  const serviceInfo = await discoveryResponse.json();
  console.log(`✅ Service: ${serviceInfo.service}`);
  console.log(`   Price: ${serviceInfo.payment.price}`);
  console.log(`   Network: ${serviceInfo.payment.network}`);
  console.log(`   Facilitator: ${serviceInfo.payment.facilitator}\n`);
  
  // Step 2: Attempt request without payment (should get 402)
  console.log("📡 Step 2: Attempting request without payment...");
  const requestWithoutPayment = await fetch(DEMO_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: "a cute robot learning to code",
      size: "1024x1024",
      model: "stable-diffusion-xl"
    })
  });
  
  if (requestWithoutPayment.status === 402) {
    const paymentRequired = await requestWithoutPayment.json();
    console.log(`✅ Got 402 Payment Required`);
    console.log(`   Amount: ${paymentRequired.accepts[0].maxAmountRequired} USDC (atomic units)`);
    console.log(`   Pay to: ${paymentRequired.accepts[0].payTo}`);
    console.log(`   Asset: ${paymentRequired.accepts[0].asset}`);
    console.log(`   Facilitator: ${paymentRequired.accepts[0].extra.facilitator}\n`);
    
    // Step 3: Instructions for using PayAI client
    console.log("💡 Step 3: To complete the payment flow:");
    console.log("\n   Option A: Use PayAI's Axios client");
    console.log("   ────────────────────────────────────");
    console.log("   npm install @payai/x402-axios");
    console.log(`   
   import { createX402Axios } from '@payai/x402-axios';
   
   const axios = createX402Axios({
     facilitatorUrl: '${PAYAI_FACILITATOR}',
     wallet: yourWallet,  // Your BASE wallet with USDC
     network: 'base'
   });
   
   const response = await axios.post('${DEMO_ENDPOINT}', {
     prompt: 'a cute robot learning to code',
     size: '1024x1024'
   });
   
   // PayAI handles payment automatically
   // Response will be 500 error (demo behavior)
   console.log(response.data);
`);
    
    console.log("\n   Option B: Use PayAI's Fetch client");
    console.log("   ───────────────────────────────────");
    console.log("   npm install @payai/x402-fetch");
    console.log(`   
   import { createX402Fetch } from '@payai/x402-fetch';
   
   const fetch = createX402Fetch({
     facilitatorUrl: '${PAYAI_FACILITATOR}',
     wallet: yourWallet,  // Your BASE wallet with USDC
     network: 'base'
   });
   
   const response = await fetch('${DEMO_ENDPOINT}', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       prompt: 'a cute robot learning to code',
       size: '1024x1024'
     })
   });
   
   const data = await response.json();
   console.log(data);
`);
    
    console.log("\n   Option C: Manual integration with PayAI");
    console.log("   ────────────────────────────────────────");
    console.log("   See: https://facilitator.payai.network/docs/integration\n");
    
    console.log("🎯 Expected Flow:");
    console.log("   1. Client POSTs to endpoint → Gets 402");
    console.log("   2. PayAI client handles payment on BASE");
    console.log("   3. Client retries POST with payment proof");
    console.log("   4. Server verifies with PayAI → Returns 500 error (demo)");
    console.log("   5. File dispute using x402_file_dispute MCP tool\n");
    
    console.log("📚 Resources:");
    console.log(`   - PayAI Docs: ${PAYAI_FACILITATOR}/docs`);
    console.log(`   - Service Info: ${DEMO_ENDPOINT}`);
    console.log(`   - x402 Protocol: https://github.com/x402`);
    
  } else {
    console.log(`❌ Unexpected status: ${requestWithoutPayment.status}`);
    console.log(await requestWithoutPayment.text());
  }
}

// Run the test
testWithPayAI().catch(error => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});

