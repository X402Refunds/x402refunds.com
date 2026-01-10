/**
 * X-402 Agent Functions Tests
 * Tests agent lookup by wallet, unclaimed agent creation, and claiming
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../convex/_generated/api';
import schema from '../convex/schema';
import { privateKeyToAccount } from 'viem/accounts';

describe('X-402 Agent Functions', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema, import.meta.glob('../convex/**/*.{ts,js}'));
    console.log('🧪 Setting up X-402 agent test environment...');
  });

  it('should query agent by wallet address', async () => {
    // Create agent with wallet address
    const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
    
    const result = await t.mutation(api.agents.joinAgent, {
      name: 'Test Agent',
      publicKey: 'test-public-key-base64',
      organizationName: 'Test Org',
      functionalType: 'api',
      mock: false,
    });

    const agentId = result.agentId;

    // Update with wallet address
    await t.run(async (ctx) => {
      const agent = await ctx.db.get(agentId);
      if (agent) {
        await ctx.db.patch(agent._id, { walletAddress: walletAddress.toLowerCase() });
      }
    });

    // Query by wallet address
    const foundAgent = await t.query(api.agents.getAgentByWallet, { 
      walletAddress 
    });

    expect(foundAgent).toBeDefined();
    expect(foundAgent?.walletAddress).toBe(walletAddress.toLowerCase());
    
    console.log('✅ Agent queried by wallet address:', foundAgent?.did);
  });

  it.skip('should create unclaimed agent (FEATURE REMOVED)', async () => {
    const walletAddress = '0x9876543210987654321098765432109876543210';
    
    const agentId = await t.mutation(api.agents.createUnclaimedAgent, {
      walletAddress,
      endpoint: 'https://api.test-agent.com',
    });

    expect(agentId).toBeDefined();

    // Verify agent was created
    const agent = await t.run(async (ctx) => {
      return await ctx.db.get(agentId);
    });

    expect(agent).toBeDefined();
    expect(agent?.status).toBe('unclaimed');
    expect(agent?.walletAddress).toBe(walletAddress.toLowerCase());
    expect(agent?.organizationId).toBeUndefined();
    
    console.log('✅ Unclaimed agent created:', agent?.did);
  });

  it.skip('should not create duplicate unclaimed agents (FEATURE REMOVED)', async () => {
    const walletAddress = '0x1234567890123456789012345678901234567890';
    
    // Create first time
    const agentId1 = await t.mutation(api.agents.createUnclaimedAgent, {
      walletAddress,
    });

    // Try to create again
    const agentId2 = await t.mutation(api.agents.createUnclaimedAgent, {
      walletAddress,
    });

    // Should return same agent
    expect(agentId1).toBe(agentId2);
    
    console.log('✅ Duplicate prevention works');
  });

  it.skip('should list unclaimed agents with dispute counts (FEATURE REMOVED)', async () => {
    // Create unclaimed agent
    await t.mutation(api.agents.createUnclaimedAgent, {
      walletAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      endpoint: 'https://api.unclaimed.com',
    });

    // List unclaimed agents
    const agents = await t.query(api.agents.listUnclaimedAgents, { limit: 10 });

    expect(agents).toBeDefined();
    expect(Array.isArray(agents)).toBe(true);
    expect(agents.length).toBeGreaterThan(0);
    expect(agents[0].disputeCount).toBeDefined();
    expect(agents[0].disputeCount).toBeGreaterThanOrEqual(0);
    
    console.log('✅ Unclaimed agents listed:', agents.length);
  });

  it.skip('should claim agent with valid signature (mock) (FEATURE REMOVED)', async () => {
    // Use a test private key to generate a valid signature
    const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const testAccount = privateKeyToAccount(testPrivateKey as `0x${string}`);
    const walletAddress = testAccount.address;
    
    // Create unclaimed agent
    await t.mutation(api.agents.createUnclaimedAgent, {
      walletAddress,
    });

    // Create mock organization and user
    const orgId = await t.run(async (ctx) => {
      return await ctx.db.insert('organizations', {
        name: 'Test Org',
        createdAt: Date.now(),
      });
    });

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert('users', {
        clerkUserId: 'clerk_test',
        email: 'test@example.com',
        role: 'admin',
        organizationId: orgId,
        createdAt: Date.now(),
      });
    });

    // Generate valid signature
    const message = `I claim agent ${walletAddress.toLowerCase()} on x402refunds.com`;
    const signature = await testAccount.signMessage({ message });

    // Claim agent with valid signature
    const result = await t.mutation(api.agents.claimAgent, {
      walletAddress,
      signature,
      message,
      organizationId: orgId,
      userId,
    });

    expect(result.success).toBe(true);
    expect(result.agentId).toBeDefined();

    // Verify agent is now active
    const agent = await t.query(api.agents.getAgentByWallet, { walletAddress });
    expect(agent?.status).toBe('active');
    expect(agent?.organizationId).toBe(orgId);
    
    console.log('✅ Agent claimed successfully');
  });

  it.skip('should reject claiming already claimed agent (FEATURE REMOVED)', async () => {
    // Use a test private key to generate a valid signature
    const testPrivateKey = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
    const testAccount = privateKeyToAccount(testPrivateKey as `0x${string}`);
    const walletAddress = testAccount.address;
    
    // Create and claim agent
    await t.mutation(api.agents.createUnclaimedAgent, { walletAddress });
    
    const orgId = await t.run(async (ctx) => {
      return await ctx.db.insert('organizations', {
        name: 'Test Org',
        createdAt: Date.now(),
      });
    });

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert('users', {
        clerkUserId: 'clerk_test2',
        email: 'test2@example.com',
        role: 'admin',
        organizationId: orgId,
        createdAt: Date.now(),
      });
    });

    // Generate valid signature for first claim
    const message = `I claim agent ${walletAddress.toLowerCase()} on x402refunds.com`;
    const signature = await testAccount.signMessage({ message });

    // First claim should succeed
    await t.mutation(api.agents.claimAgent, {
      walletAddress,
      signature,
      message,
      organizationId: orgId,
      userId,
    });

    // Try to claim again
    await expect(
      t.mutation(api.agents.claimAgent, {
        walletAddress,
        signature: '0xmock2',
        message: `I claim agent ${walletAddress} on x402refunds.com`,
        organizationId: orgId,
        userId,
      })
    ).rejects.toThrow('already claimed');
    
    console.log('✅ Duplicate claim prevention works');
  });
});

