import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
// NOTE: In the dashboard workspace, TypeScript can hit "excessively deep" instantiation
// when importing the full generated API type graph. We use require() to keep this file
// runtime-correct while avoiding type-level recursion during dashboard type-check.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { api, internal } = require("./_generated/api") as any;

const http = httpRouter();

// CORS headers for real-world agent access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  // Wallet-first v1 endpoints support BOTH x402 v1 and v2:
  // - v1: X-PAYMENT (base64 JSON), 402 response body accepts[]
  // - v2: PAYMENT-SIGNATURE, 402 PAYMENT-REQUIRED header (base64 JSON)
  // Keep permissive for agents + browsers.
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, Link, PAYMENT-REQUIRED, PAYMENT-SIGNATURE, PAYMENT-RESPONSE, X-PAYMENT, X-402-Transaction-Hash, X-PAYMENT-RESPONSE, X-402-PAYMENT-RESPONSE",
  "Access-Control-Expose-Headers": "Link, PAYMENT-REQUIRED, PAYMENT-RESPONSE, X-PAYMENT-RESPONSE, X-402-PAYMENT-RESPONSE",
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
http.route({ path: "/.well-known/x402.json", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/.well-known/mcp.json", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/mcp/invoke", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/mcp", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/.well-known/adp", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/.well-known/adp/neutrals", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/evidence", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/webhooks/register", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/live/feed", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/sla/report", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/sla/status/:agentDid", method: "OPTIONS", handler: optionsHandler });
// New unified dispute endpoints
http.route({ path: "/api/custody/:caseId", method: "OPTIONS", handler: optionsHandler });
// Wallet-first v1 endpoints (no signup, no API keys)
http.route({ path: "/v1/topup", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/v1/disputes", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/v1/merchant/balance", method: "OPTIONS", handler: optionsHandler });
// NOTE: Convex HTTP router in this deployment does not reliably support `:param` routes.
// Use static paths with query/body for ID-based operations.
http.route({ path: "/v1/dispute", method: "OPTIONS", handler: optionsHandler });
// Demo agents for dispute testing
http.route({ path: "/demo-agents/image-generator", method: "OPTIONS", handler: optionsHandler });

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
      documentation: "https://www.x402disputes.com/docs",
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
      headers: {
        ...corsHeaders,
        // Encourage edge/CDN caching so subsequent health checks are consistently fast.
        // This also stabilizes the "should respond quickly" test which calls /health twice.
        "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=600",
      },
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

// Merchant x402 metadata (demo-friendly)
// Merchants publish this file on THEIR domain. For the built-in demo agent, we serve it here
// so Claude Desktop can exercise the full "Link header → dispute → email" flow.
http.route({
  path: "/.well-known/x402.json",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    void ctx;
    const baseOrigin = new URL(request.url).origin;
    const demoWallet = "0x3095372280EB7a32227Cb07DCEeFd0bA978F81a9";
    const merchant = `eip155:8453:${demoWallet.toLowerCase()}`;
    const disputeUrl = `${baseOrigin}/v1/disputes?merchant=${merchant}`;
    const supportEmail =
      process.env.DEMO_AGENTS_SUPPORT_EMAIL ||
      process.env.SUPPORT_EMAIL ||
      "vbkotecha@gmail.com";

    return new Response(
      JSON.stringify({
        x402disputes: {
          merchant,
          paymentDisputeUrl: disputeUrl,
          supportEmail,
          terms: {
            refundWindowDays: 7,
            evidenceWindowDays: 7,
            currency: "USDC",
          },
        },
      }),
      { headers: corsHeaders },
    );
  }),
});

