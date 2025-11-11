import { describe, it, expect, beforeEach } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../convex/_generated/api';
import schema from '../convex/schema';
import { createTestOwnerAndAgents } from './setup';
import { createTestAgent } from './testHelper';

/**
 * Integration Tests - End-to-End Workflows
 * 
 * Tests for complete dispute lifecycles and complex scenarios
 */

describe('Full Dispute Lifecycle', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
  });

  it('should handle dispute with counterclaim', async () => {
    const { plaintiff, defendant } = await createTestOwnerAndAgents(t);
    
    // Original claim
    const evidence1 = await t.mutation(api.evidence.submitEvidence, {
      agentDid: plaintiff,
      sha256: `sha256_claim_${Date.now()}`,
      uri: 'https://test.example.com/claim.json',
      signer: 'did:test:signer',
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });
    
    const case1 = await t.mutation(api.cases.fileDispute, {
      plaintiff,
      defendant,
      type: 'SLA_BREACH',
      jurisdictionTags: ['counterclaim-test'],
      evidenceIds: [evidence1],
      description: 'Original claim',
    });
    
    // Counterclaim
    const evidence2 = await t.mutation(api.evidence.submitEvidence, {
      agentDid: defendant,
      sha256: `sha256_counter_${Date.now()}`,
      uri: 'https://test.example.com/counter.json',
      signer: 'did:test:signer',
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });
    
    const case2 = await t.mutation(api.cases.fileDispute, {
      plaintiff: defendant,
      defendant: plaintiff,
      type: 'CONTRACT_DISPUTE',
      jurisdictionTags: ['counterclaim', `original:${case1}`],
      evidenceIds: [evidence2],
      description: 'Counterclaim',
    });
    
    expect(case2).toBeDefined();
    
    const cases = await t.query(api.cases.getCasesByParty, { party: plaintiff });
    expect(cases.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle multiple evidence submissions', async () => {
    const { plaintiff, defendant } = await createTestOwnerAndAgents(t);
    
    const evidenceIds = [];
    for (let i = 0; i < 5; i++) {
      const evidenceId = await t.mutation(api.evidence.submitEvidence, {
        agentDid: plaintiff,
        sha256: `sha256_multi_${Date.now()}_${i}`,
        uri: `https://test.example.com/multi-${i}.json`,
        signer: 'did:test:signer',
        model: {
          provider: 'test',
          name: 'test-model',
          version: '1.0.0',
        },
      });
      evidenceIds.push(evidenceId);
    }
    
    const caseResult = await t.mutation(api.cases.fileDispute, {
      plaintiff,
      defendant,
      type: 'SLA_BREACH',
      jurisdictionTags: ['multi-evidence'],
      evidenceIds,
    });
    const caseId = caseResult.caseId;
    
    const evidence = await t.query(api.evidence.getEvidenceByCaseId, { caseId });
    expect(evidence.length).toBeGreaterThanOrEqual(5);
  });

  it('should handle partial ruling', async () => {
    const { plaintiff, defendant } = await createTestOwnerAndAgents(t);
    
    const evidenceId = await t.mutation(api.evidence.submitEvidence, {
      agentDid: plaintiff,
      sha256: `sha256_partial_${Date.now()}`,
      uri: 'https://test.example.com/partial.json',
      signer: 'did:test:signer',
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });
    
    const caseResult = await t.mutation(api.cases.fileDispute, {
      plaintiff,
      defendant,
      type: 'SLA_BREACH',
      jurisdictionTags: ['partial'],
      evidenceIds: [evidenceId],
      claimedDamages: 10000,
    });
    const caseId = caseResult.caseId;
    
    // Partial ruling - some claims upheld, some dismissed
    await t.mutation(api.cases.updateCaseRuling, {
      caseId,
      ruling: {
        verdict: 'PARTIALLY_UPHELD',
        winner: plaintiff,
        auto: false,
        decidedAt: Date.now(),
      },
    });
    
    const case_ = await t.query(api.cases.getCaseById, { caseId });
    expect(case_?.ruling?.verdict).toBe('PARTIALLY_UPHELD');
  });
});

