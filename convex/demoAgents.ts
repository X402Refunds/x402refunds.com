/**
 * Demo X-402 Image Generator Agent
 * 
 * Working X-402 demo agent that accepts 0.01 USDC payments on Base *or* Solana
 * and returns real image URLs via Pollinations AI.
 * 
 * Shared wallet: 0x96BDBD233d4ABC11E7C77c45CAE14194332E7381
 * Price: 0.01 USDC (10000 wei, 6 decimals)
 * Networks:
 * - Base mainnet (USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - Solana mainnet (USDC mint: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)
 * 
 * Supports TWO payment flows:
 * 
 * FLOW 1: Transaction Hash (Brave Wallet, Coinbase Payments MCP)
 * 1. GET - Returns service info and pricing (discovery)
 * 2. POST without payment - Returns 402 with payment requirements
 * 3. Client executes payment on-chain
 * 4. POST with X-402-Transaction-Hash - Server verifies on blockchain
 * 5. Returns 200 OK with image URL
 * 
 * FLOW 2: Facilitated (website Paywall)
 * 1. GET - Returns service info and pricing (discovery)
 * 2. POST without X-PAYMENT - Returns 402 with payment requirements
 * 3. POST with X-PAYMENT - Verifies payment via dexter.cash facilitator
 * 4. Performs work - Generates image URL
 * 5. Settles payment via facilitator
 * 6. Returns 200 OK with image URL + X-PAYMENT-RESPONSE header
 * 
 * NOTE: HTTP actions run in Cloudflare Workers-like runtime (no Node.js APIs)
 * Facilitator calls (Flow 2) are handled by calling a Node.js action internally.
 */

import { httpAction, action } from "./_generated/server";
import * as apiMod from "./_generated/api.js";
import { v } from "convex/values";

// Avoid TS2589 (excessively deep type instantiation) in downstream TS projects (notably dashboard)
// by importing generated API as JS and treating it as `any`.
const api: any = (apiMod as any).api;

// Resolve payTo wallets for demo agents.
// Prefer explicit DEMO_AGENTS_* overrides; otherwise use the platform CDP deposit wallets
// (same ones used by /v1/topup) so operators see funds in CDP by default.
export function getDemoAgentsPayToWallets(): { base: string; solana: string } {
  const base =
    (process.env.DEMO_AGENTS_WALLET && process.env.DEMO_AGENTS_WALLET.trim()) ||
    (process.env.PLATFORM_BASE_USDC_DEPOSIT_ADDRESS && process.env.PLATFORM_BASE_USDC_DEPOSIT_ADDRESS.trim()) ||
    "0x96BDBD233d4ABC11E7C77c45CAE14194332E7381";

  const solana =
    (process.env.DEMO_AGENTS_SOLANA_WALLET && process.env.DEMO_AGENTS_SOLANA_WALLET.trim()) ||
    (process.env.PLATFORM_SOLANA_USDC_DEPOSIT_ADDRESS && process.env.PLATFORM_SOLANA_USDC_DEPOSIT_ADDRESS.trim()) ||
    // Default is a public address used during development; override in env for your own agent.
    "FiZy3ch8QSDVWhJfZJYA75ZvDQgu4FJY4NfesZhbda4N";

  return { base, solana };
}

// Refund contact email the demo agent wants to receive refund requests at (exposed via Link on 402).
const DEMO_AGENTS_REFUND_CONTACT_EMAIL =
  process.env.DEMO_AGENTS_REFUND_CONTACT_EMAIL || "refunds@x402refunds.com";

// Optional: facilitator fee payer pubkey for Solana exact scheme (gasless Solana flow).
const DEMO_AGENTS_SOLANA_FEE_PAYER =
  process.env.DEMO_AGENTS_SOLANA_FEE_PAYER || process.env.X402_SOLANA_FEE_PAYER || "";

