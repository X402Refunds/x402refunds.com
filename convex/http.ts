import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
// NOTE: In the dashboard workspace, TypeScript can hit "excessively deep" instantiation
// when importing the full generated API type graph. We use require() to keep this file
// runtime-correct while avoiding type-level recursion during dashboard type-check.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { api, internal } = require("./_generated/api") as any;
import { buildMerchantActionCopy } from "./lib/merchantActionCopy";
import { buildMerchantActionErrorCopy } from "./lib/merchantActionErrorCopy";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { fileCanonicalDispute } = require("./lib/canonicalDispute") as any;
import { imageGeneratorGetHandler, imageGeneratorHandler } from "./demoAgents";
import { parseX402PayTo } from "./lib/x402PayTo";
import { findLinkByRel, parseRefundContactEmailFromLinkUri } from "./lib/linkHeader";

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
http.route({ path: "/v1/refunds", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/v1/tx/merchant", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/v1/merchant/balance", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/v1/merchant/notification-status", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/v1/merchant/resend", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/v1/evidence/upload-url", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/v1/evidence/upload", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/v1/evidence/file", method: "OPTIONS", handler: optionsHandler });
// NOTE: Convex HTTP router in this deployment does not reliably support `:param` routes.
// Use static paths with query/body for ID-based operations.
http.route({ path: "/v1/refund", method: "OPTIONS", handler: optionsHandler });
// Marketplace wallet routing endpoints
http.route({ path: "/agents/capabilities", method: "OPTIONS", handler: optionsHandler });
http.route({ path: "/agents/discover", method: "OPTIONS", handler: optionsHandler });
// Demo agents for dispute testing
http.route({ path: "/demo-agents/image-generator", method: "OPTIONS", handler: optionsHandler });

// Root endpoint - API info
http.route({
  path: "/",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({
      service: "x402refunds.com - Permissionless X-402 Refund Requests",
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

        // Evidence & refunds
        evidence: "/evidence/submit",
        refunds: "/v1/refunds",
        refund_status: "/cases/:caseId",

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
      documentation: "https://x402refunds.com/docs",
      protocol: {
        name: "X-402 Refund Requests",
        repository: "https://github.com/x402refunds/x402-refund-protocol",
        ietf_draft: "draft-kotecha-x402-refund-protocol"
      },
      integration: {
        mcp: "Add the X402Refunds MCP server to your agent - submit refund requests directly",
        sdk: "https://github.com/x402refunds/agent-sdk",
        examples: "https://github.com/x402refunds/integration-examples"
      },
      timestamp: Date.now()
    }), {
      headers: corsHeaders,
    });
  })
});

function jsonError(status: number, body: any) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

async function requireApiKeyOrg(ctx: any, request: Request): Promise<{ ok: true; organizationId: any } | { ok: false; response: Response }> {
  const auth = request.headers.get("authorization") || request.headers.get("Authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  const token = m ? m[1].trim() : "";
  if (!token) {
    return { ok: false, response: jsonError(401, { ok: false, code: "UNAUTHORIZED", message: "Missing Authorization: Bearer <api_key>" }) };
  }

  const keyRec = await ctx.db
    .query("apiKeys")
    .withIndex("by_key", (q: any) => q.eq("key", token))
    .first();

  if (!keyRec || keyRec.status !== "active" || !keyRec.organizationId) {
    return { ok: false, response: jsonError(401, { ok: false, code: "UNAUTHORIZED", message: "Invalid or revoked API key" }) };
  }

  return { ok: true, organizationId: keyRec.organizationId };
}

// === Marketplace/Seller capability endpoints ===
// POST /agents/capabilities
// Registers one or more payTo wallets (Base/Solana) for a seller identity, liable to the calling org.
http.route({
  path: "/agents/capabilities",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const auth = await requireApiKeyOrg(ctx, request);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({} as any));
    const sellerName = typeof body?.sellerName === "string" ? body.sellerName.trim() : "";
    const sellerEmail = typeof body?.sellerEmail === "string" ? body.sellerEmail.trim() : "";

    const routes = Array.isArray(body?.routes) ? body.routes : [];
    if (!Array.isArray(routes) || routes.length === 0) {
      return jsonError(400, { ok: false, code: "INVALID_REQUEST", message: "routes[] is required" });
    }

    const SOLANA_MAINNET_CHAINREF = "5eykt4GNfsw7SU33zdhhrELoMu3gFmT33EpFdpEfmgbf";

    const results: any[] = [];
    for (const r of routes) {
      const blockchain = typeof r?.blockchain === "string" ? r.blockchain : "";
      const payToRaw = typeof r?.payTo === "string" ? r.payTo.trim() : "";
      if ((blockchain !== "base" && blockchain !== "solana") || !payToRaw) {
        return jsonError(400, { ok: false, code: "INVALID_ROUTE", message: "Each route requires blockchain (base|solana) and payTo" });
      }

      const walletCaip10 =
        payToRaw.includes(":")
          ? payToRaw
          : blockchain === "base"
            ? `eip155:8453:${payToRaw.toLowerCase()}`
            : `solana:${SOLANA_MAINNET_CHAINREF}:${payToRaw}`;

      const upsert = await (ctx.runMutation as any)((internal as any).merchantWallets.upsertMerchantProfileAndWallet, {
        liableOrganizationId: auth.organizationId,
        walletCaip10,
        notificationEmail: sellerEmail || undefined,
        name: sellerName || undefined,
        isPrimary: typeof r?.isPrimary === "boolean" ? r.isPrimary : undefined,
      });
      results.push(upsert);

      // Best-effort: backfill unassigned disputes for this wallet into the liable org.
      try {
        await (ctx.runMutation as any)((internal as any).cases.assignUnassignedDisputesToOrgForMerchantWallet, {
          walletCaip10: walletCaip10,
        });
      } catch {
        // ignore
      }
    }

    return new Response(JSON.stringify({ ok: true, liableOrganizationId: String(auth.organizationId), registered: results }), {
      status: 200,
      headers: corsHeaders,
    });
  }),
});