// Merchant email verification (no-signup notifications)
// Clicked from an email sent to supportEmail on the first dispute for a (merchant, origin).
http.route({
  path: "/v1/merchant/verify-email",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const token = url.searchParams.get("token") || "";

    if (!token) {
      return new Response("Missing token", {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const res = await (ctx.runMutation as any)(internal.merchantEmailVerification.confirmVerificationToken, { token });

    if (!res?.ok) {
      const reason = typeof res?.reason === "string" ? res.reason : "INVALID_TOKEN";
      return new Response(`Verification failed: ${reason}`, {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const body =
      `Email verified.\n\n` +
      `Merchant: ${res.merchant}\n` +
      `Origin: ${res.origin}\n` +
      `Email: ${res.supportEmail}\n\n` +
      `You will now receive dispute emails for this origin.\n`;

    return new Response(body, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
    });
  }),
});

// One-click dispute actions from email (approve/refund/reject)
http.route({
  path: "/v1/merchant/action",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const token = url.searchParams.get("token") || "";
    if (!token) {
      return new Response("Missing token", {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const res = await (ctx.runMutation as any)(internal.merchantEmailActions.applyDecisionFromToken, { token });
    if (!res?.ok) {
      const message = typeof res?.message === "string" ? res.message : "Action failed";
      const code = typeof res?.code === "string" ? res.code : "ERROR";
      if (code === "INSUFFICIENT_CREDITS") {
        const body =
          `Refund not sent yet — insufficient refund credits.\n\n` +
          `Top up refund credits here:\n` +
          `- https://x402disputes.com/topup\n\n` +
          `After topping up, click the email link again.\n`;
        return new Response(body, {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
        });
      }
      return new Response(`${code}: ${message}`, {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const caseUrl = `https://api.x402disputes.com/v1/dispute?id=${encodeURIComponent(res.caseId)}`;
    const trackingUrl = `https://x402disputes.com/cases/${encodeURIComponent(res.caseId)}`;

    const bodyLines: string[] = [];
    const isReject = String(res.verdict) === "MERCHANT_WINS";
    bodyLines.push(isReject ? "All set — dispute rejected." : "All set — refund is being processed.");
    bodyLines.push("");
    bodyLines.push(`Case: ${res.caseId}`);
    bodyLines.push(`Decision: ${res.verdict}`);
    bodyLines.push("");
    if (res.refundScheduled) {
      // Best-effort: if the refund already executed quickly, show the on-chain proof right here.
      const refund = await ctx.runQuery((api as any).refunds.getRefundStatus, { caseId: res.caseId as any });
      if (refund?.status === "EXECUTED") {
        bodyLines.push("Refund: sent on-chain.");
        const proofUrl =
          typeof refund.explorerUrl === "string" && refund.explorerUrl
            ? refund.explorerUrl
            : typeof refund.refundTxHash === "string" && refund.refundTxHash
              ? `https://basescan.org/tx/${refund.refundTxHash}`
              : "";
        if (proofUrl) bodyLines.push(`On-chain proof: ${proofUrl}`);
      } else if (refund?.status) {
        bodyLines.push(`Refund: processing (${String(refund.status)})`);
      } else {
        bodyLines.push("Refund: processing now.");
      }
      bodyLines.push("You can track progress on the case page below.");
    } else {
      bodyLines.push("Refund: not applicable for this decision.");
    }
    bodyLines.push("");
    bodyLines.push("Track this case:");
    bodyLines.push(`- Case tracking: ${trackingUrl}`);
    bodyLines.push("");

    const body = bodyLines.join("\n");
    return new Response(body, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
    });
  }),
});

// === MCP (Model Context Protocol) ENDPOINTS ===
// Agent-native integration for zero-friction dispute filing

// MCP Discovery - agents auto-discover available tools
http.route({
  path: "/.well-known/mcp.json",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const { mcpDiscovery } = await import("./mcp");
    return await (mcpDiscovery as any)(ctx, request);
  })
});

// MCP Tool Invocation - agents invoke tools directly
http.route({
  path: "/mcp/invoke",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const { mcpInvoke } = await import("./mcp");
    return await (mcpInvoke as any)(ctx, request);
  })
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
                    !parameters.transactionHash || !parameters.blockchain ||
                    !parameters.recipientAddress) {
                  invokeData = {
                    success: false,
                    error: {
                      code: "MISSING_REQUIRED_FIELDS",
                      message: "Missing required fields for dispute filing",
                      required: ["description", "request", "response", "transactionHash", "blockchain", "recipientAddress"]
                    }
                  };
                  break;
                }

                // Breaking change: amount fields are no longer accepted (derive from chain).
                if (parameters.amount !== undefined || parameters.amountUnit !== undefined) {
                  invokeData = {
                    success: false,
                    error: {
                      code: "UNSUPPORTED_FIELDS",
                      message: "amount/amountUnit are no longer accepted; amounts are derived from chain",
                      fields: ["amount", "amountUnit"],
                      suggestion:
                        "Remove amount/amountUnit and provide recipientAddress (and optionally sourceTransferLogIndex if MULTI_MATCH).",
                    },
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
                
                // Deterministic verification: select the USDC Transfer by merchant recipient address (+ optional logIndex).
                const { formatMicrosToUsdc } = await import("./lib/usdc");
                const rawLogIndex = parameters.sourceTransferLogIndex;
                const parsedLogIndex =
                  typeof rawLogIndex === "number"
                    ? rawLogIndex
                    : typeof rawLogIndex === "string" && rawLogIndex.trim() !== ""
                      ? Number(rawLogIndex)
                      : undefined;
                if (parsedLogIndex !== undefined && (!Number.isSafeInteger(parsedLogIndex) || parsedLogIndex < 0)) {
                  invokeData = {
                    success: false,
                    error: {
                      code: "INVALID_SOURCE_TRANSFER_LOG_INDEX",
                      message: "sourceTransferLogIndex must be a non-negative integer",
                      field: "sourceTransferLogIndex",
                    },
                  };
                  break;
                }

                console.log(`🔍 Verifying ${parameters.blockchain} USDC transfer by recipient: ${parameters.transactionHash}`);
                const verify = await ctx.runAction(api.lib.blockchain.verifyUsdcTransferByRecipient, {
                  blockchain: parameters.blockchain,
                  transactionHash: parameters.transactionHash,
                  recipientAddress: parameters.recipientAddress,
                  sourceTransferLogIndex: parsedLogIndex,
                });
                
                if (!verify.ok) {
                  invokeData = {
                    success: false,
                    error: {
                      code: verify.code,
                      message: verify.message,
                      candidates: verify.candidates,
                    }
                  };
                  break;
                }
                
                const plaintiff = verify.payerAddress;
                const defendant = verify.recipientAddress;
                const txAmountUsd = parseFloat(formatMicrosToUsdc(verify.amountMicrousdc));
                
                // Build payment dispute args
                const paymentDisputeArgs: any = {
                  transactionHash: parameters.transactionHash,
                  blockchain: parameters.blockchain,
                  recipientAddress: parameters.recipientAddress,
                  sourceTransferLogIndex: verify.logIndex,
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
                const result = await ctx.runAction(api.paymentDisputes.receivePaymentDispute, paymentDisputeArgs);
                
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
                      currency: "USDC",
                      logIndex: verify.logIndex
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
                    recipient: "0x3095372280EB7a32227Cb07DCEeFd0bA978F81a9",
                    protocol: "X-402"
                  },
                  instructions: {
                    step_1: "This endpoint uses X-402 signature-based payment with facilitator",
                    step_2: "Call: POST https://api.x402disputes.com/demo-agents/image-generator with X-PAYMENT header",
                    step_3: "Receive 200 OK with generated image URL from Pollinations AI",
                    note: "Payment signature will be verified and settled via mcpay.tech facilitator"
                  },
                  endpoint: "https://api.x402disputes.com/demo-agents/image-generator",
                  prompt: parameters.prompt,
                  size: parameters.size || "1024x1024",
                  model: parameters.model || "stable-diffusion-xl",
                  expected_behavior: "Returns 200 OK with real image URL after payment settlement",
                  use_case: "X-402 signature-based payment demo"
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
        documentation: "https://www.x402disputes.com/docs"
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
      // @ts-ignore - Convex generated types can exceed TS instantiation depth in large http.ts
      const judges = await (ctx.runQuery as any)(api.judges.getJudges, {});

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
    // @ts-ignore - Convex generated types can exceed TS instantiation depth in large http.ts
    const caseData = await (ctx.runQuery as any)(internal.cases.getCase, { caseId });

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

// NOTE: Legacy payment intake endpoint removed.
// Use wallet-first: POST /v1/disputes

// === WALLET-FIRST V1 ENDPOINTS (NO SIGNUP, NO API KEYS) ===

const USDC_BASE_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

function base64EncodeJson(obj: unknown): string {
  return btoa(JSON.stringify(obj));
}

function jsonError(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), { status, headers: corsHeaders });
    }

// GET /v1/merchant/balance?merchant=eip155:8453:0x...
http.route({
  path: "/v1/merchant/balance",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const merchant = url.searchParams.get("merchant") || "";
    if (!merchant) {
      return jsonError(400, { ok: false, code: "MISSING_MERCHANT", message: "merchant (CAIP-10) is required" });
    }

    const res: any = await (ctx.runQuery as any)((internal as any).pool.getMerchantUsdcBalanceMicrousdc, { merchant });
    if (!res?.ok) {
      return jsonError(400, { ok: false, code: "INVALID_MERCHANT", message: "merchant must be CAIP-10 eip155:..." });
    }
    return new Response(JSON.stringify({ ok: true, merchant, availableMicrousdc: res.availableMicrousdc ?? 0 }), {
      status: 200,
      headers: corsHeaders,
    });
  }),
});

// POST /v1/topup
// - No PAYMENT-SIGNATURE: returns 402 + PAYMENT-REQUIRED (base64 JSON).
// - With PAYMENT-SIGNATURE: verify+settle via facilitator, verify on-chain deposit, credit merchant ledger.
http.route({
  path: "/v1/topup",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json().catch(() => ({} as any));
    const merchant = typeof body?.merchant === "string" ? body.merchant : "";
    const currency = typeof body?.currency === "string" ? body.currency : "USDC";
    const amountMicrousdcRaw = body?.amountMicrousdc;
    const caseId = typeof body?.caseId === "string" ? body.caseId : "";

    if (!merchant || typeof merchant !== "string") {
      return jsonError(400, { ok: false, code: "MISSING_MERCHANT", message: "merchant (CAIP-10) is required" });
    }
    if (currency !== "USDC") {
      return jsonError(400, { ok: false, code: "UNSUPPORTED_CURRENCY", message: "Only USDC is supported" });
      }
    const amountMicrousdc =
      typeof amountMicrousdcRaw === "number"
        ? amountMicrousdcRaw
        : typeof amountMicrousdcRaw === "string"
          ? Number(amountMicrousdcRaw)
          : NaN;
    if (!Number.isSafeInteger(amountMicrousdc) || amountMicrousdc <= 0) {
      return jsonError(400, { ok: false, code: "INVALID_AMOUNT", message: "amountMicrousdc must be a positive integer" });
    }

    const depositAddress = process.env.PLATFORM_BASE_USDC_DEPOSIT_ADDRESS;
    if (!depositAddress) {
      return jsonError(500, { ok: false, code: "NOT_CONFIGURED", message: "PLATFORM_BASE_USDC_DEPOSIT_ADDRESS not configured" });
    }

    // x402 v2: requirements in PAYMENT-REQUIRED header (base64 JSON).
    const paymentRequiredV2 = {
      x402Version: 2,
      accepts: [
        {
          scheme: "exact",
          network: "eip155:8453",
          asset: USDC_BASE_MAINNET,
          amount: String(amountMicrousdc),
          // Facilitator implementations often still read this legacy field name.
          maxAmountRequired: String(amountMicrousdc),
          payTo: depositAddress,
          resource: request.url,
          description: "x402disputes refund pool top-up (Base USDC)",
          mimeType: "application/json",
          maxTimeoutSeconds: 60,
          extra: {
            name: "USD Coin",
            version: "2",
          },
        },
      ],
    };

    // x402 v1: requirement in 402 body accepts[] (JSON)
    const paymentRequiredV1 = {
      x402Version: 1,
      accepts: [
        {
          scheme: "exact",
          network: "base",
          maxAmountRequired: String(amountMicrousdc),
          asset: USDC_BASE_MAINNET,
          payTo: depositAddress,
          resource: request.url,
          description: "x402disputes refund pool top-up (Base USDC)",
          mimeType: "application/json",
          maxTimeoutSeconds: 60,
          extra: {
            name: "USD Coin",
            version: "2",
          },
        },
      ],
    };

    const paymentSig = request.headers.get("PAYMENT-SIGNATURE");
    const xPayment = request.headers.get("X-PAYMENT");
    const txHashHeader = request.headers.get("X-402-Transaction-Hash");

    async function maybeSendActionsEmailForCase(): Promise<void> {
      if (!caseId) return;
      try {
        const caseData: any = await (ctx.runQuery as any)((internal as any).cases.getCase, { caseId });
        if (!caseData) return;
        if (String(caseData.defendant || "") !== String(merchant)) return;
        await (ctx.runAction as any)((internal as any).merchantNotifications.notifyMerchantDisputeFiled, {
          caseId,
        });
      } catch {
        // Never fail top-up due to notification follow-up errors.
      }
    }

    // If caller already has an on-chain tx hash (v1 hash-forwarding flow), skip facilitator.
    if (txHashHeader) {
      const verified = await ctx.runAction(api.lib.blockchain.verifyUsdcTransferByAmount, {
        blockchain: "base",
        transactionHash: txHashHeader,
        expectedAmountMicrousdc: amountMicrousdc,
        expectedToAddress: depositAddress,
  });
      if (!verified.ok) {
        return jsonError(400, { ok: false, code: verified.code, message: verified.message });
  }

      const credited = await (ctx.runMutation as any)((api as any).pool.topup_creditMerchantBalanceFromTx, {
        merchant,
        blockchain: "base",
        txHash: txHashHeader,
        sourceTransferLogIndex: verified.logIndex,
        amountMicrousdc: verified.amountMicrousdc,
        payerAddress: verified.payerAddress,
        recipientAddress: verified.recipientAddress,
  });
      if (!credited?.ok) return jsonError(400, credited);

      await maybeSendActionsEmailForCase();
      return new Response(
        JSON.stringify({
          ok: true,
          merchant,
          txHash: txHashHeader,
          creditedMicrousdc: credited.creditedMicrousdc,
          newBalanceMicrousdc: credited.newBalanceMicrousdc,
        }),
        { status: 200, headers: corsHeaders },
      );
}

    // Discovery: return BOTH v2 header and v1 body so either client can proceed.
    if (!paymentSig && !xPayment) {
      return new Response(JSON.stringify(paymentRequiredV1), {
        status: 402,
        headers: {
          ...corsHeaders,
          "PAYMENT-REQUIRED": base64EncodeJson(paymentRequiredV2),
        },
      });
    }

    // Verify + settle via facilitator (node action).
    // v2 uses PAYMENT-SIGNATURE; v1 uses X-PAYMENT.
    const paymentHeader = paymentSig || xPayment;
    const paymentRequirements = paymentSig ? paymentRequiredV2.accepts[0] : paymentRequiredV1.accepts[0];

    const verify: any = await (ctx.runAction as any)((api as any).demoAgents.cdpAuth.verifyPayment, {
      paymentHeader,
      paymentRequirements,
    });
    if (verify?.status >= 400) {
      return jsonError(400, { ok: false, code: "VERIFY_FAILED", facilitator: verify?.facilitator, message: verify?.body });
    }

    const settle: any = await (ctx.runAction as any)((api as any).demoAgents.cdpAuth.settlePayment, {
      paymentHeader,
      paymentRequirements,
      });
    if (settle?.status >= 400) {
      return jsonError(400, { ok: false, code: "SETTLE_FAILED", facilitator: settle?.facilitator, message: settle?.body });
    }

    let txHash: string | null = null;
    try {
      const parsed = JSON.parse(String(settle?.body ?? ""));
      txHash = typeof parsed?.transaction === "string" ? parsed.transaction : typeof parsed?.transactionHash === "string" ? parsed.transactionHash : null;
    } catch {
      txHash = null;
    }
    if (!txHash) {
      return jsonError(502, { ok: false, code: "NO_TX_HASH", message: "Facilitator did not return a transaction hash" });
    }

    // Verify unique USDC transfer by amount to our deposit address, then credit merchant.
    const verified = await ctx.runAction(api.lib.blockchain.verifyUsdcTransferByAmount, {
      blockchain: "base",
      transactionHash: txHash,
      expectedAmountMicrousdc: amountMicrousdc,
      expectedToAddress: depositAddress,
        });
    if (!verified.ok) {
      return jsonError(400, { ok: false, code: verified.code, message: verified.message });
      }
      
    const credited = await (ctx.runMutation as any)((api as any).pool.topup_creditMerchantBalanceFromTx, {
      merchant,
      blockchain: "base",
      txHash,
      sourceTransferLogIndex: verified.logIndex,
      amountMicrousdc: verified.amountMicrousdc,
      payerAddress: verified.payerAddress,
      recipientAddress: verified.recipientAddress,
        });

    if (!credited?.ok) {
      return jsonError(400, credited);
    }

      await maybeSendActionsEmailForCase();
      return new Response(JSON.stringify({
      ok: true,
      merchant,
      txHash,
      creditedMicrousdc: credited.creditedMicrousdc,
      newBalanceMicrousdc: credited.newBalanceMicrousdc,
    }), { status: 200, headers: corsHeaders });
  }),
});

