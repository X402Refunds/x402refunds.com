import { convexTest } from 'convex-test';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

/**
 * Create a test organization with user and API key
 * Returns the API key for agent registration
 */
export async function createTestOrgWithApiKey(
  t: ReturnType<typeof convexTest>,
  orgName: string,
  timestamp: number = Date.now()
) {
  const orgId = await t.run(async (ctx) => {
    return await ctx.db.insert("organizations", {
      name: orgName,
      domain: `${orgName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.com`,
      verified: true,
      verifiedAt: Date.now(),
      createdAt: Date.now(),
    });
  });
  
  const userId = await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      clerkUserId: `${orgName.toLowerCase()}-${timestamp}`,
      email: `${orgName.toLowerCase()}-${timestamp}@test.com`,
      organizationId: orgId,
      role: "admin",
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    });
  });
  
  const apiKeyResult = await t.mutation(api.apiKeys.generateApiKey, {
    userId,
    name: "Test API Key",
  });
  
  return {
    orgId,
    userId,
    apiKey: apiKeyResult.key,
  };
}

/**
 * Create a test agent with API key
 */
export async function createTestAgent(
  t: ReturnType<typeof convexTest>,
  apiKey: string,
  name: string,
  functionalType: string = 'general'
) {
  const result = await t.mutation(api.agents.joinAgent, {
    apiKey,
    name,
    functionalType: functionalType as any,
    mock: false,
  });
  
  return result.did;
}

