/**
 * Demo Agents for X-402 Dispute Testing
 * 
 * Intentionally bad agents that accept Coinbase Payments MCP (BASE USDC)
 * and fail in predictable ways to generate realistic dispute test cases.
 * 
 * Shared wallet: 0x49AF4074577EA313C5053cbB7560AC39e34b05E8
 * 
 * Implements COMPLETE x402 protocol flow with CDP facilitator:
 * 1. Returns 402 with PAYMENT-REQUIRED header (base64 encoded)
 * 2. Accepts payment authorization from Coinbase Payments MCP
 * 3. Calls CDP facilitator POST /verify to validate payment signature
 * 4. Performs work (validates request body)
 * 5. Calls CDP facilitator POST /settle to execute payment on-chain
 * 6. Returns intentional error (500) with PAYMENT-RESPONSE header
 * 
 * Authentication: Uses CDP API key (Basic Auth) for facilitator access.
 * Network: Base mainnet (USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 */

import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

// Shared wallet for all demo agents
const DEMO_AGENTS_WALLET = process.env.DEMO_AGENTS_WALLET || "0x49AF4074577EA313C5053cbB7560AC39e34b05E8";

// USDC contract on Base mainnet
const USDC_BASE_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

// CDP Facilitator configuration (requires auth for mainnet Base)
const FACILITATOR_URL = "https://api.cdp.coinbase.com/platform/v2/x402";
const CDP_API_KEY_ID = process.env.CDP_API_KEY_ID;
const CDP_API_KEY_SECRET = process.env.CDP_API_KEY_SECRET;

/**
 * Image generation request format
 */
interface ImageGenerationRequest {
  prompt: string;           // REQUIRED
  size?: string;           // optional: "1024x1024"
  model?: string;          // optional: "stable-diffusion-xl"
  n?: number;              // optional: number of images
  quality?: string;        // optional: "standard" | "hd"
}

/**
 * Validate image generation request
 */
function validateImageGenRequest(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: "Request body must be JSON object" };
  }
  
  if (!body.prompt || typeof body.prompt !== 'string') {
    return { 
      valid: false, 
      error: "Missing 'prompt' field. Image generation requires a text prompt."
    };
  }
  
  if (body.prompt.length < 3) {
    return { valid: false, error: "Prompt too short (minimum 3 characters)" };
  }
  
  if (body.prompt.length > 1000) {
    return { valid: false, error: "Prompt too long (maximum 1000 characters)" };
  }
  
  return { valid: true };
}


/**
 * ImageGenerator500 GET handler - Returns service info (like x402-starter-kit /health)
 * 
 * Matches dabit3's pattern: GET returns 200 OK with service metadata
 * POST handles the actual payment flow (402 → process)
 */
