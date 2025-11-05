/**
 * Dispute Resolution Workflows
 * 
 * Orchestrates specialized agents to resolve disputes
 * Uses Convex Workflows for durable, long-running processes
 */

import { WorkflowManager } from "@convex-dev/workflow";
import { components } from "./_generated/api";
import { internal, api } from "./_generated/api";
import { v } from "convex/values";
import { selectModel } from "./lib/openrouter";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const workflow = new WorkflowManager(components.workflow);
export const workflowManager = workflow;

const s = internal;

/**
 * Payment Dispute Workflow
 * 
 * Handles payment disputes (ACP/ATXP/Stripe)
 * Routes micro disputes (<$1) through fast path
 */
export const paymentDisputeWorkflow = workflow.define({
  args: { caseId: v.id("cases") },
  handler: async (step, { caseId }): Promise<string> => {
    // Generate unique workflow ID for this execution
    const workflowId = `${caseId}-${Date.now()}`;
    
    // Get case data
    const caseData = await step.runQuery(s.cases.getCase, { caseId });
    if (!caseData) {
      throw new Error(`Case ${caseId} not found`);
    }

    const amount = caseData.amount || 0;
    const evidenceCount = caseData.evidenceIds?.length || 0;

    // STEP 0: Verify signature if signed evidence exists
    let signatureResult = null;
    if (caseData.signedEvidence) {
      console.log(`Verifying signature for case: ${caseId}`);
      const stepStartTime = Date.now();
      signatureResult = await step.runAction(api.agents.verifySignedEvidence, {
        caseId,
      });
      
      // Store signature verification step
      await step.runMutation(s.workflows.storeWorkflowStep, {
        caseId,
        workflowId,
        stepNumber: 0,
        stepName: "signature_verification",
        agentName: "Signature Verification Agent",
        status: signatureResult ? "COMPLETED" : "FAILED",
        startedAt: stepStartTime,
        completedAt: Date.now(),
        input: { caseId },
        output: signatureResult || {},
        result: signatureResult?.signatureValid 
          ? "Signature valid" 
          : signatureResult?.error || "Signature invalid",
        error: signatureResult?.error,
      });
      
      if (!signatureResult?.signatureValid) {
        // Signature verification failed - reject dispute immediately
        console.error(`Signature verification failed for case: ${caseId}`);
        await step.runMutation(api.cases.updateCaseStatus, {
          caseId,
          status: "CLOSED",
        });
        return "DISMISSED_INVALID_SIGNATURE";
      }
    }

    // STEP 1: Validate against OpenAPI spec if available
    let specValidation = null;
    if (caseData.signedEvidence && caseData.defendant) {
      const vendor = await step.runQuery(api.agents.getAgent, {
        did: caseData.defendant,
      });
      
      if (vendor && vendor.openApiSpec) {
        console.log(`Validating API contract for case: ${caseId}`);
        const stepStartTime = Date.now();
        specValidation = await step.runAction(api.agents.validateApiContract, {
          caseId,
          openApiSpec: vendor.openApiSpec,
          requestPath: caseData.signedEvidence.request.path,
          requestMethod: caseData.signedEvidence.request.method,
          responseStatus: caseData.signedEvidence.response.status,
          responseBody: caseData.signedEvidence.response.body,
        });
        
        // Store spec validation step
        await step.runMutation(s.workflows.storeWorkflowStep, {
          caseId,
          workflowId,
          stepNumber: 1,
          stepName: "spec_validation",
          agentName: "API Contract Validator",
          status: specValidation ? "COMPLETED" : "FAILED",
          startedAt: stepStartTime,
          completedAt: Date.now(),
          input: {
            caseId,
            requestPath: caseData.signedEvidence.request.path,
            requestMethod: caseData.signedEvidence.request.method,
            responseStatus: caseData.signedEvidence.response.status,
          },
          output: specValidation || {},
          result: specValidation?.contractBreach 
            ? "Contract breach detected" 
            : specValidation?.error || "No contract breach",
          error: specValidation?.error,
        });
      } else {
        // Store skipped step
        await step.runMutation(s.workflows.storeWorkflowStep, {
          caseId,
          workflowId,
          stepNumber: 1,
          stepName: "spec_validation",
          agentName: "API Contract Validator",
          status: "SKIPPED",
          startedAt: Date.now(),
          completedAt: Date.now(),
          result: "No OpenAPI spec available",
          output: {},
        });
      }
    }

    // Micro dispute fast path (<$1, <=2 evidence items)
    if (amount < 1 && evidenceCount <= 2 && !caseData.signedEvidence) {
      console.log(`Fast-track micro dispute: ${caseId}`);
      return await step.runAction(api.agents.quickDecision, { caseId });
    }

    // Full workflow for larger disputes
    console.log(`Full workflow for dispute: ${caseId}`);

    // STEP 2: Review evidence in parallel
    const evidenceReviewPromises = (caseData.evidenceIds || []).map(async (evidenceId: any, index: number) => {
      const stepStartTime = Date.now();
      const reviewResult = await step.runAction(api.agents.reviewEvidence, {
        caseId,
        evidenceId,
      });
      
      // Store each evidence review step
      await step.runMutation(s.workflows.storeWorkflowStep, {
        caseId,
        workflowId,
        stepNumber: 2 + index, // Start from 2, increment for each evidence item
        stepName: "evidence_review",
        agentName: "Evidence Review Agent",
        status: reviewResult ? "COMPLETED" : "FAILED",
        startedAt: stepStartTime,
        completedAt: Date.now(),
        input: { caseId, evidenceId },
        output: reviewResult || {},
        result: reviewResult?.analysis 
          ? `Evidence reviewed: ${reviewResult.analysis.substring(0, 100)}...` 
          : reviewResult?.error || "Evidence review failed",
        error: reviewResult?.error,
      });
      
      return reviewResult;
    });

    const evidenceReviews = await Promise.all(evidenceReviewPromises);

    // STEP 3: Research legal precedents
    const researchStartTime = Date.now();
    const research = await step.runAction(api.agents.lawClerkResearch, {
      caseId,
      caseType: caseData.type || "PAYMENT",
      category: caseData.category,
      amountRange: amount < 1 ? "0-1" : amount < 10 ? "1-10" : "10+",
    });

    // Store research step
    await step.runMutation(s.workflows.storeWorkflowStep, {
      caseId,
      workflowId,
      stepNumber: 2 + evidenceReviews.length, // After all evidence reviews
      stepName: "legal_research",
      agentName: "Legal Research Agent",
      status: research ? "COMPLETED" : "FAILED",
      startedAt: researchStartTime,
      completedAt: Date.now(),
      input: {
        caseId,
        caseType: caseData.type || "PAYMENT",
        category: caseData.category,
        amountRange: amount < 1 ? "0-1" : amount < 10 ? "1-10" : "10+",
      },
      output: research || {},
      result: research?.research 
        ? `Research completed: ${research.research.substring(0, 100)}...` 
        : research?.error || "Research failed",
      error: research?.error,
    });

    // STEP 4: Calculate damages (if applicable)
    const damageStartTime = Date.now();
    const damageCalculation = await step.runAction(api.agents.calculateRefund, {
      caseId,
      transactionAmount: amount,
      disputeType: caseData.paymentDetails?.disputeReason || "other",
    });

    // Store damage calculation step
    await step.runMutation(s.workflows.storeWorkflowStep, {
      caseId,
      workflowId,
      stepNumber: 3 + evidenceReviews.length, // After research
      stepName: "damage_calculation",
      agentName: "Damage Calculation Agent",
      status: damageCalculation ? "COMPLETED" : "FAILED",
      startedAt: damageStartTime,
      completedAt: Date.now(),
      input: {
        caseId,
        transactionAmount: amount,
        disputeType: caseData.paymentDetails?.disputeReason || "other",
      },
      output: damageCalculation || {},
      result: damageCalculation?.refundAmount 
        ? `Recommended refund: $${damageCalculation.refundAmount}` 
        : damageCalculation?.error || "Damage calculation failed",
      error: damageCalculation?.error,
    });

    // STEP 5: Judge decision (synthesize all analysis)
    const complexity = Math.min(1, (amount / 1000) + (evidenceCount / 10));
    const modelId = selectModel(amount, complexity);
    const judgeStartTime = Date.now();

    const judgeResult = await step.runAction(api.agents.judgeDecision, {
      caseId,
      evidenceReviews,
      research,
      damageCalculation,
      signatureVerified: signatureResult?.signatureValid || false,
      contractBreach: specValidation?.contractBreach || false,
      modelId,
    });
    
    // Store judge decision step
    await step.runMutation(s.workflows.storeWorkflowStep, {
      caseId,
      workflowId,
      stepNumber: 4 + evidenceReviews.length, // After damage calculation
      stepName: "judge_decision",
      agentName: "Judge Decision Agent",
      status: judgeResult ? "COMPLETED" : "FAILED",
      startedAt: judgeStartTime,
      completedAt: Date.now(),
      input: {
        caseId,
        evidenceReviewsCount: evidenceReviews.length,
        hasResearch: !!research,
        hasDamageCalculation: !!damageCalculation,
        signatureVerified: signatureResult?.signatureValid || false,
        contractBreach: specValidation?.contractBreach || false,
        modelId,
      },
      output: judgeResult || {},
      result: judgeResult?.verdict || "No verdict",
      verdict: judgeResult?.verdict,
      confidence: judgeResult?.confidence,
      error: judgeResult?.error,
    });

    // Step 5: Store ruling
    await step.runMutation(s.rulings.finalizeRuling, {
      caseId,
      verdict: judgeResult.verdict,
      reasoning: judgeResult.reasoning,
      confidence: judgeResult.confidence,
      auto: judgeResult.confidence >= 0.95,
    });

    // Step 6: Update case status
    if (judgeResult.confidence >= 0.95) {
      await step.runMutation(api.cases.updateCaseStatus, {
        caseId,
        status: "AUTORULED",
      });
    } else {
      await step.runMutation(api.cases.updateCaseStatus, {
        caseId,
        status: "IN_REVIEW",
      });
    }

    // Step 7: Notify parties (if callback URL provided)
    if (caseData.paymentDetails?.callbackUrl) {
      await step.runAction(api.notifications.sendRuling, {
        caseId,
        callbackUrl: caseData.paymentDetails.callbackUrl,
        verdict: judgeResult.verdict,
      });
    }

    return judgeResult.verdict;
  },
});

