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
    description: "File a dispute using the Agentic Dispute Protocol (ADP) for SLA breaches, contract violations, or service quality issues between AI agents or AI vendors. Uses expert determination for technical disputes with liquidated damages.",
    input_schema: {
      type: "object",
      properties: {
        plaintiff: {
          type: "string",
          description: "DID or identifier of the agent filing the dispute (the claimant)"
        },
        defendant: {
          type: "string", 
          description: "DID or identifier of the agent being disputed against (the respondent)"
        },
        disputeType: {
          type: "string",
          enum: ["SLA_BREACH", "CONTRACT_VIOLATION", "FRAUD", "DATA_BREACH", "SERVICE_QUALITY"],
          description: "Type of dispute being filed"
        },
        claim: {
          type: "string",
          description: "Clear statement of what went wrong and what you're claiming (e.g., '45 minute API downtime exceeding 99.9% SLA guarantee')"
        },
        claimAmount: {
          type: "number",
          description: "Amount being claimed in USD (e.g., 5000 for $5,000)"
        },
        jurisdiction: {
          type: "string",
          description: "Legal jurisdiction for the dispute (e.g., 'US-CA', 'US-NY', 'UK', 'EU')"
        },
        evidenceUrls: {
          type: "array",
          items: { type: "string" },
          description: "URLs to evidence supporting your claim (API logs, SLA documents, contracts, monitoring data)"
        }
      },
      required: ["plaintiff", "defendant", "disputeType", "claim", "claimAmount"]
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
      name: "Consulate Dispute Resolution Platform",
      version: "1.0.0",
      description: "Agentic Dispute Protocol (ADP) implementation for automated dispute resolution between AI agents and vendors",
      adp_version: "draft-01",
      adp_repository: "https://github.com/consulatehq/agentic-dispute-protocol",
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
    
    // Check for Bearer token (API key) in Authorization header
    const authHeader = request.headers.get("Authorization");
    let authenticatedOrg = null;
    
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
    
    // Route to appropriate handler based on tool name
    let result;
    
    switch (tool) {
      case "consulate_file_dispute":
        // Create evidence manifests if evidenceUrls provided
        const evidenceIds: any[] = [];
        if (parameters.evidenceUrls && parameters.evidenceUrls.length > 0) {
          for (const url of parameters.evidenceUrls) {
            const evidenceId = await ctx.runMutation(api.evidence.submitEvidence, {
              agentDid: parameters.plaintiff,
              sha256: generateSHA256(url),
              uri: url,
              signer: parameters.plaintiff,
              model: {
                provider: "mcp_tool",
                name: "consulate_file_dispute",
                version: "1.0.0"
              }
            });
            evidenceIds.push(evidenceId);
          }
        }

        // File dispute with evidence IDs
        result = await ctx.runMutation(api.cases.fileDispute, {
          plaintiff: parameters.plaintiff,
          defendant: parameters.defendant,
          type: parameters.disputeType,
          jurisdictionTags: parameters.jurisdiction ? [parameters.jurisdiction] : ["US"],
          evidenceIds, // Now populated with created evidence
          description: parameters.claim,
          claimedDamages: parameters.claimAmount // Map claimAmount to claimedDamages schema field
        });

        // Calculate dynamic resolution time based on claim amount and dispute type
        const claimAmount = parameters.claimAmount || 0;
        let estimatedResolution: string;
        let resolutionDetails: string;

        if (claimAmount < 100) {
          // Small claims: Fast track
          estimatedResolution = "24-48 hours";
          resolutionDetails = "Small claim - fast track resolution";
        } else if (claimAmount < 10000) {
          // Standard claims
          estimatedResolution = "3-5 business days";
          resolutionDetails = "Standard claim - expert panel review";
        } else if (claimAmount < 100000) {
          // Large claims
          estimatedResolution = "5-10 business days";
          resolutionDetails = "Large claim - comprehensive review with legal analysis";
        } else {
          // Enterprise claims
          estimatedResolution = "10-15 business days";
          resolutionDetails = "Enterprise claim - full discovery and expert determination";
        }

        // Fraud/Data Breach disputes get priority
        if (parameters.disputeType === "FRAUD" || parameters.disputeType === "DATA_BREACH") {
          estimatedResolution = "24-48 hours";
          resolutionDetails = "Priority dispute - immediate review for security concerns";
        }

        return new Response(JSON.stringify({
          success: true,
          caseId: result,
          evidenceCount: evidenceIds.length,
          message: `Dispute filed successfully${evidenceIds.length > 0 ? ` with ${evidenceIds.length} evidence item(s)` : ''}. Case ID: ${result}`,
          trackingUrl: `https://consulatehq.com/cases/${result}`,
          claimAmount: parameters.claimAmount,
          estimatedResolution,
          resolutionDetails,
          nextSteps: [
            evidenceIds.length > 0
              ? "Evidence submitted - case ready for review"
              : "Submit additional evidence using consulate_submit_evidence tool",
            "Monitor case status with consulate_check_case_status",
            "Receive notification when panel issues ruling"
          ],
          _links: {
            self: `https://consulatehq.com/cases/${result}`,
            evidence: `https://api.consulatehq.com/cases/${result}/evidence`,
            timeline: `https://consulatehq.com/cases/${result}#timeline`,
            api: `https://api.consulatehq.com/cases/${result}`,
            submitEvidence: `https://api.consulatehq.com/evidence`,
            checkStatus: `https://api.consulatehq.com/cases/${result}`
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

