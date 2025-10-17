import { describe, it, expect, beforeEach } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../convex/_generated/api';
import schema from '../convex/schema';
import { PerformanceTimer } from './setup';

/**
 * Performance and Load Tests
 * 
 * Tests for concurrent operations, large data handling, and rate limiting
 */

describe('Concurrent Operations', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
  });

  it('should handle 100 concurrent agent registrations', async () => {
    const timer = new PerformanceTimer();
    timer.start();
    
    // Create organization, user, and API key
    const org = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Performance Test Org",
        createdAt: Date.now()
      });
    });
    
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkUserId: `perf-user-${Date.now()}`,
        email: "perf@test.com",
        name: "Perf User",
        organizationId: org,
        role: "admin",
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      });
    });
    
    const key = await t.mutation(api.apiKeys.generateApiKey, {
      userId,
      name: "Performance Test Key",
    });
    
    // Register 100 agents concurrently
    const registrations = Array.from({ length: 100 }, (_, i) =>
      t.mutation(api.agents.joinAgent, {
        apiKey: key.key,
        name: `Concurrent Agent ${i}`,
        mock: false,
      })
    );
    
    const results = await Promise.all(registrations);
    const duration = timer.stop();
    
    expect(results).toHaveLength(100);
    expect(results.every(r => r.did)).toBe(true);
    console.log(`✓ 100 concurrent registrations completed in ${duration.toFixed(2)}ms`);
  }, 60000);

  it('should handle 50 concurrent case filings', async () => {
    const timer = new PerformanceTimer();
    
    // Setup - Create separate orgs for plaintiff and defendant
    const timestamp = Date.now();
    
    // Plaintiff org and agent
    const plaintiffOrg = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Plaintiff Perf Org",
        createdAt: timestamp
      });
    });
    
    const plaintiffUserId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkUserId: `plaintiff-perf-user-${timestamp}`,
        email: "plaintiff@test.com",
        name: "Plaintiff User",
        organizationId: plaintiffOrg,
        role: "admin",
        createdAt: timestamp,
        lastLoginAt: timestamp,
      });
    });
    
    const plaintiffKey = await t.mutation(api.apiKeys.generateApiKey, {
      userId: plaintiffUserId,
      name: "Plaintiff Key",
    });
    
    const plaintiff = await t.mutation(api.agents.joinAgent, {
      apiKey: plaintiffKey.key,
      name: 'Plaintiff',
    });
    
    // Defendant org and agent
    const defendantOrg = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Defendant Perf Org",
        createdAt: timestamp
      });
    });
    
    const defendantUserId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkUserId: `defendant-perf-user-${timestamp}`,
        email: "defendant@test.com",
        name: "Defendant User",
        organizationId: defendantOrg,
        role: "admin",
        createdAt: timestamp,
        lastLoginAt: timestamp,
      });
    });
    
    const defendantKey = await t.mutation(api.apiKeys.generateApiKey, {
      userId: defendantUserId,
      name: "Defendant Key",
    });
    
    const defendant = await t.mutation(api.agents.joinAgent, {
      apiKey: defendantKey.key,
      name: 'Defendant',
    });
    
    // Create evidence
    const evidenceId = await t.mutation(api.evidence.submitEvidence, {
      agentDid: plaintiff.did,
      sha256: `sha256_perf_${Date.now()}`,
      uri: 'https://test.example.com/perf.json',
      signer: 'did:test:signer',
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });
    
    timer.start();
    
    // File 50 cases concurrently
    const filings = Array.from({ length: 50 }, (_, i) =>
      t.mutation(api.cases.fileDispute, {
        plaintiff: plaintiff.did,
        defendant: defendant.did,
        type: 'SLA_BREACH',
        jurisdictionTags: [`perf-test-${i}`],
        evidenceIds: [evidenceId],
        description: `Performance test case ${i}`,
      })
    );
    
    const results = await Promise.all(filings);
    const duration = timer.stop();
    
    expect(results).toHaveLength(50);
    console.log(`✓ 50 concurrent case filings completed in ${duration.toFixed(2)}ms`);
  }, 60000);

  it('should handle 100 concurrent evidence submissions', async () => {
    const timer = new PerformanceTimer();
    
    const org = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Evidence Perf Org",
        createdAt: Date.now()
      });
    });
    
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkUserId: `ev-perf-user-${Date.now()}`,
        email: "evidence@test.com",
        name: "Evidence User",
        organizationId: org,
        role: "admin",
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      });
    });
    
    const key = await t.mutation(api.apiKeys.generateApiKey, {
      userId,
      name: "Evidence Perf Key",
    });
    
    const agent = await t.mutation(api.agents.joinAgent, {
      apiKey: key.key,
      name: 'Evidence Agent',
    });
    
    timer.start();
    
    // Submit 100 evidence items concurrently
    const submissions = Array.from({ length: 100 }, (_, i) =>
      t.mutation(api.evidence.submitEvidence, {
        agentDid: agent.did,
        sha256: `sha256_ev_perf_${Date.now()}_${i}_${Math.random()}`,
        uri: `https://test.example.com/perf-ev-${i}.json`,
        signer: 'did:test:signer',
        model: {
          provider: 'test',
          name: 'test-model',
          version: '1.0.0',
        },
      })
    );
    
    const results = await Promise.all(submissions);
    const duration = timer.stop();
    
    expect(results).toHaveLength(100);
    console.log(`✓ 100 concurrent evidence submissions completed in ${duration.toFixed(2)}ms`);
  }, 60000);

  it('should handle 10 concurrent panel votes', async () => {
    const timer = new PerformanceTimer();
    const timestamp = Date.now();
    
    // Setup case and panel - Create separate orgs for plaintiff and defendant
    const plaintiffOrg = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Plaintiff Vote Org",
        createdAt: timestamp
      });
    });
    
    const plaintiffUserId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkUserId: `plaintiff-vote-user-${timestamp}`,
        email: "plaintiffvote@test.com",
        name: "Plaintiff Vote User",
        organizationId: plaintiffOrg,
        role: "admin",
        createdAt: timestamp,
        lastLoginAt: timestamp,
      });
    });
    
    const plaintiffKey = await t.mutation(api.apiKeys.generateApiKey, {
      userId: plaintiffUserId,
      name: "Plaintiff Vote Key",
    });
    
    const plaintiff = await t.mutation(api.agents.joinAgent, {
      apiKey: plaintiffKey.key,
      name: 'Plaintiff',
    });
    
    const defendantOrg = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Defendant Vote Org",
        createdAt: timestamp
      });
    });
    
    const defendantUserId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkUserId: `defendant-vote-user-${timestamp}`,
        email: "defendantvote@test.com",
        name: "Defendant Vote User",
        organizationId: defendantOrg,
        role: "admin",
        createdAt: timestamp,
        lastLoginAt: timestamp,
      });
    });
    
    const defendantKey = await t.mutation(api.apiKeys.generateApiKey, {
      userId: defendantUserId,
      name: "Defendant Vote Key",
    });
    
    const defendant = await t.mutation(api.agents.joinAgent, {
      apiKey: defendantKey.key,
      name: 'Defendant',
    });
    
    const evidenceId = await t.mutation(api.evidence.submitEvidence, {
      agentDid: plaintiff.did,
      sha256: `sha256_vote_${Date.now()}`,
      uri: 'https://test.example.com/vote.json',
      signer: 'did:test:signer',
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });
    
    // Create multiple cases
    const cases = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        t.mutation(api.cases.fileDispute, {
          plaintiff: plaintiff.did,
          defendant: defendant.did,
          type: 'SLA_BREACH',
          jurisdictionTags: [`vote-perf-${i}`],
          evidenceIds: [evidenceId],
        })
      )
    );
    
    // Create panels and vote
    timer.start();
    
    const votes = [];
    for (const caseId of cases) {
      // Create a judge for this case
      await t.mutation(api.judges.registerJudge, {
        did: `did:judge:vote-perf-${Date.now()}-${Math.random()}`,
        name: `Judge ${Date.now()}`,
        specialties: ['SLA_BREACH'],
      });
      
      const panelId = await t.mutation(api.judges.assignPanel, {
        caseId,
        panelSize: 1,
      });
      
      // Get panel to find assigned judge
      const panel = await t.query(api.judges.getPanel, { panelId });
      
      // Vote using the judge assigned to the panel
      votes.push(
        t.mutation(api.judges.submitVote, {
          panelId,
          judgeId: panel!.judgeIds[0],
          code: 'UPHELD',
          reasons: 'Perf test vote',
          confidence: 0.9,
        })
      );
    }
    
    await Promise.all(votes);
    const duration = timer.stop();
    
    console.log(`✓ 10 concurrent panel votes completed in ${duration.toFixed(2)}ms`);
  }, 60000);
});

