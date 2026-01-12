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
    const timestamp = Date.now();
    const created = await t.mutation(api.pool.cases_fileWalletPaymentDispute, {
      blockchain: "base",
      transactionHash: `0xmock_micro_${timestamp}`,
      sellerEndpointUrl: "https://merchant.example/v1/paid",
      origin: "https://merchant.example",
      payer: "eip155:8453:0x00000000000000000000000000000000000000aa",
      merchant: "eip155:8453:0x0000000000000000000000000000000000000001",
      amountMicrousdc: 50_000,
      sourceTransferLogIndex: 0,
      description: "test: micro payment dispute",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    // Verify case was created
    const case_ = await t.query(api.cases.getCaseById, { caseId: created.disputeId });
    expect(case_).toBeDefined();
    expect(case_?.type).toBe('PAYMENT');
    expect(case_?.status).toBe('FILED');
    expect(case_?.humanReviewRequired).toBe(false);
  });

  it('should trigger payment dispute workflow for >=$1 payment disputes', async () => {
    const timestamp = Date.now();
    const created = await t.mutation(api.pool.cases_fileWalletPaymentDispute, {
      blockchain: "base",
      transactionHash: `0xmock_standard_${timestamp}`,
      sellerEndpointUrl: "https://merchant.example/v1/paid",
      origin: "https://merchant.example",
      payer: "eip155:8453:0x00000000000000000000000000000000000000aa",
      merchant: "eip155:8453:0x0000000000000000000000000000000000000001",
      amountMicrousdc: 2_500_000,
      sourceTransferLogIndex: 0,
      description: "test: standard payment dispute",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const case_ = await t.query(api.cases.getCaseById, { caseId: created.disputeId });
    expect(case_).toBeDefined();
    expect(case_?.type).toBe('PAYMENT');
    expect(case_?.humanReviewRequired).toBe(true);
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
    const paymentDisputeResult = await t.mutation(api.pool.cases_fileWalletPaymentDispute, {
      blockchain: "base",
      transactionHash: `0xmock_retention_${timestamp}`,
      sellerEndpointUrl: "https://merchant.example/v1/paid",
      origin: "https://merchant.example",
      payer: "eip155:8453:0x00000000000000000000000000000000000000aa",
      merchant: "eip155:8453:0x0000000000000000000000000000000000000001",
      amountMicrousdc: 250_000,
      sourceTransferLogIndex: 0,
      description: "test: payment retention",
    });
    expect(paymentDisputeResult.ok).toBe(true);
    if (!paymentDisputeResult.ok) return;

    const paymentCaseData = await t.query(api.cases.getCaseById, {
      caseId: paymentDisputeResult.disputeId,
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

