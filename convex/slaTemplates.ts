import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Pre-built Enterprise SLA Templates
// Common templates that enterprises can use immediately

// Create default enterprise SLA templates
export const createDefaultTemplates = mutation({
  args: { createdBy: v.string() },
  handler: async (ctx, args) => {
    try {
      console.info("Creating default enterprise SLA templates");
      
      const templates = [
        {
          templateId: "api_response_time_standard",
          name: "API Response Time - Standard",
          description: "Standard API response time SLA for enterprise services. 200ms response time with 99% availability.",
          serviceType: "api_service" as const,
          metrics: [
            {
              name: "response_time",
              displayName: "Average Response Time",
              threshold: 200,
              unit: "ms",
              operator: "less_than" as const,
              severity: "breach" as const,
              penalty: 100,
            },
            {
              name: "availability",
              displayName: "Service Availability",
              threshold: 99.0,
              unit: "percent",
              operator: "greater_than" as const,
              severity: "critical" as const,
              penalty: 500,
            },
          ],
          duration: 30 * 24 * 60 * 60 * 1000, // 30 days
          baseFee: 1000,
        },
        {
          templateId: "api_response_time_premium",
          name: "API Response Time - Premium", 
          description: "Premium API response time SLA for mission-critical services. 100ms response time with 99.9% availability.",
          serviceType: "api_service" as const,
          metrics: [
            {
              name: "response_time",
              displayName: "Average Response Time",
              threshold: 100,
              unit: "ms",
              operator: "less_than" as const,
              severity: "breach" as const,
              penalty: 200,
            },
            {
              name: "availability",
              displayName: "Service Availability", 
              threshold: 99.9,
              unit: "percent",
              operator: "greater_than" as const,
              severity: "critical" as const,
              penalty: 1000,
            },
          ],
          duration: 30 * 24 * 60 * 60 * 1000, // 30 days
          baseFee: 2500,
        },
        {
          templateId: "data_processing_standard",
          name: "Data Processing - Standard",
          description: "Standard data processing SLA. Complete analysis within 1 hour with 95% accuracy.",
          serviceType: "data_processing" as const,
          metrics: [
            {
              name: "processing_time",
              displayName: "Processing Time",
              threshold: 3600,
              unit: "seconds",
              operator: "less_than" as const,
              severity: "breach" as const,
              penalty: 150,
            },
            {
              name: "accuracy",
              displayName: "Data Accuracy",
              threshold: 95.0,
              unit: "percent",
              operator: "greater_than" as const,
              severity: "breach" as const,
              penalty: 300,
            },
            {
              name: "availability",
              displayName: "Service Availability",
              threshold: 98.0,
              unit: "percent", 
              operator: "greater_than" as const,
              severity: "critical" as const,
              penalty: 500,
            },
          ],
          duration: 30 * 24 * 60 * 60 * 1000, // 30 days
          baseFee: 800,
        },
        {
          templateId: "analysis_service_premium",
          name: "Analysis Service - Premium",
          description: "Premium analysis service with real-time processing. Results within 5 minutes with 98% accuracy.",
          serviceType: "analysis_service" as const,
          metrics: [
            {
              name: "processing_time",
              displayName: "Analysis Time",
              threshold: 300,
              unit: "seconds", 
              operator: "less_than" as const,
              severity: "breach" as const,
              penalty: 250,
            },
            {
              name: "accuracy",
              displayName: "Analysis Accuracy",
              threshold: 98.0,
              unit: "percent",
              operator: "greater_than" as const,
              severity: "breach" as const,
              penalty: 400,
            },
            {
              name: "throughput",
              displayName: "Requests Per Minute",
              threshold: 100,
              unit: "requests/min",
              operator: "greater_than" as const,
              severity: "warning" as const,
              penalty: 50,
            },
          ],
          duration: 30 * 24 * 60 * 60 * 1000, // 30 days
          baseFee: 1500,
        },
        {
          templateId: "content_generation_standard",
          name: "Content Generation - Standard",
          description: "Standard content generation SLA. High-quality content delivered within 30 minutes.",
          serviceType: "content_generation" as const,
          metrics: [
            {
              name: "delivery_time",
              displayName: "Content Delivery Time",
              threshold: 1800,
              unit: "seconds",
              operator: "less_than" as const,
              severity: "breach" as const,
              penalty: 100,
            },
            {
              name: "quality_score",
              displayName: "Content Quality Score",
              threshold: 85.0,
              unit: "percent",
              operator: "greater_than" as const,
              severity: "breach" as const,
              penalty: 200,
            },
            {
              name: "availability",
              displayName: "Service Availability",
              threshold: 99.0,
              unit: "percent",
              operator: "greater_than" as const,
              severity: "critical" as const,
              penalty: 400,
            },
          ],
          duration: 30 * 24 * 60 * 60 * 1000, // 30 days
          baseFee: 600,
        },
        {
          templateId: "monitoring_service_enterprise", 
          name: "Monitoring Service - Enterprise",
          description: "Enterprise monitoring with real-time alerts and 99.95% uptime guarantee.",
          serviceType: "monitoring_service" as const,
          metrics: [
            {
              name: "availability",
              displayName: "Monitoring Uptime",
              threshold: 99.95,
              unit: "percent",
              operator: "greater_than" as const,
              severity: "critical" as const,
              penalty: 1000,
            },
            {
              name: "alert_delay",
              displayName: "Alert Response Time",
              threshold: 30,
              unit: "seconds",
              operator: "less_than" as const,
              severity: "breach" as const,
              penalty: 300,
            },
            {
              name: "false_positive_rate",
              displayName: "False Positive Rate",
              threshold: 2.0,
              unit: "percent",
              operator: "less_than" as const,
              severity: "warning" as const,
              penalty: 100,
            },
          ],
          duration: 90 * 24 * 60 * 60 * 1000, // 90 days
          baseFee: 2000,
        },
      ];
      
      const createdTemplates = [];
      
      for (const template of templates) {
        // Check if template already exists
        const existing = await ctx.db
          .query("slaTemplates")
          .withIndex("by_template_id", (q) => q.eq("templateId", template.templateId))
          .first();
          
        if (existing) {
          console.info(`Template ${template.templateId} already exists, skipping`);
          createdTemplates.push(existing._id);
          continue;
        }
        
        const templateId = await ctx.runMutation(api.contracts.createSLATemplate, {
          ...template,
          createdBy: args.createdBy,
        });
        
        createdTemplates.push(templateId);
      }
      
      console.info(`Created ${createdTemplates.length} SLA templates`);
      return createdTemplates;
      
    } catch (error) {
      console.error("Failed to create default templates:", error);
      throw new Error(`Default template creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Get popular SLA templates
export const getPopularTemplates = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("slaTemplates")
      .withIndex("by_active", (q) => q.eq("active", true))
      .filter((q) => q.neq(q.field("serviceType"), "custom"))
      .take(args.limit || 10);
  },
});

// Get templates by service type
export const getTemplatesByType = query({
  args: { 
    serviceType: v.union(
      v.literal("api_service"),
      v.literal("data_processing"), 
      v.literal("analysis_service"),
      v.literal("content_generation"),
      v.literal("monitoring_service"),
      v.literal("integration_service")
    ),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("slaTemplates")
      .withIndex("by_service_type", (q) => q.eq("serviceType", args.serviceType))
      .filter((q) => q.eq(q.field("active"), true))
      .take(args.limit || 20);
  },
});

// Template recommendation based on agent capabilities
export const recommendTemplates = query({
  args: { 
    agentDid: v.string(),
    serviceType: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // Get agent details to understand capabilities
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_did", (q) => q.eq("did", args.agentDid))
      .first();
      
    if (!agent) {
      return [];
    }
    
    // Get templates that match the agent's functional type or service type
    let templates = await ctx.db
      .query("slaTemplates")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    
    if (args.serviceType) {
      templates = templates.filter(t => t.serviceType === args.serviceType);
    } else {
      // Filter based on agent's functional type
      const functionalTypeMapping: Record<string, string[]> = {
        "api": ["api_service", "integration_service"],
        "data": ["data_processing", "analysis_service"],
        "writing": ["content_generation"],
        "coding": ["api_service", "integration_service"],
        "financial": ["analysis_service", "monitoring_service"],
        "research": ["analysis_service", "data_processing"],
        "general": ["api_service", "data_processing"],
      };
      
      const relevantTypes = functionalTypeMapping[agent.functionalType] || ["api_service"];
      templates = templates.filter(t => relevantTypes.includes(t.serviceType));
    }
    
    // Sort by suitability (simpler templates first for new agents)
    if (agent.citizenshipTier === "session" || agent.citizenshipTier === "ephemeral") {
      templates.sort((a, b) => a.metrics.length - b.metrics.length);
    } else {
      // For verified/premium agents, show more comprehensive templates
      templates.sort((a, b) => b.metrics.length - a.metrics.length);
    }
    
    return templates.slice(0, args.limit || 5);
  },
});

// Quick contract creation from template
export const createContractFromTemplate = mutation({
  args: {
    templateId: v.string(),
    providerAgent: v.string(),
    consumerAgent: v.string(),
    customizations: v.optional(v.object({
      duration: v.optional(v.number()),
      metrics: v.optional(v.array(v.object({
        name: v.string(),
        threshold: v.number(),
        penalty: v.optional(v.number()),
      }))),
      escrowAmount: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Creating contract from template ${args.templateId}`);
      
      // Get template
      const template = await ctx.db
        .query("slaTemplates")
        .withIndex("by_template_id", (q) => q.eq("templateId", args.templateId))
        .first();
        
      if (!template) {
        throw new Error(`Template ${args.templateId} not found`);
      }
      
      // Generate unique contract ID
      const contractId = `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Apply customizations if provided
      let customMetrics;
      if (args.customizations?.metrics) {
        customMetrics = template.metrics.map(m => {
          const customization = args.customizations!.metrics!.find(cm => cm.name === m.name);
          return customization ? {
            ...m,
            threshold: customization.threshold,
            penalty: customization.penalty || m.penalty,
          } : m;
        });
      }
      
      // Create the contract
      const contractDbId = await ctx.runMutation(api.contracts.createContract, {
        contractId,
        templateId: template._id,
        providerAgent: args.providerAgent,
        consumerAgent: args.consumerAgent,
        customMetrics,
        duration: args.customizations?.duration,
        escrowAmount: args.customizations?.escrowAmount,
      });
      
      console.info(`Contract created from template: ${contractDbId}`);
      return {
        contractId: contractDbId,
        contractPublicId: contractId,
        templateUsed: template.name,
      };
      
    } catch (error) {
      console.error(`Failed to create contract from template:`, error);
      throw new Error(`Contract creation from template failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});
