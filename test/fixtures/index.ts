// Test fixtures and utilities for comprehensive test coverage

export const createTestOwner = (suffix = Date.now()) => ({
  did: `did:test:owner-${suffix}`,
  name: `Test Owner ${suffix}`,
  email: `test-${suffix}@example.com`,
});

export const createTestAgent = (ownerDid: string, suffix = Date.now()) => ({
  ownerDid,
  name: `Test Agent ${suffix}`,
  organizationName: `Test Org ${suffix}`,
  mock: false,
  functionalType: 'general' as const,
});

export const createTestEvidence = (agentDid: string, suffix = Date.now()) => ({
  agentDid,
  sha256: `sha256_${suffix}_${Math.random().toString(36).substring(7)}`,
  uri: `https://test.example.com/evidence/${suffix}.json`,
  signer: `did:test:signer-${suffix}`,
  model: {
    provider: 'test-provider',
    name: 'test-model',
    version: '1.0.0',
  },
});

export const createTestCase = (plaintiff: string, defendant: string, evidenceIds: any[]) => ({
  plaintiff,
  defendant,
  type: 'SLA_BREACH',
  jurisdictionTags: ['AI_AGENTS', 'TEST'],
  evidenceIds,
  description: 'Test case for SLA violation',
  claimedDamages: 10000,
});

export const createTestJudge = (suffix = Date.now()) => ({
  name: `Test Judge ${suffix}`,
  type: 'HUMAN' as const,
  email: `judge-${suffix}@consulate.test`,
  qualifications: ['Test Certification'],
});

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const API_BASE_URL = process.env.API_BASE_URL || 'https://api.consulatehq.com';
export const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'https://consulatehq.com';
// USE_LIVE_API is true when testing against production (default), false when explicitly targeting test env
export const USE_LIVE_API = !process.env.API_BASE_URL || API_BASE_URL.includes('consulatehq.com') || API_BASE_URL.includes('convex.site');