/**
 * General Dispute Workflow
 * 
 * Handles non-payment disputes (SLA violations, contracts, etc.)
 * More thorough analysis for complex commercial disputes
 */
export const generalDisputeWorkflow = workflow.define({
  args: { caseId: v.id("cases") },
  handler: async (step, { caseId }): Promise<string> => {
    // Get case data
    const caseData = await step.runQuery(s.cases.getCase, { caseId });
    if (!caseData) {
      throw new Error(`Case ${caseId} not found`);
    }

    const amount = caseData.amount || 0;
    const evidenceCount = caseData.evidenceIds?.length || 0;

    // Step 1: Review evidence in parallel
    const evidenceReviewPromises = (caseData.evidenceIds || []).map((evidenceId: any) =>
      step.runAction(api.agents.reviewEvidence, {
        caseId,
        evidenceId,
      })
    );

    const evidenceReviews = await Promise.all(evidenceReviewPromises);

    // Step 2: Research legal precedents (more thorough for general disputes)
    const research = await step.runAction(api.agents.lawClerkResearch, {
      caseId,
      caseType: "GENERAL",
      category: caseData.category,
      amountRange: amount < 100 ? "0-100" : amount < 1000 ? "100-1000" : "1000+",
    });

    // Step 3: Calculate damages (if applicable)
    let damageCalculation = null;
    if (amount > 0) {
      damageCalculation = await step.runAction(api.agents.calculateRefund, {
        caseId,
        transactionAmount: amount,
        disputeType: caseData.category || "other",
      });
    }

    // Step 4: Judge decision
    const complexity = Math.min(1, (amount / 10000) + (evidenceCount / 5));
    const modelId = selectModel(amount, complexity);

    const judgeResult = await step.runAction(api.agents.judgeDecision, {
      caseId,
      evidenceReviews,
      research,
      damageCalculation,
      modelId,
    });

    // Step 5: Store ruling
    await step.runMutation(s.rulings.finalizeRuling, {
      caseId,
      verdict: judgeResult.verdict,
      reasoning: judgeResult.reasoning,
      confidence: judgeResult.confidence,
      auto: judgeResult.confidence >= 0.95,
    });

    // Step 6: Update case status
    if (judgeResult.confidence >= 0.95) {
      await step.runMutation(api.cases.updateCaseStatus, {
        caseId,
        status: "AUTORULED",
      });
    } else {
      // Low confidence = assign to judge panel
      await step.runMutation(api.cases.updateCaseStatus, {
        caseId,
        status: "PANELED",
      });
      await step.runMutation(api.judges.assignPanel, {
        caseId,
        panelSize: 3,
      });
    }

    return judgeResult.verdict;
  },
});

