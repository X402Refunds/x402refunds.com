import { describe, it, expect, beforeEach } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../convex/_generated/api';
import schema from '../convex/schema';
import { createTestOwnerAndAgents, createTestJudgePanel } from './setup';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

  it('should complete end-to-end dispute resolution', async () => {
    // 1. Register agents
    const { plaintiff, defendant } = await createTestOwnerAndAgents(t);
    
    // 2. Submit evidence
    const evidenceIds = [];
    for (let i = 0; i < 2; i++) {
      const evidenceId = await t.mutation(api.evidence.submitEvidence, {
        agentDid: plaintiff,
        sha256: `sha256_e2e_${Date.now()}_${i}`,
        uri: `https://test.example.com/evidence-${i}.json`,
        signer: 'did:test:signer',
        model: {
          provider: 'test',
          name: 'test-model',
          version: '1.0.0',
        },
      });
      evidenceIds.push(evidenceId);
    }
    
    // 3. File dispute
    const caseId = await t.mutation(api.cases.fileDispute, {
      plaintiff,
      defendant,
      type: 'SLA_BREACH',
      jurisdictionTags: ['e2e-test'],
      evidenceIds,
      description: 'E2E test dispute',
      claimedDamages: 15000,
    });
    
    // 4. Assign panel
    const judges = await createTestJudgePanel(t, 3);
    const panelId = await t.mutation(api.judges.assignPanel, {
      caseId,
      panelSize: 3,
    });
    
    // 5. Vote (use judges from assigned panel)
    const panel = await t.query(api.judges.getPanel, { panelId });
    for (const judgeId of panel!.judgeIds) {
      await t.mutation(api.judges.submitVote, {
        panelId,
        judgeId,
        code: 'UPHELD',
        reasons: 'E2E test vote',
        confidence: 0.9,
      });
    }
    
    // 6. Issue ruling
    await t.mutation(api.cases.updateCaseRuling, {
      caseId,
      ruling: {
        verdict: 'UPHELD',
        winner: plaintiff,
        auto: false,
        decidedAt: Date.now(),
      },
    });
    
    // 7. Update reputations (happens automatically via scheduler)
    await sleep(100);
    
    // 8. Verify final state
    const case_ = await t.query(api.cases.getCaseById, { caseId });
    expect(case_?.status).toBeDefined();
    expect(case_?.ruling).toBeDefined();
    
    const plaintiffRep = await t.query(api.agents.getAgentReputation, { agentDid: plaintiff });
    expect(plaintiffRep).toBeDefined();
  }, 30000); // Longer timeout for integration test

  it('should handle dispute with appeal scenario', async () => {
    const { plaintiff, defendant } = await createTestOwnerAndAgents(t);
    
    // Create and resolve initial case
    const evidenceId = await t.mutation(api.evidence.submitEvidence, {
      agentDid: plaintiff,
      sha256: `sha256_appeal_${Date.now()}`,
      uri: 'https://test.example.com/appeal.json',
      signer: 'did:test:signer',
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });
    
    const caseId = await t.mutation(api.cases.fileDispute, {
      plaintiff,
      defendant,
      type: 'SLA_BREACH',
      jurisdictionTags: ['appeal-test'],
      evidenceIds: [evidenceId],
    });
    
    // Initial ruling
    await t.mutation(api.cases.updateCaseRuling, {
      caseId,
      ruling: {
        verdict: 'DISMISSED',
        winner: defendant,
        auto: false,
        decidedAt: Date.now(),
      },
    });
    
    // File appeal (by creating related case)
    const appealEvidenceId = await t.mutation(api.evidence.submitEvidence, {
      agentDid: plaintiff,
      sha256: `sha256_appeal_evidence_${Date.now()}`,
      uri: 'https://test.example.com/appeal-evidence.json',
      signer: 'did:test:signer',
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });
    
    const appealCaseId = await t.mutation(api.cases.fileDispute, {
      plaintiff,
      defendant,
      type: 'APPEAL',
      jurisdictionTags: ['appeal', `original:${caseId}`],
      evidenceIds: [appealEvidenceId],
      description: `Appeal of case ${caseId}`,
    });
    
    expect(appealCaseId).toBeDefined();
    
    const appealCase = await t.query(api.cases.getCaseById, { caseId: appealCaseId });
    expect(appealCase?.type).toBe('APPEAL');
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
    
    const cases = await t.query(api.cases.getCasesByParty, { agentDid: plaintiff });
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
    
    const caseId = await t.mutation(api.cases.fileDispute, {
      plaintiff,
      defendant,
      type: 'SLA_BREACH',
      jurisdictionTags: ['multi-evidence'],
      evidenceIds,
    });
    
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
    
    const caseId = await t.mutation(api.cases.fileDispute, {
      plaintiff,
      defendant,
      type: 'SLA_BREACH',
      jurisdictionTags: ['partial'],
      evidenceIds: [evidenceId],
      claimedDamages: 10000,
    });
    
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
    const ownerDid = `did:test:multi-owner-${Date.now()}`;
    await t.mutation(api.auth.createOwner, {
      did: ownerDid,
      name: 'Multi Owner',
      email: `multi-${Date.now()}@test.com`,
    });
    
    // Create three agents
    const agents = [];
    for (let i = 0; i < 3; i++) {
      const agent = await t.mutation(api.agents.joinAgent, {
        ownerDid,
        name: `Agent ${i}`,
        organizationName: `Org ${i} ${Date.now()}`,
      });
      agents.push(agent.did);
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
    const agent1Cases = await t.query(api.cases.getCasesByParty, { agentDid: agents[1] });
    expect(agent1Cases.length).toBe(2);
  });

  it('should handle multiple defendants scenario', async () => {
    const ownerDid = `did:test:multi-def-${Date.now()}`;
    await t.mutation(api.auth.createOwner, {
      did: ownerDid,
      name: 'Multi Defendant Owner',
      email: `multi-def-${Date.now()}@test.com`,
    });
    
    const plaintiff = await t.mutation(api.agents.joinAgent, {
      ownerDid,
      name: 'Plaintiff',
      organizationName: `Plaintiff ${Date.now()}`,
    });
    
    const defendants = [];
    for (let i = 0; i < 2; i++) {
      const defendant = await t.mutation(api.agents.joinAgent, {
        ownerDid,
        name: `Defendant ${i}`,
        organizationName: `Defendant ${i} ${Date.now()}`,
      });
      defendants.push(defendant.did);
    }
    
    // File separate cases against each defendant
    for (let i = 0; i < defendants.length; i++) {
      const evidence = await t.mutation(api.evidence.submitEvidence, {
        agentDid: plaintiff.did,
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
        plaintiff: plaintiff.did,
        defendant: defendants[i],
        type: 'SLA_BREACH',
        jurisdictionTags: ['multi-defendant'],
        evidenceIds: [evidence],
      });
    }
    
    const cases = await t.query(api.cases.getCasesByPlaintiff, { plaintiffDid: plaintiff.did });
    expect(cases.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle class action style dispute', async () => {
    const ownerDid = `did:test:class-${Date.now()}`;
    await t.mutation(api.auth.createOwner, {
      did: ownerDid,
      name: 'Class Action Owner',
      email: `class-${Date.now()}@test.com`,
    });
    
    // Multiple plaintiffs
    const plaintiffs = [];
    for (let i = 0; i < 3; i++) {
      const plaintiff = await t.mutation(api.agents.joinAgent, {
        ownerDid,
        name: `Plaintiff ${i}`,
        organizationName: `Plaintiff ${i} ${Date.now()}`,
      });
      plaintiffs.push(plaintiff.did);
    }
    
    // One defendant
    const defendant = await t.mutation(api.agents.joinAgent, {
      ownerDid,
      name: 'Defendant',
      organizationName: `Defendant ${Date.now()}`,
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
        defendant: defendant.did,
        type: 'SLA_BREACH',
        jurisdictionTags: ['class-action'],
        evidenceIds: [evidence],
      });
    }
    
    const defendantCases = await t.query(api.cases.getCasesByDefendant, {
      defendantDid: defendant.did,
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
    
    const caseId = await t.mutation(api.cases.fileDispute, {
      plaintiff,
      defendant,
      type: 'SLA_BREACH',
      jurisdictionTags: ['chain-validation'],
      evidenceIds,
    });
    
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
      
      const caseId = await t.mutation(api.cases.fileDispute, {
        plaintiff,
        defendant,
        type: 'SLA_BREACH',
        jurisdictionTags: ['reputation-test'],
        evidenceIds: [evidenceId],
      });
      
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