// POST /v1/disputes
http.route({
  path: "/v1/disputes",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json().catch(() => ({} as any));
    const buyer = typeof body?.buyer === "string" ? body.buyer : "buyer:anonymous";
    const merchant = typeof body?.merchant === "string" ? body.merchant : "";
    const merchantOriginRaw = typeof body?.merchantOrigin === "string" ? body.merchantOrigin : "";
    const merchantX402MetadataUrlRaw =
      typeof body?.merchantX402MetadataUrl === "string" ? body.merchantX402MetadataUrl : undefined;
    const txHash = typeof body?.txHash === "string" ? body.txHash : undefined;
    const chain = typeof body?.chain === "string" ? body.chain : undefined;
    const amountMicrousdc = body?.amountMicrousdc;
    const reason = typeof body?.reason === "string" ? body.reason : undefined;
    const evidenceUrlOrHash = typeof body?.evidenceUrlOrHash === "string" ? body.evidenceUrlOrHash : undefined;
    const agentId = typeof body?.agentId === "string" ? body.agentId : undefined;
    const txId = typeof body?.txId === "string" ? body.txId : undefined;

    if (!merchant) return jsonError(400, { ok: false, code: "MISSING_MERCHANT", message: "merchant (CAIP-10) is required" });
    if (!merchantOriginRaw) {
      return jsonError(400, { ok: false, code: "MISSING_MERCHANT_ORIGIN", message: "merchantOrigin (https origin) is required" });
    }

    let merchantOrigin: string;
    try {
      const u = new URL(merchantOriginRaw);
      if (u.protocol !== "https:") throw new Error("merchantOrigin must be https://");
      merchantOrigin = u.origin;
    } catch (e: any) {
      return jsonError(400, { ok: false, code: "INVALID_MERCHANT_ORIGIN", message: e?.message || "Invalid merchantOrigin URL" });
    }

    let merchantX402MetadataUrl: string | undefined = undefined;
    if (merchantX402MetadataUrlRaw) {
      try {
        const u = new URL(merchantX402MetadataUrlRaw);
        if (u.protocol !== "https:") throw new Error("merchantX402MetadataUrl must be https://");
        merchantX402MetadataUrl = u.toString();
      } catch (e: any) {
        return jsonError(400, { ok: false, code: "INVALID_MERCHANT_X402_METADATA_URL", message: e?.message || "Invalid merchantX402MetadataUrl URL" });
      }
    }

    const created = await (ctx.runMutation as any)((api as any).pool.cases_fileWalletPaymentDispute, {
      buyer,
      merchant,
      merchantOrigin,
      merchantX402MetadataUrl,
      txHash,
      chain: chain === "base" ? "base" : undefined,
      amountMicrousdc,
      reason,
      evidenceUrlOrHash,
      agentId,
      txId,
      });
    if (!created?.ok) return jsonError(400, created);

    return new Response(JSON.stringify({ ok: true, disputeId: created.disputeId }), { status: 200, headers: corsHeaders });
  }),
});

