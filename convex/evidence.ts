import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
// Types are validated by Convex schema

// Functional type-specific evidence validation
async function validateFunctionalEvidence(ctx: any, functionalType: string, functionalContext: any) {
  if (!functionalContext) return;
  
  switch (functionalType) {
    case "financial":
      if (functionalContext.financialContext) {
        const finCtx = functionalContext.financialContext;
        if (finCtx.transactionIds?.length === 0) {
          throw new Error("Financial evidence must include at least one transaction ID");
        }
        if (!finCtx.complianceChecks || finCtx.complianceChecks.length === 0) {
          throw new Error("Financial evidence must include compliance checks");
        }
      }
      break;
      
    case "healthcare":
      if (functionalContext.healthcareContext) {
        const healthCtx = functionalContext.healthcareContext;
        if (!healthCtx.hipaaCompliance) {
          throw new Error("Healthcare evidence must be HIPAA compliant");
        }
        if (healthCtx.medicalDataHashes?.length === 0) {
          throw new Error("Healthcare evidence must include anonymized data hashes");
        }
      }
      break;
      
    case "voice":
      if (functionalContext.voiceContext) {
        const voiceCtx = functionalContext.voiceContext;
        if (!voiceCtx.consentProof && !voiceCtx.audioFileId) {
          throw new Error("Voice evidence must include either consent proof or audio file");
        }
        if (!voiceCtx.privacyCompliance || voiceCtx.privacyCompliance.length === 0) {
          throw new Error("Voice evidence must specify privacy compliance standards");
        }
      }
      break;
      
    case "coding":
      if (functionalContext.codingContext) {
        const codeCtx = functionalContext.codingContext;
        if (codeCtx.securityScanResults === false || 
           (codeCtx.securityScanResults && typeof codeCtx.securityScanResults === 'object' && 
            'vulnerabilities' in codeCtx.securityScanResults && 
            codeCtx.securityScanResults.vulnerabilities > 0)) {
          console.warn("Coding evidence contains security vulnerabilities");
        }
      }
      break;
      
    case "physical":
      if (functionalContext.physicalContext) {
        const physCtx = functionalContext.physicalContext;
        if (!physCtx.location) {
          throw new Error("Physical evidence must include location data");
        }
        // Validate location timestamp is recent (within 1 hour)
        const now = Date.now();
        if (now - physCtx.location.timestamp > 60 * 60 * 1000) {
          console.warn("Physical evidence location data is older than 1 hour");
        }
      }
      break;
  }
}

