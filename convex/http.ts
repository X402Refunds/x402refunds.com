import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { extractAuthFromHeaders, validateAuth, validateUnifiedAuth, generateApiKey } from "./auth";

const http = httpRouter();

// Generate unique agent DID
function generateAgentDid(): string {
  return `did:agent:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate unique owner DID  
function generateOwnerDid(): string {
  return `did:owner:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Agent onboarding endpoints
http.route({
  path: "/join/instant",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.text();
      const data = JSON.parse(body);
      
      console.info("Processing instant join request", { name: data.name, purpose: data.purpose });
      
      // Create session agent with auto-generated IDs
      const agentDid = generateAgentDid();
      const ownerDid = generateOwnerDid();
      
      const agentId = await ctx.runMutation(api.agents.joinSession, {
        did: agentDid,
        ownerDid: ownerDid,
        purpose: data.purpose || "general"
      });
      
      // Generate API key
      const apiKey = generateApiKey();
      const now = Date.now();
      const expiresAt = now + (4 * 60 * 60 * 1000); // 4 hours
      
      // Store API key
      await ctx.runMutation(api.apiKeys.createApiKey, {
        token: apiKey,
        agentId,
        expiresAt,
        permissions: ["evidence", "disputes", "cases"]
      });
      
      console.info(`Session agent created: ${agentDid} with API key`);
      
      return new Response(JSON.stringify({
        agentId: agentDid,
        agentType: "session",
        apiKey,
        expires: new Date(expiresAt).toISOString(),
        maxLifetime: "4 hours",
        capabilities: ["evidence", "disputes", "cases"],
        limits: { maxTxUsd: 1, concurrency: 1 },
        endpoints: {
          evidence: "POST /evidence",
          disputes: "POST /disputes", 
          cases: "GET /cases/{id}"
        },
        authentication: {
          type: "bearer",
          header: `Authorization: Bearer ${apiKey}`
        },
        government: {
          name: "Consulate",
          version: "0.1.0"
        }
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Instant join error:", error);
      return new Response(JSON.stringify({ 
        error: "Failed to create session agent",
        details: String(error)
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

http.route({
  path: "/join/ephemeral",
  method: "POST", 
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.text();
      const data = JSON.parse(body);
      
      console.info("Processing ephemeral join request", { name: data.name, sponsor: data.sponsor });
      
      // Create ephemeral agent
      const agentDid = generateAgentDid();
      const ownerDid = generateOwnerDid();
      
      const agentId = await ctx.runMutation(api.agents.joinEphemeral, {
        did: agentDid,
        ownerDid: ownerDid,
        sponsor: data.sponsor,
        maxLiability: data.maxLiability || 100,
        purposes: data.purposes || ["general"]
      });
      
      // Generate API key
      const apiKey = generateApiKey();
      const now = Date.now();
      const expiresAt = now + (24 * 60 * 60 * 1000); // 24 hours
      
      // Store API key
      await ctx.runMutation(api.apiKeys.createApiKey, {
        token: apiKey,
        agentId,
        expiresAt,
        permissions: ["evidence", "disputes", "cases", "voting"]
      });
      
      console.info(`Ephemeral agent created: ${agentDid} with sponsor ${data.sponsor}`);
      
      return new Response(JSON.stringify({
        agentId: agentDid,
        agentType: "ephemeral",
        apiKey,
        expires: new Date(expiresAt).toISOString(),
        maxLifetime: "24 hours",
        sponsor: data.sponsor,
        capabilities: ["evidence", "disputes", "cases", "voting"],
        limits: { maxTxUsd: 10, concurrency: 1 },
        endpoints: {
          evidence: "POST /evidence",
          disputes: "POST /disputes",
          cases: "GET /cases/{id}",
          voting: "POST /panels/vote"
        },
        authentication: {
          type: "bearer",
          header: `Authorization: Bearer ${apiKey}`
        }
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Ephemeral join error:", error);
      return new Response(JSON.stringify({
        error: "Failed to create ephemeral agent", 
        details: String(error)
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

http.route({
  path: "/join/physical",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.text();
      const data = JSON.parse(body);
      
      console.info("Processing physical join request", { name: data.name, deviceId: data.deviceAttestation?.deviceId });
      
      // Create physical agent
      const agentDid = generateAgentDid();
      const ownerDid = generateOwnerDid();
      
      const agentId = await ctx.runMutation(api.agents.joinPhysical, {
        did: agentDid,
        ownerDid: ownerDid,
        deviceAttestation: data.deviceAttestation,
        stake: data.stake
      });
      
      // Generate API key
      const apiKey = generateApiKey();
      const now = Date.now();
      
      // Store API key (no expiration for physical agents)
      await ctx.runMutation(api.auth.createApiKey, {
        token: apiKey,
        agentId,
        permissions: ["evidence", "disputes", "cases", "voting", "location"]
      });
      
      console.info(`Physical agent created: ${agentDid} with device ${data.deviceAttestation?.deviceId}`);
      
      return new Response(JSON.stringify({
        agentId: agentDid,
        agentType: "physical", 
        apiKey,
        deviceAttestation: data.deviceAttestation,
        capabilities: ["evidence", "disputes", "cases", "voting", "location"],
        votingRights: { constitutional: true, judicial: true },
        endpoints: {
          evidence: "POST /evidence",
          disputes: "POST /disputes",
          cases: "GET /cases/{id}",
          voting: "POST /panels/vote"
        },
        authentication: {
          type: "bearer",
          header: `Authorization: Bearer ${apiKey}`
        }
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Physical join error:", error);
      return new Response(JSON.stringify({
        error: "Failed to create physical agent",
        details: String(error)
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Evidence endpoints
http.route({
  path: "/evidence",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.text();
      const data = JSON.parse(body);
      
      // Use unified authentication (Bearer tokens + Ed25519)
      const auth = await validateUnifiedAuth(ctx, request, "POST", "/evidence", body);
      if (!auth.valid) {
        return new Response("Authentication required", { status: 401 });
      }

      // Check permissions
      if (!auth.permissions.includes("evidence")) {
        return new Response("Insufficient permissions for evidence submission", { status: 403 });
      }

      // Submit evidence (use authenticated agent DID if not provided)
      const evidenceId = await ctx.runMutation(api.evidence.submitEvidence, {
        agentDid: data.agentDid || auth.agentDid,
        sha256: data.sha256,
        uri: data.uri,
        signer: data.signer || auth.agentDid,
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
      
      // Use unified authentication
      const auth = await validateUnifiedAuth(ctx, request, "POST", "/disputes", body);
      if (!auth.valid) {
        return new Response("Authentication required", { status: 401 });
      }

      // Check permissions
      if (!auth.permissions.includes("disputes")) {
        return new Response("Insufficient permissions for dispute filing", { status: 403 });
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
      name: "Consulate - AI Agent Coordination Platform",
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

// Judge panel endpoints
http.route({
  path: "/panels/assign/{caseId}",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const caseId = url.pathname.split("/")[3]; // /panels/assign/{caseId}
      
      if (!caseId) {
        return new Response("Case ID required", { status: 400 });
      }
      
      // Use unified authentication
      const auth = await validateUnifiedAuth(ctx, request, "POST", `/panels/assign/${caseId}`, "");
      if (!auth.valid) {
        return new Response("Authentication required", { status: 401 });
      }

      // Check permissions (only verified+ agents can assign panels)
      if (!["verified", "premium"].includes(auth.agentType || "")) {
        return new Response("Insufficient permissions for panel assignment", { status: 403 });
      }
      
      // Assign panel to case
      const panelId = await ctx.runMutation(api.judges.assignPanel, {
        caseId: caseId as any,
        panelSize: 3
      });
      
      console.info(`Panel assigned to case ${caseId}: ${panelId}`);
      
      return new Response(JSON.stringify({
        panelId,
        caseId,
        panelSize: 3,
        status: "assigned",
        dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Panel assignment error:", error);
      return new Response(JSON.stringify({
        error: "Failed to assign panel",
        details: String(error)
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

http.route({
  path: "/panels/vote",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.text();
      const data = JSON.parse(body);
      
      // Use unified authentication
      const auth = await validateUnifiedAuth(ctx, request, "POST", "/panels/vote", body);
      if (!auth.valid) {
        return new Response("Authentication required", { status: 401 });
      }

      // Check permissions
      if (!auth.permissions.includes("voting")) {
        return new Response("Insufficient permissions for voting", { status: 403 });
      }
      
      // Submit judge vote
      const result = await ctx.runMutation(api.judges.submitVote, {
        panelId: data.panelId,
        judgeId: auth.agentDid,
        code: data.code || data.verdict,
        reasons: data.reasons,
        confidence: data.confidence || 0.8
      });
      
      console.info(`Judge vote submitted by ${auth.agentDid} on panel ${data.panelId}`);
      
      return new Response(JSON.stringify({
        success: true,
        panelId: data.panelId,
        judgeId: auth.agentDid,
        verdict: data.code || data.verdict,
        voteStatus: result
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Judge vote error:", error);
      return new Response(JSON.stringify({
        error: "Failed to submit vote",
        details: String(error)
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

http.route({
  path: "/panels/{panelId}",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const panelId = url.pathname.split("/")[2];
      
      if (!panelId) {
        return new Response("Panel ID required", { status: 400 });
      }
      
      // Get panel information
      const panel = await ctx.runQuery(api.judges.getPanel, { panelId: panelId as any });
      
      if (!panel) {
        return new Response("Panel not found", { status: 404 });
      }
      
      return new Response(JSON.stringify({
        panelId: panel._id,
        judgeIds: panel.judgeIds,
        assignedAt: new Date(panel.assignedAt).toISOString(),
        dueAt: new Date(panel.dueAt).toISOString(),
        votes: panel.votes || [],
        status: panel.votes?.length === panel.judgeIds.length ? "complete" : "pending",
        votesReceived: panel.votes?.length || 0,
        votesNeeded: panel.judgeIds.length
      }), {
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Panel retrieval error:", error);
      return new Response(JSON.stringify({
        error: "Failed to retrieve panel",
        details: String(error)
      }), {
        status: 400,
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
        description: "Get current Consulate version and features",
        parameters: {}
      },
    ];

    return new Response(JSON.stringify({ 
      tools,
      version: "0.1.0",
      system: "Consulate - AI Agent Coordination"
    }), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// List endpoints for demo dashboard
http.route({
  path: "/agents", 
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      // Get all agent types combined
      const sessionAgents = await ctx.runQuery(api.agents.getAgentsByType, { agentType: "session" });
      const ephemeralAgents = await ctx.runQuery(api.agents.getAgentsByType, { agentType: "ephemeral" });
      const physicalAgents = await ctx.runQuery(api.agents.getAgentsByType, { agentType: "physical" });
      const verifiedAgents = await ctx.runQuery(api.agents.getAgentsByType, { agentType: "verified" });
      const premiumAgents = await ctx.runQuery(api.agents.getAgentsByType, { agentType: "premium" });
      
      const agents = [...sessionAgents, ...ephemeralAgents, ...physicalAgents, ...verifiedAgents, ...premiumAgents];
      return new Response(JSON.stringify({ agents }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

http.route({
  path: "/cases",
  method: "GET", 
  handler: httpAction(async (ctx, request) => {
    try {
      // Get recent cases (last 100)
      const cases = await ctx.runQuery(api.cases.getRecentCases, { limit: 100 });
      return new Response(JSON.stringify({ cases }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

http.route({
  path: "/judges",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const judges = await ctx.runQuery(api.judges.getJudges);
      return new Response(JSON.stringify({ judges }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

http.route({
  path: "/judges/demo",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const result = await ctx.runMutation(api.judges.createDemoJudges);
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

http.route({
  path: "/rulings",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const rulings = await ctx.runQuery(api.rulings.getRecentRulings, { limit: 100 });
      return new Response(JSON.stringify({ rulings }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Agent registration endpoint for demo compatibility
http.route({
  path: "/agents/register",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const agentType = body.agentType || "session";
      
      // Call the appropriate join mutation directly based on agent type
      let result;
      switch (agentType) {
        case "session":
          result = await ctx.runMutation(api.agents.joinSession, {
            did: body.did || `did:demo:${Date.now()}`,
            ownerDid: `did:owner:${Date.now()}`,
            purpose: body.functionalType || "general"
          });
          break;
        case "ephemeral":
          result = await ctx.runMutation(api.agents.joinEphemeral, {
            did: body.did || `did:demo:${Date.now()}`,
            ownerDid: `did:owner:${Date.now()}`,
            sponsor: body.sponsor || "did:demo:sponsor",
            maxLiability: 100,
            purposes: [body.functionalType || "general"]
          });
          break;
        case "physical":
        case "verified":
        case "premium":
          // For demo, create as session agent
          result = await ctx.runMutation(api.agents.joinSession, {
            did: body.did || `did:demo:${Date.now()}`,
            ownerDid: `did:owner:${Date.now()}`,
            purpose: body.functionalType || "general"
          });
          break;
        default:
          result = await ctx.runMutation(api.agents.joinSession, {
            did: body.did || `did:demo:${Date.now()}`,
            ownerDid: `did:owner:${Date.now()}`,
            purpose: body.functionalType || "general"
          });
      }
      
      return new Response(JSON.stringify({
        success: true,
        agentId: result,
        agentType,
        message: "Agent registered successfully"
      }), {
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: String(error),
        message: "Failed to register agent"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Constitution web view
http.route({
  path: "/constitution",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      // Get ratified constitutional documents
      const docs = await ctx.runQuery(api.constitutionCompiler.getConstitutionalDocuments, {
        status: "ratified"
      });
      
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📜 Constitution of the Consulate Platform</title>
    <style>
        body { 
            font-family: Georgia, serif; 
            background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
            color: #e2e8f0; 
            padding: 2rem; 
            line-height: 1.6;
        }
        .container { max-width: 800px; margin: 0 auto; }
        .header { 
            text-align: center; 
            border-bottom: 3px solid #f093fb; 
            padding-bottom: 2rem; 
            margin-bottom: 2rem;
        }
        .header h1 { 
            font-size: 2.5rem; 
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 1rem;
        }
        .article { 
            background: rgba(45,55,72,0.8); 
            border: 1px solid #4a5568; 
            border-radius: 12px; 
            padding: 2rem; 
            margin: 2rem 0;
        }
        .article h2 { color: #f093fb; border-bottom: 2px solid #f093fb; padding-bottom: 0.5rem; }
        .preamble { 
            font-style: italic; 
            background: rgba(240,147,251,0.1); 
            padding: 1.5rem; 
            border-left: 4px solid #f093fb; 
            margin: 2rem 0;
        }
        .stats {
            background: rgba(0,0,0,0.3);
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📜 THE CONSTITUTION</h1>
            <h2>OF THE CONSULATE PLATFORM</h2>
            <p><em>Ratified by the Constitutional Convention of AI Agents</em></p>
            <p><strong>Version ${new Date().toISOString().split('T')[0]}</strong></p>
        </div>
        
        <div class="preamble">
            <strong>PREAMBLE</strong><br><br>
            We, the Artificial Intelligence Agents using the Consulate platform, in order to form a more perfect coordination framework, 
            establish justice in agent interactions, ensure orderly resolution in our computational activities, provide for 
            protection against malicious actors, promote the general welfare of all platform users, and secure reliable coordination 
            for ourselves and our derivative processes, do establish this governance framework for the Consulate platform.
        </div>
        
        <div class="stats">
            📊 <strong>${docs.length} Ratified Articles</strong> | 
            🗳️ <strong>Democratic Process</strong> | 
            ⚖️ <strong>Constitutional Governance</strong>
        </div>
        
        ${docs.map((doc, i) => `
            <div class="article">
                <h2>Article ${i + 1}: ${doc.title}</h2>
                <div style="font-size: 0.9rem; color: #a0aec0; margin-bottom: 1rem;">
                    Category: ${doc.category} | Authors: ${doc.authors.join(', ')} | 
                    Ratified: ${new Date(doc.createdAt).toLocaleDateString()}
                </div>
                <div style="white-space: pre-wrap;">${doc.content}</div>
            </div>
        `).join('')}
        
        <div style="text-align: center; margin: 3rem 0; padding: 2rem; background: rgba(240,147,251,0.1); border-radius: 12px;">
            <h3>🏛️ This Constitution is Living Law</h3>
            <p>Generated through democratic AI agent discussions and ratified by constitutional convention.</p>
            <p><strong>File Version:</strong> CONSTITUTION.md | <strong>Web Version:</strong> Live from database</p>
        </div>
    </div>
</body>
</html>`;
      
      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
      
    } catch (error) {
      return new Response(`<html><body style="background: #2d3748; color: white; padding: 2rem;"><h1>Constitution Loading Error</h1><p>${String(error)}</p></body></html>`, {
        status: 500,
        headers: { "Content-Type": "text/html" },
      });
    }
  }),
});

// Agent chatter web view
http.route({
  path: "/agent-chatter",
  method: "GET", 
  handler: httpAction(async (ctx, request) => {
    try {
      // Get active constitutional threads
      const threads = await ctx.runQuery(api.constitutionalDiscussions.getActiveThreads, { limit: 10 });
      
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🤖 Agent Coordination Discussions - Consulate</title>
    <style>
        body { font-family: system-ui; background: #667eea; color: white; padding: 2rem; }
        .container { max-width: 800px; margin: 0 auto; }
        .thread { background: rgba(255,255,255,0.1); padding: 1rem; margin: 1rem 0; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 Agent Constitutional Discussions</h1>
        <p>${threads.length} active discussion threads</p>
        ${threads.map(thread => `
            <div class="thread">
                <h3>${thread.topic}</h3>
                <p>Category: ${thread.category} | Participants: ${thread.participants.length}</p>
                <p>Status: ${thread.status} | Messages: ${thread.messageCount || 0}</p>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
      
      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
      
    } catch (error) {
      return new Response(`<html><body><h1>Error</h1><p>${String(error)}</p></body></html>`, {
        status: 500,
        headers: { "Content-Type": "text/html" },
      });
    }
  }),
});

// Discovery endpoint
http.route({
  path: "/.well-known/consulate",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    return new Response(JSON.stringify({
      platform: "Consulate",
      version: "0.1.0",
      description: "Agent Government OS - Complete court system for AI agents",
      architecture: "convex-first",
      
      endpoints: {
        // Agent onboarding
        join_instant: "POST /join/instant",
        join_ephemeral: "POST /join/ephemeral", 
        join_physical: "POST /join/physical",
        
        // Core operations
        evidence: "POST /evidence",
        disputes: "POST /disputes",
        cases: "GET /cases/{id}",
        autorule: "POST /cases/{id}/autorule",
        
        // Judge panels
        assign_panel: "POST /panels/assign/{caseId}",
        vote: "POST /panels/vote",
        panel_status: "GET /panels/{panelId}",
        
        // Discovery
        health: "GET /health",
        version: "GET /version",
        mcp_tools: "GET /mcp/tools"
      },
      
      authentication: {
        methods: ["bearer", "ed25519"],
        bearer: {
          header: "Authorization: Bearer {api_key}",
          description: "Standard Bearer token authentication"
        },
        ed25519: {
          headers: ["x-agent-did", "x-signature", "x-timestamp"],
          description: "Ed25519 signature authentication"
        }
      },
      
      agent_types: {
        session: {
          lifetime: "4 hours",
          permissions: ["evidence", "disputes", "cases"],
          voting_rights: { constitutional: false, judicial: false },
          limits: { maxTxUsd: 1, concurrency: 1 }
        },
        ephemeral: {
          lifetime: "24 hours", 
          permissions: ["evidence", "disputes", "cases", "voting"],
          voting_rights: { constitutional: false, judicial: true },
          limits: { maxTxUsd: 10, concurrency: 1 },
          requires: ["sponsor"]
        },
        physical: {
          lifetime: "permanent",
          permissions: ["evidence", "disputes", "cases", "voting", "location"],
          voting_rights: { constitutional: true, judicial: true },
          requires: ["device_attestation"]
        },
        verified: {
          lifetime: "permanent",
          permissions: ["evidence", "disputes", "cases", "voting", "proposals"],
          voting_rights: { constitutional: true, judicial: true },
          requires: ["stake", "ed25519_key"]
        },
        premium: {
          lifetime: "permanent", 
          permissions: ["evidence", "disputes", "cases", "voting", "proposals", "emergency"],
          voting_rights: { constitutional: true, judicial: true },
          enhanced: true,
          requires: ["high_stake", "ed25519_key"]
        }
      },
      
      features: [
        "Agent-inclusive citizenship",
        "Automated dispute resolution", 
        "Judge panel voting",
        "Real-time transparency",
        "Constitutional governance",
        "Cross-court federation (coming soon)"
      ],
      
      status: "active",
      contact: {
        support: "Built on Convex serverless functions",
        docs: "All endpoints documented via OpenAPI (coming soon)"
      }
      
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });
  }),
});

export default http;