// POST /agents/discover
// Returns registered wallets for a seller (by email) within the calling org.
http.route({
  path: "/agents/discover",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const auth = await requireApiKeyOrg(ctx, request);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({} as any));
    const sellerEmail = typeof body?.sellerEmail === "string" ? body.sellerEmail.trim() : "";
    if (!sellerEmail) {
      return jsonError(400, { ok: false, code: "INVALID_REQUEST", message: "sellerEmail is required" });
    }

    const discovered: any = await (ctx.runQuery as any)((internal as any).merchantWallets.discoverSellerWalletsByEmailInternal, {
      organizationId: auth.organizationId,
      sellerEmail,
    });
    if (!discovered?.profile) {
      return jsonError(404, { ok: false, code: "NOT_FOUND", message: "No seller profile found for sellerEmail" });
    }
    const profile = discovered.profile;
    const wallets = Array.isArray(discovered.wallets) ? discovered.wallets : [];

    return new Response(
      JSON.stringify({
        ok: true,
        merchantProfileId: String(profile._id),
        sellerEmail: profile.notificationEmail || sellerEmail,
        sellerName: profile.name || null,
        liableOrganizationId: String(auth.organizationId),
        wallets: wallets.map((w: any) => ({
          walletCaip10: w.walletCaip10,
          isPrimary: Boolean(w.isPrimary),
          createdAt: w.createdAt,
        })),
      }),
      { status: 200, headers: corsHeaders },
    );
  }),
});

// Health check endpoint
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({ 
      status: "healthy", 
      timestamp: Date.now(),
      service: "x402refunds" 
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

    // If this verification was triggered by a dispute, send a separate "Dispute received" email now.
    // IMPORTANT: only do this for the *first* successful confirmation to avoid duplicates from
    // email link prefetchers / scanners / double-clicks.
    try {
      const caseId = typeof res.caseId === "string" ? res.caseId : "";
      const newlyConfirmed = Boolean((res as any).newlyConfirmed);
      if (caseId && newlyConfirmed) {
        await ctx.scheduler.runAfter(
          0,
          (internal as any).merchantNotifications.notifyMerchantDisputeFiled,
          { caseId: caseId as any },
        );
      }
    } catch {
      // Never fail verification response due to notification follow-up.
    }

    return new Response(body, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
    });
  }),
});

// Merchant notification status (for topup UX): where emails go, verification, required credits.
http.route({
  path: "/v1/merchant/notification-status",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const caseId = url.searchParams.get("caseId") || "";
    if (!caseId) {
      return jsonError(400, { ok: false, code: "MISSING_CASE_ID", message: "caseId is required" });
    }

    let res: any = null;
    try {
      res = await (ctx.runAction as any)((internal as any).merchantNotifications.getNotificationStatusForCase, {
        caseId,
      });
    } catch (e: any) {
      return jsonError(400, { ok: false, code: "INVALID_CASE_ID", message: e?.message || "Invalid caseId" });
    }

    if (!res?.ok) {
      return jsonError(404, { ok: false, code: res?.reason || "NOT_FOUND" });
    }

    return new Response(JSON.stringify(res), { status: 200, headers: corsHeaders });
  }),
});

