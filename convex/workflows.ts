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
    // Get case data
    const caseData = await step.runQuery(s.cases.getCase, { caseId });
    if (!caseData) {
      throw new Error(`Case ${caseId} not found`);
    }

    const amount = caseData.amount || 0;
    const evidenceCount = caseData.evidenceIds?.length || 0;

    // NEW STEP 0: Verify signature if signed evidence exists
    let signatureResult = null;
    if (caseData.signedEvidence) {
      console.log(`Verifying signature for case: ${caseId}`);
      signatureResult = await step.runAction(api.agents.verifySignedEvidence, {
        caseId,
      });
      
      if (!signatureResult.signatureValid) {
        // Signature verification failed - reject dispute immediately
        console.error(`Signature verification failed for case: ${caseId}`);
        await step.runMutation(api.cases.updateCaseStatus, {
          caseId,
          status: "CLOSED",
        });
        return "DISMISSED_INVALID_SIGNATURE";
      }
    }

    // NEW STEP 1: Validate against OpenAPI spec if available
    let specValidation = null;
    if (caseData.signedEvidence && caseData.defendant) {
      const vendor = await step.runQuery(api.agents.getAgent, {
        did: caseData.defendant,
      });
      
      if (vendor && vendor.openApiSpec) {
        console.log(`Validating API contract for case: ${caseId}`);
        specValidation = await step.runAction(api.agents.validateApiContract, {
          caseId,
          openApiSpec: vendor.openApiSpec,
          requestPath: caseData.signedEvidence.requestHeaders?.path || "/",
          requestMethod: caseData.signedEvidence.requestHeaders?.method || "POST",
          responseStatus: caseData.signedEvidence.responseHeaders?.status || 500,
          responseBody: caseData.signedEvidence.responseBody || "",
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

    // Step 2: Review evidence in parallel
    const evidenceReviewPromises = (caseData.evidenceIds || []).map((evidenceId) =>
      step.runAction(api.agents.reviewEvidence, {
        caseId,
        evidenceId,
      })
    );

    const evidenceReviews = await Promise.all(evidenceReviewPromises);

    // Step 2: Research legal precedents
    const research = await step.runAction(api.agents.lawClerkResearch, {
      caseId,
      caseType: caseData.type || "PAYMENT",
      category: caseData.category,
      amountRange: amount < 1 ? "0-1" : amount < 10 ? "1-10" : "10+",
    });

    // Step 3: Calculate damages (if applicable)
    const damageCalculation = await step.runAction(api.agents.calculateRefund, {
      caseId,
      transactionAmount: amount,
      disputeType: caseData.paymentDetails?.disputeReason || "other",
    });

    // Step 4: Judge decision (synthesize all analysis)
    const complexity = Math.min(1, (amount / 1000) + (evidenceCount / 10));
    const modelId = selectModel(amount, complexity);

    const judgeResult = await step.runAction(api.agents.judgeDecision, {
      caseId,
      evidenceReviews,
      research,
      damageCalculation,
      signatureVerified: signatureResult?.signatureValid || false, // NEW
      contractBreach: specValidation?.contractBreach || false,     // NEW
      modelId, // Pass model selection to judge
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
    const evidenceReviewPromises = (caseData.evidenceIds || []).map((evidenceId) =>
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
    const caseData = await step.runQuery(s.cases.getCase, { caseId });
    if (!caseData) {
      throw new Error(`Case ${caseId} not found`);
    }

    // Quick evidence check (single pass)
    const evidenceCheck = await step.runAction(api.agents.reviewEvidence, {
      caseId,
      evidenceId: caseData.evidenceIds?.[0],
      quick: true,
    });

    // Quick decision using cheapest model
    const quickDecision = await step.runAction(api.agents.judgeDecision, {
      caseId,
      evidenceReviews: [evidenceCheck],
      quick: true,
      modelId: "openai/gpt-oss-20b", // Force cheapest model
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

