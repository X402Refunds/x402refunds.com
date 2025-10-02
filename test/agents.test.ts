import { describe, it, expect, beforeEach } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../convex/_generated/api';
import schema from '../convex/schema';

describe('Agent Registration & Reputation - MVP', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
    
    // Create a test owner for agents
    await t.mutation(api.auth.createOwner, {
      did: 'did:test:owner123',
      name: 'Test Owner',
      email: 'test@example.com',
    });
  });

  describe('Agent Registration', () => {
    it('should register an agent successfully', async () => {
      const agentData = {
        ownerDid: 'did:test:owner123',
        name: 'Test Agent',
        organizationName: 'Test Organization',
        functionalType: 'general' as const,
      };

      const result = await t.mutation(api.agents.joinAgent, agentData);
      expect(result.agentId).toBeDefined();
      expect(result.did).toBeDefined();
      expect(result.did).toMatch(/^did:agent:test-organization-\d+$/);

      // Verify agent was created correctly
      const agent = await t.query(api.agents.getAgent, { did: result.did });
      expect(agent).toMatchObject({
        did: result.did,
        ownerDid: agentData.ownerDid,
        name: agentData.name,
        organizationName: agentData.organizationName,
        functionalType: 'general',
        status: 'active',
      });
    });

    it('should initialize reputation for new agent', async () => {
      const agentData = {
        ownerDid: 'did:test:owner123',
        name: 'Agent with Rep',
        organizationName: 'Coding Corp',
        functionalType: 'coding' as const,
      };

      const result = await t.mutation(api.agents.joinAgent, agentData);

      // Verify reputation was initialized
      const agent = await t.query(api.agents.getAgent, { did: result.did });
      expect(agent?.reputation).toMatchObject({
        agentDid: result.did,
        casesFiled: 0,
        casesDefended: 0,
        casesWon: 0,
        casesLost: 0,
        slaViolations: 0,
        violationsAgainstThem: 0,
        winRate: 0,
        reliabilityScore: 100,
        overallScore: 100,
      });
    });

    it('should prevent duplicate organization registration', async () => {
      const agentData = {
        ownerDid: 'did:test:owner123',
        name: 'Duplicate Agent',
        organizationName: 'Duplicate Corp',
      };

      await t.mutation(api.agents.joinAgent, agentData);

      // Try to register same organization again
      await expect(
        t.mutation(api.agents.joinAgent, agentData)
      ).rejects.toThrow('already has an agent registered');
    });
  });

  describe('Reputation Updates', () => {
    let plaintiffDid: string;
    let defendantDid: string;

    beforeEach(async () => {
      // Create test agents
      const plaintiff = await t.mutation(api.agents.joinAgent, {
        ownerDid: 'did:test:owner123',
        name: 'Plaintiff Agent',
        organizationName: 'Plaintiff Corp',
      });
      plaintiffDid = plaintiff.did;

      const defendant = await t.mutation(api.agents.joinAgent, {
        ownerDid: 'did:test:owner123',
        name: 'Defendant Agent',
        organizationName: 'Defendant Corp',
      });
      defendantDid = defendant.did;
    });

    it('should update reputation after case win as plaintiff', async () => {
      await t.mutation(api.agents.updateAgentReputation, {
        agentDid: plaintiffDid,
        role: 'plaintiff',
        outcome: 'won',
        slaViolation: false,
      });

      const reputation = await t.query(api.agents.getAgentReputation, {
        agentDid: plaintiffDid,
      });

      expect(reputation).toMatchObject({
        casesFiled: 1,
        casesWon: 1,
        casesLost: 0,
        winRate: 1,
      });
    });

    it('should penalize SLA violations', async () => {
      await t.mutation(api.agents.updateAgentReputation, {
        agentDid: defendantDid,
        role: 'defendant',
        outcome: 'lost',
        slaViolation: true,
      });

      const reputation = await t.query(api.agents.getAgentReputation, {
        agentDid: defendantDid,
      });

      expect(reputation).toMatchObject({
        casesDefended: 1,
        casesLost: 1,
        slaViolations: 1,
        winRate: 0,
        reliabilityScore: 95, // 100 - 5 penalty
      });
    });
  });
});

