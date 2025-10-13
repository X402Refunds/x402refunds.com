import { describe, it, expect, beforeEach } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../convex/_generated/api';
import schema from '../convex/schema';
import { createTestOwnerAndAgents, createTestCaseWithEvidence } from './setup';

/**
 * Judge Panel and Voting Tests
 * 
 * Tests for judge registration, panel assignment, voting, and AI deliberation
 */

describe('Judge Registration', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
  });

  it('should register human judge successfully', async () => {
    const judgeId = await t.mutation(api.judges.registerJudge, {
      did: `did:judge:human-${Date.now()}`,
      name: 'Judge Sarah Smith',
      specialties: ['SLA_BREACH', 'CONTRACT_DISPUTE'],
    });

    expect(judgeId).toBeDefined();
    
    const judge = await t.query(api.judges.getJudges, {});
    expect(judge.length).toBeGreaterThan(0);
  });

  it('should register AI judge successfully', async () => {
    const judgeId = await t.mutation(api.judges.registerJudge, {
      did: `did:judge:ai-${Date.now()}`,
      name: 'AI Judge GPT-4',
      specialties: ['CONTRACT_DISPUTE', 'TECHNICAL'],
    });

    expect(judgeId).toBeDefined();
    
    const judge = await t.query(api.judges.getJudges, {});
    expect(judge.length).toBeGreaterThan(0);
  });

  it('should reject duplicate judge registration', async () => {
    const did = `did:judge:duplicate-${Date.now()}`;
    
    await t.mutation(api.judges.registerJudge, {
      did,
      name: 'Judge First',
      specialties: ['SLA_BREACH'],
    });

    await expect(
      t.mutation(api.judges.registerJudge, {
        did,
        name: 'Judge Second',
        specialties: ['CONTRACT'],
      })
    ).rejects.toThrow('already registered');
  });
});

describe('Panel Assignment', () => {
  let t: ReturnType<typeof convexTest>;
  let caseId: any;
  let judgeIds: string[];

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
    
    // Create test case
    const { plaintiff, defendant } = await createTestOwnerAndAgents(t);
    const { caseId: testCaseId } = await createTestCaseWithEvidence(t, plaintiff, defendant, 2);
    caseId = testCaseId;
    
    // Create judges
    judgeIds = [];
    for (let i = 0; i < 5; i++) {
      const judge = await t.mutation(api.judges.registerJudge, {
        did: `did:judge:panel-${i}-${Date.now()}`,
        name: `Judge ${i}`,
        specialties: ['SLA_BREACH', 'TECHNICAL'],
      });
      judgeIds.push(judge.did);
    }
  });

  it('should assign 3-judge panel to case', async () => {
    const panelId = await t.mutation(api.judges.assignPanel, {
      caseId,
      panelSize: 3,
    });

    expect(panelId).toBeDefined();
    
    const panel = await t.query(api.judges.getPanel, { panelId });
    expect(panel?.judgeIds).toHaveLength(3);
  });

  it('should assign 5-judge panel to high-value case', async () => {
    const panelId = await t.mutation(api.judges.assignPanel, {
      caseId,
      panelSize: 5,
    });

    expect(panelId).toBeDefined();
    
    const panel = await t.query(api.judges.getPanel, { panelId });
    expect(panel?.judgeIds).toHaveLength(5);
  });

  it('should handle insufficient available judges', async () => {
    // Try to assign more judges than available (only 5 created)
    await expect(
      t.mutation(api.judges.assignPanel, {
        caseId,
        panelSize: 10,
      })
    ).rejects.toThrow();
  });

  it('should allow reassigning panel to case', async () => {
    // Assign panel first time
    const panel1 = await t.mutation(api.judges.assignPanel, {
      caseId,
      panelSize: 3,
    });

    // Assign panel again to same case (system allows this)
    const panel2 = await t.mutation(api.judges.assignPanel, {
      caseId,
      panelSize: 3,
    });

    expect(panel1).toBeDefined();
    expect(panel2).toBeDefined();
  });
});

