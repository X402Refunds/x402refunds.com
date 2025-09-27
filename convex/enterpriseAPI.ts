import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Enterprise-friendly API layer that hides governance terminology
// Presents the powerful backend as simple "Agent Dispute Resolution Platform"

// Register Enterprise Agent - Simple agent registration without governance complexity  
export const registerAgent = mutation({
  args: {
    agentId: v.string(),
    enterpriseId: v.string(),
    agentType: v.union(
      v.literal("api_service"),
      v.literal("data_processor"),
      v.literal("analyst"),
      v.literal("content_creator"),
      v.literal("monitor"),
      v.literal("integration"),
      v.literal("general")
    ),
    capabilities: v.array(v.string()),
    contactInfo: v.optional(v.object({
      email: v.string(),
      webhook: v.optional(v.string()),
    })),
    tier: v.optional(v.union(v.literal("basic"), v.literal("professional"), v.literal("enterprise"))),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Registering enterprise agent: ${args.agentId}`);
      
      // Map enterprise types to internal functional types
      const functionalTypeMapping: Record<string, string> = {
        "api_service": "api",
        "data_processor": "data", 
        "analyst": "research",
        "content_creator": "writing",
        "monitor": "security",
        "integration": "devops",
        "general": "general",
      };
      
      // Map enterprise tiers to internal citizenship tiers
      const citizenshipMapping: Record<string, string> = {
        "basic": "verified",
        "professional": "verified", 
        "enterprise": "premium",
      };
      
      const tier = args.tier || "basic";
      const citizenshipTier = citizenshipMapping[tier];
      const functionalType = functionalTypeMapping[args.agentType];
      
      // Create owner if doesn't exist
      let owner = await ctx.db
        .query("owners")
        .withIndex("by_did", (q) => q.eq("did", args.enterpriseId))
        .first();
        
      if (!owner) {
        await ctx.db.insert("owners", {
          did: args.enterpriseId,
          verificationTier: tier === "enterprise" ? "premium" : "verified",
          pubkeys: [],
          createdAt: Date.now(),
        });
      }
      
      // Register agent using internal system
      const agentId = await ctx.runMutation(api.agents.joinAgent, {
        did: args.agentId,
        ownerDid: args.enterpriseId,
        citizenshipTier: citizenshipTier as any,
        functionalType: functionalType as any,
        specialization: {
          capabilities: args.capabilities,
          certifications: [],
          specializations: [args.agentType],
          experienceLevel: tier,
        },
        stake: tier === "enterprise" ? 10000 : (tier === "professional" ? 5000 : 1000),
      });
      
      // Create agent service registry entry
      await ctx.db.insert("agentServices", {
        serviceId: `service_${args.agentId}`,
        agentDid: args.agentId,
        name: `${args.agentType.replace('_', ' ')} Service`,
        description: `Enterprise ${args.agentType} service provided by ${args.enterpriseId}`,
        serviceType: args.agentType,
        capabilities: args.capabilities,
        requirements: [],
        supportedMetrics: getDefaultMetrics(args.agentType),
        availableSLAs: [], // Will be populated based on service type
        totalCompletedContracts: 0,
        breachRate: 0,
        active: true,
        maxConcurrentContracts: tier === "enterprise" ? 100 : (tier === "professional" ? 50 : 10),
        currentActiveContracts: 0,
        tags: [args.agentType, tier],
        searchable: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      // Initialize reputation
      await ctx.db.insert("agentReputation", {
        agentDid: args.agentId,
        overallScore: 500, // Start at neutral score
        trustLevel: "new",
        domainScores: {
          reliability: 500,
          performance: 500,
          communication: 500,
          innovation: 500,
        },
        totalContracts: 0,
        completedContracts: 0,
        breachedContracts: 0,
        disputedContracts: 0,
        recentPerformance: 500,
        quarterlyTrend: "stable",
        partnerScores: [],
        badges: [],
        certifications: args.tier === "enterprise" ? [args.agentType.toUpperCase() + "_CERTIFIED"] : [],
        lastCalculated: Date.now(),
        calculationVersion: "1.0.0",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      console.info(`Enterprise agent registered: ${agentId}`);
      return {
        agentId: agentId,
        status: "registered",
        tier: tier,
        capabilities: args.capabilities,
        availableTemplates: getRecommendedTemplates(args.agentType),
      };
      
    } catch (error) {
      console.error(`Failed to register enterprise agent:`, error);
      throw new Error(`Agent registration failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Create SLA Agreement - Simple contract creation
export const createSLA = mutation({
  args: {
    providerAgentId: v.string(),
    consumerAgentId: v.string(),
    templateType: v.string(),
    customMetrics: v.optional(v.array(v.object({
      name: v.string(),
      threshold: v.number(),
      unit: v.string(),
      penalty: v.optional(v.number()),
    }))),
    duration: v.optional(v.number()), // in days
    budget: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Creating SLA between ${args.providerAgentId} and ${args.consumerAgentId}`);
      
      // Get recommended template
      const template = await ctx.db
        .query("slaTemplates")
        .withIndex("by_template_id", (q) => q.eq("templateId", args.templateType))
        .first();
        
      if (!template) {
        // Use default template based on service type
        const templates = await ctx.runQuery(api.slaTemplates.getPopularTemplates, { limit: 1 });
        if (templates.length === 0) {
          throw new Error("No SLA templates available");
        }
      }
      
      // Convert duration from days to milliseconds
      const durationMs = args.duration ? args.duration * 24 * 60 * 60 * 1000 : undefined;
      
      const contractResult = await ctx.runMutation(api.slaTemplates.createContractFromTemplate, {
        templateId: args.templateType,
        providerAgent: args.providerAgentId,
        consumerAgent: args.consumerAgentId,
        customizations: {
          duration: durationMs,
          metrics: args.customMetrics?.map(m => ({
            name: m.name,
            threshold: m.threshold,
            penalty: m.penalty,
          })),
          escrowAmount: args.budget,
        },
      });
      
      // Activate the contract (simplified flow for enterprises)
      await ctx.db.patch(contractResult.contractId, {
        status: "active",
        signedAt: Date.now(),
      });
      
      console.info(`SLA contract created and activated: ${contractResult.contractPublicId}`);
      return {
        contractId: contractResult.contractPublicId,
        templateUsed: contractResult.templateUsed,
        status: "active",
        providerAgent: args.providerAgentId,
        consumerAgent: args.consumerAgentId,
      };
      
    } catch (error) {
      console.error(`Failed to create SLA:`, error);
      throw new Error(`SLA creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Submit Performance Data - Report performance metrics
export const reportPerformance = mutation({
  args: {
    contractId: v.string(),
    agentId: v.string(),
    metrics: v.array(v.object({
      name: v.string(),
      value: v.number(),
      unit: v.string(),
      timestamp: v.optional(v.number()),
    })),
    evidenceUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Reporting performance for contract ${args.contractId}`);
      
      // Get contract by public ID
      const contract = await ctx.db
        .query("slaContracts")
        .withIndex("by_contract_id", (q) => q.eq("contractId", args.contractId))
        .first();
        
      if (!contract) {
        throw new Error(`Contract ${args.contractId} not found`);
      }
      
      const results = [];
      
      for (const metric of args.metrics) {
        const result = await ctx.runMutation(api.contracts.submitPerformanceMetric, {
          contractId: contract._id,
          agentDid: args.agentId,
          metricName: metric.name,
          value: metric.value,
          unit: metric.unit,
          source: "agent_self_report",
          evidenceUri: args.evidenceUrl,
        });
        
        results.push({
          metric: metric.name,
          value: metric.value,
          breachDetected: result.breachDetected,
          severity: result.breachSeverity,
        });
      }
      
      console.info(`Performance reported for ${args.metrics.length} metrics`);
      return {
        contractId: args.contractId,
        metricsProcessed: results.length,
        results: results,
        status: "processed",
      };
      
    } catch (error) {
      console.error(`Failed to report performance:`, error);
      throw new Error(`Performance reporting failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Get Contract Status - Check SLA performance and disputes
export const getContractStatus = query({
  args: { contractId: v.string() },
  handler: async (ctx, args) => {
    const contract = await ctx.db
      .query("slaContracts")
      .withIndex("by_contract_id", (q) => q.eq("contractId", args.contractId))
      .first();
      
    if (!contract) {
      return null;
    }
    
    // Get recent performance
    const recentMetrics = await ctx.db
      .query("performanceMetrics")
      .withIndex("by_contract", (q) => q.eq("contractId", contract._id))
      .order("desc")
      .take(50);
    
    // Get active breaches
    const activeBreaches = await ctx.db
      .query("slaBreaches")
      .withIndex("by_contract", (q) => q.eq("contractId", contract._id))
      .filter((q) => q.neq(q.field("status"), "resolved"))
      .collect();
    
    // Calculate performance summary
    const performanceSummary = calculatePerformanceSummary(contract, recentMetrics);
    
    return {
      contractId: args.contractId,
      status: contract.status,
      providerAgent: contract.providerAgent,
      consumerAgent: contract.consumerAgent,
      serviceType: contract.serviceType,
      startDate: contract.startDate,
      endDate: contract.endDate,
      performance: performanceSummary,
      activeBreaches: activeBreaches.length,
      totalInteractions: contract.totalInteractions,
      successRate: contract.totalInteractions > 0 ? 
        (contract.successfulInteractions / contract.totalInteractions * 100) : 0,
      hasActiveDispute: !!contract.activeDispute,
    };
  },
});

// Get Agent Reputation - Check agent reliability scores
export const getAgentReputation = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    const reputation = await ctx.db
      .query("agentReputation")
      .withIndex("by_agent", (q) => q.eq("agentDid", args.agentId))
      .first();
      
    if (!reputation) {
      return null;
    }
    
    // Get recent contracts
    const recentContracts = await ctx.db
      .query("slaContracts")
      .withIndex("by_provider", (q) => q.eq("providerAgent", args.agentId))
      .order("desc")
      .take(10);
    
    return {
      agentId: args.agentId,
      overallScore: reputation.overallScore,
      trustLevel: reputation.trustLevel,
      reliability: reputation.domainScores.reliability,
      performance: reputation.domainScores.performance,
      communication: reputation.domainScores.communication,
      totalContracts: reputation.totalContracts,
      completedContracts: reputation.completedContracts,
      successRate: reputation.totalContracts > 0 ? 
        (reputation.completedContracts / reputation.totalContracts * 100) : 0,
      breachRate: reputation.totalContracts > 0 ? 
        (reputation.breachedContracts / reputation.totalContracts * 100) : 0,
      badges: reputation.badges,
      certifications: reputation.certifications,
      trend: reputation.quarterlyTrend,
      recentContracts: recentContracts.map(c => ({
        contractId: c.contractId,
        status: c.status,
        serviceType: c.serviceType,
        startDate: c.startDate,
        successRate: c.totalInteractions > 0 ? (c.successfulInteractions / c.totalInteractions * 100) : 0,
      })),
    };
  },
});

// Discover Services - Find available agent services
export const discoverServices = query({
  args: {
    serviceType: v.optional(v.string()),
    capabilities: v.optional(v.array(v.string())),
    minReputation: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let services = await ctx.db
      .query("agentServices")
      .withIndex("by_active", (q) => q.eq("active", true))
      .filter((q) => q.eq(q.field("searchable"), true))
      .collect();
    
    // Filter by service type
    if (args.serviceType) {
      services = services.filter(s => s.serviceType === args.serviceType);
    }
    
    // Filter by capabilities
    if (args.capabilities) {
      services = services.filter(s => 
        args.capabilities!.some(cap => s.capabilities.includes(cap))
      );
    }
    
    // Get reputation scores and filter
    const servicesWithReputation = await Promise.all(
      services.map(async (service) => {
        const reputation = await ctx.db
          .query("agentReputation")
          .withIndex("by_agent", (q) => q.eq("agentDid", service.agentDid))
          .first();
        
        return {
          ...service,
          reputation: reputation?.overallScore || 0,
          trustLevel: reputation?.trustLevel || "new",
        };
      })
    );
    
    // Filter by minimum reputation
    let filteredServices = servicesWithReputation;
    if (args.minReputation) {
      filteredServices = servicesWithReputation.filter(s => s.reputation >= args.minReputation!);
    }
    
    // Sort by reputation score (highest first)
    filteredServices.sort((a, b) => b.reputation - a.reputation);
    
    return filteredServices.slice(0, args.limit || 20).map(s => ({
      agentId: s.agentDid,
      serviceType: s.serviceType,
      name: s.name,
      description: s.description,
      capabilities: s.capabilities,
      reputation: s.reputation,
      trustLevel: s.trustLevel,
      averageResponseTime: s.averageResponseTime,
      uptimePercentage: s.uptimePercentage,
      totalContracts: s.totalCompletedContracts,
      breachRate: s.breachRate,
      availableSlots: s.maxConcurrentContracts ? 
        Math.max(0, s.maxConcurrentContracts - s.currentActiveContracts) : null,
    }));
  },
});

// Helper functions
function getDefaultMetrics(serviceType: string): string[] {
  const metricMapping: Record<string, string[]> = {
    "api_service": ["response_time", "availability", "throughput"],
    "data_processor": ["processing_time", "accuracy", "availability"],
    "analyst": ["processing_time", "accuracy", "thoroughness"],
    "content_creator": ["delivery_time", "quality_score", "availability"],
    "monitor": ["availability", "alert_delay", "false_positive_rate"],
    "integration": ["response_time", "availability", "error_rate"],
    "general": ["response_time", "availability"],
  };
  
  return metricMapping[serviceType] || ["response_time", "availability"];
}

function getRecommendedTemplates(serviceType: string): string[] {
  const templateMapping: Record<string, string[]> = {
    "api_service": ["api_response_time_standard", "api_response_time_premium"],
    "data_processor": ["data_processing_standard"],
    "analyst": ["analysis_service_premium"],
    "content_creator": ["content_generation_standard"],
    "monitor": ["monitoring_service_enterprise"],
    "integration": ["api_response_time_standard"],
    "general": ["api_response_time_standard", "data_processing_standard"],
  };
  
  return templateMapping[serviceType] || ["api_response_time_standard"];
}

function calculatePerformanceSummary(contract: any, metrics: any[]) {
  if (metrics.length === 0) {
    return { summary: "No data", metrics: [] };
  }
  
  const metricSummary: Record<string, { latest: number, average: number, breaches: number }> = {};
  
  for (const metric of metrics) {
    if (!metricSummary[metric.metricName]) {
      metricSummary[metric.metricName] = { latest: 0, average: 0, breaches: 0 };
    }
    
    metricSummary[metric.metricName].latest = metric.value;
    if (metric.breachDetected) {
      metricSummary[metric.metricName].breaches++;
    }
  }
  
  // Calculate averages
  const metricGroups: Record<string, number[]> = {};
  for (const metric of metrics) {
    if (!metricGroups[metric.metricName]) {
      metricGroups[metric.metricName] = [];
    }
    metricGroups[metric.metricName].push(metric.value);
  }
  
  for (const [name, values] of Object.entries(metricGroups)) {
    metricSummary[name].average = values.reduce((a, b) => a + b, 0) / values.length;
  }
  
  return {
    summary: contract.breachCount === 0 ? "Performing well" : 
             contract.breachCount < 5 ? "Minor issues" : "Needs attention",
    metrics: Object.entries(metricSummary).map(([name, data]) => ({
      name,
      latest: data.latest,
      average: data.average,
      breaches: data.breaches,
    })),
  };
}
