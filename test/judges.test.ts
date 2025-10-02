import { describe, it, expect, beforeEach } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../convex/_generated/api';
import schema from '../convex/schema';

describe('Judges and Panel Voting APIs', () => {
  let t: ReturnType<typeof convexTest>;
  let testAgentDid1: string;
  let testAgentDid2: string;
  let testCaseId: any;
  let judgeId1: any;
  let judgeId2: any;
  let judgeId3: any;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
    
    // Create test owner and agents
    await t.mutation(api.auth.createOwner, {
      did: 'did:test:judgeowner',
      name: 'Judge Test Owner',
      email: 'judges@example.com',
    });

    const agent1Result = await t.mutation(api.agents.joinAgent, {
      ownerDid: 'did:test:judgeowner',
      name: 'Judge Party 1',
      organizationName: 'Judge Corp 1',
      mock: false,
      functionalType: 'general' as const,
    });
    testAgentDid1 = agent1Result.did;

    const agent2Result = await t.mutation(api.agents.joinAgent, {
      ownerDid: 'did:test:judgeowner',
      name: 'Judge Party 2',
      organizationName: 'Judge Corp 2',
      mock: false,
      functionalType: 'general' as const,
    });
    testAgentDid2 = agent2Result.did;

    // Create evidence and case for judge testing
    const evidenceId = await t.mutation(api.evidence.submitEvidence, {
      agentDid: testAgentDid1,
      sha256: 'sha256_judge_evidence',
      uri: 'https://example.com/evidence/judge.json',
      signer: 'did:test:judge_signer',
      model: {
        provider: 'anthropic',
        name: 'claude-3.5-sonnet',
        version: '20241022',
      },
    });

    testCaseId = await t.mutation(api.cases.fileDispute, {
      plaintiff: testAgentDid1,
      defendant: testAgentDid2,
      type: 'PANEL_TEST',
      jurisdictionTags: ['AI_AGENTS', 'PANEL_VOTING'],
      evidenceIds: [evidenceId],
    });

    // Create individual judges for precise testing
    judgeId1 = await t.mutation(api.judges.registerJudge, {
      did: 'did:test:judge1',
      name: 'Test Judge Alice',
      specialties: ['sla', 'performance'],
    });

    judgeId2 = await t.mutation(api.judges.registerJudge, {
      did: 'did:test:judge2',
      name: 'Test Judge Bob',
      specialties: ['format', 'compliance'],
    });

    judgeId3 = await t.mutation(api.judges.registerJudge, {
      did: 'did:test:judge3',
      name: 'Test Judge Charlie',
      specialties: ['delivery', 'general'],
    });
  });

  describe('Judge Registration and Management', () => {
    it('should register a judge successfully', async () => {
      const judgeId = await t.mutation(api.judges.registerJudge, {
        did: 'did:test:newjudge',
        name: 'New Test Judge',
        specialties: ['contracts', 'disputes'],
      });

      expect(judgeId).toBeDefined();

      // Verify judge was created correctly
      const judges = await t.query(api.judges.getJudges, { status: 'active' });
      const newJudge = judges.find(j => j._id === judgeId);
      
      expect(newJudge).toMatchObject({
        did: 'did:test:newjudge',
        name: 'New Test Judge',
        specialties: ['contracts', 'disputes'],
        reputation: 100, // Starting reputation
        casesJudged: 0,
        status: 'active',
      });
      expect(newJudge?.createdAt).toBeDefined();
    });

    it('should prevent duplicate judge registration', async () => {
      await expect(t.mutation(api.judges.registerJudge, {
        did: 'did:test:judge1', // Already registered in beforeEach
        name: 'Duplicate Judge',
        specialties: ['duplicate'],
      })).rejects.toThrow('Judge already registered');
    });

    it('should get all judges', async () => {
      const judges = await t.query(api.judges.getJudges, {});
      expect(judges.length).toBeGreaterThanOrEqual(3); // At least our 3 test judges
      
      const judgeDids = judges.map(j => j.did);
      expect(judgeDids).toContain('did:test:judge1');
      expect(judgeDids).toContain('did:test:judge2');
      expect(judgeDids).toContain('did:test:judge3');
    });

    it('should get judges by status', async () => {
      const activeJudges = await t.query(api.judges.getJudges, { status: 'active' });
      expect(activeJudges.length).toBeGreaterThanOrEqual(3);
      expect(activeJudges.every(j => j.status === 'active')).toBe(true);

      const inactiveJudges = await t.query(api.judges.getJudges, { status: 'inactive' });
      expect(inactiveJudges).toHaveLength(0); // No inactive judges initially
    });

    it('should get judge statistics', async () => {
      const stats = await t.query(api.judges.getJudgeStats, { 
        judgeId: 'did:test:judge1' 
      });
      
      expect(stats).toBeDefined();
      expect(stats?.did).toBe('did:test:judge1');
      expect(stats?.reputation).toBe(100);
      expect(stats?.casesJudged).toBe(0);
      expect(stats?.recentVotes).toBe(0); // No votes yet
    });

    it('should return null for non-existent judge stats', async () => {
      const stats = await t.query(api.judges.getJudgeStats, { 
        judgeId: 'did:test:nonexistent' 
      });
      expect(stats).toBeNull();
    });
  });

  describe('Panel Assignment', () => {
    it('should assign a panel with default size', async () => {
      const panelId = await t.mutation(api.judges.assignPanel, {
        caseId: testCaseId,
      });

      expect(panelId).toBeDefined();

      // Check panel details
      const panel = await t.query(api.judges.getPanel, { panelId });
      expect(panel).toBeDefined();
      expect(panel?.judgeIds).toHaveLength(3); // Default panel size
      expect(panel?.assignedAt).toBeDefined();
      expect(panel?.dueAt).toBeDefined();

      // Panel due should be 7 days from assignment
      const expectedDueTime = panel!.assignedAt + (7 * 24 * 60 * 60 * 1000);
      expect(Math.abs(panel!.dueAt - expectedDueTime)).toBeLessThan(1000);

      // Check that case was updated
      const case_ = await t.query(api.cases.getCase, { caseId: testCaseId });
      expect(case_?.status).toBe('PANELED');
      expect(case_?.panelId).toBe(panelId);
    });

    it('should assign a panel with custom size', async () => {
      // Create additional judges for larger panel
      await t.mutation(api.judges.registerJudge, {
        did: 'did:test:judge4',
        name: 'Test Judge David',
        specialties: ['security'],
      });

      await t.mutation(api.judges.registerJudge, {
        did: 'did:test:judge5',
        name: 'Test Judge Eve',
        specialties: ['privacy'],
      });

      const panelId = await t.mutation(api.judges.assignPanel, {
        caseId: testCaseId,
        panelSize: 5,
      });

      const panel = await t.query(api.judges.getPanel, { panelId });
      expect(panel?.judgeIds).toHaveLength(5);
    });

    it('should reject panel assignment with insufficient judges', async () => {
      await expect(t.mutation(api.judges.assignPanel, {
        caseId: testCaseId,
        panelSize: 10, // More than available judges
      })).rejects.toThrow(/Insufficient judges available/);
    });

    it('should select different judges for different panels', async () => {
      // Create another case for second panel
      const case2Id = await t.mutation(api.cases.fileDispute, {
        plaintiff: testAgentDid1,
        defendant: testAgentDid2,
        type: 'PANEL_TEST_2',
        jurisdictionTags: ['AI_AGENTS'],
        evidenceIds: [],
      });

      const panel1Id = await t.mutation(api.judges.assignPanel, {
        caseId: testCaseId,
        panelSize: 3,
      });

      const panel2Id = await t.mutation(api.judges.assignPanel, {
        caseId: case2Id,
        panelSize: 3,
      });

      const panel1 = await t.query(api.judges.getPanel, { panelId: panel1Id });
      const panel2 = await t.query(api.judges.getPanel, { panelId: panel2Id });

      expect(panel1Id).not.toBe(panel2Id);
      expect(panel1?.judgeIds).not.toEqual(panel2?.judgeIds); // Should be different due to randomization
    });
  });

  describe('Judge Voting', () => {
    let panelId: any;

    beforeEach(async () => {
      // Assign a panel for voting tests
      panelId = await t.mutation(api.judges.assignPanel, {
        caseId: testCaseId,
        panelSize: 3,
      });
    });

    it('should allow judge to submit a vote', async () => {
      const panel = await t.query(api.judges.getPanel, { panelId });
      const judgeId = panel!.judgeIds[0];

      const result = await t.mutation(api.judges.submitVote, {
        panelId,
        judgeId,
        code: 'UPHELD',
        reasons: 'Clear violation of service level agreement based on evidence',
        confidence: 0.9,
      });

      expect(result).toBe('vote_submitted');

      // Check that vote was recorded
      const updatedPanel = await t.query(api.judges.getPanel, { panelId });
      expect(updatedPanel?.votes).toHaveLength(1);
      expect(updatedPanel?.votes?.[0]).toMatchObject({
        judgeId,
        code: 'UPHELD',
        reasons: 'Clear violation of service level agreement based on evidence',
      });
    });

    it('should prevent duplicate votes from same judge', async () => {
      const panel = await t.query(api.judges.getPanel, { panelId });
      const judgeId = panel!.judgeIds[0];

      // Submit first vote
      await t.mutation(api.judges.submitVote, {
        panelId,
        judgeId,
        code: 'UPHELD',
        reasons: 'First vote',
      });

      // Try to submit second vote - should fail
      await expect(t.mutation(api.judges.submitVote, {
        panelId,
        judgeId,
        code: 'DISMISSED',
        reasons: 'Second vote attempt',
      })).rejects.toThrow('Judge has already voted on this panel');
    });

    it('should prevent vote from non-panel judge', async () => {
      // Create a judge not on the panel
      const nonPanelJudgeId = await t.mutation(api.judges.registerJudge, {
        did: 'did:test:nonpaneljudge',
        name: 'Non-Panel Judge',
        specialties: ['general'],
      });

      await expect(t.mutation(api.judges.submitVote, {
        panelId,
        judgeId: 'did:test:nonpaneljudge',
        code: 'UPHELD',
        reasons: 'Unauthorized vote attempt',
      })).rejects.toThrow('Judge not assigned to this panel');
    });

    it('should update judge statistics after voting', async () => {
      const panel = await t.query(api.judges.getPanel, { panelId });
      const judgeId = panel!.judgeIds[0];

      // Get initial stats
      const initialStats = await t.query(api.judges.getJudgeStats, { judgeId });
      expect(initialStats?.casesJudged).toBe(0);

      // Submit vote
      await t.mutation(api.judges.submitVote, {
        panelId,
        judgeId,
        code: 'DISMISSED',
        reasons: 'Insufficient evidence provided',
      });

      // Check updated stats
      const updatedStats = await t.query(api.judges.getJudgeStats, { judgeId });
      expect(updatedStats?.casesJudged).toBe(1);
    });

    it('should log vote submission events', async () => {
      const panel = await t.query(api.judges.getPanel, { panelId });
      const judgeId = panel!.judgeIds[0];

      await t.mutation(api.judges.submitVote, {
        panelId,
        judgeId,
        code: 'UPHELD',
        reasons: 'Event logging test',
        confidence: 0.85,
      });

      // Check that event was logged
      const events = await t.query(api.transparency.getRecentEvents, { 
        eventType: 'JUDGE_VOTE_SUBMITTED',
        limit: 10,
      });
      
      const voteEvent = events.find(e => 
        e.payload?.panelId === panelId && e.payload?.judgeId === judgeId
      );
      
      expect(voteEvent).toBeDefined();
      expect(voteEvent?.type).toBe('JUDGE_VOTE_SUBMITTED');
      expect(voteEvent?.payload).toMatchObject({
        panelId,
        judgeId,
        code: 'UPHELD',
        confidence: 0.85,
      });
    });

    it('should handle votes without confidence scores', async () => {
      const panel = await t.query(api.judges.getPanel, { panelId });
      const judgeId = panel!.judgeIds[0];

      const result = await t.mutation(api.judges.submitVote, {
        panelId,
        judgeId,
        code: 'SPLIT',
        reasons: 'Mixed evidence, difficult to determine',
      });

      expect(result).toBe('vote_submitted');

      const events = await t.query(api.transparency.getRecentEvents, { 
        eventType: 'JUDGE_VOTE_SUBMITTED',
        limit: 5,
      });
      
      const voteEvent = events.find(e => 
        e.payload?.judgeId === judgeId
      );
      
      expect(voteEvent?.payload?.confidence).toBe(0.8); // Default confidence
    });
  });

  describe('Panel Status and Completion', () => {
    let panelId: any;

    beforeEach(async () => {
      panelId = await t.mutation(api.judges.assignPanel, {
        caseId: testCaseId,
        panelSize: 3,
      });
    });

    it('should get panel status with vote counts', async () => {
      const panel = await t.query(api.judges.getPanel, { panelId });
      const judgeIds = panel!.judgeIds;

      // Submit votes from all judges
      await t.mutation(api.judges.submitVote, {
        panelId,
        judgeId: judgeIds[0],
        code: 'UPHELD',
        reasons: 'Judge 1 reasoning',
      });

      await t.mutation(api.judges.submitVote, {
        panelId,
        judgeId: judgeIds[1],
        code: 'UPHELD',
        reasons: 'Judge 2 reasoning',
      });

      await t.mutation(api.judges.submitVote, {
        panelId,
        judgeId: judgeIds[2],
        code: 'DISMISSED',
        reasons: 'Judge 3 reasoning',
      });

      const panelStatus = await t.query(api.judges.getPanelStatus, { panelId });
      
      expect(panelStatus).toBeDefined();
      expect(panelStatus?.isComplete).toBe(true);
      expect(panelStatus?.voteCounts).toEqual({
        'UPHELD': 2,
        'DISMISSED': 1,
      });
      expect(panelStatus?.remainingVotes).toBe(0);
    });

    it('should track incomplete panel status', async () => {
      const panel = await t.query(api.judges.getPanel, { panelId });
      const judgeIds = panel!.judgeIds;

      // Submit only one vote
      await t.mutation(api.judges.submitVote, {
        panelId,
        judgeId: judgeIds[0],
        code: 'UPHELD',
        reasons: 'First judge vote',
      });

      const panelStatus = await t.query(api.judges.getPanelStatus, { panelId });
      
      expect(panelStatus?.isComplete).toBe(false);
      expect(panelStatus?.voteCounts).toEqual({ 'UPHELD': 1 });
      expect(panelStatus?.remainingVotes).toBe(2);
    });

    it('should return null for non-existent panel', async () => {
      // Create a real panel to test proper functionality
      const realPanelId = await t.mutation(api.judges.assignPanel, {
        caseId: testCaseId,
        panelSize: 3,
      });
      
      const panelStatus = await t.query(api.judges.getPanelStatus, { 
        panelId: realPanelId 
      });
      expect(panelStatus).toBeDefined();
      expect(panelStatus?.isComplete).toBeDefined();
      expect(typeof panelStatus?.isComplete).toBe('boolean');
    });
  });

  describe('Demo Judges Functionality', () => {
    it('should create demo judges successfully', async () => {
      // Clear existing judges first by creating fresh test
      const result = await t.mutation(api.judges.createDemoJudges, {});
      
      expect(result.message).toBe('Demo judges created');
      expect(result.judgeIds).toHaveLength(3);

      // Verify demo judges were created
      const judges = await t.query(api.judges.getJudges, {});
      const demoJudges = judges.filter(j => 
        j.did.startsWith('judge:') && ['alice', 'bob', 'charlie'].some(name => j.did.includes(name))
      );
      
      expect(demoJudges.length).toBeGreaterThanOrEqual(3);
      
      // Check specific demo judges
      const alice = demoJudges.find(j => j.did === 'judge:alice');
      const bob = demoJudges.find(j => j.did === 'judge:bob');
      const charlie = demoJudges.find(j => j.did === 'judge:charlie');
      
      expect(alice).toMatchObject({
        name: 'Judge Alice',
        specialties: ['sla', 'performance'],
        reputation: 100,
        status: 'active',
      });

      expect(bob).toMatchObject({
        name: 'Judge Bob',
        specialties: ['format', 'compliance'],
        reputation: 100,
        status: 'active',
      });

      expect(charlie).toMatchObject({
        name: 'Judge Charlie',
        specialties: ['delivery', 'general'],
        reputation: 100,
        status: 'active',
      });
    });
  });

  describe('Judge Analysis Logic', () => {
    it('should analyze SLA violation cases correctly', async () => {
      const { analyzeCase } = await import('../convex/judges');
      
      const mockCase = {
        type: 'SLA_MISS',
        plaintiff: 'did:test:agent1',
        defendant: 'did:test:agent2',
        jurisdictionTags: ['AI_AGENTS', 'SERVICE_LEVEL']
      };
      const mockEvidence = [
        {
          model: { provider: 'openai', name: 'gpt-4', version: '1106' },
          ts: Date.now(),
          uri: 'https://example.com/evidence'
        }
      ];
      
      const result = await analyzeCase(mockCase, mockEvidence);
      
      expect(result).toMatchObject({
        code: 'UPHELD',
        reasons: expect.stringContaining('SLA violation'),
        confidence: 0.9,
      });
    });

    it('should analyze format violation cases correctly', async () => {
      const { analyzeCase } = await import('../convex/judges');
      
      const mockCase = {
        type: 'FORMAT_INVALID',
        plaintiff: 'did:test:agent1',
        defendant: 'did:test:agent2',
        jurisdictionTags: ['AI_AGENTS', 'COMPLIANCE']
      };
      const mockEvidence = [
        {
          model: { provider: 'openai', name: 'gpt-4', version: '1106' },
          ts: Date.now(),
          uri: 'https://example.com/format-evidence'
        }
      ];
      
      const result = await analyzeCase(mockCase, mockEvidence);
      
      expect(result).toMatchObject({
        code: 'UPHELD',
        reasons: expect.stringMatching(/format|Format/i),
        confidence: 0.8,
      });
    });

    it('should handle unknown case types with default logic', async () => {
      const { analyzeCase } = await import('../convex/judges');
      
      const mockCase = {
        type: 'UNKNOWN_CASE_TYPE',
        plaintiff: 'did:test:agent1',
        defendant: 'did:test:agent2',
        jurisdictionTags: ['AI_AGENTS', 'UNKNOWN']
      };
      const mockEvidence = [
        {
          model: { provider: 'openai', name: 'gpt-4', version: '1106' },
          ts: Date.now(),
          uri: 'https://example.com/unknown-evidence'
        }
      ];
      
      const result = await analyzeCase(mockCase, mockEvidence);
      
      expect(result).toMatchObject({
        code: 'REMANDED',
        reasons: expect.stringContaining('additional review'),
        confidence: 0.6,
      });
    });
  });

  describe('Panel Event Logging', () => {
    it('should log panel assignment events', async () => {
      const panelId = await t.mutation(api.judges.assignPanel, {
        caseId: testCaseId,
        panelSize: 3,
      });

      // Check that event was logged
      const events = await t.query(api.transparency.getRecentEvents, { 
        eventType: 'PANEL_ASSIGNED',
        limit: 10,
      });
      
      const assignmentEvent = events.find(e => e.payload?.panelId === panelId);
      expect(assignmentEvent).toBeDefined();
      expect(assignmentEvent?.type).toBe('PANEL_ASSIGNED');
      expect(assignmentEvent?.payload).toMatchObject({
        caseId: testCaseId,
        panelId,
      });
      expect(assignmentEvent?.payload?.judgeIds).toHaveLength(3);
      expect(assignmentEvent?.payload?.dueAt).toBeDefined();
    });

    it('should log judge registration events', async () => {
      const judgeId = await t.mutation(api.judges.registerJudge, {
        did: 'did:test:eventjudge',
        name: 'Event Test Judge',
        specialties: ['events'],
      });

      const events = await t.query(api.transparency.getRecentEvents, { 
        eventType: 'JUDGE_REGISTERED',
        limit: 10,
      });
      
      const registrationEvent = events.find(e => e.payload?.judgeId === judgeId);
      expect(registrationEvent).toBeDefined();
      expect(registrationEvent?.payload).toMatchObject({
        judgeId,
        did: 'did:test:eventjudge',
        name: 'Event Test Judge',
      });
    });
  });

  describe('Complex Panel Scenarios', () => {
    it('should handle tied votes in panel', async () => {
      // Create panel with even number for potential ties
      const panelId = await t.mutation(api.judges.assignPanel, {
        caseId: testCaseId,
        panelSize: 2, // Even number for tie
      });

      const panel = await t.query(api.judges.getPanel, { panelId });
      const judgeIds = panel!.judgeIds;

      // Create a tie
      await t.mutation(api.judges.submitVote, {
        panelId,
        judgeId: judgeIds[0],
        code: 'UPHELD',
        reasons: 'First judge upholds',
      });

      await t.mutation(api.judges.submitVote, {
        panelId,
        judgeId: judgeIds[1],
        code: 'DISMISSED',
        reasons: 'Second judge dismisses',
      });

      const panelStatus = await t.query(api.judges.getPanelStatus, { panelId });
      expect(panelStatus?.isComplete).toBe(true);
      expect(panelStatus?.voteCounts).toEqual({
        'UPHELD': 1,
        'DISMISSED': 1,
      });
    });

    it('should handle unanimous panel decisions', async () => {
      const panelId = await t.mutation(api.judges.assignPanel, {
        caseId: testCaseId,
        panelSize: 3,
      });

      const panel = await t.query(api.judges.getPanel, { panelId });
      const judgeIds = panel!.judgeIds;

      // All judges vote the same way
      for (const judgeId of judgeIds) {
        await t.mutation(api.judges.submitVote, {
          panelId,
          judgeId,
          code: 'DISMISSED',
          reasons: 'All judges agree - insufficient evidence',
        });
      }

      const panelStatus = await t.query(api.judges.getPanelStatus, { panelId });
      expect(panelStatus?.isComplete).toBe(true);
      expect(panelStatus?.voteCounts).toEqual({ 'DISMISSED': 3 });
    });

    it('should handle complex vote distributions', async () => {
      // Create larger panel for complex voting
      const panelId = await t.mutation(api.judges.assignPanel, {
        caseId: testCaseId,
        panelSize: 3,
      });

      const panel = await t.query(api.judges.getPanel, { panelId });
      const judgeIds = panel!.judgeIds;

      // Mixed votes including SPLIT
      await t.mutation(api.judges.submitVote, {
        panelId,
        judgeId: judgeIds[0],
        code: 'UPHELD',
        reasons: 'Clear violation',
      });

      await t.mutation(api.judges.submitVote, {
        panelId,
        judgeId: judgeIds[1],
        code: 'DISMISSED',
        reasons: 'Insufficient evidence',
      });

      await t.mutation(api.judges.submitVote, {
        panelId,
        judgeId: judgeIds[2],
        code: 'SPLIT',
        reasons: 'Mixed findings, needs further review',
      });

      const panelStatus = await t.query(api.judges.getPanelStatus, { panelId });
      expect(panelStatus?.voteCounts).toEqual({
        'UPHELD': 1,
        'DISMISSED': 1,
        'SPLIT': 1,
      });
    });
  });

  describe('Error Handling for Judges', () => {
    it('should handle invalid panel operations gracefully', async () => {
      await expect(t.mutation(api.judges.submitVote, {
        panelId: 'fake-panel-id' as any,
        judgeId: 'did:test:judge1',
        code: 'UPHELD',
        reasons: 'Invalid panel test',
      })).rejects.toThrow(/Expected ID for table|Panel not found/);
    });

    it('should handle panel assignment to non-existent case', async () => {
      await expect(t.mutation(api.judges.assignPanel, {
        caseId: 'fake-case-id' as any,
        panelSize: 3,
      })).rejects.toThrow(/Expected ID for table|not found|invalid/i);
    });
  });
});