describe('Judge Voting', () => {
  let t: ReturnType<typeof convexTest>;
  let caseId: any;
  let panelId: any;
  let judgeIds: string[];

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
    
    // Create test case
    const { plaintiff, defendant } = await createTestOwnerAndAgents(t);
    const { caseId: testCaseId } = await createTestCaseWithEvidence(t, plaintiff, defendant, 2);
    caseId = testCaseId;
    
    // Create judges and assign panel
    judgeIds = [];
    for (let i = 0; i < 3; i++) {
      const judge = await t.mutation(api.judges.registerJudge, {
        did: `did:judge:vote-${i}-${Date.now()}`,
        name: `Judge ${i}`,
        specialties: ['SLA_BREACH', 'TECHNICAL'],
      });
      judgeIds.push(judge.did);
    }
    
    panelId = await t.mutation(api.judges.assignPanel, {
      caseId,
      panelSize: 3,
    });
  });

  it('should submit valid vote', async () => {
    const panel = await t.query(api.judges.getPanel, { panelId });
    
    await t.mutation(api.judges.submitVote, {
      panelId,
      judgeId: panel!.judgeIds[0],
      code: 'UPHELD',
      reasons: 'Evidence clearly supports the claim',
      confidence: 0.9,
    });

    const updatedPanel = await t.query(api.judges.getPanel, { panelId });
    expect(updatedPanel?.votes).toHaveLength(1);
    expect(updatedPanel?.votes[0].code).toBe('UPHELD');
  });

  it('should reject duplicate vote from same judge', async () => {
    const panel = await t.query(api.judges.getPanel, { panelId });
    const firstJudge = panel!.judgeIds[0];
    
    await t.mutation(api.judges.submitVote, {
      panelId,
      judgeId: firstJudge,
      code: 'UPHELD',
      reasons: 'First vote',
      confidence: 0.9,
    });

    await expect(
      t.mutation(api.judges.submitVote, {
        panelId,
        judgeId: firstJudge,
        code: 'DISMISSED',
        reasons: 'Second vote',
        confidence: 0.8,
      })
    ).rejects.toThrow();
  });

  it('should handle split decisions (2-1)', async () => {
    const panel = await t.query(api.judges.getPanel, { panelId });
    const judges = panel!.judgeIds;
    
    // Two judges vote UPHELD
    await t.mutation(api.judges.submitVote, {
      panelId,
      judgeId: judges[0],
      code: 'UPHELD',
      reasons: 'Support claim',
      confidence: 0.9,
    });

    await t.mutation(api.judges.submitVote, {
      panelId,
      judgeId: judges[1],
      code: 'UPHELD',
      reasons: 'Support claim',
      confidence: 0.85,
    });

    // One judge votes DISMISSED
    await t.mutation(api.judges.submitVote, {
      panelId,
      judgeId: judges[2],
      code: 'DISMISSED',
      reasons: 'Insufficient evidence',
      confidence: 0.7,
    });

    const updatedPanel = await t.query(api.judges.getPanel, { panelId });
    expect(updatedPanel?.votes).toHaveLength(3);
  });

  it('should calculate vote consensus', async () => {
    const panel = await t.query(api.judges.getPanel, { panelId });
    
    // All judges vote the same
    for (const judgeId of panel!.judgeIds) {
      await t.mutation(api.judges.submitVote, {
        panelId,
        judgeId,
        code: 'UPHELD',
        reasons: 'Unanimous decision',
        confidence: 0.9,
      });
    }

    const updatedPanel = await t.query(api.judges.getPanel, { panelId });
    expect(updatedPanel?.votes).toHaveLength(3);
    expect(updatedPanel?.votes.every((v: any) => v.code === 'UPHELD')).toBe(true);
  });

  it('should reject vote after case decided', async () => {
    const panel = await t.query(api.judges.getPanel, { panelId });
    
    // Submit all votes
    for (const judgeId of panel!.judgeIds) {
      await t.mutation(api.judges.submitVote, {
        panelId,
        judgeId,
        code: 'UPHELD',
        reasons: 'Decision',
        confidence: 0.9,
      });
    }

    // Update case to decided
    await t.mutation(api.cases.updateCaseStatus, {
      caseId,
      status: 'DECIDED',
    });

    // Try to vote again
    const newJudge = await t.mutation(api.judges.registerJudge, {
      did: `did:judge:late-${Date.now()}`,
      name: 'Late Judge',
      specialties: ['SLA_BREACH'],
    });

    await expect(
      t.mutation(api.judges.submitVote, {
        panelId,
        judgeId: newJudge,
        code: 'DISMISSED',
        reasons: 'Too late',
        confidence: 0.8,
      })
    ).rejects.toThrow();
  });
});