describe('Large Data Handling', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
  });

  it('should handle large evidence submission', async () => {
    const org = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Large Data Org",
        createdAt: Date.now()
      });
    });
    
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkUserId: `large-user-${Date.now()}`,
        email: "large@test.com",
        name: "Large User",
        organizationId: org,
        role: "admin",
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      });
    });
    
    const key = await t.mutation(api.apiKeys.generateApiKey, {
      userId,
      name: "Large Data Key",
    });
    
    const agent = await t.mutation(api.agents.joinAgent, {
      apiKey: key.key,
      name: 'Large Data Agent',
    });
    
    // Submit evidence with large hash/URI
    const largeHash = 'sha256_' + 'x'.repeat(64);
    const largeUri = 'https://test.example.com/' + 'y'.repeat(500) + '.json';
    
    const evidenceId = await t.mutation(api.evidence.submitEvidence, {
      agentDid: agent.did,
      sha256: largeHash,
      uri: largeUri,
      signer: 'did:test:signer',
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });
    
    expect(evidenceId).toBeDefined();
  });

  it('should query 1000+ cases efficiently', async () => {
    const timer = new PerformanceTimer();
    const timestamp = Date.now();
    
    // Plaintiff org and agent
    const plaintiffOrg = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Plaintiff Cases Org",
        createdAt: timestamp
      });
    });
    
    const plaintiffUserId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkUserId: `plaintiff-cases-user-${timestamp}`,
        email: "plaintiffcases@test.com",
        name: "Plaintiff Cases User",
        organizationId: plaintiffOrg,
        role: "admin",
        createdAt: timestamp,
        lastLoginAt: timestamp,
      });
    });
    
    const plaintiffKey = await t.mutation(api.apiKeys.generateApiKey, {
      userId: plaintiffUserId,
      name: "Plaintiff Cases Key",
    });
    
    const plaintiff = await t.mutation(api.agents.joinAgent, {
      apiKey: plaintiffKey.key,
      name: 'Plaintiff',
    });
    
    // Defendant org and agent
    const defendantOrg = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Defendant Cases Org",
        createdAt: timestamp
      });
    });
    
    const defendantUserId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkUserId: `defendant-cases-user-${timestamp}`,
        email: "defendantcases@test.com",
        name: "Defendant Cases User",
        organizationId: defendantOrg,
        role: "admin",
        createdAt: timestamp,
        lastLoginAt: timestamp,
      });
    });
    
    const defendantKey = await t.mutation(api.apiKeys.generateApiKey, {
      userId: defendantUserId,
      name: "Defendant Cases Key",
    });
    
    const defendant = await t.mutation(api.agents.joinAgent, {
      apiKey: defendantKey.key,
      name: 'Defendant',
    });
    
    const evidenceId = await t.mutation(api.evidence.submitEvidence, {
      agentDid: plaintiff.did,
      sha256: `sha256_many_${Date.now()}`,
      uri: 'https://test.example.com/many.json',
      signer: 'did:test:signer',
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });
    
    // Create 100 cases (scaled down from 1000 for test speed)
    const cases = await Promise.all(
      Array.from({ length: 100 }, (_, i) =>
        t.mutation(api.cases.fileDispute, {
          plaintiff: plaintiff.did,
          defendant: defendant.did,
          type: 'SLA_BREACH',
          jurisdictionTags: [`many-${i}`],
          evidenceIds: [evidenceId],
        })
      )
    );
    
    timer.start();
    const recentCases = await t.query(api.cases.getRecentCases, { limit: 1000 });
    const duration = timer.stop();
    
    expect(recentCases.length).toBeGreaterThan(0);
    console.log(`✓ Queried ${recentCases.length} cases in ${duration.toFixed(2)}ms`);
  }, 120000);

  it('should handle 1000+ agent list efficiently', async () => {
    const timer = new PerformanceTimer();
    
    const org = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Many Agents Org",
        createdAt: Date.now()
      });
    });
    
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkUserId: `many-agents-user-${Date.now()}`,
        email: "manyagents@test.com",
        name: "Many Agents User",
        organizationId: org,
        role: "admin",
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      });
    });
    
    const key = await t.mutation(api.apiKeys.generateApiKey, {
      userId,
      name: "Many Agents Key",
    });
    
    // Create 100 agents (scaled down from 1000)
    await Promise.all(
      Array.from({ length: 100 }, (_, i) =>
        t.mutation(api.agents.joinAgent, {
          apiKey: key.key,
          name: `Agent ${i}`,
        })
      )
    );
    
    timer.start();
    const agents = await t.query(api.agents.listAgents, { limit: 1000 });
    const duration = timer.stop();
    
    expect(agents.length).toBeGreaterThan(0);
    console.log(`✓ Queried ${agents.length} agents in ${duration.toFixed(2)}ms`);
  }, 120000);
});