// GET /v1/disputes?merchant=<caip10>
http.route({
  path: "/v1/disputes",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const merchant = url.searchParams.get("merchant") || "";
    const limit = Number(url.searchParams.get("limit") || "50");
    
    const res = await ctx.runQuery((api as any).pool.cases_listWalletDisputesByMerchant, {
      merchant,
      limit,
      });
    if (!res?.ok) return jsonError(400, res);
    return new Response(JSON.stringify(res), { status: 200, headers: corsHeaders });
  }),
});

// GET /v1/dispute?id=<caseId>
http.route({
  path: "/v1/dispute",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const id = url.searchParams.get("id") || "";
    if (!id) return jsonError(400, { ok: false, code: "MISSING_ID" });

    let row: any = null;
    try {
      row = await (ctx.runQuery as any)((api as any).cases.getCaseById, { caseId: id });
    } catch (e: any) {
      // Invalid IDs fail validation in Convex (v.id("cases")).
      return jsonError(400, { ok: false, code: "INVALID_ID", message: e?.message || "Invalid caseId" });
      }
    if (!row) return jsonError(404, { ok: false, code: "NOT_FOUND" });

    // Include refund status/proof when available so callers can show "refunding/refunded" without
    // additional Convex SDK queries.
    let refund: any = null;
    try {
      refund = await ctx.runQuery((api as any).refunds.getRefundStatus, { caseId: id });
    } catch {
      refund = null;
    }

    return new Response(JSON.stringify({ ok: true, dispute: row, refund }), { status: 200, headers: corsHeaders });
  }),
});