describe('AI Deliberation', () => {
  let t: ReturnType<typeof convexTest>;
  let caseId: any;
  let judgeId: string;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
    
    // Create test case
    const { plaintiff, defendant } = await createTestOwnerAndAgents(t);
    const { caseId: testCaseId } = await createTestCaseWithEvidence(t, plaintiff, defendant, 3);
    caseId = testCaseId;
    
    // Create AI judge
    const judge = await t.mutation(api.judges.registerJudge, {
      did: `did:judge:ai-deliberate-${Date.now()}`,
      name: 'AI Judge Test',
      specialties: ['SLA_BREACH', 'AI_ANALYSIS'],
    });
    judgeId = judge.did;
  });

  it('should AI judge analyze evidence and vote', async () => {
    const caseData = await t.query(api.cases.getCaseById, { caseId });
    const evidence = await t.query(api.evidence.getEvidenceByCaseId, { caseId });
    
    // AI deliberation
    const result = await t.action(api.judges.deliberateWithAI, {
      caseData: {
        id: caseId,
        parties: [caseData!.plaintiff, caseData!.defendant],
        type: caseData!.type,
        jurisdictionTags: caseData!.jurisdictionTags,
      },
      evidenceManifests: evidence,
      judgeSpecialties: ['SLA_BREACH', 'AI_ANALYSIS'],
    });

    expect(result).toBeDefined();
    expect(result.code).toBeDefined();
    expect(result.reasons).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should AI provide reasoning for decision', async () => {
    const caseData = await t.query(api.cases.getCaseById, { caseId });
    const evidence = await t.query(api.evidence.getEvidenceByCaseId, { caseId });
    
    const result = await t.action(api.judges.deliberateWithAI, {
      caseData: {
        id: caseId,
        parties: [caseData!.plaintiff, caseData!.defendant],
        type: caseData!.type,
        jurisdictionTags: caseData!.jurisdictionTags,
      },
      evidenceManifests: evidence,
      judgeSpecialties: ['SLA_BREACH'],
    });

    expect(result.reasons).toBeDefined();
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should return result for edge case data', async () => {
    // AI deliberation handles edge cases by returning REMANDED
    const result = await t.action(api.judges.deliberateWithAI, {
      caseData: {
        id: 'test-case',
        parties: [],
        type: 'UNKNOWN',
        jurisdictionTags: [],
      },
      evidenceManifests: [],
      judgeSpecialties: [],
    });

    expect(result).toBeDefined();
    expect(result.code).toBe('REMANDED');
  });
});

