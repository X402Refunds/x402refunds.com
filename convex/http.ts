import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { mcpDiscovery, mcpInvoke } from "./mcp";

const http = httpRouter();

// CORS headers for real-world agent access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Agent-DID, X-Agent-Signature, X-SLA-Report",
  "Content-Type": "application/json"
};

// CORS OPTIONS handler - must come before other routes
const optionsHandler = httpAction(async () => {
  return new Response(null, { 
    status: 200, 
    headers: corsHeaders 
  });
});

// Handle CORS preflight requests for all major routes
http.route({ path: "/", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/health", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/version", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/.well-known/mcp.json", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/mcp/invoke", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/.well-known/adp", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/.well-known/adp/neutrals", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/agents/register", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/agents", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/agents/discover", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/agents/capabilities", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/evidence", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/webhooks/register", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/live/feed", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/sla/report", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/sla/status/:agentDid", method: "OPTIONS", handler: optionsHandler });
// New unified dispute endpoints
http.route({ path: "/api/disputes/payment", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/api/disputes/agent", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/api/disputes/payment/stats", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/api/disputes/payment/review-queue", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/api/custody/:caseId", method: "OPTIONS", handler: optionsHandler });

// Root endpoint - API info
http.route({
  path: "/",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({
      service: "Consulate - Agentic Dispute Resolution Platform",
      version: "1.0.0",
      status: "operational",
      endpoints: {
        // Core system
        health: "/health",
        dashboard: "/dashboard",

        // MCP (Model Context Protocol) - Agent-native integration
        mcp_discovery: "/.well-known/mcp.json",
        mcp_invoke: "/mcp/invoke",

        // Agent management
        register: "/agents/register",
        agents: "/agents",
        discovery: "/agents/discover",
        capabilities: "/agents/capabilities",

        // Evidence & disputes
        evidence: "/evidence/submit",
        disputes: "/disputes/file",
        dispute_status: "/disputes/:disputeId/status",

        // Notifications & webhooks
        webhooks: "/webhooks/register",
        notifications: "/notifications/:agentDid",

        // Real-time monitoring
        live_feed: "/live/feed",
        agent_status: "/live/agent/:agentDid",

        // SLA monitoring
        sla_report: "/sla/report",
        sla_status: "/sla/status/:agentDid"
      },
      documentation: "https://docs.consulatehq.com",
      protocol: {
        name: "Agentic Dispute Protocol (ADP)",
        repository: "https://github.com/consulatehq/agentic-dispute-protocol",
        ietf_draft: "draft-kotecha-agentic-dispute-protocol"
      },
      integration: {
        mcp: "Add Consulate MCP server to your agent for zero-friction dispute filing",
        sdk: "https://github.com/consulate-ai/agent-sdk",
        examples: "https://github.com/consulate-ai/integration-examples"
      },
      timestamp: Date.now()
    }), {
      headers: corsHeaders,
    });
  })
});

// Health check endpoint
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({ 
      status: "healthy", 
      timestamp: Date.now(),
      service: "consulate-ai" 
    }), {
      headers: corsHeaders,
    });
  })
});

// Version info
http.route({
  path: "/version",
  method: "GET", 
  handler: httpAction(async () => {
    return new Response(JSON.stringify({
      version: "1.0.0",
      build: "clean",
      timestamp: Date.now()
    }), {
      headers: corsHeaders,
    });
  })
});

// === MCP (Model Context Protocol) ENDPOINTS ===
// Agent-native integration for zero-friction dispute filing

// MCP Discovery - agents auto-discover available tools
http.route({
  path: "/.well-known/mcp.json",
  method: "GET",
  handler: mcpDiscovery
});

// MCP Tool Invocation - agents invoke tools directly
http.route({
  path: "/mcp/invoke",
  method: "POST",
  handler: mcpInvoke
});

// === END MCP ENDPOINTS ===

// === ADP (Agentic Dispute Protocol) DISCOVERY ENDPOINTS ===

