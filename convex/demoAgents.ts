/**
 * Demo Image Generator Agent (Happy Path)
 * 
 * A working X-402 demo agent that accepts 0.1 USDC payments on Base
 * and returns valid image generation responses.
 * 
 * Shared wallet: 0x49AF4074577EA313C5053cbB7560AC39e34b05E8
 * Price: 0.1 USDC (100000 wei, 6 decimals)
 * Network: Base mainnet (USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * Facilitator: https://facilitator.mcpay.tech (no auth required)
 * 
 * Supports X-402 Transaction Hash flow (Coinbase Payments MCP):
 * 1. GET - Returns service info and pricing
 * 2. POST without payment - Returns 402 with payment requirements
 * 3. POST with X-402-Transaction-Hash - Verifies payment, returns image
 * 
 * NOTE: HTTP actions run in Cloudflare Workers-like runtime (no Node.js APIs)
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
 * ImageGenerator GET handler - Returns service info
 * 
 * GET returns 200 OK with service metadata and pricing
 * POST handles the actual payment flow (402 → process → deliver)
 */
export const imageGeneratorGetHandler = httpAction(async (ctx, request) => {
  console.log(`📨 GET request received - returning service info`);
  
  const USDC_BASE_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  
  return new Response(JSON.stringify({
    status: "available",
    service: "image-generator",
    description: "AI image generation API powered by Stable Diffusion XL",
    version: "1.0.0",
    x402Version: 1,
    payment: {
      address: DEMO_AGENTS_WALLET,
      network: "base",
      currency: "USDC",
      price: "$0.10",
      priceWei: "100000", // 0.1 USDC (6 decimals)
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
      "Text-to-image generation",
      "Multiple sizes supported",
      "High-quality outputs"
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
 * ImageGenerator POST handler - Working implementation
 * 
 * X-402 payment flow:
 * 1. No payment header → Returns 402 with payment requirements
 * 2. X-402-Transaction-Hash present → Verifies on-chain, generates image
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
  
  // Step 1: Check for payment (transaction hash only)
  const txHash = request.headers.get("X-402-Transaction-Hash");
  
  console.log(`   X-402-Transaction-Hash: ${txHash ? 'present' : 'missing'}`);
  
  if (!txHash) {
    // Step 2: Discovery request - return 402 WITHOUT validating body
    console.log(`💰 No payment - returning 402 Payment Required (discovery)`);
    
    // X-402 v1 payment requirements
    const paymentRequired = {
      scheme: "exact",
      network: "base",
      maxAmountRequired: "100000", // 0.1 USDC (6 decimals)
      asset: USDC_BASE_MAINNET,
      payTo: DEMO_AGENTS_WALLET,
      resource: request.url,
      description: "AI Image Generation - Stable Diffusion XL",
      mimeType: "application/json",
      maxTimeoutSeconds: 60,
      outputSchema: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: {
              image_url: { type: "string" },
              format: { type: "string" },
              size: { type: "string" },
              prompt: { type: "string" }
            }
          }
        },
        required: ["success", "data"]
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
  
  // Step 3: Transaction hash provided - verify payment on-chain
  console.log(`✅ Payment transaction hash provided`);
  console.log(`   Transaction: ${txHash.substring(0, 20)}...`);
  
  // Query blockchain directly to verify payment
  const txResult = await ctx.runAction(api.lib.blockchain.queryTransaction, {
    blockchain: "base", // Assume Base for demoAgents wallet
    transactionHash: txHash,
    expectedToAddress: DEMO_AGENTS_WALLET
  });
  
  if (!txResult.success) {
    const errorDetails = 'error' in txResult ? txResult.error : 'Unknown error';
    console.error(`❌ Transaction verification failed: ${errorDetails}`);
    return new Response(JSON.stringify({
      error: "Payment verification failed",
      details: errorDetails
    }), {
      status: 402,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
  
  // Type guard: txResult.success is true, so we can access success-specific properties
  if (!('fromAddress' in txResult)) {
    return new Response(JSON.stringify({
      error: "Invalid transaction result"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
  
  console.log(`✅ Payment verified on-chain!`);
  console.log(`   From: ${txResult.fromAddress}`);
  console.log(`   To: ${txResult.toAddress}`);
  console.log(`   Amount: ${txResult.value} USDC`);
  
  // Validate payment meets requirements (0.1 USDC)
  const paidAmount = parseFloat(txResult.value);
  const requiredAmount = 0.1;
  
  if (paidAmount < requiredAmount) {
    return new Response(JSON.stringify({
      error: `Insufficient payment: ${paidAmount} USDC (required: ${requiredAmount} USDC)`
    }), {
      status: 402,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
  
  // Validate request body
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
  
  // Payment verified! Generate and return image
  console.log(`✅ Payment verified! Generating image for prompt: "${body.prompt}"`);
  
  // Generate a demo image URL (in production, this would call Stable Diffusion)
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
      payment: {
        verified: true,
        transactionHash: txHash,
        amount: `${txResult.value} USDC`,
        from: txResult.fromAddress,
        to: txResult.toAddress
      }
    }
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "X-402-Transaction-Hash, Content-Type"
    }
  });
});

