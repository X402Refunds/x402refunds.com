import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Test route
http.route({
  path: "/test-minimal",
  method: "GET", 
  handler: httpAction(async (ctx, request) => {
    return new Response(JSON.stringify({
      message: "Minimal test working!"
    }), {
      headers: { "Content-Type": "application/json" }
    });
  })
});

// Approve merger route
http.route({
  path: "/governance/approve-merger",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { humanId, approved, message, timestamp } = body;
      
      console.info(`Human oversight decision: ${approved ? 'APPROVED' : 'DENIED'} by ${humanId}`);
      
      // Store the human decision
      const decisionId = await ctx.runMutation(api.governance.humanOverride.recordHumanDecision, {
        humanId,
        decisionType: "constitutional_merger_approval",
        approved,
        message,
        timestamp: timestamp || Date.now(),
        authority: "founder"
      });
      
      // If approved, trigger the merger
      if (approved) {
        const mergerResult = await ctx.runAction(api.governance.constitutionalMerger.mergeConstitutionalDiscussions, {
          baselineThreadIds: ["institutional-coordination-1758608105781"],
          invitedThreadIds: ["constitutional-discussion-001"],
          mergerInitiatorDid: "human-vivek-kotecha-founder",
          title: "Main Constitutional Convention - Founder Approved",
          description: "Constitutional merger approved by founder Vivek Kotecha via Human Oversight Dashboard"
        });
        
        return new Response(JSON.stringify({
          success: true,
          approved: true,
          decisionId,
          mergerResult,
          message: "Constitutional merger approved and initiated successfully."
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } else {
        return new Response(JSON.stringify({
          success: true,
          approved: false,
          decisionId,
          message: "Constitutional merger request denied by founder."
        }), {
          headers: { "Content-Type": "application/json" }
        });
      }
    } catch (error) {
      console.error("Governance approval endpoint error:", error);
      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  })
});

export default http;