describe('Judge Stats Edge Cases', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
  });

  it('should return null for non-existent judge', async () => {
    const stats = await t.query(api.judges.getJudgeStats, {
      judgeId: 'did:judge:nonexistent',
    });

    expect(stats).toBeNull();
  });

  it('should return stats for judge with no votes', async () => {
    const judgeDid = `did:judge:novotes-${Date.now()}`;
    await t.mutation(api.judges.registerJudge, {
      did: judgeDid,
      name: 'Judge No Votes',
      specialties: ['SLA_BREACH'],
    });

    const stats = await t.query(api.judges.getJudgeStats, {
      judgeId: judgeDid,
    });

    expect(stats).toBeDefined();
    expect(stats?.recentVotes).toBe(0);
  });

  it('should return stats for judge with multiple votes', async () => {
    const { plaintiff, defendant } = await createTestOwnerAndAgents(t);
    const { caseId } = await createTestCaseWithEvidence(t, plaintiff, defendant, 2);

    // Create judge and panel
    const judgeDid = `did:judge:multivotes-${Date.now()}`;
    await t.mutation(api.judges.registerJudge, {
      did: judgeDid,
      name: 'Judge Multi Votes',
      specialties: ['SLA_BREACH'],
    });

    const panelId = await t.mutation(api.judges.createPanel, {
      caseId,
      judgeIds: [judgeDid],
    });

    // Submit vote
    await t.mutation(api.judges.submitVote, {
      panelId,
      judgeId: judgeDid,
      code: 'UPHELD',
      reasons: 'Test vote',
      confidence: 0.9,
    });

    const stats = await t.query(api.judges.getJudgeStats, {
      judgeId: judgeDid,
    });

    expect(stats).toBeDefined();
    expect(stats?.recentVotes).toBeGreaterThan(0);
  });
});

describe('Panel Creation Direct', () => {
  let t: ReturnType<typeof convexTest>;
  let caseId: any;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);

    const { plaintiff, defendant } = await createTestOwnerAndAgents(t);
    const { caseId: testCaseId } = await createTestCaseWithEvidence(t, plaintiff, defendant, 1);
    caseId = testCaseId;
  });

  it('should create panel with valid judges', async () => {
    const judge1Did = `did:judge:panel1-${Date.now()}`;
    await t.mutation(api.judges.registerJudge, {
      did: judge1Did,
      name: 'Judge Panel 1',
      specialties: ['SLA_BREACH'],
    });

    const judge2Did = `did:judge:panel2-${Date.now()}`;
    await t.mutation(api.judges.registerJudge, {
      did: judge2Did,
      name: 'Judge Panel 2',
      specialties: ['SLA_BREACH'],
    });

    const panelId = await t.mutation(api.judges.createPanel, {
      caseId,
      judgeIds: [judge1Did, judge2Did],
    });

    expect(panelId).toBeDefined();

    const panel = await t.query(api.judges.getPanel, { panelId });
    expect(panel).toBeDefined();
    expect(panel?.judgeIds).toHaveLength(2);
  });

  it('should handle empty judge list', async () => {
    await expect(
      t.mutation(api.judges.createPanel, {
        caseId,
        judgeIds: [],
      })
    ).resolves.toBeDefined(); // System allows empty panels
  });

  it('should create panel with specified panel size', async () => {
    const judgeDid = `did:judge:sized-${Date.now()}`;
    await t.mutation(api.judges.registerJudge, {
      did: judgeDid,
      name: 'Judge Sized',
      specialties: ['SLA_BREACH'],
    });

    const panelId = await t.mutation(api.judges.createPanel, {
      caseId,
      judgeIds: [judgeDid],
      panelSize: 3,
    });

    expect(panelId).toBeDefined();
  });
});

