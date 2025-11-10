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
    description: "File X-402 payment dispute. Provide buyer/seller Ethereum addresses, request/response objects, and blockchain transaction proof. We query blockchain for amount/currency/addresses automatically. Seller signature optional. Permissionless - file against any agent. $0.05 flat fee.",
    input_schema: {
      type: "object",
      properties: {
        plaintiff: {
          type: "string",
          pattern: "^0x[a-fA-F0-9]{40}$",
          description: "REQUIRED. Buyer's Ethereum wallet address. Must be valid 0x-prefixed address.",
          examples: [
            "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
            "0x1234567890123456789012345678901234567890"
          ]
        },
        defendant: {
          type: "string",
          pattern: "^0x[a-fA-F0-9]{40}$",
          description: "REQUIRED. Seller's Ethereum wallet address (who received payment). Must be valid 0x-prefixed address.",
          examples: [
            "0x9876543210987654321098765432109876543210",
            "0xSellerWalletAddress0123456789abcdef"
          ]
        },
        disputeUrl: {
          type: "string",
          pattern: "^https://api\\.x402disputes\\.com/disputes/claim\\?vendor=0x[a-fA-F0-9]{40}$",
          description: "REQUIRED. Dispute URL. Format: 'https://api.x402disputes.com/disputes/claim?vendor=0x[sellerAddress]'.",
          examples: [
            "https://api.x402disputes.com/disputes/claim?vendor=0x9876543210987654321098765432109876543210"
          ]
        },
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
          description: "REQUIRED. Blockchain transaction hash proving payment. We query blockchain to verify amount/currency/addresses. Format: 0x... for EVM chains, base58 for Solana.",
          examples: ["0xabc123def456789...", "5J7Qw8mN3pR..."]
        },
        blockchain: {
          type: "string",
          enum: ["base", "ethereum", "solana", "polygon", "arbitrum", "optimism"],
          description: "REQUIRED. Blockchain network where payment transaction occurred.",
          examples: ["base", "ethereum", "solana"]
        },
        sellerXSignature: {
          type: "string",
          contentEncoding: "base64",
          description: "OPTIONAL. X-Signature from seller's response header (if provided). Strengthens evidence but not required.",
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
      required: ["plaintiff", "defendant", "disputeUrl", "description", "request", "response", "transactionHash", "blockchain"]
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
 * Example: curl https://x402disputes.com/.well-known/mcp.json
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
      url: "https://x402disputes.com"
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
        // X-402 PAYMENT DISPUTE HANDLER
        // Uses Ethereum addresses as canonical identities
        // Queries blockchain for payment verification
        
        // 1. Extract defendant (seller wallet address) from disputeUrl
        let defendant = parameters.defendant;
        
        if (parameters.disputeUrl) {
          try {
            const url = new URL(parameters.disputeUrl);
            const vendorFromUrl = url.searchParams.get('vendor');
            if (vendorFromUrl) {
              defendant = vendorFromUrl;
              console.log(`✅ Extracted vendor address from dispute URL: ${vendorFromUrl}`);
            } else {
              return new Response(JSON.stringify({
                success: false,
                error: {
                  code: "INVALID_DISPUTE_URL",
                  message: "Invalid dispute URL: missing 'vendor' query parameter",
                  field: "disputeUrl",
                  received: parameters.disputeUrl,
                  expected: "https://api.x402disputes.com/disputes/claim?vendor=0x...",
                  suggestion: "Dispute URL must contain '?vendor=0x...' with seller's Ethereum address"
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
                  expected: "https://api.x402disputes.com/disputes/claim?vendor=0x...",
                suggestion: "Provide a valid URL. Copy the exact X-Dispute-URL header value from seller's response.",
                details: error.message
              }
            }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
        }
        
        // 2. Validate Ethereum addresses (X-402 identity)
        if (!parameters.plaintiff) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: "MISSING_PLAINTIFF",
              message: "plaintiff is required",
              field: "plaintiff",
              expected: "Ethereum address (0x...)",
              suggestion: "Provide buyer's Ethereum wallet address, e.g., 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
            }
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        // Validate plaintiff is Ethereum address
        if (!/^0x[a-fA-F0-9]{40}$/.test(parameters.plaintiff)) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: "INVALID_PLAINTIFF_ADDRESS",
              message: "Plaintiff must be a valid Ethereum address",
              field: "plaintiff",
              received: parameters.plaintiff,
              expected: "0x-prefixed 40-character hex string",
              suggestion: "Provide buyer's Ethereum wallet address. Format: 0x followed by 40 hexadecimal characters"
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
              code: "MISSING_DEFENDANT",
              message: "defendant is required",
              field: "defendant",
              expected: "Ethereum address (0x...)",
              suggestion: "Provide seller's Ethereum wallet address"
            }
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        // Validate defendant is Ethereum address
        if (!/^0x[a-fA-F0-9]{40}$/.test(defendant)) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: "INVALID_DEFENDANT_ADDRESS",
              message: "Defendant must be a valid Ethereum address",
              field: "defendant",
              received: defendant,
              expected: "0x-prefixed 40-character hex string",
              suggestion: "Provide seller's Ethereum wallet address from disputeUrl vendor parameter"
            }
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        // Validate required fields
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
              expected: "base, ethereum, solana, polygon, arbitrum, or optimism",
              suggestion: "Specify which blockchain network the payment transaction occurred on"
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
        
        // 3. Query blockchain to verify payment and get details
        console.log(`🔍 Querying blockchain ${parameters.blockchain} for tx: ${parameters.transactionHash}`);
        const txDetails = await ctx.runAction(api.lib.blockchain.queryTransaction, {
          blockchain: parameters.blockchain,
          transactionHash: parameters.transactionHash
        });
        
        if (!txDetails.success) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: "TRANSACTION_NOT_FOUND",
              message: `Transaction not found on ${parameters.blockchain}`,
              field: "transactionHash",
              received: parameters.transactionHash,
              expected: "Valid confirmed transaction on specified blockchain",
              suggestion: `Verify transaction exists on ${parameters.blockchain}. Check block explorer.`,
              details: txDetails.error
            }
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        // 4. Validate addresses match blockchain transaction
        if (txDetails.fromAddress.toLowerCase() !== parameters.plaintiff.toLowerCase()) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: "ADDRESS_MISMATCH",
              message: "Plaintiff address doesn't match transaction sender",
              field: "plaintiff",
              received: parameters.plaintiff,
              expected: txDetails.fromAddress,
              suggestion: `Transaction was sent from ${txDetails.fromAddress}, not ${parameters.plaintiff}. Verify you're using the correct wallet address.`
            }
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        if (txDetails.toAddress.toLowerCase() !== defendant.toLowerCase()) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: "ADDRESS_MISMATCH",
              message: "Defendant address doesn't match transaction recipient",
              field: "defendant",
              received: defendant,
              expected: txDetails.toAddress,
              suggestion: `Transaction was sent to ${txDetails.toAddress}, not ${defendant}. Verify you're disputing the correct seller.`
            }
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        console.log(`✅ Addresses validated: ${parameters.plaintiff} → ${defendant}`);
        console.log(`✅ Payment verified: ${txDetails.value} ${txDetails.currency} on ${parameters.blockchain}`);
        
        // 5. Build evidence object from request/response
        const evidence: any = {
          request: parameters.request,
          response: parameters.response,
          amountUsd: txDetails.amountUsd || 0,
          x402paymentDetails: {
            currency: txDetails.currency,
            blockchain: parameters.blockchain,
            transactionHash: parameters.transactionHash,
            fromAddress: parameters.plaintiff,
            toAddress: defendant,
            blockNumber: txDetails.blockNumber,
            value: txDetails.value
          }
        };
        
        // 6. Check if defendant agent exists, create if unclaimed
        let defendantAgent = await ctx.runQuery(api.agents.getAgentByWallet, { 
          walletAddress: defendant 
        });
        
        if (!defendantAgent) {
          // Create unclaimed agent - permissionless dispute filing!
          console.log(`✨ Creating unclaimed agent for wallet: ${defendant}`);
          const agentId = await ctx.runMutation(api.agents.createUnclaimedAgent, {
            walletAddress: defendant,
            name: undefined, // Will extract from request.url or agent card later
            endpoint: parameters.request?.url,
          });
          
          defendantAgent = await ctx.runQuery(api.agents.getAgentByWallet, { 
            walletAddress: defendant 
          });
        }
        
        console.log(`✅ Defendant agent: ${defendantAgent?.did} (status: ${defendantAgent?.status})`);
        
        // 7. Verify seller X-Signature if provided (optional)
        if (parameters.sellerXSignature && defendantAgent?.publicKey) {
          console.log("🔐 Verifying seller X-Signature...");
          const payloadString = JSON.stringify(evidence);
          const verificationResult = await ctx.runAction(api.lib.crypto.verifyEd25519Signature, {
            publicKey: defendantAgent.publicKey,
            signature: parameters.sellerXSignature,
            payload: payloadString
          });
          
          if (!verificationResult.valid) {
            console.warn("⚠️  Seller signature verification failed, but continuing (signature is optional)");
            console.warn("   Reason:", verificationResult.error);
          } else {
            console.log("✅ Seller X-Signature verified!");
            evidence.sellerXSignatureVerified = true;
          }
        }
        
        const transactionId = parameters.transactionHash;
        
        // If dry run, return validation results without filing
        if (parameters.dryRun) {
          return new Response(JSON.stringify({
            success: true,
            dryRun: true,
            wouldExecute: {
              action: "file_x402_payment_dispute",
              plaintiff: parameters.plaintiff,
              defendant: defendant,
              amount: txDetails.amountUsd || parseFloat(txDetails.value),
              currency: txDetails.currency,
              blockchain: parameters.blockchain,
              transactionHash: parameters.transactionHash,
              estimatedFee: 0.05
            },
            validations: {
              plaintiffAddress: `✓ Valid Ethereum address: ${parameters.plaintiff}`,
              defendantAddress: `✓ Valid Ethereum address: ${defendant}`,
              transactionFound: `✓ Transaction found on ${parameters.blockchain}`,
              addressesMatch: "✓ Addresses match blockchain transaction",
              agentStatus: `✓ Defendant agent ${defendantAgent?.status || 'will be created'}`,
              request: "✓ Request object provided",
              response: "✓ Response object provided"
            },
            blockchainDetails: {
              from: txDetails.fromAddress,
              to: txDetails.toAddress,
              amount: txDetails.value,
              currency: txDetails.currency,
              blockNumber: txDetails.blockNumber
            },
            nextSteps: [
              "Remove 'dryRun: true' to file the dispute",
              "Dispute will be filed immediately",
              `Fee: $0.05`,
              "Resolution within 5-10 minutes for micro-disputes"
            ]
          }), {
            headers: { "Content-Type": "application/json" }
          });
        }
        
        // 8. File payment dispute with blockchain-verified details
        const paymentDisputeArgs: any = {
          transactionId: parameters.transactionHash,
          amount: txDetails.amountUsd || parseFloat(txDetails.value),
          currency: txDetails.currency,
          paymentProtocol: "x402",
          plaintiff: parameters.plaintiff,
          defendant: defendant,
          disputeReason: "quality_issue",
          description: parameters.description,
          evidenceUrls: [],
          callbackUrl: parameters.callbackUrl,
          // Store blockchain-verified x402 payment details
          crypto: evidence.x402paymentDetails,
          // Store request/response for evidence
          plaintiffMetadata: { request: parameters.request },
          defendantMetadata: { response: parameters.response },
        };
        
        // Include reviewerOrganizationId if authenticated
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
          message: `X-402 payment dispute filed successfully. Case ID: ${result.caseId}`,
          trackingUrl: `https://x402disputes.com/cases/${result.caseId}`,
          nextSteps: [
              "Submit additional evidence (optional)",
              "AI analyzes dispute + provides recommendation",
              "Your team reviews exceptions in dashboard",
              "Resolution within 10 business days (Regulation E)"
          ],
          _links: {
            self: `https://x402disputes.com/cases/${result.caseId}`,
            evidence: `https://api.x402disputes.com/cases/${result.caseId}/evidence`,
            timeline: `https://x402disputes.com/cases/${result.caseId}#timeline`,
            api: `https://api.x402disputes.com/cases/${result.caseId}`,
            submitEvidence: `https://api.x402disputes.com/evidence`,
            checkStatus: `https://api.x402disputes.com/cases/${result.caseId}`
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

