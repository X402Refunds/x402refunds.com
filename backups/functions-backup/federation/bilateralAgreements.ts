import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Bilateral agreement management (optional federation module)

// Create bilateral agreement between two countries
export const createBilateralAgreement = mutation({
  args: {
    countryA: v.string(),                    // ISO country code
    countryB: v.string(),                    // ISO country code
    agreementType: v.string(),               // "agent_recognition", "comprehensive_cooperation", etc.
    trustLevel: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    capabilities: v.array(v.string()),       // ["identity_recognition", "dispute_resolution", etc.]
    restrictions: v.optional(v.array(v.string())),
    expiresAt: v.optional(v.number()),
    dataResidencyRequirements: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Creating bilateral agreement: ${args.countryA} <-> ${args.countryB}`);
      
      // Check if agreement already exists
      const existingAgreement = await ctx.db
        .query("bilateralAgreements")
        .filter((q) => 
          q.or(
            q.and(
              q.eq(q.field("countryA"), args.countryA),
              q.eq(q.field("countryB"), args.countryB)
            ),
            q.and(
              q.eq(q.field("countryA"), args.countryB),
              q.eq(q.field("countryB"), args.countryA)
            )
          )
        )
        .first();
        
      if (existingAgreement) {
        throw new Error(`Bilateral agreement already exists between ${args.countryA} and ${args.countryB}`);
      }
      
      const now = Date.now();
      
      // Create bilateral agreement
      const agreementId = await ctx.db.insert("bilateralAgreements", {
        countryA: args.countryA,
        countryB: args.countryB,
        agreementType: args.agreementType,
        trustLevel: args.trustLevel,
        status: "active",
        capabilities: args.capabilities,
        restrictions: args.restrictions,
        signedAt: now,
        expiresAt: args.expiresAt,
        lastReviewedAt: now,
        emergencyWithdrawal: true,  // Always allow emergency withdrawal
        dataResidencyRequirements: args.dataResidencyRequirements,
        createdAt: now,
        updatedAt: now,
      });
      
      // Log agreement creation
      await ctx.db.insert("events", {
        type: "BILATERAL_AGREEMENT_CREATED",
        payload: {
          agreementId,
          countryA: args.countryA,
          countryB: args.countryB,
          agreementType: args.agreementType,
          trustLevel: args.trustLevel,
        },
        timestamp: now,
      });
      
      console.info(`Bilateral agreement created: ${agreementId}`);
      return agreementId;
      
    } catch (error) {
      console.error(`Failed to create bilateral agreement:`, error);
      throw new Error(`Bilateral agreement creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Suspend bilateral agreement (sovereignty control)
export const suspendBilateralAgreement = mutation({
  args: {
    agreementId: v.id("bilateralAgreements"),
    suspendingCountry: v.string(),           // Which country is suspending
    reason: v.string(),
    emergencyWithdrawal: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Suspending bilateral agreement: ${args.agreementId}`);
      
      // Get agreement
      const agreement = await ctx.db.get(args.agreementId);
      if (!agreement) {
        throw new Error(`Bilateral agreement ${args.agreementId} not found`);
      }
      
      // Verify suspending country is party to agreement
      if (args.suspendingCountry !== agreement.countryA && args.suspendingCountry !== agreement.countryB) {
        throw new Error(`Country ${args.suspendingCountry} is not party to this agreement`);
      }
      
      const now = Date.now();
      
      // Suspend agreement
      await ctx.db.patch(args.agreementId, {
        status: "suspended",
        updatedAt: now,
      });
      
      // Log suspension
      await ctx.db.insert("events", {
        type: "BILATERAL_AGREEMENT_SUSPENDED",
        payload: {
          agreementId: args.agreementId,
          suspendingCountry: args.suspendingCountry,
          reason: args.reason,
          emergencyWithdrawal: args.emergencyWithdrawal || false,
          countryA: agreement.countryA,
          countryB: agreement.countryB,
        },
        timestamp: now,
      });
      
      console.info(`Bilateral agreement suspended: ${args.agreementId}`);
      return "agreement_suspended";
      
    } catch (error) {
      console.error(`Failed to suspend bilateral agreement:`, error);
      throw new Error(`Bilateral agreement suspension failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Get bilateral agreements for a country
export const getBilateralAgreements = query({
  args: {
    country: v.string(),                     // ISO country code
    status: v.optional(v.union(v.literal("active"), v.literal("suspended"), v.literal("terminated"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let agreements = await ctx.db
      .query("bilateralAgreements")
      .filter((q) => 
        q.or(
          q.eq(q.field("countryA"), args.country),
          q.eq(q.field("countryB"), args.country)
        )
      )
      .collect();
      
    if (args.status) {
      agreements = agreements.filter(agreement => agreement.status === args.status);
    }
    
    // Sort by creation date (newest first)
    agreements.sort((a, b) => b.createdAt - a.createdAt);
    
    return agreements.slice(0, args.limit || 50);
  },
});

// Verify bilateral agreement exists and is active
export const verifyBilateralAgreement = query({
  args: {
    countryA: v.string(),
    countryB: v.string(),
  },
  handler: async (ctx, args) => {
    const agreement = await ctx.db
      .query("bilateralAgreements")
      .filter((q) => 
        q.and(
          q.or(
            q.and(
              q.eq(q.field("countryA"), args.countryA),
              q.eq(q.field("countryB"), args.countryB)
            ),
            q.and(
              q.eq(q.field("countryA"), args.countryB),
              q.eq(q.field("countryB"), args.countryA)
            )
          ),
          q.eq(q.field("status"), "active")
        )
      )
      .first();
      
    if (!agreement) {
      return {
        exists: false,
        active: false,
      };
    }
    
    // Check if expired
    const now = Date.now();
    const isExpired = agreement.expiresAt && now > agreement.expiresAt;
    
    return {
      exists: true,
      active: !isExpired,
      agreement: isExpired ? null : agreement,
      expired: isExpired,
    };
  },
});

// Update bilateral agreement capabilities (by either party)
export const updateBilateralAgreementCapabilities = mutation({
  args: {
    agreementId: v.id("bilateralAgreements"),
    requestingCountry: v.string(),
    newCapabilities: v.array(v.string()),
    newRestrictions: v.optional(v.array(v.string())),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Updating bilateral agreement capabilities: ${args.agreementId}`);
      
      // Get agreement
      const agreement = await ctx.db.get(args.agreementId);
      if (!agreement) {
        throw new Error(`Bilateral agreement ${args.agreementId} not found`);
      }
      
      // Verify requesting country is party to agreement
      if (args.requestingCountry !== agreement.countryA && args.requestingCountry !== agreement.countryB) {
        throw new Error(`Country ${args.requestingCountry} is not party to this agreement`);
      }
      
      const now = Date.now();
      
      // Update capabilities
      await ctx.db.patch(args.agreementId, {
        capabilities: args.newCapabilities,
        restrictions: args.newRestrictions,
        lastReviewedAt: now,
        updatedAt: now,
      });
      
      // Log update
      await ctx.db.insert("events", {
        type: "BILATERAL_AGREEMENT_UPDATED",
        payload: {
          agreementId: args.agreementId,
          requestingCountry: args.requestingCountry,
          newCapabilities: args.newCapabilities,
          newRestrictions: args.newRestrictions,
          reason: args.reason,
        },
        timestamp: now,
      });
      
      console.info(`Bilateral agreement updated: ${args.agreementId}`);
      return "agreement_updated";
      
    } catch (error) {
      console.error(`Failed to update bilateral agreement:`, error);
      throw new Error(`Bilateral agreement update failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});