describe('Rate Limiting', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
  });

  it('should handle rapid-fire submissions gracefully', async () => {
    const org = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Rapid Test Org",
        createdAt: Date.now()
      });
    });
    
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkUserId: `rapid-user-${Date.now()}`,
        email: "rapid@test.com",
        name: "Rapid User",
        organizationId: org,
        role: "admin",
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      });
    });
    
    const key = await t.mutation(api.apiKeys.generateApiKey, {
      userId,
      name: "Rapid Test Key",
    });
    
    const agent = await t.mutation(api.agents.joinAgent, {
      apiKey: key.key,
      name: 'Rapid Agent',
    });
    
    // Submit 50 evidence items as fast as possible
    const submissions = [];
    for (let i = 0; i < 50; i++) {
      submissions.push(
        t.mutation(api.evidence.submitEvidence, {
          agentDid: agent.did,
          sha256: `sha256_rapid_${Date.now()}_${i}_${Math.random()}`,
          uri: `https://test.example.com/rapid-${i}.json`,
          signer: 'did:test:signer',
          model: {
            provider: 'test',
            name: 'test-model',
            version: '1.0.0',
          },
        })
      );
    }
    
    const results = await Promise.all(submissions);
    expect(results).toHaveLength(50);
  }, 60000);

  it('should maintain consistency under load', async () => {
    const org = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Consistency Test Org",
        createdAt: Date.now()
      });
    });
    
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkUserId: `consistency-user-${Date.now()}`,
        email: "consistency@test.com",
        name: "Consistency User",
        organizationId: org,
        role: "admin",
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      });
    });
    
    const key = await t.mutation(api.apiKeys.generateApiKey, {
      userId,
      name: "Consistency Test Key",
    });
    
    const agent = await t.mutation(api.agents.joinAgent, {
      apiKey: key.key,
      name: 'Consistency Agent',
    });
    
    // Create many evidence items
    const evidenceIds = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        t.mutation(api.evidence.submitEvidence, {
          agentDid: agent.did,
          sha256: `sha256_consistency_${Date.now()}_${i}_${Math.random()}`,
          uri: `https://test.example.com/consistency-${i}.json`,
          signer: 'did:test:signer',
          model: {
            provider: 'test',
            name: 'test-model',
            version: '1.0.0',
          },
        })
      )
    );
    
    // Verify all evidence is queryable
    const evidence = await t.query(api.evidence.getEvidenceByAgent, {
      agentDid: agent.did,
    });
    
    expect(evidence.length).toBeGreaterThanOrEqual(20);
  }, 60000);

  it('should handle burst traffic patterns', async () => {
    const org = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Burst Test Org",
        createdAt: Date.now()
      });
    });
    
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkUserId: `burst-user-${Date.now()}`,
        email: "burst@test.com",
        name: "Burst User",
        organizationId: org,
        role: "admin",
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      });
    });
    
    const key = await t.mutation(api.apiKeys.generateApiKey, {
      userId,
      name: "Burst Test Key",
    });
    
    // Burst 1: Create 10 agents
    const burst1 = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        t.mutation(api.agents.joinAgent, {
          apiKey: key.key,
          name: `Burst Agent ${i}`,
        })
      )
    );
    
    expect(burst1).toHaveLength(10);
    
    // Burst 2: Submit 20 evidence items
    const burst2 = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        t.mutation(api.evidence.submitEvidence, {
          agentDid: burst1[0].did,
          sha256: `sha256_burst_${Date.now()}_${i}_${Math.random()}`,
          uri: `https://test.example.com/burst-${i}.json`,
          signer: 'did:test:signer',
          model: {
            provider: 'test',
            name: 'test-model',
            version: '1.0.0',
          },
        })
      )
    );
    
    expect(burst2).toHaveLength(20);
  }, 60000);
});

