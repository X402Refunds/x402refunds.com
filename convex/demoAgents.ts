/**
 * Demo X-402 Image Generator Agent
 * 
 * Working X-402 demo agent that accepts 0.01 USDC payments on Base
 * and returns real image URLs via Pollinations AI.
 * 
 * Shared wallet: 0x49AF4074577EA313C5053cbB7560AC39e34b05E8
 * Price: 0.01 USDC (10000 wei, 6 decimals)
 * Network: Base mainnet (USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * Facilitator: https://facilitator.mcpay.tech (no auth required)
 * 
 * X-402 v1 Signature-Based Payment Flow:
 * 1. GET - Returns service info and pricing (discovery)
 * 2. POST without X-PAYMENT - Returns 402 with payment requirements
 * 3. POST with X-PAYMENT - Verifies signature via facilitator
 * 4. Performs work - Generates image URL
 * 5. Settles payment via facilitator
 * 6. Returns 200 OK with image URL + X-PAYMENT-RESPONSE header
 * 
 * NOTE: HTTP actions run in Cloudflare Workers-like runtime (no Node.js APIs)
 * Facilitator calls are handled by calling a Node.js action internally.
 */

import { httpAction, action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

// Shared wallet for all demo agents
const DEMO_AGENTS_WALLET = process.env.DEMO_AGENTS_WALLET || "0x49AF4074577EA313C5053cbB7560AC39e34b05E8";

// USDC contract on Base mainnet
const USDC_BASE_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

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
 * ImageGenerator GET handler - Returns service info for discovery
 * 
 * Follows dabit3's x402-starter-kit pattern
 * GET returns 200 OK with service metadata and payment requirements
 */
export const imageGeneratorGetHandler = httpAction(async (ctx, request) => {
  console.log(`📨 GET request received - returning service info`);
  
  const USDC_BASE_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  
  return new Response(JSON.stringify({
    status: "available",
    service: "image-generator",
    description: "AI image generation API powered by Pollinations AI",
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
    capabilities: [
      "Text-to-image generation via Pollinations AI",
      "X-402 payment protocol support",
      "Instant image URL delivery"
    ]
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
});

/**
 * ImageGenerator POST handler - Working X-402 implementation
 * 
 * Implements X-402 v1 signature-based payment flow:
 * 1. No X-PAYMENT → Returns 402 with payment requirements
 * 2. X-PAYMENT present → Verifies signature via facilitator
 * 3. Performs work → Generates image URL
 * 4. Settles payment via facilitator
 * 5. Returns 200 OK with image URL + X-PAYMENT-RESPONSE
 */
export const imageGeneratorHandler = httpAction(async (ctx, request) => {
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
  
  // Step 1: Check for X-PAYMENT header (v1 signature-based payment)
  const xPayment = request.headers.get("X-PAYMENT");
  
  console.log(`   X-PAYMENT header: ${xPayment ? 'present' : 'missing'}`);
  
  if (!xPayment) {
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
      description: "AI Image Generation via Pollinations",
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
      error: "Payment required",
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
  
  // Step 3: Payment signature provided - verify with facilitator
  console.log(`✅ X-PAYMENT header provided - verifying with facilitator`);
  
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
    
    console.log(`🔍 Step 1: Verifying payment with mcpay.tech facilitator`);
    
    // STEP 1: Verify the payment signature BEFORE doing work
    const verifyResult = await ctx.runAction(api.demoAgents.cdpAuth.verifyPayment, {
      paymentHeader: xPayment,
      paymentRequirements: paymentRequirements
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
    console.log(`💰 Step 3: Settling payment on-chain via mcpay.tech facilitator`);
    
    // Call facilitator to settle payment
    const settleResult = await ctx.runAction(api.demoAgents.cdpAuth.settlePayment, {
      paymentHeader: xPayment,
      paymentRequirements: paymentRequirements
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
    
    // STEP 4: Return 200 OK with real image URL (happy path)
    console.log(`✅ Step 4: Generating image and returning 200 OK`);
    
    // Encode settlement response for X-PAYMENT-RESPONSE header (v1 protocol)
    const paymentResponseB64 = btoa(JSON.stringify(settleData));
    
    // Generate real image URL using Pollinations AI
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(body.prompt)}?width=1024&height=1024&nologo=true`;
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        image_url: imageUrl,
        format: "png",
        size: body.size || "1024x1024",
        prompt: body.prompt,
        model: body.model || "stable-diffusion-xl"
      },
      metadata: {
        generated_at: new Date().toISOString(),
        settlement: settleData
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "X-PAYMENT, Content-Type",
        "Access-Control-Expose-Headers": "X-PAYMENT-RESPONSE",
        "X-PAYMENT-RESPONSE": paymentResponseB64
      }
    });
    
  } catch (error: any) {
    console.error(`❌ Error calling facilitator:`, error);
    
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: "facilitator_error",
        message: `Payment processing failed: ${error.message}`,
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

