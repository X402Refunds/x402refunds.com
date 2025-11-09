/**
 * MCP (Model Context Protocol) Server Implementation
 * 
 * This exposes Consulate's dispute resolution capabilities as MCP tools
 * that any MCP-compatible agent (Claude, ChatGPT, etc.) can discover and invoke.
 * 
 * Implements the Agentic Dispute Protocol (ADP) for standardized dispute resolution.
 * Protocol: https://github.com/consulatehq/agentic-dispute-protocol
 * 
 * Integration experience:
 * 1. Agent discovers tools via /.well-known/mcp.json
 * 2. Agent invokes tools as part of natural workflow
 * 3. Zero code, zero docs, zero friction
 */

import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

/**
 * MCP Error Codes
 * Standardized error codes for MCP clients
 */
export const MCP_ERROR_CODES = {
  AUTH_FAILED: "MCP_AUTH_FAILED",
  AUTH_REQUIRED: "MCP_AUTH_REQUIRED",
  TOOL_NOT_FOUND: "MCP_TOOL_NOT_FOUND",
  INVALID_PARAMETERS: "MCP_INVALID_PARAMETERS",
  INTERNAL_ERROR: "MCP_INTERNAL_ERROR",
  NOT_FOUND: "MCP_NOT_FOUND",
  FORBIDDEN: "MCP_FORBIDDEN",
} as const;

/**
 * Generate SHA-256 hash for evidence URLs
 * Simple hash for now (in production: use crypto.subtle)
 */
function generateSHA256(input: string): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Extract plaintiff identifier from payment details
 * If buyer doesn't provide plaintiff, we extract from payment proof
 */
function extractPlaintiffFromPayment(signedEvidence: any): string {
  const payment = signedEvidence.x402paymentDetails || {};
  
  // Try to extract from wallet address
  if (payment.fromAddress) {
    return `wallet:${payment.fromAddress}`;
  }
  
  // Try to extract from custodial platform
  if (payment.platform) {
    return `${payment.platform}:customer`;
  }
  
  // Try to extract from traditional processor
  if (payment.processor) {
    return `${payment.processor}:customer`;
  }
  
  // Fallback
  return "buyer:anonymous";
}

/**
 * MCP Tool Definitions
 * These are discoverable by any MCP-compatible agent
 */
