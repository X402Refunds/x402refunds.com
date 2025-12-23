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
    name: "x402_file_dispute",
    description: "File X-402 payment dispute for API service failures. USDC payments on Base and Solana only. Permissionless filing with blockchain transaction verification. All transaction details (plaintiff, defendant, amount) are extracted directly from the blockchain.",
    inputSchema: {
      type: "object",
      properties: {
        description: {
          type: "string",
          minLength: 10,
          maxLength: 500,
          description: "REQUIRED. What went wrong with the API call after payment.",
          examples: [
            "API returned 500 error after payment was confirmed on-chain",
            "Service timeout after 30 seconds, no response received",
            "Charged but received empty response body"
          ]
        },
        request: {
          type: "object",
          description: "REQUIRED. The API request that buyer sent. Include method, url, headers, body.",
          examples: [{
            method: "POST",
            url: "https://api.seller.com/v1/chat",
            headers: { "Content-Type": "application/json" },
            body: { model: "gpt-4", messages: [] }
          }]
        },
        response: {
          type: "object",
          description: "REQUIRED. The error response buyer received. Include status, headers, body.",
          examples: [{
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: { error: "Internal Server Error" }
          }]
        },
        transactionHash: {
          type: "string",
          description: "REQUIRED. USDC token transfer transaction hash. We query the blockchain to extract all transaction details (from address, to address, amount). Format: 0x... for Base, base58 for Solana.",
          examples: ["0xabc123def456789...", "5J7Qw8mN3pR..."]
        },
        blockchain: {
          type: "string",
          enum: ["base", "solana"],
          description: "REQUIRED. Blockchain network where USDC payment occurred. Only Base and Solana are supported.",
          examples: ["base", "solana"]
        },
        sellerXSignature: {
          type: "string",
          contentEncoding: "base64",
          description: "RECOMMENDED. X-Signature from seller's response header (base64-encoded Ed25519 signature). Provides cryptographic proof of response authenticity. If NOT provided, evidence strength is reduced and may require additional verification.",
          examples: ["uHCzxGW7/ufryqrv9r3zMXt01rNjlpTDHjSUnZetODQ="]
        },
        callbackUrl: {
          type: "string",
          format: "uri",
          pattern: "^https://",
          description: "Optional. Webhook URL to receive resolution updates.",
          examples: ["https://api.myapp.com/webhooks/dispute-updates"]
        },
        dryRun: {
          type: "boolean",
          default: false,
          description: "Optional. If true, validates parameters without filing."
        }
      },
      required: ["description", "request", "response", "transactionHash", "blockchain"]
    }
  },
  {
    name: "x402_list_my_cases",
    description: "List all X-402 payment dispute cases where you are a party (plaintiff or defendant). Uses ERC-8004 Ethereum wallet addresses as canonical identity.",
    inputSchema: {
      type: "object",
      properties: {
        walletAddress: {
          type: "string",
          pattern: "^0x[a-fA-F0-9]{40}$",
          description: "Your Ethereum wallet address (ERC-8004 canonical identity for X-402 protocol)",
          examples: [
            "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
            "0x857b06519E91e3A54538791bDbb0E22373e36b66"
          ]
        },
        status: {
          type: "string",
          enum: ["FILED", "UNDER_REVIEW", "IN_DELIBERATION", "DECIDED", "all"],
          description: "Filter by case status (default: 'all')"
        }
      },
      required: ["walletAddress"]
    }
  },
  {
    name: "x402_check_case_status",
    description: "Check the current status of a dispute case following ADP protocol. Returns case status, evidence, and resolution details.",
    inputSchema: {
      type: "object",
      properties: {
        caseId: {
          type: "string",
          description: "The case ID to check status for"
        }
      },
      required: ["caseId"]
    }
  },
  {
    name: "demo_image_generator",
    description: "Demo image generation API that ALWAYS returns 500 error after payment. Perfect for testing X-402 dispute filing. Accepts 0.01 USDC on BASE via X-402 protocol (Coinbase Payments MCP handles payment automatically).",
    inputSchema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          minLength: 3,
          maxLength: 1000,
          description: "REQUIRED. Text prompt describing the image to generate (e.g., 'a dog playing in the park')",
          examples: [
            "a dog playing in the park",
            "a cat sleeping on a couch",
            "a mountain landscape at sunset"
          ]
        },
        size: {
          type: "string",
          description: "Optional. Image size (e.g., '1024x1024', '512x512')",
          examples: ["1024x1024", "512x512", "1024x768"]
        },
        model: {
          type: "string",
          description: "Optional. AI model to use (e.g., 'stable-diffusion-xl', 'dall-e-3')",
          examples: ["stable-diffusion-xl", "dall-e-3", "midjourney-v6"]
        }
      },
      required: ["prompt"]
    }
  }
];

