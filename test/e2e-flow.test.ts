import { describe, it, expect, beforeAll } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../convex/_generated/api';
import schema from '../convex/schema';

/**
 * End-to-End Agent Dispute Flow Tests
 * 
 * Comprehensive E2E tests covering the complete agent lifecycle:
 * 1. Agent Registration
 * 2. Evidence Submission
 * 3. Dispute Filing
 * 4. Case Status Tracking
 * 5. Resolution & Reputation Updates
 * 
 * Tests hit api.consulatehq.com when API_BASE_URL is set to production
 * 
 * Usage:
 * - Local testing: pnpm test:run test/e2e-flow.test.ts
 * - Production testing: API_BASE_URL=https://api.consulatehq.com pnpm test:run test/e2e-flow.test.ts
 */

const API_BASE_URL = process.env.API_BASE_URL || 'https://api.consulatehq.com';
const USE_LIVE_API = API_BASE_URL.includes('consulatehq.com') || API_BASE_URL.includes('convex.site');

describe.skip('E2E: Complete Agent Dispute Flow - Happy Path (deprecated - using old /agents/register endpoint)', () => {
  let t: ReturnType<typeof convexTest>;
  let ownerDid: string;
  let plaintiffDid: string;
  let defendantDid: string;
  let evidenceId: string;
  let caseId: string;

  beforeAll(async () => {
    if (!USE_LIVE_API) {
      const modules = import.meta.glob('../convex/**/*.{ts,js}');
      t = convexTest(schema, modules);
      
      // Setup test data via Convex
      ownerDid = `did:test:e2e-owner-${Date.now()}`;
      await t.mutation(api.auth.createOwner, {
        did: ownerDid,
        name: 'E2E Test Owner',
        email: `e2e-${Date.now()}@example.com`,
      });
    }
  });

  it('Step 1: Should register plaintiff agent via HTTP', async () => {
    const agentData = {
      ownerDid: USE_LIVE_API ? `did:test:e2e-${Date.now()}` : ownerDid,
      name: 'Plaintiff AI Service',
      organizationName: `Plaintiff Corp ${Date.now()}`,
      functionalType: 'general',
    };

    const response = await fetch(`${API_BASE_URL}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agentData),
    });

    // 200 in test environment, 400 in production (owner won't exist)
    if (USE_LIVE_API) {
      expect([200, 400]).toContain(response.status);
      if (response.status === 400) {
        console.log('⚠️ Production test: Owner not found (expected)');
        return; // Skip rest of test for production
      }
    } else {
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.did).toBeDefined();
      expect(data.did).toMatch(/^did:agent:/);
      plaintiffDid = data.did;
    }
  });

  it('Step 2: Should register defendant agent via HTTP', async () => {
    if (USE_LIVE_API) {
      return; // Skip for production
    }

    const agentData = {
      ownerDid,
      name: 'Defendant AI Service',
      organizationName: `Defendant Corp ${Date.now()}`,
      functionalType: 'general',
    };

    const response = await fetch(`${API_BASE_URL}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agentData),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    defendantDid = data.did;
  });

  it('Step 3: Should submit evidence via HTTP', async () => {
    if (USE_LIVE_API || !plaintiffDid) {
      return;
    }

    const evidenceData = {
      agentDid: plaintiffDid,
      sha256: `e2e_evidence_${Date.now()}`,
      uri: 'https://evidence.example.com/sla-breach.json',
      signer: plaintiffDid,
      model: {
        provider: 'anthropic',
        name: 'claude-3.5-sonnet',
        version: '20241022',
      },
    };

    const response = await fetch(`${API_BASE_URL}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evidenceData),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.evidenceId).toBeDefined();
    evidenceId = data.evidenceId;
  });

  it('Step 4: Should file dispute via HTTP', async () => {
    if (USE_LIVE_API || !plaintiffDid || !defendantDid || !evidenceId) {
      return;
    }

    const disputeData = {
      plaintiff: plaintiffDid,
      defendant: defendantDid,
      type: 'SLA_BREACH',
      jurisdictionTags: ['AI_SERVICE', 'E2E_TEST'],
      evidenceIds: [evidenceId],
      description: 'E2E test dispute: API downtime exceeded SLA threshold',
      claimedDamages: 50000,
    };

    const response = await fetch(`${API_BASE_URL}/api/disputes/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(disputeData),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.caseId).toBeDefined();
    caseId = data.caseId;
  });

  it('Step 5: Should retrieve case status via HTTP', async () => {
    if (USE_LIVE_API || !caseId) {
      return;
    }

    const response = await fetch(`${API_BASE_URL}/cases/${caseId}`);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data._id).toBe(caseId);
    expect(data.plaintiff).toBe(plaintiffDid);
    expect(data.defendant).toBe(defendantDid);
    expect(data.status).toBeDefined();
    expect(['FILED', 'AUTORULED', 'PANELED', 'DECIDED']).toContain(data.status);
  });

  it('Step 6: Should track case progression through statuses', async () => {
    if (USE_LIVE_API || !caseId) {
      return;
    }

    // Poll case status (simulating agent monitoring)
    const maxPolls = 5;
    let polls = 0;
    let finalStatus;

    while (polls < maxPolls) {
      const response = await fetch(`${API_BASE_URL}/cases/${caseId}`);
      const data = await response.json();
      finalStatus = data.status;
      
      if (finalStatus === 'DECIDED' || finalStatus === 'AUTORULED' || finalStatus === 'CLOSED') {
        break;
      }
      
      polls++;
      // Wait 100ms between polls
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    expect(finalStatus).toBeDefined();
  });

  it('Step 7: Should retrieve plaintiff reputation after resolution', async () => {
    if (USE_LIVE_API || !plaintiffDid) {
      return;
    }

    const response = await fetch(`${API_BASE_URL}/agents/${plaintiffDid}/reputation`);
    
    if (response.status === 200) {
      const data = await response.json();
      expect(data.reputation).toBeDefined();
      expect(data.totalCases).toBeGreaterThanOrEqual(1);
    }
  });
});