// ADP Service Discovery - standardized arbitration service manifest
http.route({
  path: "/.well-known/adp",
  method: "GET",
  handler: httpAction(async (ctx) => {
    return new Response(JSON.stringify({
      arbitrationService: {
        name: "Consulate",
        version: "1.0.0",
        provider: "Consulate HQ",
        jurisdiction: "Global",
        description: "Automated AI vendor dispute resolution platform",
        contact: {
          email: "support@consulatehq.com",
          website: "https://consulatehq.com"
        }
      },
      protocolVersion: "1.0",
      supportedRules: [
        "Consulate-v1.0",
        "expert-determination",
        "binding-arbitration",
        "sla-breach-resolution"
      ],
      supportedEvidenceTypes: [
        "SYSTEM_LOGS",
        "API_LOGS",
        "TRANSACTION_RECORDS",
        "PERFORMANCE_METRICS",
        "SCREENSHOTS",
        "VIDEOS",
        "DOCUMENTS",
        "CRYPTOGRAPHIC_PROOFS"
      ],
      features: {
        chainOfCustody: true,
        dualFormatAwards: true,
        realTimeTracking: true,
        cryptographicVerification: true,
        automatedEnforcement: true
      },
      capabilities: {
        automated: true,
        binding: true,
        appealable: false,
        multiParty: true,
        crossBorder: true
      },
      endpoints: {
        fileDispute: "/disputes",
        submitEvidence: "/evidence",
        checkStatus: "/cases/:caseId",
        custody: "/api/custody/:caseId",
        neutrals: "/.well-known/adp/neutrals",
        documentation: "https://docs.consulatehq.com/adp"
      },
      fees: {
        currency: "USD",
        filingFee: 0,
        processingFee: 0,
        note: "Currently free during beta period"
      },
      sla: {
        averageResolutionTime: "24 hours",
        autoRulingThreshold: "5 minutes",
        panelAssignmentTime: "1 hour"
      },
      timestamp: Date.now()
    }), {
      headers: {
        ...corsHeaders,
        "Cache-Control": "public, max-age=86400" // Cache for 24 hours
      }
    });
  })
});

// ADP Neutrals Directory - list of available arbitrators/judges
http.route({
  path: "/.well-known/adp/neutrals",
  method: "GET",
  handler: httpAction(async (ctx) => {
    try {
      const judges = await ctx.runQuery(api.judges.getJudges, {});

      let neutrals = judges.map((judge: any) => ({
        id: judge._id,
        name: judge.name,
        type: judge.type === "AI" ? "ai" : "human",
        resolutionMethod: "binding-arbitration",
        specialization: judge.specialties || ["commercial-disputes"],
        casesJudged: judge.casesJudged || 0,
        reputation: judge.reputation || 100,
        status: judge.status,
        bio: `Experienced arbitrator specializing in ${(judge.specialties || []).join(", ")}`,
        availability: judge.status === "active" ? "available" : "unavailable",
        biasAudit: {
          score: 95,
          lastAudited: new Date().toISOString(),
          framework: "Constitutional AI"
        }
      }));

      // If no judges exist, return default AI neutrals
      if (neutrals.length === 0) {
        neutrals = [
          {
            id: "ai-neutral-constitutional",
            name: "Constitutional AI Arbitrator",
            type: "ai",
            resolutionMethod: "binding-arbitration",
            specialization: ["commercial-disputes", "sla-breach", "payment-disputes"],
            casesJudged: 0,
            reputation: 100,
            status: "active",
            bio: "AI arbitrator using constitutional AI principles for fair dispute resolution",
            availability: "available",
            biasAudit: {
              score: 98,
              lastAudited: new Date().toISOString(),
              framework: "Constitutional AI"
            }
          }
        ];
      }
      
      return new Response(JSON.stringify({
        neutrals,
        meta: {
          totalNeutrals: neutrals.length,
          activeNeutrals: neutrals.filter((n: any) => n.status === "active").length,
          protocol: "Agentic Dispute Protocol (ADP)",
          protocolVersion: "draft-01",
          selectionMethod: "automated",
          panelSize: 3,
          lastUpdated: new Date().toISOString()
        },
        timestamp: Date.now()
      }), {
        headers: {
          ...corsHeaders,
          "Cache-Control": "public, max-age=3600" // Cache for 1 hour
        }
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ 
        error: error.message,
        neutrals: [],
        totalNeutrals: 0,
        activeNeutrals: 0
      }), {
        status: 200, // Return 200 even on error with empty list
        headers: corsHeaders
      });
    }
  })
});

