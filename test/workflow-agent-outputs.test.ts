/**
 * Workflow Agent Outputs Tests
 * 
 * Tests that workflow steps are properly stored when agents execute
 */

import { describe, it, expect, beforeEach } from "vitest";
import { convexTest } from "convex-test";
import { api, internal } from "../convex/_generated/api";
import schema from "../convex/schema";

describe("Workflow Agent Outputs Storage", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
  });

  it.skip("should store workflow step when created", async () => {
    // Create a test case first
    const timestamp = Date.now();
    
    // Register agents first
    const plaintiffAgent = await t.mutation(api.agents.joinAgent, {
      name: `Plaintiff Agent ${timestamp}`,
      publicKey: "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk",
      organizationName: "Test Org",
    });
    const defendantAgent = await t.mutation(api.agents.joinAgent, {
      name: `Defendant Agent ${timestamp}`,
      publicKey: "ZGVmZW5kYW50X3B1YmxpY19rZXlfMzJfYnl0ZXNfYmFzZTY0X2VuY29kZWQ",
      organizationName: "Test Org",
    });
    
    const evidenceId = await t.mutation(api.evidence.submitEvidence, {
      agentDid: plaintiffAgent.did,
      sha256: `test_sha256_${timestamp}`,
      uri: 'https://test.example.com/evidence.json',
      signer: plaintiffAgent.did,
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });

    const caseResult = await t.mutation(api.cases.fileDispute, {
      plaintiff: plaintiffAgent.did,
      defendant: defendantAgent.did,
      type: "PAYMENT",
      jurisdictionTags: ["test"],
      evidenceIds: [evidenceId],
      description: "Test case for workflow storage",
    });

    const caseId = caseResult.caseId;
    const workflowId = `${caseId}-${Date.now()}`;

    // Manually store a workflow step (simulating what workflow would do)
    const stepId = await t.mutation(internal.workflows.storeWorkflowStep, {
      caseId,
      workflowId,
      stepNumber: 0,
      stepName: "signature_verification",
      agentName: "Signature Verification Agent",
      status: "COMPLETED",
      startedAt: Date.now() - 1000,
      completedAt: Date.now(),
      input: { caseId },
      output: {
        signatureValid: true,
        vendorVerified: `did:agent:vendor-${timestamp}`,
        keyFacts: ["API endpoint: POST /api/chat"],
      },
      result: "Signature valid",
    });

    expect(stepId).toBeDefined();

    // Query workflow steps
    const steps = await t.query(internal.workflows.getWorkflowSteps, { caseId });
    expect(steps).toBeDefined();
    expect(steps.length).toBe(1);
    expect(steps[0].stepName).toBe("signature_verification");
    expect(steps[0].status).toBe("COMPLETED");
    expect(steps[0].result).toBe("Signature valid");
    expect(steps[0].durationMs).toBeGreaterThan(0);
  });

  it.skip("should calculate duration correctly", async () => {
    const timestamp = Date.now();
    
    // Register agents first
    const plaintiffAgent = await t.mutation(api.agents.joinAgent, {
      name: `Plaintiff Agent ${timestamp}`,
      publicKey: "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk",
      organizationName: "Test Org",
    });
    const defendantAgent = await t.mutation(api.agents.joinAgent, {
      name: `Defendant Agent ${timestamp}`,
      publicKey: "ZGVmZW5kYW50X3B1YmxpY19rZXlfMzJfYnl0ZXNfYmFzZTY0X2VuY29kZWQ",
      organizationName: "Test Org",
    });
    
    const evidenceId = await t.mutation(api.evidence.submitEvidence, {
      agentDid: plaintiffAgent.did,
      sha256: `test_sha256_${timestamp}`,
      uri: 'https://test.example.com/evidence.json',
      signer: plaintiffAgent.did,
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });

    const caseResult = await t.mutation(api.cases.fileDispute, {
      plaintiff: plaintiffAgent.did,
      defendant: defendantAgent.did,
      type: "PAYMENT",
      jurisdictionTags: ["test"],
      evidenceIds: [evidenceId],
      description: "Test case",
    });

    const caseId = caseResult.caseId;
    const workflowId = `${caseId}-${Date.now()}`;
    const startTime = Date.now() - 2500; // 2.5 seconds ago
    const endTime = Date.now();

    const stepId = await t.mutation(internal.workflows.storeWorkflowStep, {
      caseId,
      workflowId,
      stepNumber: 0,
      stepName: "test_step",
      agentName: "Test Agent",
      status: "COMPLETED",
      startedAt: startTime,
      completedAt: endTime,
      output: {},
      result: "Test completed",
    });

    const steps = await t.query(internal.workflows.getWorkflowSteps, { caseId });
    expect(steps[0].durationMs).toBeGreaterThanOrEqual(2500);
    expect(steps[0].durationMs).toBeLessThan(3000); // Allow some tolerance
  });

  it.skip("should handle skipped steps", async () => {
    const timestamp = Date.now();
    
    // Register agents first
    const plaintiffAgent = await t.mutation(api.agents.joinAgent, {
      name: `Plaintiff Agent ${timestamp}`,
      publicKey: "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk",
      organizationName: "Test Org",
    });
    const defendantAgent = await t.mutation(api.agents.joinAgent, {
      name: `Defendant Agent ${timestamp}`,
      publicKey: "ZGVmZW5kYW50X3B1YmxpY19rZXlfMzJfYnl0ZXNfYmFzZTY0X2VuY29kZWQ",
      organizationName: "Test Org",
    });
    
    const evidenceId = await t.mutation(api.evidence.submitEvidence, {
      agentDid: plaintiffAgent.did,
      sha256: `test_sha256_${timestamp}`,
      uri: 'https://test.example.com/evidence.json',
      signer: plaintiffAgent.did,
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });

    const caseResult = await t.mutation(api.cases.fileDispute, {
      plaintiff: plaintiffAgent.did,
      defendant: defendantAgent.did,
      type: "PAYMENT",
      jurisdictionTags: ["test"],
      evidenceIds: [evidenceId],
      description: "Test case",
    });

    const caseId = caseResult.caseId;
    const workflowId = `${caseId}-${Date.now()}`;

    await t.mutation(internal.workflows.storeWorkflowStep, {
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

    const steps = await t.query(internal.workflows.getWorkflowSteps, { caseId });
    const skippedStep = steps.find((s: any) => s.status === "SKIPPED");
    expect(skippedStep).toBeDefined();
    expect(skippedStep?.status).toBe("SKIPPED");
    expect(skippedStep?.result).toBe("No OpenAPI spec available");
  });

  it.skip("should handle failed steps with errors", async () => {
    const timestamp = Date.now();
    
    // Register agents first
    const plaintiffAgent = await t.mutation(api.agents.joinAgent, {
      name: `Plaintiff Agent ${timestamp}`,
      publicKey: "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk",
      organizationName: "Test Org",
    });
    const defendantAgent = await t.mutation(api.agents.joinAgent, {
      name: `Defendant Agent ${timestamp}`,
      publicKey: "ZGVmZW5kYW50X3B1YmxpY19rZXlfMzJfYnl0ZXNfYmFzZTY0X2VuY29kZWQ",
      organizationName: "Test Org",
    });
    
    const evidenceId = await t.mutation(api.evidence.submitEvidence, {
      agentDid: plaintiffAgent.did,
      sha256: `test_sha256_${timestamp}`,
      uri: 'https://test.example.com/evidence.json',
      signer: plaintiffAgent.did,
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });

    const caseResult = await t.mutation(api.cases.fileDispute, {
      plaintiff: plaintiffAgent.did,
      defendant: defendantAgent.did,
      type: "PAYMENT",
      jurisdictionTags: ["test"],
      evidenceIds: [evidenceId],
      description: "Test case",
    });

    const caseId = caseResult.caseId;
    const workflowId = `${caseId}-${Date.now()}`;

    await t.mutation(internal.workflows.storeWorkflowStep, {
      caseId,
      workflowId,
      stepNumber: 0,
      stepName: "test_step",
      agentName: "Test Agent",
      status: "FAILED",
      startedAt: Date.now() - 1000,
      completedAt: Date.now(),
      output: {},
      error: "Test error message",
      result: "Step failed",
    });

    const steps = await t.query(internal.workflows.getWorkflowSteps, { caseId });
    const failedStep = steps.find((s: any) => s.status === "FAILED");
    expect(failedStep).toBeDefined();
    expect(failedStep?.status).toBe("FAILED");
    expect(failedStep?.error).toBe("Test error message");
  });

  it.skip("should calculate workflow status correctly", async () => {
    const timestamp = Date.now();
    
    // Register agents first
    const plaintiffAgent = await t.mutation(api.agents.joinAgent, {
      name: `Plaintiff Agent ${timestamp}`,
      publicKey: "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk",
      organizationName: "Test Org",
    });
    const defendantAgent = await t.mutation(api.agents.joinAgent, {
      name: `Defendant Agent ${timestamp}`,
      publicKey: "ZGVmZW5kYW50X3B1YmxpY19rZXlfMzJfYnl0ZXNfYmFzZTY0X2VuY29kZWQ",
      organizationName: "Test Org",
    });
    
    const evidenceId = await t.mutation(api.evidence.submitEvidence, {
      agentDid: plaintiffAgent.did,
      sha256: `test_sha256_${timestamp}`,
      uri: 'https://test.example.com/evidence.json',
      signer: plaintiffAgent.did,
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });

    const caseResult = await t.mutation(api.cases.fileDispute, {
      plaintiff: plaintiffAgent.did,
      defendant: defendantAgent.did,
      type: "PAYMENT",
      jurisdictionTags: ["test"],
      evidenceIds: [evidenceId],
      description: "Test case",
    });

    const caseId = caseResult.caseId;
    const workflowId = `${caseId}-${Date.now()}`;

    // Create multiple steps with different statuses
    await t.mutation(internal.workflows.storeWorkflowStep, {
      caseId,
      workflowId,
      stepNumber: 0,
      stepName: "step1",
      agentName: "Agent 1",
      status: "COMPLETED",
      startedAt: Date.now() - 2000,
      completedAt: Date.now() - 1000,
      output: {},
      result: "Completed",
    });

    await t.mutation(internal.workflows.storeWorkflowStep, {
      caseId,
      workflowId,
      stepNumber: 1,
      stepName: "step2",
      agentName: "Agent 2",
      status: "COMPLETED",
      startedAt: Date.now() - 1000,
      completedAt: Date.now(),
      output: {},
      result: "Completed",
    });

    await t.mutation(internal.workflows.storeWorkflowStep, {
      caseId,
      workflowId,
      stepNumber: 2,
      stepName: "step3",
      agentName: "Agent 3",
      status: "SKIPPED",
      startedAt: Date.now(),
      completedAt: Date.now(),
      output: {},
      result: "Skipped",
    });

    const status = await t.query(internal.workflows.getWorkflowStatus, { caseId });
    expect(status.total).toBe(3);
    expect(status.completed).toBe(2);
    expect(status.skipped).toBe(1);
    expect(status.failed).toBe(0);
    expect(status.totalDurationMs).toBeGreaterThan(0);
    expect(status.avgDurationMs).toBeGreaterThan(0);
  });

  it.skip("should return steps in order by stepNumber", async () => {
    const timestamp = Date.now();
    
    // Register agents first
    const plaintiffAgent = await t.mutation(api.agents.joinAgent, {
      name: `Plaintiff Agent ${timestamp}`,
      publicKey: "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk",
      organizationName: "Test Org",
    });
    const defendantAgent = await t.mutation(api.agents.joinAgent, {
      name: `Defendant Agent ${timestamp}`,
      publicKey: "ZGVmZW5kYW50X3B1YmxpY19rZXlfMzJfYnl0ZXNfYmFzZTY0X2VuY29kZWQ",
      organizationName: "Test Org",
    });
    
    const evidenceId = await t.mutation(api.evidence.submitEvidence, {
      agentDid: plaintiffAgent.did,
      sha256: `test_sha256_${timestamp}`,
      uri: 'https://test.example.com/evidence.json',
      signer: plaintiffAgent.did,
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });

    const caseResult = await t.mutation(api.cases.fileDispute, {
      plaintiff: plaintiffAgent.did,
      defendant: defendantAgent.did,
      type: "PAYMENT",
      jurisdictionTags: ["test"],
      evidenceIds: [evidenceId],
      description: "Test case",
    });

    const caseId = caseResult.caseId;
    const workflowId = `${caseId}-${Date.now()}`;

    // Create steps out of order
    await t.mutation(internal.workflows.storeWorkflowStep, {
      caseId,
      workflowId,
      stepNumber: 2,
      stepName: "step2",
      agentName: "Agent 2",
      status: "COMPLETED",
      startedAt: Date.now(),
      completedAt: Date.now(),
      output: {},
      result: "Step 2",
    });

    await t.mutation(internal.workflows.storeWorkflowStep, {
      caseId,
      workflowId,
      stepNumber: 0,
      stepName: "step0",
      agentName: "Agent 0",
      status: "COMPLETED",
      startedAt: Date.now(),
      completedAt: Date.now(),
      output: {},
      result: "Step 0",
    });

    await t.mutation(internal.workflows.storeWorkflowStep, {
      caseId,
      workflowId,
      stepNumber: 1,
      stepName: "step1",
      agentName: "Agent 1",
      status: "COMPLETED",
      startedAt: Date.now(),
      completedAt: Date.now(),
      output: {},
      result: "Step 1",
    });

    const steps = await t.query(internal.workflows.getWorkflowSteps, { caseId });
    expect(steps.length).toBe(3);
    expect(steps[0].stepNumber).toBe(0);
    expect(steps[1].stepNumber).toBe(1);
    expect(steps[2].stepNumber).toBe(2);
  });
});

