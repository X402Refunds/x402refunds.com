import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Functional type validation rules
async function validateFunctionalTypeRequirements(ctx: any, functionalType: string, citizenshipTier: string, args: any) {
  const now = Date.now();
  
  switch (functionalType) {
    case "financial":
      // Financial agents require higher stakes and certifications
      if (!args.stake || args.stake < 50000) {
        throw new Error("Financial agents require minimum stake of 50000");
      }
      if (!args.specialization?.certifications?.includes("TRADING")) {
        throw new Error("Financial agents require TRADING certification");
      }
      break;
      
    case "healthcare":
      // Healthcare agents require HIPAA compliance and human oversight
      if (!args.specialization?.certifications?.includes("HIPAA")) {
        throw new Error("Healthcare agents require HIPAA certification");
      }
      if (citizenshipTier === "session" || citizenshipTier === "ephemeral") {
        throw new Error("Healthcare agents cannot be session or ephemeral");
      }
      break;
      
    case "legal":
      // Legal agents require verified status or higher
      if (!["verified", "premium"].includes(citizenshipTier)) {
        throw new Error("Legal agents require verified citizenship tier or higher");
      }
      break;
      
    case "voice":
      // Voice agents require privacy compliance
      if (!args.specialization?.certifications?.some((cert: string) => 
        ["GDPR", "CCPA", "VOICE_PROCESSING"].includes(cert))) {
        throw new Error("Voice agents require privacy compliance certification");
      }
      break;
      
    case "coding":
      // Coding agents require security scanning capability
      if (!args.specialization?.capabilities?.includes("security_scanning")) {
        console.warn("Coding agents should have security_scanning capability");
      }
      break;
      
    case "physical":
      // Physical functional type should align with physical citizenship tier
      if (citizenshipTier !== "physical") {
        console.warn("Physical functional type typically requires physical citizenship tier");
      }
      break;
  }
  
  // Create default functional type rules if they don't exist
  await ensureFunctionalTypeRules(ctx, functionalType, citizenshipTier);
}

async function ensureFunctionalTypeRules(ctx: any, functionalType: string, citizenshipTier: string) {
  const ruleId = `${functionalType}_${citizenshipTier}`;
  
  const existingRule = await ctx.db
    .query("functionalTypeRules")
    .withIndex("by_rule_id", (q: any) => q.eq("ruleId", ruleId))
    .first();
    
  if (existingRule) return;
  
  // Create default rules based on functional type
  const defaultRules = getFunctionalTypeDefaults(functionalType, citizenshipTier);
  
  await ctx.db.insert("functionalTypeRules", {
    ruleId,
    functionalType,
    citizenshipTiers: [citizenshipTier],
    ...defaultRules,
    createdAt: Date.now(),
    lastUpdated: Date.now(),
  });
}

function getFunctionalTypeDefaults(functionalType: string, citizenshipTier: string) {
  const defaults = {
    requiredLicenses: [],
    regulatoryReporting: false,
    auditTrail: "BASIC",
    privacyLevel: "STANDARD", 
    dataRetention: "30d",
    humanOversight: "NONE",
    auditAccess: [],
    emergencyProtocols: [],
    restrictedJurisdictions: [],
    emergencyHalting: false,
    crossJurisdictionAccess: true,
    priorityProcessing: false,
  };
  
  switch (functionalType) {
    case "financial":
      return {
        ...defaults,
        requiredLicenses: ["TRADING", "FINANCIAL_ADVICE"],
        stakingRequirement: { minimum: 50000, currency: "USDC" },
        regulatoryReporting: true,
        auditTrail: "COMPREHENSIVE",
        maxTransactionLimits: { daily: 1000000, perTransaction: 100000 },
        emergencyHalting: true,
        auditAccess: ["SEC", "FINRA"],
      };
      
    case "healthcare":
      return {
        ...defaults,
        requiredLicenses: ["HIPAA", "MEDICAL_AI"],
        regulatoryReporting: true,
        auditTrail: "MAXIMUM",
        privacyLevel: "MAXIMUM",
        dataRetention: "PERMANENT",
        humanOversight: "REQUIRED",
        auditAccess: ["FDA", "MEDICAL_BOARDS"],
        emergencyProtocols: ["PATIENT_SAFETY_OVERRIDE"],
      };
      
    case "voice":
      return {
        ...defaults,
        requiredLicenses: ["VOICE_PROCESSING", "PRIVACY_COMPLIANCE"],
        privacyLevel: "HIGH",
        auditTrail: "COMPREHENSIVE",
        emergencyProtocols: ["CONSENT_VALIDATION", "BIOMETRIC_PROTECTION"],
      };
      
    case "coding":
      return {
        ...defaults,
        requiredLicenses: ["CODE_SECURITY"],
        auditTrail: "COMPREHENSIVE",
        emergencyProtocols: ["SECURITY_SCAN", "VULNERABILITY_REPORT"],
      };
      
    default:
      return defaults;
  }
}

