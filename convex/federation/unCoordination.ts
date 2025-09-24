import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// UN coordination management (optional federation module)
// Provides advisory services and global coordination - NEVER binding

// Join UN coordination (country opts-in to advisory services)
export const joinUnCoordination = mutation({
  args: {
    country: v.string(),                     // ISO country code
    coordinationLevel: v.union(
      v.literal("advisory"),                 // Advisory services only (default)
      v.literal("coordination")             // Active coordination (still non-binding)
    ),
    enabledServices: v.array(v.string()),   // ["best_practices", "mediation", etc.]
    participationLevel: v.union(v.literal("full"), v.literal("limited"), v.literal("observer")),
    advisoryOnly: v.optional(v.boolean()),  // Defaults to true - UN is always advisory
    nationalVetoRights: v.optional(v.boolean()), // Defaults to true - nation can always veto
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Country ${args.country} joining UN coordination`);
      
      // Check if already in UN coordination
      const existingCoordination = await ctx.db
        .query("unCoordination")
        .filter((q) => q.eq(q.field("country"), args.country))
        .first();
        
      const now = Date.now();
      
      if (existingCoordination) {
        // Update existing coordination
        await ctx.db.patch(existingCoordination._id, {
          coordinationLevel: args.coordinationLevel,
          status: "active",
          enabledServices: args.enabledServices,
          participationLevel: args.participationLevel,
          advisoryOnly: args.advisoryOnly ?? true,         // Default: always advisory
          nationalVetoRights: args.nationalVetoRights ?? true, // Default: always veto rights
          lastParticipationReview: now,
          updatedAt: now,
        });
        
        console.info(`UN coordination updated: ${existingCoordination._id}`);
        return existingCoordination._id;
      } else {
        // Create new coordination
        const coordinationId = await ctx.db.insert("unCoordination", {
          country: args.country,
          coordinationLevel: args.coordinationLevel,
          status: "active",
          enabledServices: args.enabledServices,
          advisoryOnly: args.advisoryOnly ?? true,         // Default: always advisory
          nationalVetoRights: args.nationalVetoRights ?? true, // Default: always veto rights
          participationLevel: args.participationLevel,
          lastParticipationReview: now,
          createdAt: now,
          updatedAt: now,
        });
        
        // Log UN coordination joining
        await ctx.db.insert("events", {
          type: "UN_COORDINATION_JOINED",
          payload: {
            coordinationId,
            country: args.country,
            coordinationLevel: args.coordinationLevel,
            enabledServices: args.enabledServices,
            participationLevel: args.participationLevel,
          },
          timestamp: now,
        });
        
        console.info(`UN coordination created: ${coordinationId}`);
        return coordinationId;
      }
      
    } catch (error) {
      console.error(`Failed to join UN coordination:`, error);
      throw new Error(`UN coordination join failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Withdraw from UN coordination (sovereignty control)
export const withdrawUnCoordination = mutation({
  args: {
    country: v.string(),
    reason: v.string(),
    emergencyWithdrawal: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Country ${args.country} withdrawing from UN coordination`);
      
      // Get coordination
      const coordination = await ctx.db
        .query("unCoordination")
        .filter((q) => q.eq(q.field("country"), args.country))
        .first();
        
      if (!coordination) {
        throw new Error(`No UN coordination found for ${args.country}`);
      }
      
      const now = Date.now();
      
      // Withdraw
      await ctx.db.patch(coordination._id, {
        coordinationLevel: "opt_out",
        status: "withdrawn",
        updatedAt: now,
      });
      
      // Log withdrawal
      await ctx.db.insert("events", {
        type: "UN_COORDINATION_WITHDRAWN",
        payload: {
          coordinationId: coordination._id,
          country: args.country,
          reason: args.reason,
          emergencyWithdrawal: args.emergencyWithdrawal || false,
          previousLevel: coordination.coordinationLevel,
        },
        timestamp: now,
      });
      
      console.info(`UN coordination withdrawal completed: ${coordination._id}`);
      return "withdrawn";
      
    } catch (error) {
      console.error(`Failed to withdraw from UN coordination:`, error);
      throw new Error(`UN coordination withdrawal failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Get UN coordination status for a country
export const getUnCoordination = query({
  args: {
    country: v.string(),
  },
  handler: async (ctx, args) => {
    const coordination = await ctx.db
      .query("unCoordination")
      .filter((q) => q.eq(q.field("country"), args.country))
      .first();
      
    if (!coordination) {
      return {
        participating: false,
        status: "not_participating",
      };
    }
    
    return {
      participating: coordination.status === "active",
      ...coordination,
    };
  },
});

// Get all UN coordination participants
export const getUnParticipants = query({
  args: {
    status: v.optional(v.union(v.literal("active"), v.literal("suspended"), v.literal("withdrawn"))),
    coordinationLevel: v.optional(v.union(
      v.literal("advisory"),
      v.literal("coordination"),
      v.literal("opt_out")
    )),
    participationLevel: v.optional(v.union(v.literal("full"), v.literal("limited"), v.literal("observer"))),
  },
  handler: async (ctx, args) => {
    let participants = await ctx.db
      .query("unCoordination")
      .collect();
      
    if (args.status) {
      participants = participants.filter(p => p.status === args.status);
    }
    
    if (args.coordinationLevel) {
      participants = participants.filter(p => p.coordinationLevel === args.coordinationLevel);
    }
    
    if (args.participationLevel) {
      participants = participants.filter(p => p.participationLevel === args.participationLevel);
    }
    
    // Sort by participation level and then by country
    const levelOrder = { "full": 0, "limited": 1, "observer": 2 };
    participants.sort((a, b) => {
      const levelDiff = levelOrder[a.participationLevel] - levelOrder[b.participationLevel];
      if (levelDiff !== 0) return levelDiff;
      return a.country.localeCompare(b.country);
    });
    
    return participants;
  },
});

// Submit UN recommendation (advisory only - never binding)
export const submitUnRecommendation = mutation({
  args: {
    targetCountry: v.string(),               // Country receiving recommendation
    recommendationType: v.string(),          // "best_practice", "policy_guidance", etc.
    title: v.string(),
    description: v.string(),
    recommendedActions: v.array(v.string()),
    context: v.optional(v.any()),           // Additional context
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    submittedBy: v.string(),                // UN department/agency
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Submitting UN recommendation to ${args.targetCountry}`);
      
      // Verify target country participates in UN coordination
      const coordination = await ctx.db
        .query("unCoordination")
        .filter((q) => 
          q.and(
            q.eq(q.field("country"), args.targetCountry),
            q.eq(q.field("status"), "active")
          )
        )
        .first();
        
      if (!coordination) {
        throw new Error(`${args.targetCountry} does not participate in UN coordination`);
      }
      
      // Check if country accepts this type of recommendation
      const acceptsRecommendationType = coordination.enabledServices.includes(args.recommendationType) ||
                                       coordination.enabledServices.includes("all_recommendations");
      
      if (!acceptsRecommendationType) {
        throw new Error(`${args.targetCountry} does not accept ${args.recommendationType} recommendations`);
      }
      
      const now = Date.now();
      
      // Create recommendation (stored as event for transparency)
      await ctx.db.insert("events", {
        type: "UN_RECOMMENDATION_SUBMITTED",
        payload: {
          targetCountry: args.targetCountry,
          recommendationType: args.recommendationType,
          title: args.title,
          description: args.description,
          recommendedActions: args.recommendedActions,
          context: args.context,
          priority: args.priority,
          submittedBy: args.submittedBy,
          status: "submitted",
          advisory: true,                    // Always advisory - never binding
          vetoable: coordination.nationalVetoRights,
        },
        timestamp: now,
      });
      
      console.info(`UN recommendation submitted to ${args.targetCountry}`);
      return "recommendation_submitted";
      
    } catch (error) {
      console.error(`Failed to submit UN recommendation:`, error);
      throw new Error(`UN recommendation submission failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Veto UN recommendation (sovereignty control - always available)
export const vetoUnRecommendation = mutation({
  args: {
    country: v.string(),
    recommendationId: v.string(),            // Event ID of the recommendation
    vetoReason: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Country ${args.country} vetoing UN recommendation ${args.recommendationId}`);
      
      // Verify country has veto rights (should always be true)
      const coordination = await ctx.db
        .query("unCoordination")
        .filter((q) => q.eq(q.field("country"), args.country))
        .first();
        
      if (!coordination || !coordination.nationalVetoRights) {
        throw new Error(`${args.country} does not have veto rights (this should never happen)`);
      }
      
      const now = Date.now();
      
      // Log veto
      await ctx.db.insert("events", {
        type: "UN_RECOMMENDATION_VETOED",
        payload: {
          country: args.country,
          recommendationId: args.recommendationId,
          vetoReason: args.vetoReason,
          vetoedAt: now,
        },
        timestamp: now,
      });
      
      console.info(`UN recommendation vetoed by ${args.country}`);
      return "recommendation_vetoed";
      
    } catch (error) {
      console.error(`Failed to veto UN recommendation:`, error);
      throw new Error(`UN recommendation veto failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Get UN recommendations for a country
export const getUnRecommendations = query({
  args: {
    country: v.string(),
    recommendationType: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get recommendations from events table
    let recommendations = await ctx.db
      .query("events")
      .withIndex("by_type", (q) => q.eq("type", "UN_RECOMMENDATION_SUBMITTED"))
      .collect();
      
    // Filter by target country
    recommendations = recommendations.filter(rec => 
      rec.payload?.targetCountry === args.country
    );
    
    if (args.recommendationType) {
      recommendations = recommendations.filter(rec => 
        rec.payload?.recommendationType === args.recommendationType
      );
    }
    
    if (args.status) {
      recommendations = recommendations.filter(rec => 
        rec.payload?.status === args.status
      );
    }
    
    // Sort by timestamp (newest first)
    recommendations.sort((a, b) => b.timestamp - a.timestamp);
    
    return recommendations.slice(0, args.limit || 50);
  },
});

// Update UN coordination services (national sovereignty control)
export const updateUnCoordinationServices = mutation({
  args: {
    country: v.string(),
    newEnabledServices: v.array(v.string()),
    newParticipationLevel: v.optional(v.union(v.literal("full"), v.literal("limited"), v.literal("observer"))),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Updating UN coordination services for ${args.country}`);
      
      // Get coordination
      const coordination = await ctx.db
        .query("unCoordination")
        .filter((q) => q.eq(q.field("country"), args.country))
        .first();
        
      if (!coordination) {
        throw new Error(`No UN coordination found for ${args.country}`);
      }
      
      const now = Date.now();
      
      // Update services
      await ctx.db.patch(coordination._id, {
        enabledServices: args.newEnabledServices,
        participationLevel: args.newParticipationLevel || coordination.participationLevel,
        lastParticipationReview: now,
        updatedAt: now,
      });
      
      // Log update
      await ctx.db.insert("events", {
        type: "UN_COORDINATION_UPDATED",
        payload: {
          coordinationId: coordination._id,
          country: args.country,
          newEnabledServices: args.newEnabledServices,
          newParticipationLevel: args.newParticipationLevel,
          reason: args.reason,
        },
        timestamp: now,
      });
      
      console.info(`UN coordination updated: ${coordination._id}`);
      return "coordination_updated";
      
    } catch (error) {
      console.error(`Failed to update UN coordination:`, error);
      throw new Error(`UN coordination update failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});
