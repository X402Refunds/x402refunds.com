import { describe, it, expect, beforeEach } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../convex/_generated/api';
import schema from '../convex/schema';
import { Id } from '../convex/_generated/dataModel';

describe('Agent Registration & Reputation - MVP', () => {
  let t: ReturnType<typeof convexTest>;
  let testOrgId: Id<"organizations">;
  let testUserId: Id<"users">;
  const testPublicKey = "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk"; // Mock Ed25519 public key

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
  });

  describe('Agent Registration', () => {
    it('should register an agent successfully with public key', async () => {
      const agentData = {
        name: 'Test Agent',
        publicKey: testPublicKey,
        organizationName: 'Test Organization',
        functionalType: 'general' as const,
      };

      const result = await t.mutation(api.agents.joinAgent, agentData);
      expect(result.agentId).toBeDefined();
      expect(result.did).toBeDefined();
      expect(result.did).toMatch(/^did:agent:test-organization-\d+$/);
      if (result.disputeUrl) {
      expect(result.disputeUrl).toContain('/disputes/claim?vendor=');
      }
      expect(result.publicKey).toBe(testPublicKey);

      // Verify agent was created correctly
      const agent = await t.query(api.agents.getAgent, { did: result.did });
      expect(agent).toMatchObject({
        did: result.did,
        name: agentData.name,
        organizationName: "Test Organization",
        publicKey: testPublicKey,
        functionalType: 'general',
        status: 'active',
      });
    });

    it('should initialize reputation for new agent', async () => {
      const agentData = {
        name: 'Agent with Rep',
        publicKey: testPublicKey,
        organizationName: 'Test Organization',
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

    it('should fail without public key', async () => {
      const agentData = {
        name: 'Fail Agent',
        publicKey: '',
        organizationName: 'Test Organization',
      };

      await expect(
        t.mutation(api.agents.joinAgent, agentData)
      ).rejects.toThrow();
    });

    it('should prevent duplicate wallet address registration', async () => {
      const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
      
      // Register first agent with wallet address
      const firstAgent = await t.mutation(api.agents.joinAgent, {
        name: 'First Agent',
        publicKey: testPublicKey,
        organizationName: 'Test Organization',
        walletAddress: walletAddress,
        functionalType: 'general' as const,
      });
      
      expect(firstAgent.agentId).toBeDefined();
      expect(firstAgent.walletAddress).toBe(walletAddress.toLowerCase());

      // Try to register second agent with same wallet address
      await expect(
        t.mutation(api.agents.joinAgent, {
          name: 'Second Agent',
          publicKey: 'different-public-key-base64',
          organizationName: 'Different Organization',
          walletAddress: walletAddress, // Same wallet address
          functionalType: 'general' as const,
        })
      ).rejects.toThrow(/already registered/);
    });
  });

  describe('Reputation Updates', () => {
    let plaintiffDid: string;
    let defendantDid: string;

    beforeEach(async () => {
      // Create test agents
      const plaintiff = await t.mutation(api.agents.joinAgent, {
        name: 'Plaintiff Agent',
        publicKey: testPublicKey,
        organizationName: 'Test Organization',
      });
      plaintiffDid = plaintiff.did;
      
      const defendant = await t.mutation(api.agents.joinAgent, {
        name: 'Defendant Agent',
        publicKey: "ZGVmZW5kYW50X3B1YmxpY19rZXlfMzJfYnl0ZXNfYmFzZTY0X2VuY29kZWQ",
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
    beforeEach(async () => {
      // Create various agents for testing
      await t.mutation(api.agents.joinAgent, {
        name: 'Mock Agent',
        publicKey: testPublicKey,
        organizationName: 'Query Test Org',
        mock: true,
      });

      await t.mutation(api.agents.joinAgent, {
        name: 'Real Agent',
        publicKey: testPublicKey,
        organizationName: 'Query Test Org',
        mock: false,
      });

      await t.mutation(api.agents.joinAgent, {
        name: 'Coding Agent',
        publicKey: testPublicKey,
        organizationName: 'Query Test Org',
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
        name: 'Suspended Agent',
        publicKey: testPublicKey,
        organizationName: 'Test Organization',
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
      const result = await t.mutation(api.agents.joinAgent, {
        name: 'Full Featured Agent',
        publicKey: testPublicKey,
        organizationName: 'Edge Case Org',
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

    it('should reject agent registration without required fields', async () => {
      await expect(
        t.mutation(api.agents.joinAgent, {
          name: 'Test Agent',
          publicKey: '',
          organizationName: '',
        })
      ).rejects.toThrow();
    });

    it('should return null for non-existent agent', async () => {
      const agent = await t.query(api.agents.getAgent, { did: 'did:agent:non-existent' });
      expect(agent).toBeNull();
    });
  });

});

