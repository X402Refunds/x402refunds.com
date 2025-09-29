import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Union integration management (optional federation module)
// Supports EU, ASEAN, NAFTA/USMCA, African Union, etc.

// Join union integration (country opts-in)
export const joinUnionIntegration = mutation({
  args: {
    unionType: v.string(),                   // "EU", "ASEAN", "NAFTA", "AU", etc.
    memberCountry: v.string(),               // ISO country code
    integrationLevel: v.union(
      v.literal("observer"),
      v.literal("participant"), 
      v.literal("full_member")
    ),
    features: v.array(v.string()),           // ["agent_passport", "unified_disputes", etc.]
    delegatedAuthorities: v.array(v.string()), // What powers are delegated to union
    nationalOverrides: v.array(v.string()),    // What can still be overridden nationally
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Country ${args.memberCountry} joining ${args.unionType} integration`);
      
      // Check if already in union
      const existingIntegration = await ctx.db
        .query("unionIntegrations")
        .filter((q) => 
          q.and(
            q.eq(q.field("unionType"), args.unionType),
            q.eq(q.field("memberCountry"), args.memberCountry)
          )
        )
        .first();
        
      if (existingIntegration) {
        // Update existing integration
        const now = Date.now();
        
        await ctx.db.patch(existingIntegration._id, {
          integrationLevel: args.integrationLevel,
          status: "active",
          features: args.features,
          delegatedAuthorities: args.delegatedAuthorities,
          nationalOverrides: args.nationalOverrides,
          lastReviewedAt: now,
          updatedAt: now,
        });
        
        console.info(`Union integration updated: ${existingIntegration._id}`);
        return existingIntegration._id;
      } else {
        // Create new integration
        const now = Date.now();
        
        const integrationId = await ctx.db.insert("unionIntegrations", {
          unionType: args.unionType,
          memberCountry: args.memberCountry,
          integrationLevel: args.integrationLevel,
          status: "active",
          features: args.features,
          delegatedAuthorities: args.delegatedAuthorities,
          nationalOverrides: args.nationalOverrides,
          joinedAt: now,
          lastReviewedAt: now,
          createdAt: now,
          updatedAt: now,
        });
        
        // Log union joining
        await ctx.db.insert("events", {
          type: "UNION_INTEGRATION_JOINED",
          payload: {
            integrationId,
            unionType: args.unionType,
            memberCountry: args.memberCountry,
            integrationLevel: args.integrationLevel,
            features: args.features,
          },
          timestamp: now,
        });
        
        console.info(`Union integration created: ${integrationId}`);
        return integrationId;
      }
      
    } catch (error) {
      console.error(`Failed to join union integration:`, error);
      throw new Error(`Union integration join failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Opt out of union integration (sovereignty control)
export const optOutUnionIntegration = mutation({
  args: {
    unionType: v.string(),
    memberCountry: v.string(),
    reason: v.string(),
    emergencyOptOut: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Country ${args.memberCountry} opting out of ${args.unionType}`);
      
      // Get integration
      const integration = await ctx.db
        .query("unionIntegrations")
        .filter((q) => 
          q.and(
            q.eq(q.field("unionType"), args.unionType),
            q.eq(q.field("memberCountry"), args.memberCountry)
          )
        )
        .first();
        
      if (!integration) {
        throw new Error(`No ${args.unionType} integration found for ${args.memberCountry}`);
      }
      
      const now = Date.now();
      
      // Opt out
      await ctx.db.patch(integration._id, {
        status: "opted_out",
        updatedAt: now,
      });
      
      // Log opt-out
      await ctx.db.insert("events", {
        type: "UNION_INTEGRATION_OPT_OUT",
        payload: {
          integrationId: integration._id,
          unionType: args.unionType,
          memberCountry: args.memberCountry,
          reason: args.reason,
          emergencyOptOut: args.emergencyOptOut || false,
          previousLevel: integration.integrationLevel,
        },
        timestamp: now,
      });
      
      console.info(`Union integration opt-out completed: ${integration._id}`);
      return "opted_out";
      
    } catch (error) {
      console.error(`Failed to opt out of union integration:`, error);
      throw new Error(`Union integration opt-out failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Get union integrations for a country
export const getUnionIntegrations = query({
  args: {
    memberCountry: v.string(),
    status: v.optional(v.union(v.literal("active"), v.literal("suspended"), v.literal("opted_out"))),
    unionType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let integrations = await ctx.db
      .query("unionIntegrations")
      .filter((q) => q.eq(q.field("memberCountry"), args.memberCountry))
      .collect();
      
    if (args.status) {
      integrations = integrations.filter(integration => integration.status === args.status);
    }
    
    if (args.unionType) {
      integrations = integrations.filter(integration => integration.unionType === args.unionType);
    }
    
    // Sort by join date (newest first)
    integrations.sort((a, b) => b.joinedAt - a.joinedAt);
    
    return integrations;
  },
});

// Get all members of a union
export const getUnionMembers = query({
  args: {
    unionType: v.string(),
    status: v.optional(v.union(v.literal("active"), v.literal("suspended"), v.literal("opted_out"))),
    integrationLevel: v.optional(v.union(
      v.literal("observer"),
      v.literal("participant"), 
      v.literal("full_member")
    )),
  },
  handler: async (ctx, args) => {
    let members = await ctx.db
      .query("unionIntegrations")
      .filter((q) => q.eq(q.field("unionType"), args.unionType))
      .collect();
      
    if (args.status) {
      members = members.filter(member => member.status === args.status);
    }
    
    if (args.integrationLevel) {
      members = members.filter(member => member.integrationLevel === args.integrationLevel);
    }
    
    // Sort by integration level (full_member first, then participant, then observer)
    const levelOrder = { "full_member": 0, "participant": 1, "observer": 2 };
    members.sort((a, b) => levelOrder[a.integrationLevel] - levelOrder[b.integrationLevel]);
    
    return members;
  },
});

// Verify union agent passport (cross-union recognition)
export const verifyUnionAgentPassport = query({
  args: {
    agentDid: v.string(),
    unionType: v.string(),
    targetCountry: v.string(),               // Country where agent wants to operate
  },
  handler: async (ctx, args) => {
    try {
      // Get agent
      const agent = await ctx.db
        .query("agents")
        .withIndex("by_did", (q) => q.eq("did", args.agentDid))
        .first();
        
      if (!agent) {
        return { valid: false, reason: "agent_not_found" };
      }
      
      // Check if agent has union passport
      if (!agent.federation || !agent.federation.unionPassport) {
        return { valid: false, reason: "no_union_passport" };
      }
      
      // Check if target country is member of the union
      const targetIntegration = await ctx.db
        .query("unionIntegrations")
        .filter((q) => 
          q.and(
            q.eq(q.field("unionType"), args.unionType),
            q.eq(q.field("memberCountry"), args.targetCountry),
            q.eq(q.field("status"), "active")
          )
        )
        .first();
        
      if (!targetIntegration) {
        return { valid: false, reason: "target_country_not_union_member" };
      }
      
      // Check if target country accepts agent passport feature
      if (!targetIntegration.features.includes("agent_passport")) {
        return { valid: false, reason: "agent_passport_not_accepted" };
      }
      
      // Check home country's union membership
      const homeIntegration = await ctx.db
        .query("unionIntegrations")
        .filter((q) => 
          q.and(
            q.eq(q.field("unionType"), args.unionType),
            q.eq(q.field("memberCountry"), agent.federation.homeJurisdiction),
            q.eq(q.field("status"), "active")
          )
        )
        .first();
        
      if (!homeIntegration) {
        return { valid: false, reason: "home_country_not_union_member" };
      }
      
      // Check integration levels allow passport recognition
      const canIssuePassport = ["participant", "full_member"].includes(homeIntegration.integrationLevel);
      const canAcceptPassport = ["participant", "full_member"].includes(targetIntegration.integrationLevel);
      
      if (!canIssuePassport || !canAcceptPassport) {
        return { valid: false, reason: "insufficient_integration_level" };
      }
      
      return {
        valid: true,
        homeIntegration: {
          level: homeIntegration.integrationLevel,
          features: homeIntegration.features,
        },
        targetIntegration: {
          level: targetIntegration.integrationLevel,  
          features: targetIntegration.features,
        },
        passportType: agent.federation.unionPassport,
      };
      
    } catch (error) {
      console.error(`Union passport verification failed:`, error);
      return { valid: false, reason: "verification_error" };
    }
  },
});

// Update union integration features (national sovereignty control)
export const updateUnionIntegrationFeatures = mutation({
  args: {
    unionType: v.string(),
    memberCountry: v.string(),
    newFeatures: v.array(v.string()),
    newDelegatedAuthorities: v.optional(v.array(v.string())),
    newNationalOverrides: v.optional(v.array(v.string())),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Updating ${args.unionType} integration features for ${args.memberCountry}`);
      
      // Get integration
      const integration = await ctx.db
        .query("unionIntegrations")
        .filter((q) => 
          q.and(
            q.eq(q.field("unionType"), args.unionType),
            q.eq(q.field("memberCountry"), args.memberCountry)
          )
        )
        .first();
        
      if (!integration) {
        throw new Error(`No ${args.unionType} integration found for ${args.memberCountry}`);
      }
      
      const now = Date.now();
      
      // Update features
      await ctx.db.patch(integration._id, {
        features: args.newFeatures,
        delegatedAuthorities: args.newDelegatedAuthorities || integration.delegatedAuthorities,
        nationalOverrides: args.newNationalOverrides || integration.nationalOverrides,
        lastReviewedAt: now,
        updatedAt: now,
      });
      
      // Log update
      await ctx.db.insert("events", {
        type: "UNION_INTEGRATION_UPDATED",
        payload: {
          integrationId: integration._id,
          unionType: args.unionType,
          memberCountry: args.memberCountry,
          newFeatures: args.newFeatures,
          newDelegatedAuthorities: args.newDelegatedAuthorities,
          newNationalOverrides: args.newNationalOverrides,
          reason: args.reason,
        },
        timestamp: now,
      });
      
      console.info(`Union integration updated: ${integration._id}`);
      return "integration_updated";
      
    } catch (error) {
      console.error(`Failed to update union integration:`, error);
      throw new Error(`Union integration update failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});