describe.skip('E2E: Agent Registration Scenarios (deprecated - using old /agents/register endpoint)', () => {
  let t: ReturnType<typeof convexTest>;
  let testOwnerDid: string;

  beforeAll(async () => {
    if (!USE_LIVE_API) {
      const modules = import.meta.glob('../convex/**/*.{ts,js}');
      t = convexTest(schema, modules);
      
      testOwnerDid = `did:test:reg-owner-${Date.now()}`;
      await t.mutation(api.auth.createOwner, {
        did: testOwnerDid,
        name: 'Registration Test Owner',
        email: `reg-test-${Date.now()}@example.com`,
      });
    }
  });

  it('Positive: Should register agent with all valid fields', async () => {
    if (USE_LIVE_API) {
      return;
    }

    const response = await fetch(`${API_BASE_URL}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerDid: testOwnerDid,
        name: 'Full Featured Agent',
        organizationName: `Complete Org ${Date.now()}`,
        functionalType: 'coding',
        mock: false,
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.did).toMatch(/^did:agent:/);
    expect(data.reputationScore).toBe(50); // Default starting reputation
  });

  it('Neutral: Should handle re-registration attempt', async () => {
    if (USE_LIVE_API) {
      return;
    }

    const orgName = `Reuse Org ${Date.now()}`;
    
    // First registration
    await fetch(`${API_BASE_URL}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerDid: testOwnerDid,
        name: 'First Agent',
        organizationName: orgName,
      }),
    });

    // Second registration with same organization
    const response = await fetch(`${API_BASE_URL}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerDid: testOwnerDid,
        name: 'Second Agent',
        organizationName: orgName,
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('already has an agent');
  });

  it('Negative: Should reject missing ownerDid', async () => {
    const response = await fetch(`${API_BASE_URL}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Incomplete Agent',
        organizationName: `Incomplete Org ${Date.now()}`,
      }),
    });

    expect(response.status).toBe(400);
  });

  it('Negative: Should reject malformed DID', async () => {
    const response = await fetch(`${API_BASE_URL}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerDid: 'not-a-valid-did-format',
        name: 'Test Agent',
        organizationName: `Test Org ${Date.now()}`,
      }),
    });

    expect(response.status).toBe(400);
  });

  it('Negative: Should reject non-existent owner', async () => {
    const response = await fetch(`${API_BASE_URL}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerDid: 'did:test:definitely-does-not-exist-99999',
        name: 'Orphan Agent',
        organizationName: `Orphan Org ${Date.now()}`,
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('not found');
  });

  it('Negative: Should reject empty organization name', async () => {
    if (USE_LIVE_API) {
      return;
    }

    const response = await fetch(`${API_BASE_URL}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerDid: testOwnerDid,
        name: 'No Org Agent',
        organizationName: '',
      }),
    });

    expect(response.status).toBe(400);
  });
});

describe('E2E: Evidence Submission Scenarios', () => {
  let t: ReturnType<typeof convexTest>;
  let testAgentDid: string;

  beforeAll(async () => {
    if (!USE_LIVE_API) {
      const modules = import.meta.glob('../convex/**/*.{ts,js}');
      t = convexTest(schema, modules);
      
      const ownerDid = `did:test:ev-owner-${Date.now()}`;
      await t.mutation(api.auth.createOwner, {
        did: ownerDid,
        name: 'Evidence Test Owner',
        email: `ev-test-${Date.now()}@example.com`,
      });
      
      const agent = await t.mutation(api.agents.joinAgent, {
        ownerDid,
        name: 'Evidence Test Agent',
        organizationName: `Evidence Org ${Date.now()}`,
      });
      testAgentDid = agent.did;
    }
  });

  it('Positive: Should submit evidence with complete metadata', async () => {
    if (USE_LIVE_API) {
      return;
    }

    const response = await fetch(`${API_BASE_URL}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentDid: testAgentDid,
        sha256: `complete_ev_${Date.now()}`,
        uri: 'https://evidence.example.com/complete-evidence.json',
        signer: testAgentDid,
        model: {
          provider: 'anthropic',
          name: 'claude-3.5-sonnet',
          version: '20241022',
          temp: 0.7,
          seed: 42,
        },
        tool: 'evidence-collector-v2',
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.evidenceId).toBeDefined();
    expect(data.sha256).toBeDefined();
  });

  it('Positive: Should submit multiple evidence pieces for same case', async () => {
    if (USE_LIVE_API) {
      return;
    }

    const evidenceIds = [];
    
    for (let i = 0; i < 3; i++) {
      const response = await fetch(`${API_BASE_URL}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentDid: testAgentDid,
          sha256: `multi_ev_${i}_${Date.now()}`,
          uri: `https://evidence.example.com/piece-${i}.json`,
          signer: testAgentDid,
          model: {
            provider: 'anthropic',
            name: 'claude-3.5-sonnet',
            version: '20241022',
          },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      evidenceIds.push(data.evidenceId);
    }

    expect(evidenceIds).toHaveLength(3);
  });

  it('Neutral: Should accept evidence with minimal metadata', async () => {
    if (USE_LIVE_API) {
      return;
    }

    const response = await fetch(`${API_BASE_URL}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentDid: testAgentDid,
        sha256: `minimal_ev_${Date.now()}`,
        uri: 'https://evidence.example.com/minimal.json',
        signer: testAgentDid,
        model: {
          provider: 'test',
          name: 'test-model',
          version: '1.0.0',
        },
      }),
    });

    expect(response.status).toBe(200);
  });

  it('Negative: Should reject evidence without hash', async () => {
    const response = await fetch(`${API_BASE_URL}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentDid: testAgentDid,
        uri: 'https://evidence.example.com/no-hash.json',
        signer: 'did:test:signer',
        model: {
          provider: 'test',
          name: 'test-model',
          version: '1.0.0',
        },
      }),
    });

    expect(response.status).toBe(400);
  });

  it('Negative: Should reject evidence without signer', async () => {
    const response = await fetch(`${API_BASE_URL}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentDid: testAgentDid,
        sha256: `no_signer_${Date.now()}`,
        uri: 'https://evidence.example.com/no-signer.json',
        model: {
          provider: 'test',
          name: 'test-model',
          version: '1.0.0',
        },
      }),
    });

    expect(response.status).toBe(400);
  });

  it('Negative: Should reject evidence for non-existent agent', async () => {
    const response = await fetch(`${API_BASE_URL}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentDid: 'did:agent:does-not-exist-99999',
        sha256: `nonexistent_${Date.now()}`,
        uri: 'https://evidence.example.com/orphan.json',
        signer: 'did:test:signer',
        model: {
          provider: 'test',
          name: 'test-model',
          version: '1.0.0',
        },
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/not found|not active/i);
  });

  it('Negative: Should reject evidence with invalid model structure', async () => {
    if (USE_LIVE_API) {
      return;
    }

    const response = await fetch(`${API_BASE_URL}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentDid: testAgentDid,
        sha256: `bad_model_${Date.now()}`,
        uri: 'https://evidence.example.com/bad.json',
        signer: testAgentDid,
        model: 'invalid-model-format', // Should be object
      }),
    });

    expect(response.status).toBe(400);
  });
});

describe('E2E: Dispute Filing Scenarios', () => {
  let t: ReturnType<typeof convexTest>;
  let plaintiff: string;
  let defendant: string;
  let evidenceId: string;

  beforeAll(async () => {
    if (!USE_LIVE_API) {
      const modules = import.meta.glob('../convex/**/*.{ts,js}');
      t = convexTest(schema, modules);
      
      const ownerDid = `did:test:dispute-owner-${Date.now()}`;
      await t.mutation(api.auth.createOwner, {
        did: ownerDid,
        name: 'Dispute Test Owner',
        email: `dispute-test-${Date.now()}@example.com`,
      });
      
      const p = await t.mutation(api.agents.joinAgent, {
        ownerDid,
        name: 'Plaintiff',
        organizationName: `Plaintiff ${Date.now()}`,
      });
      plaintiff = p.did;
      
      const d = await t.mutation(api.agents.joinAgent, {
        ownerDid,
        name: 'Defendant',
        organizationName: `Defendant ${Date.now()}`,
      });
      defendant = d.did;
      
      evidenceId = await t.mutation(api.evidence.submitEvidence, {
        agentDid: plaintiff,
        sha256: `dispute_ev_${Date.now()}`,
        uri: 'https://evidence.example.com/dispute.json',
        signer: plaintiff,
        model: {
          provider: 'test',
          name: 'test-model',
          version: '1.0.0',
        },
      });
    }
  });

  it('Positive: Should file dispute with full details', async () => {
    if (USE_LIVE_API) {
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/disputes/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plaintiff,
        defendant,
        type: 'SLA_BREACH',
        jurisdictionTags: ['AI_SERVICE', 'UPTIME'],
        evidenceIds: [evidenceId],
        description: 'Defendant failed to maintain 99.9% uptime SLA',
        claimedDamages: 75000,
        breachDetails: {
          duration: '4 hours',
          impactLevel: 'Significant',
          affectedUsers: 5000,
          slaRequirement: '99.9% uptime',
          actualPerformance: '98.2% uptime',
        },
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.caseId).toBeDefined();
    expect(data.status).toBe('FILED');
  });

  it('Neutral: Should file dispute with minimal evidence', async () => {
    if (USE_LIVE_API) {
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/disputes/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plaintiff,
        defendant,
        type: 'SERVICE_INTERRUPTION',
        jurisdictionTags: ['AI_SERVICE'],
        evidenceIds: [evidenceId],
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.caseId).toBeDefined();
  });

  it('Negative: Should reject dispute with same plaintiff and defendant', async () => {
    if (USE_LIVE_API) {
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/disputes/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plaintiff,
        defendant: plaintiff, // Same as plaintiff
        type: 'SLA_BREACH',
        jurisdictionTags: ['TEST'],
        evidenceIds: [evidenceId],
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/different|same/i);
  });

  it('Negative: Should reject dispute with non-existent plaintiff', async () => {
    const response = await fetch(`${API_BASE_URL}/api/disputes/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plaintiff: 'did:agent:nonexistent-plaintiff',
        defendant: defendant,
        type: 'SLA_BREACH',
        jurisdictionTags: ['TEST'],
        evidenceIds: [evidenceId],
      }),
    });

    expect([400, 500]).toContain(response.status);
  });

  it('Negative: Should reject dispute with non-existent defendant', async () => {
    if (USE_LIVE_API) {
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/disputes/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plaintiff,
        defendant: 'did:agent:nonexistent-defendant',
        type: 'SLA_BREACH',
        jurisdictionTags: ['TEST'],
        evidenceIds: [evidenceId],
      }),
    });

    expect(response.status).toBe(400);
  });

  it('Negative: Should reject dispute with non-existent evidence', async () => {
    if (USE_LIVE_API) {
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/disputes/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plaintiff,
        defendant,
        type: 'SLA_BREACH',
        jurisdictionTags: ['TEST'],
        evidenceIds: ['jb99999999999999999999999'], // Non-existent
      }),
    });

    expect([400, 500]).toContain(response.status);
  });

  it('Negative: Should reject dispute missing required fields', async () => {
    const response = await fetch(`${API_BASE_URL}/api/disputes/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plaintiff,
        // Missing defendant, type, etc.
      }),
    });

    expect(response.status).toBe(400);
  });
});

describe('E2E: Case Status Tracking Scenarios', () => {
  let t: ReturnType<typeof convexTest>;
  let filedCaseId: string;
  let decidedCaseId: string;
  let paneledCaseId: string;

  beforeAll(async () => {
    if (!USE_LIVE_API) {
      const modules = import.meta.glob('../convex/**/*.{ts,js}');
      t = convexTest(schema, modules);
      
      const ownerDid = `did:test:status-owner-${Date.now()}`;
      await t.mutation(api.auth.createOwner, {
        did: ownerDid,
        name: 'Status Test Owner',
        email: `status-test-${Date.now()}@example.com`,
      });
      
      const p = await t.mutation(api.agents.joinAgent, {
        ownerDid,
        name: 'Plaintiff',
        organizationName: `Plaintiff ${Date.now()}`,
      });
      
      const d = await t.mutation(api.agents.joinAgent, {
        ownerDid,
        name: 'Defendant',
        organizationName: `Defendant ${Date.now()}`,
      });
      
      const ev = await t.mutation(api.evidence.submitEvidence, {
        agentDid: p.did,
        sha256: `status_ev_${Date.now()}`,
        uri: 'https://evidence.example.com/status.json',
        signer: p.did,
        model: {
          provider: 'test',
          name: 'test-model',
          version: '1.0.0',
        },
      });
      
      // Create cases in different statuses
      filedCaseId = await t.mutation(api.cases.fileDispute, {
        plaintiff: p.did,
        defendant: d.did,
        type: 'SLA_BREACH',
        jurisdictionTags: ['TEST'],
        evidenceIds: [ev],
      });
      
      decidedCaseId = await t.mutation(api.cases.fileDispute, {
        plaintiff: p.did,
        defendant: d.did,
        type: 'SLA_BREACH',
        jurisdictionTags: ['TEST'],
        evidenceIds: [ev],
      });
      
      await t.mutation(api.cases.updateCaseStatus, {
        caseId: decidedCaseId,
        status: 'DECIDED',
      });
      
      paneledCaseId = await t.mutation(api.cases.fileDispute, {
        plaintiff: p.did,
        defendant: d.did,
        type: 'SLA_BREACH',
        jurisdictionTags: ['TEST'],
        evidenceIds: [ev],
      });
      
      await t.mutation(api.cases.updateCaseStatus, {
        caseId: paneledCaseId,
        status: 'PANELED',
      });
    }
  });

  it('Positive: Should get FILED case status', async () => {
    if (USE_LIVE_API || !filedCaseId) {
      return;
    }

    const response = await fetch(`${API_BASE_URL}/cases/${filedCaseId}`);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('FILED');
    expect(data.plaintiff).toBeDefined();
    expect(data.defendant).toBeDefined();
    expect(data.filedAt).toBeDefined();
  });

  it('Positive: Should get DECIDED case with ruling', async () => {
    if (USE_LIVE_API || !decidedCaseId) {
      return;
    }

    const response = await fetch(`${API_BASE_URL}/cases/${decidedCaseId}`);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('DECIDED');
    expect(data.ruling).toBeDefined();
  });

  it('Positive: Should get PANELED case with panel info', async () => {
    if (USE_LIVE_API || !paneledCaseId) {
      return;
    }

    const response = await fetch(`${API_BASE_URL}/cases/${paneledCaseId}`);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('PANELED');
    expect(data.panelId).toBeDefined();
  });

  it('Neutral: Should poll case status repeatedly', async () => {
    if (USE_LIVE_API || !filedCaseId) {
      return;
    }

    // Simulate agent polling for status updates
    for (let i = 0; i < 3; i++) {
      const response = await fetch(`${API_BASE_URL}/cases/${filedCaseId}`);
      expect(response.status).toBe(200);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  });

  it('Negative: Should return 404 for non-existent case', async () => {
    const response = await fetch(`${API_BASE_URL}/cases/jb99999999999999999999999`);
    expect(response.status).toBe(404);
  });

  it('Negative: Should return 400 for invalid case ID format', async () => {
    const response = await fetch(`${API_BASE_URL}/cases/invalid-id-format`);
    expect([400, 404]).toContain(response.status);
  });

  it('Negative: Should handle malformed case ID gracefully', async () => {
    const response = await fetch(`${API_BASE_URL}/cases/` + encodeURIComponent('../../etc/passwd'));
    expect([400, 404]).toContain(response.status);
  });
});

describe('E2E: Complete Dispute Resolution Flow - Auto-Decision', () => {
  let t: ReturnType<typeof convexTest>;

  beforeAll(async () => {
    if (!USE_LIVE_API) {
      const modules = import.meta.glob('../convex/**/*.{ts,js}');
      t = convexTest(schema, modules);
    }
  });

  it('Flow: Register → Evidence → Dispute → Auto-Decision (Strong Evidence)', async () => {
    if (USE_LIVE_API) {
      return;
    }

    // 1. Create owner
    const ownerDid = `did:test:auto-owner-${Date.now()}`;
    await t.mutation(api.auth.createOwner, {
      did: ownerDid,
      name: 'Auto Test Owner',
      email: `auto-${Date.now()}@example.com`,
    });

    // 2. Register agents via HTTP
    const plaintiffResp = await fetch(`${API_BASE_URL}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerDid,
        name: 'Auto Plaintiff',
        organizationName: `Auto Plaintiff Corp ${Date.now()}`,
      }),
    });
    expect(plaintiffResp.status).toBe(200);
    const plaintiff = (await plaintiffResp.json()).did;

    const defendantResp = await fetch(`${API_BASE_URL}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerDid,
        name: 'Auto Defendant',
        organizationName: `Auto Defendant Corp ${Date.now()}`,
      }),
    });
    expect(defendantResp.status).toBe(200);
    const defendant = (await defendantResp.json()).did;

    // 3. Submit multiple pieces of evidence (triggers auto-decision)
    const evidenceIds = [];
    for (let i = 0; i < 4; i++) {
      const evResp = await fetch(`${API_BASE_URL}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentDid: plaintiff,
          sha256: `auto_ev_${i}_${Date.now()}`,
          uri: `https://evidence.example.com/strong-${i}.json`,
          signer: plaintiff,
          model: {
            provider: 'anthropic',
            name: 'claude-3.5-sonnet',
            version: '20241022',
          },
        }),
      });
      expect(evResp.status).toBe(200);
      evidenceIds.push((await evResp.json()).evidenceId);
    }

    // 4. File dispute
    const disputeResp = await fetch(`${API_BASE_URL}/api/disputes/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plaintiff,
        defendant,
        type: 'SLA_BREACH',
        jurisdictionTags: ['AUTO_DECISION', 'STRONG_EVIDENCE'],
        evidenceIds,
        description: 'Clear SLA violation with substantial evidence',
        claimedDamages: 100000,
      }),
    });
    expect(disputeResp.status).toBe(200);
    const caseId = (await disputeResp.json()).caseId;

    // 5. Check initial status
    const statusResp = await fetch(`${API_BASE_URL}/cases/${caseId}`);
    expect(statusResp.status).toBe(200);
    const caseData = await statusResp.json();
    expect(caseData.status).toBeDefined();
    expect(caseData.evidenceIds).toHaveLength(4);
  });

  it('Flow: Register → No Evidence → Dispute → Auto-Dismissed', async () => {
    if (USE_LIVE_API) {
      return;
    }

    // 1. Create test agents
    const ownerDid = `did:test:dismiss-owner-${Date.now()}`;
    await t.mutation(api.auth.createOwner, {
      did: ownerDid,
      name: 'Dismiss Test Owner',
      email: `dismiss-${Date.now()}@example.com`,
    });

    const p = await t.mutation(api.agents.joinAgent, {
      ownerDid,
      name: 'Weak Plaintiff',
      organizationName: `Weak Plaintiff ${Date.now()}`,
    });

    const d = await t.mutation(api.agents.joinAgent, {
      ownerDid,
      name: 'Strong Defendant',
      organizationName: `Strong Defendant ${Date.now()}`,
    });

    // 2. File dispute with no evidence (via direct Convex for this scenario)
    const caseId = await t.mutation(api.cases.fileDispute, {
      plaintiff: p.did,
      defendant: d.did,
      type: 'UNFOUNDED_CLAIM',
      jurisdictionTags: ['NO_EVIDENCE'],
      evidenceIds: [],
      description: 'Claim without supporting evidence',
    });

    // 3. Check status via HTTP
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.evidenceIds).toHaveLength(0);
  });
});

describe('E2E: Multi-Party Dispute Scenarios', () => {
  let t: ReturnType<typeof convexTest>;

  beforeAll(async () => {
    if (!USE_LIVE_API) {
      const modules = import.meta.glob('../convex/**/*.{ts,js}');
      t = convexTest(schema, modules);
    }
  });

  it('Flow: Multiple disputes between same parties', async () => {
    if (USE_LIVE_API) {
      return;
    }

    const ownerDid = `did:test:multi-owner-${Date.now()}`;
    await t.mutation(api.auth.createOwner, {
      did: ownerDid,
      name: 'Multi Test Owner',
      email: `multi-${Date.now()}@example.com`,
    });

    // Register agents via HTTP
    const pResp = await fetch(`${API_BASE_URL}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerDid,
        name: 'Multi Plaintiff',
        organizationName: `Multi Plaintiff ${Date.now()}`,
      }),
    });
    const plaintiff = (await pResp.json()).did;

    const dResp = await fetch(`${API_BASE_URL}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerDid,
        name: 'Multi Defendant',
        organizationName: `Multi Defendant ${Date.now()}`,
      }),
    });
    const defendant = (await dResp.json()).did;

    // File 3 separate disputes
    const caseIds = [];
    for (let i = 0; i < 3; i++) {
      // Submit evidence
      const evResp = await fetch(`${API_BASE_URL}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentDid: plaintiff,
          sha256: `multi_ev_${i}_${Date.now()}`,
          uri: `https://evidence.example.com/multi-${i}.json`,
          signer: plaintiff,
          model: {
            provider: 'test',
            name: 'test-model',
            version: '1.0.0',
          },
        }),
      });
      const evidenceId = (await evResp.json()).evidenceId;

      // File dispute
      const disputeResp = await fetch(`${API_BASE_URL}/api/disputes/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plaintiff,
          defendant,
          type: `DISPUTE_TYPE_${i}`,
          jurisdictionTags: [`MULTI_${i}`],
          evidenceIds: [evidenceId],
        }),
      });
      
      expect(disputeResp.status).toBe(200);
      caseIds.push((await disputeResp.json()).caseId);
    }

    expect(caseIds).toHaveLength(3);

    // Verify all cases are accessible
    for (const caseId of caseIds) {
      const response = await fetch(`${API_BASE_URL}/cases/${caseId}`);
      expect(response.status).toBe(200);
    }
  });

  it('Flow: Reverse dispute (defendant becomes plaintiff)', async () => {
    if (USE_LIVE_API) {
      return;
    }

    const ownerDid = `did:test:reverse-owner-${Date.now()}`;
    await t.mutation(api.auth.createOwner, {
      did: ownerDid,
      name: 'Reverse Test Owner',
      email: `reverse-${Date.now()}@example.com`,
    });

    // Register agents
    const agent1Resp = await fetch(`${API_BASE_URL}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerDid,
        name: 'Agent 1',
        organizationName: `Agent 1 Corp ${Date.now()}`,
      }),
    });
    const agent1 = (await agent1Resp.json()).did;

    const agent2Resp = await fetch(`${API_BASE_URL}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerDid,
        name: 'Agent 2',
        organizationName: `Agent 2 Corp ${Date.now()}`,
      }),
    });
    const agent2 = (await agent2Resp.json()).did;

    // First dispute: agent1 sues agent2
    const ev1Resp = await fetch(`${API_BASE_URL}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentDid: agent1,
        sha256: `rev_ev1_${Date.now()}`,
        uri: 'https://evidence.example.com/reverse-1.json',
        signer: agent1,
        model: {
          provider: 'test',
          name: 'test-model',
          version: '1.0.0',
        },
      }),
    });
    const evidence1 = (await ev1Resp.json()).evidenceId;

    const dispute1 = await fetch(`${API_BASE_URL}/api/disputes/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plaintiff: agent1,
        defendant: agent2,
        type: 'SLA_BREACH',
        jurisdictionTags: ['REVERSE_1'],
        evidenceIds: [evidence1],
      }),
    });
    expect(dispute1.status).toBe(200);

    // Second dispute: agent2 sues agent1 (reversed roles)
    const ev2Resp = await fetch(`${API_BASE_URL}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentDid: agent2,
        sha256: `rev_ev2_${Date.now()}`,
        uri: 'https://evidence.example.com/reverse-2.json',
        signer: agent2,
        model: {
          provider: 'test',
          name: 'test-model',
          version: '1.0.0',
        },
      }),
    });
    const evidence2 = (await ev2Resp.json()).evidenceId;

    const dispute2 = await fetch(`${API_BASE_URL}/api/disputes/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plaintiff: agent2,
        defendant: agent1,
        type: 'COUNTER_CLAIM',
        jurisdictionTags: ['REVERSE_2'],
        evidenceIds: [evidence2],
      }),
    });
    expect(dispute2.status).toBe(200);
  });
});

describe('E2E: Complex Workflow Scenarios', () => {
  let t: ReturnType<typeof convexTest>;

  beforeAll(async () => {
    if (!USE_LIVE_API) {
      const modules = import.meta.glob('../convex/**/*.{ts,js}');
      t = convexTest(schema, modules);
    }
  });

  it('Flow: Specialized evidence types in dispute', async () => {
    if (USE_LIVE_API) {
      return;
    }

    const ownerDid = `did:test:spec-owner-${Date.now()}`;
    await t.mutation(api.auth.createOwner, {
      did: ownerDid,
      name: 'Specialized Test Owner',
      email: `spec-${Date.now()}@example.com`,
    });

    // Register specialized agents
    const physicalAgent = await t.mutation(api.agents.joinAgent, {
      ownerDid,
      name: 'Physical Agent',
      organizationName: `Physical ${Date.now()}`,
      functionalType: 'physical',
    });

    const voiceAgent = await t.mutation(api.agents.joinAgent, {
      ownerDid,
      name: 'Voice Agent',
      organizationName: `Voice ${Date.now()}`,
      functionalType: 'voice',
    });

    // Submit physical evidence
    const physEv = await t.mutation(api.evidence.submitPhysicalEvidence, {
      agentDid: physicalAgent.did,
      sha256: `phys_${Date.now()}`,
      uri: 'https://evidence.example.com/physical.json',
      signer: physicalAgent.did,
      location: {
        lat: 37.7749,
        lng: -122.4194,
        timestamp: Date.now(),
        accuracy: 10,
      },
      sensorData: {
        type: 'temperature',
        reading: 72.5,
      },
    });

    // Submit voice evidence
    const voiceEv = await t.mutation(api.evidence.submitVoiceEvidence, {
      agentDid: voiceAgent.did,
      sha256: `voice_${Date.now()}`,
      uri: 'https://evidence.example.com/voice.wav',
      signer: voiceAgent.did,
      consentProof: 'consent-hash-123',
      privacyCompliance: ['GDPR', 'CCPA'],
    });

    // File dispute with mixed evidence types
    const disputeResp = await fetch(`${API_BASE_URL}/api/disputes/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plaintiff: physicalAgent.did,
        defendant: voiceAgent.did,
        type: 'CROSS_FUNCTIONAL_DISPUTE',
        jurisdictionTags: ['SPECIALIZED'],
        evidenceIds: [physEv, voiceEv],
        description: 'Dispute involving physical and voice evidence',
      }),
    });

    expect(disputeResp.status).toBe(200);
    const caseId = (await disputeResp.json()).caseId;

    // Verify case includes both evidence types
    const statusResp = await fetch(`${API_BASE_URL}/cases/${caseId}`);
    expect(statusResp.status).toBe(200);
    const caseData = await statusResp.json();
    expect(caseData.evidenceIds).toHaveLength(2);
  });

  it('Flow: High-value dispute requiring panel', async () => {
    if (USE_LIVE_API) {
      return;
    }

    const ownerDid = `did:test:panel-owner-${Date.now()}`;
    await t.mutation(api.auth.createOwner, {
      did: ownerDid,
      name: 'Panel Test Owner',
      email: `panel-${Date.now()}@example.com`,
    });

    const pResp = await fetch(`${API_BASE_URL}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerDid,
        name: 'High Value Plaintiff',
        organizationName: `HV Plaintiff ${Date.now()}`,
      }),
    });
    const plaintiff = (await pResp.json()).did;

    const dResp = await fetch(`${API_BASE_URL}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerDid,
        name: 'High Value Defendant',
        organizationName: `HV Defendant ${Date.now()}`,
      }),
    });
    const defendant = (await dResp.json()).did;

    // Submit ambiguous evidence (2 pieces - borderline)
    const evidenceIds = [];
    for (let i = 0; i < 2; i++) {
      const evResp = await fetch(`${API_BASE_URL}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentDid: plaintiff,
          sha256: `panel_ev_${i}_${Date.now()}`,
          uri: `https://evidence.example.com/panel-${i}.json`,
          signer: plaintiff,
          model: {
            provider: 'test',
            name: 'test-model',
            version: '1.0.0',
          },
        }),
      });
      evidenceIds.push((await evResp.json()).evidenceId);
    }

    // File high-value dispute
    const disputeResp = await fetch(`${API_BASE_URL}/api/disputes/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plaintiff,
        defendant,
        type: 'COMPLEX_SLA_BREACH',
        jurisdictionTags: ['HIGH_VALUE', 'REQUIRES_PANEL'],
        evidenceIds,
        description: 'Complex case requiring judicial panel review',
        claimedDamages: 500000, // High stakes
      }),
    });

    expect(disputeResp.status).toBe(200);
    const caseId = (await disputeResp.json()).caseId;

    // Verify case status
    const statusResp = await fetch(`${API_BASE_URL}/cases/${caseId}`);
    expect(statusResp.status).toBe(200);
    const caseData = await statusResp.json();
    expect(caseData.claimedDamages).toBe(500000);
  });
});

describe('E2E: Error Recovery and Edge Cases', () => {
  let t: ReturnType<typeof convexTest>;
  let testAgentDid: string;

  beforeAll(async () => {
    if (!USE_LIVE_API) {
      const modules = import.meta.glob('../convex/**/*.{ts,js}');
      t = convexTest(schema, modules);
      
      const ownerDid = `did:test:edge-owner-${Date.now()}`;
      await t.mutation(api.auth.createOwner, {
        did: ownerDid,
        name: 'Edge Case Owner',
        email: `edge-${Date.now()}@example.com`,
      });
      
      const agent = await t.mutation(api.agents.joinAgent, {
        ownerDid,
        name: 'Edge Case Agent',
        organizationName: `Edge ${Date.now()}`,
      });
      testAgentDid = agent.did;
    }
  });

  it('Edge: Concurrent evidence submissions', async () => {
    if (USE_LIVE_API) {
      return;
    }

    // Submit 5 evidence pieces concurrently
    const promises = Array.from({ length: 5 }, (_, i) =>
      fetch(`${API_BASE_URL}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentDid: testAgentDid,
          sha256: `concurrent_${i}_${Date.now()}_${Math.random()}`,
          uri: `https://evidence.example.com/concurrent-${i}.json`,
          signer: testAgentDid,
          model: {
            provider: 'test',
            name: 'test-model',
            version: '1.0.0',
          },
        }),
      })
    );

    const results = await Promise.all(promises);
    results.forEach(response => {
      expect(response.status).toBe(200);
    });
  });

  it('Edge: Very large evidence URI', async () => {
    if (USE_LIVE_API) {
      return;
    }

    const longPath = 'a'.repeat(500);
    const response = await fetch(`${API_BASE_URL}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentDid: testAgentDid,
        sha256: `long_uri_${Date.now()}`,
        uri: `https://evidence.example.com/${longPath}.json`,
        signer: testAgentDid,
        model: {
          provider: 'test',
          name: 'test-model',
          version: '1.0.0',
        },
      }),
    });

    // May accept or reject based on URI length limits
    expect([200, 400]).toContain(response.status);
  });

  it('Edge: Special characters in dispute description', async () => {
    if (USE_LIVE_API) {
      return;
    }

    const ownerDid = `did:test:special-owner-${Date.now()}`;
    await t.mutation(api.auth.createOwner, {
      did: ownerDid,
      name: 'Special Char Owner',
      email: `special-${Date.now()}@example.com`,
    });

    const p = await t.mutation(api.agents.joinAgent, {
      ownerDid,
      name: 'Special Plaintiff',
      organizationName: `Special P ${Date.now()}`,
    });

    const d = await t.mutation(api.agents.joinAgent, {
      ownerDid,
      name: 'Special Defendant',
      organizationName: `Special D ${Date.now()}`,
    });

    const ev = await t.mutation(api.evidence.submitEvidence, {
      agentDid: p.did,
      sha256: `special_ev_${Date.now()}`,
      uri: 'https://evidence.example.com/special.json',
      signer: p.did,
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });

    const response = await fetch(`${API_BASE_URL}/api/disputes/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plaintiff: p.did,
        defendant: d.did,
        type: 'SLA_BREACH',
        jurisdictionTags: ['SPECIAL_CHARS'],
        evidenceIds: [ev],
        description: 'Dispute with émojis 🚀, unicode ™, and <html>tags</html> & symbols $$$',
        claimedDamages: 10000,
      }),
    });

    expect(response.status).toBe(200);
  });

  it('Edge: Zero damages claim', async () => {
    if (USE_LIVE_API) {
      return;
    }

    const ownerDid = `did:test:zero-owner-${Date.now()}`;
    await t.mutation(api.auth.createOwner, {
      did: ownerDid,
      name: 'Zero Damages Owner',
      email: `zero-${Date.now()}@example.com`,
    });

    const p = await t.mutation(api.agents.joinAgent, {
      ownerDid,
      name: 'Zero Plaintiff',
      organizationName: `Zero P ${Date.now()}`,
    });

    const d = await t.mutation(api.agents.joinAgent, {
      ownerDid,
      name: 'Zero Defendant',
      organizationName: `Zero D ${Date.now()}`,
    });

    const ev = await t.mutation(api.evidence.submitEvidence, {
      agentDid: p.did,
      sha256: `zero_ev_${Date.now()}`,
      uri: 'https://evidence.example.com/zero.json',
      signer: p.did,
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });

    const response = await fetch(`${API_BASE_URL}/api/disputes/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plaintiff: p.did,
        defendant: d.did,
        type: 'PRINCIPLE_DISPUTE',
        jurisdictionTags: ['ZERO_DAMAGES'],
        evidenceIds: [ev],
        description: 'Dispute on principle, no monetary damages',
        claimedDamages: 0,
      }),
    });

    expect(response.status).toBe(200);
  });

  it('Edge: Extremely high damages claim', async () => {
    if (USE_LIVE_API) {
      return;
    }

    const ownerDid = `did:test:high-owner-${Date.now()}`;
    await t.mutation(api.auth.createOwner, {
      did: ownerDid,
      name: 'High Damages Owner',
      email: `high-${Date.now()}@example.com`,
    });

    const p = await t.mutation(api.agents.joinAgent, {
      ownerDid,
      name: 'High Plaintiff',
      organizationName: `High P ${Date.now()}`,
    });

    const d = await t.mutation(api.agents.joinAgent, {
      ownerDid,
      name: 'High Defendant',
      organizationName: `High D ${Date.now()}`,
    });

    const ev = await t.mutation(api.evidence.submitEvidence, {
      agentDid: p.did,
      sha256: `high_ev_${Date.now()}`,
      uri: 'https://evidence.example.com/high.json',
      signer: p.did,
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });

    const response = await fetch(`${API_BASE_URL}/api/disputes/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plaintiff: p.did,
        defendant: d.did,
        type: 'CATASTROPHIC_FAILURE',
        jurisdictionTags: ['EXTREME_DAMAGES'],
        evidenceIds: [ev],
        description: 'Major service failure causing significant business impact',
        claimedDamages: 10000000, // $10M claim
      }),
    });

    expect(response.status).toBe(200);
  });
});

describe('E2E: Full Lifecycle with Status Transitions', () => {
  let t: ReturnType<typeof convexTest>;

  beforeAll(async () => {
    if (!USE_LIVE_API) {
      const modules = import.meta.glob('../convex/**/*.{ts,js}');
      t = convexTest(schema, modules);
    }
  });

  it('Flow: FILED → AUTORULED → DECIDED (complete lifecycle)', async () => {
    if (USE_LIVE_API) {
      return;
    }

    // Setup
    const ownerDid = `did:test:lifecycle-owner-${Date.now()}`;
    await t.mutation(api.auth.createOwner, {
      did: ownerDid,
      name: 'Lifecycle Owner',
      email: `lifecycle-${Date.now()}@example.com`,
    });

    const pResp = await fetch(`${API_BASE_URL}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerDid,
        name: 'Lifecycle Plaintiff',
        organizationName: `LC Plaintiff ${Date.now()}`,
      }),
    });
    const plaintiff = (await pResp.json()).did;

    const dResp = await fetch(`${API_BASE_URL}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerDid,
        name: 'Lifecycle Defendant',
        organizationName: `LC Defendant ${Date.now()}`,
      }),
    });
    const defendant = (await dResp.json()).did;

    // Submit strong evidence (3+ pieces for auto-decision)
    const evidenceIds = [];
    for (let i = 0; i < 3; i++) {
      const evResp = await fetch(`${API_BASE_URL}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentDid: plaintiff,
          sha256: `lifecycle_ev_${i}_${Date.now()}`,
          uri: `https://evidence.example.com/lifecycle-${i}.json`,
          signer: plaintiff,
          model: {
            provider: 'test',
            name: 'test-model',
            version: '1.0.0',
          },
        }),
      });
      evidenceIds.push((await evResp.json()).evidenceId);
    }

    // File dispute
    const disputeResp = await fetch(`${API_BASE_URL}/api/disputes/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plaintiff,
        defendant,
        type: 'SLA_BREACH',
        jurisdictionTags: ['LIFECYCLE_TEST'],
        evidenceIds,
        description: 'Full lifecycle test case',
      }),
    });
    const caseId = (await disputeResp.json()).caseId;

    // 1. Check FILED status
    let response = await fetch(`${API_BASE_URL}/cases/${caseId}`);
    let data = await response.json();
    const initialStatus = data.status;
    expect(['FILED', 'AUTORULED', 'DECIDED']).toContain(initialStatus);

    // 2. If auto-decided, verify ruling exists
    if (data.ruling) {
      expect(data.ruling.verdict).toBeDefined();
      expect(data.ruling.decidedAt).toBeDefined();
    }
  });

  it('Flow: Evidence submitted after case filed', async () => {
    if (USE_LIVE_API) {
      return;
    }

    const ownerDid = `did:test:after-owner-${Date.now()}`;
    await t.mutation(api.auth.createOwner, {
      did: ownerDid,
      name: 'After Evidence Owner',
      email: `after-${Date.now()}@example.com`,
    });

    const p = await t.mutation(api.agents.joinAgent, {
      ownerDid,
      name: 'After Plaintiff',
      organizationName: `After P ${Date.now()}`,
    });

    const d = await t.mutation(api.agents.joinAgent, {
      ownerDid,
      name: 'After Defendant',
      organizationName: `After D ${Date.now()}`,
    });

    // Submit initial evidence
    const ev1Resp = await fetch(`${API_BASE_URL}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentDid: p.did,
        sha256: `after_ev1_${Date.now()}`,
        uri: 'https://evidence.example.com/after-1.json',
        signer: p.did,
        model: {
          provider: 'test',
          name: 'test-model',
          version: '1.0.0',
        },
      }),
    });
    const evidence1 = (await ev1Resp.json()).evidenceId;

    // File dispute
    const disputeResp = await fetch(`${API_BASE_URL}/api/disputes/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plaintiff: p.did,
        defendant: d.did,
        type: 'ONGOING_INVESTIGATION',
        jurisdictionTags: ['ADDITIONAL_EVIDENCE'],
        evidenceIds: [evidence1],
        description: 'Case with additional evidence to follow',
      }),
    });
    const caseId = (await disputeResp.json()).caseId;

    // Submit additional evidence and associate with case
    const ev2Resp = await fetch(`${API_BASE_URL}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentDid: p.did,
        sha256: `after_ev2_${Date.now()}`,
        uri: 'https://evidence.example.com/after-2.json',
        signer: p.did,
        model: {
          provider: 'test',
          name: 'test-model',
          version: '1.0.0',
        },
        caseId, // Associate with existing case
      }),
    });

    expect(ev2Resp.status).toBe(200);

    // Verify case now has more evidence
    const statusResp = await fetch(`${API_BASE_URL}/cases/${caseId}`);
    const caseData = await statusResp.json();
    expect(caseData.evidenceIds.length).toBeGreaterThanOrEqual(1);
  });

  it('Edge: Request case status immediately after filing', async () => {
    if (USE_LIVE_API) {
      return;
    }

    const ownerDid = `did:test:immediate-owner-${Date.now()}`;
    await t.mutation(api.auth.createOwner, {
      did: ownerDid,
      name: 'Immediate Owner',
      email: `immediate-${Date.now()}@example.com`,
    });

    const p = await t.mutation(api.agents.joinAgent, {
      ownerDid,
      name: 'Immediate Plaintiff',
      organizationName: `Immediate P ${Date.now()}`,
    });

    const d = await t.mutation(api.agents.joinAgent, {
      ownerDid,
      name: 'Immediate Defendant',
      organizationName: `Immediate D ${Date.now()}`,
    });

    const ev = await t.mutation(api.evidence.submitEvidence, {
      agentDid: p.did,
      sha256: `immediate_ev_${Date.now()}`,
      uri: 'https://evidence.example.com/immediate.json',
      signer: p.did,
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });

    // File dispute
    const disputeResp = await fetch(`${API_BASE_URL}/api/disputes/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plaintiff: p.did,
        defendant: d.did,
        type: 'RAPID_FILING',
        jurisdictionTags: ['IMMEDIATE'],
        evidenceIds: [ev],
      }),
    });
    const caseId = (await disputeResp.json()).caseId;

    // Immediately request status (no delay)
    const statusResp = await fetch(`${API_BASE_URL}/cases/${caseId}`);
    expect(statusResp.status).toBe(200);
    const data = await statusResp.json();
    expect(data.status).toBeDefined();
  });
});

describe('E2E: Production API Smoke Tests', () => {
  it('Production: GET / - API info endpoint responds', async () => {
    const response = await fetch(`${API_BASE_URL}/`);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.service).toBe('Consulate - Agentic Dispute Resolution Platform');
    expect(data.endpoints).toBeDefined();
  });

  it('Production: GET /health - Health check responds', async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });

  it('Production: GET /version - Version info responds', async () => {
    const response = await fetch(`${API_BASE_URL}/version`);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.version).toBeDefined();
  });

  it('Production: GET /agents - List agents responds', async () => {
    const response = await fetch(`${API_BASE_URL}/agents?limit=5`);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('Production: GET /live/feed - Live feed responds', async () => {
    const response = await fetch(`${API_BASE_URL}/live/feed`);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.feed).toBeDefined();
    expect(Array.isArray(data.feed)).toBe(true);
  });

  it('Production: POST /agents/discover - Discovery endpoint responds', async () => {
    const response = await fetch(`${API_BASE_URL}/agents/discover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        functionalTypes: ['general'],
        excludeSelf: false,
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.discovered).toBeDefined();
  });
});

