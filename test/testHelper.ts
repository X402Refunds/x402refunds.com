/**
 * Helper function to create agents with Ed25519 public keys for tests
 * Use this in place of the old API key authentication pattern
 */
import { api } from '../convex/_generated/api';

/**
 * Creates an organization, user, and agent in one call
 * @param t - Convex test instance
 * @param opts - Configuration options
 * @returns Object with orgId, userId, publicKey, and agentDid
 */
export async function createTestAgent(
  t: any,
  opts: {
    orgName?: string;
    agentName?: string;
    functionalType?: string;
    email?: string;
    mock?: boolean;
    publicKey?: string;
    openApiSpec?: any;
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

  // Use provided public key or generate a mock one
  const publicKey = opts.publicKey || "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk";

  // Register agent with public key
  const agent = await t.mutation(api.agents.joinAgent, {
    name: opts.agentName || `Test Agent ${timestamp}`,
    publicKey,
    organizationName: opts.orgName || `Test Org ${timestamp}`,
    openApiSpec: opts.openApiSpec,
    functionalType: opts.functionalType as any,
    mock: opts.mock !== undefined ? opts.mock : false,
  });

  return {
    orgId,
    userId,
    publicKey,
    agentDid: agent.did,
    agent,
  };
}