let _cachedDexterSolanaFeePayer: { value: string; fetchedAt: number } | null = null;
async function getDexterSolanaFeePayer(): Promise<string | null> {
  // Cache for 10 minutes.
  const now = Date.now();
  if (_cachedDexterSolanaFeePayer && now - _cachedDexterSolanaFeePayer.fetchedAt < 10 * 60 * 1000) {
    return _cachedDexterSolanaFeePayer.value || null;
  }
  try {
    const resp = await fetch("https://x402.dexter.cash/supported", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!resp.ok) return null;
    const data: any = await resp.json();
    const kinds: any[] = Array.isArray(data?.kinds) ? data.kinds : [];
    // Prefer v1 exact solana kind (matches our v1 `accepts` format).
    for (const k of kinds) {
      if (!k || typeof k !== "object") continue;
      const scheme = String(k.scheme || "").toLowerCase();
      const network = String(k.network || "").toLowerCase();
      const extra = k.extra && typeof k.extra === "object" ? k.extra : null;
      const feePayer = extra && typeof extra.feePayer === "string" ? String(extra.feePayer) : "";
      if (scheme === "exact" && network === "solana" && feePayer) {
        _cachedDexterSolanaFeePayer = { value: feePayer, fetchedAt: now };
        return feePayer;
      }
    }
    // Fallback: any solana exact kind (v2 CAIP network strings).
    for (const k of kinds) {
      if (!k || typeof k !== "object") continue;
      const scheme = String(k.scheme || "").toLowerCase();
      const network = String(k.network || "").toLowerCase();
      const extra = k.extra && typeof k.extra === "object" ? k.extra : null;
      const feePayer = extra && typeof extra.feePayer === "string" ? String(extra.feePayer) : "";
      if (scheme === "exact" && network.includes("solana") && feePayer) {
        _cachedDexterSolanaFeePayer = { value: feePayer, fetchedAt: now };
        return feePayer;
      }
    }
    _cachedDexterSolanaFeePayer = { value: "", fetchedAt: now };
    return null;
  } catch {
    return null;
  }
}

// USDC contract on Base mainnet
const USDC_BASE_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
// USDC mint on Solana mainnet
const USDC_SOLANA_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

function isLikelySolanaSignature(value: string): boolean {
  const s = value.trim();
  if (!s) return false;
  if (s.startsWith("0x")) return false;
  // Base58-ish string (Solana signatures are base58, typically 43-88 chars)
  return /^[1-9A-HJ-NP-Za-km-z]{32,96}$/.test(s);
}

function buildRefundRequestLinkHeader(requestUrl: string) {
  const origin = new URL(requestUrl).origin;
  const refundRequestUrl = `${origin}/v1/refunds`;
  const link = `<${refundRequestUrl}>; rel="https://x402refunds.com/rel/refund-request"; type="application/json"`;
  return { refundRequestUrl, link };
}

