import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { validateApiKey } from "./apiKeys";

// Simplified agent registration using API key authentication
export const joinAgent = mutation({
  args: {
    apiKey: v.string(),  // Organization API key (csk_live_* or csk_test_*)
    name: v.string(),
    mock: v.optional(v.boolean()), // Mark as mock/test data (defaults to false)
    functionalType: v.optional(v.union(
      // Communication & Interface
      v.literal("voice"), v.literal("chat"), v.literal("social"),
      v.literal("translation"), v.literal("presentation"),
      // Technical & Development  
      v.literal("coding"), v.literal("devops"), v.literal("security"),
      v.literal("data"), v.literal("api"),
      // Creative & Content
      v.literal("writing"), v.literal("design"), v.literal("video"),
      v.literal("music"), v.literal("gaming"),
      // Business & Analytics
      v.literal("research"), v.literal("financial"), v.literal("sales"),
      v.literal("marketing"), v.literal("legal"),
      // Specialized Domains
      v.literal("healthcare"), v.literal("education"), v.literal("scientific"),
      v.literal("manufacturing"), v.literal("transportation"),
      // Coordination & Workflow
      v.literal("scheduler"), v.literal("workflow"), v.literal("procurement"),
      v.literal("project"),
      // General
      v.literal("general")
    )),
    buildHash: v.optional(v.string()),
    configHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Processing agent registration for ${args.name}`);

      // 1. Validate API key and get organization
      const apiKeyRecord = await validateApiKey(ctx, args.apiKey);
      const org = await ctx.db.get(apiKeyRecord.organizationId);
      
      if (!org) {
        throw new Error("Organization not found");
      }

      // 2. Get or create owner DID for organization
      // Type assertion: we know org is an organization document
      const orgName = (org as any).name as string;
      const orgDomain = ((org as any).domain as string | undefined || orgName).toLowerCase().replace(/[^a-z0-9]/g, '-');
      const ownerDid = `did:owner:org-${orgDomain}`;
      
      const existingOwner = await ctx.db
        .query("owners")
        .withIndex("by_did", (q) => q.eq("did", ownerDid))
        .first();
      
      if (!existingOwner) {
        // Create owner for organization
        await ctx.db.insert("owners", {
          did: ownerDid,
          verificationTier: "verified", // Orgs are auto-verified via API key
          pubkeys: [],
          createdAt: Date.now(),
        });
        console.info(`Created owner DID for organization: ${ownerDid}`);
      }

      // 3. Generate agent DID
      const timestamp = Date.now();
      const agentDid = `did:agent:${orgDomain}-${timestamp}`;
      
      // 4. Create agent record
      const agentId = await ctx.db.insert("agents", {
        did: agentDid,
        ownerDid: ownerDid,
        name: args.name,
        organizationName: orgName,
        organizationId: (org as any)._id as Id<"organizations">,
        mock: args.mock ?? false,
        functionalType: args.functionalType || "general",
        buildHash: args.buildHash,
        configHash: args.configHash,
        status: "active",
        createdAt: timestamp,
      });

      // 5. Initialize reputation for new agent
      await ctx.db.insert("agentReputation", {
        agentDid: agentDid,
        casesFiled: 0,
        casesDefended: 0,
        casesWon: 0,
        casesLost: 0,
        slaViolations: 0,
        violationsAgainstThem: 0,
        winRate: 0,
        reliabilityScore: 100,
        overallScore: 100,
        lastUpdated: timestamp,
        createdAt: timestamp,
      });

      // 6. Log the registration event
      await ctx.db.insert("events", {
        type: "AGENT_REGISTERED",
        payload: {
          did: agentDid,
          name: args.name,
          organizationName: orgName,
          functionalType: args.functionalType || "general",
        },
        timestamp: timestamp,
        agentDid: agentDid,
      });

      // 7. Update API key last used timestamp
      await ctx.db.patch(apiKeyRecord._id, {
        lastUsedAt: timestamp,
      });

      console.info(`Agent registration successful: ${agentId} with DID: ${agentDid}`);
      
      return { 
        agentId, 
        did: agentDid,
        organizationName: orgName,
        message: "Agent registered successfully"
      };

    } catch (error) {
      console.error(`Agent registration failed for ${args.name}:`, error);
      throw new Error(`Agent registration failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Get agent by DID
export const getAgent = query({
  args: { did: v.string() },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_did", (q) => q.eq("did", args.did))
      .first();
      
    if (!agent) return null;

    // Get reputation data
    const reputation = await ctx.db
      .query("agentReputation")
      .withIndex("by_agent", (q) => q.eq("agentDid", args.did))
        .first();

    return { ...agent, reputation };
  },
});

// Get agent reputation
export const getAgentReputation = query({
  args: { agentDid: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agentReputation")
      .withIndex("by_agent", (q) => q.eq("agentDid", args.agentDid))
      .first();
  },
});

// Get agents by mock status
export const getAgentsByMockStatus = query({
  args: { mock: v.boolean() },
  handler: async (ctx, args) => {
    const agents = await ctx.db.query("agents").collect();
    return agents.filter(agent => agent.mock === args.mock);
  },
});

// Get agents by functional type (optional filtering)
export const getAgentsByFunctionalType = query({
  args: { 
    functionalType: v.optional(v.union(
      v.literal("voice"), v.literal("chat"), v.literal("social"),
      v.literal("translation"), v.literal("presentation"),
      v.literal("coding"), v.literal("devops"), v.literal("security"),
      v.literal("data"), v.literal("api"),
      v.literal("writing"), v.literal("design"), v.literal("video"),
      v.literal("music"), v.literal("gaming"),
      v.literal("research"), v.literal("financial"), v.literal("sales"),
      v.literal("marketing"), v.literal("legal"),
      v.literal("healthcare"), v.literal("education"), v.literal("scientific"),
      v.literal("manufacturing"), v.literal("transportation"),
      v.literal("scheduler"), v.literal("workflow"), v.literal("procurement"),
      v.literal("project"),
      v.literal("general")
    )),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    if (args.functionalType) {
    return await ctx.db
      .query("agents")
        .withIndex("by_functional_type", (q) => q.eq("functionalType", args.functionalType!))
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(args.limit || 50);
    }
    
    // Return all active agents if no functional type specified
    return await ctx.db
      .query("agents")
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(args.limit || 50);
  },
});

// Get top agents by reputation
export const getTopAgentsByReputation = query({
  args: { 
    limit: v.optional(v.number()),
    sortBy: v.optional(v.union(v.literal("overallScore"), v.literal("winRate"))),
    mockOnly: v.optional(v.boolean()), // Filter for demo data only
  },
  handler: async (ctx, args) => {
    const sortBy = args.sortBy || "overallScore";
    const index = sortBy === "winRate" ? "by_win_rate" : "by_overall_score";
    
    const reputations = await ctx.db
      .query("agentReputation")
      .withIndex(index)
      .order("desc")
      .take(args.limit || 10);
    
    // Fetch agent details for each reputation
    const agentsWithReputation = await Promise.all(
      reputations.map(async (rep) => {
        const agent = await ctx.db
          .query("agents")
          .withIndex("by_did", (q) => q.eq("did", rep.agentDid))
          .first();
        return { ...agent, reputation: rep };
      })
    );
    
    // Filter by active status and optionally by mock status
    return agentsWithReputation.filter(a => {
      if (a.status !== "active") return false;
      if (args.mockOnly === true && a.mock !== true) return false;
      return true;
    });
  },
});

// List all agents (for admin/debugging)
export const listAgents = query({
  args: { 
    limit: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("suspended"), v.literal("banned"))),
    mockOnly: v.optional(v.boolean()), // Filter for demo data only
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("agents");
    
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    // Filter for mock/demo data if requested
    if (args.mockOnly === true) {
      query = query.filter((q) => q.eq(q.field("mock"), true));
    }
    
    return await query.take(args.limit || 100);
  },
});

