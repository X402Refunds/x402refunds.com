// Test setup file - runs before all tests
// This file sets up the test environment for Convex functions

import { beforeAll, afterAll } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../convex/_generated/api';
import type { ConvexTestingHelper } from 'convex-test';

// Global test configuration
beforeAll(async () => {
  console.log('🧪 Setting up test environment...');
});

afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
});

// Common test utilities aligned with current schema
export const createTestAgent = () => ({
  ownerDid: `did:test:owner-${Date.now()}`,
  name: `TestAgent${Date.now()}`,
  organizationName: `Test Org ${Date.now()}`,
  mock: false,
  functionalType: 'general' as const,
});

export const createTestEvidence = () => ({
  sha256: `sha256_${Date.now()}`,
  uri: `https://test.example.com/evidence/${Date.now()}.json`,
  signer: `did:test:signer-${Date.now()}`,
  model: {
    provider: 'test-provider',
    name: 'test-model',
    version: '1.0.0',
  },
});

export const createTestCase = (plaintiff: string, defendant: string) => ({
  plaintiff,
  defendant,
  type: 'SLA_BREACH',
  jurisdictionTags: ['AI_AGENTS', 'TEST'],
  evidenceIds: [] as any[],
  description: 'Test case for SLA violation',
});

// Enhanced test helpers for comprehensive testing

export async function createTestOwnerAndAgents(t: any, suffix = Date.now()) {
  const ownerDid = `did:test:owner-${suffix}`;
  
  // Create owner
  await t.mutation(api.auth.createOwner, {
    did: ownerDid,
    name: `Test Owner ${suffix}`,
    email: `test-${suffix}@example.com`,
  });
  
  // Create plaintiff agent
  const plaintiff = await t.mutation(api.agents.joinAgent, {
    ownerDid,
    name: `Plaintiff Agent ${suffix}`,
    organizationName: `Plaintiff Corp ${suffix}`,
    mock: false,
  });
  
  // Create defendant agent
  const defendant = await t.mutation(api.agents.joinAgent, {
    ownerDid,
    name: `Defendant Agent ${suffix}`,
    organizationName: `Defendant Corp ${suffix}`,
    mock: false,
  });
  
  return { ownerDid, plaintiff: plaintiff.did, defendant: defendant.did };
}

export async function createTestCaseWithEvidence(
  t: any,
  plaintiff: string,
  defendant: string,
  evidenceCount = 1
) {
  const evidenceIds = [];
  
  // Create evidence
  for (let i = 0; i < evidenceCount; i++) {
    const evidenceId = await t.mutation(api.evidence.submitEvidence, {
      agentDid: plaintiff,
      sha256: `sha256_${Date.now()}_${i}`,
      uri: `https://test.example.com/evidence-${i}.json`,
      signer: `did:test:signer-${Date.now()}`,
      model: {
        provider: 'test-provider',
        name: 'test-model',
        version: '1.0.0',
      },
    });
    evidenceIds.push(evidenceId);
  }
  
  // File case
  const caseId = await t.mutation(api.cases.fileDispute, {
    plaintiff,
    defendant,
    type: 'SLA_BREACH',
    jurisdictionTags: ['ai-service', 'sla', 'test'],
    evidenceIds,
    description: 'Test SLA breach case',
    claimedDamages: 10000,
  });
  
  return { caseId, evidenceIds };
}

export async function createTestJudgePanel(t: any, panelSize = 3) {
  const judges = [];
  
  for (let i = 0; i < panelSize; i++) {
    const judge = await t.mutation(api.judges.registerJudge, {
      did: `did:judge:panel-${i}-${Date.now()}-${Math.random()}`,
      name: `Test Judge ${i}`,
      specialties: ['SLA_BREACH', 'CONTRACT_DISPUTE'],
    });
    judges.push(judge);
  }
  
  return judges;
}

export function generateAuthToken(agentDid: string) {
  // Simple JWT-style token for testing
  const payload = {
    sub: agentDid,
    iat: Date.now(),
    exp: Date.now() + 3600000, // 1 hour
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export class PerformanceTimer {
  private startTime: number = 0;
  private endTime: number = 0;
  
  start() {
    this.startTime = performance.now();
  }
  
  stop() {
    this.endTime = performance.now();
    return this.duration();
  }
  
  duration() {
    return this.endTime - this.startTime;
  }
}
