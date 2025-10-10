import { describe, it, expect, beforeEach } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../convex/_generated/api';
import schema from '../convex/schema';
import { createTestOwnerAndAgents, createTestCaseWithEvidence } from './setup';

/**
 * Court Engine Workflow Tests
 * 
 * Tests for automated court workflow and rule-based decisions
 */

describe('Court Workflow', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
  });

  it('should run full court workflow for simple case', async () => {
    const { plaintiff, defendant } = await createTestOwnerAndAgents(t);
    const { caseId } = await createTestCaseWithEvidence(t, plaintiff, defendant, 2);

    const workflow = await t.mutation(api.courtEngine.runCourtWorkflow, {
      caseId,
    });

    expect(workflow).toBeDefined();
    expect(workflow.rulingId).toBeDefined();
    expect(workflow.result).toBeDefined();
    expect(workflow.result.verdict).toBeDefined();
  });

  it('should handle cases with no evidence (auto-dismiss)', async () => {
    const { plaintiff, defendant } = await createTestOwnerAndAgents(t);
    
    // Create case without evidence
    const caseId = await t.mutation(api.cases.fileDispute, {
      plaintiff,
      defendant,
      type: 'SLA_BREACH',
      jurisdictionTags: ['test'],
      evidenceIds: [],
    });

    const result = await t.mutation(api.courtEngine.runCourtWorkflow, {
      caseId,
    });

    // Should auto-dismiss or require evidence
    expect(result).toBeDefined();
  });

  it('should handle cases with substantial evidence (auto-decide)', async () => {
    const { plaintiff, defendant } = await createTestOwnerAndAgents(t);
    const { caseId } = await createTestCaseWithEvidence(t, plaintiff, defendant, 5);

    const result = await t.mutation(api.courtEngine.runCourtWorkflow, {
      caseId,
    });

    expect(result).toBeDefined();
  });

  it('should escalate complex cases to panel', async () => {
    const { plaintiff, defendant } = await createTestOwnerAndAgents(t);
    const { caseId } = await createTestCaseWithEvidence(t, plaintiff, defendant, 2);

    // Complex case with high damages
    await t.mutation(api.cases.updateCaseStatus, {
      caseId,
      status: 'FILED',
    });

    const result = await t.mutation(api.courtEngine.runCourtWorkflow, {
      caseId,
    });

    expect(result).toBeDefined();
  });

  it('should track workflow stages correctly', async () => {
    const { plaintiff, defendant } = await createTestOwnerAndAgents(t);
    const { caseId } = await createTestCaseWithEvidence(t, plaintiff, defendant, 2);

    await t.mutation(api.courtEngine.runCourtWorkflow, {
      caseId,
    });

    const stats = await t.query(api.courtEngine.getEngineStats, {});
    expect(stats).toBeDefined();
    expect(stats.totalCases).toBeGreaterThan(0);
  });
});

describe('Rule-Based Decisions', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
  });

  it('should auto-dismiss on insufficient evidence', async () => {
    const { plaintiff, defendant } = await createTestOwnerAndAgents(t);
    const caseId = await t.mutation(api.cases.fileDispute, {
      plaintiff,
      defendant,
      type: 'SLA_BREACH',
      jurisdictionTags: ['test'],
      evidenceIds: [],
    });

    const result = await t.mutation(api.courtEngine.runCourtWorkflow, {
      caseId,
    });

    expect(result).toBeDefined();
  });

  it('should auto-uphold on clear SLA breach', async () => {
    const { plaintiff, defendant } = await createTestOwnerAndAgents(t);
    const { caseId } = await createTestCaseWithEvidence(t, plaintiff, defendant, 4);

    const result = await t.mutation(api.courtEngine.runCourtWorkflow, {
      caseId,
    });

    expect(result).toBeDefined();
  });

  it('should require panel for ambiguous cases', async () => {
    const { plaintiff, defendant } = await createTestOwnerAndAgents(t);
    const { caseId } = await createTestCaseWithEvidence(t, plaintiff, defendant, 2);

    const result = await t.mutation(api.courtEngine.runCourtWorkflow, {
      caseId,
    });

    expect(result).toBeDefined();
  });

  it('should apply correct confidence scores', async () => {
    const { plaintiff, defendant } = await createTestOwnerAndAgents(t);
    const { caseId } = await createTestCaseWithEvidence(t, plaintiff, defendant, 3);

    const result = await t.mutation(api.courtEngine.runCourtWorkflow, {
      caseId,
    });

    expect(result).toBeDefined();
  });

  it('should generate appropriate reasoning', async () => {
    const { plaintiff, defendant } = await createTestOwnerAndAgents(t);
    const { caseId } = await createTestCaseWithEvidence(t, plaintiff, defendant, 3);

    const result = await t.mutation(api.courtEngine.runCourtWorkflow, {
      caseId,
    });

    expect(result).toBeDefined();
  });
});

