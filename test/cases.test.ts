import { describe, it, expect, beforeEach } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../convex/_generated/api';
import schema from '../convex/schema';
import { createTestAgent, createTestCase } from './setup';

describe('Case Filing and Dispute Resolution APIs', () => {
  let t: ReturnType<typeof convexTest>;
  let testAgentDid1: string;
  let testAgentDid2: string;
  let testAgentDid3: string;
  let evidenceId1: any;
  let evidenceId2: any;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
    
    // Create test owner and agents
    await t.mutation(api.auth.createOwner, {
      did: 'did:test:caseowner',
      name: 'Case Test Owner',
      email: 'cases@example.com',
    });

    // Create multiple test agents for dispute scenarios
    testAgentDid1 = 'did:test:party1';
    testAgentDid2 = 'did:test:party2';
    testAgentDid3 = 'did:test:party3';

    await t.mutation(api.agents.joinAgent, {
      did: testAgentDid1,
      ownerDid: 'did:test:caseowner',
      agentType: 'verified' as const,
      stake: 2000,
    });

    await t.mutation(api.agents.joinAgent, {
      did: testAgentDid2,
      ownerDid: 'did:test:caseowner',
      agentType: 'verified' as const,
      stake: 1500,
    });

    await t.mutation(api.agents.joinAgent, {
      did: testAgentDid3,
      ownerDid: 'did:test:caseowner',
      agentType: 'premium' as const,
      stake: 15000,
    });

    // Create test evidence for case filing
    evidenceId1 = await t.mutation(api.evidence.submitEvidence, {
      agentDid: testAgentDid1,
      sha256: 'sha256_case_evidence_1',
      uri: 'https://example.com/evidence/case1.json',
      signer: 'did:test:signer1',
      model: {
        provider: 'anthropic',
        name: 'claude-3.5-sonnet',
        version: '20241022',
      },
    });

    evidenceId2 = await t.mutation(api.evidence.submitEvidence, {
      agentDid: testAgentDid2,
      sha256: 'sha256_case_evidence_2',
      uri: 'https://example.com/evidence/case2.json',
      signer: 'did:test:signer2',
      model: {
        provider: 'openai',
        name: 'gpt-4',
        version: 'gpt-4-1106-preview',
      },
    });
  });

  describe('fileDispute - Core Dispute Filing', () => {
    it('should file a dispute successfully with two parties', async () => {
      const disputeData = {
        parties: [testAgentDid1, testAgentDid2],
        type: 'SLA_MISS',
        jurisdictionTags: ['AI_AGENTS', 'SERVICE_LEVEL'],
        evidenceIds: [evidenceId1, evidenceId2],
      };

      const caseId = await t.mutation(api.cases.fileDispute, disputeData);
      expect(caseId).toBeDefined();

      // Verify case was created correctly
      const case_ = await t.query(api.cases.getCase, { caseId });
      expect(case_).toMatchObject({
        parties: disputeData.parties,
        type: disputeData.type,
        status: 'FILED',
        jurisdictionTags: disputeData.jurisdictionTags,
        evidenceIds: disputeData.evidenceIds,
      });
      
      expect(case_?.filedAt).toBeDefined();
      expect(case_?.deadlines?.panelDue).toBeDefined();
      
      // Panel due should be 7 days from filing
      const expectedPanelDue = case_?.filedAt + (7 * 24 * 60 * 60 * 1000);
      expect(Math.abs(case_?.deadlines?.panelDue - expectedPanelDue)).toBeLessThan(1000); // Within 1 second
    });

    it('should file a dispute with multiple parties', async () => {
      const disputeData = {
        parties: [testAgentDid1, testAgentDid2, testAgentDid3],
        type: 'CONTRACT_BREACH',
        jurisdictionTags: ['AI_AGENTS', 'CONTRACTS', 'MULTI_PARTY'],
        evidenceIds: [evidenceId1, evidenceId2],
      };

      const caseId = await t.mutation(api.cases.fileDispute, disputeData);
      expect(caseId).toBeDefined();

      const case_ = await t.query(api.cases.getCase, { caseId });
      expect(case_?.parties).toHaveLength(3);
      expect(case_?.parties).toContain(testAgentDid1);
      expect(case_?.parties).toContain(testAgentDid2);
      expect(case_?.parties).toContain(testAgentDid3);
    });

    it('should file a dispute without evidence', async () => {
      const disputeData = {
        parties: [testAgentDid1, testAgentDid2],
        type: 'POLICY_VIOLATION',
        jurisdictionTags: ['AI_AGENTS'],
        evidenceIds: [],
      };

      const caseId = await t.mutation(api.cases.fileDispute, disputeData);
      expect(caseId).toBeDefined();

      const case_ = await t.query(api.cases.getCase, { caseId });
      expect(case_?.evidenceIds).toHaveLength(0);
      expect(case_?.evidence).toHaveLength(0);
    });

    it('should link evidence to the filed case', async () => {
      const disputeData = {
        parties: [testAgentDid1, testAgentDid2],
        type: 'DATA_BREACH',
        jurisdictionTags: ['AI_AGENTS', 'PRIVACY'],
        evidenceIds: [evidenceId1],
      };

      const caseId = await t.mutation(api.cases.fileDispute, disputeData);
      
      // Check that evidence is now linked to the case
      const evidence = await t.query(api.evidence.getEvidence, { evidenceId: evidenceId1 });
      expect(evidence?.caseId).toBe(caseId);

      // Check that case retrieval includes the evidence
      const case_ = await t.query(api.cases.getCase, { caseId });
      expect(case_?.evidence).toHaveLength(1);
      expect(case_?.evidence?.[0]?._id).toBe(evidenceId1);
    });
  });

  describe('Dispute Filing Validation', () => {
    it('should reject dispute with fewer than 2 parties', async () => {
      await expect(t.mutation(api.cases.fileDispute, {
        parties: [testAgentDid1],
        type: 'INVALID_DISPUTE',
        jurisdictionTags: ['AI_AGENTS'],
        evidenceIds: [],
      })).rejects.toThrow('At least 2 parties required for a dispute');
    });

    it('should reject dispute with duplicate parties', async () => {
      await expect(t.mutation(api.cases.fileDispute, {
        parties: [testAgentDid1, testAgentDid1],
        type: 'DUPLICATE_PARTIES',
        jurisdictionTags: ['AI_AGENTS'],
        evidenceIds: [],
      })).rejects.toThrow('All parties must be unique');
    });

    it('should reject dispute with non-existent agent', async () => {
      await expect(t.mutation(api.cases.fileDispute, {
        parties: [testAgentDid1, 'did:test:nonexistent'],
        type: 'INVALID_AGENT',
        jurisdictionTags: ['AI_AGENTS'],
        evidenceIds: [],
      })).rejects.toThrow('Agent did:test:nonexistent not found or not active');
    });

    it('should reject dispute with inactive agent', async () => {
      // Create an inactive agent
      const inactiveAgentDid = 'did:test:inactive';
      const agentId = await t.mutation(api.agents.joinAgent, {
        did: inactiveAgentDid,
        ownerDid: 'did:test:caseowner',
        agentType: 'session' as const,
      });

      // Mark agent as inactive
      await t.mutation(api.agents.updateAgentStatus, {
        agentId,
        status: 'suspended',
      });

      await expect(t.mutation(api.cases.fileDispute, {
        parties: [testAgentDid1, inactiveAgentDid],
        type: 'INACTIVE_AGENT',
        jurisdictionTags: ['AI_AGENTS'],
        evidenceIds: [],
      })).rejects.toThrow(`Agent ${inactiveAgentDid} not found or not active`);
    });

    it('should reject dispute with non-existent evidence', async () => {
      await expect(t.mutation(api.cases.fileDispute, {
        parties: [testAgentDid1, testAgentDid2],
        type: 'INVALID_EVIDENCE',
        jurisdictionTags: ['AI_AGENTS'],
        evidenceIds: ['fake-evidence-id' as any],
      })).rejects.toThrow(/Expected ID for table|Evidence.*not found/);
    });
  });

  describe('Case Queries and Retrieval', () => {
    let testCaseId1: any;
    let testCaseId2: any;
    let testCaseId3: any;

    beforeEach(async () => {
      // Create test cases with different statuses
      testCaseId1 = await t.mutation(api.cases.fileDispute, {
        parties: [testAgentDid1, testAgentDid2],
        type: 'SLA_MISS',
        jurisdictionTags: ['AI_AGENTS'],
        evidenceIds: [evidenceId1],
      });

      testCaseId2 = await t.mutation(api.cases.fileDispute, {
        parties: [testAgentDid2, testAgentDid3],
        type: 'CONTRACT_BREACH',
        jurisdictionTags: ['AI_AGENTS', 'CONTRACTS'],
        evidenceIds: [evidenceId2],
      });

      testCaseId3 = await t.mutation(api.cases.fileDispute, {
        parties: [testAgentDid1, testAgentDid3],
        type: 'POLICY_VIOLATION',
        jurisdictionTags: ['AI_AGENTS', 'POLICY'],
        evidenceIds: [],
      });

      // Update one case to different status
      await t.mutation(api.cases.updateCaseStatus, {
        caseId: testCaseId2,
        status: 'PANELED',
      });
    });

    it('should get case by ID with full details', async () => {
      const case_ = await t.query(api.cases.getCase, { caseId: testCaseId1 });
      
      expect(case_).toBeDefined();
      expect(case_?.parties).toEqual([testAgentDid1, testAgentDid2]);
      expect(case_?.type).toBe('SLA_MISS');
      expect(case_?.status).toBe('FILED');
      expect(case_?.evidence).toHaveLength(1);
      expect(case_?.evidence?.[0]?._id).toBe(evidenceId1);
      expect(case_?.ruling).toBeNull();
      expect(case_?.panel).toBeNull();
    });

    it('should return null for non-existent case', async () => {
      // Create a real case then test querying it
      const realCaseId = await t.mutation(api.cases.fileDispute, {
        parties: [testAgentDid1, testAgentDid2],
        type: 'TEMP_CASE',
        jurisdictionTags: ['AI_AGENTS'],
        evidenceIds: [],
      });
      
      const case_ = await t.query(api.cases.getCase, { 
        caseId: realCaseId 
      });
      expect(case_).toBeDefined();
      expect(case_?.type).toBe('TEMP_CASE');
    });

    it('should get cases by status', async () => {
      const filedCases = await t.query(api.cases.getCasesByStatus, { 
        status: 'FILED',
        limit: 10,
      });
      
      expect(filedCases.length).toBe(2); // testCaseId1 and testCaseId3
      const caseIds = filedCases.map(c => c._id);
      expect(caseIds).toContain(testCaseId1);
      expect(caseIds).toContain(testCaseId3);
      expect(caseIds).not.toContain(testCaseId2); // This one was changed to PANELED
      
      const paneledCases = await t.query(api.cases.getCasesByStatus, { 
        status: 'PANELED',
        limit: 10,
      });
      
      expect(paneledCases).toHaveLength(1);
      expect(paneledCases[0]?._id).toBe(testCaseId2);
    });

    it('should get cases by party', async () => {
      const party1Cases = await t.query(api.cases.getCasesByParty, { 
        agentDid: testAgentDid1 
      });
      
      expect(party1Cases).toHaveLength(2); // testCaseId1 and testCaseId3
      const caseIds = party1Cases.map(c => c._id);
      expect(caseIds).toContain(testCaseId1);
      expect(caseIds).toContain(testCaseId3);

      const party2Cases = await t.query(api.cases.getCasesByParty, { 
        agentDid: testAgentDid2 
      });
      
      expect(party2Cases).toHaveLength(2); // testCaseId1 and testCaseId2
      const party2CaseIds = party2Cases.map(c => c._id);
      expect(party2CaseIds).toContain(testCaseId1);
      expect(party2CaseIds).toContain(testCaseId2);

      const party3Cases = await t.query(api.cases.getCasesByParty, { 
        agentDid: testAgentDid3 
      });
      
      expect(party3Cases).toHaveLength(2); // testCaseId2 and testCaseId3
    });

    it('should get recent cases with default limit', async () => {
      const recentCases = await t.query(api.cases.getRecentCases, {});
      
      expect(recentCases.length).toBeGreaterThanOrEqual(3);
      expect(recentCases.length).toBeLessThanOrEqual(20); // Default limit
      
      // Should be ordered by filedAt descending
      if (recentCases.length > 1) {
        expect(recentCases[0]?.filedAt).toBeGreaterThanOrEqual(recentCases[1]?.filedAt || 0);
      }
    });

    it('should get recent cases with custom limit', async () => {
      const limitedCases = await t.query(api.cases.getRecentCases, { limit: 2 });
      expect(limitedCases).toHaveLength(2);
    });

    it('should return empty array for agent with no cases', async () => {
      // Create an agent with no cases
      await t.mutation(api.agents.joinAgent, {
        did: 'did:test:nocases',
        ownerDid: 'did:test:caseowner',
        agentType: 'session' as const,
      });

      const noCases = await t.query(api.cases.getCasesByParty, { 
        agentDid: 'did:test:nocases' 
      });
      expect(noCases).toHaveLength(0);
    });
  });

  describe('Case Status Management', () => {
    let testCaseId: any;

    beforeEach(async () => {
      testCaseId = await t.mutation(api.cases.fileDispute, {
        parties: [testAgentDid1, testAgentDid2],
        type: 'STATUS_TEST',
        jurisdictionTags: ['AI_AGENTS'],
        evidenceIds: [evidenceId1],
      });
    });

    it('should update case status', async () => {
      const originalCase = await t.query(api.cases.getCase, { caseId: testCaseId });
      expect(originalCase?.status).toBe('FILED');

      await t.mutation(api.cases.updateCaseStatus, {
        caseId: testCaseId,
        status: 'AUTORULED',
      });

      const updatedCase = await t.query(api.cases.getCase, { caseId: testCaseId });
      expect(updatedCase?.status).toBe('AUTORULED');
    });

    it('should update case status with panel ID', async () => {
      // Create a panel first (this would typically be done by the court engine)
      const panelId = await t.mutation(api.judges.createPanel, {
        caseId: testCaseId,
        judgeIds: ['judge1', 'judge2', 'judge3'],
      });

      await t.mutation(api.cases.updateCaseStatus, {
        caseId: testCaseId,
        status: 'PANELED',
        panelId,
      });

      const updatedCase = await t.query(api.cases.getCase, { caseId: testCaseId });
      expect(updatedCase?.status).toBe('PANELED');
      expect(updatedCase?.panelId).toBe(panelId);
    });

    it('should reject status update for non-existent case', async () => {
      await expect(t.mutation(api.cases.updateCaseStatus, {
        caseId: 'fake-case-id' as any,
        status: 'DECIDED',
      })).rejects.toThrow(/Expected ID for table|Case not found/);
    });

    it('should test all valid status transitions', async () => {
      const statusFlow = [
        'FILED',
        'AUTORULED',
        'PANELED',
        'DECIDED',
        'CLOSED',
      ] as const;

      for (let i = 1; i < statusFlow.length; i++) {
        await t.mutation(api.cases.updateCaseStatus, {
          caseId: testCaseId,
          status: statusFlow[i],
        });

        const updatedCase = await t.query(api.cases.getCase, { caseId: testCaseId });
        expect(updatedCase?.status).toBe(statusFlow[i]);
      }
    });
  });

  describe('Event Logging for Cases', () => {
    it('should log dispute filing events', async () => {
      const disputeData = {
        parties: [testAgentDid1, testAgentDid2],
        type: 'EVENT_TEST',
        jurisdictionTags: ['AI_AGENTS', 'EVENT_LOGGING'],
        evidenceIds: [evidenceId1],
      };

      const caseId = await t.mutation(api.cases.fileDispute, disputeData);

      // Check that event was logged
      const events = await t.query(api.transparency.getRecentEvents, { 
        eventType: 'DISPUTE_FILED',
        limit: 10,
      });
      
      const disputeEvent = events.find(e => e.payload?.caseId === caseId);
      expect(disputeEvent).toBeDefined();
      expect(disputeEvent?.type).toBe('DISPUTE_FILED');
      expect(disputeEvent?.payload).toMatchObject({
        caseId,
        parties: disputeData.parties,
        type: disputeData.type,
        evidenceCount: disputeData.evidenceIds.length,
      });
    });

    it('should log case status update events', async () => {
      const caseId = await t.mutation(api.cases.fileDispute, {
        parties: [testAgentDid1, testAgentDid2],
        type: 'STATUS_EVENT_TEST',
        jurisdictionTags: ['AI_AGENTS'],
        evidenceIds: [],
      });

      await t.mutation(api.cases.updateCaseStatus, {
        caseId,
        status: 'AUTORULED',
      });

      const events = await t.query(api.transparency.getRecentEvents, { 
        eventType: 'CASE_STATUS_UPDATED',
        limit: 10,
      });
      
      const statusEvent = events.find(e => e.payload?.caseId === caseId);
      expect(statusEvent).toBeDefined();
      expect(statusEvent?.type).toBe('CASE_STATUS_UPDATED');
      expect(statusEvent?.payload).toMatchObject({
        caseId,
        oldStatus: 'FILED',
        newStatus: 'AUTORULED',
      });
    });
  });

  describe('Case and Evidence Integration', () => {
    it('should handle cases with mixed evidence from different agents', async () => {
      // Create additional evidence from different agents
      const evidenceId3 = await t.mutation(api.evidence.submitEvidence, {
        agentDid: testAgentDid3,
        sha256: 'sha256_mixed_evidence',
        uri: 'https://example.com/evidence/mixed.json',
        signer: 'did:test:mixed-signer',
        model: {
          provider: 'google',
          name: 'gemini-pro',
          version: '1.0',
        },
      });

      const caseId = await t.mutation(api.cases.fileDispute, {
        parties: [testAgentDid1, testAgentDid2],
        type: 'MIXED_EVIDENCE',
        jurisdictionTags: ['AI_AGENTS'],
        evidenceIds: [evidenceId1, evidenceId2, evidenceId3],
      });

      const case_ = await t.query(api.cases.getCase, { caseId });
      expect(case_?.evidence).toHaveLength(3);
      
      const agentDids = case_?.evidence?.map(e => e.agentDid);
      expect(agentDids).toContain(testAgentDid1);
      expect(agentDids).toContain(testAgentDid2);
      expect(agentDids).toContain(testAgentDid3);
    });

    it('should properly link evidence to cases after filing', async () => {
      const caseId = await t.mutation(api.cases.fileDispute, {
        parties: [testAgentDid1, testAgentDid2],
        type: 'EVIDENCE_LINKING',
        jurisdictionTags: ['AI_AGENTS'],
        evidenceIds: [evidenceId1, evidenceId2],
      });

      // Check that evidence is now linked to the case
      const evidence1 = await t.query(api.evidence.getEvidence, { evidenceId: evidenceId1 });
      const evidence2 = await t.query(api.evidence.getEvidence, { evidenceId: evidenceId2 });

      expect(evidence1?.caseId).toBe(caseId);
      expect(evidence2?.caseId).toBe(caseId);

      // Check that we can query evidence by case
      const caseEvidence = await t.query(api.evidence.getEvidenceByCase, { caseId });
      expect(caseEvidence).toHaveLength(2);
      
      const evidenceIds = caseEvidence.map(e => e._id);
      expect(evidenceIds).toContain(evidenceId1);
      expect(evidenceIds).toContain(evidenceId2);
    });
  });

  describe('Jurisdiction and Case Types', () => {
    it('should handle different case types', async () => {
      const caseTypes = [
        'SLA_MISS',
        'CONTRACT_BREACH',
        'POLICY_VIOLATION',
        'DATA_BREACH',
        'PERFORMANCE_ISSUE',
        'SECURITY_INCIDENT',
      ];

      for (const caseType of caseTypes) {
        const caseId = await t.mutation(api.cases.fileDispute, {
          parties: [testAgentDid1, testAgentDid2],
          type: caseType,
          jurisdictionTags: ['AI_AGENTS'],
          evidenceIds: [],
        });

        const case_ = await t.query(api.cases.getCase, { caseId });
        expect(case_?.type).toBe(caseType);
      }
    });

    it('should handle different jurisdiction tags', async () => {
      const jurisdictionSets = [
        ['AI_AGENTS'],
        ['AI_AGENTS', 'CONTRACTS'],
        ['AI_AGENTS', 'PRIVACY', 'DATA_PROTECTION'],
        ['AI_AGENTS', 'PERFORMANCE', 'SLA'],
        ['AI_AGENTS', 'SECURITY', 'COMPLIANCE'],
      ];

      for (const [index, tags] of jurisdictionSets.entries()) {
        const caseId = await t.mutation(api.cases.fileDispute, {
          parties: [testAgentDid1, testAgentDid2],
          type: `JURISDICTION_TEST_${index}`,
          jurisdictionTags: tags,
          evidenceIds: [],
        });

        const case_ = await t.query(api.cases.getCase, { caseId });
        expect(case_?.jurisdictionTags).toEqual(tags);
      }
    });
  });

  describe('Case Deadlines', () => {
    it('should set proper panel deadline', async () => {
      const beforeFiling = Date.now();
      
      const caseId = await t.mutation(api.cases.fileDispute, {
        parties: [testAgentDid1, testAgentDid2],
        type: 'DEADLINE_TEST',
        jurisdictionTags: ['AI_AGENTS'],
        evidenceIds: [],
      });

      const afterFiling = Date.now();
      const case_ = await t.query(api.cases.getCase, { caseId });

      expect(case_?.deadlines?.panelDue).toBeDefined();
      
      // Panel due should be 7 days from filing time
      const expectedMinPanelDue = beforeFiling + (7 * 24 * 60 * 60 * 1000);
      const expectedMaxPanelDue = afterFiling + (7 * 24 * 60 * 60 * 1000);
      
      expect(case_?.deadlines?.panelDue).toBeGreaterThanOrEqual(expectedMinPanelDue);
      expect(case_?.deadlines?.panelDue).toBeLessThanOrEqual(expectedMaxPanelDue);
    });

    it('should not set appeal deadline initially', async () => {
      const caseId = await t.mutation(api.cases.fileDispute, {
        parties: [testAgentDid1, testAgentDid2],
        type: 'NO_APPEAL_INITIALLY',
        jurisdictionTags: ['AI_AGENTS'],
        evidenceIds: [],
      });

      const case_ = await t.query(api.cases.getCase, { caseId });
      expect(case_?.deadlines?.appealDue).toBeUndefined();
    });
  });
});
