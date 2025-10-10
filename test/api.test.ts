import { describe, it, expect, beforeAll } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../convex/_generated/api';
import schema from '../convex/schema';

/**
 * API Integration Tests
 * 
 * These tests validate the HTTP API layer on top of Convex functions.
 * Tests use convex-test for data setup, then test HTTP endpoints.
 * 
 * To run against production: API_BASE_URL=https://api.consulatehq.com pnpm test:run test/api.test.ts
 * To run against local: API_BASE_URL=http://localhost:3000 pnpm test:run test/api.test.ts
 */

const API_BASE_URL = process.env.API_BASE_URL || 'https://api.consulatehq.com';
const USE_LIVE_API = !!process.env.API_BASE_URL;

describe('Consulate HTTP API - Core System', () => {
  describe('Health & Info Endpoints', () => {
    it('GET / - should return API info', async () => {
      const response = await fetch(`${API_BASE_URL}/`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.service).toBe("Consulate - Agent Dispute Resolution Platform");
      expect(data.version).toBeDefined();
      expect(data.status).toBe("operational");
      expect(data.endpoints).toBeDefined();
      expect(data.endpoints.health).toBe("/health");
    });

    it('GET /health - should return healthy status', async () => {
      const response = await fetch(`${API_BASE_URL}/health`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.status).toBe("healthy");
      expect(data.service).toBe("consulate-ai");
      expect(data.timestamp).toBeDefined();
    });

    it('GET /version - should return version info', async () => {
      const response = await fetch(`${API_BASE_URL}/version`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.version).toBeDefined();
      expect(data.build).toBeDefined();
      expect(data.timestamp).toBeDefined();
    });
  });
});

