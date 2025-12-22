/**
 * Demo Agents for X-402 Dispute Testing
 * 
 * Intentionally bad agents that accept Coinbase Payments MCP (BASE USDC)
 * and fail in predictable ways to generate realistic dispute test cases.
 * 
 * Shared wallet: 0x49AF4074577EA313C5053cbB7560AC39e34b05E8
 * 
 * Implements COMPLETE x402 v1 protocol flow:
 * 1. Returns 402 with payment requirements in response body
 * 2. Accepts X-PAYMENT header with signed payment (v1 standard)
 * 3. Calls x402.org facilitator POST /verify to validate payment signature (CDP auth)
 * 4. Performs work (validates request body)
 * 5. Calls x402.org facilitator POST /settle to execute payment on-chain (CDP auth)
 * 6. Returns intentional error (500) with X-PAYMENT-RESPONSE header (v1)
 * 
 * Network: Base mainnet (USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * Facilitator: https://x402.org/facilitator (CDP authenticated)
 * 
 * NOTE: HTTP actions run in Cloudflare Workers-like runtime (no Node.js APIs)
 * Payment verification is handled by calling a Node.js action internally.
 */

import { httpAction, action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

// Shared wallet for all demo agents
const DEMO_AGENTS_WALLET = process.env.DEMO_AGENTS_WALLET || "0x49AF4074577EA313C5053cbB7560AC39e34b05E8";

// USDC contract on Base mainnet
const USDC_BASE_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

// CDP API credentials (from environment)
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
 * Implements proper x402 v1 protocol flow:
 * 1. Returns 402 with payment requirements in body
 * 2. Accepts X-PAYMENT header with signed payment
 * 3. Verifies payment via facilitator
 * 4. Performs work (returns 500 error - demo behavior)
 * 5. Settles payment via facilitator
 * 6. Returns X-PAYMENT-RESPONSE header (v1)
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
  
  // Step 1: Check for payment header (v1 uses X-PAYMENT)
  const xPayment = request.headers.get("X-PAYMENT"); // v1 standard header
  const xPaymentProof = request.headers.get("X-Payment-Proof"); // Alternative
  const txHash = request.headers.get("X-402-Transaction-Hash"); // Alternative
  const authorization = request.headers.get("Authorization"); // Alternative
  
  const hasPaymentProof = xPayment || xPaymentProof || txHash || authorization;
  
  console.log(`   X-PAYMENT (v1): ${xPayment ? 'present' : 'missing'}`);
  console.log(`   X-Payment-Proof: ${xPaymentProof ? 'present' : 'missing'}`);
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
        version: "1"
      }
    };
    
    // v1 protocol: Payment requirements go in BODY only (no header)
    return new Response(JSON.stringify({
      x402Version: 1, // v1 protocol (Payments MCP doesn't support v2)
      error: "Payment required: 0.01 USDC on Base network",
      accepts: [paymentRequired]
    }), {
      status: 402,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "X-PAYMENT, Content-Type",
        "Access-Control-Expose-Headers": "X-PAYMENT-RESPONSE"
      }
    });
  }
  
  // Step 3: Payment proof provided - VERIFY then SETTLE via facilitator  
  console.log(`✅ Payment proof present - verifying with facilitator`);
  console.log(`   Payment header type: ${xPayment ? 'X-PAYMENT (v1)' : xPaymentProof ? 'X-Payment-Proof' : txHash ? 'X-402-Transaction-Hash' : 'Authorization'}`);
  
  // Use whichever payment header was provided (prioritize v1 standard)
  const paymentHeader = xPayment || xPaymentProof || txHash || authorization;
  
  // Check if CDP credentials are configured
  if (!CDP_API_KEY_ID || !CDP_API_KEY_SECRET) {
    console.error(`❌ CDP API credentials not configured`);
    console.error(`   Please set CDP_API_KEY_ID and CDP_API_KEY_SECRET in Convex environment`);
    console.error(`   Get credentials from: https://portal.cdp.coinbase.com/`);
    
    // For now, return 500 error (demo behavior) without settlement
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: "configuration_error",
        message: "Payment settlement not configured. Please contact support.",
        type: "server_error",
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
  
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
      mimeType: "application/json",
      maxTimeoutSeconds: 60
    };
    
    console.log(`🔍 Step 1: Verifying payment with x402.org facilitator`);
    console.log(`   Using CDP API Key: ${CDP_API_KEY_ID?.substring(0, 20)}...`);
    console.log(`   Using CDP JWT authentication (via Node.js action + @coinbase/x402)`);
    
    // STEP 1: Verify the payment signature BEFORE doing work
    // Pass RAW payment header string to CDP (it will decode and validate it)
    const verifyResult = await ctx.runAction(api.demoAgents.cdpAuth.verifyPayment, {
      paymentHeader: paymentHeader as string,
      paymentRequirements: paymentRequirements,
      apiKeyId: CDP_API_KEY_ID,
      apiKeySecret: CDP_API_KEY_SECRET
    });
    
    console.log(`   Verification HTTP status: ${verifyResult.status}`);
    
    const verifyText = verifyResult.body;
    console.log(`   Verification response: ${verifyText.substring(0, 300)}`);
    
    let verifyData;
    try {
      verifyData = JSON.parse(verifyText);
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
    if (!verifyData.isValid) {
      console.error(`❌ Payment verification failed: ${verifyData.invalidReason}`);
      return new Response(JSON.stringify({
        error: `Invalid payment: ${verifyData.invalidReason}`,
        payer: verifyData.payer
      }), {
        status: 402,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    console.log(`✅ Payment verified! Payer: ${verifyData.payer?.substring(0, 10)}...`);
    
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
    console.log(`💰 Step 3: Settling payment on-chain via x402.org facilitator`);
    
    // Call Node.js action to handle CDP authentication
    const settleResult = await ctx.runAction(api.demoAgents.cdpAuth.settlePayment, {
      paymentHeader: paymentHeader as string,
      paymentRequirements: paymentRequirements,
      apiKeyId: CDP_API_KEY_ID,
      apiKeySecret: CDP_API_KEY_SECRET
    });
    
    console.log(`   Settlement HTTP status: ${settleResult.status}`);
    
    // Parse response
    const responseText = settleResult.body;
    console.log(`   Settlement response: ${responseText.substring(0, 300)}`);
    
    let settleData;
    try {
      settleData = JSON.parse(responseText);
    } catch (e) {
      console.error(`   Failed to parse settlement response as JSON`);
      settleData = {
        success: false,
        errorReason: "unexpected_settle_error",
        transaction: "",
        network: "base"
      };
    }
    
    if (!settleData.success) {
      console.error(`❌ Settlement failed:`, settleData);
    } else {
      console.log(`✅ Settlement succeeded! Transaction: ${settleData.transaction}`);
    }
    
    // STEP 4: Return 500 error (demo behavior) with settlement confirmation
    console.log(`✅ Step 4: Returning 500 error after successful settlement (demo behavior)`);
    
    // Encode settlement response for X-PAYMENT-RESPONSE header (v1 protocol)
    const paymentResponseB64 = btoa(JSON.stringify(settleData));
    
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: "model_overloaded",
        message: "Image generation model is currently overloaded. Please try again later.",
        type: "server_error",
        timestamp: new Date().toISOString()
      },
      settlement: settleData // Include settlement info for debugging
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "X-PAYMENT, Content-Type",
        "Access-Control-Expose-Headers": "X-PAYMENT-RESPONSE",
        "X-PAYMENT-RESPONSE": paymentResponseB64 // v1 protocol uses X- prefix
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
        "Access-Control-Allow-Headers": "X-PAYMENT, Content-Type",
        "Access-Control-Expose-Headers": "X-PAYMENT-RESPONSE"
      }
    });
  }
});