export const submitEvidence = mutation({
  args: {
    agentDid: v.string(),
    sha256: v.string(),
    uri: v.string(),
    signer: v.string(),
    model: v.object({
      provider: v.string(),
      name: v.string(),
      version: v.string(),
      seed: v.optional(v.number()),
      temp: v.optional(v.number()),
    }),
    tool: v.optional(v.string()),
    caseId: v.optional(v.id("cases")),
    
    // Functional type-specific evidence context
    functionalContext: v.optional(v.object({
      // Physical agent context
      physicalContext: v.optional(v.object({
        location: v.object({
          lat: v.number(),
          lng: v.number(),
          timestamp: v.number(),
          accuracy: v.optional(v.number()),
        }),
        sensorData: v.optional(v.object({
          type: v.string(),
          reading: v.any(),
          calibration: v.optional(v.any()),
        })),
        actuatorCommands: v.optional(v.object({
          device: v.string(),
          command: v.any(),
          executionResult: v.any(),
        })),
        environmentContext: v.optional(v.object({
          temperature: v.optional(v.number()),
          lighting: v.string(),
          weatherConditions: v.optional(v.string()),
          surroundingObjects: v.optional(v.array(v.string())),
        })),
      })),
      
      // Voice agent context
      voiceContext: v.optional(v.object({
        audioFileId: v.optional(v.string()),
        transcription: v.optional(v.string()),
        confidenceScore: v.optional(v.number()),
        languageDetected: v.optional(v.string()),
        emotionalTone: v.optional(v.string()),
        consentProof: v.optional(v.string()),
        privacyCompliance: v.array(v.string()),
      })),
      
      // Coding agent context
      codingContext: v.optional(v.object({
        repositoryUrl: v.optional(v.string()),
        commitHash: v.optional(v.string()),
        diffSize: v.optional(v.number()),
        languagesUsed: v.array(v.string()),
        securityScanResults: v.optional(v.any()),
        testCoverage: v.optional(v.number()),
        performanceBenchmarks: v.optional(v.any()),
        licenseCompliance: v.optional(v.boolean()),
      })),
      
      // Financial agent context
      financialContext: v.optional(v.object({
        transactionIds: v.array(v.string()),
        portfolioValue: v.optional(v.number()),
        riskAssessment: v.optional(v.any()),
        complianceChecks: v.array(v.string()),
        marketImpactAnalysis: v.optional(v.any()),
        auditTrail: v.optional(v.string()),
      })),
      
      // Healthcare agent context
      healthcareContext: v.optional(v.object({
        patientConsentId: v.optional(v.string()),
        hipaaCompliance: v.boolean(),
        medicalDataHashes: v.array(v.string()),
        diagnosisConfidence: v.optional(v.number()),
        medicalReferences: v.array(v.string()),
        humanOversightRequired: v.boolean(),
      })),
      
      // General context for other types
      generalContext: v.optional(v.object({
        inputTokens: v.optional(v.number()),
        outputTokens: v.optional(v.number()),
        processingTime: v.optional(v.number()),
        qualityMetrics: v.optional(v.any()),
        complianceFlags: v.array(v.string()),
      })),
    })),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Processing evidence submission for agent ${args.agentDid}`);
      
      // Check if agent exists and is active
      const agent = await ctx.db
        .query("agents")
        .withIndex("by_did", (q) => q.eq("did", args.agentDid))
        .first();

      if (!agent || agent.status !== "active") {
        throw new Error("Agent not found or not active");
      }

      // Check for duplicate evidence
      const existing = await ctx.db
        .query("evidenceManifests")
        .withIndex("by_sha256", (q) => q.eq("sha256", args.sha256))
        .first();

      if (existing) {
        throw new Error("Evidence with this hash already exists");
      }

      const now = Date.now();
      
      // Create the evidence manifest
      const manifest = {
        agentDid: args.agentDid,
        sha256: args.sha256,
        uri: args.uri,
        signer: args.signer,
        model: args.model,
        tool: args.tool,
        caseId: args.caseId,
        ts: now,
      };

      // Insert evidence manifest
      const evidenceId = await ctx.db.insert("evidenceManifests", manifest);

      // Create functional evidence context if provided
      if (args.functionalContext) {
        await ctx.db.insert("functionalEvidence", {
          evidenceId,
          agentDid: args.agentDid,
          functionalType: agent.functionalType || "general",
          physicalContext: args.functionalContext.physicalContext,
          voiceContext: args.functionalContext.voiceContext,
          codingContext: args.functionalContext.codingContext,
          financialContext: args.functionalContext.financialContext,
          healthcareContext: args.functionalContext.healthcareContext,
          generalContext: args.functionalContext.generalContext,
          createdAt: now,
        });
      }

      // Apply functional type-specific validation
      await validateFunctionalEvidence(ctx, agent.functionalType || "general", args.functionalContext);

      // Log event
      await ctx.db.insert("events", {
        type: "EVIDENCE_SUBMITTED",
        payload: {
          evidenceId,
          agentDid: args.agentDid,
          functionalType: agent.functionalType,
          sha256: args.sha256,
          caseId: args.caseId,
          hasContext: !!args.functionalContext,
        },
        timestamp: now,
        agentDid: args.agentDid,
        caseId: args.caseId,
      });

      console.info(`Evidence submitted successfully: ${evidenceId}`);
      return evidenceId;
      
    } catch (error) {
      console.error(`Evidence submission failed for agent ${args.agentDid}:`, error);
      throw new Error(`Evidence submission failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

export const getEvidence = query({
  args: { evidenceId: v.id("evidenceManifests") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.evidenceId);
  },
});

export const getEvidenceByCase = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("evidenceManifests")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();
  },
});

// Alias for clarity in frontend
export const getEvidenceByCaseId = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const evidenceManifests = await ctx.db
      .query("evidenceManifests")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();
    
    // Get functional evidence for each manifest
    const evidenceWithContext = await Promise.all(
      evidenceManifests.map(async (manifest) => {
        const functionalEvidence = await ctx.db
          .query("functionalEvidence")
          .withIndex("by_evidence", (q) => q.eq("evidenceId", manifest._id))
          .first();
        
        return {
          ...manifest,
          submittedBy: manifest.agentDid,
          submittedAt: manifest.ts,
          type: functionalEvidence?.functionalType || "general",
          data: functionalEvidence,
        };
      })
    );
    
    return evidenceWithContext;
  },
});

export const getEvidenceByAgent = query({
  args: { agentDid: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("evidenceManifests")
      .withIndex("by_agent", (q) => q.eq("agentDid", args.agentDid))
      .collect();
  },
});