// Agent registration with full citizenship tier and functional type support
export const joinAgent = mutation({
  args: {
    did: v.string(),
    ownerDid: v.string(),
    
    // Two-dimensional classification
    citizenshipTier: v.union(
      v.literal("session"),
      v.literal("ephemeral"), 
      v.literal("physical"),
      v.literal("verified"),
      v.literal("premium")
    ),
    functionalType: v.union(
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
    ),
    
    // Functional specialization details
    specialization: v.optional(v.object({
      capabilities: v.array(v.string()),
      certifications: v.array(v.string()),
      languages: v.optional(v.array(v.string())),
      frameworks: v.optional(v.array(v.string())),
      specializations: v.array(v.string()),
      experienceLevel: v.optional(v.string()),
    })),
    
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
    
    // Legacy support
    agentType: v.optional(v.union(
      v.literal("session"), v.literal("ephemeral"), v.literal("physical"),
      v.literal("verified"), v.literal("premium")
    )),
  },
  handler: async (ctx, args) => {
    try {
      const citizenshipTier = args.citizenshipTier || args.agentType || "session";
      const functionalType = args.functionalType || "general";
      const classification = `${citizenshipTier}.${functionalType}`;
      
      console.info(`Processing agent registration for ${args.did} of classification ${classification}`);

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
      
      // Apply citizenship tier rules
      let expiresAt: number | undefined;
      let maxLifetime: number | undefined;
      let votingRights = { constitutional: false, judicial: false, weight: 1 };

      switch (citizenshipTier) {
        case "session":
          maxLifetime = 4 * 60 * 60 * 1000; // 4 hours
          expiresAt = now + maxLifetime;
          votingRights = { constitutional: false, judicial: false, weight: 0 };
          break;
        
        case "ephemeral":
          maxLifetime = 24 * 60 * 60 * 1000; // 24 hours  
          expiresAt = now + maxLifetime;
          votingRights = { constitutional: false, judicial: true, weight: 1 };
          
          // Verify sponsor exists and is verified+
          if (!args.sponsor) {
            throw new Error("Ephemeral agents require a sponsor");
          }
          
          const sponsor = await ctx.db
            .query("agents")
            .withIndex("by_did", (q) => q.eq("did", args.sponsor!))
            .first();
            
          if (!sponsor || !["verified", "premium"].includes(sponsor.citizenshipTier || sponsor.agentType || "")) {
            throw new Error("Sponsor must be verified or premium agent");
          }
          break;
          
        case "physical":
          if (!args.deviceAttestation) {
            throw new Error("Physical agents require device attestation");
          }
          votingRights = { constitutional: true, judicial: true, weight: 1 };
          break;
          
        case "verified":
          if (!args.stake || args.stake < 1000) {
            throw new Error("Verified agents require minimum stake of 1000");
          }
          votingRights = { constitutional: true, judicial: true, weight: 1 };
          break;
          
        case "premium":
          if (!args.stake || args.stake < 10000) {
            throw new Error("Premium agents require minimum stake of 10000");
          }
          votingRights = { constitutional: true, judicial: true, weight: 2 };
          break;
      }

      // Apply functional type-specific validations and requirements
      await validateFunctionalTypeRequirements(ctx, functionalType, citizenshipTier, args);

      // Create agent record with two-dimensional classification
      const agentData = {
        did: args.did,
        ownerDid: args.ownerDid,
        buildHash: args.buildHash,
        configHash: args.configHash,
        
        // New two-dimensional system
        citizenshipTier,
        functionalType,
        classification,
        specialization: args.specialization,
        
        // Legacy fields for backward compatibility
        agentType: citizenshipTier,
        tier: citizenshipTier === "premium" ? ("premium" as const) : 
              (citizenshipTier === "verified" || citizenshipTier === "physical") ? ("verified" as const) : ("basic" as const),
        
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
      if (args.sponsor && citizenshipTier === "ephemeral") {
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
          agentType: citizenshipTier,
          expiresAt,
          cleanupActions: ["expire_agent", "cleanup_evidence", "transfer_liability"],
          status: "PENDING",
          createdAt: now,
        });
      }

      // Log the registration event
      await ctx.db.insert("events", {
        type: "AGENT_REGISTERED",
        payload: {
          did: args.did,
          citizenshipTier,
          functionalType,
          classification,
          agentType: citizenshipTier, // For backward compatibility
          tier: agentData.tier,
          expiresAt: agentData.expiresAt,
          sponsor: args.sponsor,
          specialization: args.specialization,
        },
        timestamp: now,
        agentDid: args.did,
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
    functionalType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const functionalType = args.functionalType || args.purpose || "general";
    
    return await ctx.db.insert("agents", {
      did: args.did,
      ownerDid: args.ownerDid,
      agentType: "session",
      citizenshipTier: "session" as const,
      classification: "ai_agent",
      functionalType: functionalType as any, // Cast to match schema
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
      
    if (!sponsor || !["verified", "premium"].includes(sponsor.agentType || sponsor.citizenshipTier)) {
      throw new Error("Sponsor must be verified or premium agent");
    }

    const now = Date.now();
    const expiresAt = now + (24 * 60 * 60 * 1000); // 24 hours

    const agentId = await ctx.db.insert("agents", {
      did: args.did,
      ownerDid: args.ownerDid,
      
      // New two-dimensional system
      citizenshipTier: "ephemeral" as const,
      functionalType: "general" as const, // Default functional type
      classification: "ephemeral.general",
      
      // Legacy fields for backward compatibility
      agentType: "ephemeral",
      tier: "basic" as const, 
      status: "active" as const,
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
        
        // New two-dimensional system
        citizenshipTier: "physical" as const,
        functionalType: "general" as const, // Default functional type  
        classification: "physical.general",
        
        // Legacy fields for backward compatibility
        agentType: "physical",
        tier: "verified" as const,
        status: "active" as const,
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
        timestamp: now,
        agentDid: args.did,
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

// New queries for functional types
export const getAgentsByCitizenshipTier = query({
  args: { 
    citizenshipTier: v.union(
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
      .withIndex("by_citizenship_tier", (q) => q.eq("citizenshipTier", args.citizenshipTier))
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(args.limit || 50);
  },
});

export const getAgentsByFunctionalType = query({
  args: { 
    functionalType: v.union(
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
    ),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_functional_type", (q) => q.eq("functionalType", args.functionalType))
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(args.limit || 50);
  },
});

export const getAgentsByClassification = query({
  args: { 
    classification: v.string(), // e.g., "verified.coding", "premium.financial"
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_classification", (q) => q.eq("classification", args.classification))
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(args.limit || 50);
  },
});

export const getFunctionalTypeRules = query({
  args: { 
    functionalType: v.string(),
    citizenshipTier: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("functionalTypeRules")
      .withIndex("by_functional_type", (q: any) => q.eq("functionalType", args.functionalType));
      
    const rules = await query.collect();
    
    if (args.citizenshipTier) {
      return rules.filter(rule => rule.citizenshipTiers.includes(args.citizenshipTier!));
    }
    
    return rules;
  },
});

export const getAgentSwarms = query({
  args: { 
    leadAgent: v.optional(v.string()),
    status: v.optional(v.union(v.literal("ACTIVE"), v.literal("INACTIVE"), v.literal("DISBANDED"))),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("agentSwarms");
    
    if (args.leadAgent) {
      query = query.withIndex("by_lead_agent", (q: any) => q.eq("leadAgent", args.leadAgent));
    } else if (args.status) {
      query = query.withIndex("by_status", (q: any) => q.eq("status", args.status));
    }
    
    return await query.take(args.limit || 20);
  },
});

// Specialized join functions for common functional types
export const joinCodingAgent = mutation({
  args: {
    did: v.string(),
    ownerDid: v.string(),
    citizenshipTier: v.union(v.literal("verified"), v.literal("premium")),
    languages: v.array(v.string()),
    frameworks: v.optional(v.array(v.string())),
    experienceLevel: v.optional(v.string()),
    stake: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(api.agents.joinAgent, {
      did: args.did,
      ownerDid: args.ownerDid,
      citizenshipTier: args.citizenshipTier,
      functionalType: "coding",
      specialization: {
        capabilities: ["code_generation", "code_review", "security_scanning"],
        certifications: ["CODE_SECURITY"],
        languages: args.languages,
        frameworks: args.frameworks,
        specializations: ["software_development"],
        experienceLevel: args.experienceLevel || "basic",
      },
      stake: args.stake,
    });
  },
});

export const joinVoiceAgent = mutation({
  args: {
    did: v.string(),
    ownerDid: v.string(),
    citizenshipTier: v.union(v.literal("verified"), v.literal("premium")),
    languages: v.array(v.string()),
    privacyCompliance: v.array(v.string()),
    stake: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(api.agents.joinAgent, {
      did: args.did,
      ownerDid: args.ownerDid,
      citizenshipTier: args.citizenshipTier,
      functionalType: "voice",
      specialization: {
        capabilities: ["speech_to_text", "text_to_speech", "emotion_recognition"],
        certifications: ["VOICE_PROCESSING", ...args.privacyCompliance],
        languages: args.languages,
        specializations: ["voice_interface", "audio_processing"],
        experienceLevel: "basic",
      },
      stake: args.stake,
    });
  },
});

export const joinFinancialAgent = mutation({
  args: {
    did: v.string(),
    ownerDid: v.string(),
    citizenshipTier: v.union(v.literal("verified"), v.literal("premium")),
    stake: v.number(),
    certifications: v.array(v.string()),
    maxTransactionLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.stake < 50000) {
      throw new Error("Financial agents require minimum stake of 50000");
    }
    
    return await ctx.runMutation(api.agents.joinAgent, {
      did: args.did,
      ownerDid: args.ownerDid,
      citizenshipTier: args.citizenshipTier,
      functionalType: "financial",
      specialization: {
        capabilities: ["trading", "portfolio_management", "risk_assessment"],
        certifications: args.certifications,
        specializations: ["algorithmic_trading", "risk_management"],
        experienceLevel: "advanced",
      },
      stake: args.stake,
    });
  },
});

export const joinHealthcareAgent = mutation({
  args: {
    did: v.string(),
    ownerDid: v.string(),
    citizenshipTier: v.union(v.literal("verified"), v.literal("premium")),
    medicalSpecialties: v.array(v.string()),
    hipaaCompliant: v.boolean(),
    stake: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.hipaaCompliant) {
      throw new Error("Healthcare agents must be HIPAA compliant");
    }
    
    return await ctx.runMutation(api.agents.joinAgent, {
      did: args.did,
      ownerDid: args.ownerDid,
      citizenshipTier: args.citizenshipTier,
      functionalType: "healthcare",
      specialization: {
        capabilities: ["medical_analysis", "diagnosis_assistance", "patient_monitoring"],
        certifications: ["HIPAA", "MEDICAL_AI"],
        specializations: args.medicalSpecialties,
        experienceLevel: "advanced",
      },
      stake: args.stake,
    });
  },
});

// Create agent swarm
export const createAgentSwarm = mutation({
  args: {
    swarmId: v.string(),
    name: v.string(),
    leadAgent: v.string(),
    memberAgents: v.array(v.string()),
    swarmType: v.union(v.literal("coordinated"), v.literal("distributed"), v.literal("hierarchical")),
    purpose: v.string(),
    collectiveEvidence: v.optional(v.boolean()),
    distributedLiability: v.optional(v.boolean()),
    consensusRequired: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Creating agent swarm: ${args.swarmId} with ${args.memberAgents.length} members`);
      
      // Verify all agents exist and are active
      for (const agentDid of [args.leadAgent, ...args.memberAgents]) {
        const agent = await ctx.db
          .query("agents")
          .withIndex("by_did", (q) => q.eq("did", agentDid))
          .first();
          
        if (!agent || agent.status !== "active") {
          throw new Error(`Agent ${agentDid} not found or not active`);
        }
      }
      
      // Get functional types of all members
      const memberDetails = await Promise.all(
        [args.leadAgent, ...args.memberAgents].map(async (did) => {
          const agent = await ctx.db
            .query("agents")
            .withIndex("by_did", (q) => q.eq("did", did))
            .first();
          return { did, functionalType: agent?.functionalType || "general" };
        })
      );
      
      const functionalTypes = [...new Set(memberDetails.map(m => m.functionalType))];
      
      const swarmId = await ctx.db.insert("agentSwarms", {
        swarmId: args.swarmId,
        name: args.name,
        leadAgent: args.leadAgent,
        memberAgents: args.memberAgents,
        swarmType: args.swarmType,
        functionalTypes,
        purpose: args.purpose,
        collectiveEvidence: args.collectiveEvidence ?? false,
        distributedLiability: args.distributedLiability ?? false,
        consensusRequired: args.consensusRequired ?? false,
        status: "ACTIVE",
        createdAt: Date.now(),
        lastActivity: Date.now(),
      });
      
      console.info(`Agent swarm created: ${swarmId}`);
      return swarmId;
      
    } catch (error) {
      console.error(`Failed to create agent swarm ${args.swarmId}:`, error);
      throw new Error(`Swarm creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Cleanup expired agents (for cron job)
export const cleanupExpiredAgents = action({
  handler: async (ctx) => {
    try {
      console.info("Starting expired agent cleanup process");
      
      const now = Date.now();
      
      // Get pending cleanup tasks - skip if table doesn't exist yet
      let cleanupTasks = [];
      try {
        cleanupTasks = await ctx.db
          .query("agentCleanupQueue")
          .withIndex("by_expires", (q) => q.lt("expiresAt", now))
          .filter((q) => q.eq(q.field("status"), "PENDING"))
          .collect();
      } catch (error) {
        console.warn("agentCleanupQueue table not found, skipping cleanup");
        return { cleanedCount: 0, totalTasks: 0 };
      }

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

// Update agent status - needed by tests
export const updateAgentStatus = mutation({
  args: {
    agentId: v.id("agents"),
    status: v.union(v.literal("active"), v.literal("suspended"), v.literal("banned"), v.literal("expired")),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Updating agent status for ${args.agentId} to ${args.status}`);
      
      await ctx.db.patch(args.agentId, {
        status: args.status,
      });
      
      console.info(`Agent status updated successfully`);
      return "status_updated";
    } catch (error) {
      console.error(`Failed to update agent status:`, error);
      throw new Error(`Failed to update agent status: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// === FEDERATION SUPPORT (OPTIONAL MODULAR FEATURE) ===

// Enable federation for an agent (optional feature)
export const enableAgentFederation = mutation({
  args: {
    agentDid: v.string(),
    homeJurisdiction: v.string(),          // ISO country code
    federationLevel: v.optional(v.union(
      v.literal("domestic_only"),
      v.literal("bilateral_only"), 
      v.literal("union_integrated"),
      v.literal("un_coordinated")
    )),
    bilateralAgreements: v.optional(v.array(v.string())), // Country codes
    unionPassport: v.optional(v.string()),
    unRecognition: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Enabling federation for agent ${args.agentDid}`);
      
      // Get the agent
      const agent = await ctx.db
        .query("agents")
        .withIndex("by_did", (q) => q.eq("did", args.agentDid))
        .first();
        
      if (!agent) {
        throw new Error(`Agent ${args.agentDid} not found`);
      }
      
      // Create federation configuration
      const federationConfig = {
        enabled: true,
        nationalDID: args.agentDid,
        homeJurisdiction: args.homeJurisdiction,
        crossBorderEnabled: args.bilateralAgreements ? args.bilateralAgreements.length > 0 : false,
        bilateralAgreements: args.bilateralAgreements || [],
        unionPassport: args.unionPassport,
        unRecognition: args.unRecognition,
        sovereigntyChain: {
          national: "ULTIMATE_AUTHORITY" as const,
          union: args.unionPassport ? "DELEGATED_AUTHORITY" as const : undefined,
          un: args.unRecognition ? "ADVISORY_ONLY" as const : undefined,
        },
        federationLevel: args.federationLevel || "domestic_only",
        lastFederationUpdate: Date.now(),
      };
      
      // Update agent with federation configuration
      await ctx.db.patch(agent._id, {
        federation: federationConfig,
      });
      
      // Log federation event
      await ctx.db.insert("events", {
        type: "AGENT_FEDERATION_ENABLED",
        payload: {
          agentDid: args.agentDid,
          homeJurisdiction: args.homeJurisdiction,
          federationLevel: args.federationLevel || "domestic_only",
          bilateralAgreements: args.bilateralAgreements || [],
        },
        timestamp: Date.now(),
        agentDid: args.agentDid,
      });
      
      console.info(`Federation enabled for agent ${args.agentDid}`);
      return agent._id;
      
    } catch (error) {
      console.error(`Failed to enable federation for agent ${args.agentDid}:`, error);
      throw new Error(`Federation enable failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Disable federation for an agent (sovereignty control)
export const disableAgentFederation = mutation({
  args: {
    agentDid: v.string(),
    reason: v.optional(v.string()), // Reason for disabling federation
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Disabling federation for agent ${args.agentDid}`);
      
      // Get the agent
      const agent = await ctx.db
        .query("agents")
        .withIndex("by_did", (q) => q.eq("did", args.agentDid))
        .first();
        
      if (!agent) {
        throw new Error(`Agent ${args.agentDid} not found`);
      }
      
      // Disable federation while preserving national identity
      const updatedFederation = {
        ...(agent.federation || {}),
        enabled: false,
        crossBorderEnabled: false,
        bilateralAgreements: [],
        unionPassport: undefined,
        unRecognition: undefined,
        federationLevel: "domestic_only" as const,
        lastFederationUpdate: Date.now(),
      };
      
      // Update agent
      await ctx.db.patch(agent._id, {
        federation: updatedFederation,
      });
      
      // Log federation disabled event
      await ctx.db.insert("events", {
        type: "AGENT_FEDERATION_DISABLED",
        payload: {
          agentDid: args.agentDid,
          reason: args.reason || "federation_disabled",
          previousLevel: agent.federation?.federationLevel || "unknown",
        },
        timestamp: Date.now(),
        agentDid: args.agentDid,
      });
      
      console.info(`Federation disabled for agent ${args.agentDid}`);
      return "federation_disabled";
      
    } catch (error) {
      console.error(`Failed to disable federation for agent ${args.agentDid}:`, error);
      throw new Error(`Federation disable failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Get agents with federation capabilities
export const getFederatedAgents = query({
  args: {
    homeJurisdiction: v.optional(v.string()),
    federationLevel: v.optional(v.union(
      v.literal("domestic_only"),
      v.literal("bilateral_only"), 
      v.literal("union_integrated"),
      v.literal("un_coordinated")
    )),
    crossBorderOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let agents = await ctx.db
      .query("agents")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
      
    // Filter by federation criteria
    if (args.homeJurisdiction || args.federationLevel || args.crossBorderOnly) {
      agents = agents.filter(agent => {
        const federation = agent.federation;
        if (!federation || !federation.enabled) return false;
        
        if (args.homeJurisdiction && federation.homeJurisdiction !== args.homeJurisdiction) {
          return false;
        }
        
        if (args.federationLevel && federation.federationLevel !== args.federationLevel) {
          return false;
        }
        
        if (args.crossBorderOnly && !federation.crossBorderEnabled) {
          return false;
        }
        
        return true;
      });
    }
    
    return agents.slice(0, args.limit || 50);
  },
});

// Verify cross-border agent access (sovereignty control)
export const verifyCrossBorderAccess = query({
  args: {
    agentDid: v.string(),
    targetJurisdiction: v.string(),      // Country code the agent wants to operate in
    requestingJurisdiction: v.string(),  // Country code making the request
  },
  handler: async (ctx, args) => {
    try {
      // Get agent
      const agent = await ctx.db
        .query("agents")
        .withIndex("by_did", (q) => q.eq("did", args.agentDid))
        .first();
        
      if (!agent) {
        return { 
          authorized: false, 
          reason: "agent_not_found" 
        };
      }
      
      // Check if federation is enabled
      if (!agent.federation || !agent.federation.enabled || !agent.federation.crossBorderEnabled) {
        return { 
          authorized: false, 
          reason: "federation_disabled" 
        };
      }
      
      // Check home jurisdiction authority
      if (agent.federation.homeJurisdiction !== args.requestingJurisdiction) {
        return { 
          authorized: false, 
          reason: "unauthorized_jurisdiction" 
        };
      }
      
      // Check bilateral agreement
      const hasBilateralAgreement = agent.federation.bilateralAgreements?.includes(args.targetJurisdiction);
      if (!hasBilateralAgreement) {
        return { 
          authorized: false, 
          reason: "no_bilateral_agreement" 
        };
      }
      
      // Verify bilateral agreement is active
      const bilateralAgreement = await ctx.db
        .query("bilateralAgreements")
        .filter((q) => 
          q.and(
            q.or(
              q.and(
                q.eq(q.field("countryA"), args.requestingJurisdiction),
                q.eq(q.field("countryB"), args.targetJurisdiction)
              ),
              q.and(
                q.eq(q.field("countryA"), args.targetJurisdiction),
                q.eq(q.field("countryB"), args.requestingJurisdiction)
              )
            ),
            q.eq(q.field("status"), "active")
          )
        )
        .first();
        
      if (!bilateralAgreement) {
        return { 
          authorized: false, 
          reason: "bilateral_agreement_inactive" 
        };
      }
      
      return {
        authorized: true,
        agreementType: bilateralAgreement.agreementType,
        trustLevel: bilateralAgreement.trustLevel,
        capabilities: bilateralAgreement.capabilities,
        restrictions: bilateralAgreement.restrictions,
      };
      
    } catch (error) {
      console.error(`Cross-border access verification failed:`, error);
      return { 
        authorized: false, 
        reason: "verification_error" 
      };
    }
  },
});

