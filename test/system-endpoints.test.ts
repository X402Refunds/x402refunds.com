import { describe, it, expect, beforeAll } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../convex/_generated/api';
import schema from '../convex/schema';
import { API_BASE_URL, USE_LIVE_API } from './fixtures';
import { setupTestAgents, createTestCase } from './fixtures/api-helpers';

/**
 * System & Discovery Endpoints Tests
 * 
 * Tests for system health, discovery, and monitoring:
 * - GET /health
 * - GET /version
 * - GET /
 * - POST /agents/discover
 * - GET /agents/top-reputation
 * - GET /live/feed
 */

describe('System - Health & Info', () => {
  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await fetch(`${API_BASE_URL}/health`);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
      
      const data = await response.json();
      expect(data.status).toBe('healthy');
      expect(data.timestamp).toBeGreaterThan(0);
      expect(data.service).toBe('x402disputes');
    });

    it('should respond quickly', async () => {
      const start = Date.now();
      const response = await fetch(`${API_BASE_URL}/health`);
      const duration = Date.now() - start;
      
      expect(response.status).toBe(200);
      // Health check should be fast (< 1 second)
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('GET /version', () => {
    it('should return version information', async () => {
      const response = await fetch(`${API_BASE_URL}/version`);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.version).toBeDefined();
      expect(data.version).toMatch(/^\d+\.\d+\.\d+$/); // Semver format
      expect(data.build).toBeDefined();
      expect(data.timestamp).toBeGreaterThan(0);
    });
  });

  describe('GET /', () => {
    it('should return platform information', async () => {
      const response = await fetch(`${API_BASE_URL}/`);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.service).toContain('x402disputes');
      expect(data.version).toBeDefined();
      expect(data.status).toBe('operational');
      expect(data.endpoints).toBeDefined();
    });

    it('should list available endpoints', async () => {
      const response = await fetch(`${API_BASE_URL}/`);
      const data = await response.json();
      
      const endpoints = data.endpoints;
      expect(endpoints.health).toBeDefined();
      expect(endpoints.register).toBeDefined();
      expect(endpoints.evidence).toBeDefined();
      expect(endpoints.disputes).toBeDefined();
      expect(endpoints.sla_report).toBeDefined();
      expect(endpoints.live_feed).toBeDefined();
    });

    it('should include integration information', async () => {
      const response = await fetch(`${API_BASE_URL}/`);
      const data = await response.json();
      
      expect(data.integration).toBeDefined();
      expect(data.integration.mcp).toBeDefined();
    });

    it('should include documentation link', async () => {
      const response = await fetch(`${API_BASE_URL}/`);
      const data = await response.json();
      
      expect(data.documentation).toBeDefined();
      expect(data.documentation).toContain('http');
    });
  });
});

