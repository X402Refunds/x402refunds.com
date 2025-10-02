import { describe, it, expect, beforeEach } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../convex/_generated/api';
import schema from '../convex/schema';

describe('Case Filing & Management - MVP', () => {
  let t: ReturnType<typeof convexTest>;
  let plaintiff: string;
  let defendant: string;
  let evidenceId: any;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
    
    // Create test owner
    await t.mutation(api.auth.createOwner, {
      did: 'did:test:owner',
      name: 'Test Owner',
      email: 'test@example.com',
    });

    // Create test agents with new schema
    const plaintiffResult = await t.mutation(api.agents.joinAgent, {
      ownerDid: 'did:test:owner',
      name: 'Plaintiff Agent',
      organizationName: 'Plaintiff Corp',
      mock: false,
    });
    plaintiff = plaintiffResult.did;

    const defendantResult = await t.mutation(api.agents.joinAgent, {
      ownerDid: 'did:test:owner',
      name: 'Defendant Agent',
      organizationName: 'Defendant Corp',
      mock: false,
    });
    defendant = defendantResult.did;

    // Create test evidence
    evidenceId = await t.mutation(api.evidence.submitEvidence, {
      agentDid: plaintiff,
      sha256: 'sha256_evidence_1',
      uri: 'https://example.com/evidence.json',
      signer: 'did:test:signer',
      model: {
        provider: 'anthropic',
        name: 'claude-3.5-sonnet',
        version: '20241022',
      },
    });
  });

  describe('Case Filing', () => {
    it('should file a dispute with plaintiff and defendant', async () => {
      const caseId = await t.mutation(api.cases.fileDispute, {
        plaintiff,
        defendant,
        type: 'SLA_BREACH',
        jurisdictionTags: ['ai-service', 'sla'],
        evidenceIds: [evidenceId],
        description: 'API latency exceeded SLA',
        claimedDamages: 10000,
        breachDetails: {
          duration: '2 hours',
          impactLevel: 'HIGH',
          affectedUsers: 1000,
          slaRequirement: '99.9% uptime',
          actualPerformance: '95% uptime',
        },
      });

      expect(caseId).toBeDefined();

      const case_ = await t.query(api.cases.getCaseById, { caseId });
      expect(case_).toMatchObject({
        plaintiff,
        defendant,
        parties: [plaintiff, defendant],
        type: 'SLA_BREACH',
        status: 'FILED',
        description: 'API latency exceeded SLA',
        claimedDamages: 10000,
      });
    });

    it('should prevent filing dispute with same plaintiff and defendant', async () => {
      await expect(
        t.mutation(api.cases.fileDispute, {
          plaintiff,
          defendant: plaintiff, // Same as plaintiff
          type: 'TEST',
          jurisdictionTags: ['test'],
          evidenceIds: [evidenceId],
        })
      ).rejects.toThrow('must be different');
    });

    it('should prevent filing dispute with inactive agent', async () => {
      const inactiveResult = await t.mutation(api.agents.joinAgent, {
        ownerDid: 'did:test:owner',
        name: 'Inactive Agent',
        organizationName: 'Inactive Corp',
        mock: false,
      });

      const agent = await t.query(api.agents.getAgent, { did: inactiveResult.did });
      await t.mutation(api.agents.updateAgentStatus, {
        agentId: agent!._id,
        status: 'suspended',
      });

      await expect(
        t.mutation(api.cases.fileDispute, {
          plaintiff: inactiveResult.did,
          defendant,
          type: 'TEST',
          jurisdictionTags: ['test'],
          evidenceIds: [evidenceId],
        })
      ).rejects.toThrow('not active');
    });
  });

  describe('Case Queries', () => {
    let caseId1: any;
    let caseId2: any;

    beforeEach(async () => {
      caseId1 = await t.mutation(api.cases.fileDispute, {
        plaintiff,
        defendant,
        type: 'SLA_BREACH',
        jurisdictionTags: ['sla'],
        evidenceIds: [evidenceId],
      });

      caseId2 = await t.mutation(api.cases.fileDispute, {
        plaintiff: defendant,
        defendant: plaintiff, // Reverse roles
        type: 'CONTRACT_DISPUTE',
        jurisdictionTags: ['contract'],
        evidenceIds: [evidenceId],
      });
    });

    it('should get cases by plaintiff', async () => {
      const cases = await t.query(api.cases.getCasesByPlaintiff, {
        plaintiffDid: plaintiff,
      });

      expect(cases.length).toBe(1);
      expect(cases[0]._id).toBe(caseId1);
    });

    it('should get cases by defendant', async () => {
      const cases = await t.query(api.cases.getCasesByDefendant, {
        defendantDid: defendant,
      });

      expect(cases.length).toBe(1);
      expect(cases[0]._id).toBe(caseId1);
    });

    it('should get cases by status', async () => {
      const filedCases = await t.query(api.cases.getCasesByStatus, { 
        status: 'FILED',
      });

      expect(filedCases.length).toBeGreaterThanOrEqual(2);
    });

    it('should get recent cases', async () => {
      const recentCases = await t.query(api.cases.getRecentCases, {
        limit: 10,
      });
      
      expect(recentCases.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Case Resolution & Reputation', () => {
    let caseId: any;

    beforeEach(async () => {
      caseId = await t.mutation(api.cases.fileDispute, {
        plaintiff,
        defendant,
        type: 'SLA_BREACH',
        jurisdictionTags: ['sla'],
        evidenceIds: [evidenceId],
        breachDetails: {
          slaRequirement: '99.9% uptime',
          actualPerformance: '95% uptime',
        },
      });
    });

    it('should update case ruling and trigger reputation updates', async () => {
      await t.mutation(api.cases.updateCaseRuling, {
        caseId,
        ruling: {
          verdict: 'UPHELD',
          winner: plaintiff,
          auto: false,
          decidedAt: Date.now(),
        },
      });

      const case_ = await t.query(api.cases.getCaseById, { caseId });
      expect(case_?.ruling).toMatchObject({
        verdict: 'UPHELD',
        winner: plaintiff,
      });

      // Wait a bit for reputation updates to process
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check plaintiff reputation (winner)
      const plaintiffRep = await t.query(api.agents.getAgentReputation, {
        agentDid: plaintiff,
      });
      expect(plaintiffRep?.casesWon).toBeGreaterThanOrEqual(1);

      // Check defendant reputation (loser + SLA violation)
      const defendantRep = await t.query(api.agents.getAgentReputation, {
        agentDid: defendant,
      });
      expect(defendantRep?.casesLost).toBeGreaterThanOrEqual(1);
      expect(defendantRep?.slaViolations).toBeGreaterThanOrEqual(1);
    });

    it('should update case status', async () => {
      await t.mutation(api.cases.updateCaseStatus, {
        caseId,
        status: 'DECIDED',
      });

      const case_ = await t.query(api.cases.getCaseById, { caseId });
      expect(case_?.status).toBe('DECIDED');
    });
  });
});