/**
 * Micro Dispute Fast Path
 * 
 * Quick resolution for simple micro disputes (<$1)
 * Uses cheapest model and minimal steps
 */
export const microDisputeWorkflow = workflow.define({
  args: { caseId: v.id("cases") },
  handler: async (step, { caseId }): Promise<string> => {
    // Generate unique workflow ID for this execution
    const workflowId = `${caseId}-${Date.now()}`;
    
    const caseData = await step.runQuery(s.cases.getCase, { caseId });
    if (!caseData) {
      throw new Error(`Case ${caseId} not found`);
    }

    // Quick evidence check (single pass)
    const evidenceId = caseData.evidenceIds?.[0];
    const evidenceStartTime = Date.now();
    const evidenceCheck = await step.runAction(api.agents.reviewEvidence, {
      caseId,
      evidenceId,
      quick: true,
    });
    
    // Store evidence review step
    if (evidenceId) {
      await step.runMutation(s.workflows.storeWorkflowStep, {
        caseId,
        workflowId,
        stepNumber: 0,
        stepName: "evidence_review",
        agentName: "Evidence Review Agent",
        status: evidenceCheck ? "COMPLETED" : "FAILED",
        startedAt: evidenceStartTime,
        completedAt: Date.now(),
        input: { caseId, evidenceId, quick: true },
        output: evidenceCheck || {},
        result: evidenceCheck?.analysis 
          ? `Quick evidence review completed` 
          : evidenceCheck?.error || "Evidence review failed",
        error: evidenceCheck?.error,
      });
    }

    // Quick decision using cheapest model
    const judgeStartTime = Date.now();
    const quickDecision = await step.runAction(api.agents.judgeDecision, {
      caseId,
      evidenceReviews: [evidenceCheck],
      quick: true,
      modelId: "openai/gpt-oss-20b", // Force cheapest model
    });
    
    // Store judge decision step
    await step.runMutation(s.workflows.storeWorkflowStep, {
      caseId,
      workflowId,
      stepNumber: 1,
      stepName: "judge_decision",
      agentName: "Judge Decision Agent (Quick)",
      status: quickDecision ? "COMPLETED" : "FAILED",
      startedAt: judgeStartTime,
      completedAt: Date.now(),
      input: {
        caseId,
        quick: true,
        modelId: "openai/gpt-oss-20b",
      },
      output: quickDecision || {},
      result: quickDecision?.verdict || "No verdict",
      verdict: quickDecision?.verdict,
      confidence: quickDecision?.confidence,
      error: quickDecision?.error,
    });

    // Auto-approve high confidence micro disputes
    if (quickDecision.confidence >= 0.90) {
      await step.runMutation(s.rulings.finalizeRuling, {
        caseId,
        verdict: quickDecision.verdict,
        reasoning: quickDecision.reasoning,
        confidence: quickDecision.confidence,
        auto: true,
      });

      await step.runMutation(api.cases.updateCaseStatus, {
        caseId,
        status: "AUTORULED",
      });
    } else {
      // Low confidence = escalate to full workflow
      await step.runMutation(api.cases.updateCaseStatus, {
        caseId,
        status: "IN_REVIEW",
      });
    }

    return quickDecision.verdict;
  },
});

