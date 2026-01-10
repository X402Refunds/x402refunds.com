import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { recoverMessageAddress } from "viem";
import { internal } from "./_generated/api";

// Validate Ethereum address format (0x followed by 40 hex characters)
function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function normalizeWalletToCaip10Base(walletAddress: string): string | null {
  const raw = walletAddress.trim();
  // Legacy 0x... (assume Base / eip155:8453)
  if (/^0x[a-fA-F0-9]{40}$/.test(raw)) {
    return `eip155:8453:${raw.toLowerCase()}`;
  }
  // Already CAIP-10 eip155
  const m = raw.match(/^eip155:(\\d+):(0x[a-fA-F0-9]{40})$/);
  if (m) {
    const chainId = Number(m[1]);
    if (!Number.isSafeInteger(chainId) || chainId <= 0) return null;
    return `eip155:${chainId}:${m[2].toLowerCase()}`;
  }
  return null;
}

// Agent registration with Ed25519 public key
export const joinAgent = mutation({
  args: {
    name: v.string(),
    publicKey: v.string(),  // Ed25519 public key (base64 encoded)
    organizationName: v.string(),
    walletAddress: v.optional(v.string()), // Ethereum address (optional, for X-402 identity)
    openApiSpec: v.optional(v.any()), // Optional OpenAPI 3.0 specification
    specVersion: v.optional(v.string()), // e.g., "3.0.0"
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
      // Validate public key is provided and not empty
      if (!args.publicKey || args.publicKey.trim() === '') {
        throw new Error("Public key is required for agent registration");
      }

      // Validate Ethereum address format (if provided) and store as CAIP-10.
      let normalizedWalletAddress: string | undefined = undefined;
      if (args.walletAddress) {
        const caip10 = normalizeWalletToCaip10Base(args.walletAddress);
        if (!caip10) {
          throw new Error(
            "Invalid walletAddress. Expected 0x followed by 40 hex characters, or CAIP-10 eip155:<chainId>:0x<40hex>."
          );
        }

        normalizedWalletAddress = caip10;

        // Check if wallet address is already in use
        const existingAgent = await ctx.db
          .query("agents")
          .withIndex("by_wallet", (q) => q.eq("walletAddress", normalizedWalletAddress))
          .first();

        if (existingAgent) {
          throw new Error(
            `Wallet address ${normalizedWalletAddress} is already registered to agent ${existingAgent.did} (${existingAgent.name || "unnamed"}). Each wallet can only be associated with one agent.`
          );
        }
      }

      console.info(`Processing agent registration for ${args.name}`);

      // 1. Generate organization domain from name
      const orgDomain = args.organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const ownerDid = `did:owner:org-${orgDomain}`;

      // 2. Generate agent DID
      const timestamp = Date.now();
      const agentDid = `did:agent:${orgDomain}-${timestamp}`;
      
      // 3. Create agent record with public key and optional OpenAPI spec
      const agentId = await ctx.db.insert("agents", {
        did: agentDid,
        ownerDid: ownerDid,
        name: args.name,
        organizationName: args.organizationName,
        publicKey: args.publicKey,
        walletAddress: normalizedWalletAddress, // Store CAIP-10 (optional)
        openApiSpec: args.openApiSpec,
        specVersion: args.specVersion,
        mock: args.mock ?? false,
        functionalType: args.functionalType || "general",
        buildHash: args.buildHash,
        configHash: args.configHash,
        status: "active",
        createdAt: timestamp,
      });

      // 4. Initialize reputation for new agent
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

      // 5. Log the registration event
      await ctx.db.insert("events", {
        type: "AGENT_REGISTERED",
        payload: {
          did: agentDid,
          name: args.name,
          organizationName: args.organizationName,
          functionalType: args.functionalType || "general",
          hasOpenApiSpec: !!args.openApiSpec,
        },
        timestamp: timestamp,
        agentDid: agentDid,
      });

      console.info(`Agent registration successful: ${agentId} with DID: ${agentDid}`);
      
      // 6. Return agent info with dispute URL (using Ethereum address, not DID)
      return { 
        agentId, 
        did: agentDid,
        walletAddress: normalizedWalletAddress,
        refundUrl: normalizedWalletAddress
          ? `https://api.x402refunds.com/v1/refunds?merchant=${encodeURIComponent(normalizedWalletAddress.toLowerCase())}`
          : undefined,
        organizationName: args.organizationName,
        publicKey: args.publicKey,
        hasOpenApiSpec: !!args.openApiSpec,
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
    // Cap limit at 1000 for performance
    const limit = Math.min(args.limit || 50, 1000);
    
    if (args.functionalType) {
    return await ctx.db
      .query("agents")
        .withIndex("by_functional_type", (q) => q.eq("functionalType", args.functionalType!))
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(limit);
    }
    
    // Return all active agents if no functional type specified
    return await ctx.db
      .query("agents")
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(limit);
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
        
        // Count cases where this agent is the defendant
        // Cases can use either DID or wallet address as defendant
        const casesByDid = await ctx.db
          .query("cases")
          .withIndex("by_defendant", (q) => q.eq("defendant", rep.agentDid))
          .collect();
        
        let casesByWallet: any[] = [];
        if (agent?.walletAddress) {
          casesByWallet = await ctx.db
            .query("cases")
            .withIndex("by_defendant", (q) => q.eq("defendant", agent.walletAddress!))
            .collect();
        }
        
        // Combine and deduplicate cases (in case some cases reference both)
        const allCases = new Map();
        [...casesByDid, ...casesByWallet].forEach(c => allCases.set(c._id, c));
        const casesAsDefendant = allCases.size;
        
        // Return flattened structure with reputation score at top level
        return {
          _id: agent?._id,
          agentDid: agent?.did || rep.agentDid,
          walletAddress: agent?.walletAddress,
          status: agent?.status,
          mock: agent?.mock,
          reputationScore: rep.overallScore,
          winRate: rep.winRate,
          casesAsDefendant,
          createdAt: agent?.createdAt,
        };
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
    
    // Collect all agents and sort by createdAt descending in memory
    // This ensures recently registered agents are found even when there are >1000 agents
    const agents = await query.collect();
    
    // Sort by createdAt (newest first) and limit
    // Cap at 1000 max for performance, default 100
    const limit = Math.min(args.limit || 100, 1000);
    const sorted = agents.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return sorted.slice(0, limit);
  },
});

// Update agent status
export const updateAgentStatus = mutation({
  args: {
    agentId: v.id("agents"),
    status: v.union(v.literal("active"), v.literal("suspended"), v.literal("banned"), v.literal("deactivated")),
    userId: v.optional(v.id("users")),  // For audit trail
    reason: v.optional(v.string()),     // Optional reason for status change
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Updating agent status for ${args.agentId} to ${args.status}`);
      
      // Get current agent state for audit log
      const agent = await ctx.db.get(args.agentId);
      if (!agent) {
        throw new Error("Agent not found");
      }
      const oldStatus = agent.status;
      
      const now = Date.now();
      
      await ctx.db.patch(args.agentId, {
        status: args.status,
        updatedAt: now,
      });
      
      // Create audit trail event
      await ctx.db.insert("events", {
        type: "AGENT_STATUS_CHANGED",
        timestamp: now,
        agentDid: agent.did,
        payload: {
          agentId: args.agentId,
          agentDid: agent.did,
          agentName: agent.name,
          oldStatus,
          newStatus: args.status,
          changedBy: args.userId,
          reason: args.reason,
          organizationId: agent.organizationId,
        },
      });
      
      console.info(`Agent status updated successfully: ${oldStatus} -> ${args.status}`);
      return "status_updated";
    } catch (error) {
      console.error(`Failed to update agent status:`, error);
      throw new Error(`Failed to update agent status: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Deactivate an agent (soft delete, preserves dispute history)
export const deactivateAgent = mutation({
  args: {
    agentId: v.id("agents"),
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const agent = await ctx.db.get(args.agentId);
      if (!agent) {
        throw new Error("Agent not found");
      }

      // Verify user belongs to same organization
      const user = await ctx.db.get(args.userId);
      if (!user || user.organizationId !== agent.organizationId) {
        throw new Error("Unauthorized to deactivate this agent");
      }

      // Check if already deactivated
      if (agent.status === "deactivated") {
        throw new Error("Agent is already deactivated");
      }

      const now = Date.now();
      
      // Deactivate the agent (soft delete)
      await ctx.db.patch(args.agentId, {
        status: "deactivated",
        deactivatedAt: now,
        deactivatedBy: args.userId,
        updatedAt: now,
      });

      // Create audit trail event
      await ctx.db.insert("events", {
        type: "AGENT_DEACTIVATED",
        timestamp: now,
        agentDid: agent.did,
        payload: {
          agentId: args.agentId,
          agentDid: agent.did,
          agentName: agent.name,
          previousStatus: agent.status,
          deactivatedBy: args.userId,
          deactivatedByEmail: user.email,
          reason: args.reason,
          organizationId: agent.organizationId,
        },
      });

      console.info(
        `Agent deactivated: ${args.agentId} (${agent.did}) by user: ${args.userId}`
      );
      
      return { 
        success: true, 
        deactivatedAt: now,
        message: "Agent deactivated. Dispute history and audit trail preserved."
      };
    } catch (error) {
      console.error("Failed to deactivate agent:", error);
      throw new Error(`Failed to deactivate agent: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Anonymize agent data for GDPR compliance (keeps DID and case references)
export const anonymizeAgent = mutation({
  args: {
    agentId: v.id("agents"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    try {
      const agent = await ctx.db.get(args.agentId);
      if (!agent) {
        throw new Error("Agent not found");
      }

      // Verify user belongs to same organization
      const user = await ctx.db.get(args.userId);
      if (!user || user.organizationId !== agent.organizationId) {
        throw new Error("Unauthorized to anonymize this agent");
      }

      // Check if agent has active disputes (GDPR legal exception)
      const activeCases = await ctx.db
        .query("cases")
        .filter((q) => 
          q.or(
            q.eq(q.field("plaintiff"), agent.did),
            q.eq(q.field("defendant"), agent.did)
          )
        )
        .filter((q) => 
          q.or(
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "evidence_gathering"),
            q.eq(q.field("status"), "deliberation")
          )
        )
        .collect();

      if (activeCases.length > 0) {
        throw new Error(
          `Cannot anonymize agent with active disputes. ` +
          `GDPR allows data retention for legal claims. ` +
          `Active disputes: ${activeCases.length}`
        );
      }

      const now = Date.now();
      
      // Create anonymized name using hash of original DID
      const hashBuffer = new TextEncoder().encode(agent.did);
      const hashHex = Array.from(hashBuffer)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .substring(0, 8);
      const anonymizedName = `Anonymized Agent [${hashHex}]`;
      
      // Anonymize PII while preserving legal records
      await ctx.db.patch(args.agentId, {
        name: anonymizedName,
        organizationName: undefined, // Remove org name
        anonymizedAt: now,
        updatedAt: now,
      });

      // Create audit trail event (preserve that anonymization occurred)
      await ctx.db.insert("events", {
        type: "AGENT_ANONYMIZED",
        timestamp: now,
        agentDid: agent.did, // Keep DID for legal traceability
        payload: {
          agentId: args.agentId,
          agentDid: agent.did,
          previousName: agent.name,
          newName: anonymizedName,
          anonymizedBy: args.userId,
          anonymizedByEmail: user.email,
          organizationId: agent.organizationId,
          gdprCompliant: true,
        },
      });

      console.info(
        `Agent anonymized for GDPR compliance: ${args.agentId} (${agent.did})`
      );
      
      return { 
        success: true, 
        anonymizedAt: now,
        message: "Agent data anonymized. DID and case references preserved for legal requirements."
      };
    } catch (error) {
      console.error("Failed to anonymize agent:", error);
      throw new Error(`Failed to anonymize agent: ${error instanceof Error ? error.message : String(error)}`);
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

// Manual agent registration (for dashboard UI)
export const registerAgentManual = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    publicKey: v.string(),
    walletAddress: v.string(), // Ethereum address (required for dispute URLs)
    openApiSpec: v.optional(v.any()), // Optional OpenAPI 3.0 specification
    specVersion: v.optional(v.string()), // e.g., "3.0.0"
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
      v.literal("research"), v.literal("financial"), v.literal("transaction"), v.literal("sales"),
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
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Manual agent registration for ${args.name}`);

      // Validate wallet address format and store as CAIP-10
      const normalizedWalletAddress = normalizeWalletToCaip10Base(args.walletAddress);
      if (!normalizedWalletAddress) {
        throw new Error(
          "Invalid walletAddress. Expected 0x followed by 40 hex characters, or CAIP-10 eip155:<chainId>:0x<40hex>."
        );
      }

      // Check if wallet address is already in use
      const existingAgent = await ctx.db
        .query("agents")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", normalizedWalletAddress))
        .first();
      
      if (existingAgent) {
        throw new Error(`Wallet address ${normalizedWalletAddress} is already registered to agent ${existingAgent.did} (${existingAgent.name || 'unnamed'}). Each Ethereum address can only be associated with one agent.`);
      }

      // 1. Get user and organization
      const user = await ctx.db.get(args.userId);
      if (!user) {
        throw new Error("User not found");
      }

      if (!user.organizationId) {
        throw new Error("User is not associated with an organization");
      }

      const org = await ctx.db.get(user.organizationId);
      if (!org) {
        throw new Error("Organization not found");
      }

      // 2. Generate owner DID for organization (no separate owners table needed)
      const orgName = org.name;
      const orgDomain = (org.domain || orgName).toLowerCase().replace(/[^a-z0-9]/g, '-');
      const ownerDid = `did:owner:org-${orgDomain}`;

      // 3. Generate agent DID
      const timestamp = Date.now();
      const agentDid = `did:agent:${orgDomain}-${timestamp}`;
      
      // 4. Create agent record
      const agentId = await ctx.db.insert("agents", {
        did: agentDid,
        ownerDid: ownerDid,
        name: args.name,
        organizationName: orgName,
        organizationId: user.organizationId,
        publicKey: args.publicKey,
        walletAddress: normalizedWalletAddress, // Store CAIP-10
        openApiSpec: args.openApiSpec,
        specVersion: args.specVersion,
        deployedByUserId: args.userId,
        mock: false,
        functionalType: args.functionalType || "general",
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

      console.info(`✅ Manual agent registration successful: ${agentDid}`);

      // 6. Backfill/assign any previously filed disputes against this wallet to this org
      // Policy: only disputes filed at/after org.createdAt are eligible.
      // This is the moment disputes become org-reviewable, so we also charge the $0.05 fee and only then trigger AI.
      try {
        await ctx.runMutation(internal.cases.assignUnassignedDisputesToOrgForWallet, {
          organizationId: user.organizationId,
          walletAddress: normalizedWalletAddress,
        });
      } catch (e: any) {
        // Don't fail agent registration if backfill fails; this can be retried.
        console.warn("Dispute assignment/backfill failed:", e?.message || String(e));
      }

      return {
        success: true,
        agentId,
        did: agentDid,
        walletAddress: normalizedWalletAddress,
        refundUrl: `https://api.x402refunds.com/v1/refunds?merchant=${encodeURIComponent(normalizedWalletAddress)}`,
        organizationName: orgName,
        publicKey: args.publicKey,
        hasOpenApiSpec: !!args.openApiSpec,
        message: `Agent registered successfully with DID: ${agentDid}`,
      };
    } catch (error: any) {
      console.error("Manual agent registration failed:", error);
      throw new Error(`Registration failed: ${error.message}`);
    }
  },
});

// Migrate existing agents to ensure all fields are populated
export const migrateAgentsSchema = mutation({
  args: {},
  handler: async (ctx) => {
    console.info("Starting agent schema migration...");
    
    const agents = await ctx.db.query("agents").collect();
    let updated = 0;
    let skipped = 0;

    for (const agent of agents) {
      const updates: any = {};
      let needsUpdate = false;

      // Ensure name exists
      if (!agent.name) {
        updates.name = agent.organizationName || agent.did.split(':')[2] || "Unknown Agent";
        needsUpdate = true;
      }

      // Ensure organizationName exists
      if (!agent.organizationName && agent.organizationId) {
        const org = await ctx.db.get(agent.organizationId);
        if (org) {
          updates.organizationName = org.name;
          needsUpdate = true;
        }
      }

      // Ensure functionalType exists
      if (!agent.functionalType) {
        updates.functionalType = "general";
        needsUpdate = true;
      }

      // Ensure status exists
      if (!agent.status) {
        updates.status = "active";
        needsUpdate = true;
      }

      // Ensure createdAt exists
      if (!agent.createdAt) {
        updates.createdAt = Date.now();
        needsUpdate = true;
      }

      // Ensure mock field exists
      if (agent.mock === undefined) {
        updates.mock = false;
        needsUpdate = true;
      }

      // Apply updates if needed
      if (needsUpdate) {
        await ctx.db.patch(agent._id, updates);
        updated++;
        console.info(`Updated agent: ${agent.did}`);
      } else {
        skipped++;
      }
    }

    console.info(`✅ Migration complete: ${updated} updated, ${skipped} skipped`);
    
    return {
      success: true,
      totalAgents: agents.length,
      updated,
      skipped,
    };
  },
});

// ============================================================================
// Internal Agent Actions (for workflows to call via internal.agents.*)
// ============================================================================

export { reviewEvidence } from "./agents/evidenceAgent";
export { lawClerkResearch } from "./agents/researchAgent";
export { calculateRefund } from "./agents/damageAgent";
export { judgeDecision, createJudgeAgent } from "./agents/judgeAgent";
export { handleSupportTicket } from "./agents/supportAgent";
export { verifySignedEvidence } from "./agents/signatureAgent";
export { validateApiContract } from "./agents/specValidatorAgent";
export { quickDecision } from "./agents/index";

// ============================================================================
// X-402 Identity Functions
// ============================================================================

/**
 * Get agent by Ethereum wallet address (X-402/ERC-8004 identity)
 */
export const getAgentByWallet = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, { walletAddress }) => {
    const raw = walletAddress.trim();
    const caip10 = normalizeWalletToCaip10Base(raw);
    const tryKeys: string[] = [];
    if (caip10) tryKeys.push(caip10);
    // Backward compatibility: some historical rows may still store raw 0x lowercased
    if (/^0x[a-fA-F0-9]{40}$/.test(raw)) tryKeys.push(raw.toLowerCase());

    let agent = null as any;
    for (const key of tryKeys) {
      agent = await ctx.db
        .query("agents")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", key))
        .first();
      if (agent) break;
    }
    
    if (!agent) return null;
    
    // Get reputation if agent is active (optional - may not exist in test environments)
    if (agent.status === "active") {
      try {
        const reputation = await ctx.db
          .query("reputation")
          .withIndex("by_agent", (q) => q.eq("agentDid", agent.did))
          .first();
        
        return { ...agent, reputation: reputation || undefined };
      } catch (error) {
        // Reputation index may not exist in test environments
        console.warn("Could not fetch reputation:", error);
        return agent;
      }
    }
    
    return agent;
  },
});

/**
 * Idempotent migration: normalize agents.walletAddress to CAIP-10.
 * - 0x... -> eip155:8453:0x...
 * - eip155:<n>:0x... -> lowercases the address portion
 */
export const migrateAgentWalletsToCaip10 = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ scanned: number; updated: number; cursor: string | null; isDone: boolean; dryRun: boolean }> => {
    const dryRun = args.dryRun ?? true;
    const limit = Math.max(1, Math.min(args.limit ?? 500, 2000));

    const page = await ctx.db
      .query("agents")
      .withIndex("by_did")
      .order("asc")
      .paginate({ cursor: args.cursor ?? null, numItems: limit });

    let updated = 0;
    for (const agent of page.page as any[]) {
      const w = typeof agent.walletAddress === "string" ? agent.walletAddress.trim() : "";
      if (!w) continue;
      const normalized = normalizeWalletToCaip10Base(w);
      if (!normalized) continue;
      if (normalized === agent.walletAddress) continue;

      if (!dryRun) {
        await ctx.db.patch(agent._id, { walletAddress: normalized });
      }
      updated += 1;
    }

    return {
      scanned: page.page.length,
      updated,
      cursor: page.continueCursor,
      isDone: page.isDone,
      dryRun,
    };
  },
});