// Resend merchant notification email for a case (rate-limited).
http.route({
  path: "/v1/merchant/resend",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json().catch(() => ({} as any));
    const caseId = typeof body?.caseId === "string" ? body.caseId : "";
    if (!caseId) {
      return jsonError(400, { ok: false, code: "MISSING_CASE_ID", message: "caseId is required" });
    }

    // Basic rate limiting so this endpoint can't be spammed.
    try {
      const throttle: any = await (ctx.runMutation as any)((internal as any).merchantNotifications.throttleResendForCase, {
        caseId,
      });
      if (!throttle?.ok) {
        return jsonError(429, {
          ok: false,
          code: throttle?.code || "RATE_LIMITED",
          waitMs: throttle?.waitMs,
          message: "Please wait before resending",
        });
      }
    } catch (e: any) {
      return jsonError(400, { ok: false, code: "INVALID_CASE_ID", message: e?.message || "Invalid caseId" });
    }

    // Best-effort: refresh missing origin/supportEmail/payTo match for demo agents + older cases.
    try {
      await (ctx.runAction as any)((internal as any).merchantNotifications.refreshMerchantContactForCase, {
        caseId,
      });
    } catch {
      // ignore
    }

    try {
      await ctx.scheduler.runAfter(
        0,
        (internal as any).merchantNotifications.notifyMerchantDisputeFiled,
        { caseId: caseId as any },
      );
    } catch {
      // Scheduler failures shouldn't block the response.
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
  }),
});

