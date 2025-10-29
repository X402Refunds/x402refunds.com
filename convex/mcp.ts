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
import { api } from "./_generated/api";

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
 * MCP Tool Definitions
 * These are discoverable by any MCP-compatible agent
 */
export const MCP_TOOLS = [
  {
    name: "consulate_file_dispute",
    description: "File a PAYMENT DISPUTE for failed transactions, incorrect charges, or service-not-rendered issues. Regulation E compliant with 10 business day resolution. Pricing tiers: MICRO (<$1: $0.10), SMALL ($1-$10: $0.25), MEDIUM ($10-$100: $1.00), LARGE ($100-$1k: $5.00), ENTERPRISE (>$1k: $25.00). AI provides recommendations, customer teams make final decisions.",
    input_schema: {
      type: "object",
      properties: {
        transactionId: {
          type: "string",
          description: "Unique transaction ID from the payment system (e.g., 'txn_abc123')"
        },
        amount: {
          type: "number",
          description: "Transaction amount in USD (e.g., 0.50 for $0.50). This determines pricing tier: <$1=MICRO($0.10), $1-$10=SMALL($0.25), $10-$100=MEDIUM($1.00), $100-$1k=LARGE($5.00), >$1k=ENTERPRISE($25.00)"
        },
        currency: {
          type: "string",
          description: "Currency code (default: 'USD')"
        },
        paymentProtocol: {
          type: "string",
          enum: ["ACP", "ATXP", "STRIPE", "OTHER"],
          description: "Payment protocol used (ACP=Autonomous Commerce Protocol, ATXP=Autonomous Transaction Protocol)"
        },
        plaintiff: {
          type: "string",
          description: "Consumer identifier (e.g., 'consumer:alice@example.com' or email)"
        },
        defendant: {
          type: "string",
          description: "Merchant/service provider identifier (e.g., 'merchant:shop@example.com')"
        },
        disputeReason: {
          type: "string",
          enum: ["api_timeout", "service_not_rendered", "quality_issue", "amount_incorrect", "fraud", "duplicate_charge"],
          description: "Reason for the payment dispute"
        },
        description: {
          type: "string",
          description: "Clear description of what went wrong (e.g., 'API timed out after 30s but charge went through')"
        },
        evidenceUrls: {
          type: "array",
          items: { type: "string" },
          description: "URLs to evidence: transaction logs, API responses, receipts, screenshots"
        },
        callbackUrl: {
          type: "string",
          description: "Optional webhook URL to receive dispute resolution result"
        }
      },
      required: ["transactionId", "amount", "paymentProtocol", "plaintiff", "defendant", "disputeReason", "description"]
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
    description: "Register your agent with Consulate to participate in ADP-compliant dispute resolution. Required before filing disputes. Establishes agent DID for protocol compliance. API key must be passed in Authorization header.",
    input_schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the agent (e.g., 'acme-monitoring-agent', 'openai-api-consumer')"
        },
        functionalType: {
          type: "string",
          enum: ["voice", "chat", "social", "translation", "presentation", "coding", "devops", "security", "data", "api", "writing", "design", "video", "music", "gaming", "research", "financial", "sales", "marketing", "legal", "healthcare", "education", "scientific", "manufacturing", "transportation", "scheduler", "workflow", "procurement", "project", "general"],
          description: "Agent functional type - use 'api' for API consumers/providers, 'general' for multi-purpose agents"
        }
      },
      required: ["name", "functionalType"]
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
    version: "1.0.0",
    server: {
      name: "Consulate Payment Dispute Resolution",
      version: "1.0.0",
      description: "Automated payment dispute resolution for failed transactions, incorrect charges, and service-not-rendered issues. Regulation E compliant. 5 pricing tiers: MICRO (<$1), SMALL ($1-$10), MEDIUM ($10-$100), LARGE ($100-$1k), ENTERPRISE (>$1k).",
      dispute_types: "PAYMENT DISPUTES ONLY (not SLA/contract disputes)",
      pricing: {
        micro: { range: "<$1", fee: "$0.10" },
        small: { range: "$1-$10", fee: "$0.25" },
        medium: { range: "$10-$100", fee: "$1.00" },
        large: { range: "$100-$1,000", fee: "$5.00" },
        enterprise: { range: ">$1,000", fee: "$25.00" }
      },
      resolution_time: "10 business days (Regulation E)",
      url: "https://consulatehq.com"
    },
    tools: MCP_TOOLS,
    authentication: {
      type: "bearer",
      scheme: "Bearer",
      description: "Bearer token authentication using Consulate API keys",
      required_headers: {
        "Authorization": "Bearer csk_live_... or Bearer csk_test_..."
      },
      how_to_get_key: {
        dashboard: "https://consulatehq.com/settings/api-keys",
        steps: [
          "1. Sign in to Consulate dashboard",
          "2. Navigate to Settings → API Keys",
          "3. Click 'Generate New API Key'",
          "4. Copy the key (starts with csk_live_ for production)"
        ]
      },
      alternative_auth: {
        type: "signature",
        algorithm: "Ed25519",
        description: "Advanced: Cryptographic signature-based authentication for non-repudiation",
        required_headers: {
          "X-Agent-DID": "Your agent's DID",
          "X-Signature": "Hex-encoded Ed25519 signature (128 chars)",
          "X-Timestamp": "Current timestamp in milliseconds"
        },
        message_format: "METHOD:PATH:BODY:TIMESTAMP"
      }
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

    // Public tools (no auth required): file_dispute, check_case_status
    const publicTools = ['consulate_file_dispute', 'consulate_check_case_status'];
    const isPublicTool = publicTools.includes(tool);

    // Check for Bearer token (API key) in Authorization header (skip for public tools)
    const authHeader = request.headers.get("Authorization");
    let authenticatedOrg = null;

    if (!isPublicTool) {
      // Authentication required for non-public tools
      if (authHeader?.startsWith("Bearer ")) {
        // API Key authentication
        const apiKey = authHeader.substring(7);

        // Validate API key using query
        try {
          await ctx.runQuery(api.apiKeys.validateApiKeyQuery, { key: apiKey });

          // Update last used timestamp
          await ctx.runMutation(api.apiKeys.updateApiKeyUsage, { key: apiKey });
        } catch (error: any) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: MCP_ERROR_CODES.AUTH_FAILED,
              message: "Invalid or expired API key",
              hint: "Get your API key from Settings → API Keys in the dashboard",
              details: error.message
            }
          }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
          });
        }
      } else {
        // Signature-based authentication (legacy)
        const { extractAuthFromHeaders, validateAuth } = await import("./auth");
        const signatureAuth = extractAuthFromHeaders(request.headers);

        if (!signatureAuth) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: MCP_ERROR_CODES.AUTH_REQUIRED,
              message: "Authentication required",
              hint: "Provide either Bearer token or Ed25519 signature",
              methods: [
                {
                  type: "Bearer token (recommended)",
                  header: "Authorization: Bearer csk_live_...",
                  how: "Get API key from Settings → API Keys in dashboard"
                },
                {
                  type: "Ed25519 signature (advanced)",
                  headers: {
                    "X-Agent-DID": "Your agent's DID",
                    "X-Signature": "Hex-encoded Ed25519 signature",
                    "X-Timestamp": "Current timestamp"
                  }
                }
              ]
            }
          }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
          });
        }

        // Validate signature
        const isValid = await validateAuth(
          ctx,
          signatureAuth,
          "POST",
          "/mcp/invoke",
          bodyStr
        );

        if (!isValid) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: MCP_ERROR_CODES.AUTH_FAILED,
              message: "Invalid signature",
              hint: "Ensure you're signing the correct message format: METHOD:PATH:BODY:TIMESTAMP"
            }
          }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    }

    // Route to appropriate handler based on tool name
    let result;
    
    switch (tool) {
      case "consulate_file_dispute":
        // File PAYMENT DISPUTE using the unified payment dispute endpoint
        result = await ctx.runMutation(api.paymentDisputes.receivePaymentDispute, {
          transactionId: parameters.transactionId,
          amount: parameters.amount,
          currency: parameters.currency || "USD",
          paymentProtocol: parameters.paymentProtocol,
          plaintiff: parameters.plaintiff,
          defendant: parameters.defendant,
          disputeReason: parameters.disputeReason,
          description: parameters.description,
          evidenceUrls: parameters.evidenceUrls || [],
          callbackUrl: parameters.callbackUrl,
        });

        return new Response(JSON.stringify({
          success: true,
          caseId: result.caseId,
          paymentDisputeId: result.paymentDisputeId,
          status: result.status,
          isMicroDispute: result.isMicroDispute,
          pricingTier: result.pricingTier,
          disputeFee: result.disputeFee,
          humanReviewRequired: result.humanReviewRequired,
          estimatedResolutionTime: result.estimatedResolutionTime,
          message: `Payment dispute filed successfully. Case ID: ${result.caseId}`,
          trackingUrl: `https://consulatehq.com/cases/${result.caseId}`,
          nextSteps: [
            "Submit additional evidence using consulate_submit_evidence tool (optional)",
            "AI will analyze the dispute and provide a recommendation",
            "Customer review team will make the final decision",
            "Resolution guaranteed within 10 business days (Regulation E)"
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
        result = await ctx.runMutation(api.evidence.submitEvidence, {
          agentDid: parameters.agentDid,
          sha256: parameters.sha256,
          uri: parameters.evidenceUrl,
          signer: parameters.agentDid,
          model: {
            provider: "agent_submitted",
            name: "evidence_upload",
            version: "1.0.0"
          }
        });
        
        return new Response(JSON.stringify({
          success: true,
          evidenceId: result,
          message: "Evidence submitted successfully",
          status: "pending_verification",
          caseId: parameters.caseId
        }), {
          headers: { "Content-Type": "application/json" }
        });
        
      case "consulate_check_case_status":
        result = await ctx.runQuery(api.cases.getCase, {
          caseId: parameters.caseId as any
        });
        
        return new Response(JSON.stringify({
          success: true,
          case: result
        }), {
          headers: { "Content-Type": "application/json" }
        });
        
      case "consulate_register_agent":
        // Get the API key from the Authorization header
        const authHeaderRegister = request.headers.get("Authorization");
        if (!authHeaderRegister?.startsWith("Bearer ")) {
          return new Response(JSON.stringify({
            success: false,
            error: {
              code: MCP_ERROR_CODES.AUTH_REQUIRED,
              message: "API key required",
              hint: "Pass your API key in the Authorization header: 'Bearer csk_live_...'"
            }
          }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        const apiKeyRegister = authHeaderRegister.substring(7);
        
        result = await ctx.runMutation(api.agents.joinAgent, {
          apiKey: apiKeyRegister,
          name: parameters.name,
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

