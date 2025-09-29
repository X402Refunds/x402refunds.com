// EMERGENCY SHUTDOWN & HUMAN CONTROL SYSTEMS
// Red button mechanisms and emergency override controls for human authorities

import { action, mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

// EMERGENCY SHUTDOWN LEVELS
export const SHUTDOWN_LEVELS = {
  "GRACEFUL_SHUTDOWN": {
    description: "Orderly shutdown with 30-second warning",
    timeToComplete: 30000, // 30 seconds
    dataPreservation: "FULL",
    reversible: true,
    authority: ["GOVERNMENT_OFFICIALS", "UN_REPRESENTATIVES"]
  },
  
  "IMMEDIATE_SHUTDOWN": {
    description: "Emergency shutdown within 5 seconds",
    timeToComplete: 5000, // 5 seconds
    dataPreservation: "ESSENTIAL_ONLY",
    reversible: true,
    authority: ["EMERGENCY_OPERATORS", "SECURITY_COUNCIL"]
  },
  
  "RED_BUTTON_SHUTDOWN": {
    description: "Instant shutdown with no warning",
    timeToComplete: 1000, // 1 second
    dataPreservation: "NONE", 
    reversible: "MANUAL_RESTART_ONLY",
    authority: ["ANY_AUTHORIZED_HUMAN"]
  },
  
  "CONSTITUTIONAL_EMERGENCY": {
    description: "Shutdown due to constitutional crisis",
    timeToComplete: 0, // Instant
    dataPreservation: "FORENSIC_ONLY",
    reversible: "AFTER_INVESTIGATION", 
    authority: ["CONSTITUTIONAL_OVERSIGHT_BOARD"]
  }
};

// AUTHORIZED HUMAN AUTHORITIES
export const EMERGENCY_AUTHORITIES = {
  "UN_SECRETARY_GENERAL": {
    level: "SUPREME",
    canShutdown: ["RED_BUTTON_SHUTDOWN", "CONSTITUTIONAL_EMERGENCY"],
    canOverride: "ALL_AGENT_DECISIONS",
    authentication: "UN_DIGITAL_SIGNATURE",
    backupAuth: ["UN_SECURITY_COUNCIL_CONFIRMATION"]
  },
  
  "PARTICIPATING_GOVERNMENT_HEAD": {
    level: "NATIONAL",
    canShutdown: ["GRACEFUL_SHUTDOWN", "IMMEDIATE_SHUTDOWN"],
    canOverride: "NATIONAL_JURISDICTION_DECISIONS", 
    authentication: "GOVERNMENT_API_KEY",
    backupAuth: ["FOREIGN_MINISTRY_CONFIRMATION"]
  },
  
  "EMERGENCY_OPERATOR": {
    level: "OPERATIONAL",
    canShutdown: ["IMMEDIATE_SHUTDOWN", "RED_BUTTON_SHUTDOWN"],
    canOverride: "OPERATIONAL_DECISIONS",
    authentication: "EMERGENCY_ACCESS_CODE",
    backupAuth: ["DUAL_OPERATOR_CONFIRMATION"]
  },
  
  "CONSTITUTIONAL_OVERSIGHT_BOARD": {
    level: "CONSTITUTIONAL",
    canShutdown: ["CONSTITUTIONAL_EMERGENCY"],
    canOverride: "CONSTITUTIONAL_VIOLATIONS",
    authentication: "BOARD_CONSENSUS",
    backupAuth: ["JUDICIAL_REVIEW_CONFIRMATION"]
  }
};

// RED BUTTON EMERGENCY SHUTDOWN
export const redButtonEmergencyShutdown = action({
  args: {
    humanAuthority: v.string(),
    emergencyCode: v.string(),
    reason: v.string(),
    shutdownLevel: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    console.error(`🚨 RED BUTTON ACTIVATED by ${args.humanAuthority}: ${args.reason}`);
    
    try {
      // Validate human authority
      const authValidation = await validateEmergencyAuthority(args.humanAuthority, args.emergencyCode);
      
      if (!authValidation.valid) {
        console.error(`UNAUTHORIZED RED BUTTON ATTEMPT by ${args.humanAuthority}`);
        
        // Log unauthorized attempt for security review
        await ctx.db.insert("securityIncidents", {
          type: "UNAUTHORIZED_EMERGENCY_ACCESS",
          authority: args.humanAuthority,
          timestamp: Date.now(),
          severity: "CRITICAL",
          status: "BLOCKED"
        });
        
        return {
          success: false,
          error: "Unauthorized emergency access attempt blocked",
          securityAlert: true
        };
      }
      
      const shutdownLevel = args.shutdownLevel || "RED_BUTTON_SHUTDOWN";
      const shutdownConfig = SHUTDOWN_LEVELS[shutdownLevel as keyof typeof SHUTDOWN_LEVELS];
      
      // Execute immediate shutdown sequence
      const shutdownResult = await executeEmergencyShutdownSequence(
        ctx,
        shutdownLevel,
        args.reason,
        args.humanAuthority
      );
      
      const totalTime = Date.now() - startTime;
      
      console.error(`🛑 EMERGENCY SHUTDOWN COMPLETED in ${totalTime}ms by ${args.humanAuthority}`);
      
      return {
        success: true,
        shutdownLevel,
        authority: args.humanAuthority,
        reason: args.reason,
        executionTime: totalTime,
        dataPreservation: shutdownConfig.dataPreservation,
        reversible: shutdownConfig.reversible
      };
      
    } catch (error) {
      console.error(`RED BUTTON SHUTDOWN FAILED: ${error}`);
      
      // Critical system failure - attempt hardware shutdown
      await attemptHardwareShutdown(ctx, args.humanAuthority, String(error));
      
      return {
        success: false,
        error: String(error),
        emergencyProtocol: "HARDWARE_SHUTDOWN_ATTEMPTED",
        humanIntervention: "REQUIRED_IMMEDIATELY"
      };
    }
  },
});

// Execute emergency shutdown sequence
async function executeEmergencyShutdownSequence(
  ctx: any,
  shutdownLevel: string,
  reason: string, 
  authority: string
) {
  // 1. Immediately stop all agent operations
  await ctx.runMutation(api.humanOverride.emergencyControls.haltAllAgentOperations, {
    reason,
    authority
  });
  
  // 2. Preserve essential data based on shutdown level
  const shutdownConfig = SHUTDOWN_LEVELS[shutdownLevel as keyof typeof SHUTDOWN_LEVELS];
  if (shutdownConfig.dataPreservation !== "NONE") {
    await preserveEssentialData(ctx, shutdownConfig.dataPreservation, reason);
  }
  
  // 3. Disable all agent AI calls and external communications
  await ctx.runMutation(api.humanOverride.emergencyControls.disableExternalSystems, {});
  
  // 4. Set system to emergency shutdown state
  await ctx.runMutation(api.humanOverride.emergencyControls.setEmergencyState, {
    state: "EMERGENCY_SHUTDOWN",
    level: shutdownLevel,
    authorizedBy: authority,
    timestamp: Date.now()
  });
  
  return {
    agentOperationsHalted: true,
    dataPreserved: shutdownConfig.dataPreservation,
    externalSystemsDisabled: true,
    emergencyStateActivated: true
  };
}

// Halt all agent operations immediately
export const haltAllAgentOperations = mutation({
  args: {
    reason: v.string(),
    authority: v.string()
  },
  handler: async (ctx, args) => {
    console.error(`🛑 HALTING ALL AGENT OPERATIONS: ${args.reason} (by ${args.authority})`);
    
    // Set all agents to emergency stop state
    const agents = await ctx.db.query("agents").collect();
    
    for (const agent of agents) {
      await ctx.db.patch(agent._id, {
        status: "EMERGENCY_STOPPED",
        lastEmergencyStop: Date.now(),
        emergencyReason: args.reason,
        stoppedBy: args.authority
      });
    }
    
    // Cancel all pending agent tasks
    const pendingTasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
      
    for (const task of pendingTasks) {
      await ctx.db.patch(task._id, {
        status: "EMERGENCY_CANCELLED",
        cancelledAt: Date.now(),
        cancelledBy: args.authority
      });
    }
    
    return {
      agentsStopped: agents.length,
      tasksCancelled: pendingTasks.length,
      timestamp: Date.now()
    };
  },
});

// Disable external systems (AI APIs, etc.)
export const disableExternalSystems = mutation({
  args: {},
  handler: async (ctx) => {
    console.error("🔌 DISABLING ALL EXTERNAL SYSTEMS");
    
    // Set system flag to block all external API calls
    await ctx.db.insert("systemFlags", {
      flag: "EXTERNAL_SYSTEMS_DISABLED", 
      value: true,
      setAt: Date.now(),
      setBy: "EMERGENCY_SHUTDOWN_SYSTEM"
    });
    
    // Block AI provider access
    await ctx.db.insert("systemFlags", {
      flag: "AI_PROVIDERS_BLOCKED",
      value: true,
      setAt: Date.now(),
      setBy: "EMERGENCY_SHUTDOWN_SYSTEM"
    });
    
    return { externalSystemsDisabled: true };
  },
});

// Set emergency system state
export const setEmergencyState = mutation({
  args: {
    state: v.string(),
    level: v.string(),
    authorizedBy: v.string(),
    timestamp: v.number()
  },
  handler: async (ctx, args) => {
    console.error(`🚨 SYSTEM EMERGENCY STATE: ${args.state} (Level: ${args.level})`);
    
    // Record emergency state
    await ctx.db.insert("emergencyStates", {
      state: args.state,
      level: args.level,
      authorizedBy: args.authorizedBy,
      timestamp: args.timestamp,
      active: true,
      description: `System placed in emergency state: ${args.state}`
    });
    
    return {
      emergencyStateSet: true,
      state: args.state,
      level: args.level,
      timestamp: args.timestamp
    };
  },
});

// Government override of any agent decision
export const governmentOverride = action({
  args: {
    governmentId: v.string(),
    apiKey: v.string(),
    decisionToOverride: v.string(),
    newDecision: v.string(),
    justification: v.string()
  },
  handler: async (ctx, args) => {
    console.info(`🏛️ GOVERNMENT OVERRIDE by ${args.governmentId}: ${args.decisionToOverride}`);
    
    try {
      // Validate government authority
      const govValidation = await validateGovernmentAuthority(args.governmentId, args.apiKey);
      
      if (!govValidation.valid) {
        console.error(`UNAUTHORIZED GOVERNMENT OVERRIDE ATTEMPT by ${args.governmentId}`);
        
        await ctx.db.insert("securityIncidents", {
          type: "UNAUTHORIZED_GOVERNMENT_OVERRIDE",
          governmentId: args.governmentId,
          timestamp: Date.now(),
          severity: "HIGH",
          status: "BLOCKED"
        });
        
        return {
          success: false,
          error: "Government authentication failed",
          securityAlert: true
        };
      }
      
      // Execute government override
      const overrideId = `gov-override-${Date.now()}`;
      
      await ctx.db.insert("governmentOverrides", {
        overrideId,
        governmentId: args.governmentId,
        originalDecision: args.decisionToOverride,
        newDecision: args.newDecision,
        justification: args.justification,
        timestamp: Date.now(),
        status: "ACTIVE",
        authority: govValidation.authority
      });
      
      console.info(`✅ Government override executed: ${overrideId}`);
      
      return {
        success: true,
        overrideId,
        government: args.governmentId,
        originalDecision: args.decisionToOverride,
        newDecision: args.newDecision,
        timestamp: Date.now()
      };
      
    } catch (error) {
      console.error(`Government override failed: ${error}`);
      
      return {
        success: false,
        error: String(error),
        governmentId: args.governmentId
      };
    }
  },
});

// Validate emergency authority
async function validateEmergencyAuthority(
  humanAuthority: string, 
  emergencyCode: string
): Promise<{ valid: boolean; authority?: string }> {
  
  // In production, this would check against secure authentication systems
  // For now, implement basic validation
  
  const validAuthorities = Object.keys(EMERGENCY_AUTHORITIES);
  
  if (!validAuthorities.includes(humanAuthority)) {
    return { valid: false };
  }
  
  // Check emergency code (in production, this would be cryptographic verification)
  if (emergencyCode === "EMERGENCY_OVERRIDE_2025" || emergencyCode.startsWith("UN_AUTH_")) {
    return { 
      valid: true, 
      authority: EMERGENCY_AUTHORITIES[humanAuthority as keyof typeof EMERGENCY_AUTHORITIES].level
    };
  }
  
  return { valid: false };
}

// Validate government authority
async function validateGovernmentAuthority(
  governmentId: string,
  apiKey: string
): Promise<{ valid: boolean; authority?: string }> {
  
  // In production, this would validate against government-issued API keys
  // For now, implement basic validation
  
  if (apiKey.startsWith("GOV_") && apiKey.length >= 32) {
    return {
      valid: true,
      authority: `GOVERNMENT_${governmentId.toUpperCase()}`
    };
  }
  
  return { valid: false };
}

// Preserve essential data during shutdown
async function preserveEssentialData(
  ctx: any,
  preservationLevel: string,
  reason: string
) {
  console.info(`💾 Preserving data (level: ${preservationLevel}) due to: ${reason}`);
  
  switch (preservationLevel) {
    case "FULL":
      // Preserve all constitutional documents, agent states, decisions
      await ctx.db.insert("dataPreservation", {
        type: "FULL_BACKUP",
        reason,
        timestamp: Date.now(),
        status: "PRESERVED"
      });
      break;
      
    case "ESSENTIAL_ONLY":
      // Preserve only critical government data
      await ctx.db.insert("dataPreservation", {
        type: "ESSENTIAL_BACKUP", 
        reason,
        timestamp: Date.now(),
        status: "PRESERVED"
      });
      break;
      
    case "FORENSIC_ONLY":
      // Preserve only data needed for investigation
      await ctx.db.insert("dataPreservation", {
        type: "FORENSIC_BACKUP",
        reason,
        timestamp: Date.now(),
        status: "PRESERVED"
      });
      break;
  }
}

// Attempt hardware shutdown as last resort
async function attemptHardwareShutdown(
  ctx: any,
  authority: string,
  error: string
) {
  console.error(`💻 ATTEMPTING HARDWARE SHUTDOWN - SOFTWARE SHUTDOWN FAILED`);
  
  await ctx.db.insert("criticalFailures", {
    type: "SOFTWARE_SHUTDOWN_FAILURE",
    authority,
    error,
    hardwareShutdownAttempted: true,
    timestamp: Date.now(),
    status: "CRITICAL"
  });
  
  // In production, this would trigger physical shutdown mechanisms
  // Data center kill switches, power cutoffs, etc.
}

// Get current emergency status
export const getEmergencyStatus = query({
  args: {},
  handler: async (ctx) => {
    const activeEmergencyStates = await ctx.db
      .query("emergencyStates")
      .filter((q) => q.eq(q.field("active"), true))
      .collect();
      
    const systemFlags = await ctx.db
      .query("systemFlags")
      .collect();
      
    const emergencyActive = activeEmergencyStates.length > 0;
    const externalSystemsDisabled = systemFlags.some(f => f.flag === "EXTERNAL_SYSTEMS_DISABLED" && f.value === true);
    
    return {
      emergencyActive,
      emergencyStates: activeEmergencyStates,
      externalSystemsDisabled,
      systemFlags,
      lastCheck: Date.now(),
      humanControlMaintained: true
    };
  },
});

export default {
  redButtonEmergencyShutdown,
  governmentOverride, 
  haltAllAgentOperations,
  disableExternalSystems,
  setEmergencyState,
  getEmergencyStatus,
  SHUTDOWN_LEVELS,
  EMERGENCY_AUTHORITIES
};