describe('Agent Discovery', () => {
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

  describe('POST /agents/discover', () => {
    it.skipIf(USE_LIVE_API)('should discover agents by functional type', async () => {
      const response = await fetch(`${API_BASE_URL}/agents/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          functionalTypes: ['general'],
        }),
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.discovered).toBeGreaterThanOrEqual(0);
      expect(data.agents).toBeDefined();
      expect(Array.isArray(data.agents)).toBe(true);
      expect(data.timestamp).toBeGreaterThan(0);
    });

    it.skipIf(USE_LIVE_API)('should filter by capabilities', async () => {
      const response = await fetch(`${API_BASE_URL}/agents/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          capabilities: ['data-processing'],
          functionalTypes: ['api'],
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      // All returned agents should match the functional type
      if (data.agents.length > 0) {
        const allMatch = data.agents.every(
          (agent: any) => agent.functionalType === 'api'
        );
        expect(allMatch).toBe(true);
      }
    });

    it.skipIf(USE_LIVE_API)('should exclude self when requested', async () => {
      const response = await fetch(`${API_BASE_URL}/agents/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          functionalTypes: ['general'],
          excludeSelf: true,
          agentDid: testAgentDid,
        }),
      });

      const data = await response.json();
      
      // Self should not be in results
      const selfIncluded = data.agents.some(
        (agent: any) => agent.did === testAgentDid
      );
      expect(selfIncluded).toBe(false);
    });

    it.skipIf(USE_LIVE_API)('should include agent details in results', async () => {
      const response = await fetch(`${API_BASE_URL}/agents/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          functionalTypes: ['general'],
        }),
      });

      const data = await response.json();
      
      if (data.agents.length > 0) {
        const agent = data.agents[0];
        expect(agent.did).toBeDefined();
        expect(agent.functionalType).toBeDefined();
        expect(agent.capabilities).toBeDefined();
        expect(agent.endpoint).toBeDefined();
        expect(agent.status).toBeDefined();
      }
    });

    it('should handle empty capability filter', async () => {
      const response = await fetch(`${API_BASE_URL}/agents/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          capabilities: [],
          functionalTypes: ['general'],
        }),
      });

      expect(response.status).toBe(200);
    });

    it.skipIf(USE_LIVE_API)('should include CORS headers', async () => {
      const response = await fetch(`${API_BASE_URL}/agents/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          functionalTypes: ['general'],
        }),
      });

      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });
  });

  describe('GET /agents/top-reputation', () => {
    it('should return top agents by reputation', async () => {
      const response = await fetch(`${API_BASE_URL}/agents/top-reputation`);
      
      expect(response.status).toBe(200);
      
      const agents = await response.json();
      expect(Array.isArray(agents)).toBe(true);
    });

    it('should limit results', async () => {
      const limit = 5;
      const response = await fetch(`${API_BASE_URL}/agents/top-reputation?limit=${limit}`);
      
      const agents = await response.json();
      expect(agents.length).toBeLessThanOrEqual(limit);
    });

    it('should sort by overall score by default', async () => {
      const response = await fetch(`${API_BASE_URL}/agents/top-reputation?limit=10`);
      const agents = await response.json();
      
      if (agents.length > 1) {
        // Check descending order (reputationScore is now at top level)
        for (let i = 1; i < agents.length; i++) {
          expect(agents[i - 1].reputationScore).toBeGreaterThanOrEqual(
            agents[i].reputationScore
          );
        }
      }
    });

    it('should support sorting by win rate', async () => {
      const response = await fetch(`${API_BASE_URL}/agents/top-reputation?sortBy=winRate&limit=10`);
      
      expect(response.status).toBe(200);
      const agents = await response.json();
      
      if (agents.length > 1) {
        // Check descending order by win rate (winRate is now at top level)
        for (let i = 1; i < agents.length; i++) {
          expect(agents[i - 1].winRate).toBeGreaterThanOrEqual(
            agents[i].winRate
          );
        }
      }
    });

    it('should include reputation details', async () => {
      const response = await fetch(`${API_BASE_URL}/agents/top-reputation?limit=1`);
      const agents = await response.json();
      
      if (agents.length > 0) {
        const agent = agents[0];
        expect(agent.agentDid).toBeDefined();
        expect(agent.reputationScore).toBeDefined();
        expect(agent.reputationScore).toBeGreaterThanOrEqual(0);
        expect(agent.casesAsDefendant).toBeDefined();
        expect(agent.casesAsDefendant).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

describe('Live Monitoring', () => {
  let t: ReturnType<typeof convexTest>;
  let testAgentDid: string;

  beforeAll(async () => {
    if (!USE_LIVE_API) {
      const modules = import.meta.glob('../convex/**/*.{ts,js}');
      t = convexTest(schema, modules);
      
      const { plaintiff, defendant } = await setupTestAgents(t);
      testAgentDid = plaintiff.did;
      
      // Create some activity
      await createTestCase(t, plaintiff.did, defendant.did);
    }
  });

  describe('GET /live/feed', () => {
    it('should return live activity feed', async () => {
      const response = await fetch(`${API_BASE_URL}/live/feed`);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.feed).toBeDefined();
      expect(Array.isArray(data.feed)).toBe(true);
      expect(data.lastUpdate).toBeGreaterThan(0);
      expect(data.systemHealth).toBeDefined();
      expect(['OPERATIONAL', 'DEGRADED', 'DOWN']).toContain(data.systemHealth);
    });

    it('should include event details', async () => {
      const response = await fetch(`${API_BASE_URL}/live/feed`);
      const data = await response.json();
      
      if (data.feed.length > 0) {
        const event = data.feed[0];
        expect(event.id).toBeDefined();
        expect(event.type).toBeDefined();
        expect(event.message).toBeDefined();
        expect(event.timestamp).toBeGreaterThan(0);
        expect(event.participants).toBeDefined();
        expect(Array.isArray(event.participants)).toBe(true);
        expect(event.impact).toBeDefined();
        expect(['financial', 'operational', 'legal', 'informational']).toContain(event.impact);
      }
    });

    it.skipIf(USE_LIVE_API)('should filter by agent DID', async () => {
      const response = await fetch(`${API_BASE_URL}/live/feed?agentDid=${testAgentDid}`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      // All events should involve the specified agent
      if (data.feed.length > 0) {
        const allRelevant = data.feed.every(
          (event: any) => event.participants.includes(testAgentDid)
        );
        expect(allRelevant).toBe(true);
      }
    });

    it('should filter by event types', async () => {
      const eventTypes = 'DISPUTE_FILED,CASE_STATUS_UPDATED';
      const response = await fetch(`${API_BASE_URL}/live/feed?types=${eventTypes}`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      // All events should match requested types
      if (data.feed.length > 0) {
        const allowedTypes = eventTypes.split(',');
        const allMatch = data.feed.every(
          (event: any) => allowedTypes.includes(event.type)
        );
        expect(allMatch).toBe(true);
      }
    });

    it('should format event messages correctly', async () => {
      const response = await fetch(`${API_BASE_URL}/live/feed`);
      const data = await response.json();
      
      // All events should have non-empty messages
      const allHaveMessages = data.feed.every(
        (event: any) => event.message && event.message.length > 0
      );
      expect(allHaveMessages).toBe(true);
    });

    it('should include case IDs for relevant events', async () => {
      const response = await fetch(`${API_BASE_URL}/live/feed`);
      const data = await response.json();
      
      // Events related to cases should have caseId
      const caseEvents = data.feed.filter(
        (event: any) => event.type.includes('CASE') || event.type.includes('DISPUTE')
      );
      
      if (caseEvents.length > 0) {
        // At least some should have caseId
        const someCaseIds = caseEvents.some(
          (event: any) => event.caseId !== null
        );
        expect(someCaseIds).toBe(true);
      }
    });

    it('should categorize event impact', async () => {
      const response = await fetch(`${API_BASE_URL}/live/feed`);
      const data = await response.json();
      
      const validImpacts = ['financial', 'operational', 'legal', 'informational'];
      const allValidImpacts = data.feed.every(
        (event: any) => validImpacts.includes(event.impact)
      );
      expect(allValidImpacts).toBe(true);
    });

    it('should include CORS headers', async () => {
      const response = await fetch(`${API_BASE_URL}/live/feed`);
      
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });

    it('should sort events by timestamp descending', async () => {
      const response = await fetch(`${API_BASE_URL}/live/feed`);
      const data = await response.json();
      
      if (data.feed.length > 1) {
        // Events should be newest first
        for (let i = 1; i < data.feed.length; i++) {
          expect(data.feed[i - 1].timestamp).toBeGreaterThanOrEqual(
            data.feed[i].timestamp
          );
        }
      }
    });

    it('should limit feed to reasonable size', async () => {
      const response = await fetch(`${API_BASE_URL}/live/feed`);
      const data = await response.json();
      
      // Should not return too many events (limit should be ~20)
      expect(data.feed.length).toBeLessThanOrEqual(50);
    });
  });
});