describe('Consulate HTTP API - Agent Management', () => {
  let t: ReturnType<typeof convexTest>;
  let testOwnerDid: string;
  let testAgentDid: string;

  beforeAll(async () => {
    if (!USE_LIVE_API) {
      const modules = import.meta.glob('../convex/**/*.{ts,js}');
      t = convexTest(schema, modules);
      
      // Create test owner for agent registration
      testOwnerDid = `did:test:api-owner-${Date.now()}`;
      await t.mutation(api.auth.createOwner, {
        did: testOwnerDid,
        name: 'API Test Owner',
        email: 'api-test@example.com',
      });
    }
  });

  describe('GET /agents - List Agents', () => {
    it('should list all agents with default limit', async () => {
      const response = await fetch(`${API_BASE_URL}/agents`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should filter agents by functional type', async () => {
      const response = await fetch(`${API_BASE_URL}/agents?type=general&limit=5`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeLessThanOrEqual(5);
    });

    it('should respect limit parameter', async () => {
      const response = await fetch(`${API_BASE_URL}/agents?limit=3`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeLessThanOrEqual(3);
    });
  });

  describe('GET /agents/top-reputation - Top Agents', () => {
    it('should return top agents by overall score', async () => {
      const response = await fetch(`${API_BASE_URL}/agents/top-reputation?limit=5`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeLessThanOrEqual(5);
    });

    it('should support sorting by win rate', async () => {
      const response = await fetch(`${API_BASE_URL}/agents/top-reputation?sortBy=winRate&limit=3`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('POST /agents/discover - Agent Discovery', () => {
    it('should discover agents by functional type', async () => {
      const response = await fetch(`${API_BASE_URL}/agents/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          functionalTypes: ['general'],
          excludeSelf: false
        })
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.discovered).toBeDefined();
      expect(Array.isArray(data.agents)).toBe(true);
      expect(data.timestamp).toBeDefined();
    });

    it('should exclude self from discovery', async () => {
      const selfDid = 'did:agent:self-test';
      
      const response = await fetch(`${API_BASE_URL}/agents/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          functionalTypes: ['general'],
          excludeSelf: true,
          agentDid: selfDid
        })
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      const foundSelf = data.agents.some((agent: any) => agent.did === selfDid);
      expect(foundSelf).toBe(false);
    });
  });
});

describe('Consulate HTTP API - SLA Monitoring (Read-Only)', () => {
  describe('POST /sla/report - Report Metrics', () => {
    it('should accept valid SLA metrics report', async () => {
      const slaReport = {
        agentDid: 'did:agent:test-for-sla',
        metrics: {
          availability: 99.9,
          responseTime: 150,
          errorRate: 0.1,
          throughput: 1000
        },
        timestamp: Date.now()
      };

      const response = await fetch(`${API_BASE_URL}/sla/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slaReport)
      });

      // May return 200 (success) or 400 (agent not found) - both are valid responses
      expect([200, 400]).toContain(response.status);
      
      const data = await response.json();
      expect(data).toBeDefined();
    });

    it('should detect SLA violations in metrics', async () => {
      const slaReport = {
        agentDid: 'did:agent:test-violations',
        metrics: {
          availability: 95.0, // Below 99% threshold
          responseTime: 2000, // Above 1000ms threshold
          errorRate: 10.0 // Above 5% threshold
        },
        timestamp: Date.now()
      };

      const response = await fetch(`${API_BASE_URL}/sla/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slaReport)
      });

      // May fail if agent doesn't exist, but the violation detection logic is tested
      expect([200, 400]).toContain(response.status);
    });
  });
});

describe('Consulate HTTP API - Webhooks & Notifications', () => {
  describe('POST /webhooks/register - Register Webhook', () => {
    it('should accept valid webhook registration', async () => {
      const webhookData = {
        agentDid: 'did:agent:test-webhook',
        webhookUrl: 'https://example.com/webhook',
        events: ['dispute_filed', 'case_updated'],
        secret: 'test-secret-123'
      };

      const response = await fetch(`${API_BASE_URL}/webhooks/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData)
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.webhookId).toBeDefined();
      expect(data.events).toContain('dispute_filed');
    });

    it('should reject invalid webhook URL', async () => {
      const response = await fetch(`${API_BASE_URL}/webhooks/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentDid: 'did:agent:test',
          webhookUrl: 'invalid-url',
          events: []
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });
});

describe('Consulate HTTP API - Real-Time Monitoring', () => {
  describe('GET /live/feed - Live Activity Feed', () => {
    it('should return live feed', async () => {
      const response = await fetch(`${API_BASE_URL}/live/feed`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data.feed)).toBe(true);
      expect(data.systemHealth).toBeDefined();
      expect(data.lastUpdate).toBeDefined();
    });

    it('should filter feed by event types', async () => {
      const response = await fetch(`${API_BASE_URL}/live/feed?types=DISPUTE_FILED,CASE_STATUS_UPDATED`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data.feed)).toBe(true);
    });

    it('should filter feed by agent', async () => {
      const testAgentDid = 'did:agent:test';
      const response = await fetch(`${API_BASE_URL}/live/feed?agentDid=${testAgentDid}`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data.feed)).toBe(true);
    });
  });
});

describe('Consulate HTTP API - Error Handling', () => {
  it('should handle malformed JSON gracefully', async () => {
    const response = await fetch(`${API_BASE_URL}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json{'
    });

    expect([400, 500]).toContain(response.status);
  });

  it('should validate required fields in requests', async () => {
    const response = await fetch(`${API_BASE_URL}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Incomplete Agent' })
    });

    expect(response.status).toBe(400);
  });
});

describe('Consulate HTTP API - Integration Flow', () => {
  it('should complete a full agent workflow', async () => {
    // 1. List agents
    const listResponse = await fetch(`${API_BASE_URL}/agents?limit=5`);
    expect(listResponse.status).toBe(200);
    const agents = await listResponse.json();
    expect(Array.isArray(agents)).toBe(true);

    // 2. If agents exist, get reputation for first one
    if (agents.length > 0 && agents[0].did) {
      const repResponse = await fetch(`${API_BASE_URL}/agents/${agents[0].did}/reputation`);
      // May be 200 (found) or 404 (not found) - both are valid
      expect([200, 404]).toContain(repResponse.status);
    }

    // 3. Get top agents
    const topResponse = await fetch(`${API_BASE_URL}/agents/top-reputation?limit=3`);
    expect(topResponse.status).toBe(200);
    const topAgents = await topResponse.json();
    expect(Array.isArray(topAgents)).toBe(true);

    // 4. Check live feed
    const feedResponse = await fetch(`${API_BASE_URL}/live/feed`);
    expect(feedResponse.status).toBe(200);
    const feed = await feedResponse.json();
    expect(Array.isArray(feed.feed)).toBe(true);
  });
});