function buildRefundContactLinkHeader(): string {
  // Support bare email targets per our merchant integration doc:
  // Link: <refunds@yourdomain.com>; rel="https://x402refunds.com/rel/refund-contact"
  return `<${DEMO_AGENTS_REFUND_CONTACT_EMAIL}>; rel="https://x402refunds.com/rel/refund-contact"`;
}

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
  const payTo = getDemoAgentsPayToWallets();
  
  return new Response(JSON.stringify({
    status: "available",
    service: "image-generator",
    description: "AI image generation API powered by Pollinations AI",
    version: "1.0.0",
    x402Version: 1,
    payments: [
      {
        address: payTo.base,
        network: "base",
        currency: "USDC",
        price: "$0.01",
        priceWei: "10000", // 0.01 USDC (6 decimals)
        asset: USDC_BASE_MAINNET,
      },
      {
        address: payTo.solana,
        network: "solana",
        currency: "USDC",
        price: "$0.01",
        priceWei: "10000", // 0.01 USDC (6 decimals)
        asset: USDC_SOLANA_MAINNET,
      },
    ],
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
      "Access-Control-Allow-Origin": "*",
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
  const payTo = getDemoAgentsPayToWallets();
  console.log(`📨 POST request received`);
  const refundRequest = buildRefundRequestLinkHeader(request.url);
  const refundContactLink = buildRefundContactLinkHeader();
  
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
  
  // Step 1: Check for payment headers (supports both flows)
  const xPayment = request.headers.get("X-PAYMENT");
  const txHash = request.headers.get("X-402-Transaction-Hash");
  const xPaymentResponseHeader =
    request.headers.get("X-PAYMENT-RESPONSE") ?? request.headers.get("X-402-PAYMENT-RESPONSE");
  
  console.log(`   X-PAYMENT: ${xPayment ? 'present' : 'missing'}`);
  console.log(`   X-402-Transaction-Hash: ${txHash ? 'present' : 'missing'}`);
  console.log(`   X-PAYMENT-RESPONSE: ${xPaymentResponseHeader ? 'present' : 'missing'}`);

  // Helper: decode base64(JSON(...)) payment response and extract a tx hash/tx id if present.
  function tryExtractTxHashFromPaymentResponse(headerValue: string | null): string | null {
    if (!headerValue) return null;
    try {
      const decoded = JSON.parse(atob(headerValue));
      const candidate =
        decoded?.transactionHash ??
        decoded?.transaction ??
        decoded?.txHash ??
        decoded?.txid ??
        null;
      return typeof candidate === "string" && candidate.length > 0 ? candidate : null;
    } catch {
      return null;
    }
  }

  // Some clients/facilitators may forward a payment response instead of a raw tx hash.
  const txHashFromPaymentResponse = tryExtractTxHashFromPaymentResponse(xPaymentResponseHeader);
  const effectiveTxHash = txHash ?? txHashFromPaymentResponse;

  // Avoid TS instantiation depth issues on Convex's generated api types by calling runAction via `any`.
  const runAction: any = ctx.runAction;
  
  // v1 schema format (Coinbase Payments MCP doesn't support v2)
  const paymentRequiredBase = {
      scheme: "exact",
      network: "base", // v1 uses simple network name
      maxAmountRequired: "10000", // v1 uses maxAmountRequired
      asset: USDC_BASE_MAINNET,
      payTo: payTo.base,
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
        // EIP-712 domain name for Circle USDC (EIP-3009) on EVM chains.
        // Many facilitators/clients derive signatures using the token's on-chain name ("USD Coin").
        name: "USD Coin",
        // EIP-3009 USDC uses EIP-712 domain version "2" on EVM networks.
        // Facilitators may reject payments without this metadata.
        version: "2"
      }
  };

  const solanaFeePayer =
    DEMO_AGENTS_SOLANA_FEE_PAYER || (await getDexterSolanaFeePayer()) || "";

  const paymentRequiredSolana = {
    scheme: "exact",
    network: "solana", // x402 v1 Solana mainnet
    maxAmountRequired: "10000",
    // Some facilitators expect `amount` instead of `maxAmountRequired`.
    amount: "10000",
    asset: USDC_SOLANA_MAINNET,
    payTo: payTo.solana,
    resource: request.url,
    description: "AI Image Generation via Pollinations",
    mimeType: "application/json",
    maxTimeoutSeconds: 60,
    outputSchema: paymentRequiredBase.outputSchema,
    extra: {
      name: "USDC",
      version: "1",
      ...(solanaFeePayer ? { feePayer: solanaFeePayer } : {}),
    },
  };

  if (!xPayment && !effectiveTxHash) {
    // Step 2: Discovery request - return 402 WITHOUT validating body
    console.log(`💰 No payment proof - returning 402 Payment Required (discovery)`);
    
    // v1 protocol: Payment requirements go in BODY only (no header)
    return new Response(JSON.stringify({
      x402Version: 1, // v1 protocol (Payments MCP doesn't support v2)
      error: "Payment required: 0.01 USDC on Base or Solana (send tx hash or use facilitated X-PAYMENT)",
      accepts: [paymentRequiredBase, paymentRequiredSolana]
    }), {
      status: 402,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "X-PAYMENT, X-402-Transaction-Hash, Content-Type",
        "Access-Control-Expose-Headers": "X-PAYMENT-RESPONSE, Link",
        "Link": refundContactLink,
      }
    });
  }
  
  // Step 3: Payment proof provided - determine which flow
  console.log(`✅ Payment proof provided`);
  console.log(
    `   Flow: ${effectiveTxHash ? 'Transaction Hash (blockchain / already settled)' : 'Signature (facilitator)'}`,
  );
  
  // FLOW 1: Transaction Hash (Brave Wallet, Coinbase Payments MCP)
  // This is the preferred path for payments-mcp clients: they settle via their own facilitator
  // and send us the final on-chain transaction hash.
  if (effectiveTxHash) {
    console.log(`🔗 Transaction hash provided - verifying on blockchain`);
    console.log(`   Transaction: ${effectiveTxHash.substring(0, 20)}...`);
    if (txHashFromPaymentResponse && !txHash) {
      console.log(`   Source: decoded payment response header`);
    }
    
    // Query blockchain directly to verify payment
    // @ts-ignore - Convex generated api types can trigger excessive instantiation depth in TS.
    const isSolana = isLikelySolanaSignature(effectiveTxHash);
    const txResult: any = await runAction((api as any).lib.blockchain.queryTransaction as any, {
      blockchain: isSolana ? "solana" : "base",
      transactionHash: effectiveTxHash,
      expectedToAddress: isSolana ? payTo.solana : payTo.base,
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
          "Access-Control-Allow-Origin": "*",
        }
      });
    }
    
    // Type guard: txResult.success is true
    if (!('fromAddress' in txResult)) {
      return new Response(JSON.stringify({
        error: "Invalid transaction result"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }
      });
    }
    
    console.log(`✅ Payment verified on-chain!`);
    console.log(`   From: ${txResult.fromAddress}`);
    console.log(`   To: ${txResult.toAddress}`);
    console.log(`   Amount: ${txResult.value} USDC`);

    // Defense-in-depth: ensure the USDC recipient matches our expected payTo
    const expectedTo = isSolana ? payTo.solana : payTo.base;
    if (String(txResult.toAddress || "") !== String(expectedTo)) {
      return new Response(JSON.stringify({
        error: "Payment recipient mismatch",
        expectedTo,
        actualTo: txResult.toAddress
      }), {
        status: 402,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }
      });
    }
    
    // Validate payment meets requirements (0.01 USDC)
    const paidAmount = parseFloat(txResult.value);
    const requiredAmount = 0.01;
    
    if (paidAmount < requiredAmount) {
      return new Response(JSON.stringify({
        error: `Insufficient payment: ${paidAmount} USDC (required: ${requiredAmount} USDC)`
      }), {
        status: 402,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
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
          "Access-Control-Allow-Origin": "*",
        }
      });
    }
    
    // Demo behavior: payment succeeds, service fails (so you can file a dispute).
    return new Response(JSON.stringify({
      error: {
        code: "model_overloaded",
        message: "Image generation model is currently overloaded. Please try again later.",
        type: "server_error",
        timestamp: new Date().toISOString(),
      },
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "X-PAYMENT, X-402-Transaction-Hash, Content-Type",
        "Access-Control-Expose-Headers": "Link",
        "Link": refundRequest.link,
      }
    });
  }
  
  // FLOW 2: Facilitated X-PAYMENT (Base EVM signature OR Solana partial tx).
  console.log(`🔐 X-PAYMENT provided - using facilitator flow`);
  if (!xPayment) {
    return new Response(JSON.stringify({
      x402Version: 1,
      error: "Payment required",
      accepts: [paymentRequiredBase, paymentRequiredSolana]
    }), {
      status: 402,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "X-PAYMENT, X-402-Transaction-Hash, Content-Type",
        "Access-Control-Expose-Headers": "X-PAYMENT-RESPONSE, Link",
        "Link": refundContactLink,
      }
    });
  }
  const xPaymentHeader = xPayment;

  // Decode X-PAYMENT (base64 JSON) for debugging. We NEVER return the full signature.
  let decodedPaymentPayload: any = null;
  try {
    decodedPaymentPayload = JSON.parse(atob(xPaymentHeader));
  } catch {
    decodedPaymentPayload = null;
  }
  
  try {
    const inferredNetwork =
      typeof decodedPaymentPayload?.network === "string"
        ? String(decodedPaymentPayload.network)
        : typeof decodedPaymentPayload?.accepted?.network === "string"
          ? String(decodedPaymentPayload.accepted.network)
          : typeof decodedPaymentPayload?.payload?.transaction === "string"
            ? "solana"
            : "base";

    const isSolana = inferredNetwork.toLowerCase().includes("solana");
    const decodedFeePayer =
      typeof decodedPaymentPayload?.accepted?.extra?.feePayer === "string"
        ? String(decodedPaymentPayload.accepted.extra.feePayer)
        : "";
    const solanaFeePayer = decodedFeePayer || DEMO_AGENTS_SOLANA_FEE_PAYER;

    const paymentRequirements = isSolana
      ? {
          scheme: "exact",
          network: "solana",
          maxAmountRequired: "10000",
          amount: "10000",
          asset: USDC_SOLANA_MAINNET,
          payTo: payTo.solana,
          resource: request.url,
          description: "Image generation API (demo - always returns 500 error)",
          mimeType: "application/json",
          maxTimeoutSeconds: 60,
          extra: {
            ...(solanaFeePayer ? { feePayer: solanaFeePayer } : {}),
          },
        }
      : {
          scheme: "exact",
          network: "base",
          maxAmountRequired: "10000",
          asset: USDC_BASE_MAINNET,
          payTo: payTo.base,
          resource: request.url,
          description: "Image generation API (demo - always returns 500 error)",
          mimeType: "application/json",
          maxTimeoutSeconds: 60,
          // For EVM `exact` payments, facilitators commonly require EIP-712 domain metadata
          // for the EIP-3009 token contract (USDC).
          extra: {
            name: "USD Coin",
            version: "2",
          },
        };
    
    console.log(`🔍 Step 1: Verifying payment with facilitator`);
    
    // STEP 1: Verify the payment signature BEFORE doing work
    const verifyResult = (await runAction((api as any).demoAgents.cdpAuth.verifyPayment, {
      paymentHeader: xPaymentHeader,
      paymentRequirements: paymentRequirements
    })) as any;
    
    console.log(`   Verification HTTP status: ${verifyResult.status}`);
    
    const verifyText = verifyResult.body;
    console.log(`   Verification response: ${verifyText.substring(0, 300)}`);

    // If the facilitator rejected the request (422 etc), surface the raw body and
    // include minimal context so clients can fix their X-PAYMENT formatting.
    if (typeof verifyResult.status === "number" && verifyResult.status >= 400) {
      let decodedXPayment: unknown = null;
      try {
        // Try both base64 and base64url-ish by normalizing.
        const normalized = xPaymentHeader.replace(/-/g, "+").replace(/_/g, "/");
        decodedXPayment = JSON.parse(atob(normalized));
      } catch {
        decodedXPayment = null;
      }

      return new Response(
        JSON.stringify({
          error: "Payment verification rejected by facilitator",
          facilitatorStatus: verifyResult.status,
          facilitator: verifyResult.facilitator,
          // body from facilitator is often plain-text on 4xx; pass through (truncated)
          details: typeof verifyText === "string" ? verifyText.substring(0, 1200) : String(verifyText),
          debug: {
            decodedPaymentPayloadShape:
              decodedXPayment && typeof decodedXPayment === "object"
                ? Object.keys(decodedXPayment as Record<string, unknown>).slice(0, 25)
                : null,
            paymentRequirements: {
              scheme: paymentRequirements.scheme,
              network: paymentRequirements.network,
              asset: paymentRequirements.asset,
              payTo: paymentRequirements.payTo,
              maxAmountRequired: paymentRequirements.maxAmountRequired,
              resource: paymentRequirements.resource,
            },
          },
        }),
        {
          status: 402,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Expose-Headers": "Link",
            "Link": refundContactLink,
          },
        },
      );
    }
    
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
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Expose-Headers": "Link",
          "Link": refundContactLink,
        }
      });
    }
    
    // Check if payment is valid
    if (!verifyData.isValid) {
      const invalidReason =
        verifyData.invalidReason ??
        verifyData.error ??
        verifyData.reason ??
        verifyData.message ??
        "unknown";

      console.error(`❌ Payment verification failed: ${invalidReason}`);

      // Provide debugging context (truncated) so clients can diagnose mismatched payload formats
      // without having to tail server logs.
      const facilitatorResponseSnippet =
        typeof verifyText === "string" ? verifyText.substring(0, 500) : "";

      const safeDecoded =
        decodedPaymentPayload && typeof decodedPaymentPayload === "object"
          ? {
              x402Version: decodedPaymentPayload.x402Version ?? decodedPaymentPayload.version,
              scheme: decodedPaymentPayload.scheme,
              network: decodedPaymentPayload.network,
              // expected shape for x402 exact evm: payload.signature + payload.authorization
              hasPayload: !!decodedPaymentPayload.payload,
              signaturePrefix:
                typeof decodedPaymentPayload.payload?.signature === "string"
                  ? `${decodedPaymentPayload.payload.signature.substring(0, 12)}…`
                  : undefined,
              authorization: decodedPaymentPayload.payload?.authorization
                ? {
                    from: decodedPaymentPayload.payload.authorization.from,
                    to: decodedPaymentPayload.payload.authorization.to,
                    value: decodedPaymentPayload.payload.authorization.value,
                    validAfter: decodedPaymentPayload.payload.authorization.validAfter,
                    validBefore: decodedPaymentPayload.payload.authorization.validBefore,
                    noncePrefix:
                      typeof decodedPaymentPayload.payload.authorization.nonce === "string"
                        ? `${decodedPaymentPayload.payload.authorization.nonce.substring(0, 12)}…`
                        : undefined,
                  }
                : undefined,
            }
          : null;

      // Log safe decoded payload + requirements for debugging payments-mcp clients.
      // (No full signature, no secrets.)
      console.log("🔎 X402 verify debug:", {
        invalidReason,
        facilitatorStatus: verifyResult.status,
        safeDecoded,
        paymentRequirements: {
          scheme: paymentRequirements.scheme,
          network: paymentRequirements.network,
          asset: paymentRequirements.asset,
          payTo: paymentRequirements.payTo,
          maxAmountRequired: paymentRequirements.maxAmountRequired,
          resource: paymentRequirements.resource,
        },
      });

      return new Response(
        JSON.stringify({
          error: `Invalid payment: ${invalidReason}`,
          payer: verifyData.payer,
          facilitatorStatus: verifyResult.status,
          facilitatorResponse: facilitatorResponseSnippet,
          debug: {
            paymentRequirements: {
              scheme: paymentRequirements.scheme,
              network: paymentRequirements.network,
              asset: paymentRequirements.asset,
              payTo: paymentRequirements.payTo,
              maxAmountRequired: paymentRequirements.maxAmountRequired,
            },
            decodedPaymentPayload: safeDecoded,
          },
        }),
        {
          status: 402,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Expose-Headers": "Link",
            "Link": refundContactLink,
          },
        }
      );
    }
    
    console.log(`✅ Payment verified! Payer: ${verifyData.payer?.substring(0, 10)}...`);
    
    // If the facilitator reports an already-settled transaction, prefer verifying on-chain and
    // delivering without calling /settle again.
    const alreadySettledTxHash: string | null =
      typeof verifyData.transactionHash === "string"
        ? verifyData.transactionHash
        : typeof verifyData.transaction === "string"
          ? verifyData.transaction
          : null;

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
    
    // STEP 3: Ensure payment is settled via facilitator BEFORE delivering output.
    // We do NOT gate delivery on immediate on-chain indexing/verification. In practice,
    // blockchain verification can lag even when the facilitator reports success.
    console.log(
      `💰 Step 3: Ensuring payment is settled via facilitator${alreadySettledTxHash ? " (already settled)" : ""}`,
    );

    if (alreadySettledTxHash) {
      // Already-settled per facilitator; deliver below.
    } else {
    
      // Call facilitator to settle payment
      const settleResult = (await runAction((api as any).demoAgents.cdpAuth.settlePayment, {
        paymentHeader: xPaymentHeader,
        paymentRequirements: paymentRequirements
      })) as any;
    
      console.log(`   Settlement HTTP status: ${settleResult.status}`);
    
      // Parse response
      const responseText = settleResult.body;
      console.log(`   Settlement response: ${responseText.substring(0, 300)}`);

      // If facilitator rejected settlement (422 etc), surface the raw body rather than
      // treating it as an "unexpected_settle_error".
      if (typeof settleResult.status === "number" && settleResult.status >= 400) {
        return new Response(
          JSON.stringify({
            error: "Payment settlement rejected by facilitator",
            facilitatorStatus: settleResult.status,
            facilitator: settleResult.facilitator,
            details: typeof responseText === "string" ? responseText.substring(0, 1200) : String(responseText),
          }),
          {
            status: 402,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Expose-Headers": "Link",
              "Link": refundContactLink,
            },
          },
        );
      }
    
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
        return new Response(
          JSON.stringify({
            error: "Payment settlement failed",
            details: settleData,
          }),
          {
            status: 402,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Expose-Headers": "Link",
              "Link": refundContactLink,
            },
          },
        );
      }

      const settledTxHash: string | null =
        typeof settleData.transaction === "string"
          ? settleData.transaction
          : typeof settleData.transactionHash === "string"
            ? settleData.transactionHash
            : null;

      if (!settledTxHash) {
        return new Response(
          JSON.stringify({
            error: "Settlement succeeded but did not include a transaction hash",
            details: settleData,
          }),
          {
            status: 502,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      }

      console.log(`✅ Settlement succeeded! Transaction: ${settledTxHash}`);

      // Encode settlement response for X-PAYMENT-RESPONSE header (v1 protocol)
      const paymentResponseB64 = btoa(JSON.stringify(settleData));
      // Generate real image URL using Pollinations AI
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(body.prompt)}?width=1024&height=1024&nologo=true`;
      
      // Deliver after facilitator settlement.
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
          "Access-Control-Allow-Headers": "X-PAYMENT, X-402-Transaction-Hash, Content-Type",
          "Access-Control-Expose-Headers": "X-PAYMENT-RESPONSE, Link",
          "X-PAYMENT-RESPONSE": paymentResponseB64,
          "Link": refundRequest.link,
        }
      });
    }
    
    // If we reached here, the facilitator reported the payment was already settled.
    console.log(`✅ Step 4: Generating image and returning 200 OK (already settled)`);

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(body.prompt)}?width=1024&height=1024&nologo=true`;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          image_url: imageUrl,
          format: "png",
          size: body.size || "1024x1024",
          prompt: body.prompt,
          model: body.model || "stable-diffusion-xl",
        },
        metadata: {
          generated_at: new Date().toISOString(),
          settlement: {
            success: true,
            transaction: alreadySettledTxHash,
            network: "base",
            source: "verify_reported_already_settled",
          },
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "X-PAYMENT, X-402-Transaction-Hash, Content-Type",
          "Access-Control-Expose-Headers": "X-PAYMENT-RESPONSE, Link",
          "Link": refundRequest.link,
        },
      },
    );
    
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
        "Access-Control-Allow-Headers": "X-PAYMENT, X-402-Transaction-Hash, Content-Type",
        "Access-Control-Expose-Headers": "X-PAYMENT-RESPONSE, Link",
        "Link": refundRequest.link,
      }
    });
  }
});