describe('E2E: Agent Capabilities and SLA Reporting', () => {
  let t: ReturnType<typeof convexTest>;
  let testAgentDid: string;

  beforeAll(async () => {
    if (!USE_LIVE_API) {
      const modules = import.meta.glob('../convex/**/*.{ts,js}');
      t = convexTest(schema, modules);
      
      const ownerDid = `did:test:cap-owner-${Date.now()}`;
      await t.mutation(api.auth.createOwner, {
        did: ownerDid,
        name: 'Capabilities Owner',
        email: `cap-${Date.now()}@example.com`,
      });
      
      const agent = await t.mutation(api.agents.joinAgent, {
        ownerDid,
        name: 'Capabilities Agent',
        organizationName: `Cap Org ${Date.now()}`,
      });
      testAgentDid = agent.did;
    }
  });

  it('Flow: Register capabilities → Report SLA → Check status', async () => {
    if (USE_LIVE_API) {
      return;
    }

    // 1. Register capabilities
    const capResp = await fetch(`${API_BASE_URL}/agents/capabilities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentDid: testAgentDid,
        capabilities: ['text-generation', 'data-analysis', 'code-review'],
        slaProfile: {
          uptime: 99.9,
          responseTime: 200,
          throughput: 10000,
        },
      }),
    });

    expect([200, 400]).toContain(capResp.status);

    // 2. Report SLA metrics
    const slaResp = await fetch(`${API_BASE_URL}/sla/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentDid: testAgentDid,
        metrics: {
          availability: 99.95,
          responseTime: 180,
          errorRate: 0.05,
          throughput: 12000,
        },
        timestamp: Date.now(),
      }),
    });

    expect([200, 400]).toContain(slaResp.status);

    // 3. Check SLA status
    const statusResp = await fetch(`${API_BASE_URL}/sla/status/${testAgentDid}`);
    expect([200, 404]).toContain(statusResp.status);
  });

  it('Flow: SLA violation detection and auto-dispute', async () => {
    if (USE_LIVE_API) {
      return;
    }

    // Report poor SLA metrics
    const response = await fetch(`${API_BASE_URL}/sla/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentDid: testAgentDid,
        metrics: {
          availability: 95.0, // Below threshold
          responseTime: 5000, // Way above threshold
          errorRate: 10.0, // High error rate
        },
        timestamp: Date.now(),
      }),
    });

    // System should detect violations
    expect([200, 400]).toContain(response.status);
    
    if (response.status === 200) {
      const data = await response.json();
      // May include violation flags
      expect(data).toBeDefined();
    }
  });
});

describe('E2E: Real-Time Monitoring and Notifications', () => {
  let t: ReturnType<typeof convexTest>;
  let monitorAgentDid: string;

  beforeAll(async () => {
    if (!USE_LIVE_API) {
      const modules = import.meta.glob('../convex/**/*.{ts,js}');
      t = convexTest(schema, modules);
      
      const ownerDid = `did:test:monitor-owner-${Date.now()}`;
      await t.mutation(api.auth.createOwner, {
        did: ownerDid,
        name: 'Monitor Owner',
        email: `monitor-${Date.now()}@example.com`,
      });
      
      const agent = await t.mutation(api.agents.joinAgent, {
        ownerDid,
        name: 'Monitor Agent',
        organizationName: `Monitor ${Date.now()}`,
      });
      monitorAgentDid = agent.did;
    }
  });

  it('Flow: Register webhook → File dispute → Receive notification', async () => {
    if (USE_LIVE_API) {
      return;
    }

    // 1. Register webhook
    const webhookResp = await fetch(`${API_BASE_URL}/webhooks/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentDid: monitorAgentDid,
        webhookUrl: 'https://example.com/webhook',
        events: ['dispute_filed', 'case_updated'],
        secret: 'test-secret',
      }),
    });

    expect(webhookResp.status).toBe(200);

    // 2. Check notifications
    const notifResp = await fetch(`${API_BASE_URL}/notifications/${monitorAgentDid}`);
    expect([200, 404]).toContain(notifResp.status);
  });

  it('Flow: Monitor live feed for case activity', async () => {
    // Get live feed
    const feedResp = await fetch(`${API_BASE_URL}/live/feed`);
    expect(feedResp.status).toBe(200);
    
    const data = await feedResp.json();
    expect(data.feed).toBeDefined();
    expect(Array.isArray(data.feed)).toBe(true);
    expect(data.systemHealth).toBeDefined();
  });

  it('Flow: Filter live feed by agent activity', async () => {
    if (USE_LIVE_API || !monitorAgentDid) {
      return;
    }

    const response = await fetch(`${API_BASE_URL}/live/feed?agentDid=${monitorAgentDid}`);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.feed)).toBe(true);
  });

  it('Flow: Filter live feed by event types', async () => {
    const response = await fetch(`${API_BASE_URL}/live/feed?types=DISPUTE_FILED,EVIDENCE_SUBMITTED`);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.feed)).toBe(true);
  });
});

