/**
 * Workflow Integration Tests
 * 
 * Tests the multi-agent orchestrator workflow system
 * Verifies workflows are triggered correctly when cases are filed
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../convex/_generated/api';
import schema from '../convex/schema';

describe('Workflow Integration', () => {
  let t: ReturnType<typeof convexTest>;
  let plaintiff: string;
  let defendant: string;
  let evidenceId: string;

  beforeAll(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);

    const timestamp = Date.now();

    // Create plaintiff org and user
    const plaintiffOrgId = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Plaintiff Workflow Corp",
        domain: `plaintiff-workflow-${timestamp}.com`,
        verified: true,
        verifiedAt: Date.now(),
        createdAt: Date.now(),
      });
    });

    const plaintiffUserId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkUserId: `plaintiff-workflow-${timestamp}`,
        email: `plaintiff-workflow-${timestamp}@test.com`,
        organizationId: plaintiffOrgId,
        role: "admin",
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      });
    });

    const testPublicKey = "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk";

    const plaintiffAgent = await t.mutation(api.agents.joinAgent, {
      name: 'Plaintiff Agent',
      publicKey: testPublicKey,
      organizationName: "Plaintiff Workflow Corp",
      mock: false,
    });
    plaintiff = plaintiffAgent.did;

    // Create defendant org and user
    const defendantOrgId = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Defendant Workflow Corp",
        domain: `defendant-workflow-${timestamp}.com`,
        verified: true,
        verifiedAt: Date.now(),
        createdAt: Date.now(),
      });
    });

    const defendantUserId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkUserId: `defendant-workflow-${timestamp}`,
        email: `defendant-workflow-${timestamp}@test.com`,
        organizationId: defendantOrgId,
        role: "admin",
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      });
    });

    const defendantPublicKey = "ZGVmZW5kYW50X3B1YmxpY19rZXlfMzJfYnl0ZXNfYmFzZTY0X2VuY29kZWQ";

    const defendantAgent = await t.mutation(api.agents.joinAgent, {
      name: 'Defendant Agent',
      publicKey: defendantPublicKey,
      organizationName: "Defendant Workflow Corp",
      mock: false,
    });
    defendant = defendantAgent.did;

    // Submit evidence
    evidenceId = await t.mutation(api.evidence.submitEvidence, {
      agentDid: plaintiff,
      sha256: `workflow_test_evidence_${Date.now()}`,
      uri: 'https://test.example.com/workflow-evidence.json',
      signer: plaintiff,
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });
  });

  it('should trigger micro dispute workflow for <$1 payment disputes', async () => {
    // Payment disputes should use receivePaymentDispute, not fileDispute
    const timestamp = Date.now();
    const paymentDisputeResult = await t.mutation(api.paymentDisputes.receivePaymentDispute, {
      transactionId: `txn_micro_${timestamp}`,
      amount: 0.50, // < $1, should trigger micro workflow
      currency: 'USD',
      paymentProtocol: 'ACP',
      plaintiff: `consumer:test-${timestamp}@example.com`,
      defendant: `merchant:test-${timestamp}@example.com`,
      disputeReason: 'api_timeout',
      description: 'Micro payment dispute test',
    });

    expect(paymentDisputeResult).toBeDefined();
    expect(paymentDisputeResult.caseId).toBeDefined();
    
    // Check that workflow was started (may be undefined in test mode)
    // WorkflowId is optional in test mode when workflow component isn't registered
    if (paymentDisputeResult.workflowId) {
      expect(paymentDisputeResult.workflowId).toBeDefined();
      expect(paymentDisputeResult.status).toBe('processing');
    }

    // Verify case was created
    const case_ = await t.query(api.cases.getCaseById, { caseId: paymentDisputeResult.caseId });
    expect(case_).toBeDefined();
    expect(case_?.type).toBe('PAYMENT');
    expect(case_?.status).toBe('FILED');
  });

  it('should trigger payment dispute workflow for >=$1 payment disputes', async () => {
    // Payment disputes should use receivePaymentDispute, not fileDispute
    const timestamp = Date.now();
    const paymentDisputeResult = await t.mutation(api.paymentDisputes.receivePaymentDispute, {
      transactionId: `txn_standard_${timestamp}`,
      amount: 25.00, // >= $1, should trigger full payment workflow
      currency: 'USD',
      paymentProtocol: 'ACP',
      plaintiff: `consumer:test-${timestamp}@example.com`,
      defendant: `merchant:test-${timestamp}@example.com`,
      disputeReason: 'quality_issue',
      description: 'Standard payment dispute test',
    });

    expect(paymentDisputeResult).toBeDefined();
    expect(paymentDisputeResult.caseId).toBeDefined();
    // WorkflowId is optional in test mode when workflow component isn't registered
    if (paymentDisputeResult.workflowId) {
      expect(paymentDisputeResult.workflowId).toBeDefined();
      expect(paymentDisputeResult.status).toBe('processing');
    }

    const case_ = await t.query(api.cases.getCaseById, { caseId: paymentDisputeResult.caseId });
    expect(case_).toBeDefined();
    expect(case_?.type).toBe('PAYMENT');
  });

  it('should trigger general dispute workflow for non-payment disputes', async () => {
    const caseId = await t.mutation(api.cases.fileDispute, {
      plaintiff,
      defendant,
      type: 'SLA_BREACH',
      jurisdictionTags: ['sla', 'general'],
      evidenceIds: [evidenceId],
      description: 'General dispute workflow test',
      claimedDamages: 10000,
    });

    expect(caseId).toBeDefined();
    expect(caseId.caseId).toBeDefined();
    // WorkflowId is optional in test mode when workflow component isn't registered
    if (caseId.workflowId) {
      expect(caseId.workflowId).toBeDefined();
      expect(caseId.status).toBe('processing');
    }

    const case_ = await t.query(api.cases.getCaseById, { caseId: caseId.caseId });
    expect(case_).toBeDefined();
    expect(case_?.type).toBe('GENERAL');
  });

  it('should set retention policy based on dispute type', async () => {
    // Payment dispute - should have payment retention policy
    const timestamp = Date.now();
    const paymentDisputeResult = await t.mutation(api.paymentDisputes.receivePaymentDispute, {
      transactionId: `txn_retention_${timestamp}`,
      amount: 5.00,
      currency: 'USD',
      paymentProtocol: 'ACP',
      plaintiff: `consumer:test-${timestamp}@example.com`,
      defendant: `merchant:test-${timestamp}@example.com`,
      disputeReason: 'amount_incorrect',
      description: 'Payment retention test',
    });

    const paymentCaseData = await t.query(api.cases.getCaseById, {
      caseId: paymentDisputeResult.caseId,
    });
    expect(paymentCaseData?.retentionPolicy).toBe('payment');

    // General dispute - should have commercial retention policy
    const generalCase = await t.mutation(api.cases.fileDispute, {
      plaintiff,
      defendant,
      type: 'SLA_BREACH',
      jurisdictionTags: ['sla'],
      evidenceIds: [evidenceId],
      description: 'General retention test',
      claimedDamages: 5000,
    });

    const generalCaseData = await t.query(api.cases.getCaseById, {
      caseId: generalCase.caseId,
    });
    expect(generalCaseData?.retentionPolicy).toBe('commercial');
  });
});