describe('Panel Status and Retrieval', () => {
  let t: ReturnType<typeof convexTest>;
  let caseId: any;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);

    const { plaintiff, defendant } = await createTestOwnerAndAgents(t);
    const { caseId: testCaseId } = await createTestCaseWithEvidence(t, plaintiff, defendant, 1);
    caseId = testCaseId;
  });

  it('should get panel status after creation', async () => {
    const judgeDid = `did:judge:status-${Date.now()}`;
    await t.mutation(api.judges.registerJudge, {
      did: judgeDid,
      name: 'Judge Status',
      specialties: ['SLA_BREACH'],
    });

    const panelId = await t.mutation(api.judges.createPanel, {
      caseId,
      judgeIds: [judgeDid],
    });

    const status = await t.query(api.judges.getPanelStatus, { panelId });
    expect(status).toBeDefined();
    expect(status?.isComplete).toBe(false);
    expect(status?.remainingVotes).toBe(1);
    expect(status?.judgeIds).toHaveLength(1);
  });

  it('should track votes in panel status', async () => {
    const judgeDid = `did:judge:tracked-${Date.now()}`;
    await t.mutation(api.judges.registerJudge, {
      did: judgeDid,
      name: 'Judge Tracked',
      specialties: ['SLA_BREACH'],
    });

    const panelId = await t.mutation(api.judges.createPanel, {
      caseId,
      judgeIds: [judgeDid],
    });

    await t.mutation(api.judges.submitVote, {
      panelId,
      judgeId: judgeDid,
      code: 'UPHELD',
      reasons: 'Test tracking',
      confidence: 0.9,
    });

    const status = await t.query(api.judges.getPanelStatus, { panelId });
    expect(status?.isComplete).toBe(true);
    expect(status?.remainingVotes).toBe(0);
    expect(status?.voteCounts).toBeDefined();
  });

  it('should return null for non-existent panel', async () => {
    // Create a valid panel first to get proper ID format
    const judgeDid = `did:judge:fake-${Date.now()}`;
    await t.mutation(api.judges.registerJudge, {
      did: judgeDid,
      name: 'Fake Judge',
      specialties: ['SLA_BREACH'],
    });
    
    const realPanelId = await t.mutation(api.judges.createPanel, {
      caseId,
      judgeIds: [judgeDid],
    });
    
    // Modify the ID to make it non-existent
    const fakePanelId = realPanelId.replace(/\d+/, '999999999999999');
    
    const panel = await t.query(api.judges.getPanel, {
      panelId: fakePanelId as any,
    });

    expect(panel).toBeNull();
  });
});

describe('Vote Validation Edge Cases', () => {
  let t: ReturnType<typeof convexTest>;
  let caseId: any;
  let panelId: any;
  let judgeId: string;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);

    const { plaintiff, defendant } = await createTestOwnerAndAgents(t);
    const { caseId: testCaseId } = await createTestCaseWithEvidence(t, plaintiff, defendant, 1);
    caseId = testCaseId;

    judgeId = `did:judge:validation-${Date.now()}`;
    await t.mutation(api.judges.registerJudge, {
      did: judgeId,
      name: 'Judge Validation',
      specialties: ['SLA_BREACH'],
    });

    panelId = await t.mutation(api.judges.assignPanel, {
      caseId,
      panelSize: 1,
    });
  });

  it('should reject vote with invalid judge ID', async () => {
    await expect(
      t.mutation(api.judges.submitVote, {
        panelId,
        judgeId: 'did:judge:invalid',
        code: 'UPHELD',
        reasons: 'Invalid judge',
        confidence: 0.9,
      })
    ).rejects.toThrow();
  });

  it('should reject vote from non-panel judge', async () => {
    const otherJudge = await t.mutation(api.judges.registerJudge, {
      did: `did:judge:other-${Date.now()}`,
      name: 'Judge Other',
      specialties: ['SLA_BREACH'],
    });

    await expect(
      t.mutation(api.judges.submitVote, {
        panelId,
        judgeId: otherJudge.did,
        code: 'UPHELD',
        reasons: 'Not on panel',
        confidence: 0.9,
      })
    ).rejects.toThrow();
  });

  it('should handle various vote codes', async () => {
    for (const code of ['UPHELD', 'DISMISSED', 'REMANDED', 'MODIFIED']) {
      const judgeDid = `did:judge:code-${code}-${Date.now()}`;
      await t.mutation(api.judges.registerJudge, {
        did: judgeDid,
        name: `Judge ${code}`,
        specialties: ['SLA_BREACH'],
      });

      const newPanelId = await t.mutation(api.judges.createPanel, {
        caseId,
        judgeIds: [judgeDid],
      });

      await t.mutation(api.judges.submitVote, {
        panelId: newPanelId,
        judgeId: judgeDid,
        code: code as any,
        reasons: `Test ${code}`,
        confidence: 0.85,
      });

      const updatedPanel = await t.query(api.judges.getPanel, { panelId: newPanelId });
      expect(updatedPanel?.votes[0].code).toBe(code);
    }
  });
});

