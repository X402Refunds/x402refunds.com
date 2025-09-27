import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Enterprise SLA Contract Management System
// Uses existing dispute resolution infrastructure with enterprise-friendly interface

// Create SLA Template - Pre-built contract templates for common enterprise scenarios
export const createSLATemplate = mutation({
  args: {
    templateId: v.string(),
    name: v.string(),
    description: v.string(),
    serviceType: v.union(
      v.literal("api_service"),
      v.literal("data_processing"), 
      v.literal("analysis_service"),
      v.literal("content_generation"),
      v.literal("monitoring_service"),
      v.literal("integration_service"),
      v.literal("custom")
    ),
    metrics: v.array(v.object({
      name: v.string(),
      displayName: v.string(),
      threshold: v.number(),
      unit: v.string(),
      operator: v.union(v.literal("less_than"), v.literal("greater_than"), v.literal("equals")),
      severity: v.union(v.literal("warning"), v.literal("breach"), v.literal("critical")),
      penalty: v.number(),
    })),
    duration: v.number(),
    autoRenewal: v.optional(v.boolean()),
    baseFee: v.optional(v.number()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Creating SLA template: ${args.templateId}`);
      
      // Check if template already exists
      const existing = await ctx.db
        .query("slaTemplates")
        .withIndex("by_template_id", (q) => q.eq("templateId", args.templateId))
        .first();
        
      if (existing) {
        throw new Error(`SLA template ${args.templateId} already exists`);
      }
      
      const now = Date.now();
      
      const templateData = {
        templateId: args.templateId,
        name: args.name,
        description: args.description,
        serviceType: args.serviceType,
        metrics: args.metrics,
        duration: args.duration,
        autoRenewal: args.autoRenewal ?? false,
        gracePeriod: 5 * 60 * 1000, // 5 minutes default grace period
        baseFee: args.baseFee,
        penaltyStructure: "flat" as const,
        maxPenalty: args.baseFee ? args.baseFee * 0.5 : 1000, // Max 50% of base fee
        createdBy: args.createdBy,
        version: "1.0.0",
        active: true,
        createdAt: now,
        updatedAt: now,
      };
      
      const templateId = await ctx.db.insert("slaTemplates", templateData);
      
      console.info(`SLA template created: ${templateId}`);
      return templateId;
      
    } catch (error) {
      console.error(`Failed to create SLA template ${args.templateId}:`, error);
      throw new Error(`SLA template creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Create Contract - Create active SLA contract between two agents
export const createContract = mutation({
  args: {
    contractId: v.string(),
    templateId: v.id("slaTemplates"),
    providerAgent: v.string(),
    consumerAgent: v.string(),
    customMetrics: v.optional(v.array(v.object({
      name: v.string(),
      displayName: v.string(),
      threshold: v.number(),
      unit: v.string(),
      operator: v.string(),
      severity: v.string(),
      penalty: v.number(),
    }))),
    duration: v.optional(v.number()),
    escrowAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Creating SLA contract: ${args.contractId}`);
      
      // Verify template exists
      const template = await ctx.db.get(args.templateId);
      if (!template) {
        throw new Error(`SLA template ${args.templateId} not found`);
      }
      
      // Verify both agents exist and are active
      const provider = await ctx.db
        .query("agents")
        .withIndex("by_did", (q) => q.eq("did", args.providerAgent))
        .first();
        
      const consumer = await ctx.db
        .query("agents")
        .withIndex("by_did", (q) => q.eq("did", args.consumerAgent))
        .first();
        
      if (!provider || provider.status !== "active") {
        throw new Error(`Provider agent ${args.providerAgent} not found or inactive`);
      }
      
      if (!consumer || consumer.status !== "active") {
        throw new Error(`Consumer agent ${args.consumerAgent} not found or inactive`);
      }
      
      const now = Date.now();
      const contractDuration = args.duration || template.duration;
      const endDate = now + contractDuration;
      
      // Use custom metrics if provided, otherwise use template metrics
      const metrics = args.customMetrics || template.metrics.map(m => ({
        name: m.name,
        displayName: m.displayName,
        threshold: m.threshold,
        unit: m.unit,
        operator: m.operator,
        severity: m.severity,
        penalty: m.penalty,
      }));
      
      const contractData = {
        contractId: args.contractId,
        templateId: args.templateId,
        providerAgent: args.providerAgent,
        consumerAgent: args.consumerAgent,
        serviceType: template.serviceType,
        metrics,
        status: "pending" as const,
        startDate: now,
        endDate,
        totalInteractions: 0,
        successfulInteractions: 0,
        breachCount: 0,
        totalPaid: 0,
        totalPenalties: 0,
        escrowAmount: args.escrowAmount,
        activeDispute: undefined,
        disputeHistory: [],
        createdAt: now,
        updatedAt: now,
      };
      
      const contractId = await ctx.db.insert("slaContracts", contractData);
      
      // Log contract creation event
      await ctx.db.insert("events", {
        type: "CONTRACT_CREATED",
        payload: {
          contractId: args.contractId,
          templateId: args.templateId,
          providerAgent: args.providerAgent,
          consumerAgent: args.consumerAgent,
          serviceType: template.serviceType,
          duration: contractDuration,
        },
        timestamp: now,
      });
      
      console.info(`SLA contract created: ${contractId}`);
      return contractId;
      
    } catch (error) {
      console.error(`Failed to create contract ${args.contractId}:`, error);
      throw new Error(`Contract creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Submit Performance Metric - Submit performance data for SLA monitoring
export const submitPerformanceMetric = mutation({
  args: {
    contractId: v.id("slaContracts"),
    agentDid: v.string(),
    metricName: v.string(),
    value: v.number(),
    unit: v.string(),
    source: v.union(
      v.literal("agent_self_report"),
      v.literal("third_party_monitor"), 
      v.literal("automated_system"),
      v.literal("manual_verification")
    ),
    evidenceUri: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Submitting performance metric for contract ${args.contractId}`);
      
      // Get contract details
      const contract = await ctx.db.get(args.contractId);
      if (!contract) {
        throw new Error(`Contract ${args.contractId} not found`);
      }
      
      if (contract.status !== "active") {
        throw new Error(`Contract ${args.contractId} is not active`);
      }
      
      // Verify agent is party to this contract
      if (args.agentDid !== contract.providerAgent && args.agentDid !== contract.consumerAgent) {
        throw new Error(`Agent ${args.agentDid} is not party to contract ${args.contractId}`);
      }
      
      const now = Date.now();
      
      // Create evidence if URI provided
      let evidenceId: string | undefined;
      if (args.evidenceUri) {
        const agent = await ctx.db
          .query("agents")
          .withIndex("by_did", (q) => q.eq("did", args.agentDid))
          .first();
          
        if (agent) {
          evidenceId = await ctx.db.insert("evidenceManifests", {
            agentDid: args.agentDid,
            sha256: `perf_${args.contractId}_${args.metricName}_${now}`,
            uri: args.evidenceUri,
            signer: args.agentDid,
            ts: now,
            model: {
              provider: "system",
              name: "performance-monitor",
              version: "1.0.0",
            },
            tool: "sla-monitor",
          });
        }
      }
      
      // Find the relevant metric from contract
      const contractMetric = contract.metrics.find(m => m.name === args.metricName);
      if (!contractMetric) {
        throw new Error(`Metric ${args.metricName} not found in contract`);
      }
      
      // Check for SLA breach
      let breachDetected = false;
      let breachSeverity: "warning" | "breach" | "critical" | undefined;
      
      switch (contractMetric.operator) {
        case "less_than":
          breachDetected = args.value >= contractMetric.threshold;
          break;
        case "greater_than":
          breachDetected = args.value <= contractMetric.threshold;
          break;
        case "equals":
          breachDetected = Math.abs(args.value - contractMetric.threshold) > 0.001;
          break;
      }
      
      if (breachDetected) {
        breachSeverity = contractMetric.severity as "warning" | "breach" | "critical";
      }
      
      // Insert performance metric
      const metricId = await ctx.db.insert("performanceMetrics", {
        contractId: args.contractId,
        agentDid: args.agentDid,
        metricName: args.metricName,
        value: args.value,
        unit: args.unit,
        timestamp: now,
        evidenceId: evidenceId as any,
        source: args.source,
        verified: args.source === "third_party_monitor" || args.source === "automated_system",
        breachDetected,
        breachSeverity,
        breachHandled: false,
        createdAt: now,
      });
      
      // Update contract with latest metric value
      const updatedMetrics = contract.metrics.map(m => 
        m.name === args.metricName 
          ? { ...m, currentValue: args.value, lastMeasured: now }
          : m
      );
      
      await ctx.db.patch(args.contractId, {
        metrics: updatedMetrics,
        totalInteractions: contract.totalInteractions + 1,
        successfulInteractions: breachDetected ? contract.successfulInteractions : contract.successfulInteractions + 1,
        updatedAt: now,
      });
      
      // Handle SLA breach if detected
      if (breachDetected && breachSeverity) {
        await ctx.runMutation(api.contracts.handleSLABreach, {
          contractId: args.contractId,
          metricName: args.metricName,
          thresholdValue: contractMetric.threshold,
          actualValue: args.value,
          severity: breachSeverity,
          evidenceIds: evidenceId ? [evidenceId as any] : [],
        });
      }
      
      console.info(`Performance metric submitted: ${metricId}`);
      return {
        metricId,
        breachDetected,
        breachSeverity,
      };
      
    } catch (error) {
      console.error(`Failed to submit performance metric:`, error);
      throw new Error(`Performance metric submission failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Handle SLA Breach - Process detected SLA breach and trigger dispute resolution if needed
export const handleSLABreach = mutation({
  args: {
    contractId: v.id("slaContracts"),
    metricName: v.string(),
    thresholdValue: v.number(),
    actualValue: v.number(),
    severity: v.union(v.literal("warning"), v.literal("breach"), v.literal("critical")),
    evidenceIds: v.array(v.id("evidenceManifests")),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Handling SLA breach for contract ${args.contractId}`);
      
      const contract = await ctx.db.get(args.contractId);
      if (!contract) {
        throw new Error(`Contract ${args.contractId} not found`);
      }
      
      const now = Date.now();
      const breachId = `breach_${args.contractId}_${now}`;
      
      // Find penalty amount for this metric
      const contractMetric = contract.metrics.find(m => m.name === args.metricName);
      const penaltyAmount = contractMetric?.penalty || 0;
      
      // Create breach record
      const breachRecordId = await ctx.db.insert("slaBreaches", {
        breachId,
        contractId: args.contractId,
        metricName: args.metricName,
        thresholdValue: args.thresholdValue,
        actualValue: args.actualValue,
        severity: args.severity,
        providerAgent: contract.providerAgent,
        consumerAgent: contract.consumerAgent,
        detectedAt: now,
        status: "detected",
        penaltyAmount,
        penaltyApplied: false,
        penaltyWaived: false,
        autoResolved: false,
        evidenceIds: args.evidenceIds,
        createdAt: now,
        updatedAt: now,
      });
      
      // Update contract breach count
      await ctx.db.patch(args.contractId, {
        breachCount: contract.breachCount + 1,
        lastBreachAt: now,
        status: args.severity === "critical" ? "breached" : contract.status,
        updatedAt: now,
      });
      
      // Auto-resolve minor breaches, escalate serious ones
      if (args.severity === "warning") {
        // Warning - just log it
        await ctx.db.patch(breachRecordId, {
          status: "resolved",
          autoResolved: true,
          resolvedAt: now,
          updatedAt: now,
        });
      } else if (args.severity === "breach") {
        // Apply penalty automatically for standard breaches
        await ctx.db.patch(breachRecordId, {
          status: "resolved",
          autoResolved: true,
          penaltyApplied: true,
          resolvedAt: now,
          updatedAt: now,
        });
        
        await ctx.db.patch(args.contractId, {
          totalPenalties: contract.totalPenalties + penaltyAmount,
          updatedAt: now,
        });
      } else if (args.severity === "critical") {
        // Critical breach - escalate to formal dispute resolution
        await ctx.runMutation(api.contracts.escalateToDispute, {
          breachId: breachRecordId,
          contractId: args.contractId,
        });
      }
      
      // Log breach event
      await ctx.db.insert("events", {
        type: "SLA_BREACH_DETECTED",
        payload: {
          contractId: args.contractId,
          breachId,
          metricName: args.metricName,
          severity: args.severity,
          providerAgent: contract.providerAgent,
          consumerAgent: contract.consumerAgent,
          penaltyAmount,
          autoResolved: args.severity !== "critical",
        },
        timestamp: now,
      });
      
      console.info(`SLA breach handled: ${breachRecordId}`);
      return breachRecordId;
      
    } catch (error) {
      console.error(`Failed to handle SLA breach:`, error);
      throw new Error(`SLA breach handling failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Escalate to Dispute - Create formal dispute case using existing court system
export const escalateToDispute = mutation({
  args: {
    breachId: v.id("slaBreaches"),
    contractId: v.id("slaContracts"),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Escalating breach ${args.breachId} to formal dispute`);
      
      const breach = await ctx.db.get(args.breachId);
      const contract = await ctx.db.get(args.contractId);
      
      if (!breach || !contract) {
        throw new Error("Breach or contract not found");
      }
      
      // Create formal dispute case using existing court system
      const caseId = await ctx.runMutation(api.cases.fileDispute, {
        parties: [contract.providerAgent, contract.consumerAgent],
        type: `SLA_BREACH_${breach.severity.toUpperCase()}`,
        jurisdictionTags: ["ENTERPRISE_SLA", contract.serviceType.toUpperCase()],
        evidenceIds: breach.evidenceIds,
      });
      
      // Update breach record with case ID
      await ctx.db.patch(args.breachId, {
        status: "escalated",
        caseId,
        updatedAt: Date.now(),
      });
      
      // Update contract with dispute information
      const updatedDisputeHistory = [...contract.disputeHistory, caseId];
      await ctx.db.patch(args.contractId, {
        status: "disputed",
        activeDispute: caseId,
        disputeHistory: updatedDisputeHistory,
        updatedAt: Date.now(),
      });
      
      console.info(`Breach escalated to dispute case: ${caseId}`);
      return caseId;
      
    } catch (error) {
      console.error(`Failed to escalate breach to dispute:`, error);
      throw new Error(`Dispute escalation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Query Functions

export const getSLATemplate = query({
  args: { templateId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("slaTemplates")
      .withIndex("by_template_id", (q) => q.eq("templateId", args.templateId))
      .first();
  },
});

export const getSLATemplates = query({
  args: { 
    serviceType: v.optional(v.string()),
    active: v.optional(v.boolean()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("slaTemplates");
    
    if (args.serviceType) {
      query = query.withIndex("by_service_type", (q: any) => q.eq("serviceType", args.serviceType));
    } else if (args.active !== undefined) {
      query = query.withIndex("by_active", (q: any) => q.eq("active", args.active));
    }
    
    return await query.take(args.limit || 50);
  },
});

export const getContract = query({
  args: { contractId: v.id("slaContracts") },
  handler: async (ctx, args) => {
    const contract = await ctx.db.get(args.contractId);
    if (!contract) return null;
    
    // Get template details
    const template = await ctx.db.get(contract.templateId);
    
    // Get recent metrics
    const recentMetrics = await ctx.db
      .query("performanceMetrics")
      .withIndex("by_contract", (q) => q.eq("contractId", args.contractId))
      .order("desc")
      .take(10);
    
    // Get breach history
    const breaches = await ctx.db
      .query("slaBreaches")
      .withIndex("by_contract", (q) => q.eq("contractId", args.contractId))
      .collect();
    
    return {
      ...contract,
      template,
      recentMetrics,
      breaches,
    };
  },
});

export const getAgentContracts = query({
  args: { 
    agentDid: v.string(),
    status: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // Get contracts where agent is provider
    const providerContracts = await ctx.db
      .query("slaContracts")
      .withIndex("by_provider", (q) => q.eq("providerAgent", args.agentDid))
      .filter((q) => args.status ? q.eq(q.field("status"), args.status) : q.neq(q.field("status"), ""))
      .take(args.limit || 25);
    
    // Get contracts where agent is consumer  
    const consumerContracts = await ctx.db
      .query("slaContracts")
      .withIndex("by_consumer", (q) => q.eq("consumerAgent", args.agentDid))
      .filter((q) => args.status ? q.eq(q.field("status"), args.status) : q.neq(q.field("status"), ""))
      .take(args.limit || 25);
    
    return {
      asProvider: providerContracts,
      asConsumer: consumerContracts,
    };
  },
});

export const getContractMetrics = query({
  args: { 
    contractId: v.id("slaContracts"),
    metricName: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("performanceMetrics")
      .withIndex("by_contract", (q) => q.eq("contractId", args.contractId));
    
    if (args.metricName) {
      query = query.filter((q) => q.eq(q.field("metricName"), args.metricName));
    }
    
    return await query
      .order("desc")
      .take(args.limit || 100);
  },
});

export const getActiveBreaches = query({
  args: { 
    agentDid: v.optional(v.string()),
    severity: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("slaBreaches");
    
    if (args.agentDid) {
      query = query.withIndex("by_provider", (q) => q.eq("providerAgent", args.agentDid));
    } else if (args.severity) {
      query = query.withIndex("by_severity", (q: any) => q.eq("severity", args.severity));
    } else {
      query = query.withIndex("by_status", (q: any) => q.eq("status", "detected"));
    }
    
    return await query
      .filter((q) => q.neq(q.field("status"), "resolved"))
      .take(args.limit || 50);
  },
});