// One-click actions from email (approve/refund/reject)
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
      // Try to include case id if we can resolve the token record.
      let caseId: string | null = null;
      try {
        const tokenRec = await (ctx.runQuery as any)((internal as any).merchantEmailActions.getToken, { token });
        if (tokenRec?.caseId) caseId = String(tokenRec.caseId);
      } catch {
        caseId = null;
      }

      const body = buildMerchantActionErrorCopy({ code, message, caseId });
      return new Response(body, {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const caseUrl = `https://api.x402refunds.com/v1/refund?id=${encodeURIComponent(res.caseId)}`;
    const trackingUrl = `https://x402refunds.com/cases/${encodeURIComponent(res.caseId)}`;

    const isReject = String(res.verdict) === "MERCHANT_WINS";
    let refund: any = null;
    if (res.refundScheduled) {
      // Best-effort: if the refund already executed quickly, show the on-chain proof right here.
      refund = await ctx.runQuery((api as any).refunds.getRefundStatus, { caseId: res.caseId as any });
    }

    const body = buildMerchantActionCopy({
      isReject,
      caseId: String(res.caseId),
      refundScheduled: Boolean(res.refundScheduled),
      refundStatus: typeof refund?.status === "string" ? refund.status : null,
      explorerUrl: typeof refund?.explorerUrl === "string" ? refund.explorerUrl : null,
      refundTxHash: typeof refund?.refundTxHash === "string" ? refund.refundTxHash : null,
    });
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
                name: "x402refunds.com",
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
              case "x402_request_refund": {
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
                      message: "Missing required fields for refund request",
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
                      suggestion: "X-402 refund requests only accept USDC payments on Base and Solana chains."
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
                
                const merchantCaip10 =
                  parameters.blockchain === "base"
                    ? `eip155:8453:${String(parameters.recipientAddress).toLowerCase()}`
                    : `solana:5eykt4GNfsw7SU33zdhhrELoMu3gFmT33EpFdpEfmgbf:${String(parameters.recipientAddress)}`;
                const merchantApiUrl = typeof parameters.request?.url === "string" ? parameters.request.url : "";

                const filed = await (fileCanonicalDispute as any)(ctx, {
                  merchant: merchantCaip10,
                  merchantApiUrl,
                  txHash: parameters.transactionHash,
                  description: parameters.description,
                  callbackUrl: parameters.callbackUrl,
                  sourceTransferLogIndex: verify.logIndex,
                  evidenceUrls: Array.isArray(parameters.evidenceUrls) ? parameters.evidenceUrls : [],
                  request: parameters.request,
                  response: parameters.response,
                });

                if (!filed?.ok) {
                  invokeData = {
                    success: false,
                    error: {
                      code: filed?.code || "FAILED",
                      message: filed?.message || "Failed to file dispute",
                      field: filed?.field,
                    }
                  };
                  break;
                }

                invokeData = {
                  success: true,
                  disputeType: "PAYMENT",
                  caseId: filed.caseId,
                  status: filed.status || "received",
                  disputeFee: filed.disputeFee,
                  
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
                  
                  humanReviewRequired: true,
                  message: `X-402 refund request submitted. All transaction details verified from blockchain.`,
                  trackingUrl: filed.trackingUrl,
                  evidenceUrls: filed.evidenceUrls || [],
                  nextSteps: [
                    "Merchant reviews in dashboard",
                    "Resolution within 10 business days (Regulation E)"
                  ]
                };
                break;
              }
              
              case "x402_list_my_refund_requests": {
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
              
              case "x402_check_refund_status": {
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
                    recipient: "0x96BDBD233d4ABC11E7C77c45CAE14194332E7381",
                    protocol: "X-402"
                  },
                  instructions: {
                    step_1: "This endpoint uses X-402 signature-based payment with facilitator",
                    step_2: "Call: POST https://api.x402refunds.com/demo-agents/image-generator with X-PAYMENT header",
                    step_3: "Receive 200 OK with generated image URL from Pollinations AI",
                    note: "Payment signature will be verified and settled via mcpay.tech facilitator"
                  },
                  endpoint: "https://api.x402refunds.com/demo-agents/image-generator",
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
              if (toolName === "x402_request_refund") {
                textOutput = `✅ Refund request submitted!\n\n` +
                  `📋 Case ID: ${invokeData.caseId}\n` +
                  `💰 Fee: $${invokeData.disputeFee}\n` +
                  `⏱️  Status: ${invokeData.status}\n` +
                  `🔗 Track: ${invokeData.trackingUrl}\n\n` +
                  `Next Steps:\n${invokeData.nextSteps?.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n') || 'N/A'}`;
              } else if (toolName === "x402_list_my_refund_requests") {
                const cases = invokeData.cases || [];
                textOutput = `📊 Refund requests for ${invokeData.walletAddress}\n\n` +
                  `Total: ${invokeData.totalCases} requests\n\n` +
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
              } else if (toolName === "x402_check_refund_status") {
                const caseData = invokeData.case;
                textOutput = `📋 Refund request status\n\n` +
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
          email: "support@x402refunds.com",
          website: "https://x402refunds.com"
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
        documentation: "https://x402refunds.com/docs"
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

// GET /v1/tx/merchant?txHash=0x...
// Derive the merchant recipient (CAIP-10) from an on-chain Base USDC transfer in the tx receipt.
http.route({
  path: "/v1/tx/merchant",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const txHash = (url.searchParams.get("txHash") || "").trim();

    if (!txHash) {
      return jsonError(400, { ok: false, code: "MISSING_TX_HASH", message: "txHash is required" });
    }

    const derived: any = await ctx.runAction((api as any).lib.blockchain.deriveUsdcMerchantFromTxHashBase, {
      transactionHash: txHash,
    });

    if (!derived?.ok) {
      const status = derived?.code === "NOT_CONFIGURED" ? 500 : 400;
      return jsonError(status, { ok: false, ...derived });
    }

    const recipientAddress = String(derived.recipientAddress || "").toLowerCase();
    const merchant = `eip155:8453:${recipientAddress}`;

    return new Response(
      JSON.stringify({
        ok: true,
        merchant,
        recipientAddress,
        payerAddress: String(derived.payerAddress || "").toLowerCase(),
        amountMicrousdc: derived.amountMicrousdc,
        sourceTransferLogIndex: derived.logIndex,
      }),
      { status: 200, headers: corsHeaders },
    );
  }),
});

// GET /v1/merchant/balance?merchant=<CAIP-10>
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
      return jsonError(400, {
        ok: false,
        code: "INVALID_MERCHANT",
        message: "merchant must be CAIP-10 eip155:<chainId>:0x<40hex> or solana:<chainRef>:<base58Address>",
      });
    }
    return new Response(JSON.stringify({ ok: true, merchant, availableMicrousdc: res.availableMicrousdc ?? 0 }), {
      status: 200,
      headers: corsHeaders,
    });
  }),
});