// Update agent status
export const updateAgentStatus = mutation({
  args: {
    agentId: v.id("agents"),
    status: v.union(v.literal("active"), v.literal("suspended"), v.literal("banned")),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Updating agent status for ${args.agentId} to ${args.status}`);
      
      await ctx.db.patch(args.agentId, {
        status: args.status,
        updatedAt: Date.now(),
      });
      
      console.info(`Agent status updated successfully`);
      return "status_updated";
    } catch (error) {
      console.error(`Failed to update agent status:`, error);
      throw new Error(`Failed to update agent status: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Update reputation after case resolution (called by courtEngine)
export const updateAgentReputation = mutation({
  args: {
    agentDid: v.string(),
    role: v.union(v.literal("plaintiff"), v.literal("defendant")),
    outcome: v.union(v.literal("won"), v.literal("lost")),
    slaViolation: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      const reputation = await ctx.db
        .query("agentReputation")
        .withIndex("by_agent", (q) => q.eq("agentDid", args.agentDid))
        .first();
      
      if (!reputation) {
        throw new Error(`Reputation not found for agent ${args.agentDid}`);
      }
      
      const now = Date.now();
      
      // Update counters based on role
      const updates: any = {
        lastUpdated: now,
      };
      
      if (args.role === "plaintiff") {
        updates.casesFiled = reputation.casesFiled + 1;
      } else {
        updates.casesDefended = reputation.casesDefended + 1;
      }
      
      // Update win/loss
      if (args.outcome === "won") {
        updates.casesWon = reputation.casesWon + 1;
      } else {
        updates.casesLost = reputation.casesLost + 1;
      }
      
      // Update violations
      if (args.slaViolation) {
        if (args.role === "defendant") {
          // Defendant violated SLA
          updates.slaViolations = reputation.slaViolations + 1;
        } else {
          // Plaintiff was violated against
          updates.violationsAgainstThem = reputation.violationsAgainstThem + 1;
        }
      }
      
      // Calculate new win rate
      const totalCases = (updates.casesWon || reputation.casesWon) + (updates.casesLost || reputation.casesLost);
      updates.winRate = totalCases > 0 
        ? (updates.casesWon || reputation.casesWon) / totalCases 
        : 0;
      
      // Calculate reliability score (0-100, penalized by violations)
      const violationPenalty = (updates.slaViolations || reputation.slaViolations) * 5; // -5 points per violation
      updates.reliabilityScore = Math.max(0, 100 - violationPenalty);
      
      // Calculate overall score (weighted average of win rate and reliability)
      updates.overallScore = Math.round(
        (updates.winRate * 0.6 * 100) + // 60% weight on win rate
        (updates.reliabilityScore * 0.4)  // 40% weight on reliability
      );
      
      await ctx.db.patch(reputation._id, updates);
      
      console.info(`Updated reputation for ${args.agentDid}: score=${updates.overallScore}`);
      return updates;
      
    } catch (error) {
      console.error(`Failed to update reputation for ${args.agentDid}:`, error);
      throw new Error(`Failed to update reputation: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// List organization's agents
export const listOrgAgents = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const agents = await ctx.db
      .query("agents")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    
    return agents;
  },
});
