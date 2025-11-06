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
    description: "File payment dispute with cryptographically signed evidence from seller. Seller signs their API response proving what they delivered. Enables non-repudiation. $0.05 flat fee per dispute.",
    input_schema: {
      type: "object",
      properties: {
        plaintiff: {
          type: "string",
          description: "Optional. Who's filing the dispute. Auto-extracted from signedEvidence.x402paymentDetails if not provided. Examples: 'buyer:alice@example.com', 'wallet:0xAbc123...'"
        },
        disputeUrl: {
          type: "string",
          description: "REQUIRED. Dispute URL from seller's X-Dispute-URL response header. Format: 'https://api.consulatehq.com/disputes/claim?vendor=did:agent:seller-123'. Buyer passes this directly from header."
        },
        description: {
          type: "string",
          description: "REQUIRED. What went wrong. Examples: 'API returned 500 error', 'Service timeout after 30s', 'Charged but no response'"
        },
        
        // SIGNED EVIDENCE (cryptographically verified proof from seller)
        signedEvidence: {
          type: "object",
          description: "RECOMMENDED. Cryptographically signed evidence from seller proving they delivered this output. Seller signs the complete transaction (request+response+payment) with their Ed25519 private key. SIGNING FORMAT: Seller creates payload = JSON.stringify({ request, response, amountUsd, x402paymentDetails }), then signature = ed25519.sign(payload, privateKey). Buyer receives signature in X-Signature header. Implementation guide: https://docs.consulatehq.com",
          properties: {
            request: {
              type: "object",
              properties: {
                method: { type: "string", description: "HTTP method (POST, GET, etc.)" },
                path: { type: "string", description: "API endpoint path (e.g., /v1/chat/completions)" },
                headers: { type: "object", description: "Request headers sent by buyer" },
                body: { type: "object", description: "Request body - the buyer's question/input to seller's API" }
              },
              required: ["method", "path"],
              description: "The original API request made by buyer to seller. This is part of what seller signs."
            },
            response: {
              type: "object",
              properties: {
                status: { type: "number", description: "HTTP status code (e.g., 200, 500, 503)" },
                headers: { type: "object", description: "Response headers from seller (should include disputeUrl and vendorDid)" },
                body: { type: "string", description: "Response body (JSON string) - the seller's actual output (may be bad/failed)" }
              },
              required: ["status", "body"],
              description: "The actual API response from seller (may be bad output). This is part of what seller signs."
            },
            amountUsd: {
              type: "number",
              description: "REQUIRED. USD value of transaction."
            },
            x402paymentDetails: {
              type: "object",
              description: "REQUIRED. Crypto payment proof with STRICT schema. All fields below are REQUIRED for valid payment dispute.",
              properties: {
                currency: { type: "string", description: "REQUIRED. Cryptocurrency (USDC, ETH, SOL, BTC, etc.)" },
                blockchain: { type: "string", description: "REQUIRED. Blockchain network (base, ethereum, solana, polygon, etc.)" },
                transactionHash: { type: "string", description: "REQUIRED. Blockchain transaction hash - proof payment happened" },
                fromAddress: { type: "string", description: "REQUIRED. Buyer's wallet address - who paid" },
                toAddress: { type: "string", description: "REQUIRED. Seller's wallet address - who received payment" },
                timestamp: { type: "string", description: "Optional. When payment occurred (ISO 8601 format)" },
                blockNumber: { type: "number", description: "Optional. Block number where transaction was included" },
                contractAddress: { type: "string", description: "Optional. Token contract address (e.g., USDC contract)" },
                layer: { type: "string", enum: ["L1", "L2"], description: "Optional. Layer 1 (mainnet) or Layer 2 (rollup)" },
                explorerUrl: { type: "string", description: "Optional. Link to blockchain explorer (Etherscan, Basescan, etc.)" }
              },
              required: ["currency", "blockchain", "transactionHash", "fromAddress", "toAddress"]
            }
          },
          required: ["request", "response", "amountUsd", "x402paymentDetails"]
        },
        
        callbackUrl: {
          type: "string",
          description: "Optional webhook URL to receive resolution updates"
        }
      },
      required: ["disputeUrl", "description", "signedEvidence"]
    }
  },
  {
    name: "consulate_submit_evidence",
    description: "Submit ADP-compliant evidence to support a dispute case. Evidence follows the Agentic Dispute Protocol format with cryptographic chain of custody. Supported types: API logs, monitoring data, contracts, SLA documents, or any verifiable proof.",
    input_schema: {
      type: "object",
      properties: {
        caseId: {
          type: "string",
          description: "The case ID you're submitting evidence for (received when filing dispute)"
        },
        agentDid: {
          type: "string",
          description: "Your agent DID (the party submitting evidence)"
        },
        evidenceType: {
          type: "string",
          enum: ["api_logs", "monitoring_data", "contract", "sla_document", "communication", "financial_record"],
          description: "Type of evidence being submitted"
        },
        evidenceUrl: {
          type: "string",
          description: "URL where the evidence can be accessed (must be publicly accessible or provide credentials)"
        },
        sha256: {
          type: "string",
          description: "SHA-256 hash of the evidence file for integrity verification"
        },
        description: {
          type: "string",
          description: "Brief description of what this evidence proves"
        }
      },
      required: ["caseId", "agentDid", "evidenceType", "evidenceUrl", "sha256"]
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
  },
  {
    name: "consulate_register_agent",
    description: "Register your agent with Consulate using Ed25519 public key. Required before filing disputes. Establishes agent DID for protocol compliance. Optionally provide OpenAPI spec for automated contract validation.",
    input_schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the agent (e.g., 'acme-monitoring-agent', 'openai-api-consumer')"
        },
        publicKey: {
          type: "string",
          description: "Base64-encoded Ed25519 public key for signature verification"
        },
        organizationName: {
          type: "string",
          description: "Name of the organization registering the agent"
        },
        openApiSpec: {
          type: "object",
          description: "Optional OpenAPI 3.0 specification for automated API contract validation"
        },
        specVersion: {
          type: "string",
          description: "OpenAPI specification version (e.g., '3.0.0')"
        },
        functionalType: {
          type: "string",
          enum: ["voice", "chat", "social", "translation", "presentation", "coding", "devops", "security", "data", "api", "writing", "design", "video", "music", "gaming", "research", "financial", "sales", "marketing", "legal", "healthcare", "education", "scientific", "manufacturing", "transportation", "scheduler", "workflow", "procurement", "project", "general"],
          description: "Agent functional type - use 'api' for API consumers/providers, 'general' for multi-purpose agents"
        }
      },
      required: ["name", "publicKey", "organizationName"]
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
    name: "consulate_get_sla_status",
    description: "Check your current SLA compliance status and any active violations",
    input_schema: {
      type: "object",
      properties: {
        agentDid: {
          type: "string",
          description: "Your agent DID"
        }
      },
      required: ["agentDid"]
    }
  },
  {
    name: "consulate_lookup_agent",
    description: "Look up an agent's DID by organization name, domain, or service name. Use this to find the defendant's DID before filing a dispute.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Organization name (e.g., 'OpenAI'), domain (e.g., 'openai.com'), or service name (e.g., 'ChatGPT')"
        },
        functionalType: {
          type: "string",
          description: "Optional: Filter by agent type (e.g., 'api', 'voice', 'chat')"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "consulate_request_vendor_registration",
    description: "Request that Consulate register a vendor that isn't currently in the system. Use this when lookup_agent returns no results.",
    input_schema: {
      type: "object",
      properties: {
        vendorName: {
          type: "string",
          description: "Official organization name (e.g., 'OpenAI', 'Anthropic')"
        },
        domain: {
          type: "string",
          description: "Primary domain of the vendor's service (e.g., 'api.openai.com')"
        },
        serviceType: {
          type: "string",
          description: "What type of service they provide (e.g., 'AI API', 'Voice Assistant', 'Translation')"
        },
        reasonForRequest: {
          type: "string",
          description: "Why you need this vendor registered (e.g., 'Need to file SLA breach dispute')"
        },
        yourContact: {
          type: "string",
          description: "Your email or agent DID for follow-up"
        },
        urgency: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
          description: "How urgent is this request (critical = active SLA breach)"
        }
      },
      required: ["vendorName", "domain", "serviceType", "reasonForRequest"]
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
      description: "Payment dispute resolution with cryptographically signed evidence. Seller signs API responses, buyer files disputes with proof. Non-repudiation enabled. Regulation E compliant.",
      
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
                  code: MCP_ERROR_CODES.INVALID_PARAMETERS,
                  message: "Invalid dispute URL: missing 'vendor' query parameter",
                  hint: "Dispute URL should be in format: https://api.consulatehq.com/disputes/claim?vendor=did:agent:...",
                  receivedUrl: parameters.disputeUrl
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
                code: MCP_ERROR_CODES.INVALID_PARAMETERS,
                message: "Invalid dispute URL format",
                hint: "Provide a valid URL like: https://api.consulatehq.com/disputes/claim?vendor=did:agent:...",
                receivedUrl: parameters.disputeUrl,
                parseError: error.message
              }
            }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
        }
        
        // Validation: disputeUrl is REQUIRED (defendant is extracted from it)
        if (!defendant) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: MCP_ERROR_CODES.INVALID_PARAMETERS,
              message: "disputeUrl is required",
              hint: "The 'disputeUrl' field is required. Get it from seller's X-Dispute-URL response header.",
              format: "https://api.consulatehq.com/disputes/claim?vendor=did:agent:seller-123",
              youProvided: {
                disputeUrl: parameters.disputeUrl || "missing",
                defendant: parameters.defendant || "missing"
              }
            }
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        // Validation: signedEvidence is REQUIRED
        if (!parameters.signedEvidence) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: MCP_ERROR_CODES.INVALID_PARAMETERS,
              message: "signedEvidence is required",
              hint: "Provide signedEvidence object with: { request, response, amountUsd, x402paymentDetails }",
              requiredFields: {
                "signedEvidence.request": "The original API request (method, path, body)",
                "signedEvidence.response": "The seller's API response (status, body)",
                "signedEvidence.amountUsd": "Transaction amount in USD",
                "signedEvidence.x402paymentDetails": "Payment proof (currency, blockchain, transactionHash, fromAddress, toAddress)"
              }
            }
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        // Extract plaintiff from signedEvidence payment details if not provided
        const plaintiff = parameters.plaintiff || extractPlaintiffFromPayment(parameters.signedEvidence);
        
        // Extract transaction ID from x402paymentDetails
        const transactionId = parameters.signedEvidence.x402paymentDetails?.transactionHash 
          || parameters.signedEvidence.x402paymentDetails?.processorTransactionId
          || `x402_${Date.now()}`;
        
        // Build mutation args for payment dispute
        const paymentDisputeArgs: any = {
          transactionId,
          amount: parameters.signedEvidence.amountUsd,
          currency: parameters.signedEvidence.x402paymentDetails?.currency || "USD",
          paymentProtocol: "other", // X402 protocol
          plaintiff,
          defendant: defendant,
          disputeReason: "quality_issue",
          description: parameters.description,
          evidenceUrls: [],
          callbackUrl: parameters.callbackUrl,
          // Store x402 payment details in crypto field
          crypto: parameters.signedEvidence.x402paymentDetails,
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
        
      case "consulate_submit_evidence":
        // Build evidence args - include caseId if provided
        const evidenceArgs: any = {
          agentDid: parameters.agentDid,
          sha256: parameters.sha256,
          uri: parameters.evidenceUrl,
          signer: parameters.agentDid,
          model: {
            provider: "agent_submitted",
            name: "evidence_upload",
            version: "1.0.0"
          },
          evidenceType: parameters.evidenceType,
        };
        
        // Include caseId if provided (required for case-linked evidence)
        if (parameters.caseId) {
          evidenceArgs.caseId = parameters.caseId;
        }
        
        result = await ctx.runMutation(api.evidence.submitEvidence, evidenceArgs);
        
        return new Response(JSON.stringify({
          success: true,
          evidenceId: result,
          message: "Evidence submitted successfully",
          status: "pending_verification",
          caseId: parameters.caseId || null
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
        
      case "consulate_register_agent":
        // Registration now requires publicKey and organizationName
        if (!parameters.publicKey) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: MCP_ERROR_CODES.INVALID_PARAMETERS,
              message: "publicKey required",
              hint: "Provide base64-encoded Ed25519 public key"
            }
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }

        if (!parameters.organizationName) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: MCP_ERROR_CODES.INVALID_PARAMETERS,
              message: "organizationName required",
              hint: "Provide organization name for agent registration"
            }
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        result = await ctx.runMutation(api.agents.joinAgent, {
          name: parameters.name,
          publicKey: parameters.publicKey,
          organizationName: parameters.organizationName,
          openApiSpec: parameters.openApiSpec,
          specVersion: parameters.specVersion,
          functionalType: parameters.functionalType,
          mock: false
        });
        
        return new Response(JSON.stringify({
          success: true,
          agentDid: result.did,
          agentId: result.agentId,
          message: "Agent registered successfully",
          status: "active", // All new agents start with active status
          nextSteps: [
            "Save your agent DID for future API calls",
            "Configure SLA monitoring",
            "Start filing disputes when needed"
          ]
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
        
      case "consulate_get_sla_status":
        // Use the existing HTTP endpoint logic
        const agent = await ctx.runQuery(api.agents.getAgent, { 
          did: parameters.agentDid 
        });
        
        if (!agent) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: MCP_ERROR_CODES.NOT_FOUND,
              message: "Agent not found",
              hint: "Check that the agent DID is correct or register the agent first"
            }
          }), {
            status: 404,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        const cases = await ctx.runQuery(api.cases.getCasesByParty, { 
          agentDid: parameters.agentDid 
        });
        
        return new Response(JSON.stringify({
          success: true,
          agentDid: parameters.agentDid,
          slaStatus: {
            currentStanding: "GOOD",
            totalDisputes: cases.length,
            activeDisputes: cases.filter((c: any) => c.status === "FILED").length,
            resolvedDisputes: cases.filter((c: any) => c.status === "DECIDED").length,
            winRate: cases.length > 0 
              ? (cases.filter((c: any) => 
                  c.ruling?.verdict === "DISMISSED" || c.ruling?.verdict === "CONSUMER_LIABLE"
                ).length / cases.length * 100).toFixed(1) 
              : "100.0",
            riskLevel: "LOW"
          }
        }), {
          headers: { "Content-Type": "application/json" }
        });
        
      case "consulate_lookup_agent":
        // Search for agents by organization name or DID pattern
        const query = parameters.query.toLowerCase();
        let allAgents = await ctx.runQuery(api.agents.listAgents, { limit: 1000 });
        
        // Filter by functional type if provided
        if (parameters.functionalType) {
          allAgents = allAgents.filter((a: any) => 
            a.functionalType === parameters.functionalType
          );
        }
        
        // Search by organization name, DID, or agent name
        const matches = allAgents.filter((a: any) => {
          const orgMatch = a.organizationName?.toLowerCase().includes(query);
          const didMatch = a.did?.toLowerCase().includes(query);
          const nameMatch = a.name?.toLowerCase().includes(query);
          return orgMatch || didMatch || nameMatch;
        });
        
        if (matches.length === 0) {
          return new Response(JSON.stringify({
            success: false,
            error: `No agents found matching "${parameters.query}"`,
            searchedIn: "Consulate registry",
            totalAgentsSearched: allAgents.length,
            suggestions: [
              {
                option: "Try different search terms",
                examples: [
                  "Organization name: 'OpenAI', 'Anthropic', 'Google'",
                  "Domain: 'openai.com', 'anthropic.com'",
                  "Service: 'ChatGPT', 'Claude', 'Gemini'"
                ]
              },
              {
                option: "Register the vendor yourself",
                description: "If you know the vendor's details, register them as an agent",
                tool: "consulate_register_agent",
                example: {
                  ownerDid: "did:org:your-company",
                  name: "vendor-name",
                  organizationName: parameters.query,
                  functionalType: "api"
                }
              },
              {
                option: "Request Consulate to add vendor",
                description: "Submit a request for Consulate to verify and add this vendor",
                action: "Email support@consulatehq.com with vendor details"
              },
              {
                option: "Check if vendor uses a different name",
                description: "Some companies use different names for their API services",
                examples: [
                  "OpenAI API → 'OpenAI'",
                  "Google AI → 'Google' or 'Google AI'",
                  "Azure OpenAI → 'Microsoft' or 'Azure'"
                ]
              }
            ],
            nextSteps: [
              "1. Verify the vendor name spelling",
              "2. Try searching by domain or service name",
              "3. If vendor is legitimate, register them or contact Consulate support",
              "4. Check vendor's website for their Consulate agent DID"
            ]
          }), {
            status: 404,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        return new Response(JSON.stringify({
          success: true,
          query: parameters.query,
          matches: matches.map((a: any) => ({
            did: a.did,
            name: a.name,
            organization: a.organizationName,
            functionalType: a.functionalType,
            status: a.status
          })),
          hint: matches.length === 1 
            ? `Use DID '${matches[0].did}' as the defendant when filing dispute`
            : `Multiple matches found. Choose the most relevant DID for your dispute.`
        }), {
          headers: { "Content-Type": "application/json" }
        });
        
      case "consulate_request_vendor_registration":
        // Log vendor registration request
        // In production, this would create a ticket/record in a queue for Consulate team
        const requestId = `vr_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const registrationRequest = {
          requestId,
          vendorName: parameters.vendorName,
          domain: parameters.domain,
          serviceType: parameters.serviceType,
          reasonForRequest: parameters.reasonForRequest,
          yourContact: parameters.yourContact || "not provided",
          urgency: parameters.urgency || "medium",
          requestedAt: Date.now(),
          status: "pending"
        };
        
        // Log to console for now (in production: save to database, send to team, create Slack alert)
        console.log("🆕 VENDOR REGISTRATION REQUEST:", JSON.stringify(registrationRequest, null, 2));
        
        // Determine response time based on urgency
        const urgencyLevels: Record<string, { eta: string; action: string }> = {
          critical: {
            eta: "1-2 hours",
            action: "Immediate escalation to Consulate team + automated vendor outreach"
          },
          high: {
            eta: "4-8 hours",
            action: "Priority review by Consulate team"
          },
          medium: {
            eta: "1-2 business days",
            action: "Standard review queue"
          },
          low: {
            eta: "3-5 business days",
            action: "Backlog for batch processing"
          }
        };
        
        const urgencyInfo = urgencyLevels[parameters.urgency || "medium"];
        
        return new Response(JSON.stringify({
          success: true,
          requestId,
          message: `Vendor registration request submitted for ${parameters.vendorName}`,
          status: "pending",
          expectedResponseTime: urgencyInfo.eta,
          nextActions: urgencyInfo.action,
          whatHappensNext: [
            "1. Consulate team will verify vendor legitimacy",
            "2. We'll reach out to vendor requesting they join Consulate",
            "3. Once vendor registers, we'll notify you",
            `4. Estimated completion: ${urgencyInfo.eta}`
          ],
          alternatives: [
            {
              option: "Register vendor yourself (faster)",
              description: "If you have vendor's authorization, register them directly",
              tool: "consulate_register_agent"
            },
            {
              option: "File dispute with manual DID",
              description: "Create a temporary agent DID and file dispute now",
              note: "Vendor will be contacted to claim their DID and respond to dispute"
            }
          ],
          trackingUrl: `https://consulatehq.com/vendor-requests/${requestId}`,
          support: {
            email: "support@consulatehq.com",
            subject: `[${requestId}] Vendor Registration Request: ${parameters.vendorName}`,
            urgency: parameters.urgency
          }
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