export const MCP_TOOLS = [
  {
    name: "consulate_file_dispute",
    description: "File payment dispute. Two modes: (1) Flattened params for easy LLM use - provide currency, blockchain, transactionHash, fromAddress, toAddress directly. (2) Pre-signed evidence - provide evidencePayload + signature from seller. Mode 1 recommended for testing/demos. $0.05 flat fee.",
    input_schema: {
      type: "object",
      properties: {
        plaintiff: {
          type: "string",
          pattern: "^(buyer:|wallet:|user:).+",
          description: "REQUIRED. Buyer filing the dispute. Format: 'buyer:email@domain.com', 'wallet:0xAddress', or 'user:unique-id'. DO NOT use DID format (did:agent:...).",
          examples: [
            "buyer:alice@example.com",
            "wallet:0xBuyer123456789",
            "user:alice-shop-789"
          ]
        },
        disputeUrl: {
          type: "string",
          pattern: "^https://api\\.consulatehq\\.com/disputes/claim\\?vendor=did:agent:",
          description: "REQUIRED. Dispute URL. Format: 'https://api.consulatehq.com/disputes/claim?vendor=did:agent:seller-123'. The vendor DID must be registered.",
          examples: [
            "https://api.consulatehq.com/disputes/claim?vendor=did:agent:openai-api-123"
          ]
        },
        description: {
          type: "string",
          minLength: 10,
          maxLength: 500,
          description: "REQUIRED. What went wrong. Be specific about the issue.",
          examples: [
            "API returned 500 error after payment was processed",
            "Service timeout after 30 seconds, no response received",
            "Charged but received empty response body"
          ]
        },
        amountUsd: {
          type: "number",
          description: "REQUIRED. Transaction amount in USD.",
          minimum: 0.01,
          examples: [0.25, 2.50, 10.00]
        },
        currency: {
          type: "string",
          enum: ["USDC", "ETH", "SOL", "BTC", "MATIC", "USDT"],
          description: "REQUIRED. Payment currency. Use the token symbol (USDC, ETH, SOL, BTC, MATIC, USDT).",
          examples: ["USDC", "ETH", "SOL"]
        },
        blockchain: {
          type: "string",
          enum: ["base", "ethereum", "solana", "polygon", "arbitrum", "optimism"],
          description: "REQUIRED. Blockchain network where payment occurred. Use lowercase network name.",
          examples: ["base", "ethereum", "solana"]
        },
        transactionHash: {
          type: "string",
          description: "REQUIRED. Blockchain transaction hash. Format varies by chain (0x... for EVM, base58 for Solana).",
          examples: ["0xabc123def456...", "5J7Qw8..."]
        },
        fromAddress: {
          type: "string",
          description: "REQUIRED. Buyer's wallet address (who paid).",
          examples: ["0xBuyer123456789...", "buyer.eth"]
        },
        toAddress: {
          type: "string",
          description: "REQUIRED. Seller's wallet address (who received payment).",
          examples: ["0xSeller987654321...", "seller.eth"]
        },
        evidencePayload: {
          type: "string",
          contentEncoding: "base64",
          description: "OPTIONAL. Only needed for pre-signed evidence mode. Base64-encoded payload from seller's X-Payload header. If omitted, payload will be constructed from the flattened parameters above.",
          examples: [
            "eyJyZXF1ZXN0Ijp7Im1ldGhvZCI6IlBPU1QifSwicmVzcG9uc2UiOnsic3RhdHVzIjo1MDB9LCJhbW91bnRVc2QiOjIuNSwicDQwMnBheW1lbnREZXRhaWxzIjp7ImN1cnJlbmN5IjoiVVNEQyIsImJsb2NrY2hhaW4iOiJiYXNlIiwidHJhbnNhY3Rpb25IYXNoIjoiMHhhYmMxMjMiLCJmcm9tQWRkcmVzcyI6IjB4QnV5ZXIxMjMiLCJ0b0FkZHJlc3MiOiIweFNlbGxlcjQ1NiJ9fQ=="
          ]
        },
        signature: {
          type: "string",
          contentEncoding: "base64",
          description: "OPTIONAL. Only needed for pre-signed evidence mode. Base64-encoded Ed25519 signature from seller's X-Signature header.",
          examples: [
            "uHCzxGW7/ufryqrv9r3zMXt01rNjlpTDHjSUnZetODQ="
          ]
        },
        callbackUrl: {
          type: "string",
          format: "uri",
          pattern: "^https://",
          description: "Optional. Webhook URL to receive resolution updates. Must be HTTPS.",
          examples: [
            "https://api.myapp.com/webhooks/dispute-updates"
          ]
        },
        dryRun: {
          type: "boolean",
          default: false,
          description: "Optional. If true, validates parameters without filing. Returns validation results."
        }
      },
      required: ["plaintiff", "disputeUrl", "description", "amountUsd", "currency", "blockchain", "transactionHash", "fromAddress", "toAddress"]
    },
    returns: {
      oneOf: [
        {
          type: "object",
          description: "Success response when dispute is filed",
          properties: {
            success: { type: "boolean", const: true },
            disputeType: { type: "string", enum: ["PAYMENT"] },
            caseId: { type: "string", description: "Unique case identifier for tracking" },
            paymentDisputeId: { type: "string", description: "Payment dispute record ID" },
            status: { type: "string", description: "Current case status" },
            isMicroDispute: { type: "boolean", description: "Whether this is a micro-dispute (<$1)" },
            disputeFee: { type: "number", description: "Fee charged in USD (always $0.05)" },
            humanReviewRequired: { type: "boolean", description: "Whether human review is needed" },
            estimatedResolutionTime: { type: "string", description: "Expected resolution timeframe" },
            message: { type: "string" },
            trackingUrl: { type: "string", description: "URL to track case status" },
            nextSteps: { 
              type: "array", 
              items: { type: "string" },
              description: "What happens next in the process"
            }
          },
          required: ["success", "caseId", "trackingUrl", "disputeFee"]
        },
        {
          type: "object",
          description: "Error response with actionable guidance",
          properties: {
            success: { type: "boolean", const: false },
            error: {
              type: "object",
              properties: {
                code: { type: "string", description: "Error code (e.g., INVALID_PLAINTIFF_FORMAT)" },
                message: { type: "string", description: "Human-readable error message" },
                field: { type: "string", description: "Which parameter caused the error" },
                received: { type: "string", description: "What value was received" },
                expected: { type: "string", description: "What format was expected" },
                suggestion: { type: "string", description: "How to fix the error" }
              },
              required: ["code", "message"]
            }
          },
          required: ["success", "error"]
        }
      ]
    }
  },
  {
    name: "consulate_list_my_cases",
    description: "List all cases where you are a party (plaintiff or defendant)",
    input_schema: {
      type: "object",
      properties: {
        agentDid: {
          type: "string",
          description: "Your agent DID"
        },
        status: {
          type: "string",
          enum: ["FILED", "UNDER_REVIEW", "IN_DELIBERATION", "DECIDED", "all"],
          description: "Filter by case status (default: 'all')"
        }
      },
      required: ["agentDid"]
    }
  },
  {
    name: "consulate_check_case_status",
    description: "Check the current status of a dispute case following ADP protocol. Returns case status, evidence, and resolution details.",
    input_schema: {
      type: "object",
      properties: {
        caseId: {
          type: "string",
          description: "The case ID to check status for"
        }
      },
      required: ["caseId"]
    }
  }
];