export const getRecentEvidence = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("evidenceManifests")
      .withIndex("by_timestamp")
      .order("desc")
      .take(args.limit ?? 50);
  },
});

// Enhanced evidence queries for functional types
export const getFunctionalEvidence = query({
  args: { evidenceId: v.id("evidenceManifests") },
  handler: async (ctx, args) => {
    const baseEvidence = await ctx.db.get(args.evidenceId);
    
    const functionalEvidence = await ctx.db
      .query("functionalEvidence")
      .withIndex("by_evidence", (q) => q.eq("evidenceId", args.evidenceId))
      .first();
    
    return {
      ...baseEvidence,
      functionalContext: functionalEvidence,
    };
  },
});

export const getEvidenceByFunctionalType = query({
  args: { 
    functionalType: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const functionalEvidence = await ctx.db
      .query("functionalEvidence")
      .withIndex("by_functional_type", (q) => q.eq("functionalType", args.functionalType))
      .order("desc")
      .take(args.limit ?? 50);
    
    // Fetch base evidence for each functional evidence
    const evidenceWithContext = await Promise.all(
      functionalEvidence.map(async (funcEvidence) => {
        const baseEvidence = await ctx.db.get(funcEvidence.evidenceId);
        return {
          ...baseEvidence,
          functionalContext: funcEvidence,
        };
      })
    );
    
    return evidenceWithContext;
  },
});

export const getPhysicalEvidence = query({
  args: {
    agentDid: v.optional(v.string()),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      radius: v.number(), // in meters
    })),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let evidence;
    
    if (args.agentDid) {
      evidence = await ctx.db
        .query("functionalEvidence")
        .withIndex("by_agent", (q) => q.eq("agentDid", args.agentDid!))
        .collect();
    } else {
      evidence = await ctx.db
        .query("functionalEvidence")
        .withIndex("by_functional_type", (q) => q.eq("functionalType", "physical"))
        .collect();
    }
    
    // Filter by location if specified
    if (args.location) {
      evidence = evidence.filter((e) => {
        if (!e.physicalContext?.location) return false;
        
        const loc = e.physicalContext.location;
        const distance = Math.sqrt(
          Math.pow(loc.lat - args.location!.lat, 2) + 
          Math.pow(loc.lng - args.location!.lng, 2)
        ) * 111320; // Approximate meters per degree
        
        return distance <= args.location!.radius;
      });
    }
    
    return evidence.slice(0, args.limit ?? 20);
  },
});

