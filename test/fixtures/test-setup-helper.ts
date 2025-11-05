import { convexTest } from 'convex-test';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

/**
 * Create a test organization (for reference, agents don't need orgs anymore)
 */
export async function createTestOrg(
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
  
  return {
    orgId,
  };
}

/**
 * Create a test agent with public key
 */
export async function createTestAgent(
  t: ReturnType<typeof convexTest>,
  name: string,
  publicKey: string = "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk",
  organizationName: string = `Test Org ${Date.now()}`,
  functionalType: string = 'general'
) {
  const result = await t.mutation(api.agents.joinAgent, {
    name,
    publicKey,
    organizationName,
    functionalType: functionalType as any,
    mock: false,
  });
  
  return result.did;
}

