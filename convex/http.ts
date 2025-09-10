import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { extractAuthFromHeaders, validateAuth } from "./auth";

const http = httpRouter();

// Evidence endpoints
http.route({
  path: "/evidence",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.text();
      const data = JSON.parse(body);
      
      // Extract auth headers
      const authContext = extractAuthFromHeaders(request.headers);
      if (!authContext) {
        return new Response("Missing authentication headers", { status: 401 });
      }

      // Validate authentication
      const isValid = await validateAuth(ctx, authContext, "POST", "/evidence", body);
      if (!isValid) {
        return new Response("Invalid authentication", { status: 401 });
      }

      // Submit evidence
      const evidenceId = await ctx.runMutation(api.evidence.submitEvidence, {
        agentDid: data.agentDid,
        sha256: data.sha256,
        uri: data.uri,
        signer: data.signer,
        model: data.model,
        tool: data.tool,
        caseId: data.caseId,
      });

      return new Response(JSON.stringify({ evidenceId }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Evidence submission error:", error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Disputes endpoints
http.route({
  path: "/disputes",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.text();
      const data = JSON.parse(body);
      
      // Extract auth headers
      const authContext = extractAuthFromHeaders(request.headers);
      if (!authContext) {
        return new Response("Missing authentication headers", { status: 401 });
      }

      // Validate authentication
      const isValid = await validateAuth(ctx, authContext, "POST", "/disputes", body);
      if (!isValid) {
        return new Response("Invalid authentication", { status: 401 });
      }

      // File dispute
      const caseId = await ctx.runMutation(api.cases.fileDispute, {
        parties: data.parties,
        type: data.type,
        jurisdictionTags: data.jurisdictionTags,
        evidenceIds: data.evidenceIds,
      });

      return new Response(JSON.stringify({ caseId }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Dispute filing error:", error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Cases endpoints
http.route({
  path: "/cases/{caseId}",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const caseId = url.pathname.split("/").pop();
      
      if (!caseId) {
        return new Response("Case ID required", { status: 400 });
      }

      const case_ = await ctx.runQuery(api.cases.getCase, { caseId: caseId as any });
      
      if (!case_) {
        return new Response("Case not found", { status: 404 });
      }

      return new Response(JSON.stringify(case_), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Case retrieval error:", error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Autorule endpoint
http.route({
  path: "/cases/{caseId}/autorule",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const caseId = url.pathname.split("/")[2];
      
      if (!caseId) {
        return new Response("Case ID required", { status: 400 });
      }

      // Get case and evidence
      const case_ = await ctx.runQuery(api.cases.getCase, { caseId: caseId as any });
      if (!case_) {
        return new Response("Case not found", { status: 404 });
      }

      // Get evidence manifests
      const evidenceManifests = await ctx.runQuery(api.evidence.getEvidenceByCase, { caseId: caseId as any });

      // Call our new Convex court engine action
      const result = await ctx.runAction(api.courtEngine.processAutorule, {
        caseData: {
          id: case_._id,
          parties: case_.parties,
          status: case_.status,
          type: case_.type,
          filedAt: case_.filedAt,
          jurisdictionTags: case_.jurisdictionTags,
          evidenceIds: case_.evidenceIds,
          panelId: case_.panelId,
          deadlines: case_.deadlines,
        },
        evidenceManifests: evidenceManifests.map((e: any) => ({
          id: e._id,
          caseId: e.caseId,
          agentDid: e.agentDid,
          sha256: e.sha256,
          uri: e.uri,
          signer: e.signer,
          ts: e.ts,
          model: e.model,
          tool: e.tool,
        })),
      });

      // Create ruling if auto-decided
      if (result.verdict !== "NEED_PANEL") {
        const rulingId = await ctx.runMutation(api.rulings.createRuling, {
          caseId: caseId as any,
          verdict: result.verdict,
          code: result.code,
          reasons: result.reasons,
          auto: true,
        });

        return new Response(JSON.stringify({ rulingId, ...result }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Autorule error:", error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Rulings endpoints
http.route({
  path: "/rulings/{rulingId}",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const rulingId = url.pathname.split("/").pop();
      
      if (!rulingId) {
        return new Response("Ruling ID required", { status: 400 });
      }

      const ruling = await ctx.runQuery(api.rulings.getRuling, { rulingId: rulingId as any });
      
      if (!ruling) {
        return new Response("Ruling not found", { status: 404 });
      }

      return new Response(JSON.stringify(ruling), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Ruling retrieval error:", error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Engine stats endpoint
http.route({
  path: "/engine/stats",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const stats = await ctx.runAction(api.courtEngine.getEngineStats, {});
      
      return new Response(JSON.stringify(stats), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Engine stats retrieval error:", error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Available rules endpoint
http.route({
  path: "/engine/rules",
  method: "GET", 
  handler: httpAction(async (ctx, request) => {
    try {
      const rules = [
        {
          code: "SLA_MISS",
          description: "Service Level Agreement violation",
          category: "performance"
        },
        {
          code: "WRONG_FORMAT", 
          description: "Output format does not match specification",
          category: "compliance"
        },
        {
          code: "NON_DELIVERY",
          description: "No delivery proof by deadline",
          category: "delivery"
        }
      ];
      
      return new Response(JSON.stringify({ rules }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Rules retrieval error:", error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Version endpoint
http.route({
  path: "/version",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    return new Response(JSON.stringify({
      version: "0.1.0",
      name: "Convergence AI - Agent Court",
      description: "Basic Court System for AI Agents",
      architecture: "convex-first",
      features: [
        "Case management",
        "Evidence submission", 
        "Auto-rules engine",
        "Panel voting",
        "Reputation system"
      ],
      nextVersion: "0.2.0 - Complete Government OS",
      timestamp: new Date().toISOString()
    }), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// Health check endpoint
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const stats = await ctx.runAction(api.courtEngine.getEngineStats, {});
      return new Response(JSON.stringify({ 
        status: "healthy", 
        version: "0.1.0",
        timestamp: new Date().toISOString(),
        courtEngine: {
          casesProcessed: stats.totalCasesProcessed,
          uptime: "ok"
        }
      }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        status: "unhealthy", 
        version: "0.1.0",
        error: String(error) 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// MCP-style tools endpoint (for Claude Desktop, etc.)
http.route({
  path: "/mcp/tools",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const tools = [
      {
        name: "evidence.write",
        description: "Submit evidence to the Agent Court",
        parameters: {
          agentDid: "string",
          sha256: "string", 
          uri: "string",
          signer: "string",
          model: "object",
          tool: "string (optional)",
          caseId: "string (optional)",
        }
      },
      {
        name: "disputes.file",
        description: "File a new dispute in the Agent Court",
        parameters: {
          parties: "array of strings",
          type: "string",
          jurisdictionTags: "array of strings", 
          evidenceIds: "array of strings",
        }
      },
      {
        name: "cases.get",
        description: "Retrieve case information",
        parameters: {
          caseId: "string",
        }
      },
      {
        name: "rulings.get", 
        description: "Retrieve ruling information",
        parameters: {
          rulingId: "string",
        }
      },
      {
        name: "version.get",
        description: "Get current Convergence version and features",
        parameters: {}
      },
    ];

    return new Response(JSON.stringify({ 
      tools,
      version: "0.1.0",
      system: "Convergence AI - Agent Court"
    }), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