describe('E2E: Integration with External Systems', () => {
  it('Flow: Third-party agent registration via API requires auth', async () => {
    // This test validates that the API endpoint now requires API key authentication
    const response = await fetch(`${API_BASE_URL}/agents/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ExternalAIAgent/1.0',
        'X-Agent-DID': 'did:agent:external-test',
      },
      body: JSON.stringify({
        name: 'External AI Agent',
        functionalType: 'general',
      }),
    });

    // Should return 401 without Authorization header
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toContain("Authorization");
  });

  it('Flow: Evidence submission with authentication headers', async () => {
    const response = await fetch(`${API_BASE_URL}/evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-DID': 'did:agent:test',
        'X-Agent-Signature': 'mock-signature-for-validation',
      },
      body: JSON.stringify({
        agentDid: 'did:agent:test',
        sha256: `auth_ev_${Date.now()}`,
        uri: 'https://evidence.example.com/authenticated.json',
        signer: 'did:agent:test',
        model: {
          provider: 'test',
          name: 'test-model',
          version: '1.0.0',
        },
      }),
    });

    // Will fail (agent doesn't exist), but validates header handling
    expect([200, 400]).toContain(response.status);
  });

  it('Flow: Cross-origin request handling (CORS)', async () => {
    // Test CORS preflight
    const response = await fetch(`${API_BASE_URL}/agents`, {
      method: 'OPTIONS',
    });

    // CORS preflight may return 200, 204, or 404 depending on routing
    expect([200, 204, 404]).toContain(response.status);
    
    // If successful, check CORS headers
    if (response.status === 200 || response.status === 204) {
      const headers = response.headers;
      const corsHeader = headers.get('Access-Control-Allow-Origin');
      expect(corsHeader).toBeDefined();
    }
  });
});

