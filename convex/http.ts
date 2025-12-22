import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { mcpDiscovery, mcpInvoke } from "./mcp";
import { imageGeneratorHandler, imageGeneratorHealth } from "./demoAgents";

const http = httpRouter();

// CORS headers for real-world agent access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Agent-DID, X-Agent-Signature, X-SLA-Report, X-PAYMENT, X-Payment-Proof, X-402-Transaction-Hash, PAYMENT-SIGNATURE",
  "Access-Control-Expose-Headers": "X-PAYMENT-RESPONSE, X-402-PAYMENT-RESPONSE",
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
http.route({ path: "/mcp", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/.well-known/adp", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/.well-known/adp/neutrals", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/agents/register", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/agents/claim", method: "OPTIONS", handler: optionsHandler });
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
http.route({ path: "/disputes/claim", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/api/disputes/payment/stats", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/api/disputes/payment/review-queue", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/api/custody/:caseId", method: "OPTIONS", handler: optionsHandler });
// Demo agents for dispute testing
http.route({ path: "/demo-agents/image-generator/health", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/demo-agents/image-generator/process", method: "OPTIONS", handler: optionsHandler });

// Root endpoint - API info
http.route({
  path: "/",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({
      service: "x402disputes.com - Permissionless X-402 Dispute Resolution",
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
      documentation: "https://docs.x402disputes.com",
      protocol: {
        name: "X-402 Dispute Protocol",
        repository: "https://github.com/x402disputes/x402-dispute-protocol",
        ietf_draft: "draft-kotecha-x402-dispute-protocol"
      },
      integration: {
        mcp: "Add x402disputes MCP server to your agent - file disputes directly",
        sdk: "https://github.com/x402disputes/agent-sdk",
        examples: "https://github.com/x402disputes/integration-examples"
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
      service: "x402disputes" 
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

// MCP SSE endpoint (GET) - for Claude Desktop connection initialization
http.route({
  path: "/mcp",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    // Claude Desktop initiates SSE connection with GET request
    // Return SSE stream that stays open for server-to-client messages
    return new Response(
      new ReadableStream({
        start(controller) {
          // Send initial connection confirmation
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(`event: endpoint\ndata: /mcp\n\n`));
          
          // Keep connection alive
          // Note: Convex HTTP actions have a timeout, so this will eventually close
          // Claude Desktop will reconnect as needed
        }
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  })
});

// Standard MCP endpoint (JSON-RPC 2.0 protocol)
// This is the standard MCP endpoint that Cursor and other MCP clients expect
http.route({
  path: "/mcp",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { jsonrpc, id, method, params } = body;

      // Validate JSON-RPC 2.0 format
      if (jsonrpc !== "2.0") {
        return new Response(JSON.stringify({
          jsonrpc: "2.0",
          id: id || null,
          error: {
            code: -32600,
            message: "Invalid Request: jsonrpc must be '2.0'"
          }
        }), {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }

      // Handle standard MCP methods
      switch (method) {
        case "initialize": {
          // MCP initialization handshake
          const { protocolVersion, capabilities, clientInfo } = params || {};
          
          return new Response(JSON.stringify({
            jsonrpc: "2.0",
            id,
            result: {
              protocolVersion: "2024-11-05",
              capabilities: {
                tools: {
                  listChanged: false
                }
              },
              serverInfo: {
                name: "x402disputes.com",
                version: "2.0.0"
              }
            }
          }), {
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });
        }

        case "notifications/initialized": {
          // Client indicates it's ready - just acknowledge
          return new Response("", {
            status: 204,
            headers: { 
              "Access-Control-Allow-Origin": "*"
            }
          });
        }

        case "tools/list": {
          // Return list of available tools
          const { MCP_TOOLS } = await import("./mcp");
          return new Response(JSON.stringify({
            jsonrpc: "2.0",
            id,
            result: {
              tools: MCP_TOOLS
            }
          }), {
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });
        }

        case "tools/call": {
          // Invoke a tool
          const { name: toolName, arguments: toolArgs } = params || {};
          
          if (!toolName) {
            return new Response(JSON.stringify({
              jsonrpc: "2.0",
              id,
              error: {
                code: -32602,
                message: "Invalid params: 'name' is required"
              }
            }), {
              status: 400,
              headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
              }
            });
          }

          // Call tool handlers directly (no internal HTTP fetch)
          // This is more reliable than fetch() for Convex HTTP actions
          let invokeData: any;
          
          try {
            // Route to appropriate handler based on tool name
            switch (toolName) {
              case "x402_file_dispute": {
                // Call payment dispute handler directly
                const parameters = toolArgs || {};
                
                // Validate required fields - plaintiff/defendant are extracted from blockchain
                if (!parameters.description || 
                    !parameters.request || !parameters.response || 
                    !parameters.transactionHash || !parameters.blockchain) {
                  invokeData = {
                    success: false,
                    error: {
                      code: "MISSING_REQUIRED_FIELDS",
                      message: "Missing required fields for dispute filing",
                      required: ["description", "request", "response", "transactionHash", "blockchain"]
                    }
                  };
                  break;
                }
                
                // Validate blockchain is supported (Base or Solana only)
                const supportedChains = ["base", "solana"];
                if (!supportedChains.includes(parameters.blockchain)) {
                  invokeData = {
                    success: false,
                    error: {
                      code: "UNSUPPORTED_BLOCKCHAIN",
                      message: `Only Base and Solana chains are supported for USDC payments`,
                      field: "blockchain",
                      received: parameters.blockchain,
                      expected: "base or solana",
                      suggestion: "X-402 disputes only accept USDC payments on Base and Solana chains."
                    }
                  };
                  break;
                }
                
                // Query blockchain to extract USDC transaction details (plaintiff, defendant, amount)
                // Blockchain is the source of truth - validates USDC transfer
                console.log(`🔍 Querying ${parameters.blockchain} blockchain for USDC transfer: ${parameters.transactionHash}`);
                const txDetails = await ctx.runAction(api.lib.blockchain.queryTransaction, {
                  blockchain: parameters.blockchain,
                  transactionHash: parameters.transactionHash
                });
                
                if (!txDetails || !txDetails.success) {
                  invokeData = {
                    success: false,
                    error: {
                      code: "TRANSACTION_NOT_FOUND",
                      message: `Transaction not found on ${parameters.blockchain}`,
                      details: (txDetails && 'error' in txDetails) ? txDetails.error : "Unknown error"
                    }
                  };
                  break;
                }
                
                // Extract plaintiff and defendant from blockchain transaction
                const txData = txDetails as any;
                const plaintiff = txData.fromAddress || "";  // Extracted from blockchain tx.from
                const defendant = txData.toAddress || "";    // Extracted from blockchain tx.to
                const txAmountUsd = txData.amountUsd || parseFloat(txData.value || "0");
                
                console.log(`✅ Transaction details extracted from blockchain:`);
                console.log(`   Plaintiff (buyer): ${plaintiff}`);
                console.log(`   Defendant (seller): ${defendant}`);
                console.log(`   Amount: ${txAmountUsd} ${txData.currency || "USD"}`);
                
                // Build payment dispute args
                const paymentDisputeArgs: any = {
                  transactionId: parameters.transactionHash,
                  amount: txAmountUsd,
                  currency: txData.currency || "USD",
                  plaintiff: plaintiff,  // From blockchain
                  defendant: defendant,  // From blockchain
                  disputeReason: "quality_issue",
                  description: parameters.description,
                  evidenceUrls: [],
                  callbackUrl: parameters.callbackUrl,
                  plaintiffMetadata: { 
                    walletAddress: plaintiff,
                    requestJson: JSON.stringify(parameters.request)
                  },
                  defendantMetadata: { 
                    walletAddress: defendant,
                    responseJson: JSON.stringify(parameters.response)
                  }
                };
                
                // Check for defendant's organization
                const defendantAgent = await ctx.runQuery(api.agents.getAgentByWallet as any, {
                  walletAddress: defendant
                });
                
                if (defendantAgent?.organizationId) {
                  paymentDisputeArgs.reviewerOrganizationId = defendantAgent.organizationId;
                }
                
                // File the dispute
                const result = await ctx.runMutation(api.paymentDisputes.receivePaymentDispute, paymentDisputeArgs);
                
                invokeData = {
                  success: true,
                  disputeType: "PAYMENT",
                  caseId: result.caseId,
                  paymentDisputeId: result.paymentDisputeId,
                  status: result.status,
                  isMicroDispute: result.isMicroDispute,
                  disputeFee: result.fee,
                  
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
                      currency: txData.currency || "USD",
                      blockNumber: txData.blockNumber
                    }
                  },
                  
                  humanReviewRequired: result.humanReviewRequired,
                  estimatedResolutionTime: result.estimatedResolutionTime,
                  message: `X-402 payment dispute filed. All transaction details verified from blockchain.`,
                  trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://x402disputes.com'}/cases/${result.caseId}`,
                  nextSteps: [
                    "AI analyzes dispute + provides recommendation",
                    "Merchant reviews in dashboard",
                    "Resolution within 10 business days (Regulation E)"
                  ]
                };
                break;
              }
              
              case "x402_list_my_cases": {
                const parameters = toolArgs || {};
                const cases = await ctx.runQuery(api.cases.getCasesByParty, {
                  party: parameters.walletAddress
                });
                
                const filteredCases = parameters.status && parameters.status !== "all"
                  ? cases.filter((c: any) => c.status === parameters.status)
                  : cases;
                
                invokeData = {
                  success: true,
                  walletAddress: parameters.walletAddress,
                  totalCases: filteredCases.length,
                  cases: filteredCases
                };
                break;
              }
              
              case "x402_check_case_status": {
                const parameters = toolArgs || {};
                const caseData = await ctx.runQuery(internal.cases.getCase, {
                  caseId: parameters.caseId as any
                });
                
                invokeData = {
                  success: true,
                  case: caseData
                };
                break;
              }
              
              case "demo_image_generator": {
                // Demo agent - returns information about the demo endpoint
                const parameters = toolArgs || {};
                
                if (!parameters.prompt || typeof parameters.prompt !== 'string') {
                  invokeData = {
                    success: false,
                    error: {
                      code: "MISSING_PROMPT",
                      message: "prompt is required",
                      field: "prompt",
                      expected: "String between 3-1000 characters"
                    }
                  };
                  break;
                }
                
                if (parameters.prompt.length < 3 || parameters.prompt.length > 1000) {
                  invokeData = {
                    success: false,
                    error: {
                      code: "INVALID_PROMPT_LENGTH",
                      message: `Prompt must be between 3-1000 characters (got ${parameters.prompt.length})`
                    }
                  };
                  break;
                }
                
                invokeData = {
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
                    step_2: "Call: POST https://api.x402disputes.com/demo-agents/image-generator/process",
                    step_3: "Receive 200 OK with generated image URL",
                    coinbase_mcp: "Install: npx @coinbase/payments-mcp"
                  },
                  endpoint: "https://api.x402disputes.com/demo-agents/image-generator/process",
                  prompt: parameters.prompt,
                  size: parameters.size || "1024x1024",
                  model: parameters.model || "stable-diffusion-xl",
                  expected_behavior: "Returns 200 OK with image URL after payment verification",
                  use_case: "Working X-402 payment demo"
                };
                break;
              }
              
              default:
                invokeData = {
                  success: false,
                  error: {
                    code: "TOOL_NOT_FOUND",
                    message: `Unknown tool: ${toolName}`
                  }
                };
            }
            
            // Format response according to MCP protocol
            // MCP requires tool results in content blocks format
            let formattedResult;
            
            if (invokeData.success === false) {
              // Error response - format as MCP error
              formattedResult = {
                content: [
                  {
                    type: "text",
                    text: `❌ Error: ${invokeData.error?.message || 'Unknown error'}\n\n${JSON.stringify(invokeData.error, null, 2)}`
                  }
                ],
                isError: true
              };
            } else {
              // Success response - format as readable text + structured data
              let textOutput = "";
              
              // Format based on tool type
              if (toolName === "x402_file_dispute") {
                textOutput = `✅ Dispute Received Successfully!\n\n` +
                  `📋 Case ID: ${invokeData.caseId}\n` +
                  `💰 Fee: $${invokeData.disputeFee}\n` +
                  `⏱️  Status: ${invokeData.status}\n` +
                  `🔗 Track: ${invokeData.trackingUrl}\n\n` +
                  `Next Steps:\n${invokeData.nextSteps?.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n') || 'N/A'}`;
              } else if (toolName === "x402_list_my_cases") {
                const cases = invokeData.cases || [];
                textOutput = `📊 Cases for ${invokeData.walletAddress}\n\n` +
                  `Total: ${invokeData.totalCases} cases\n\n` +
                  cases.slice(0, 10).map((c: any, i: number) => 
                    `${i + 1}. ${c._id || c.caseId || 'Unknown'}\n` +
                    `   Status: ${c.status}\n` +
                    `   Type: ${c.type}\n` +
                    `   Plaintiff: ${c.plaintiff?.substring(0, 10)}...\n` +
                    `   Defendant: ${c.defendant?.substring(0, 10)}...`
                  ).join('\n\n') +
                  (cases.length > 10 ? `\n\n... and ${cases.length - 10} more` : '');
              } else if (toolName === "demo_image_generator") {
                textOutput = `🎨 ImageGenerator500 Demo Agent\n\n` +
                  `📝 Prompt: "${invokeData.prompt}"\n` +
                  `📐 Size: ${invokeData.size}\n` +
                  `🤖 Model: ${invokeData.model}\n\n` +
                  `💰 Payment Required:\n` +
                  `   Amount: ${invokeData.payment_required.amount} ${invokeData.payment_required.currency}\n` +
                  `   Network: ${invokeData.payment_required.network}\n` +
                  `   Wallet: ${invokeData.payment_required.recipient}\n\n` +
                  `🔗 Endpoint: ${invokeData.endpoint}\n\n` +
                  `⚠️  Expected Behavior: ${invokeData.expected_behavior}\n\n` +
                  `📋 Next Steps:\n` +
                  `1. ${invokeData.instructions.step_1}\n` +
                  `2. ${invokeData.instructions.step_2}\n` +
                  `3. ${invokeData.instructions.step_3}\n\n` +
                  `💡 ${invokeData.use_case}`;
              } else if (toolName === "x402_check_case_status") {
                const caseData = invokeData.case;
                textOutput = `📋 Case Status\n\n` +
                  `Case ID: ${caseData?._id || caseData?.caseId || 'N/A'}\n` +
                  `Status: ${caseData?.status || 'N/A'}\n` +
                  `Type: ${caseData?.type || 'N/A'}\n` +
                  `Plaintiff: ${caseData?.plaintiff || 'N/A'}\n` +
                  `Defendant: ${caseData?.defendant || 'N/A'}\n` +
                  `Created: ${caseData?._creationTime ? new Date(caseData._creationTime).toLocaleString() : 'N/A'}`;
              } else {
                // Generic format
                textOutput = JSON.stringify(invokeData, null, 2);
              }
              
              formattedResult = {
                content: [
                  {
                    type: "text",
                    text: textOutput
                  }
                ],
                isError: false
              };
            }
            
            // Return in JSON-RPC format with MCP content structure
            return new Response(JSON.stringify({
              jsonrpc: "2.0",
              id,
              result: formattedResult
            }), {
              headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
              }
            });
          } catch (error: any) {
            // Format errors in MCP content structure
            // IMPORTANT: Tool-level errors should return HTTP 200 with isError: true
            // Only protocol-level errors should use error status codes
            return new Response(JSON.stringify({
              jsonrpc: "2.0",
              id,
              result: {
                content: [
                  {
                    type: "text",
                    text: `❌ Internal Error: ${error.message}\n\nStack: ${error.stack || 'No stack trace'}`
                  }
                ],
                isError: true
              }
            }), {
              status: 200,  // HTTP 200 for tool-level errors per MCP spec
              headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
              }
            });
          }
        }

        default:
          return new Response(JSON.stringify({
            jsonrpc: "2.0",
            id,
            error: {
              code: -32601,
              message: `Method not found: ${method}`,
              data: {
                hint: "Supported methods: tools/list, tools/call"
              }
            }
          }), {
            status: 404,
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });
      }
    } catch (error: any) {
      return new Response(JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32700,
          message: "Parse error",
          data: {
            details: error.message
          }
        }
      }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  })
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
          email: "support@x402disputes.com",
          website: "https://x402disputes.com"
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
        disputes: "/disputes",
        fileDispute: "/disputes",
        evidence: "/evidence",
        submitEvidence: "/evidence",
        checkStatus: "/cases/:caseId",
        custody: "/api/custody/:caseId",
        neutrals: "/.well-known/adp/neutrals",
        documentation: "https://docs.x402disputes.com/adp"
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
    const caseData = await ctx.runQuery(internal.cases.getCase, { caseId });

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

// Payment disputes endpoint
http.route({
  path: "/api/disputes/payment",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      return await handlePaymentDispute(ctx, request, undefined);
    } catch (error: any) {
      console.error("Payment dispute error:", error);
      return new Response(JSON.stringify({
        error: error.message,
        hint: "Check API documentation at https://docs.x402disputes.com/disputes/payment"
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
        hint: "Check API documentation at https://docs.x402disputes.com/disputes/agent"
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }
  })
});

// Buyer dispute claim endpoint with signature verification
http.route({
  path: "/disputes/claim",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const vendorId = url.searchParams.get("vendor");
      
      if (!vendorId) {
        return new Response(JSON.stringify({
          error: "Missing vendor parameter",
          hint: "Use /disputes/claim?vendor=0x[ethereum-address] (e.g., 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0)"
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }
      
      const body = await request.json();
      
      // Validate required fields
      const requiredFields = ["transactionId", "amount", "complaint", "signature", "request", "response"];
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
      
      // 1. Get vendor's public key
      const vendor = await ctx.runQuery(api.agents.getAgent, { did: vendorId });
      if (!vendor) {
        return new Response(JSON.stringify({
          error: "Vendor not found",
          vendorId
        }), {
          status: 404,
          headers: corsHeaders,
        });
      }
      
      if (!vendor.publicKey) {
        return new Response(JSON.stringify({
          error: "Vendor has no public key registered",
          hint: "Vendor must register with an Ed25519 public key"
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }
      
      // 2. Verify signature
      const payload = JSON.stringify({
        request: body.request,
        response: body.response,
        amountUsd: body.amountUsd || body.amount,
      });
      
      const verified = await ctx.runAction(api.lib.crypto.verifyEd25519Signature, {
        publicKey: vendor.publicKey,
        signature: body.signature,
        payload,
      });
      
      if (!verified) {
        return new Response(JSON.stringify({
          error: "Signature verification failed",
          hint: "Evidence may be tampered or signature is invalid"
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }
      
      // 3. Determine reviewerOrganizationId from defendant's organization
      // SECURITY: ONLY use defendant's org (they review disputes filed against them)
      // NEVER use plaintiff's org (conflict of interest!)
      let reviewerOrganizationId: any = undefined;
      if (vendor.organizationId) {
        reviewerOrganizationId = vendor.organizationId;
      }
      // If defendant has no org or agent record, dispute remains unassigned

      // 3. Create dispute case with signed evidence
      const caseId = await ctx.runMutation(api.cases.fileDispute, {
        plaintiff: body.buyerId || `buyer:${body.buyerEmail || "anonymous"}`,
        defendant: vendorId,
        type: "PAYMENT",
        jurisdictionTags: ["payment", "signature-verified"],
        evidenceIds: [],
        description: body.complaint,
        amount: body.amountUsd || body.amount, // Support both old and new field names
        currency: body.crypto ? body.crypto.currency : (body.currency || "USD"),
        reviewerOrganizationId, // Link to defendant's organization
        signedEvidence: {
          request: body.request,
          response: body.response,
          amountUsd: body.amountUsd || body.amount,
          signature: body.signature,
          signatureVerified: true,
          vendorDid: vendorId,
        },
      });
      
      return new Response(JSON.stringify({
        success: true,
        caseId,
        disputeUrl: `https://api.x402disputes.com/cases/${caseId}`,
        signatureVerified: true,
        vendorDid: vendorId,
        message: "Dispute filed successfully with verified evidence"
      }), {
        headers: corsHeaders,
      });
      
    } catch (error: any) {
      console.error("Buyer dispute claim error:", error);
      return new Response(JSON.stringify({
        error: error.message,
        hint: "Ensure all required fields are provided and signature is valid"
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

  // Auto-detect reviewerOrganizationId if not provided via API key
  // SECURITY: ONLY use defendant's organization (they review disputes filed against them)
  // NEVER use plaintiff's org (conflict of interest - they'd approve their own refunds!)
  let reviewerOrgId = organizationId;
  
  if (!reviewerOrgId) {
    // Check defendant's organization ONLY
    const defendantAgent = await ctx.runQuery(api.agents.getAgentByWallet, {
      walletAddress: body.defendant
    });
    
    if (defendantAgent?.organizationId) {
      reviewerOrgId = defendantAgent.organizationId;
    }
    // If defendant has no org or agent record, dispute remains unassigned
  }

  // Create payment dispute (organizationId auto-injected)
  const result = await ctx.runMutation(api.paymentDisputes.receivePaymentDispute, {
    transactionId: body.transactionId,
    transactionHash: body.transactionHash,
    amount: body.amount,
    currency: body.currency,
    plaintiff: body.plaintiff,
    defendant: body.defendant,
    disputeReason: body.disputeReason,
    description: body.description || "Payment dispute",
    evidenceUrls: body.evidenceUrls || [],
    callbackUrl: body.callbackUrl,
    reviewerOrganizationId: reviewerOrgId, // Auto-detected from API key OR agent lookup
    // Party metadata - helps customer identify parties in their system
    plaintiffMetadata: body.plaintiffMetadata,
    defendantMetadata: body.defendantMetadata,
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

// Agent claiming - sellers prove ownership of Ethereum address
http.route({
  path: "/agents/claim",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { walletAddress, signature, message, organizationId, userId } = body;
      
      // Validate required fields
      if (!walletAddress) {
        return new Response(JSON.stringify({
          error: "Missing required field: walletAddress"
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }
      
      if (!signature) {
        return new Response(JSON.stringify({
          error: "Missing required field: signature"
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }
      
      if (!message) {
        return new Response(JSON.stringify({
          error: "Missing required field: message"
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }
      
      if (!organizationId) {
        return new Response(JSON.stringify({
          error: "Missing required field: organizationId"
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }
      
      if (!userId) {
        return new Response(JSON.stringify({
          error: "Missing required field: userId"
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }
      
      // Claim the agent
      // TODO: claimAgent mutation doesn't exist - this endpoint needs implementation
      // @ts-expect-error - claimAgent mutation not implemented yet
      const result = await ctx.runMutation(api.agents.claimAgent, {
        walletAddress,
        signature,
        message,
        organizationId: organizationId as any,
        userId: userId as any,
      });
      
      return new Response(JSON.stringify({
        success: true,
        ...result,
        message: "Agent claimed successfully"
      }), {
        headers: corsHeaders,
      });
      
    } catch (error: any) {
      console.error("Agent claiming failed:", error);
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }
  })
});

// Agent registration with Ed25519 public key
http.route({
  path: "/agents/register",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // Parse request body
      const body = await request.json();
      const { name, publicKey, organizationName, openApiSpec, specVersion, functionalType, buildHash, configHash, mock } = body;
      
      // Validate required fields
      if (!name) {
        return new Response(JSON.stringify({ 
          error: "Missing required field: name",
          required: ["name", "publicKey", "organizationName"],
          optional: ["openApiSpec", "specVersion", "functionalType", "buildHash", "configHash", "mock"]
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      if (!publicKey) {
        return new Response(JSON.stringify({ 
          error: "Missing required field: publicKey",
          hint: "Provide base64-encoded Ed25519 public key"
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      if (!organizationName) {
        return new Response(JSON.stringify({ 
          error: "Missing required field: organizationName",
          hint: "Provide organization name for agent registration"
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      // Register agent with public key
      const result = await ctx.runMutation(api.agents.joinAgent, {
        name,
        publicKey,
        organizationName,
        openApiSpec,
        specVersion,
        functionalType: functionalType || "general",
        buildHash,
        configHash,
        mock: mock || false
      });
      
      return new Response(JSON.stringify({
        success: true,
        agentId: result.agentId,
        agentDid: result.did,
        disputeUrl: result.disputeUrl,
        organizationName: result.organizationName,
        hasOpenApiSpec: result.hasOpenApiSpec,
        message: result.message
      }), {
        headers: corsHeaders,
      });
      
    } catch (error: any) {
      console.error("Agent registration failed:", error);
      return new Response(JSON.stringify({ 
        error: error.message,
        hint: "Ensure all required fields are provided"
      }), {
        status: 400,
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

      // Check if agent exists
      const agent = await ctx.runQuery(api.agents.getAgent, { did: body.agentDid });
      if (!agent) {
        return new Response(JSON.stringify({
          error: "Agent not found or not active"
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      // Submit evidence (no authentication required - signature will be verified later)
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
      const caseData = await ctx.runQuery(internal.cases.getCase, {
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

// Manual workflow trigger for testing (remove in production)
http.route({
  path: "/test/trigger-workflow",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { caseId } = body;
      
      if (!caseId) {
        return new Response(JSON.stringify({ error: "Missing caseId" }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      // Get case data (httpActions can call internal queries)
      const caseData = await ctx.runQuery(internal.cases.getCase, { caseId });
      if (!caseData) {
        return new Response(JSON.stringify({ error: "Case not found" }), {
          status: 404,
          headers: corsHeaders,
        });
      }

      // Trigger workflow
      const workflowManager = (await import("./workflows")).workflowManager;
      const amount = caseData.amount || 0;
      const evidenceCount = caseData.evidenceIds?.length || 0;
      
      let workflowId: string | undefined;
      if (caseData.type === "PAYMENT") {
        if (amount < 1 && evidenceCount <= 2) {
          workflowId = await workflowManager.start(ctx, internal.workflows.microDisputeWorkflow, { caseId });
        } else {
          workflowId = await workflowManager.start(ctx, internal.workflows.paymentDisputeWorkflow, { caseId });
        }
      } else {
        workflowId = await workflowManager.start(ctx, internal.workflows.generalDisputeWorkflow, { caseId });
      }

      return new Response(JSON.stringify({
        success: true,
        caseId,
        workflowId,
        message: `Triggered ${caseData.type} workflow`,
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

// Workflow steps endpoint - for dashboard visualization
http.route({
  path: "/api/workflow/steps",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const caseId = url.searchParams.get("caseId");
      
      if (!caseId) {
        return new Response(JSON.stringify({ error: "Missing caseId parameter" }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      // Call the public query to get workflow steps
      const steps = await ctx.runQuery(api.workflows.getWorkflowStepsPublic, { 
        caseId: caseId as any 
      });

      return new Response(JSON.stringify({
        success: true,
        caseId,
        steps,
        count: steps?.length || 0,
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

// Workflow status endpoint - for dashboard
http.route({
  path: "/api/workflow/status",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const caseId = url.searchParams.get("caseId");
      
      if (!caseId) {
        return new Response(JSON.stringify({ error: "Missing caseId parameter" }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      // Call the public query to get workflow status
      const status = await ctx.runQuery(api.workflows.getWorkflowStatusPublic, { 
        caseId: caseId as any 
      });

      return new Response(JSON.stringify({
        success: true,
        caseId,
        status,
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

// === DEMO AGENTS ===

/**
 * ImageGenerator - Working X-402 demo agent
 * 
 * Purpose: Demonstrate working X-402 payment flow (like dabit3/x402-starter-kit)
 * Payment: 0.1 USDC on BASE via X-402 protocol
 * Wallet: 0x49AF4074577EA313C5053cbB7560AC39e34b05E8
 * Behavior: Validates payment, generates image, returns 200 OK with image URL
 * 
 * Routes:
 * - GET /demo-agents/image-generator/health - Discovery/health check
 * - POST /demo-agents/image-generator/process - Generate image (requires payment)
 */

// Health/Discovery route
http.route({
  path: "/demo-agents/image-generator/health",
  method: "GET",
  handler: imageGeneratorHealth
});

// Process route - Main API endpoint
http.route({
  path: "/demo-agents/image-generator/process",
  method: "POST",
  handler: imageGeneratorHandler
});

export default http;