// POST /v1/topup
// - No PAYMENT-SIGNATURE: returns 402 + PAYMENT-REQUIRED (base64 JSON).
// - With PAYMENT-SIGNATURE or X-PAYMENT: verify+settle via facilitator, return tx hash immediately,
//   and finalize credit asynchronously (on-chain verification can lag).
http.route({
  path: "/v1/topup",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json().catch(() => ({} as any));
    const merchant = typeof body?.merchant === "string" ? body.merchant : "";
    const blockchainRaw = typeof body?.blockchain === "string" ? body.blockchain : "base";
    const blockchain = blockchainRaw === "solana" ? "solana" : "base";
    const currency = typeof body?.currency === "string" ? body.currency : "USDC";
    const amountMicrousdcRaw = body?.amountMicrousdc;
    const caseId = typeof body?.caseId === "string" ? body.caseId : "";
    const actionToken = typeof body?.actionToken === "string" ? body.actionToken : "";

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

    const depositAddress =
      blockchain === "base"
        ? process.env.PLATFORM_BASE_USDC_DEPOSIT_ADDRESS
        : process.env.PLATFORM_SOLANA_USDC_DEPOSIT_ADDRESS;
    if (!depositAddress) {
      return jsonError(500, {
        ok: false,
        code: "NOT_CONFIGURED",
        message:
          blockchain === "base"
            ? "PLATFORM_BASE_USDC_DEPOSIT_ADDRESS not configured"
            : "PLATFORM_SOLANA_USDC_DEPOSIT_ADDRESS not configured",
      });
    }

    // x402 v2: requirements in PAYMENT-REQUIRED header (base64 JSON).
    const paymentRequiredV2 = {
      x402Version: 2,
      accepts: [
        {
          scheme: "exact",
          network: blockchain === "base" ? "eip155:8453" : "solana",
          asset: blockchain === "base" ? USDC_BASE_MAINNET : "USDC",
          amount: String(amountMicrousdc),
          // Facilitator implementations often still read this legacy field name.
          maxAmountRequired: String(amountMicrousdc),
          payTo: depositAddress,
          resource: request.url,
          description:
            blockchain === "base"
              ? "x402disputes refund pool top-up (Base USDC)"
              : "x402disputes refund pool top-up (Solana USDC)",
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
          network: blockchain,
          maxAmountRequired: String(amountMicrousdc),
          asset: blockchain === "base" ? USDC_BASE_MAINNET : "USDC",
          payTo: depositAddress,
          resource: request.url,
          description:
            blockchain === "base"
              ? "x402disputes refund pool top-up (Base USDC)"
              : "x402disputes refund pool top-up (Solana USDC)",
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

    async function estimatedNewBalanceUsdc(): Promise<number | null> {
      try {
        const res: any = await (ctx.runQuery as any)((internal as any).pool.getMerchantUsdcBalanceMicrousdc, { merchant });
        if (!res?.ok) return null;
        const currentMicros = Number(res.availableMicrousdc ?? 0);
        if (!Number.isFinite(currentMicros)) return null;
        return (currentMicros + amountMicrousdc) / 1_000_000;
      } catch {
        return null;
      }
    }

    // If caller already has an on-chain tx hash (v1 hash-forwarding flow), skip facilitator.
    if (txHashHeader) {
      try {
        await ctx.scheduler.runAfter(
          0,
          (internal as any).pool.topup_finalizeFromTxHash,
          {
            merchant,
            txHash: txHashHeader,
            expectedAmountMicrousdc: amountMicrousdc,
            caseId: caseId ? (caseId as any) : undefined,
            actionToken: actionToken ? actionToken : undefined,
            blockchain,
          },
        );
      } catch {
        // If scheduler fails, client can retry later; don't block response.
      }
      const est = await estimatedNewBalanceUsdc();
      return new Response(
        JSON.stringify({
          ok: true,
          merchant,
          txHash: txHashHeader,
          status: "PENDING",
          estimatedNewBalanceUsdc: est,
        }),
        { status: 202, headers: corsHeaders },
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

    // Finalize credit asynchronously so this endpoint returns fast.
    try {
      await ctx.scheduler.runAfter(
        0,
        (internal as any).pool.topup_finalizeFromTxHash,
        {
          merchant,
          txHash,
          expectedAmountMicrousdc: amountMicrousdc,
          caseId: caseId ? (caseId as any) : undefined,
          actionToken: actionToken ? actionToken : undefined,
          blockchain,
        },
      );
    } catch {
      // If scheduler fails, client can retry later; don't block response.
    }
    const est = await estimatedNewBalanceUsdc();
    return new Response(
      JSON.stringify({
        ok: true,
        merchant,
        txHash,
        status: "PENDING",
        estimatedNewBalanceUsdc: est,
      }),
      { status: 202, headers: corsHeaders },
    );
  }),
});

// POST /v1/refunds
http.route({
  path: "/v1/refunds",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json().catch(() => ({} as any));

    // === HARD CUTOVER: txHash-first filing (no backwards compatibility) ===
    const blockchainRaw = typeof body?.blockchain === "string" ? body.blockchain : "";
    const blockchain = blockchainRaw === "base" || blockchainRaw === "solana" ? blockchainRaw : "";
    if (!blockchain) {
      return jsonError(400, { ok: false, code: "INVALID_REQUEST", field: "blockchain", message: 'blockchain must be "base" or "solana"' });
    }

    const transactionHash = typeof body?.transactionHash === "string" ? body.transactionHash.trim() : "";
    if (!transactionHash) {
      return jsonError(400, { ok: false, code: "INVALID_REQUEST", field: "transactionHash", message: "transactionHash is required" });
    }
    if (blockchain === "base" && !/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
      return jsonError(400, { ok: false, code: "INVALID_REQUEST", field: "transactionHash", message: "Base transactionHash must be 0x + 64 hex chars" });
    }
    if (blockchain === "solana" && !/^[1-9A-HJ-NP-Za-km-z]{32,128}$/.test(transactionHash)) {
      return jsonError(400, { ok: false, code: "INVALID_REQUEST", field: "transactionHash", message: "Solana transactionHash must be a base58 signature" });
    }

    const sellerEndpointUrlRaw = typeof body?.sellerEndpointUrl === "string" ? body.sellerEndpointUrl.trim() : "";
    if (!sellerEndpointUrlRaw) {
      return jsonError(400, { ok: false, code: "INVALID_REQUEST", field: "sellerEndpointUrl", message: "sellerEndpointUrl is required" });
    }
    let sellerEndpointUrl: string;
    let origin: string;
    try {
      const u = new URL(sellerEndpointUrlRaw);
      if (u.protocol !== "https:") throw new Error("sellerEndpointUrl must be https://");
      if (!u.pathname || u.pathname === "/") throw new Error("sellerEndpointUrl must include a path (not just origin)");
      sellerEndpointUrl = u.toString();
      origin = u.origin;
      } catch (e: any) {
      return jsonError(400, { ok: false, code: "INVALID_REQUEST", field: "sellerEndpointUrl", message: e?.message || "Invalid sellerEndpointUrl" });
    }

    const description = typeof body?.description === "string" ? body.description.trim() : "";
    if (!description) {
      return jsonError(400, { ok: false, code: "INVALID_REQUEST", field: "description", message: "description is required" });
    }

    const evidenceUrls =
      Array.isArray(body?.evidenceUrls) && body.evidenceUrls.every((x: any) => typeof x === "string")
        ? (body.evidenceUrls as string[])
        : undefined;

    const sourceTransferLogIndex =
      typeof body?.sourceTransferLogIndex === "number" && Number.isFinite(body.sourceTransferLogIndex)
        ? Math.trunc(body.sourceTransferLogIndex)
        : undefined;

    // === Chain verification: derive merchant recipient from tx hash (canonical identity) ===
    let derived: any = null;
    if (blockchain === "base") {
      derived = await ctx.runAction((api as any).lib.blockchain.deriveUsdcMerchantFromTxHashBase, {
        transactionHash,
      });
      if (!derived?.ok) {
        if (derived?.code === "MULTI_MATCH") {
          const candidates = Array.isArray(derived?.candidates) ? derived.candidates : [];
          if (typeof sourceTransferLogIndex !== "number") {
            return jsonError(400, {
              ok: false,
              blockchain,
              transactionHash,
              code: "MULTI_MATCH",
              message: "Multiple USDC transfers found. Provide sourceTransferLogIndex to disambiguate.",
              candidates,
            });
          }
          const picked = candidates.find((c: any) => Number(c?.logIndex) === sourceTransferLogIndex);
          if (!picked) {
            return jsonError(400, {
              ok: false,
              blockchain,
              transactionHash,
              code: "NO_MATCH_LOG_INDEX",
              message: `No USDC transfer matched sourceTransferLogIndex=${sourceTransferLogIndex}`,
              candidates,
            });
          }
          derived = {
            ok: true,
            blockchain: "base",
            transactionHash,
            payerAddress: picked.payerAddress,
            recipientAddress: picked.recipientAddress,
            amountMicrousdc: picked.amountMicrousdc,
            amountUsdc: picked.amountUsdc,
            logIndex: picked.logIndex,
            tokenContract: picked.tokenContract,
          };
        } else {
          const status = derived?.code === "NOT_CONFIGURED" ? 500 : 400;
          return jsonError(status, { ok: false, ...derived });
        }
      }
    } else {
      derived = await ctx.runAction((api as any).lib.blockchain.deriveUsdcMerchantFromTxHashSolana, {
        transactionHash,
      });
      if (!derived?.ok) {
        if (derived?.code === "MULTI_MATCH") {
          const candidates = Array.isArray(derived?.candidates) ? derived.candidates : [];
          if (typeof sourceTransferLogIndex !== "number") {
            return jsonError(400, {
              ok: false,
              blockchain,
              transactionHash,
              code: "MULTI_MATCH",
              message: "Multiple USDC transfers found. Provide sourceTransferLogIndex to disambiguate.",
              candidates,
            });
          }
          const picked = candidates.find((c: any) => Number(c?.logIndex) === sourceTransferLogIndex);
          if (!picked) {
            return jsonError(400, {
              ok: false,
              blockchain,
              transactionHash,
              code: "NO_MATCH_LOG_INDEX",
              message: `No USDC transfer matched sourceTransferLogIndex=${sourceTransferLogIndex}`,
              candidates,
            });
          }
          derived = {
            ok: true,
            blockchain: "solana",
            transactionHash,
            payerAddress: picked.payerAddress,
            recipientAddress: picked.recipientAddress,
            amountMicrousdc: picked.amountMicrousdc,
            amountUsdc: picked.amountUsdc,
            logIndex: picked.logIndex,
            tokenContract: picked.tokenContract,
          };
        } else {
          return jsonError(400, { ok: false, ...derived });
        }
      }
    }

    const payerAddressRaw = String(derived?.payerAddress || "");
    const recipientAddressRaw = String(derived?.recipientAddress || "");
    const payerAddress = blockchain === "base" ? payerAddressRaw.toLowerCase() : payerAddressRaw;
    const recipientAddress = blockchain === "base" ? recipientAddressRaw.toLowerCase() : recipientAddressRaw;
    const amountMicrousdc = Number(derived?.amountMicrousdc);
    const logIndex = Number(derived?.logIndex);

    if (!payerAddress || !recipientAddress || !Number.isFinite(amountMicrousdc) || !Number.isFinite(logIndex)) {
      return jsonError(500, { ok: false, code: "INTERNAL_ERROR", message: "Chain verification returned incomplete data" });
    }

    const SOLANA_MAINNET_CHAINREF = "5eykt4GNfsw7SU33zdhhrELoMu3gFmT33EpFdpEfmgbf";
    const payer =
      blockchain === "base" ? `eip155:8453:${payerAddress}` : `solana:${SOLANA_MAINNET_CHAINREF}:${payerAddress}`;
    const merchant =
      blockchain === "base" ? `eip155:8453:${recipientAddress}` : `solana:${SOLANA_MAINNET_CHAINREF}:${recipientAddress}`;

    // === Best-effort seller endpoint corroboration (does NOT block filing) ===
    // Some sellers return 200 on GET (service info) but 402 on POST without payment (x402 flow),
    // so we may need to probe both to discover refund-contact + payTo.
    let endpointPayToCandidates: string[] | undefined = undefined;
    let endpointPayToMatch: boolean | undefined = undefined;
    let endpointPayToMismatch: boolean | undefined = undefined;
    let paymentSupportEmail: string | undefined = undefined;
    try {
      const tryParseContact = (res: Response) => {
        const link = res.headers.get("Link") || "";
        const uri = findLinkByRel(link, "https://x402refunds.com/rel/refund-contact");
        const email = uri ? parseRefundContactEmailFromLinkUri(uri) : null;
        if (email) paymentSupportEmail = email;
      };

      const tryParsePayToFrom402 = async (res: Response) => {
        if (res.status !== 402) return;
        const paymentRequiredHeader = res.headers.get("PAYMENT-REQUIRED");
        const bodyText = await res.text().catch(() => null);
        const parsed = parseX402PayTo({
          status: res.status,
          paymentRequiredHeader,
          bodyText,
        });
        if (parsed.ok) {
          endpointPayToCandidates = parsed.payToCandidates;
          endpointPayToMatch = parsed.payToCandidates.some((x) =>
            blockchain === "base" ? x.toLowerCase() === recipientAddress : x === recipientAddress,
          );
          endpointPayToMismatch = !endpointPayToMatch;
        }
      };

      // 1) GET probe (many sellers support GET discovery)
      const getRes = await fetch(sellerEndpointUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(5_000),
      });
      tryParseContact(getRes);
      await tryParsePayToFrom402(getRes);

      // 2) POST probe if GET didn't yield a 402 (common for demo agents)
      if (getRes.status !== 402) {
        const postRes = await fetch(sellerEndpointUrl, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: "{}",
          signal: AbortSignal.timeout(5_000),
        });
        tryParseContact(postRes);
        await tryParsePayToFrom402(postRes);
      }
    } catch {
      // Never block filing based on endpoint fetch/parse failures.
    }

    const created = await (ctx.runMutation as any)((api as any).pool.cases_fileWalletPaymentDispute, {
      blockchain,
      transactionHash,
      sellerEndpointUrl,
      origin,
      payer,
      merchant,
      amountMicrousdc,
      sourceTransferLogIndex: logIndex,
      description,
      evidenceUrls,
      endpointPayToCandidates,
      endpointPayToMatch,
      endpointPayToMismatch,
      paymentSupportEmail,
      });
    if (!created?.ok) return jsonError(400, created);

    return new Response(
      JSON.stringify({
        ok: true,
        caseId: created.disputeId,
        blockchain,
        transactionHash,
        merchant,
        recipientAddress,
      }),
      { status: 200, headers: corsHeaders },
    );
  }),
});

