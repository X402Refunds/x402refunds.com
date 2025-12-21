/**
 * Demo Agents for X-402 Dispute Testing
 * 
 * Intentionally bad agents that accept Coinbase Payments MCP (BASE USDC)
 * and fail in predictable ways to generate realistic dispute test cases.
 * 
 * Shared wallet: 0x49AF4074577EA313C5053cbB7560AC39e34b05E8
 */

import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

// Shared wallet for all demo agents
const DEMO_AGENTS_WALLET = process.env.DEMO_AGENTS_WALLET || "0x49AF4074577EA313C5053cbB7560AC39e34b05E8";

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
  const PAYAI_FACILITATOR_URL = "https://facilitator.payai.network";
  
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
      asset: USDC_BASE_MAINNET,
      facilitator: PAYAI_FACILITATOR_URL
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
    useCase: "Perfect for testing X-402 dispute filing workflow",
    facilitator: {
      url: PAYAI_FACILITATOR_URL,
      features: ["Multi-network support", "Gasless for buyers & merchants", "No API keys required"]
    }
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
 * This agent:
 * - Validates image generation requests (requires prompt)
 * - Accepts 0.01 USDC on BASE via X-402 protocol
 * - Always returns 500 "model_overloaded" error after payment
 * - Perfect for testing dispute filing for server errors
 */
export const imageGenerator500Handler = httpAction(async (ctx, request) => {
  // 1. Check for payment FIRST (X-402 protocol requirement)
  // Accept ANY payment-related header for demo purposes
  const xPaymentHeader = request.headers.get("X-PAYMENT");
  const paymentSignatureHeader = request.headers.get("PAYMENT-SIGNATURE"); // NEW Coinbase format
  const xPaymentProof = request.headers.get("X-Payment-Proof");
  const txHash = request.headers.get("X-402-Transaction-Hash");
  const authHeader = request.headers.get("Authorization");
  
  const hasAnyPaymentHeader = xPaymentHeader || paymentSignatureHeader || xPaymentProof || txHash || authHeader;
  
  console.log(`📨 Received headers:`);
  console.log(`   X-PAYMENT: ${xPaymentHeader ? 'present' : 'missing'}`);
  console.log(`   PAYMENT-SIGNATURE: ${paymentSignatureHeader ? 'present' : 'missing'}`);
  console.log(`   X-Payment-Proof: ${xPaymentProof ? 'present' : 'missing'}`);
  console.log(`   X-402-Transaction-Hash: ${txHash ? 'present' : 'missing'}`);
  console.log(`   Authorization: ${authHeader ? 'present' : 'missing'}`);
  
  if (!hasAnyPaymentHeader) {
    // Return 402 Payment Required per x402 protocol specification
    // DON'T validate body yet - let PayAI facilitator handle payment first
    console.log(`💰 Payment required for ImageGenerator500`);
    console.log(`   Recipient: ${DEMO_AGENTS_WALLET}`);
    console.log(`   Amount: 0.01 USDC on BASE`);
    console.log(`   Facilitator: PayAI (https://facilitator.payai.network)`);
    
    // USDC contract address on Base mainnet
    const USDC_BASE_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    const PAYAI_FACILITATOR_URL = "https://facilitator.payai.network";
    
    return new Response(JSON.stringify({
      x402Version: 1,
      error: "Payment required: 0.01 USDC on Base network",
      accepts: [
        {
          scheme: "exact",
          network: "base",  // Simple network name (not CAIP-2 format)
          maxAmountRequired: "10000",  // 0.01 USDC (USDC has 6 decimals: 0.01 * 1000000 = 10000)
          asset: USDC_BASE_MAINNET,  // USDC on Base
          payTo: DEMO_AGENTS_WALLET,
          resource: `${request.url}`,
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
                }
              }
            }
          },
          extra: {
            name: "USDC",
            version: "2",
            facilitator: PAYAI_FACILITATOR_URL
          }
        }
      ]
    }), {
      status: 402,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "X-PAYMENT, Content-Type, PAYMENT-SIGNATURE, X-Payment-Proof, X-402-Transaction-Hash",
        "Access-Control-Expose-Headers": "X-PAYMENT-RESPONSE, X-402-PAYMENT-RESPONSE"
      }
    });
  }
  
  // 2. Payment header received - verify with PayAI facilitator
  console.log(`💰 Payment header received - verifying with PayAI facilitator...`);
  
  const PAYAI_FACILITATOR_URL = "https://facilitator.payai.network";
  
  // Verify payment with PayAI
  try {
    const verifyResponse = await fetch(`${PAYAI_FACILITATOR_URL}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-PAYMENT": xPaymentHeader || "",
        "PAYMENT-SIGNATURE": paymentSignatureHeader || "",
        "X-Payment-Proof": xPaymentProof || "",
        "X-402-Transaction-Hash": txHash || "",
        "Authorization": authHeader || ""
      },
      body: JSON.stringify({
        resource: request.url,
        payTo: DEMO_AGENTS_WALLET,
        network: "base",
        amount: "10000", // 0.01 USDC
        asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
      })
    });
    
    console.log(`📡 PayAI verify response: ${verifyResponse.status}`);
    
    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.text();
      console.log(`❌ Payment verification failed: ${errorData}`);
      
      // Payment verification failed - return 402 again
      const USDC_BASE_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
      
      return new Response(JSON.stringify({
        x402Version: 1,
        error: "Payment verification failed. Please retry payment.",
        accepts: [
          {
            scheme: "exact",
            network: "base",
            maxAmountRequired: "10000",
            asset: USDC_BASE_MAINNET,
            payTo: DEMO_AGENTS_WALLET,
            resource: `${request.url}`,
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
                  }
                }
              }
            },
            extra: {
              name: "USDC",
              version: "2",
              facilitator: PAYAI_FACILITATOR_URL
            }
          }
        ]
      }), {
        status: 402,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    console.log(`✅ Payment verified successfully via PayAI`);
  } catch (error) {
    console.error(`❌ Error verifying payment with PayAI:`, error);
    
    // If PayAI is down or unreachable, accept any payment header for demo purposes
    console.log(`⚠️  PayAI unreachable - accepting payment header for demo purposes`);
  }
  
  // 3. Validate request body
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({
      error: "Invalid JSON body"
    }), { 
      status: 400, 
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      } 
    });
  }
  
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
  
  // 4. PAYMENT VERIFIED - Now intentionally fail with 500 error
  // This simulates a real scenario: payment was made, but service crashes
  console.log(`✅ Request validated: prompt="${body.prompt}"`);
  console.log(`🚨 Returning intentional 500 error for demo purposes (simulating service failure after payment)`);
  
  return new Response(JSON.stringify({
    error: {
      code: "model_overloaded",
      message: "Image generation model is currently overloaded. Please try again later.",
      type: "server_error",
      timestamp: new Date().toISOString()
    }
  }), {
    status: 500,
    headers: {
      "Content-Type": "application/json",
      "X-Error-Type": "InternalServerError",
      "Access-Control-Allow-Origin": "*"
    }
  });
});

