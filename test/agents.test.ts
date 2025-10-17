import { describe, it, expect, beforeEach } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../convex/_generated/api';
import schema from '../convex/schema';
import { Id } from '../convex/_generated/dataModel';

describe('Agent Registration & Reputation - MVP', () => {
  let t: ReturnType<typeof convexTest>;
  let testApiKey: string;
  let testOrgId: Id<"organizations">;
  let testUserId: Id<"users">;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
    
    // Create test organization
    testOrgId = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Test Organization",
        domain: "test-org.com",
        verified: true,
        verifiedAt: Date.now(),
        createdAt: Date.now(),
      });
    });

    // Create test user
    testUserId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkUserId: "test-clerk-id",
        email: "test@test-org.com",
        name: "Test User",
        organizationId: testOrgId,
        role: "admin",
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      });
    });

    // Generate API key for testing
    const keyResult = await t.mutation(api.apiKeys.generateApiKey, {
      userId: testUserId,
      name: "Test API Key",
    });
    testApiKey = keyResult.key;
  });

  describe('Agent Registration', () => {
    it('should register an agent successfully with API key', async () => {
      const agentData = {
        apiKey: testApiKey,
        name: 'Test Agent',
        functionalType: 'general' as const,
      };

      const result = await t.mutation(api.agents.joinAgent, agentData);
      expect(result.agentId).toBeDefined();
      expect(result.did).toBeDefined();
      expect(result.did).toMatch(/^did:agent:test-org-com-\d+$/);

      // Verify agent was created correctly
      const agent = await t.query(api.agents.getAgent, { did: result.did });
      expect(agent).toMatchObject({
        did: result.did,
        name: agentData.name,
        organizationName: "Test Organization",
        functionalType: 'general',
        status: 'active',
      });
    });

    it('should initialize reputation for new agent', async () => {
      const agentData = {
        apiKey: testApiKey,
        name: 'Agent with Rep',
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

    it('should fail with invalid API key', async () => {
      const agentData = {
        apiKey: "csk_live_invalid",
        name: 'Fail Agent',
      };

      await expect(
        t.mutation(api.agents.joinAgent, agentData)
      ).rejects.toThrow('Invalid API key');
    });
  });

  describe('Reputation Updates', () => {
    let plaintiffDid: string;
    let defendantDid: string;

    beforeEach(async () => {
      // Create test agents
      const plaintiff = await t.mutation(api.agents.joinAgent, {
        apiKey: testApiKey,
        name: 'Plaintiff Agent',
      });
      plaintiffDid = plaintiff.did;

      // Create second org and API key for defendant
      const defendantOrgId = await t.run(async (ctx) => {
        return await ctx.db.insert("organizations", {
          name: "Defendant Corp",
          domain: "defendant.com",
          verified: true,
          verifiedAt: Date.now(),
          createdAt: Date.now(),
        });
      });
      
      const defendantUserId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          clerkUserId: "defendant-user",
          email: "test@defendant.com",
          organizationId: defendantOrgId,
          role: "admin",
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
        });
      });
      
      const defendantKeyResult = await t.mutation(api.apiKeys.generateApiKey, {
        userId: defendantUserId,
        name: "Defendant API Key",
      });
      
      const defendant = await t.mutation(api.agents.joinAgent, {
        apiKey: defendantKeyResult.key,
        name: 'Defendant Agent',
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

    it('should track violations against plaintiff', async () => {
      await t.mutation(api.agents.updateAgentReputation, {
        agentDid: plaintiffDid,
        role: 'plaintiff',
        outcome: 'won',
        slaViolation: true, // Plaintiff was violated against
      });

      const reputation = await t.query(api.agents.getAgentReputation, {
        agentDid: plaintiffDid,
      });

      expect(reputation?.violationsAgainstThem).toBe(1);
      expect(reputation?.slaViolations).toBe(0); // Plaintiff didn't violate
    });

    it('should handle case loss as defendant', async () => {
      await t.mutation(api.agents.updateAgentReputation, {
        agentDid: defendantDid,
        role: 'defendant',
        outcome: 'lost',
        slaViolation: false,
      });

      const reputation = await t.query(api.agents.getAgentReputation, {
        agentDid: defendantDid,
      });

      expect(reputation).toMatchObject({
        casesDefended: 1,
        casesLost: 1,
        winRate: 0,
        slaViolations: 0,
      });
    });

    it('should throw error when updating reputation for non-existent agent', async () => {
      await expect(
        t.mutation(api.agents.updateAgentReputation, {
          agentDid: 'did:agent:non-existent',
          role: 'plaintiff',
          outcome: 'won',
        })
      ).rejects.toThrow('Reputation not found');
    });

    it('should calculate correct win rate with multiple cases', async () => {
      // Win 2, lose 1
      await t.mutation(api.agents.updateAgentReputation, {
        agentDid: plaintiffDid,
        role: 'plaintiff',
        outcome: 'won',
      });
      await t.mutation(api.agents.updateAgentReputation, {
        agentDid: plaintiffDid,
        role: 'plaintiff',
        outcome: 'won',
      });
      await t.mutation(api.agents.updateAgentReputation, {
        agentDid: plaintiffDid,
        role: 'plaintiff',
        outcome: 'lost',
      });

      const reputation = await t.query(api.agents.getAgentReputation, {
        agentDid: plaintiffDid,
      });

      expect(reputation?.winRate).toBeCloseTo(2/3, 2);
      expect(reputation?.casesWon).toBe(2);
      expect(reputation?.casesLost).toBe(1);
    });

    it('should handle large number of violations', async () => {
      // Add 20 violations
      for (let i = 0; i < 20; i++) {
        await t.mutation(api.agents.updateAgentReputation, {
          agentDid: defendantDid,
          role: 'defendant',
          outcome: 'lost',
          slaViolation: true,
        });
      }

      const reputation = await t.query(api.agents.getAgentReputation, {
        agentDid: defendantDid,
      });

      expect(reputation?.slaViolations).toBe(20);
      expect(reputation?.reliabilityScore).toBe(0); // 100 - (20 * 5) = 0, capped at 0
    });
  });

  describe('Agent Queries', () => {
    let apiKey: string;
    
    beforeEach(async () => {
      // Create organization, user, and get API key
      const org = await t.run(async (ctx) => {
        return await ctx.db.insert("organizations", {
          name: "Query Test Org",
          createdAt: Date.now()
        });
      });
      
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          clerkUserId: `query-user-${Date.now()}`,
          email: "query@test.com",
          name: "Query User",
          organizationId: org,
          role: "admin",
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
        });
      });
      
      const key = await t.mutation(api.apiKeys.generateApiKey, {
        userId,
        name: "Query Test Key",
      });
      apiKey = key.key;
      
      // Create various agents for testing
      await t.mutation(api.agents.joinAgent, {
        apiKey,
        name: 'Mock Agent',
        mock: true,
      });

      await t.mutation(api.agents.joinAgent, {
        apiKey,
        name: 'Real Agent',
        mock: false,
      });

      await t.mutation(api.agents.joinAgent, {
        apiKey,
        name: 'Coding Agent',
        functionalType: 'coding' as const,
      });
    });

    it('should filter agents by mock status', async () => {
      const mockAgents = await t.query(api.agents.getAgentsByMockStatus, { mock: true });
      const realAgents = await t.query(api.agents.getAgentsByMockStatus, { mock: false });

      expect(mockAgents.length).toBeGreaterThan(0);
      expect(realAgents.length).toBeGreaterThan(0);
      expect(mockAgents.every(a => a.mock === true)).toBe(true);
      expect(realAgents.every(a => a.mock === false)).toBe(true);
    });

    it('should filter agents by functional type', async () => {
      const codingAgents = await t.query(api.agents.getAgentsByFunctionalType, { 
        functionalType: 'coding' 
      });

      expect(codingAgents.length).toBeGreaterThan(0);
      expect(codingAgents.every(a => a.functionalType === 'coding')).toBe(true);
    });

    it('should return all active agents when no functional type specified', async () => {
      const allAgents = await t.query(api.agents.getAgentsByFunctionalType, {});
      expect(allAgents.length).toBeGreaterThan(0);
    });

    it('should list agents with status filter', async () => {
      const agent = await t.mutation(api.agents.joinAgent, {
        apiKey,
        name: 'Suspended Agent',
      });

      const agentDoc = await t.query(api.agents.getAgent, { did: agent.did });
      await t.mutation(api.agents.updateAgentStatus, {
        agentId: agentDoc!._id,
        status: 'suspended',
      });

      const suspendedAgents = await t.query(api.agents.listAgents, { status: 'suspended' });
      expect(suspendedAgents.some(a => a._id === agentDoc!._id)).toBe(true);
    });

    it('should sort top agents by win rate', async () => {
      const topAgents = await t.query(api.agents.getTopAgentsByReputation, {
        sortBy: 'winRate',
        limit: 5,
      });

      expect(Array.isArray(topAgents)).toBe(true);
    });

    it('should sort top agents by overall score', async () => {
      const topAgents = await t.query(api.agents.getTopAgentsByReputation, {
        sortBy: 'overallScore',
        limit: 5,
      });

      expect(Array.isArray(topAgents)).toBe(true);
    });

    it('should use default sort when not specified', async () => {
      const topAgents = await t.query(api.agents.getTopAgentsByReputation, {});
      expect(Array.isArray(topAgents)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle agent registration with all optional fields', async () => {
      const org = await t.run(async (ctx) => {
        return await ctx.db.insert("organizations", {
          name: "Edge Case Org",
          createdAt: Date.now()
        });
      });
      
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          clerkUserId: `edge-case-user-${Date.now()}`,
          email: "edge@test.com",
          name: "Edge Case User",
          organizationId: org,
          role: "admin",
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
        });
      });
      
      const key = await t.mutation(api.apiKeys.generateApiKey, {
        userId,
        name: "Edge Case Key",
      });
      
      const result = await t.mutation(api.agents.joinAgent, {
        apiKey: key.key,
        name: 'Full Featured Agent',
        mock: true,
        functionalType: 'healthcare' as const,
        buildHash: 'abc123',
        configHash: 'def456',
      });

      expect(result.did).toBeDefined();
      const agent = await t.query(api.agents.getAgent, { did: result.did });
      expect(agent?.buildHash).toBe('abc123');
      expect(agent?.configHash).toBe('def456');
    });

    it('should reject agent registration for non-existent owner', async () => {
      await expect(
        t.mutation(api.agents.joinAgent, {
          apiKey: 'csk_test_invalidkey123456789012',
          name: 'Test Agent',
        })
      ).rejects.toThrow('Invalid API key');
    });

    it('should return null for non-existent agent', async () => {
      const agent = await t.query(api.agents.getAgent, { did: 'did:agent:non-existent' });
      expect(agent).toBeNull();
    });
  });

});