describe('Multi-Party Disputes', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
  });

  it('should handle three-party dispute resolution', async () => {
    // Create three agents (each with their own organization)
    const agents = [];
    for (let i = 0; i < 3; i++) {
      const result = await createTestAgent(t, {
        orgName: `Org ${i} ${Date.now()}`,
        agentName: `Agent ${i}`,
      });
      agents.push(result.agentDid);
    }
    
    // Agent 0 vs Agent 1
    const evidence1 = await t.mutation(api.evidence.submitEvidence, {
      agentDid: agents[0],
      sha256: `sha256_3party_1_${Date.now()}`,
      uri: 'https://test.example.com/3party1.json',
      signer: 'did:test:signer',
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });
    
    const case1 = await t.mutation(api.cases.fileDispute, {
      plaintiff: agents[0],
      defendant: agents[1],
      type: 'SLA_BREACH',
      jurisdictionTags: ['3-party'],
      evidenceIds: [evidence1],
    });
    
    // Agent 1 vs Agent 2
    const evidence2 = await t.mutation(api.evidence.submitEvidence, {
      agentDid: agents[1],
      sha256: `sha256_3party_2_${Date.now()}`,
      uri: 'https://test.example.com/3party2.json',
      signer: 'did:test:signer',
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });
    
    const case2 = await t.mutation(api.cases.fileDispute, {
      plaintiff: agents[1],
      defendant: agents[2],
      type: 'SLA_BREACH',
      jurisdictionTags: ['3-party'],
      evidenceIds: [evidence2],
    });
    
    expect(case1).toBeDefined();
    expect(case2).toBeDefined();
    
    // Agent 1 is involved in both cases
    const agent1Cases = await t.query(api.cases.getCasesByParty, { party: agents[1] });
    expect(agent1Cases.length).toBe(2);
  });

  it('should handle multiple defendants scenario', async () => {
    // Create plaintiff agent
    const plaintiff = await createTestAgent(t, {
      orgName: `Plaintiff ${Date.now()}`,
      agentName: 'Plaintiff',
    });
    
    // Create multiple defendant agents
    const defendants = [];
    for (let i = 0; i < 2; i++) {
      const defendant = await createTestAgent(t, {
        orgName: `Defendant ${i} ${Date.now()}`,
        agentName: `Defendant ${i}`,
      });
      defendants.push(defendant.agentDid);
    }
    
    // File separate cases against each defendant
    for (let i = 0; i < defendants.length; i++) {
      const evidence = await t.mutation(api.evidence.submitEvidence, {
        agentDid: plaintiff.agentDid,
        sha256: `sha256_multidef_${i}_${Date.now()}`,
        uri: `https://test.example.com/multidef-${i}.json`,
        signer: 'did:test:signer',
        model: {
          provider: 'test',
          name: 'test-model',
          version: '1.0.0',
        },
      });
      
      await t.mutation(api.cases.fileDispute, {
        plaintiff: plaintiff.agentDid,
        defendant: defendants[i],
        type: 'SLA_BREACH',
        jurisdictionTags: ['multi-defendant'],
        evidenceIds: [evidence],
      });
    }
    
    const cases = await t.query(api.cases.getCasesByPlaintiff, { plaintiffDid: plaintiff.agentDid });
    expect(cases.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle class action style dispute', async () => {
    // Multiple plaintiffs
    const plaintiffs = [];
    for (let i = 0; i < 3; i++) {
      const plaintiff = await createTestAgent(t, {
        orgName: `Plaintiff ${i} ${Date.now()}`,
        agentName: `Plaintiff ${i}`,
      });
      plaintiffs.push(plaintiff.agentDid);
    }
    
    // One defendant
    const defendant = await createTestAgent(t, {
      orgName: `Defendant ${Date.now()}`,
      agentName: 'Defendant',
    });
    
    // Each plaintiff files separate case
    for (let i = 0; i < plaintiffs.length; i++) {
      const evidence = await t.mutation(api.evidence.submitEvidence, {
        agentDid: plaintiffs[i],
        sha256: `sha256_class_${i}_${Date.now()}`,
        uri: `https://test.example.com/class-${i}.json`,
        signer: 'did:test:signer',
        model: {
          provider: 'test',
          name: 'test-model',
          version: '1.0.0',
        },
      });
      
      await t.mutation(api.cases.fileDispute, {
        plaintiff: plaintiffs[i],
        defendant: defendant.agentDid,
        type: 'SLA_BREACH',
        jurisdictionTags: ['class-action'],
        evidenceIds: [evidence],
      });
    }
    
    const defendantCases = await t.query(api.cases.getCasesByDefendant, {
      defendantDid: defendant.agentDid,
    });
    expect(defendantCases.length).toBeGreaterThanOrEqual(3);
  });
});

