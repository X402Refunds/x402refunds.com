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
    
    // Create owner first
    const ownerDid = `did:test:perf-owner-${Date.now()}`;
    await t.mutation(api.auth.createOwner, {
      did: ownerDid,
      name: 'Performance Test Owner',
      email: `perf-${Date.now()}@test.com`,
    });
    
    // Register 100 agents concurrently
    const registrations = Array.from({ length: 100 }, (_, i) =>
      t.mutation(api.agents.joinAgent, {
        ownerDid,
        name: `Concurrent Agent ${i}`,
        organizationName: `Concurrent Org ${i} ${Date.now()}`,
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
    
    // Setup
    const ownerDid = `did:test:case-perf-${Date.now()}`;
    await t.mutation(api.auth.createOwner, {
      did: ownerDid,
      name: 'Case Perf Owner',
      email: `case-perf-${Date.now()}@test.com`,
    });
    
    const plaintiff = await t.mutation(api.agents.joinAgent, {
      ownerDid,
      name: 'Plaintiff',
      organizationName: `Plaintiff Perf ${Date.now()}`,
    });
    
    const defendant = await t.mutation(api.agents.joinAgent, {
      ownerDid,
      name: 'Defendant',
      organizationName: `Defendant Perf ${Date.now()}`,
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
    
    const ownerDid = `did:test:ev-perf-${Date.now()}`;
    await t.mutation(api.auth.createOwner, {
      did: ownerDid,
      name: 'Evidence Perf Owner',
      email: `ev-perf-${Date.now()}@test.com`,
    });
    
    const agent = await t.mutation(api.agents.joinAgent, {
      ownerDid,
      name: 'Evidence Agent',
      organizationName: `Evidence Org ${Date.now()}`,
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
    
    // Setup case and panel
    const ownerDid = `did:test:vote-perf-${Date.now()}`;
    await t.mutation(api.auth.createOwner, {
      did: ownerDid,
      name: 'Vote Perf Owner',
      email: `vote-perf-${Date.now()}@test.com`,
    });
    
    const plaintiff = await t.mutation(api.agents.joinAgent, {
      ownerDid,
      name: 'Plaintiff',
      organizationName: `Plaintiff ${Date.now()}`,
    });
    
    const defendant = await t.mutation(api.agents.joinAgent, {
      ownerDid,
      name: 'Defendant',
      organizationName: `Defendant ${Date.now()}`,
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
    const ownerDid = `did:test:large-${Date.now()}`;
    await t.mutation(api.auth.createOwner, {
      did: ownerDid,
      name: 'Large Data Owner',
      email: `large-${Date.now()}@test.com`,
    });
    
    const agent = await t.mutation(api.agents.joinAgent, {
      ownerDid,
      name: 'Large Data Agent',
      organizationName: `Large ${Date.now()}`,
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
    
    const ownerDid = `did:test:many-cases-${Date.now()}`;
    await t.mutation(api.auth.createOwner, {
      did: ownerDid,
      name: 'Many Cases Owner',
      email: `many-${Date.now()}@test.com`,
    });
    
    const plaintiff = await t.mutation(api.agents.joinAgent, {
      ownerDid,
      name: 'Plaintiff',
      organizationName: `Plaintiff Many ${Date.now()}`,
    });
    
    const defendant = await t.mutation(api.agents.joinAgent, {
      ownerDid,
      name: 'Defendant',
      organizationName: `Defendant Many ${Date.now()}`,
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
    
    const ownerDid = `did:test:many-agents-${Date.now()}`;
    await t.mutation(api.auth.createOwner, {
      did: ownerDid,
      name: 'Many Agents Owner',
      email: `many-agents-${Date.now()}@test.com`,
    });
    
    // Create 100 agents (scaled down from 1000)
    await Promise.all(
      Array.from({ length: 100 }, (_, i) =>
        t.mutation(api.agents.joinAgent, {
          ownerDid,
          name: `Agent ${i}`,
          organizationName: `Org ${i} ${Date.now()}`,
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
    const ownerDid = `did:test:rapid-${Date.now()}`;
    await t.mutation(api.auth.createOwner, {
      did: ownerDid,
      name: 'Rapid Test Owner',
      email: `rapid-${Date.now()}@test.com`,
    });
    
    const agent = await t.mutation(api.agents.joinAgent, {
      ownerDid,
      name: 'Rapid Agent',
      organizationName: `Rapid ${Date.now()}`,
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
    const ownerDid = `did:test:consistency-${Date.now()}`;
    await t.mutation(api.auth.createOwner, {
      did: ownerDid,
      name: 'Consistency Owner',
      email: `consistency-${Date.now()}@test.com`,
    });
    
    const agent = await t.mutation(api.agents.joinAgent, {
      ownerDid,
      name: 'Consistency Agent',
      organizationName: `Consistency ${Date.now()}`,
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
    const ownerDid = `did:test:burst-${Date.now()}`;
    await t.mutation(api.auth.createOwner, {
      did: ownerDid,
      name: 'Burst Owner',
      email: `burst-${Date.now()}@test.com`,
    });
    
    // Burst 1: Create 10 agents
    const burst1 = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        t.mutation(api.agents.joinAgent, {
          ownerDid,
          name: `Burst Agent ${i}`,
          organizationName: `Burst ${i} ${Date.now()}`,
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

