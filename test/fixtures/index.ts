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
  isTestData: true,
  testRunId: suffix,
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
  isTestData: true,
  testRunId: Date.now(),
});

// MICRO-DISPUTE fixtures (under $1)
export const createMicroDispute = (plaintiff: string, defendant: string, suffix = Date.now()) => {
  const microAmounts = [0.02, 0.05, 0.10, 0.15, 0.25, 0.35, 0.50, 0.75, 0.95]; // Typical API call costs
  const disputeReasons = [
    'api_timeout',
    'rate_limit_breach',
    'service_not_rendered',
    'quality_issue',
    'amount_incorrect',
  ] as const;
  
  return {
    transactionId: `txn_${suffix}_${Math.random().toString(36).substring(7)}`,
    transactionHash: `0x${Math.random().toString(36).substring(2, 15)}`,
    amount: microAmounts[Math.floor(Math.random() * microAmounts.length)],
    currency: 'USD',
    paymentProtocol: Math.random() > 0.5 ? 'ACP' : 'ATXP',
    plaintiff,
    defendant,
    disputeReason: disputeReasons[Math.floor(Math.random() * disputeReasons.length)],
    description: 'Micro-transaction dispute for agentic commerce',
    evidenceUrls: [`https://logs.example.com/${suffix}.json`],
    isTestData: true,
    testRunId: suffix,
  };
};

export const createBatchMicroDisputes = (plaintiff: string, defendant: string, count: number) => {
  return Array.from({ length: count }, (_, i) => 
    createMicroDispute(plaintiff, defendant, Date.now() + i)
  );
};

export const createTestJudge = (suffix = Date.now()) => ({
  name: `Test Judge ${suffix}`,
  type: 'HUMAN' as const,
  email: `judge-${suffix}@consulate.test`,
  qualifications: ['Test Certification'],
});

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Default to PREVIEW environment for safety (youthful-orca-358)
// Only use production when explicitly set via API_BASE_URL env var
export const API_BASE_URL = process.env.API_BASE_URL || 'https://youthful-orca-358.convex.site';
export const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'https://youthful-orca-358.convex.site';
// USE_LIVE_API is true ONLY when explicitly testing against production (x402disputes.com)
// All other environments (dev, preview, youthful-orca) should run full test suite
export const USE_LIVE_API = !!process.env.API_BASE_URL && API_BASE_URL.includes('x402disputes.com');