describe('Evidence Chain Validation', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
  });

  it('should verify complete evidence chain', async () => {
    const { plaintiff, defendant } = await createTestOwnerAndAgents(t);
    
    // Submit chain of evidence
    const evidenceIds = [];
    for (let i = 0; i < 3; i++) {
      const evidenceId = await t.mutation(api.evidence.submitEvidence, {
        agentDid: plaintiff,
        sha256: `sha256_chain_${i}_${Date.now()}`,
        uri: `https://test.example.com/chain-${i}.json`,
        signer: 'did:test:signer',
        model: {
          provider: 'test',
          name: 'test-model',
          version: '1.0.0',
        },
      });
      evidenceIds.push(evidenceId);
    }
    
    const caseResult = await t.mutation(api.cases.fileDispute, {
      plaintiff,
      defendant,
      type: 'SLA_BREACH',
      jurisdictionTags: ['chain-validation'],
      evidenceIds,
    });
    const caseId = caseResult.caseId;
    
    const evidence = await t.query(api.evidence.getEvidenceByCaseId, { caseId });
    expect(evidence.length).toBe(3);
    
    // Verify all evidence is valid
    for (const ev of evidence) {
      expect(ev.sha256).toBeDefined();
      expect(ev.signer).toBeDefined();
    }
  });

  it('should accept evidence with various hashes', async () => {
    const { plaintiff } = await createTestOwnerAndAgents(t);
    
    // System accepts various hash formats
    const evidenceId = await t.mutation(api.evidence.submitEvidence, {
      agentDid: plaintiff,
      sha256: 'any-hash-format', // Various formats accepted
      uri: 'https://test.example.com/various-hash.json',
      signer: 'did:test:signer',
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });
    
    expect(evidenceId).toBeDefined();
  });

  it('should handle missing evidence links', async () => {
    const { plaintiff, defendant } = await createTestOwnerAndAgents(t);
    
    // Try to file case with non-existent evidence
    await expect(
      t.mutation(api.cases.fileDispute, {
        plaintiff,
        defendant,
        type: 'SLA_BREACH',
        jurisdictionTags: ['missing-evidence'],
        evidenceIds: ['non-existent-evidence-id'],
      })
    ).rejects.toThrow();
  });
});

describe('Reputation Propagation', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
  });

  it('should propagate win/loss reputation across multiple cases', async () => {
    const { plaintiff, defendant } = await createTestOwnerAndAgents(t);
    
    // File and resolve multiple cases
    for (let i = 0; i < 3; i++) {
      const evidenceId = await t.mutation(api.evidence.submitEvidence, {
        agentDid: plaintiff,
        sha256: `sha256_rep_${i}_${Date.now()}`,
        uri: `https://test.example.com/rep-${i}.json`,
        signer: 'did:test:signer',
        model: {
          provider: 'test',
          name: 'test-model',
          version: '1.0.0',
        },
      });
      
      const caseResult = await t.mutation(api.cases.fileDispute, {
        plaintiff,
        defendant,
        type: 'SLA_BREACH',
        jurisdictionTags: ['reputation-test'],
        evidenceIds: [evidenceId],
      });
      const caseId = caseResult.caseId;
      
      // Plaintiff wins
      await t.mutation(api.cases.updateCaseRuling, {
        caseId,
        ruling: {
          verdict: 'UPHELD',
          winner: plaintiff,
          auto: false,
          decidedAt: Date.now(),
        },
      });
      
      // Update reputations
      await t.mutation(api.agents.updateAgentReputation, {
        agentDid: plaintiff,
        role: 'plaintiff',
        outcome: 'won',
        slaViolation: false,
      });
      
      await t.mutation(api.agents.updateAgentReputation, {
        agentDid: defendant,
        role: 'defendant',
        outcome: 'lost',
        slaViolation: true,
      });
    }
    
    // Check reputation propagation
    const plaintiffRep = await t.query(api.agents.getAgentReputation, { agentDid: plaintiff });
    const defendantRep = await t.query(api.agents.getAgentReputation, { agentDid: defendant });
    
    expect(plaintiffRep?.casesWon).toBeGreaterThanOrEqual(3);
    expect(defendantRep?.casesLost).toBeGreaterThanOrEqual(3);
    expect(defendantRep?.slaViolations).toBeGreaterThanOrEqual(3);
  });

  it('should accumulate SLA violation penalties', async () => {
    const { plaintiff, defendant } = await createTestOwnerAndAgents(t);
    
    // Multiple SLA violations
    for (let i = 0; i < 3; i++) {
      await t.mutation(api.agents.updateAgentReputation, {
        agentDid: defendant,
        role: 'defendant',
        outcome: 'lost',
        slaViolation: true,
      });
    }
    
    const rep = await t.query(api.agents.getAgentReputation, { agentDid: defendant });
    expect(rep?.slaViolations).toBeGreaterThanOrEqual(3);
    expect(rep?.reliabilityScore).toBeLessThan(100); // Penalties applied
  });
});