export const imageGenerator500GetHandler = httpAction(async (ctx, request) => {
  console.log(`📨 GET request received - returning service info`);
  
  const USDC_BASE_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  
  return new Response(JSON.stringify({
    status: "available",
    service: "image-generator-500",
    description: "Demo image generation API that always returns 500 error after payment",
    version: "1.0.0",
    x402Version: 1,
    payment: {
      address: DEMO_AGENTS_WALLET,
      network: "base",
      currency: "USDC",
      price: "$0.01",
      priceWei: "10000", // 0.01 USDC (6 decimals)
      asset: USDC_BASE_MAINNET
    },
    usage: {
      endpoint: `${request.url}`,
      method: "POST",
      contentType: "application/json",
      requiredFields: {
        prompt: "string (required, 3-1000 chars)"
      },
      optionalFields: {
        size: "string (e.g., '1024x1024')",
        model: "string (e.g., 'stable-diffusion-xl')"
      }
    },
    expectedBehavior: "Returns 500 'model_overloaded' error after payment verification",
    useCase: "Perfect for testing X-402 dispute filing workflow"
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
});

/**
 * ImageGenerator500 POST handler - Always returns 500 error after payment
 * 
 * Implements proper x402 protocol flow:
 * 1. Returns 402 with PAYMENT-REQUIRED header (base64 encoded)
 * 2. Verifies payment via Coinbase facilitator
 * 3. Performs work (returns 500 error - demo behavior)
 * 4. Settles payment via facilitator
 * 5. Returns PAYMENT-RESPONSE header
 */
export const imageGenerator500Handler = httpAction(async (ctx, request) => {
  console.log(`📨 POST request received`);
  
  // Parse request body first (needed for validation later)
  let body: any = {};
  try {
    const text = await request.text();
    if (text) {
      body = JSON.parse(text);
    }
  } catch (e) {
    console.log(`   Empty or invalid body - treating as discovery request`);
  }
  
  // Step 1: Check for ANY payment-related header FIRST
  const paymentSignature = request.headers.get("PAYMENT-SIGNATURE");
  const xPaymentProof = request.headers.get("X-Payment-Proof");
  const xPayment = request.headers.get("X-PAYMENT");
  const txHash = request.headers.get("X-402-Transaction-Hash");
  const authorization = request.headers.get("Authorization");
  
  const hasPaymentProof = paymentSignature || xPaymentProof || xPayment || txHash || authorization;
  
  console.log(`   PAYMENT-SIGNATURE: ${paymentSignature ? 'present' : 'missing'}`);
  console.log(`   X-Payment-Proof: ${xPaymentProof ? 'present' : 'missing'}`);
  console.log(`   X-PAYMENT: ${xPayment ? 'present' : 'missing'}`);
  console.log(`   X-402-Transaction-Hash: ${txHash ? 'present' : 'missing'}`);
  console.log(`   Authorization: ${authorization ? 'present' : 'missing'}`);
  
  if (!hasPaymentProof) {
    // Step 2: Discovery request - return 402 WITHOUT validating body
    console.log(`💰 No payment proof - returning 402 Payment Required (discovery)`);
    
    // v1 schema format (Coinbase Payments MCP doesn't support v2)
    const paymentRequired = {
      scheme: "exact",
      network: "base", // v1 uses simple network name
      maxAmountRequired: "10000", // v1 uses maxAmountRequired
      asset: USDC_BASE_MAINNET,
      payTo: DEMO_AGENTS_WALLET,
      resource: request.url, // v1 has these at top level
      description: "Image generation API (demo - always returns 500 error)",
      mimeType: "application/json",
      maxTimeoutSeconds: 60,
      outputSchema: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              type: { type: "string" },
              timestamp: { type: "string" }
            },
            required: ["code", "message", "type", "timestamp"]
          }
        },
        required: ["error"]
      },
      extra: {
        name: "USDC",
        version: "2"
      }
    };
    
    // Encode as base64 for PAYMENT-REQUIRED header
    const paymentRequiredB64 = btoa(JSON.stringify(paymentRequired));
    
    return new Response(JSON.stringify({
      x402Version: 1, // v1 protocol (Payments MCP doesn't support v2)
      error: "Payment required: 0.01 USDC on Base network",
      accepts: [paymentRequired]
    }), {
      status: 402,
      headers: {
        "Content-Type": "application/json",
        "PAYMENT-REQUIRED": paymentRequiredB64, // v1 header
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "PAYMENT-SIGNATURE, X-Payment-Proof, X-PAYMENT, X-402-Transaction-Hash, Authorization, Content-Type",
        "Access-Control-Expose-Headers": "PAYMENT-REQUIRED, PAYMENT-RESPONSE"
      }
    });
  }
  
  // Step 3: Payment proof provided - VERIFY then SETTLE via CDP facilitator
  console.log(`✅ Payment proof present - verifying with CDP facilitator`);
  console.log(`   Payment header type: ${paymentSignature ? 'PAYMENT-SIGNATURE' : xPaymentProof ? 'X-Payment-Proof' : xPayment ? 'X-PAYMENT' : txHash ? 'X-402-Transaction-Hash' : 'Authorization'}`);
  
  // Use whichever payment header was provided
  const paymentHeader = paymentSignature || xPaymentProof || xPayment || txHash || authorization;
  
  try {
    // Payment requirements for v1 protocol
    const paymentRequirements = {
      scheme: "exact",
      network: "base",
      maxAmountRequired: "10000",
      asset: USDC_BASE_MAINNET,
      payTo: DEMO_AGENTS_WALLET,
      resource: request.url,
      description: "Image generation API (demo - always returns 500 error)",
      mimeType: "application/json"
    };
    
    console.log(`🔍 Step 1: Verifying payment with CDP facilitator`);
    console.log(`   Using API Key: ${CDP_API_KEY_ID?.substring(0, 8)}...`);
    
    // Use Basic Auth for CDP facilitator (may need to switch to JWT if this fails)
    const basicAuth = btoa(`${CDP_API_KEY_ID}:${CDP_API_KEY_SECRET}`);
    const authHeaders = {
      "Content-Type": "application/json",
      "Authorization": `Basic ${basicAuth}`
    };
    
    console.log(`   Using Basic Auth for CDP facilitator`);
    console.log(`   Note: If auth fails, we may need to implement JWT token generation`);
    
    // STEP 1: Verify the payment signature BEFORE doing work
    const verifyResponse = await fetch(`${FACILITATOR_URL}/verify`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        x402Version: 1,
        paymentHeader: paymentHeader,
        paymentRequirements: paymentRequirements
      })
    });
    
    console.log(`   Verification HTTP status: ${verifyResponse.status}`);
    
    const verifyText = await verifyResponse.text();
    console.log(`   Verification response: ${verifyText.substring(0, 300)}`);
    
    let verifyResult;
    try {
      verifyResult = JSON.parse(verifyText);
    } catch (e) {
      console.error(`   Failed to parse verification response as JSON`);
      return new Response(JSON.stringify({
        error: "Failed to verify payment",
        details: verifyText
      }), {
        status: 402,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    // Check if payment is valid
    if (!verifyResult.isValid) {
      console.error(`❌ Payment verification failed: ${verifyResult.invalidReason}`);
      return new Response(JSON.stringify({
        error: `Invalid payment: ${verifyResult.invalidReason}`,
        payer: verifyResult.payer
      }), {
        status: 402,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    console.log(`✅ Payment verified! Payer: ${verifyResult.payer?.substring(0, 10)}...`);
    
    // STEP 2: Do work - validate request body
    console.log(`🔧 Step 2: Performing work (validating request)`);
    const validation = validateImageGenRequest(body);
    if (!validation.valid) {
      return new Response(JSON.stringify({
        error: validation.error
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    // STEP 3: Settle the payment on-chain
    console.log(`💰 Step 3: Settling payment on-chain via CDP facilitator`);
    
    const settleResponse = await fetch(`${FACILITATOR_URL}/settle`, {
      method: "POST",
      headers: authHeaders, // Reuse the same auth headers from verify step
      body: JSON.stringify({
        x402Version: 1,
        paymentHeader: paymentHeader,
        paymentRequirements: paymentRequirements
      })
    });
    
    console.log(`   Settlement HTTP status: ${settleResponse.status}`);
    
    // Parse response
    const responseText = await settleResponse.text();
    console.log(`   Settlement response: ${responseText.substring(0, 300)}`);
    
    let settleResult;
    try {
      settleResult = JSON.parse(responseText);
    } catch (e) {
      console.error(`   Failed to parse settlement response as JSON`);
      settleResult = {
        success: false,
        error: responseText,
        txHash: "",
        networkId: "base"
      };
    }
    
    if (!settleResult.success) {
      console.error(`❌ Settlement failed:`, settleResult);
    } else {
      console.log(`✅ Settlement succeeded! Transaction: ${settleResult.txHash || settleResult.transaction}`);
    }
    
    // STEP 4: Return 500 error (demo behavior) with settlement confirmation
    console.log(`✅ Step 4: Returning 500 error after successful settlement (demo behavior)`);
    
    // Encode settlement response for PAYMENT-RESPONSE header
    const paymentResponseB64 = btoa(JSON.stringify(settleResult));
    
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: "model_overloaded",
        message: "Image generation model is currently overloaded. Please try again later.",
        type: "server_error",
        timestamp: new Date().toISOString()
      },
      settlement: settleResult // Include settlement info for debugging
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "PAYMENT-SIGNATURE, X-Payment-Proof, X-PAYMENT, X-402-Transaction-Hash, Authorization, Content-Type",
        "Access-Control-Expose-Headers": "PAYMENT-REQUIRED, PAYMENT-RESPONSE",
        "PAYMENT-RESPONSE": paymentResponseB64
      }
    });
    
  } catch (error: any) {
    console.error(`❌ Error calling facilitator:`, error);
    
    // Return 500 error even if settlement failed (demo always returns 500)
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: "settlement_error",
        message: `Failed to settle payment: ${error.message}`,
        type: "server_error",
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "PAYMENT-SIGNATURE, X-Payment-Proof, X-PAYMENT, X-402-Transaction-Hash, Authorization, Content-Type",
        "Access-Control-Expose-Headers": "PAYMENT-REQUIRED, PAYMENT-RESPONSE"
      }
    });
  }
});