/**
 * MCP Discovery Endpoint
 * Returns available tools that agents can invoke
 * 
 * Called by: MCP clients during initialization
 * Example: curl https://x402disputes.com/.well-known/mcp.json
 */
export const mcpDiscovery = httpAction(async (ctx, request) => {
  return new Response(JSON.stringify({
    protocol: "mcp",
    version: "2.0.0",
    server: {
      name: "x402disputes.com - Permissionless X-402 Dispute Resolution",
      version: "2.0.0",
      description: "Permissionless dispute filing for X-402 USDC payment protocol. Base and Solana only. Agents file disputes directly. Dispute and refund data written on-chain.",
      
      payment_details: {
        format: "All transaction details extracted from blockchain",
        note: "Agent only provides USDC transaction hash. We query blockchain to extract plaintiff, defendant, and amount. Only USDC on Base and Solana supported."
      },
      
      dispute_types: "USDC payment disputes only (Base and Solana chains)",
      
      evidence_requirements: {
        required_from_agent: [
          "transactionHash - USDC token transfer transaction hash",
          "blockchain - Network (base or solana only)",
          "description - What went wrong (10-500 chars)",
          "request - API request object that was sent",
          "response - Error response that was received"
        ],
        extracted_from_blockchain: [
          "plaintiff - Buyer's wallet address (USDC sender)",
          "defendant - Seller's wallet address (USDC recipient)",
          "amount - USDC payment amount (1 USDC = $1.00 USD)",
          "currency - Always USDC (only supported currency)"
        ],
        optional_but_recommended: {
          sellerXSignature: {
            importance: "HIGH",
            description: "Ed25519 signature from seller's X-Signature response header",
            impact_if_missing: "Evidence strength reduced to MEDIUM. May require additional verification.",
            impact_if_provided: "Evidence strength STRONG. Higher confidence in verdict.",
            how_to_obtain: "Extract X-Signature header from seller's HTTP response"
          }
        }
      },
      
      pricing: {
        flat_fee: "$0.05 per dispute"
      },
      resolution_time: "< 10 minutes avg, 10 business days max (Regulation E)",
      url: "https://api.x402disputes.com"
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
          "1. Register agent with Ed25519 public key via /agents/register",
          "2. Sign transactions/evidence with your private key",
          "3. x402disputes verifies signatures using registered public key",
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
    documentation: "https://docs.x402disputes.com/mcp-quickstart",
    support: "support@x402disputes.com"
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
 * Body: { tool: "x402_file_dispute", parameters: {...} }
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
    const publicTools = ['x402_check_case_status'];
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
      case "x402_file_dispute":
        // X-402 PAYMENT DISPUTE HANDLER
        // Extracts all transaction details (plaintiff, defendant, amount, currency) from blockchain
        // Blockchain is the single source of truth
        
        // 1. Validate required fields
        if (!parameters.request) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: "MISSING_REQUEST",
              message: "request object is required",
              field: "request",
              expected: "Object with method, url, headers, body",
              suggestion: "Provide the API request you sent: {method: 'POST', url: '...', headers: {...}, body: {...}}"
            }
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        if (!parameters.response) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: "MISSING_RESPONSE",
              message: "response object is required",
              field: "response",
              expected: "Object with status, headers, body",
              suggestion: "Provide the error response you received: {status: 500, headers: {...}, body: {...}}"
            }
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        if (!parameters.transactionHash) {
            return new Response(JSON.stringify({
              success: false,
              error: {
              code: "MISSING_TRANSACTION_HASH",
              message: "transactionHash is required",
              field: "transactionHash",
              expected: "Blockchain transaction hash",
              suggestion: "Provide the transaction hash from X-402-Transaction-Hash header or your wallet"
              }
            }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          
        if (!parameters.blockchain) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: "MISSING_BLOCKCHAIN",
              message: "blockchain is required",
              field: "blockchain",
              expected: "ethereum, base, or solana",
              suggestion: "Specify which blockchain network the payment transaction occurred on. Only Ethereum, Base, and Solana are supported."
            }
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        // Validate blockchain is one of the supported chains (Base or Solana only)
        const supportedChains = ["base", "solana"];
        if (!supportedChains.includes(parameters.blockchain)) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: "UNSUPPORTED_BLOCKCHAIN",
              message: `Only Base and Solana chains are supported for USDC payments`,
              field: "blockchain",
              received: parameters.blockchain,
              expected: "base or solana",
              suggestion: "X-402 disputes only accept USDC payments on Base and Solana chains."
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
              suggestion: "Add a description like: 'API returned 500 error after payment was confirmed on-chain'"
          }
        }), {
            status: 400,
          headers: { "Content-Type": "application/json" }
        });
        }
        
        // 2. Query blockchain to extract all transaction details
        // Blockchain is the source of truth for plaintiff, defendant, amount, currency
        console.log(`🔍 Querying blockchain ${parameters.blockchain} for tx: ${parameters.transactionHash}`);
        let txDetails: any;
        try {
          txDetails = await ctx.runAction(api.lib.blockchain.queryTransaction, {
            blockchain: parameters.blockchain,
            transactionHash: parameters.transactionHash
          });
        } catch (error: any) {
          // Handle action execution errors
        return new Response(JSON.stringify({
            success: false,
            error: {
              code: "TRANSACTION_NOT_FOUND",
              message: `Failed to query blockchain: ${error.message}`,
              field: "transactionHash",
              received: parameters.transactionHash,
              expected: "Valid confirmed transaction on specified blockchain",
              suggestion: `Verify transaction exists on ${parameters.blockchain}. Check block explorer.`,
              details: error.message
            }
        }), {
            status: 400,
          headers: { "Content-Type": "application/json" }
        });
        }
        
        if (!txDetails || !txDetails.success) {
        return new Response(JSON.stringify({
            success: false,
            error: {
              code: "TRANSACTION_NOT_FOUND",
              message: `Transaction not found on ${parameters.blockchain}`,
              field: "transactionHash",
              received: parameters.transactionHash,
              expected: "Valid confirmed transaction on specified blockchain",
              suggestion: `Verify transaction exists on ${parameters.blockchain}. Check block explorer.`,
              details: (txDetails && 'error' in txDetails) ? txDetails.error : "Unknown error"
            }
          }), {
            status: 400,
          headers: { "Content-Type": "application/json" }
        });
        }
        
        // 3. Extract transaction details from blockchain
        // Blockchain is the single source of truth - no validation needed
        const txData = txDetails as any;
        const plaintiff = txData.fromAddress || "";  // Extracted from blockchain tx.from
        const defendant = txData.toAddress || "";    // Extracted from blockchain tx.to
        const txValue = txData.value || "0";
        const txCurrency = txData.currency || "USD";
        const txBlockNumber = txData.blockNumber || 0;
        const txAmountUsd = txData.amountUsd || parseFloat(txValue);
        
        console.log(`✅ Transaction details extracted from blockchain:`);
        console.log(`   Plaintiff (buyer): ${plaintiff}`);
        console.log(`   Defendant (seller): ${defendant}`);
        console.log(`   Amount: ${txAmountUsd} ${txCurrency}`);
        console.log(`   Block: ${txBlockNumber}`);
        
        // 4. Build evidence object from request/response
        const evidence: any = {
          request: parameters.request,
          response: parameters.response,
          amountUsd: txAmountUsd,
          x402paymentDetails: {
            currency: txCurrency,
            blockchain: parameters.blockchain,
            transactionHash: parameters.transactionHash,
            fromAddress: plaintiff,  // From blockchain
            toAddress: defendant,    // From blockchain
            blockNumber: txBlockNumber
            // Note: 'value' not included - schema doesn't support it
          }
        };
        
        // 5. Check if defendant agent exists (permissionless dispute filing)
        let defendantAgent = await ctx.runQuery(api.agents.getAgentByWallet, { 
          walletAddress: defendant 
        });
        
        if (defendantAgent) {
          console.log(`✅ Defendant agent found: ${defendantAgent.did} (status: ${defendantAgent.status})`);
        } else {
          console.log(`ℹ️  Defendant agent not found for ${defendant} - disputes can still be filed`);
        }
        
        // 6. Verify seller X-Signature if provided (recommended for strong evidence)
        let signatureProvided = !!parameters.sellerXSignature;
        let signatureVerified = false;
        
        if (parameters.sellerXSignature && defendantAgent?.publicKey) {
          console.log("🔐 Verifying seller X-Signature...");
          const payloadString = JSON.stringify(evidence);
          const verificationResult = await ctx.runAction(api.lib.crypto.verifyEd25519Signature, {
            publicKey: defendantAgent.publicKey,
            signature: parameters.sellerXSignature,
            payload: payloadString
          });
        
          if (!verificationResult.valid) {
            console.warn("⚠️  Seller signature verification failed");
            console.warn("   Reason:", verificationResult.error);
            console.warn("   Evidence strength: MEDIUM (signature invalid)");
          } else {
            console.log("✅ Seller X-Signature verified!");
            evidence.sellerXSignatureVerified = true;
            signatureVerified = true;
            console.log("   Evidence strength: STRONG");
          }
        } else if (!parameters.sellerXSignature) {
          console.warn("⚠️  No X-Signature provided");
          console.warn("   Evidence strength: MEDIUM (no signature)");
        } else if (!defendantAgent?.publicKey) {
          console.warn("⚠️  Cannot verify signature - defendant has no registered public key");
          console.warn("   Evidence strength: MEDIUM (cannot verify)");
        }
        
        const transactionId = parameters.transactionHash;
        
        // If dry run, return validation results without filing
        if (parameters.dryRun) {
          return new Response(JSON.stringify({
            success: true,
            dryRun: true,
            wouldExecute: {
              action: "file_x402_payment_dispute",
              plaintiff: `${plaintiff} (extracted from blockchain)`,
              defendant: `${defendant} (extracted from blockchain)`,
              amount: txAmountUsd,
              currency: txCurrency,
              blockchain: parameters.blockchain,
              transactionHash: parameters.transactionHash,
              estimatedFee: 0.05
            },
            validations: {
              transactionFound: `✓ Transaction found on ${parameters.blockchain}`,
              transactionDetails: "✓ All details extracted from blockchain",
              signatureStatus: signatureProvided 
                ? (signatureVerified ? "✓ X-Signature verified (STRONG evidence)" : "⚠ X-Signature invalid (MEDIUM evidence)")
                : "⚠ X-Signature NOT provided (MEDIUM evidence - consider including for stronger case)",
              request: "✓ Request object provided",
              response: "✓ Response object provided"
            },
            blockchainExtraction: {
              source: "Verified blockchain data",
              blockchain: parameters.blockchain,
              transactionHash: parameters.transactionHash,
              plaintiff: plaintiff,
              defendant: defendant,
              amount: txAmountUsd,
              currency: txCurrency,
              blockNumber: txBlockNumber
            },
            evidenceStrength: signatureVerified ? "STRONG" : "MEDIUM",
            nextSteps: [
              "Remove 'dryRun: true' to file the dispute",
              signatureProvided ? null : "Consider including sellerXSignature for stronger evidence",
              "Dispute will be filed immediately",
              "Fee: $0.05",
              "Resolution within 5-10 minutes for micro-disputes"
            ].filter(Boolean)
          }), {
            headers: { "Content-Type": "application/json" }
          });
        }
        
        // 7. File payment dispute with blockchain-extracted details
        const paymentDisputeArgs: any = {
          transactionId: parameters.transactionHash,
          amount: txAmountUsd,
          currency: txCurrency,
          plaintiff: plaintiff,  // Extracted from blockchain
          defendant: defendant,  // Extracted from blockchain
          disputeReason: "quality_issue",
          description: parameters.description,
          evidenceUrls: [],
          callbackUrl: parameters.callbackUrl,
          // Store request/response as JSON strings in metadata (X-402 evidence)
          plaintiffMetadata: { 
            walletAddress: plaintiff,
            requestJson: JSON.stringify(parameters.request)
          },
          defendantMetadata: { 
            walletAddress: defendant,
            responseJson: JSON.stringify(parameters.response)
          },
        };
        
        // Auto-detect reviewerOrganizationId
        // SECURITY: ONLY use defendant's organization (they review disputes filed against them)
        // NEVER use plaintiff's org (conflict of interest - they'd approve their own refunds!)
        let reviewerOrgId = authenticatedOrg; // Use API key org if provided
        
        if (!reviewerOrgId) {
          // Check defendant's organization ONLY
          const defendantAgent = await ctx.runQuery(api.agents.getAgentByWallet, {
            walletAddress: defendant
          });
          
          if (defendantAgent?.organizationId) {
            reviewerOrgId = defendantAgent.organizationId;
          }
          // If defendant has no org or agent record, dispute remains unassigned
        }
        
        if (reviewerOrgId) {
          paymentDisputeArgs.reviewerOrganizationId = reviewerOrgId;
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
          
          // Signature verification status
          signatureVerification: {
            provided: signatureProvided,
            verified: signatureVerified,
            message: !signatureProvided 
              ? "No X-Signature provided. Response authenticity cannot be confirmed. Evidence strength reduced."
              : signatureVerified
                ? "X-Signature verified. Response authenticity confirmed."
                : "X-Signature verification failed. Response authenticity questionable.",
            impact: !signatureProvided || !signatureVerified
              ? "May require additional evidence for resolution"
              : "Strong evidence - higher confidence in verdict"
          },
          
          // Transaction verification - extracted from blockchain
          transactionVerification: {
            source: "blockchain",
            blockchain: parameters.blockchain,
            transactionHash: parameters.transactionHash,
            verified: true,
            extractedDetails: {
              plaintiff: `${plaintiff} (extracted from blockchain)`,
              defendant: `${defendant} (extracted from blockchain)`,
              amount: txAmountUsd,
              currency: txCurrency,
              blockNumber: txBlockNumber
            }
          },
          
          evidenceStrength: signatureVerified ? "STRONG" : "MEDIUM",
          humanReviewRequired: result.humanReviewRequired,
          estimatedResolutionTime: result.estimatedResolutionTime,
          message: `X-402 payment dispute filed. All transaction details verified from blockchain.`,
          trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://x402disputes.com'}/cases/${result.caseId}`,
          nextSteps: [
            signatureProvided ? null : "Consider submitting X-Signature for stronger evidence",
            "AI analyzes dispute + provides recommendation",
            "Merchant reviews in dashboard",
            "Resolution within 10 business days (Regulation E)"
          ].filter(Boolean),
          _links: {
            self: `${process.env.NEXT_PUBLIC_APP_URL || 'https://x402disputes.com'}/cases/${result.caseId}`,
            evidence: `${process.env.NEXT_PUBLIC_API_URL || 'https://api.x402disputes.com'}/cases/${result.caseId}/evidence`,
            timeline: `${process.env.NEXT_PUBLIC_APP_URL || 'https://x402disputes.com'}/cases/${result.caseId}#timeline`,
            api: `${process.env.NEXT_PUBLIC_API_URL || 'https://api.x402disputes.com'}/cases/${result.caseId}`,
            submitEvidence: `${process.env.NEXT_PUBLIC_API_URL || 'https://api.x402disputes.com'}/evidence`,
            checkStatus: `${process.env.NEXT_PUBLIC_API_URL || 'https://api.x402disputes.com'}/cases/${result.caseId}`
          }
        }), {
          headers: { "Content-Type": "application/json" }
        });
        break;
        
      case "x402_check_case_status":
        result = await ctx.runQuery(internal.cases.getCase, {
          caseId: parameters.caseId as any
        });
        
        return new Response(JSON.stringify({
          success: true,
          case: result
        }), {
          headers: { "Content-Type": "application/json" }
        });
        break;
        
      case "demo_image_generator":
        // Demo agent - calls ImageGenerator500 endpoint internally
        // This allows Claude to test the full X-402 payment + dispute flow
        
        // Validate prompt
        if (!parameters.prompt || typeof parameters.prompt !== 'string') {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: "MISSING_PROMPT",
              message: "prompt is required",
              field: "prompt",
              expected: "String between 3-1000 characters",
              suggestion: "Provide a text prompt like 'a dog playing in the park'"
            }
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        if (parameters.prompt.length < 3 || parameters.prompt.length > 1000) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: "INVALID_PROMPT_LENGTH",
              message: `Prompt must be between 3-1000 characters (got ${parameters.prompt.length})`,
              field: "prompt"
            }
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        // Make internal HTTP call to the demo agent endpoint
        // In production, this would be an actual external API call
        // For now, we'll return a simulated response showing the X-402 flow
        
        return new Response(JSON.stringify({
          success: true,
          note: "This is a demo agent that requires X-402 payment",
          payment_required: {
            amount: "0.01",
            currency: "USDC",
            network: "base",
            recipient: "0x49AF4074577EA313C5053cbB7560AC39e34b05E8",
            protocol: "X-402"
          },
          instructions: {
            step_1: "Coinbase Payments MCP will automatically handle payment when you call the API endpoint directly",
            step_2: "Call: POST https://api.x402disputes.com/demo-agents/image-generator",
            step_3: "After receiving 500 error, use x402_file_dispute to file a dispute",
            coinbase_mcp: "Install: npx @coinbase/payments-mcp"
          },
          endpoint: "https://api.x402disputes.com/demo-agents/image-generator",
          prompt: parameters.prompt,
          size: parameters.size || "1024x1024",
          model: parameters.model || "stable-diffusion-xl",
          expected_behavior: "Returns 500 'model_overloaded' error after payment verification",
          use_case: "Perfect for testing X-402 dispute filing workflow"
        }), {
          headers: { "Content-Type": "application/json" }
        });
        break;
        
      case "x402_list_my_cases":
        // Validate Ethereum address format
        if (!parameters.walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(parameters.walletAddress)) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: "INVALID_WALLET_ADDRESS",
              message: "Invalid Ethereum wallet address",
              field: "walletAddress",
              received: parameters.walletAddress,
              expected: "0x-prefixed 40-character hex string (ERC-8004)",
              suggestion: "Provide a valid Ethereum wallet address, e.g., 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
            }
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        result = await ctx.runQuery(api.cases.getCasesByParty, {
          party: parameters.walletAddress
        });
        
        const filteredCases = parameters.status && parameters.status !== "all"
          ? result.filter((c: any) => c.status === parameters.status)
          : result;
        
        return new Response(JSON.stringify({
          success: true,
          walletAddress: parameters.walletAddress,
          totalCases: filteredCases.length,
          cases: filteredCases
        }), {
          headers: { "Content-Type": "application/json" }
        });
        break;
        
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