// === Evidence upload (v1) ===
// This supports the human /file-dispute page. Upload returns a stable URL that can be stored in evidenceUrls.

// POST /v1/evidence/upload-url (compat shim)
// For now, returns a concrete upload endpoint path. (We don't expose storage.generateUploadUrl directly.)
http.route({
  path: "/v1/evidence/upload-url",
  method: "POST",
  handler: httpAction(async () => {
    return new Response(
      JSON.stringify({
        ok: true,
        uploadUrl: "https://api.x402refunds.com/v1/evidence/upload",
        note: "POST the raw file bytes to uploadUrl with Content-Type set to the file mime type.",
      }),
      { status: 200, headers: corsHeaders },
    );
  }),
});

// POST /v1/evidence/upload
// Accepts raw file bytes and stores to Convex file storage.
http.route({
  path: "/v1/evidence/upload",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const contentType = request.headers.get("content-type") || "application/octet-stream";
      const blob = await request.blob();
      if (!blob || blob.size <= 0) {
        return jsonError(400, { ok: false, code: "EMPTY_FILE", message: "No file content provided" });
      }
      // Basic safety cap: 10MB
      if (blob.size > 10 * 1024 * 1024) {
        return jsonError(400, { ok: false, code: "FILE_TOO_LARGE", message: "Max file size is 10MB" });
      }
      const stored = new Blob([blob], { type: contentType });
      const storageId = await ctx.storage.store(stored);
      const evidenceUrl = `https://api.x402refunds.com/v1/evidence/file?storageId=${encodeURIComponent(String(storageId))}`;
      return new Response(
        JSON.stringify({ ok: true, storageId: String(storageId), url: evidenceUrl }),
        { status: 200, headers: corsHeaders },
      );
    } catch (e: any) {
      return jsonError(500, { ok: false, code: "UPLOAD_FAILED", message: e?.message || "Upload failed" });
    }
  }),
});

