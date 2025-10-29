import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { createCustodyEvent } from "./custody";
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

      // DEPRECATED: Functional evidence table removed during schema consolidation
      // if (args.functionalContext) {
      //   await ctx.db.insert("functionalEvidence", {
      //     evidenceId,
      //     agentDid: args.agentDid,
      //     functionalType: agent.functionalType || "general",
      //     ...args.functionalContext,
      //     createdAt: now,
      //   });
      // }

      // Apply functional type-specific validation
      await validateFunctionalEvidence(ctx, agent.functionalType || "general", args.functionalContext);

      // Log custody event
      if (args.caseId) {
        await createCustodyEvent(ctx, {
          type: "EVIDENCE_SUBMITTED",
          caseId: args.caseId,
          agentDid: args.agentDid,
          payload: {
            evidenceId,
            evidenceType: args.tool || "UNKNOWN",
            functionalType: agent.functionalType,
            sha256: args.sha256,
            hasContext: !!args.functionalContext,
          },
        });
      }

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
    // DEPRECATED: Functional evidence table removed, return manifests directly
    const evidenceWithContext = await Promise.all(
      evidenceManifests.map(async (manifest) => {
        return {
          ...manifest,
          submittedBy: manifest.agentDid,
          submittedAt: manifest.ts,
          type: "general", // Default type since functionalEvidence table removed
          data: null, // No functional evidence data available
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

// DEPRECATED: Functional evidence table removed during schema consolidation
export const getFunctionalEvidence = query({
  args: { evidenceId: v.id("evidenceManifests") },
  handler: async (ctx, args) => {
    const baseEvidence = await ctx.db.get(args.evidenceId);
    return {
      ...baseEvidence,
      functionalContext: null, // Functional evidence table removed
    };
  },
});

// DEPRECATED: Functional evidence table removed during schema consolidation
export const getEvidenceByFunctionalType = query({
  args: {
    functionalType: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // Functional evidence table removed - return empty array
    console.warn("DEPRECATED: getEvidenceByFunctionalType called. Functional evidence table no longer exists.");
    return [];
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
    // DEPRECATED: Functional evidence table removed
    console.warn("DEPRECATED: getPhysicalEvidence called. Functional evidence table no longer exists.");
    return [];
  },
});

// DEPRECATED: Functional evidence table removed during schema consolidation
export const getVoiceEvidence = query({
  args: {
    agentDid: v.optional(v.string()),
    language: v.optional(v.string()),
    privacyCompliant: v.optional(v.boolean()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    console.warn("DEPRECATED: getVoiceEvidence called. Functional evidence table no longer exists.");
    return [];
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
    // DEPRECATED: Functional evidence table removed
    console.warn("DEPRECATED: getCodingEvidence called. Functional evidence table no longer exists.");
    return [];
  },
});

// DEPRECATED: Functional evidence table removed during schema consolidation
export const getFinancialEvidence = query({
  args: {
    agentDid: v.optional(v.string()),
    minTransactionCount: v.optional(v.number()),
    complianceRequired: v.optional(v.boolean()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // DEPRECATED: Functional evidence table removed
    console.warn("DEPRECATED: getFinancialEvidence called. Functional evidence table no longer exists.");
    return [];
  },
});

// DEPRECATED: Functional evidence table removed during schema consolidation
export const getHealthcareEvidence = query({
  args: {
    agentDid: v.optional(v.string()),
    hipaaCompliant: v.optional(v.boolean()),
    requiresOversight: v.optional(v.boolean()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // DEPRECATED: Functional evidence table removed
    console.warn("DEPRECATED: getHealthcareEvidence called. Functional evidence table no longer exists.");
    return [];
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