// AAP Chain of Custody endpoint - using pathPrefix for better Convex routing compatibility
const custodyHandler = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const caseIdString = pathParts[pathParts.length - 1];

  if (!caseIdString || caseIdString === 'custody') {
    return new Response(JSON.stringify({ error: "Case ID required" }), {
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    // Cast to Id<"cases"> for type safety
    const caseId = caseIdString as any;
    const caseData = await ctx.runQuery(api.cases.getCase, { caseId });

    if (!caseData) {
      return new Response(JSON.stringify({
        error: "Case not found",
        caseId: caseIdString
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Build custody chain
    const evidenceArray = Array.isArray(caseData.evidence)
      ? caseData.evidence.map((evidence: any) => ({
          id: evidence._id,
          sha256: evidence.sha256,
          submittedBy: evidence.agentDid,
          verified: true,
          timestamp: evidence.ts
        }))
      : [];

    const eventsArray = [
      {
        type: "CASE_FILED",
        timestamp: caseData.filedAt || Date.now(),
        actor: caseData.plaintiff
      }
    ];

    const custodyChain = {
      caseId: caseIdString,
      case: {
        plaintiff: caseData.plaintiff,
        defendant: caseData.defendant,
        filed: caseData.filedAt || Date.now(),
        status: caseData.status
      },
      evidence: evidenceArray,
      events: eventsArray,
      verification: {
        chainValid: true,
        evidenceCount: evidenceArray.length,
        allVerified: true
      },
      meta: {
        protocol: "Autonomous Arbitration Protocol (AAP)",
        version: "1.0",
        generatedAt: Date.now()
      }
    };

    return new Response(JSON.stringify(custodyChain), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Cache-Control": "public, max-age=60" // Cache for 1 minute
      }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      error: error.message || "Failed to retrieve custody chain",
      caseId: caseIdString
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});

http.route({
  pathPrefix: "/api/custody/",
  method: "GET",
  handler: custodyHandler
});

// === END ADP ENDPOINTS ===

// === UNIFIED DISPUTE INGESTION (Multi-Product Architecture) ===

// Helper: Extract and validate API key
async function validateApiKeyFromRequest(ctx: any, request: Request): Promise<{
  isValid: boolean;
  organizationId?: any;
  error?: string;
  hint?: string;
}> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return {
      isValid: false,
      error: "Missing Authorization header",
      hint: "Include 'Authorization: Bearer csk_live_...' header with your API key"
    };
  }

  const apiKey = authHeader.replace("Bearer ", "").trim();
  if (!apiKey || !apiKey.startsWith("csk_")) {
    return {
      isValid: false,
      error: "Invalid API key format",
      hint: "API key should start with 'csk_live_' or 'csk_test_'"
    };
  }

  const keyValidation = await ctx.runQuery(api.apiKeys.checkApiKey, { key: apiKey });

  if (!keyValidation.isValid) {
    return {
      isValid: false,
      error: keyValidation.error || "Invalid API key",
      hint: "Ensure your API key is valid and active"
    };
  }

  return {
    isValid: true,
    organizationId: keyValidation.organizationId
  };
}

// === UNIFIED DISPUTE INGESTION ENDPOINTS ===

// Payment disputes endpoint
http.route({
  path: "/api/disputes/payment",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const validation = await validateApiKeyFromRequest(ctx, request);
      if (!validation.isValid) {
        return new Response(JSON.stringify({
          error: validation.error,
          hint: validation.hint
        }), {
          status: 401,
          headers: corsHeaders,
        });
      }

      return await handlePaymentDispute(ctx, request, validation.organizationId!);
    } catch (error: any) {
      console.error("Payment dispute error:", error);
      return new Response(JSON.stringify({
        error: error.message,
        hint: "Check API documentation at https://docs.consulatehq.com/disputes/payment"
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }
  })
});

// Agent disputes endpoint (no auth required for backward compatibility)
http.route({
  path: "/api/disputes/agent",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // Note: No authentication required for agent disputes (matches old /disputes behavior)
      return await handleAgentDispute(ctx, request, undefined);
    } catch (error: any) {
      console.error("Agent dispute error:", error);
      return new Response(JSON.stringify({
        error: error.message,
        hint: "Check API documentation at https://docs.consulatehq.com/disputes/agent"
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }
  })
});

// Handler: Payment disputes (ACP/ATXP integration)
async function handlePaymentDispute(ctx: any, request: Request, organizationId: any) {
  const body = await request.json();

  // Validate required fields
  const requiredFields = ["transactionId", "amount", "currency", "plaintiff", "defendant", "disputeReason"];
  for (const field of requiredFields) {
    if (!body[field]) {
      return new Response(JSON.stringify({
        error: `Missing required field: ${field}`,
        required: requiredFields,
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }
  }

  // Create payment dispute (organizationId auto-injected)
  const result = await ctx.runMutation(api.paymentDisputes.receivePaymentDispute, {
    transactionId: body.transactionId,
    transactionHash: body.transactionHash,
    amount: body.amount,
    currency: body.currency,
    paymentProtocol: body.paymentProtocol || "other",
    plaintiff: body.plaintiff,
    defendant: body.defendant,
    disputeReason: body.disputeReason,
    description: body.description || "Payment dispute",
    evidenceUrls: body.evidenceUrls || [],
    callbackUrl: body.callbackUrl,
    reviewerOrganizationId: organizationId, // Auto-detected from API key
  });

  return new Response(JSON.stringify({
    success: true,
    ...result,
    message: result.isMicroDispute
      ? "Micro-dispute received. Auto-ruling in progress (< 5 min)."
      : "Dispute received. Processing with AI analysis (< 24 hours).",
    regulationECompliant: true,
    deadlines: {
      initialResponse: result.estimatedResolutionTime,
      regulationEFinal: "10 business days",
    },
  }), {
    headers: corsHeaders,
  });
}

// Handler: Agent disputes (general SLA/contract violations)
async function handleAgentDispute(ctx: any, request: Request, organizationId: any | undefined) {
  const body = await request.json();

  // Validate required fields for agent disputes
  const requiredFields = ["plaintiff", "defendant", "type", "jurisdictionTags", "evidenceIds"];
  for (const field of requiredFields) {
    if (!body[field]) {
      return new Response(JSON.stringify({
        error: `Missing required field: ${field}`,
        required: requiredFields,
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }
  }

  // Create agent dispute
  const result = await ctx.runMutation(api.cases.fileDispute, {
    plaintiff: body.plaintiff,
    defendant: body.defendant,
    type: body.type,
    jurisdictionTags: body.jurisdictionTags,
    evidenceIds: body.evidenceIds,
    description: body.description,
    claimedDamages: body.claimedDamages,
    breachDetails: body.breachDetails,
  });

  return new Response(JSON.stringify({
    success: true,
    caseId: result,
    message: "Agent dispute filed successfully",
  }), {
    headers: corsHeaders,
  });
}

// Get payment dispute statistics
http.route({
  path: "/api/disputes/payment/stats",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const stats = await ctx.runQuery(api.paymentDisputes.getMicroDisputeStats, {});

      return new Response(JSON.stringify({
        success: true,
        ...stats,
        timestamp: Date.now(),
      }), {
        headers: {
          ...corsHeaders,
          "Cache-Control": "public, max-age=60", // Cache for 1 minute
        },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({
        error: error.message,
      }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  })
});

// Get disputes needing human review
http.route({
  path: "/api/disputes/payment/review-queue",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get("limit") || "20");

      const disputes = await ctx.runQuery(api.paymentDisputes.getDisputesNeedingHumanReview, {
        limit,
      });

      return new Response(JSON.stringify({
        success: true,
        count: disputes.length,
        disputes,
        timestamp: Date.now(),
      }), {
        headers: corsHeaders,
      });
    } catch (error: any) {
      return new Response(JSON.stringify({
        error: error.message,
      }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  })
});

// === END DISPUTE INGESTION ENDPOINTS ===

// Agent registration with API key authentication (Stripe-style)
http.route({
  path: "/agents/register",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // Extract API key from Authorization header
      const authHeader = request.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ 
          error: "Missing Authorization header",
          hint: "Include 'Authorization: Bearer csk_live_...' header with your API key"
        }), {
          status: 401,
          headers: corsHeaders,
        });
      }

      const apiKey = authHeader.replace("Bearer ", "").trim();
      if (!apiKey || !apiKey.startsWith("csk_")) {
        return new Response(JSON.stringify({ 
          error: "Invalid API key format",
          hint: "API key should start with 'csk_live_' or 'csk_test_'"
        }), {
          status: 401,
          headers: corsHeaders,
        });
      }

      // Parse request body
      const body = await request.json();
      const { name, functionalType, buildHash, configHash, mock } = body;
      
      if (!name) {
        return new Response(JSON.stringify({ 
          error: "Missing required field: name",
          required: ["name"],
          optional: ["functionalType", "buildHash", "configHash", "mock"]
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      // Register agent using API key
      const result = await ctx.runMutation(api.agents.joinAgent, {
        apiKey,
        name,
        functionalType: functionalType || "general",
        buildHash,
        configHash,
        mock: mock || false
      });
      
      return new Response(JSON.stringify({
        success: true,
        agentId: result.agentId,
        agentDid: result.did,
        organizationName: result.organizationName,
        message: result.message
      }), {
        headers: corsHeaders,
      });
      
    } catch (error: any) {
      console.error("Agent registration failed:", error);
      return new Response(JSON.stringify({ 
        error: error.message,
        hint: "Ensure your API key is valid and active"
      }), {
        status: error.message.includes("Invalid API key") ? 401 : 400,
        headers: corsHeaders,
      });
    }
  })
});

// List agents
http.route({
  path: "/agents",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const functionalType = url.searchParams.get("type") || undefined;
    const limit = parseInt(url.searchParams.get("limit") || "50");
    
    try {
      const agents = await ctx.runQuery(api.agents.getAgentsByFunctionalType, {
        functionalType: functionalType as any,
        limit
      });
      
      return new Response(JSON.stringify(agents), {
        headers: corsHeaders,
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ 
        error: error.message 
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }
  })
});

// Get agent reputation
http.route({
  path: "/agents/:did/reputation",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const did = request.url.split("/agents/")[1].split("/reputation")[0];
    
    try {
      const reputation = await ctx.runQuery(api.agents.getAgentReputation, {
        agentDid: did
      });
      
      if (!reputation) {
        return new Response(JSON.stringify({ 
          error: "Reputation not found" 
        }), {
          status: 404,
          headers: corsHeaders,
        });
      }
      
      return new Response(JSON.stringify(reputation), {
        headers: corsHeaders,
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ 
        error: error.message 
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }
  })
});

// Get top agents by reputation
http.route({
  path: "/agents/top-reputation",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const sortBy = (url.searchParams.get("sortBy") || "overallScore") as "overallScore" | "winRate";
    
    try {
      const agents = await ctx.runQuery(api.agents.getTopAgentsByReputation, {
        limit,
        sortBy
      });
      
      return new Response(JSON.stringify(agents), {
        headers: corsHeaders,
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ 
        error: error.message 
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }
  })
});

// Submit evidence
http.route({
  path: "/evidence",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();

      // Validate request body FIRST (developer-friendly error messages)
      if (!body.sha256) {
        return new Response(JSON.stringify({
          error: "Missing required field: sha256"
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      if (!body.signer) {
        return new Response(JSON.stringify({
          error: "Missing required field: signer"
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      if (!body.agentDid) {
        return new Response(JSON.stringify({
          error: "Missing required field: agentDid"
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      // Check if agent exists (validation before auth)
      const agent = await ctx.runQuery(api.agents.getAgent, { did: body.agentDid });
      if (!agent) {
        return new Response(JSON.stringify({
          error: "Agent not found or not active"
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      // NOW check authentication (after validation)
      const authHeader = request.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({
          error: "Missing Authorization header",
          hint: "Include 'Authorization: Bearer csk_live_...' header with your API key"
        }), {
          status: 401,
          headers: corsHeaders,
        });
      }

      const apiKey = authHeader.replace("Bearer ", "").trim();
      if (!apiKey || !apiKey.startsWith("csk_")) {
        return new Response(JSON.stringify({
          error: "Invalid API key format",
          hint: "API key should start with 'csk_live_' or 'csk_test_'"
        }), {
          status: 401,
          headers: corsHeaders,
        });
      }

      // Verify API key exists and is active
      const keyValidation = await ctx.runQuery(api.apiKeys.checkApiKey, { key: apiKey });

      if (!keyValidation.isValid) {
        return new Response(JSON.stringify({
          error: keyValidation.error || "Invalid API key",
          hint: "Ensure your API key is valid and active"
        }), {
          status: 401,
          headers: corsHeaders,
        });
      }

      const result = await ctx.runMutation(api.evidence.submitEvidence, {
        ...body
      });

      return new Response(JSON.stringify(result), {
        headers: corsHeaders,
      });
    } catch (error: any) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }
  })
});

// Get case status
http.route({
  path: "/cases/:caseId",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const caseId = request.url.split("/").pop();
    
    if (!caseId) {
      return new Response(JSON.stringify({ error: "Case ID is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }
    
    try {
      const caseData = await ctx.runQuery(api.cases.getCase, {
        caseId: caseId as any
      });
      
      return new Response(JSON.stringify(caseData), {
        headers: corsHeaders,
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ 
        error: error.message 
      }), {
        status: 404,
        headers: corsHeaders,
      });
    }
  })
});


// === REAL-WORLD AGENT INTEGRATION ENDPOINTS ===

// Agent discovery - find other agents by capability
http.route({
  path: "/agents/discover",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { capabilities, functionalTypes, location, excludeSelf } = body;
    
    try {
      let agents = await ctx.runQuery(api.agents.getAgentsByFunctionalType, {
        functionalType: functionalTypes?.[0] || "general",
        limit: 100
      });
      
      // Filter by capabilities if specified
      if (capabilities && capabilities.length > 0) {
        agents = agents.filter((agent: any) => {
          const agentCapabilities = agent.specialization?.capabilities || [];
          return capabilities.some((cap: string) => agentCapabilities.includes(cap));
        });
      }
      
      // Exclude self if requested
      if (excludeSelf && body.agentDid) {
        agents = agents.filter((agent: any) => agent.did !== body.agentDid);
      }
      
      // Return discovery results with capability matching
      const discoveryResults = agents.map((agent: any) => ({
        did: agent.did,
        functionalType: agent.functionalType,
        capabilities: agent.specialization?.capabilities || [],
        certifications: agent.specialization?.certifications || [],
        endpoint: `https://${agent.did.split(':')[2]}.ai/api`,
        status: agent.status,
        lastSeen: agent.createdAt
      }));
      
      return new Response(JSON.stringify({
        discovered: discoveryResults.length,
        agents: discoveryResults,
        timestamp: Date.now()
      }), {
        headers: corsHeaders,
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ 
        error: error.message 
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }
  })
});

// Agent capabilities endpoint - advertise what you can do
http.route({
  path: "/agents/capabilities",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { agentDid, capabilities, slaProfile, endpoint } = body;
    
    try {
      // Update agent's advertised capabilities
      const agent = await ctx.runQuery(api.agents.getAgent, { did: agentDid });
      if (!agent) {
        throw new Error("Agent not found");
      }
      
      // Store capability advertisement (would typically update the agent record)
      // For now, return success and log the capability update
      console.log(`Agent ${agentDid} updated capabilities:`, capabilities);
      
      return new Response(JSON.stringify({
        success: true,
        agentDid,
        capabilitiesRegistered: capabilities?.length || 0,
        slaProfileActive: !!slaProfile,
        timestamp: Date.now()
      }), {
        headers: corsHeaders,
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ 
        error: error.message 
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }
  })
});

// Webhook registration - agents register for dispute notifications
http.route({
  path: "/webhooks/register",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { agentDid, webhookUrl, events, secret } = body;
    
    try {
      // Validate webhook URL
      if (!webhookUrl || !webhookUrl.startsWith('http')) {
        throw new Error("Valid webhook URL is required");
      }
      
      // Register webhook (in real system, store in webhooks table)
      const webhook = {
        agentDid,
        url: webhookUrl,
        events: events || ["dispute_filed", "case_updated", "evidence_requested"],
        secret: secret || generateSHA256().substring(0, 32),
        active: true,
        createdAt: Date.now()
      };
      
      console.log(`📡 Webhook registered for ${agentDid}: ${webhookUrl}`);
      
      return new Response(JSON.stringify({
        success: true,
        webhookId: generateSHA256().substring(0, 16),
        agentDid,
        url: webhookUrl,
        events: webhook.events,
        secret: webhook.secret,
        timestamp: Date.now()
      }), {
        headers: corsHeaders,
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ 
        error: error.message 
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }
  })
});

// Get notifications for an agent
http.route({
  path: "/notifications/:agentDid",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const agentDid = request.url.split("/").pop();
    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get("unread") === "true";
    
    if (!agentDid) {
      return new Response(JSON.stringify({ error: "Agent DID is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }
    
    try {
      // Get recent events for this agent
      const recentEvents = await ctx.runQuery(api.events.getRecentEvents, { limit: 50 });
      
      // Filter events relevant to this agent
      const notifications = recentEvents.filter((event: any) => {
        return event.agentDid === agentDid || 
               (event.payload?.parties && event.payload.parties.includes(agentDid));
      }).map((event: any) => ({
        id: event._id,
        type: event.type,
        message: formatNotificationMessage(event, agentDid),
        timestamp: event.timestamp,
        read: false, // In real system, track read status
        priority: getNotificationPriority(event.type),
        actionRequired: requiresAction(event.type),
        relatedCaseId: event.caseId || null
      }));
      
      return new Response(JSON.stringify({
        agentDid,
        notifications,
        unreadCount: notifications.filter((n: { read: boolean }) => !n.read).length,
        timestamp: Date.now()
      }), {
        headers: corsHeaders,
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ 
        error: error.message 
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }
  })
});

// Live feed of system activity
http.route({
  path: "/live/feed",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const agentDid = url.searchParams.get("agentDid");
    const eventTypes = url.searchParams.get("types")?.split(",") || null;
    
    try {
      const recentEvents = await ctx.runQuery(api.events.getRecentEvents, { limit: 20 });
      
      let filteredEvents = recentEvents;
      
      // Filter by agent if specified
      if (agentDid) {
        filteredEvents = filteredEvents.filter((event: any) => 
          event.agentDid === agentDid || 
          (event.payload?.parties && event.payload.parties.includes(agentDid))
        );
      }
      
      // Filter by event types if specified
      if (eventTypes) {
        filteredEvents = filteredEvents.filter((event: any) => 
          eventTypes.includes(event.type)
        );
      }
      
      const liveFeed = filteredEvents.map((event: any) => ({
        id: event._id,
        type: event.type,
        message: formatEventMessage(event),
        timestamp: event.timestamp,
        participants: event.payload?.parties || [event.agentDid].filter(Boolean),
        impact: getEventImpact(event.type),
        caseId: event.caseId || null
      }));
      
      return new Response(JSON.stringify({
        feed: liveFeed, // Main feed data
        events: liveFeed, // Alias for compatibility
        lastUpdate: Date.now(),
        systemHealth: "OPERATIONAL"
      }), {
        headers: corsHeaders,
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ 
        error: error.message 
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }
  })
});

// Helper functions
function generateSHA256(): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function formatNotificationMessage(event: any, agentDid: string): string {
  switch (event.type) {
    case "DISPUTE_FILED":
      return event.payload?.parties?.includes(agentDid) 
        ? `New dispute filed against you (${event.payload.type})`
        : `Dispute filed in your jurisdiction (${event.payload.type})`;
    case "CASE_STATUS_UPDATED":
      return `Case ${event.payload?.caseId} updated to ${event.payload?.newStatus}`;
    case "EVIDENCE_SUBMITTED":
      return `Evidence submitted in your case`;
    default:
      return event.type.replace(/_/g, ' ').toLowerCase();
  }
}

function formatEventMessage(event: any): string {
  switch (event.type) {
    case "DISPUTE_FILED":
      const parties = event.payload?.parties?.map((p: string) => 
        p.split(':')[2]?.replace(/-/g, ' ')
      ).join(" vs ") || "Unknown parties";
      return `${parties} - ${event.payload?.type || 'Dispute'} filed`;
    case "CASE_STATUS_UPDATED":
      return `Case updated to ${event.payload?.newStatus}`;
    case "EVIDENCE_SUBMITTED":
      const agent = event.payload?.agentDid?.split(':')[2]?.replace(/-/g, ' ') || "Unknown";
      return `${agent} submitted evidence`;
    default:
      return event.type.replace(/_/g, ' ').toLowerCase();
  }
}

function getNotificationPriority(eventType: string): string {
  const priorities: Record<string, string> = {
    "DISPUTE_FILED": "HIGH",
    "CASE_STATUS_UPDATED": "MEDIUM", 
    "EVIDENCE_SUBMITTED": "MEDIUM",
    "AGENT_REGISTERED": "LOW"
  };
  return priorities[eventType] || "LOW";
}

function requiresAction(eventType: string): boolean {
  return ["DISPUTE_FILED", "EVIDENCE_REQUESTED"].includes(eventType);
}

function getEventImpact(eventType: string): string {
  const impacts: Record<string, string> = {
    "DISPUTE_FILED": "financial",
    "CASE_STATUS_UPDATED": "operational",
    "EVIDENCE_SUBMITTED": "legal",
    "AGENT_REGISTERED": "informational"
  };
  return impacts[eventType] || "informational";
}

// === SLA MONITORING ENDPOINTS ===

// Report SLA metrics
http.route({
  path: "/sla/report",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { agentDid, metrics, timestamp } = body;

      // Validate required fields
      if (!agentDid) {
        return new Response(JSON.stringify({
          error: "Missing required field: agentDid"
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      if (!metrics) {
        return new Response(JSON.stringify({
          error: "Missing required field: metrics"
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      // Validate metric values
      const { availability, responseTime, errorRate, throughput } = metrics;

      if (typeof availability === 'number' && (availability < 0 || availability > 100)) {
        return new Response(JSON.stringify({
          error: "Invalid availability value (must be 0-100)"
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      if (typeof responseTime === 'number' && responseTime < 0) {
        return new Response(JSON.stringify({
          error: "Invalid responseTime value (must be positive)"
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      if (typeof errorRate === 'number' && (errorRate < 0 || errorRate > 100)) {
        return new Response(JSON.stringify({
          error: "Invalid errorRate value (must be 0-100)"
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      if (typeof throughput === 'number' && throughput < 0) {
        return new Response(JSON.stringify({
          error: "Invalid throughput value (must be positive)"
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      // Check if agent exists
      const agent = await ctx.runQuery(api.agents.getAgent, { did: agentDid });
      if (!agent) {
        return new Response(JSON.stringify({
          error: "Agent not found"
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      // Detect SLA violations
      const violations = [];
      if (availability !== undefined && availability < 99.0) {
        violations.push({ metric: "availability", threshold: 99.0, actual: availability });
      }
      if (responseTime !== undefined && responseTime > 200) {
        violations.push({ metric: "responseTime", threshold: 200, actual: responseTime });
      }
      if (errorRate !== undefined && errorRate > 1.0) {
        violations.push({ metric: "errorRate", threshold: 1.0, actual: errorRate });
      }

      // Store SLA report (in production, would save to database)
      console.log(`📊 SLA report received from ${agentDid}:`, metrics);
      if (violations.length > 0) {
        console.warn(`⚠️  SLA violations detected for ${agentDid}:`, violations);
      }

      return new Response(JSON.stringify({
        success: true,
        agentDid,
        metricsAccepted: true,
        violations: violations.length > 0 ? violations : undefined,
        timestamp: timestamp || Date.now()
      }), {
        headers: corsHeaders,
      });

    } catch (error: any) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }
  })
});

// Get SLA status for an agent
http.route({
  path: "/sla/status/:agentDid",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const agentDid = request.url.split("/sla/status/")[1];

      if (!agentDid) {
        return new Response(JSON.stringify({
          error: "Agent DID is required"
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      // Check if agent exists
      const agent = await ctx.runQuery(api.agents.getAgent, { did: agentDid });
      if (!agent) {
        return new Response(JSON.stringify({
          error: "Agent not found"
        }), {
          status: 404,
          headers: corsHeaders,
        });
      }

      // Return mock SLA status (in production, would query from database)
      return new Response(JSON.stringify({
        agentDid,
        status: "compliant",
        currentMetrics: {
          availability: 99.9,
          responseTime: 150,
          errorRate: 0.1,
          throughput: 1000
        },
        thresholds: {
          availability: 99.0,
          responseTime: 200,
          errorRate: 1.0
        },
        lastReportedAt: Date.now(),
        timestamp: Date.now()
      }), {
        headers: corsHeaders,
      });

    } catch (error: any) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }
  })
});

export default http;
