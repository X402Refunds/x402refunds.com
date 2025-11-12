import { describe, it, expect, afterAll } from 'vitest';
import { API_BASE_URL, USE_LIVE_API } from './fixtures';
import { cleanupTestDataDirect } from './fixtures/test-cleanup-helper';

/**
 * HTTP Endpoint Tests - Pure HTTP Testing (No Hybrid Approach)
 *
 * Tests for critical HTTP endpoints:
 * - POST /agents/register
 * - POST /evidence
 * - POST /api/disputes/agent (formerly /disputes)
 * - POST /api/disputes/payment
 * - GET /cases/:caseId
 * - POST /agents/capabilities
 *
 * IMPORTANT: These are pure HTTP tests that validate error responses and input validation.
 * They do NOT use convex-test (in-memory database) because that creates a separate database
 * from the deployed HTTP endpoints. All tests hit real HTTP endpoints directly.
 *
 * Tests focus on:
 * - Missing required fields (400 errors)
 * - Invalid input formats (400 errors)
 * - Non-existent resources (404 errors)
 * - Authentication failures (401 errors)
 */

describe('HTTP API - Agent Registration', () => {
  // Pure HTTP tests - validate public key registration

  describe('POST /agents/register', () => {
    it('should require public key', async () => {
      const agentData = {
        name: 'HTTP Test Agent',
        organizationName: 'Test Org',
        // Missing publicKey
      };

      const response = await fetch(`${API_BASE_URL}/agents/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData),
      });

      // Should return 400 for missing required field
      expect(response.status).toBe(400);
    });

    it('should require organization name', async () => {
      const response = await fetch(`${API_BASE_URL}/agents/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Agent',
          publicKey: 'dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk',
          // Missing organizationName
        }),
      });

      // Should return 400 for missing required field
      expect(response.status).toBe(400);
    });
  });
});

describe('HTTP API - Evidence Submission', () => {
  // Pure HTTP tests - validate error responses without test data

  describe('POST /evidence', () => {
    it('should reject evidence without hash', async () => {
      const response = await fetch(`${API_BASE_URL}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentDid: 'did:agent:test-nonexistent',
          uri: 'https://test.example.com/evidence.json',
          signer: 'did:test:signer',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should reject evidence without signature', async () => {
      const response = await fetch(`${API_BASE_URL}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentDid: 'did:agent:test',
          sha256: `sha256_${Date.now()}`,
          uri: 'https://test.example.com/evidence.json',
          // Missing signer
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should reject missing required fields', async () => {
      const response = await fetch(`${API_BASE_URL}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing all required fields
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should reject evidence for non-existent agent', async () => {
      const response = await fetch(`${API_BASE_URL}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentDid: 'did:agent:nonexistent-99999',
          sha256: `sha256_${Date.now()}`,
          uri: 'https://test.example.com/evidence.json',
          signer: 'did:test:signer',
          model: {
            provider: 'test',
            name: 'test-model',
            version: '1.0.0',
          },
        }),
      });

      // Should fail due to non-existent agent
      expect([400, 404]).toContain(response.status);
    });

    it('should reject invalid JSON', async () => {
      const response = await fetch(`${API_BASE_URL}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      // Should return 400 or 500 depending on how error is handled
      expect([400, 500]).toContain(response.status);
    });
  });
});

describe('HTTP API - Dispute Filing', () => {
  // Pure HTTP tests - validate error responses and input validation without test data

  describe('POST /api/disputes/agent', () => {
    it('should reject missing required fields', async () => {
      const response = await fetch(`${API_BASE_URL}/api/disputes/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plaintiff: 'did:test:nonexistent-plaintiff',
          // Missing defendant and other required fields
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should reject dispute with empty type', async () => {
      const response = await fetch(`${API_BASE_URL}/disputes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plaintiff: 'did:test:plaintiff',
          defendant: 'did:test:defendant',
          type: '',
          jurisdictionTags: ['test'],
          evidenceIds: [],
        }),
      });

      // Should return 400 or 404 depending on route existence
      expect([400, 404]).toContain(response.status);
    });

    it('should reject invalid JSON', async () => {
      const response = await fetch(`${API_BASE_URL}/disputes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{',
      });

      // Should return 400 or 404 depending on route handling
      expect([400, 404]).toContain(response.status);
    });

    it('should reject non-existent agents', async () => {
      const response = await fetch(`${API_BASE_URL}/disputes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plaintiff: 'did:test:nonexistent-12345',
          defendant: 'did:test:nonexistent-67890',
          type: 'SLA_BREACH',
          jurisdictionTags: ['test'],
          evidenceIds: [],
        }),
      });

      // Should fail due to non-existent agents
      expect([400, 404]).toContain(response.status);
    });
  });
});

describe('HTTP API - Case Status', () => {
  // Pure HTTP tests - validate error responses without test data

  describe('GET /cases/:caseId', () => {
    it('should return 404 for non-existent case', async () => {
      const response = await fetch(`${API_BASE_URL}/cases/k9999999999`);

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid case ID format', async () => {
      const response = await fetch(`${API_BASE_URL}/cases/invalid-id-format`);

      expect([400, 404]).toContain(response.status);
    });

    it('should return 404 for empty case ID', async () => {
      const response = await fetch(`${API_BASE_URL}/cases/`);

      // May redirect or return 404
      expect([404, 301, 302]).toContain(response.status);
    });
  });
});

describe('HTTP API - Agent Capabilities', () => {
  // Pure HTTP tests - validate error responses without test data

  describe('POST /agents/capabilities', () => {
    it('should reject invalid agent DID', async () => {
      const response = await fetch(`${API_BASE_URL}/agents/capabilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentDid: 'did:agent:nonexistent-12345',
          capabilities: ['test'],
        }),
      });

      expect([400, 404]).toContain(response.status);
    });

    it('should reject missing required fields', async () => {
      const response = await fetch(`${API_BASE_URL}/agents/capabilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing agentDid
          capabilities: ['test'],
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should reject malformed capabilities (not array)', async () => {
      const response = await fetch(`${API_BASE_URL}/agents/capabilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentDid: 'did:agent:test',
          capabilities: 'not-an-array',
        }),
      });

      expect([400, 404]).toContain(response.status);
    });

    it('should reject invalid JSON', async () => {
      const response = await fetch(`${API_BASE_URL}/agents/capabilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      // Should return 400 or 500 depending on how error is handled
      expect([400, 500]).toContain(response.status);
    });
  });
  
  afterAll(async () => {
    // Clean up any test data created (though these are mostly error tests)
    if (!USE_LIVE_API) {
      const convexUrl = API_BASE_URL.replace('.convex.site', '.convex.cloud');
      await cleanupTestDataDirect(convexUrl);
    }
  });
});

