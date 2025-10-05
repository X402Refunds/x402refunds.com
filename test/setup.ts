// Test setup file - runs before all tests
// This file sets up the test environment for Convex functions

import { beforeAll, afterAll } from 'vitest';

// Global test configuration - removed ConvexTestingHelper due to import issues
// Each test will create its own ConvexTest instance

beforeAll(async () => {
  // Initialize test environment
  console.log('🧪 Setting up test environment...');
});

afterAll(async () => {
  // Clean up test environment
  console.log('🧹 Cleaning up test environment...');
});

// Common test utilities aligned with current schema
export const createTestAgent = () => ({
  ownerDid: `did:test:owner-${Date.now()}`,
  name: `TestAgent${Date.now()}`,
  organizationName: `Test Org ${Date.now()}`,
  mock: false, // false = real agent, true = test/demo data
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