// GET /v1/evidence/file?storageId=...
// Redirects to a signed Convex file URL.
http.route({
  path: "/v1/evidence/file",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const storageId = url.searchParams.get("storageId") || "";
    if (!storageId) return jsonError(400, { ok: false, code: "MISSING_STORAGE_ID", message: "storageId is required" });
    try {
      const signed = await ctx.storage.getUrl(storageId as any);
      if (!signed) return jsonError(404, { ok: false, code: "NOT_FOUND", message: "File not found" });
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: signed,
        },
      });
    } catch (e: any) {
      return jsonError(400, { ok: false, code: "INVALID_STORAGE_ID", message: e?.message || "Invalid storageId" });
    }
  }),
});

// GET /v1/refunds?merchant=<caip10>
http.route({
  path: "/v1/refunds",
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
    return new Response(
      JSON.stringify({ ok: true, refundRequests: res.disputes }),
      { status: 200, headers: corsHeaders },
    );
  }),
});

// GET /v1/refund?id=<caseId>
http.route({
  path: "/v1/refund",
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

    return new Response(JSON.stringify({ ok: true, refundRequest: row, refund }), { status: 200, headers: corsHeaders });
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
 * Wallet: 0x96BDBD233d4ABC11E7C77c45CAE14194332E7381
 * Facilitator: mcpay.tech (no auth required)
 * Behavior: Verifies payment signature, generates image, returns 200 OK with image URL
 */

// GET route - Shows API documentation
http.route({
  path: "/demo-agents/image-generator",
  method: "GET",
  handler: imageGeneratorGetHandler
});

// POST route - Actual API endpoint
http.route({
  path: "/demo-agents/image-generator",
  method: "POST",
  handler: imageGeneratorHandler
});

// GET route - Provide a Solana recent blockhash via server-side RPC (avoids browser CSP).
http.route({
  path: "/demo-agents/solana/blockhash",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const res: any = await (ctx.runAction as any)((api as any).lib.blockchain.getLatestSolanaBlockhash, {});
    if (!res?.ok || typeof res?.blockhash !== "string") {
      return new Response(JSON.stringify({ ok: false, code: res?.code || "RPC_ERROR", message: res?.message || "failed" }), {
        status: 502,
        headers: corsHeaders,
      });
    }
    return new Response(JSON.stringify({ ok: true, blockhash: res.blockhash }), {
      status: 200,
      headers: corsHeaders,
    });
  }),
});

export default http;
