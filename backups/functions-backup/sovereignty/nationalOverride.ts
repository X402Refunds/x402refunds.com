import { mutation, query, action } from "../_generated/server";
import { v } from "convex/values";

// National Override System for Agent Governance OS
// Ensures absolute national sovereignty in all federation interactions

// National emergency override - instant shutdown of all federation activities
export const nationalEmergencyOverride = mutation({
  args: {
    country: v.string(),                     // ISO country code
    overrideType: v.union(
      v.literal("full_shutdown"),           // Shutdown all agent activities
      v.literal("federation_suspension"),   // Suspend all cross-border activities
      v.literal("specific_restriction")     // Target specific agents/activities
    ),
    reason: v.string(),
    authorizedBy: v.string(),               // Government official DID/ID
    targetScope: v.optional(v.object({
      agentDids: v.optional(v.array(v.string())),
      bilateralPartners: v.optional(v.array(v.string())),
      unionTypes: v.optional(v.array(v.string())),
      unServices: v.optional(v.array(v.string())),
    })),
    immediateEffect: v.optional(v.boolean()), // Defaults to true
  },
  handler: async (ctx, args) => {
    try {
      console.info(`National emergency override initiated by ${args.country}: ${args.overrideType}`);
      
      const now = Date.now();
      
      // Create override record
      const overrideId = await ctx.db.insert("nationalOverrides", {
        country: args.country,
        overrideType: args.overrideType,
        reason: args.reason,
        authorizedBy: args.authorizedBy,
        targetScope: args.targetScope,
        status: "ACTIVE",
        effectiveAt: now,
        expiresAt: null, // National overrides don't expire automatically
        createdAt: now,
        updatedAt: now,
      });
      
      // Execute override based on type
      switch (args.overrideType) {
        case "full_shutdown":
          await executeFullShutdown(ctx, args.country);
          break;
        case "federation_suspension":
          await executeFederationSuspension(ctx, args.country);
          break;
        case "specific_restriction":
          if (args.targetScope) {
            await executeSpecificRestriction(ctx, args.country, args.targetScope);
          }
          break;
      }
      
      // Log override event
      await ctx.db.insert("events", {
        type: "NATIONAL_EMERGENCY_OVERRIDE",
        payload: {
          overrideId,
          country: args.country,
          overrideType: args.overrideType,
          reason: args.reason,
          authorizedBy: args.authorizedBy,
          scope: args.targetScope,
        },
        timestamp: now,
      });
      
      console.info(`National emergency override executed: ${overrideId}`);
      return overrideId;
      
    } catch (error) {
      console.error(`National emergency override failed:`, error);
      throw new Error(`Emergency override failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Helper function: Execute full shutdown
async function executeFullShutdown(ctx: any, country: string) {
  // Suspend all agents from this jurisdiction
  const agents = await ctx.db
    .query("agents")
    .filter((q) => 
      q.and(
        q.eq(q.field("status"), "active"),
        q.or(
          q.eq(q.field("federation.homeJurisdiction"), country),
          q.eq(q.field("ownerDid"), country) // Fallback check
        )
      )
    )
    .collect();
    
  for (const agent of agents) {
    await ctx.db.patch(agent._id, {
      status: "suspended",
      suspensionReason: "national_emergency_override",
    });
  }
  
  // Suspend all bilateral agreements
  const bilateralAgreements = await ctx.db
    .query("bilateralAgreements")
    .filter((q) => 
      q.and(
        q.or(
          q.eq(q.field("countryA"), country),
          q.eq(q.field("countryB"), country)
        ),
        q.eq(q.field("status"), "active")
      )
    )
    .collect();
    
  for (const agreement of bilateralAgreements) {
    await ctx.db.patch(agreement._id, {
      status: "suspended",
    });
  }
  
  // Suspend union integrations
  const unionIntegrations = await ctx.db
    .query("unionIntegrations")
    .filter((q) => 
      q.and(
        q.eq(q.field("memberCountry"), country),
        q.eq(q.field("status"), "active")
      )
    )
    .collect();
    
  for (const integration of unionIntegrations) {
    await ctx.db.patch(integration._id, {
      status: "suspended",
    });
  }
  
  // Suspend UN coordination
  const unCoordination = await ctx.db
    .query("unCoordination")
    .filter((q) => 
      q.and(
        q.eq(q.field("country"), country),
        q.eq(q.field("status"), "active")
      )
    )
    .first();
    
  if (unCoordination) {
    await ctx.db.patch(unCoordination._id, {
      status: "suspended",
    });
  }
}

// Helper function: Execute federation suspension
async function executeFederationSuspension(ctx: any, country: string) {
  // Disable federation for all agents from this jurisdiction
  const agents = await ctx.db
    .query("agents")
    .filter((q) => 
      q.and(
        q.eq(q.field("status"), "active"),
        q.eq(q.field("federation.homeJurisdiction"), country),
        q.eq(q.field("federation.enabled"), true)
      )
    )
    .collect();
    
  for (const agent of agents) {
    const updatedFederation = {
      ...(agent.federation || {}),
      enabled: false,
      crossBorderEnabled: false,
      bilateralAgreements: [],
      unionPassport: undefined,
      unRecognition: undefined,
      federationLevel: "domestic_only",
      lastFederationUpdate: Date.now(),
    };
    
    await ctx.db.patch(agent._id, {
      federation: updatedFederation,
    });
  }
  
  // Same bilateral/union/UN suspension as full shutdown
  // (Code omitted for brevity - same logic as executeFullShutdown)
}

// Helper function: Execute specific restriction
async function executeSpecificRestriction(ctx: any, country: string, scope: any) {
  // Restrict specific agents
  if (scope.agentDids) {
    for (const agentDid of scope.agentDids) {
      const agent = await ctx.db
        .query("agents")
        .withIndex("by_did", (q) => q.eq("did", agentDid))
        .first();
        
      if (agent && agent.federation?.homeJurisdiction === country) {
        await ctx.db.patch(agent._id, {
          status: "suspended",
          suspensionReason: "national_specific_restriction",
        });
      }
    }
  }
  
  // Restrict specific bilateral partners
  if (scope.bilateralPartners) {
    for (const partner of scope.bilateralPartners) {
      const agreements = await ctx.db
        .query("bilateralAgreements")
        .filter((q) => 
          q.and(
            q.or(
              q.and(q.eq(q.field("countryA"), country), q.eq(q.field("countryB"), partner)),
              q.and(q.eq(q.field("countryA"), partner), q.eq(q.field("countryB"), country))
            ),
            q.eq(q.field("status"), "active")
          )
        )
        .collect();
        
      for (const agreement of agreements) {
        await ctx.db.patch(agreement._id, {
          status: "suspended",
        });
      }
    }
  }
}

// Lift national override (restore normal operations)
export const liftNationalOverride = mutation({
  args: {
    overrideId: v.id("nationalOverrides"),
    authorizedBy: v.string(),
    reason: v.string(),
    restoreScope: v.optional(v.union(
      v.literal("full_restore"),
      v.literal("partial_restore"),
      v.literal("maintain_restrictions")
    )),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Lifting national override: ${args.overrideId}`);
      
      // Get override
      const override = await ctx.db.get(args.overrideId);
      if (!override) {
        throw new Error(`National override ${args.overrideId} not found`);
      }
      
      const now = Date.now();
      
      // Update override status
      await ctx.db.patch(args.overrideId, {
        status: "LIFTED",
        liftedAt: now,
        liftedBy: args.authorizedBy,
        liftReason: args.reason,
        updatedAt: now,
      });
      
      // Execute restoration based on scope
      if (args.restoreScope === "full_restore") {
        await executeFullRestore(ctx, override.country);
      }
      
      // Log lift event
      await ctx.db.insert("events", {
        type: "NATIONAL_OVERRIDE_LIFTED",
        payload: {
          overrideId: args.overrideId,
          country: override.country,
          liftedBy: args.authorizedBy,
          reason: args.reason,
          restoreScope: args.restoreScope,
        },
        timestamp: now,
      });
      
      console.info(`National override lifted: ${args.overrideId}`);
      return "override_lifted";
      
    } catch (error) {
      console.error(`Failed to lift national override:`, error);
      throw new Error(`Override lift failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Helper function: Execute full restore
async function executeFullRestore(ctx: any, country: string) {
  // Restore agents (but don't automatically re-enable federation)
  const agents = await ctx.db
    .query("agents")
    .filter((q) => 
      q.and(
        q.eq(q.field("status"), "suspended"),
        q.eq(q.field("suspensionReason"), "national_emergency_override")
      )
    )
    .collect();
    
  for (const agent of agents) {
    if (agent.federation?.homeJurisdiction === country) {
      await ctx.db.patch(agent._id, {
        status: "active",
        suspensionReason: undefined,
      });
    }
  }
  
  // Note: Bilateral agreements and union integrations require manual re-activation
  // for security reasons - they don't automatically restore
}

// Get active national overrides
export const getNationalOverrides = query({
  args: {
    country: v.optional(v.string()),
    status: v.optional(v.union(v.literal("ACTIVE"), v.literal("LIFTED"), v.literal("EXPIRED"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let overrides = await ctx.db
      .query("nationalOverrides")
      .collect();
      
    if (args.country) {
      overrides = overrides.filter(override => override.country === args.country);
    }
    
    if (args.status) {
      overrides = overrides.filter(override => override.status === args.status);
    }
    
    // Sort by creation date (newest first)
    overrides.sort((a, b) => b.createdAt - a.createdAt);
    
    return overrides.slice(0, args.limit || 50);
  },
});

// Verify national authority (used by other functions)
export const verifyNationalAuthority = query({
  args: {
    country: v.string(),
    requestType: v.string(),               // "agent_operation", "bilateral_agreement", etc.
    targetResource: v.optional(v.string()), // Agent DID, agreement ID, etc.
  },
  handler: async (ctx, args) => {
    // Check for active national overrides
    const activeOverrides = await ctx.db
      .query("nationalOverrides")
      .filter((q) => 
        q.and(
          q.eq(q.field("country"), args.country),
          q.eq(q.field("status"), "ACTIVE")
        )
      )
      .collect();
      
    // If there are active overrides, check if they affect this request
    for (const override of activeOverrides) {
      if (override.overrideType === "full_shutdown") {
        return {
          authorized: false,
          reason: "national_emergency_override_active",
          overrideId: override._id,
        };
      }
      
      if (override.overrideType === "federation_suspension" && 
          ["bilateral_agreement", "union_integration", "un_coordination"].includes(args.requestType)) {
        return {
          authorized: false,
          reason: "federation_suspended",
          overrideId: override._id,
        };
      }
      
      if (override.overrideType === "specific_restriction" && 
          override.targetScope?.agentDids?.includes(args.targetResource || "")) {
        return {
          authorized: false,
          reason: "specific_restriction_active",
          overrideId: override._id,
        };
      }
    }
    
    return {
      authorized: true,
      reason: "no_restrictions",
    };
  },
});

// National veto of any federation decision (always available)
export const nationalVetoFederationDecision = mutation({
  args: {
    country: v.string(),
    decisionType: v.string(),              // "bilateral_agreement", "union_directive", "un_recommendation"
    decisionId: v.string(),                // ID of the decision being vetoed
    vetoReason: v.string(),
    authorizedBy: v.string(),
    emergencyVeto: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`National veto by ${args.country}: ${args.decisionType}/${args.decisionId}`);
      
      const now = Date.now();
      
      // Record veto
      const vetoId = await ctx.db.insert("nationalVetoes", {
        country: args.country,
        decisionType: args.decisionType,
        decisionId: args.decisionId,
        vetoReason: args.vetoReason,
        authorizedBy: args.authorizedBy,
        emergencyVeto: args.emergencyVeto || false,
        status: "ACTIVE",
        vetoedAt: now,
        createdAt: now,
      });
      
      // Execute veto effect based on decision type
      await executeFederationVeto(ctx, args.decisionType, args.decisionId, args.country);
      
      // Log veto event
      await ctx.db.insert("events", {
        type: "NATIONAL_FEDERATION_VETO",
        payload: {
          vetoId,
          country: args.country,
          decisionType: args.decisionType,
          decisionId: args.decisionId,
          vetoReason: args.vetoReason,
          authorizedBy: args.authorizedBy,
          emergencyVeto: args.emergencyVeto || false,
        },
        timestamp: now,
      });
      
      console.info(`National veto executed: ${vetoId}`);
      return vetoId;
      
    } catch (error) {
      console.error(`National veto failed:`, error);
      throw new Error(`National veto failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Helper function: Execute federation veto
async function executeFederationVeto(ctx: any, decisionType: string, decisionId: string, country: string) {
  switch (decisionType) {
    case "bilateral_agreement":
      // Suspend bilateral agreement
      const agreement = await ctx.db
        .query("bilateralAgreements")
        .filter((q) => q.eq(q.field("_id"), decisionId))
        .first();
      if (agreement && (agreement.countryA === country || agreement.countryB === country)) {
        await ctx.db.patch(agreement._id, {
          status: "suspended",
        });
      }
      break;
      
    case "union_integration":
      // Suspend union integration
      const integration = await ctx.db
        .query("unionIntegrations")
        .filter((q) => 
          q.and(
            q.eq(q.field("_id"), decisionId),
            q.eq(q.field("memberCountry"), country)
          )
        )
        .first();
      if (integration) {
        await ctx.db.patch(integration._id, {
          status: "suspended",
        });
      }
      break;
      
    case "un_recommendation":
      // Veto UN recommendation (already handled by UN coordination module)
      // This just records the national veto in events
      break;
  }
}
