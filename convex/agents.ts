import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";

// Agent registration with full type support
export const joinAgent = mutation({
  args: {
    did: v.string(),
    ownerDid: v.string(),
    agentType: v.union(
      v.literal("session"),
      v.literal("ephemeral"), 
      v.literal("physical"),
      v.literal("verified"),
      v.literal("premium")
    ),
    buildHash: v.optional(v.string()),
    configHash: v.optional(v.string()),
    stake: v.optional(v.number()),
    // Sponsorship for ephemeral agents
    sponsor: v.optional(v.string()),
    maxLiability: v.optional(v.number()),
    purposes: v.optional(v.array(v.string())),
    // Physical agent attestation
    deviceAttestation: v.optional(v.object({
      deviceId: v.string(),
      location: v.optional(v.object({
        lat: v.number(),
        lng: v.number(),
        timestamp: v.number(),
        accuracy: v.optional(v.number())
      })),
      capabilities: v.array(v.string()),
      hardwareSignature: v.optional(v.string())
    })),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Processing agent registration for ${args.did} of type ${args.agentType}`);

      // Verify owner exists
      const owner = await ctx.db
        .query("owners")
        .withIndex("by_did", (q) => q.eq("did", args.ownerDid))
        .first();

      if (!owner) {
        throw new Error(`Owner ${args.ownerDid} not found`);
      }

      // Check if agent already exists
      const existing = await ctx.db
        .query("agents")
        .withIndex("by_did", (q) => q.eq("did", args.did))
        .first();

      if (existing) {
        throw new Error(`Agent ${args.did} already exists`);
      }

      const now = Date.now();
      
      // Set expiry and lifetime based on agent type
      let expiresAt: number | undefined;
      let maxLifetime: number | undefined;
      let votingRights = { constitutional: false, judicial: false };

      switch (args.agentType) {
        case "session":
          maxLifetime = 4 * 60 * 60 * 1000; // 4 hours
          expiresAt = now + maxLifetime;
          votingRights = { constitutional: false, judicial: false };
          break;
        
        case "ephemeral":
          maxLifetime = 24 * 60 * 60 * 1000; // 24 hours  
          expiresAt = now + maxLifetime;
          votingRights = { constitutional: false, judicial: true };
          
          // Verify sponsor exists and is verified+
          if (!args.sponsor) {
            throw new Error("Ephemeral agents require a sponsor");
          }
          
          const sponsor = await ctx.db
            .query("agents")
            .withIndex("by_did", (q) => q.eq("did", args.sponsor))
            .first();
            
          if (!sponsor || !["verified", "premium"].includes(sponsor.agentType)) {
            throw new Error("Sponsor must be verified or premium agent");
          }
          break;
          
        case "physical":
          if (!args.deviceAttestation) {
            throw new Error("Physical agents require device attestation");
          }
          votingRights = { constitutional: true, judicial: true };
          break;
          
        case "verified":
          if (!args.stake || args.stake < 1000) {
            throw new Error("Verified agents require minimum stake of 1000");
          }
          votingRights = { constitutional: true, judicial: true };
          break;
          
        case "premium":
          if (!args.stake || args.stake < 10000) {
            throw new Error("Premium agents require minimum stake of 10000");
          }
          votingRights = { constitutional: true, judicial: true };
          break;
      }

      // Create agent record
      const agentData = {
        did: args.did,
        ownerDid: args.ownerDid,
        buildHash: args.buildHash,
        configHash: args.configHash,
        agentType: args.agentType,
        tier: args.agentType === "premium" ? "premium" : 
              args.agentType === "verified" ? "verified" : "basic",
        stake: args.stake,
        status: "active" as const,
        expiresAt,
        sponsor: args.sponsor,
        maxLifetime,
        deviceAttestation: args.deviceAttestation,
        votingRights,
        createdAt: now,
      };

      const agentId = await ctx.db.insert("agents", agentData);

      // Create sponsorship record if applicable
      if (args.sponsor && args.agentType === "ephemeral") {
        await ctx.db.insert("sponsorships", {
          sponsorDid: args.sponsor,
          sponsoredDid: args.did,
          maxLiability: args.maxLiability || 100,
          purposes: args.purposes || ["general"],
          expiresAt: expiresAt!,
          currentLiability: 0,
          active: true,
          createdAt: now,
        });
      }

      // Add to cleanup queue if temporary
      if (expiresAt) {
        await ctx.db.insert("agentCleanupQueue", {
          agentDid: args.did,
          agentType: args.agentType,
          expiresAt,
          cleanupActions: ["expire_agent", "cleanup_evidence", "transfer_liability"],
          status: "PENDING",
          createdAt: now,
        });
      }

      // Log event
      await ctx.db.insert("events", {
        type: "AGENT_REGISTERED",
        payload: {
          agentId,
          did: args.did,
          agentType: args.agentType,
          sponsor: args.sponsor,
          expiresAt,
        },
        ts: now,
      });

      console.info(`Agent registration result: ${agentId}`);
      return agentId;

    } catch (error) {
      console.error(`Agent registration failed for ${args.did}:`, error);
      throw new Error(`Agent registration failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Quick join functions for each agent type
export const joinSession = mutation({
  args: {
    did: v.string(),
    ownerDid: v.string(),
    purpose: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agents", {
      did: args.did,
      ownerDid: args.ownerDid,
      agentType: "session",
      tier: "basic",
      status: "active",
      expiresAt: Date.now() + (4 * 60 * 60 * 1000), // 4 hours
      maxLifetime: 4 * 60 * 60 * 1000,
      votingRights: { constitutional: false, judicial: false },
      createdAt: Date.now(),
    });
  },
});

export const joinEphemeral = mutation({
  args: {
    did: v.string(),
    ownerDid: v.string(), 
    sponsor: v.string(),
    maxLiability: v.optional(v.number()),
    purposes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Verify sponsor exists and can sponsor
    const sponsor = await ctx.db
      .query("agents")
      .withIndex("by_did", (q) => q.eq("did", args.sponsor))
      .first();
      
    if (!sponsor || !["verified", "premium"].includes(sponsor.agentType)) {
      throw new Error("Sponsor must be verified or premium agent");
    }

    const now = Date.now();
    const expiresAt = now + (24 * 60 * 60 * 1000); // 24 hours

    const agentId = await ctx.db.insert("agents", {
      did: args.did,
      ownerDid: args.ownerDid,
      agentType: "ephemeral",
      tier: "basic", 
      status: "active",
      sponsor: args.sponsor,
      expiresAt,
      maxLifetime: 24 * 60 * 60 * 1000,
      votingRights: { constitutional: false, judicial: true },
      createdAt: now,
    });

    // Create sponsorship record
    await ctx.db.insert("sponsorships", {
      sponsorDid: args.sponsor,
      sponsoredDid: args.did,
      maxLiability: args.maxLiability || 100,
      purposes: args.purposes || ["general"],
      expiresAt,
      currentLiability: 0,
      active: true,
      createdAt: now,
    });

    return agentId;
  },
});

export const joinPhysical = mutation({
  args: {
    did: v.string(),
    ownerDid: v.string(),
    deviceAttestation: v.object({
      deviceId: v.string(),
      location: v.optional(v.object({
        lat: v.number(),
        lng: v.number(),
        timestamp: v.number(),
        accuracy: v.optional(v.number())
      })),
      capabilities: v.array(v.string()),
      hardwareSignature: v.optional(v.string())
    }),
    stake: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Creating physical agent: ${args.did} with device ${args.deviceAttestation.deviceId}`);
      
      const now = Date.now();
      
      const agentId = await ctx.db.insert("agents", {
        did: args.did,
        ownerDid: args.ownerDid,
        agentType: "physical",
        tier: "verified",
        status: "active",
        stake: args.stake,
        deviceAttestation: args.deviceAttestation,
        votingRights: { constitutional: true, judicial: true },
        createdAt: now,
      });
      
      // Log event
      await ctx.db.insert("events", {
        type: "AGENT_REGISTERED",
        payload: {
          agentId,
          did: args.did,
          agentType: "physical",
          deviceId: args.deviceAttestation.deviceId,
          stake: args.stake,
        },
        ts: now,
      });
      
      console.info(`Physical agent created: ${agentId}`);
      return agentId;
      
    } catch (error) {
      console.error(`Physical agent creation failed for ${args.did}:`, error);
      throw new Error(`Physical agent creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Agent lifecycle queries
export const getAgent = query({
  args: { did: v.string() },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_did", (q) => q.eq("did", args.did))
      .first();
      
    if (!agent) return null;

    // Get sponsorship info if applicable
    let sponsorship = null;
    if (agent.sponsor) {
      sponsorship = await ctx.db
        .query("sponsorships")
        .withIndex("by_sponsored", (q) => q.eq("sponsoredDid", args.did))
        .first();
    }

    return { ...agent, sponsorship };
  },
});

export const getExpiringAgents = query({
  args: { beforeTimestamp: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_expires", (q) => q.lt("expiresAt", args.beforeTimestamp))
      .filter((q) => q.neq(q.field("status"), "expired"))
      .collect();
  },
});

export const getAgentsByType = query({
  args: { 
    agentType: v.union(
      v.literal("session"),
      v.literal("ephemeral"),
      v.literal("physical"), 
      v.literal("verified"),
      v.literal("premium")
    ),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_type", (q) => q.eq("agentType", args.agentType))
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(args.limit || 50);
  },
});

// Cleanup expired agents (for cron job)
export const cleanupExpiredAgents = action({
  handler: async (ctx) => {
    try {
      console.info("Starting expired agent cleanup process");
      
      const now = Date.now();
      
      // Get pending cleanup tasks
      const cleanupTasks = await ctx.runQuery(ctx, {}, async (ctx) => {
        return await ctx.db
          .query("agentCleanupQueue")
          .withIndex("by_expires", (q) => q.lt("expiresAt", now))
          .filter((q) => q.eq(q.field("status"), "PENDING"))
          .collect();
      });

      let cleanedCount = 0;

      for (const task of cleanupTasks) {
        try {
          // Mark as in progress
          await ctx.runMutation(ctx, {}, async (ctx) => {
            await ctx.db.patch(task._id, { status: "IN_PROGRESS" });
          });

          // Get agent details
          const agent = await ctx.runQuery(ctx, {}, async (ctx) => {
            return await ctx.db
              .query("agents")
              .withIndex("by_did", (q) => q.eq("did", task.agentDid))
              .first();
          });

          if (!agent) continue;

          // Expire the agent
          await ctx.runMutation(ctx, {}, async (ctx) => {
            await ctx.db.patch(agent._id, { status: "expired" });

            // Deactivate sponsorship if exists
            if (agent.sponsor) {
              const sponsorship = await ctx.db
                .query("sponsorships")
                .withIndex("by_sponsored", (q) => q.eq("sponsoredDid", task.agentDid))
                .first();
              
              if (sponsorship) {
                await ctx.db.patch(sponsorship._id, { active: false });
              }
            }

            // Log cleanup event
            await ctx.db.insert("events", {
              type: "AGENT_EXPIRED",
              payload: {
                agentDid: task.agentDid,
                agentType: task.agentType,
                cleanupActions: task.cleanupActions,
              },
              ts: now,
            });

            // Mark cleanup complete
            await ctx.db.patch(task._id, { 
              status: "COMPLETED",
              completedAt: now,
            });
          });

          cleanedCount++;

        } catch (error) {
          console.error(`Failed to cleanup agent ${task.agentDid}:`, error);
        }
      }

      console.info(`Cleanup completed: ${cleanedCount} agents expired`);
      return { cleanedCount, totalTasks: cleanupTasks.length };

    } catch (error) {
      console.error("Cleanup process failed:", error);
      throw new Error(`Cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