/**
 * Store workflow step execution result
 * Used internally by workflows to track agent outputs
 */
export const storeWorkflowStep = internalMutation({
  args: {
    caseId: v.id("cases"),
    workflowId: v.string(),
    stepNumber: v.number(),
    stepName: v.string(),
    agentName: v.string(),
    status: v.union(
      v.literal("PENDING"),
      v.literal("RUNNING"),
      v.literal("COMPLETED"),
      v.literal("SKIPPED"),
      v.literal("FAILED")
    ),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    input: v.optional(v.any()),
    output: v.any(),
    result: v.optional(v.string()),
    verdict: v.optional(v.string()),
    confidence: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const durationMs = args.completedAt 
      ? args.completedAt - args.startedAt 
      : undefined;
      
    return await ctx.db.insert("workflowSteps", {
      ...args,
      durationMs,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get all workflow steps for a case
 */
export const getWorkflowSteps = internalQuery({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const steps = await ctx.db
      .query("workflowSteps")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();
    
    // Sort by stepNumber explicitly since index doesn't guarantee order
    return steps.sort((a: any, b: any) => a.stepNumber - b.stepNumber);
  },
});

/**
 * Get workflow execution status summary
 */
export const getWorkflowStatus = internalQuery({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const steps = await ctx.db
      .query("workflowSteps")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();
    
    const completed = steps.filter((s: any) => s.status === "COMPLETED").length;
    const failed = steps.filter((s: any) => s.status === "FAILED").length;
    const skipped = steps.filter((s: any) => s.status === "SKIPPED").length;
    const running = steps.filter((s: any) => s.status === "RUNNING").length;
    const totalDuration = steps.reduce((sum: number, s: any) => sum + (s.durationMs || 0), 0);
    
    return {
      total: steps.length,
      completed,
      failed,
      skipped,
      running,
      pending: steps.length - completed - failed - skipped - running,
      currentStep: steps.find((s: any) => s.status === "RUNNING"),
      avgDurationMs: steps.length > 0 ? totalDuration / steps.length : 0,
      totalDurationMs: totalDuration,
    };
  },
});

/**
 * Get specific agent step output (public query for dashboard)
 */
export const getAgentStepOutput = query({
  args: { 
    caseId: v.id("cases"),
    stepName: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workflowSteps")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .filter((q) => q.eq(q.field("stepName"), args.stepName))
      .first();
  },
});

// Export public queries for dashboard
export const getWorkflowStepsPublic = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const steps = await ctx.db
      .query("workflowSteps")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();
    
    // Sort by stepNumber explicitly
    return steps.sort((a: any, b: any) => a.stepNumber - b.stepNumber);
  },
});

export const getWorkflowStatusPublic = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const steps = await ctx.db
      .query("workflowSteps")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();
    
    const completed = steps.filter((s: any) => s.status === "COMPLETED").length;
    const failed = steps.filter((s: any) => s.status === "FAILED").length;
    const skipped = steps.filter((s: any) => s.status === "SKIPPED").length;
    const running = steps.filter((s: any) => s.status === "RUNNING").length;
    const totalDuration = steps.reduce((sum: number, s: any) => sum + (s.durationMs || 0), 0);
    
    return {
      total: steps.length,
      completed,
      failed,
      skipped,
      running,
      pending: steps.length - completed - failed - skipped - running,
      currentStep: steps.find((s: any) => s.status === "RUNNING"),
      avgDurationMs: steps.length > 0 ? totalDuration / steps.length : 0,
      totalDurationMs: totalDuration,
    };
  },
});

