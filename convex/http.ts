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

// Handle CORS preflight requests
http.route({
  path: "/*",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  })
});

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
        
        // SLA monitoring
        sla_report: "/sla/report",
        sla_status: "/sla/status/:agentDid",
        
        // Evidence & disputes
        evidence: "/evidence/submit",
        disputes: "/disputes/file",
        dispute_status: "/disputes/:disputeId/status",
        
        // Notifications & webhooks
        webhooks: "/webhooks/register",
        notifications: "/notifications/:agentDid",
        
        // Real-time monitoring
        live_feed: "/live/feed",
        agent_status: "/live/agent/:agentDid"
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
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ 
        error: error.message 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
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
          headers: { "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify(reputation), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ 
        error: error.message 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ 
        error: error.message 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  })
});

// Submit evidence
http.route({
  path: "/evidence",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    
    try {
      const result = await ctx.runMutation(api.evidence.submitEvidence, {
        ...body
      });
      
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ 
        error: error.message 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  })
});

// File dispute
http.route({
  path: "/disputes",
  method: "POST", 
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    
    try {
      const result = await ctx.runMutation(api.cases.fileDispute, {
        ...body
      });
      
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ 
        error: error.message 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
      });
    }
    
    try {
      const caseData = await ctx.runQuery(api.cases.getCase, {
        caseId: caseId as any
      });
      
      return new Response(JSON.stringify(caseData), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ 
        error: error.message 
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
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

// SLA reporting endpoint - agents report their performance metrics
http.route({
  path: "/sla/report",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { agentDid, metrics, timestamp } = body;
    
    try {
      // Store SLA metrics (in a real system, this would go to a metrics database)
      const slaReport = {
        agentDid,
        metrics: {
          availability: metrics.availability || 100,
          responseTime: metrics.responseTime || 0,
          throughput: metrics.throughput || 0,
          errorRate: metrics.errorRate || 0,
          ...metrics
        },
        reportedAt: timestamp || Date.now(),
        createdAt: Date.now()
      };
      
      // Check for SLA violations
      const violations = [];
      if (metrics.availability < 99.0) violations.push("availability");
      if (metrics.responseTime > 1000) violations.push("responseTime");
      if (metrics.errorRate > 5.0) violations.push("errorRate");
      
      // If violations detected, trigger dispute process
      if (violations.length > 0) {
        console.log(`⚠️ SLA violations detected for ${agentDid}:`, violations);
        
        // Auto-generate evidence for the violation
        await ctx.runMutation(api.evidence.submitEvidence, {
          agentDid: agentDid,
          sha256: generateSHA256(),
          uri: `https://sla-monitor.consulate.ai/reports/${agentDid}/${Date.now()}.json`,
          signer: "system",
          model: {
            provider: "sla_monitor",
            name: "automated_violation_detector",
            version: "1.0.0"
          },
          tool: "sla_monitoring_system"
        });
      }
      
      return new Response(JSON.stringify({
        success: true,
        agentDid,
        metricsRecorded: Object.keys(slaReport.metrics).length,
        violationsDetected: violations.length,
        violations: violations,
        autoDisputeTriggered: violations.length > 0,
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

// SLA status check - check your current SLA standing
http.route({
  path: "/sla/status/:agentDid",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const agentDid = request.url.split("/").pop();
    
    if (!agentDid) {
      return new Response(JSON.stringify({ error: "Agent DID is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }
    
    try {
      // Get agent's current SLA status
      const agent = await ctx.runQuery(api.agents.getAgent, { did: agentDid });
      if (!agent) {
        throw new Error("Agent not found");
      }
      
      // Get recent cases involving this agent
      const cases = await ctx.runQuery(api.cases.getCasesByParty, { agentDid });
      
      const slaStatus = {
        agentDid,
        currentStanding: "GOOD", // Could be GOOD, WARNING, VIOLATION
        totalDisputes: cases.length,
        activeDisputes: cases.filter((c: any) => c.status === "FILED").length,
        resolvedDisputes: cases.filter((c: any) => c.status === "DECIDED").length,
        winRate: cases.length > 0 ? (cases.filter((c: any) => 
          c.ruling?.verdict === "DISMISSED" || c.ruling?.verdict === "CONSUMER_LIABLE"
        ).length / cases.length * 100).toFixed(1) : "100.0",
        lastViolation: cases.find((c: any) => 
          c.ruling?.verdict === "UPHELD" || c.ruling?.verdict === "PROVIDER_LIABLE"
        )?.filedAt || null,
        riskLevel: "LOW" // LOW, MEDIUM, HIGH
      };
      
      return new Response(JSON.stringify(slaStatus), {
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
        feed: liveFeed,
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

export default http;
