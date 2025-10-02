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

// Common test utilities
export const createTestAgent = () => ({
  ownerDid: `did:test:owner-${Date.now()}`,
  name: `TestAgent${Date.now()}`,
  organizationName: 'Test Organization',
  mock: false, // Test agents are real agents by default
  functionalType: 'general' as const,
});

export const createTestEvidence = () => ({
  sha256: `sha256_${Date.now()}`,
  uri: `https://test.example.com/evidence_${Date.now()}`,
  metadata: {
    contentType: 'application/json',
    size: 1024,
    timestamp: new Date().toISOString(),
  },
});

export const createTestCase = (parties: string[]) => ({
  parties,
  type: 'SLA_MISS' as const,
  description: 'Test case for SLA violation',
  jurisdiction: 'AI_AGENTS' as const,
  metadata: {
    severity: 'medium',
    automated: true,
  },
});
