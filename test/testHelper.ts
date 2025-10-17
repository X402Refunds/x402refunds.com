/**
 * Helper function to create API-key-authenticated agents for tests
 * Use this in place of the old createOwner + joinAgent pattern
 */
import { api } from '../convex/_generated/api';

/**
 * Creates an organization, user, API key, and agent in one call
 * @param t - Convex test instance
 * @param opts - Configuration options
 * @returns Object with orgId, userId, apiKey, and agentDid
 */
export async function createTestAgent(
  t: any,
  opts: {
    orgName?: string;
    agentName?: string;
    functionalType?: string;
    email?: string;
    mock?: boolean;
  } = {}
) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  
  // Create organization
  const orgId = await t.run(async (ctx: any) => {
    return await ctx.db.insert("organizations", {
      name: opts.orgName || `Test Org ${timestamp}`,
      domain: `test-${timestamp}-${random}.com`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  // Create user
  const userId = await t.run(async (ctx: any) => {
    return await ctx.db.insert("users", {
      clerkUserId: `clerk_${timestamp}_${random}`,
      email: opts.email || `test-${timestamp}-${random}@example.com`,
      name: `Test User ${timestamp}`,
      organizationId: orgId,
      role: "admin" as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  // Generate API key
  const apiKeyResult = await t.mutation(api.apiKeys.generateApiKey, {
    userId: userId,
    name: "Test API Key",
  });

  // Register agent
  const agent = await t.mutation(api.agents.joinAgent, {
    apiKey: apiKeyResult.key,
    name: opts.agentName || `Test Agent ${timestamp}`,
    functionalType: opts.functionalType as any,
    mock: opts.mock !== undefined ? opts.mock : false,
  });

  return {
    orgId,
    userId,
    apiKey: apiKeyResult.key,
    agentDid: agent.did,
    agent,
  };
}