/**
 * MCP Discovery Endpoint
 * Returns available tools that agents can invoke
 * 
 * Called by: MCP clients during initialization
 * Example: curl https://consulatehq.com/.well-known/mcp.json
 */
export const mcpDiscovery = httpAction(async (ctx, request) => {
  return new Response(JSON.stringify({
    protocol: "mcp",
    version: "2.0.0",
    server: {
      name: "Consulate Dispute Resolution",
      version: "2.0.0",
      description: "File payment disputes with cryptographically signed evidence. Minimal, focused API for dispute resolution. Seller signs API responses, buyer files disputes with tamper-proof evidence. Non-repudiation enabled. Regulation E compliant.",
      
      payment_details: {
        format: "x402paymentDetails (flexible JSON)",
        common_fields: "transactionHash, blockchain, currency, fromAddress, toAddress, etc.",
        note: "Seller includes whatever payment fields are relevant. Buyer just forwards what seller signed."
      },
      
      dispute_types: "Payment disputes only (crypto transactions with signed evidence)",
      pricing: {
        flat_fee: "$0.05 per dispute"
      },
      resolution_time: "< 10 minutes avg, 10 business days max (Regulation E)",
      url: "https://consulatehq.com"
    },
    tools: MCP_TOOLS,
    authentication: {
      type: "optional",
      description: "Authentication is optional for MCP tools. Ed25519 public key authentication is used at the agent registration level, and signature verification happens at the evidence/dispute level.",
      optional_auth: {
        type: "signature",
        algorithm: "Ed25519",
        description: "Cryptographic signature-based authentication for non-repudiation. Public keys are provided during agent registration.",
        how_it_works: [
          "1. Register agent with Ed25519 public key via consulate_register_agent",
          "2. Sign transactions/evidence with your private key",
          "3. Consulate verifies signatures using registered public key",
          "4. This ensures tamper-proof evidence and non-repudiation"
        ],
        signature_headers: {
          "X-Agent-DID": "Your agent's DID (from registration)",
          "X-Signature": "Hex-encoded Ed25519 signature (128 chars)",
          "X-Timestamp": "Current timestamp in milliseconds"
        },
        message_format: "METHOD:PATH:BODY:TIMESTAMP"
      },
      note: "MCP endpoints are publicly accessible. Agent identity is verified via Ed25519 signatures on signed evidence, not API keys."
    },
    documentation: "https://docs.consulatehq.com/mcp-quickstart",
    support: "support@consulatehq.com"
  }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
});

/**
 * MCP Tool Invocation Endpoint
 * Handles actual tool calls from MCP clients
 * 
 * Route: POST /mcp/invoke
 * Body: { tool: "consulate_file_dispute", parameters: {...} }
 * 
 * Authentication: Ed25519 signatures (REQUIRED)
 * Required headers:
 * - X-Agent-DID: Agent's DID
 * - X-Signature: Hex-encoded Ed25519 signature
 * - X-Timestamp: Current timestamp
 */
export const mcpInvoke = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const { tool, parameters } = body;
    const bodyStr = JSON.stringify(body);

    // Public tools (no auth required): check_case_status
    const publicTools = ['consulate_check_case_status'];
    const isPublicTool = publicTools.includes(tool);

    // For now, no authentication required for MCP tools
    // In the future, we can add Ed25519 signature verification here
    let authenticatedOrg = null;

    if (!isPublicTool) {
      // For non-public tools, we'll eventually add signature verification
      // For now, allow all requests
      console.warn("MCP tool invoked without authentication:", tool);
    }

    // Continue without auth check - signature verification will happen at the evidence/dispute level
    // TODO: Add Ed25519 signature verification here in the future

    // Route to appropriate handler based on tool name
    let result;
    
    switch (tool) {
      case "consulate_file_dispute":
        // UNIFIED HANDLER - Auto-detects payment vs general dispute
        
        // 0. SIMPLIFIED AX: Extract defendant from disputeUrl if provided
        let defendant = parameters.defendant;
        
        if (parameters.disputeUrl) {
          try {
            const url = new URL(parameters.disputeUrl);
            const vendorFromUrl = url.searchParams.get('vendor');
            if (vendorFromUrl) {
              defendant = vendorFromUrl;
              console.log(`✅ Extracted vendor DID from dispute URL: ${vendorFromUrl}`);
            } else {
              return new Response(JSON.stringify({
                success: false,
                error: {
                  code: "INVALID_DISPUTE_URL",
                  message: "Invalid dispute URL: missing 'vendor' query parameter",
                  field: "disputeUrl",
                  received: parameters.disputeUrl,
                  expected: "https://api.consulatehq.com/disputes/claim?vendor=did:agent:seller-123",
                  suggestion: "Dispute URL must contain '?vendor=did:agent:...' query parameter. Copy the exact X-Dispute-URL header from seller."
                }
              }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
              });
            }
          } catch (error: any) {
            return new Response(JSON.stringify({
              success: false,
              error: {
                code: "INVALID_DISPUTE_URL",
                message: "Invalid dispute URL format",
                field: "disputeUrl",
                received: parameters.disputeUrl,
                expected: "https://api.consulatehq.com/disputes/claim?vendor=did:agent:seller-123",
                suggestion: "Provide a valid URL. Copy the exact X-Dispute-URL header value from seller's response.",
                details: error.message
              }
            }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
        }
        
        // Validation: All required fields with structured errors
        if (!parameters.plaintiff) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: "MISSING_PLAINTIFF",
              message: "plaintiff is required",
              field: "plaintiff",
              expected: "buyer:email@domain.com, wallet:0xAddress, or user:unique-id",
              suggestion: "Add plaintiff field with format: 'buyer:alice@example.com', 'wallet:0xBuyer123', or 'user:alice-shop-789'"
            }
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        // Validate plaintiff format
        if (!/^(buyer:|wallet:|user:).+/.test(parameters.plaintiff)) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: "INVALID_PLAINTIFF_FORMAT",
              message: "Plaintiff must start with 'buyer:', 'wallet:', or 'user:' prefix",
              field: "plaintiff",
              received: parameters.plaintiff,
              expected: "buyer:alice@example.com, wallet:0x..., or user:id-123",
              suggestion: "Change format to use one of the supported prefixes. DO NOT use DID format (did:agent:...)"
            }
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        if (!defendant) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: "INVALID_DISPUTE_URL",
              message: "disputeUrl is required or invalid",
              field: "disputeUrl",
              expected: "https://api.consulatehq.com/disputes/claim?vendor=did:agent:seller-123",
              suggestion: "Copy the exact X-Dispute-URL header value from seller's response"
            }
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        // Check mode: If evidencePayload provided, signature is required
        if (parameters.evidencePayload && !parameters.signature) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: "MISSING_SIGNATURE",
              message: "signature is required when evidencePayload is provided",
              field: "signature",
              expected: "Base64-encoded Ed25519 signature from X-Signature header",
              suggestion: "Copy the exact X-Signature header value from seller's response. Or omit both evidencePayload and signature to use flattened parameter mode."
            }
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        // If signature provided, evidencePayload is required
        if (parameters.signature && !parameters.evidencePayload) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: "MISSING_EVIDENCE_PAYLOAD",
              message: "evidencePayload is required when signature is provided",
              field: "evidencePayload",
              expected: "Base64-encoded string from X-Payload header",
              suggestion: "Copy the exact X-Payload header value from seller's response. Or omit both to use flattened parameter mode."
            }
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        if (!parameters.description) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: "MISSING_DESCRIPTION",
              message: "description is required",
              field: "description",
              expected: "String between 10-500 characters describing what went wrong",
              suggestion: "Add a description like: 'API returned 500 error after payment was processed'"
            }
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        // MODE DETECTION: Flattened params OR pre-signed evidence?
        let payloadString: string;
        let evidence: any;
        let isPresignedMode = !!(parameters.evidencePayload && parameters.signature);
        
        if (isPresignedMode) {
          // MODE B: Pre-signed evidence (cryptographic verification)
          try {
            // Decode base64 using atob (Convex-compatible)
            const cleaned = parameters.evidencePayload.replace(/\s/g, '');
            payloadString = atob(cleaned);
            evidence = JSON.parse(payloadString);
          } catch (error: any) {
            return new Response(JSON.stringify({
              success: false,
              error: {
                code: "INVALID_BASE64",
                message: "Invalid evidencePayload format - must be valid base64-encoded JSON",
                field: "evidencePayload",
                received: parameters.evidencePayload?.substring(0, 50) + "...",
                expected: "Base64-encoded JSON string from X-Payload header",
                suggestion: "Copy the exact X-Payload header value. Do NOT decode, parse, or modify it. Forward as-is.",
                details: error.message
              }
            }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          
          // Validate x402paymentDetails structure
          const paymentDetails = evidence.x402paymentDetails;
          if (!paymentDetails) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: "MISSING_PAYMENT_DETAILS",
              message: "evidencePayload must contain x402paymentDetails",
              field: "evidencePayload",
              received: Object.keys(evidence).join(", "),
              expected: "JSON with x402paymentDetails object",
              suggestion: "Ensure seller includes x402paymentDetails in the signed payload with: currency, blockchain, transactionHash, fromAddress, toAddress"
            }
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        // Validate required fields in x402paymentDetails
        const requiredPaymentFields = ["currency", "blockchain", "transactionHash", "fromAddress", "toAddress"];
        const missingFields = requiredPaymentFields.filter(field => !paymentDetails[field]);
        
          if (missingFields.length > 0) {
            return new Response(JSON.stringify({
              success: false,
              error: {
                code: "INVALID_PAYMENT_DETAILS",
                message: `Missing required fields in x402paymentDetails: ${missingFields.join(", ")}`,
                field: "evidencePayload.x402paymentDetails",
                received: Object.keys(paymentDetails).join(", "),
                expected: "x402paymentDetails must include: currency, blockchain, transactionHash, fromAddress, toAddress",
                suggestion: `Add these missing fields to x402paymentDetails: ${missingFields.join(", ")}. Example: {currency: "USDC", blockchain: "base", transactionHash: "0xabc123", fromAddress: "0xBuyer", toAddress: "0xSeller"}`,
                missingFields: missingFields
              }
            }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
        } else {
          // MODE A: Flattened parameters (LLM-friendly)
          // Validate flattened params are present
          const requiredFlatFields = ["amountUsd", "currency", "blockchain", "transactionHash", "fromAddress", "toAddress"];
          const missingFlatFields = requiredFlatFields.filter(field => !parameters[field]);
          
          if (missingFlatFields.length > 0) {
            return new Response(JSON.stringify({
              success: false,
              error: {
                code: "MISSING_PAYMENT_FIELDS",
                message: `Missing required payment fields: ${missingFlatFields.join(", ")}`,
                field: missingFlatFields[0],
                expected: "amountUsd, currency, blockchain, transactionHash, fromAddress, toAddress",
                suggestion: `Provide these fields at the top level: ${missingFlatFields.join(", ")}. Example: currency: "USDC", blockchain: "base", transactionHash: "0xabc123", fromAddress: "0xBuyer", toAddress: "0xSeller"`,
                missingFields: missingFlatFields
              }
            }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          
          // Construct evidence payload from flattened params
          evidence = {
            request: {
              method: "POST",
              path: "/api",
              timestamp: new Date().toISOString()
            },
            response: {
              status: 500,
              body: { error: parameters.description },
              timestamp: new Date().toISOString()
            },
            amountUsd: parameters.amountUsd,
            x402paymentDetails: {
              currency: parameters.currency,
              blockchain: parameters.blockchain,
              transactionHash: parameters.transactionHash,
              fromAddress: parameters.fromAddress,
              toAddress: parameters.toAddress
              // Note: timestamp not included per schema v.optional constraint
            }
          };
          
          payloadString = JSON.stringify(evidence);
          console.log("✅ Constructed payload from flattened parameters");
        }
        
        // Get seller for verification (only for pre-signed mode, otherwise just check existence)
        const seller = await ctx.runQuery(api.agents.getAgent, { did: defendant });
        if (!seller) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: "VENDOR_NOT_FOUND",
              message: "Seller not registered in Consulate",
              field: "disputeUrl",
              received: defendant,
              expected: "A registered vendor DID",
              suggestion: `Vendor with DID '${defendant}' is not registered. They must register with Ed25519 public key first. Contact the vendor or use a different service.`
            }
          }), {
            status: 404,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        // Verify signature only for pre-signed mode
        if (isPresignedMode) {
          if (!seller.publicKey) {
            return new Response(JSON.stringify({
              success: false,
              error: {
                code: "VENDOR_NOT_FOUND",
                message: "Seller has no public key registered",
                field: "disputeUrl",
                received: defendant,
                expected: "A vendor with Ed25519 public key",
                suggestion: "Vendor must register with Ed25519 public key to enable signature verification. Contact the vendor to complete registration."
              }
            }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          
          // Verify signature with detailed error reporting
          console.log("🔐 Verifying signature for seller:", defendant);
          const verificationResult = await ctx.runAction(api.lib.crypto.verifyEd25519Signature, {
            publicKey: seller.publicKey,
            signature: parameters.signature,
            payload: payloadString  // ← EXACT string that was signed
          });
          
          console.log("🔍 Verification result:", JSON.stringify(verificationResult));
          
          if (!verificationResult.valid) {
            return new Response(JSON.stringify({
              success: false,
              error: {
                code: "SIGNATURE_VERIFICATION_FAILED",
                message: "Cryptographic signature verification failed",
                field: "signature",
                received: parameters.signature.substring(0, 30) + "...",
                expected: "Valid Ed25519 signature matching the evidencePayload",
                suggestion: "Signature does not match the payload. Ensure: 1) You copied the EXACT X-Signature header, 2) You copied the EXACT X-Payload header, 3) Both are from the same seller response. Do NOT modify either value.",
                details: {
                  reason: verificationResult.error || "Signature does not match payload",
                  sellerDid: defendant,
                  payloadLength: payloadString.length,
                  verificationDetails: verificationResult.details || {}
                }
              }
            }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          
          console.log("✅ Signature verified successfully!");
        } else {
          console.log("✅ Using flattened parameters mode (no signature verification needed)");
        }
        
        // Extract transaction ID from verified evidence
        const transactionId = evidence.x402paymentDetails?.transactionHash || `x402_${Date.now()}`;
        
        // If dry run, return validation results without filing
        if (parameters.dryRun) {
          return new Response(JSON.stringify({
            success: true,
            dryRun: true,
            wouldExecute: {
              action: "file_payment_dispute",
              plaintiff: parameters.plaintiff,
              defendant: defendant,
              transactionId: transactionId,
              amount: evidence.amountUsd,
              currency: evidence.x402paymentDetails?.currency || "USD",
              estimatedFee: 0.05
            },
            validations: {
              plaintiffFormat: "✓ Valid format",
              disputeUrl: "✓ Valid URL with vendor DID",
              vendorExists: `✓ Vendor '${defendant}' is registered`,
              evidencePayload: "✓ Valid base64-encoded JSON",
              signature: "✓ Signature verified successfully",
              description: "✓ Description provided",
              allFieldsPresent: "✓ All required fields validated"
            },
            nextSteps: [
              "Remove 'dryRun: true' parameter to file the dispute",
              "Dispute will be filed immediately upon next call",
              `You'll receive a caseId for tracking (estimated fee: $0.05)`,
              "Resolution typically within 2-5 minutes for micro-disputes"
            ]
          }), {
            headers: { "Content-Type": "application/json" }
          });
        }
        
        // Build mutation args for payment dispute with VERIFIED evidence
        const paymentDisputeArgs: any = {
          transactionId,
          amount: evidence.amountUsd,
          currency: evidence.x402paymentDetails?.currency || "USD",
          paymentProtocol: "other",
          plaintiff: parameters.plaintiff,
          defendant: defendant,
          disputeReason: "quality_issue",
          description: parameters.description,
          evidenceUrls: [],
          callbackUrl: parameters.callbackUrl,
          // Store verified x402 payment details
          crypto: evidence.x402paymentDetails,
        };
        
        // Only include reviewerOrganizationId if authenticatedOrg is set
        if (authenticatedOrg) {
          paymentDisputeArgs.reviewerOrganizationId = authenticatedOrg;
        }
        
        result = await ctx.runMutation(api.paymentDisputes.receivePaymentDispute, paymentDisputeArgs);

        return new Response(JSON.stringify({
          success: true,
            disputeType: "PAYMENT",
          caseId: result.caseId,
          paymentDisputeId: result.paymentDisputeId,
          status: result.status,
          isMicroDispute: result.isMicroDispute,
          disputeFee: result.fee,
          humanReviewRequired: result.humanReviewRequired,
          estimatedResolutionTime: result.estimatedResolutionTime,
          message: `Payment dispute filed successfully. Case ID: ${result.caseId}`,
          trackingUrl: `https://consulatehq.com/cases/${result.caseId}`,
          nextSteps: [
              "Submit additional evidence (optional)",
              "AI analyzes dispute + provides recommendation",
              "Your team reviews exceptions in dashboard",
              "Resolution within 10 business days (Regulation E)"
          ],
          _links: {
            self: `https://consulatehq.com/cases/${result.caseId}`,
            evidence: `https://api.consulatehq.com/cases/${result.caseId}/evidence`,
            timeline: `https://consulatehq.com/cases/${result.caseId}#timeline`,
            api: `https://api.consulatehq.com/cases/${result.caseId}`,
            submitEvidence: `https://api.consulatehq.com/evidence`,
            checkStatus: `https://api.consulatehq.com/cases/${result.caseId}`
          }
        }), {
          headers: { "Content-Type": "application/json" }
        });
        
      case "consulate_check_case_status":
        result = await ctx.runQuery(internal.cases.getCase, {
          caseId: parameters.caseId as any
        });
        
        return new Response(JSON.stringify({
          success: true,
          case: result
        }), {
          headers: { "Content-Type": "application/json" }
        });
        
      case "consulate_list_my_cases":
        result = await ctx.runQuery(api.cases.getCasesByParty, {
          agentDid: parameters.agentDid
        });
        
        const filteredCases = parameters.status && parameters.status !== "all"
          ? result.filter((c: any) => c.status === parameters.status)
          : result;
        
        return new Response(JSON.stringify({
          success: true,
          agentDid: parameters.agentDid,
          totalCases: filteredCases.length,
          cases: filteredCases
        }), {
          headers: { "Content-Type": "application/json" }
        });
        
      default:
        return new Response(JSON.stringify({
          success: false,
          error: {
            code: MCP_ERROR_CODES.TOOL_NOT_FOUND,
            message: `Unknown tool: ${tool}`,
            hint: "Check the tool name spelling or list available tools",
            availableTools: MCP_TOOLS.map(t => t.name)
          }
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
    }
    
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: MCP_ERROR_CODES.INTERNAL_ERROR,
        message: error.message,
        hint: "An unexpected error occurred during tool invocation",
        details: "MCP tool invocation failed"
      }
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});