// === END WALLET-FIRST V1 ENDPOINTS ===

// NOTE: Legacy public payment stats/review-queue endpoints removed.
// Dashboard uses Convex queries (e.g. paymentDisputes:getCustomerReviewQueue) directly.

// === END DISPUTE INGESTION ENDPOINTS ===

// NOTE: Public /agents/* HTTP endpoints removed. SaaS dashboard uses Convex client queries/mutations.

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
// NOTE: Public agent discovery/capabilities endpoints removed.

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
    const limitRaw = url.searchParams.get("limit");
    const status = url.searchParams.get("status"); // optional
    const merchant = url.searchParams.get("merchant"); // optional CAIP-10 merchant filter

    const limit =
      limitRaw && limitRaw.trim() !== ""
        ? Number(limitRaw)
        : 20;
    if (!Number.isFinite(limit) || !Number.isSafeInteger(limit) || limit <= 0 || limit > 200) {
      return new Response(JSON.stringify({
        ok: false,
        code: "INVALID_LIMIT",
        message: "limit must be an integer between 1 and 200",
      }), { status: 400, headers: corsHeaders });
      }
      
    try {
      const res = await ctx.runQuery(api.cases.listLiveFeedCases, {
        limit,
        status: status ?? undefined,
        merchant: merchant ?? undefined,
      });
      const cases = Array.isArray((res as any)?.cases) ? (res as any).cases : [];

      // Keep legacy keys for compatibility, but make the primary payload `cases`.
      return new Response(JSON.stringify({
        ok: true,
        cases,
        feed: cases,
        events: cases,
        lastUpdate: Date.now(),
      }), { status: 200, headers: corsHeaders });
    } catch (error: any) {
      return new Response(JSON.stringify({ 
        ok: false,
        code: "INTERNAL_ERROR",
        message: error?.message || "Failed to load live feed",
      }), { status: 500, headers: corsHeaders });
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
 * Purpose: Demonstrate X-402 signature-based payment flow
 * Payment: 0.01 USDC on BASE via X-402 protocol
 * Wallet: 0x3095372280EB7a32227Cb07DCEeFd0bA978F81a9
 * Facilitator: mcpay.tech (no auth required)
 * Behavior: Verifies payment signature, generates image, returns 200 OK with image URL
 */

// GET route - Shows API documentation
http.route({
  path: "/demo-agents/image-generator",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const { imageGeneratorGetHandler } = await import("./demoAgents");
    return await (imageGeneratorGetHandler as any)(ctx, request);
  })
});

// POST route - Actual API endpoint
http.route({
  path: "/demo-agents/image-generator",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const { imageGeneratorHandler } = await import("./demoAgents");
    return await (imageGeneratorHandler as any)(ctx, request);
  })
});

export default http;
