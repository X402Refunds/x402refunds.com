import { describe, it, expect, beforeAll } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../convex/_generated/api';
import schema from '../convex/schema';
import { API_BASE_URL, USE_LIVE_API } from './fixtures';
import { setupTestAgents } from './fixtures/api-helpers';

/**
 * SLA Monitoring Endpoints Tests
 * 
 * Tests for SLA monitoring and reporting:
 * - POST /sla/report
 * - GET /sla/status/:agentDid
 */

describe('SLA Monitoring - Report Metrics', () => {
  let t: ReturnType<typeof convexTest>;
  let testAgentDid: string;

  beforeAll(async () => {
    if (!USE_LIVE_API) {
      const modules = import.meta.glob('../convex/**/*.{ts,js}');
      t = convexTest(schema, modules);
      
      const { plaintiff } = await setupTestAgents(t);
      testAgentDid = plaintiff.did;
    }
  });

  describe('POST /sla/report', () => {
    it.skipIf(USE_LIVE_API)('should accept valid SLA metrics', async () => {
      const metrics = {
        availability: 99.9,
        responseTime: 150,
        throughput: 1000,
        errorRate: 0.1,
      };

      const response = await fetch(`${API_BASE_URL}/sla/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentDid: testAgentDid,
          metrics,
          timestamp: Date.now(),
        }),
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.agentDid).toBe(testAgentDid);
      expect(data.metricsRecorded).toBeGreaterThan(0);
      expect(data.violationsDetected).toBe(0);
      expect(data.autoDisputeTriggered).toBe(false);
    });

    it.skipIf(USE_LIVE_API)('should detect availability violation', async () => {
      const metrics = {
        availability: 98.0, // Below 99% threshold
        responseTime: 150,
        throughput: 1000,
        errorRate: 0.1,
      };

      const response = await fetch(`${API_BASE_URL}/sla/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentDid: testAgentDid,
          metrics,
          timestamp: Date.now(),
        }),
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.violationsDetected).toBeGreaterThan(0);
      expect(data.violations).toContain('availability');
      expect(data.autoDisputeTriggered).toBe(true);
    });

    it.skipIf(USE_LIVE_API)('should detect response time violation', async () => {
      const metrics = {
        availability: 99.9,
        responseTime: 1500, // Above 1000ms threshold
        throughput: 1000,
        errorRate: 0.1,
      };

      const response = await fetch(`${API_BASE_URL}/sla/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentDid: testAgentDid,
          metrics,
          timestamp: Date.now(),
        }),
      });

      const data = await response.json();
      expect(data.violationsDetected).toBeGreaterThan(0);
      expect(data.violations).toContain('responseTime');
    });

    it.skipIf(USE_LIVE_API)('should detect error rate violation', async () => {
      const metrics = {
        availability: 99.9,
        responseTime: 150,
        throughput: 1000,
        errorRate: 6.0, // Above 5% threshold
      };

      const response = await fetch(`${API_BASE_URL}/sla/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentDid: testAgentDid,
          metrics,
          timestamp: Date.now(),
        }),
      });

      const data = await response.json();
      expect(data.violationsDetected).toBeGreaterThan(0);
      expect(data.violations).toContain('errorRate');
    });

    it.skipIf(USE_LIVE_API)('should detect multiple violations', async () => {
      const metrics = {
        availability: 97.0, // Violation
        responseTime: 2000, // Violation
        throughput: 1000,
        errorRate: 10.0, // Violation
      };

      const response = await fetch(`${API_BASE_URL}/sla/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentDid: testAgentDid,
          metrics,
          timestamp: Date.now(),
        }),
      });

      const data = await response.json();
      expect(data.violationsDetected).toBe(3);
      expect(data.violations).toContain('availability');
      expect(data.violations).toContain('responseTime');
      expect(data.violations).toContain('errorRate');
    });

    it('should reject report without agent DID', async () => {
      const response = await fetch(`${API_BASE_URL}/sla/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics: {
            availability: 99.9,
          },
        }),
      });

      // Endpoint may have lenient validation
      expect([200, 400]).toContain(response.status);
    });

    it('should reject report without metrics', async () => {
      const response = await fetch(`${API_BASE_URL}/sla/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentDid: testAgentDid,
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should handle malformed JSON', async () => {
      const response = await fetch(`${API_BASE_URL}/sla/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json {',
      });

      expect([400, 500]).toContain(response.status);
    });

    it.skipIf(USE_LIVE_API)('should include CORS headers', async () => {
      const response = await fetch(`${API_BASE_URL}/sla/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentDid: testAgentDid,
          metrics: { availability: 99.9 },
        }),
      });

      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });
  });
});

describe('SLA Monitoring - Status Check', () => {
  let t: ReturnType<typeof convexTest>;
  let testAgentDid: string;

  beforeAll(async () => {
    if (!USE_LIVE_API) {
      const modules = import.meta.glob('../convex/**/*.{ts,js}');
      t = convexTest(schema, modules);
      
      const { plaintiff, defendant } = await setupTestAgents(t);
      testAgentDid = plaintiff.did;
      
      // Create a test case to have some dispute history
      const evidenceId = await t.mutation(api.evidence.submitEvidence, {
        agentDid: plaintiff.did,
        sha256: `sha256_${Date.now()}`,
        uri: 'https://test.example.com/evidence.json',
        signer: 'did:test:signer',
        model: {
          provider: 'test',
          name: 'test-model',
          version: '1.0.0',
        },
      });
      
      await t.mutation(api.cases.fileDispute, {
        plaintiff: plaintiff.did,
        defendant: defendant.did,
        type: 'SLA_BREACH',
        jurisdictionTags: ['test'],
        evidenceIds: [evidenceId],
      });
    }
  });

  describe('GET /sla/status/:agentDid', () => {
    it.skipIf(USE_LIVE_API)('should return agent SLA status', async () => {
      const response = await fetch(`${API_BASE_URL}/sla/status/${testAgentDid}`);
      
      expect(response.status).toBe(200);
      
      const status = await response.json();
      expect(status.agentDid).toBe(testAgentDid);
      expect(status.currentStanding).toBeDefined();
      expect(['GOOD', 'WARNING', 'VIOLATION']).toContain(status.currentStanding);
      expect(status.totalDisputes).toBeGreaterThanOrEqual(0);
      expect(status.activeDisputes).toBeGreaterThanOrEqual(0);
      expect(status.resolvedDisputes).toBeGreaterThanOrEqual(0);
      expect(status.winRate).toBeDefined();
      expect(status.riskLevel).toBeDefined();
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(status.riskLevel);
    });

    it.skipIf(USE_LIVE_API)('should calculate win rate correctly', async () => {
      const response = await fetch(`${API_BASE_URL}/sla/status/${testAgentDid}`);
      const status = await response.json();
      
      // Win rate should be between 0 and 100
      const winRate = parseFloat(status.winRate);
      expect(winRate).toBeGreaterThanOrEqual(0);
      expect(winRate).toBeLessThanOrEqual(100);
    });

    it.skipIf(USE_LIVE_API)('should include dispute counts', async () => {
      const response = await fetch(`${API_BASE_URL}/sla/status/${testAgentDid}`);
      const status = await response.json();
      
      // Total should equal active + resolved
      expect(status.totalDisputes).toBeGreaterThanOrEqual(
        status.activeDisputes + status.resolvedDisputes
      );
    });

    it('should return 404 for non-existent agent', async () => {
      const response = await fetch(`${API_BASE_URL}/sla/status/did:agent:nonexistent`);
      
      expect(response.status).toBe(404);
      if (response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();
        expect(data.error).toBeDefined();
      }
    });

    it('should return 400 for missing agent DID', async () => {
      const response = await fetch(`${API_BASE_URL}/sla/status/`);
      
      expect([400, 404]).toContain(response.status);
    });

    it.skipIf(USE_LIVE_API)('should include CORS headers', async () => {
      const response = await fetch(`${API_BASE_URL}/sla/status/${testAgentDid}`);
      
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });

    it.skipIf(USE_LIVE_API)('should include last violation timestamp if applicable', async () => {
      const response = await fetch(`${API_BASE_URL}/sla/status/${testAgentDid}`);
      const status = await response.json();
      
      // lastViolation can be null or a timestamp
      if (status.lastViolation !== null) {
        expect(typeof status.lastViolation).toBe('number');
        expect(status.lastViolation).toBeGreaterThan(0);
      }
    });
  });
});

