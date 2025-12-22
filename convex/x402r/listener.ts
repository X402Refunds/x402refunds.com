/**
 * x402r Dispute Listener
 * 
 * Webhook endpoint that receives dispute notifications from the x402r protocol
 * When a buyer raises a dispute on an escrow, x402r calls this endpoint
 * 
 * Endpoint: POST /x402r/dispute
 * 
 * Flow:
 * 1. Check feature flag (return 503 if disabled)
 * 2. Validate webhook payload
 * 3. Check whitelist (if enabled)
 * 4. Store dispute in cases table with x402rEscrow field
 * 5. Trigger AI analysis workflow (reuses existing logic)
 */

import { httpAction, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { isX402rEnabled, validateConfig, isWhitelisted, X402R_CONFIG } from "./config";

/**
 * Webhook payload from x402r protocol
 */
interface X402rDisputePayload {
  escrowAddress: string;
  buyer: string;
  merchant: string;
  amount: number;
  currency: string;
  blockchain: string;
  evidence: {
    request: {
      method: string;
      url: string;
      headers: Record<string, string>;
      body?: any;
    };
    response: {
      status: number;
      headers: Record<string, string>;
      body?: any;
    };
  };
  arbiterAddress: string;
  disputeReason?: string;
  description?: string;
  timestamp?: number;
}

/**
 * HTTP endpoint: POST /x402r/dispute
 * 
 * Receives dispute events from x402r protocol
 */
export default httpAction(async (ctx, request) => {
  const path = new URL(request.url).pathname;
  
  // Route: POST /x402r/dispute
  if (path === "/x402r/dispute" && request.method === "POST") {
    return await receiveEscrowDispute(ctx, request);
  }
  
  // 404 for unknown routes
  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
});

/**
 * Handle incoming escrow dispute
 */
async function receiveEscrowDispute(ctx: any, request: Request): Promise<Response> {
  console.log("📨 x402r dispute webhook received");
  
  // Check feature flag FIRST (fail fast if disabled)
  if (!isX402rEnabled()) {
    console.log("⏸️  x402r integration disabled (feature flag off)");
    return new Response(
      JSON.stringify({
        error: "x402r support not enabled",
        message: "This arbiter is not currently accepting x402r disputes",
        code: "X402R_DISABLED",
      }),
      {
        status: 503, // Service Unavailable
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  
  // Validate configuration
  const missingConfig = validateConfig();
  if (missingConfig.length > 0) {
    console.error("❌ x402r configuration incomplete:", missingConfig);
    return new Response(
      JSON.stringify({
        error: "Configuration error",
        message: "x402r integration not properly configured",
        code: "X402R_CONFIG_ERROR",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  
  // Parse payload
  let payload: X402rDisputePayload;
  try {
    payload = await request.json();
  } catch (error) {
    console.error("❌ Invalid JSON payload:", error);
    return new Response(
      JSON.stringify({
        error: "Invalid payload",
        message: "Request body must be valid JSON",
        code: "INVALID_JSON",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  
  // Validate required fields
  const requiredFields = ["escrowAddress", "buyer", "merchant", "amount", "currency", "evidence"];
  const missingFields = requiredFields.filter(field => !(field in payload));
  
  if (missingFields.length > 0) {
    console.error("❌ Missing required fields:", missingFields);
    return new Response(
      JSON.stringify({
        error: "Validation error",
        message: `Missing required fields: ${missingFields.join(", ")}`,
        code: "MISSING_FIELDS",
        missingFields,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  
  // Check whitelist (if enabled for staged rollout)
  if (!isWhitelisted(payload.merchant)) {
    console.log(`⏸️  Merchant ${payload.merchant} not whitelisted`);
    return new Response(
      JSON.stringify({
        error: "Not whitelisted",
        message: "This merchant is not authorized for x402r disputes yet",
        code: "NOT_WHITELISTED",
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  
  // Verify arbiter address matches our configured address
  if (payload.arbiterAddress.toLowerCase() !== X402R_CONFIG.arbiterAddress.toLowerCase()) {
    console.error(
      `❌ Arbiter address mismatch: expected ${X402R_CONFIG.arbiterAddress}, got ${payload.arbiterAddress}`
    );
    return new Response(
      JSON.stringify({
        error: "Invalid arbiter",
        message: "This dispute is not assigned to this arbiter",
        code: "ARBITER_MISMATCH",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  
  console.log(`✅ x402r dispute validated for escrow ${payload.escrowAddress}`);
  
  try {
    // Store dispute and trigger workflow (via internal mutation)
    const result = await ctx.runMutation(internal.x402r.listener.storeEscrowDispute, {
      payload: JSON.stringify(payload),
    });
    
    console.log(`✅ Dispute stored with case ID: ${result.caseId}`);
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        caseId: result.caseId,
        status: "RECEIVED",
        message: "Dispute received and queued for analysis",
        estimatedResolutionTime: "24-48 hours",
      }),
      {
        status: 201, // Created
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ Failed to store dispute:", error);
    return new Response(
      JSON.stringify({
        error: "Internal error",
        message: "Failed to process dispute",
        code: "PROCESSING_ERROR",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Internal mutation: Store escrow dispute in database
 * Creates a case with x402rEscrow field populated
 */
export const storeEscrowDispute = internalMutation({
  args: {
    payload: v.string(), // JSON string of X402rDisputePayload
  },
  handler: async (ctx, args): Promise<{ caseId: string }> => {
    const payload: X402rDisputePayload = JSON.parse(args.payload);
    
    // Use adapter to convert to case format
    const caseId = await ctx.runMutation(internal.x402r.adapter.convertX402rDisputeToCase, {
      escrowAddress: payload.escrowAddress,
      buyer: payload.buyer,
      merchant: payload.merchant,
      amount: payload.amount,
      currency: payload.currency,
      blockchain: payload.blockchain,
      evidence: JSON.stringify(payload.evidence),
      disputeReason: payload.disputeReason || "escrow_dispute",
      description: payload.description || `Escrow dispute for ${payload.escrowAddress}`,
      timestamp: payload.timestamp || Date.now(),
    });
    
    console.log(`📝 Created case ${caseId} for x402r escrow ${payload.escrowAddress}`);
    
    return { caseId };
  },
});