export const getVoiceEvidence = query({
  args: {
    agentDid: v.optional(v.string()),
    language: v.optional(v.string()),
    privacyCompliant: v.optional(v.boolean()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let evidence;
    
    if (args.agentDid) {
      evidence = await ctx.db
        .query("functionalEvidence")
        .withIndex("by_agent", (q) => q.eq("agentDid", args.agentDid!))
        .collect();
    } else {
      evidence = await ctx.db
        .query("functionalEvidence")
        .withIndex("by_functional_type", (q) => q.eq("functionalType", "voice"))
        .collect();
    }
    
    // Filter by language if specified
    if (args.language) {
      evidence = evidence.filter((e) => 
        e.voiceContext?.languageDetected === args.language
      );
    }
    
    // Filter by privacy compliance if specified
    if (args.privacyCompliant !== undefined) {
      evidence = evidence.filter((e) => {
        const hasCompliance = (e.voiceContext?.privacyCompliance?.length || 0) > 0;
        return args.privacyCompliant ? hasCompliance : !hasCompliance;
      });
    }
    
    return evidence.slice(0, args.limit ?? 20);
  },
});

export const getCodingEvidence = query({
  args: {
    agentDid: v.optional(v.string()),
    language: v.optional(v.string()),
    securityCompliant: v.optional(v.boolean()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let evidence;
    
    if (args.agentDid) {
      evidence = await ctx.db
        .query("functionalEvidence")
        .withIndex("by_agent", (q) => q.eq("agentDid", args.agentDid!))
        .collect();
    } else {
      evidence = await ctx.db
        .query("functionalEvidence")
        .withIndex("by_functional_type", (q) => q.eq("functionalType", "coding"))
        .collect();
    }
    
    // Filter by programming language if specified
    if (args.language) {
      evidence = evidence.filter((e) => 
        e.codingContext?.languagesUsed?.includes(args.language!)
      );
    }
    
    // Filter by security compliance if specified
    if (args.securityCompliant !== undefined) {
      evidence = evidence.filter((e) => {
        const scanResults = e.codingContext?.securityScanResults;
        const isCompliant = scanResults !== false && 
          (!scanResults || !scanResults.vulnerabilities || scanResults.vulnerabilities === 0);
        return args.securityCompliant ? isCompliant : !isCompliant;
      });
    }
    
    return evidence.slice(0, args.limit ?? 20);
  },
});

export const getFinancialEvidence = query({
  args: {
    agentDid: v.optional(v.string()),
    minTransactionCount: v.optional(v.number()),
    complianceRequired: v.optional(v.boolean()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let evidence;
    
    if (args.agentDid) {
      evidence = await ctx.db
        .query("functionalEvidence")
        .withIndex("by_agent", (q) => q.eq("agentDid", args.agentDid!))
        .collect();
    } else {
      evidence = await ctx.db
        .query("functionalEvidence")
        .withIndex("by_functional_type", (q) => q.eq("functionalType", "financial"))
        .collect();
    }
    
    // Filter by minimum transaction count if specified
    if (args.minTransactionCount !== undefined) {
      evidence = evidence.filter((e) => 
        (e.financialContext?.transactionIds?.length || 0) >= args.minTransactionCount!
      );
    }
    
    // Filter by compliance requirements if specified
    if (args.complianceRequired !== undefined) {
      evidence = evidence.filter((e) => {
        const hasCompliance = (e.financialContext?.complianceChecks?.length || 0) > 0;
        return args.complianceRequired ? hasCompliance : !hasCompliance;
      });
    }
    
    return evidence.slice(0, args.limit ?? 20);
  },
});

export const getHealthcareEvidence = query({
  args: {
    agentDid: v.optional(v.string()),
    hipaaCompliant: v.optional(v.boolean()),
    requiresOversight: v.optional(v.boolean()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let evidence;
    
    if (args.agentDid) {
      evidence = await ctx.db
        .query("functionalEvidence")
        .withIndex("by_agent", (q) => q.eq("agentDid", args.agentDid!))
        .collect();
    } else {
      evidence = await ctx.db
        .query("functionalEvidence")
        .withIndex("by_functional_type", (q) => q.eq("functionalType", "healthcare"))
        .collect();
    }
    
    // Filter by HIPAA compliance if specified
    if (args.hipaaCompliant !== undefined) {
      evidence = evidence.filter((e) => 
        e.healthcareContext?.hipaaCompliance === args.hipaaCompliant
      );
    }
    
    // Filter by oversight requirements if specified
    if (args.requiresOversight !== undefined) {
      evidence = evidence.filter((e) => 
        e.healthcareContext?.humanOversightRequired === args.requiresOversight
      );
    }
    
    return evidence.slice(0, args.limit ?? 20);
  },
});

// Specialized evidence submission functions for common types
export const submitPhysicalEvidence = mutation({
  args: {
    agentDid: v.string(),
    sha256: v.string(),
    uri: v.string(),
    signer: v.string(),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      timestamp: v.number(),
      accuracy: v.optional(v.number()),
    }),
    sensorData: v.optional(v.object({
      type: v.string(),
      reading: v.any(),
      calibration: v.optional(v.any()),
    })),
    caseId: v.optional(v.id("cases")),
  },
  handler: async (ctx, args) => {
    // Create evidence manifest directly
    const evidenceId = await ctx.db.insert("evidenceManifests", {
      agentDid: args.agentDid,
      sha256: args.sha256,
      uri: args.uri,
      signer: args.signer,
      ts: Date.now(),
      model: {
        provider: "physical_device",
        name: "sensor_reading",
        version: "1.0",
      },
      tool: "physical_sensor",
      caseId: args.caseId,
    });

    return { evidenceId, success: true };
  },
});

export const submitVoiceEvidence = mutation({
  args: {
    agentDid: v.string(),
    sha256: v.string(),
    uri: v.string(),
    signer: v.string(),
    transcription: v.optional(v.string()),
    confidenceScore: v.optional(v.number()),
    languageDetected: v.optional(v.string()),
    consentProof: v.string(),
    privacyCompliance: v.array(v.string()),
    caseId: v.optional(v.id("cases")),
  },
  handler: async (ctx, args) => {
    // Create evidence manifest directly
    const evidenceId = await ctx.db.insert("evidenceManifests", {
      agentDid: args.agentDid,
      sha256: args.sha256,
      uri: args.uri,
      signer: args.signer,
      ts: Date.now(),
      model: {
        provider: "voice_ai",
        name: "speech_processing",
        version: "1.0",
      },
      tool: "voice_analysis",
      caseId: args.caseId,
    });

    return { evidenceId, success: true };
  },
});
