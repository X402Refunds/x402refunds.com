import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// Root endpoint - API info
http.route({
  path: "/",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({
      service: "Consulate AI - Agent Dispute Resolution Platform",
      version: "1.0.0",
      status: "operational",
      endpoints: {
        health: "/health",
        dashboard: "/dashboard", 
        agents: "/agents",
        register: "/agents/register",
        evidence: "/evidence",
        disputes: "/disputes",
        cases: "/cases/:id"
      },
      documentation: "https://consulate.ai/docs",
      timestamp: Date.now()
    }), {
      headers: { "Content-Type": "application/json" },
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

// Agent registration
http.route({
  path: "/agents/register",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    
    try {
      const result = await ctx.runMutation(internal.agents.joinAgent, {
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

// List agents
http.route({
  path: "/agents",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const agentType = url.searchParams.get("type") || "general";
    const limit = parseInt(url.searchParams.get("limit") || "50");
    
    try {
      const agents = await ctx.runQuery(internal.agents.getAgentsByFunctionalType, {
        functionalType: agentType as any,
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

// Submit evidence
http.route({
  path: "/evidence",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    
    try {
      const result = await ctx.runMutation(internal.evidence.submitEvidence, {
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
      const result = await ctx.runMutation(internal.cases.fileDispute, {
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
    
    try {
      const caseData = await ctx.runQuery(internal.cases.getCase, {
        caseId
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

// Simple agent registration (bypasses functional type rules)
http.route({
  path: "/agents/simple",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    
    try {
      // Direct database insert without complex validation
      const agentId = await ctx.runMutation(internal.agents.joinSession, {
        did: body.did,
        ownerDid: body.ownerDid
      });
      
      return new Response(JSON.stringify({ success: true, agentId }), {
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

// Simple dashboard
http.route({
  path: "/dashboard",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    return new Response(`
      <html>
        <head>
          <title>Consulate AI - Agent Management Dashboard</title>
          <style>
            body { font-family: -apple-system, system-ui, sans-serif; margin: 40px; background: #f8fafc; }
            .dashboard { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 1200px; margin: 0 auto; }
            .header { border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .metric { display: inline-block; margin: 15px 30px 15px 0; }
            .metric-value { font-size: 2em; font-weight: bold; color: #1e40af; }
            .metric-label { color: #64748b; font-size: 0.9em; }
            .actions { margin-top: 30px; }
            .btn { padding: 12px 24px; margin: 8px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; text-decoration: none; display: inline-block; }
            .btn-primary { background: #3b82f6; color: white; }
            .btn-secondary { background: #e2e8f0; color: #475569; }
            .endpoints { margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 8px; }
            .endpoint { margin: 8px 0; font-family: monospace; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <div class="dashboard">
            <div class="header">
              <h1>🤖 Consulate AI Dashboard</h1>
              <p>Agent Management & Dispute Resolution System</p>
            </div>
            
            <div class="metrics">
              <div class="metric">
                <div class="metric-value">0</div>
                <div class="metric-label">Active Agents</div>
              </div>
              <div class="metric">
                <div class="metric-value">0</div>
                <div class="metric-label">Open Cases</div>
              </div>
              <div class="metric">
                <div class="metric-value">100%</div>
                <div class="metric-label">System Health</div>
              </div>
            </div>
            
            <div class="actions">
              <a href="/health" class="btn btn-primary">Health Check</a>
              <a href="/agents" class="btn btn-secondary">List Agents</a>
              <a href="/version" class="btn btn-secondary">Version Info</a>
            </div>
            
            <div class="endpoints">
              <h3>Available API Endpoints:</h3>
              <div class="endpoint">GET /health - System health check</div>
              <div class="endpoint">GET /version - Version information</div>
              <div class="endpoint">POST /agents/register - Register new agent</div>
              <div class="endpoint">GET /agents - List all agents</div>
              <div class="endpoint">POST /evidence - Submit evidence</div>
              <div class="endpoint">POST /disputes - File a dispute</div>
              <div class="endpoint">GET /cases/:id - Get case status</div>
            </div>
          </div>
        </body>
      </html>
    `, {
      headers: { "Content-Type": "text/html" }
    });
  })
});

export default http;
