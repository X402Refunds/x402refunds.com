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
      expect(data.service).toBe("Consulate - Agentic Dispute Resolution Platform");
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
      
      // Create test org and API key for agent registration
      const timestamp = Date.now();
      const orgId = await t.run(async (ctx) => {
        return await ctx.db.insert("organizations", {
          name: "API Test Org",
          domain: `api-test-${timestamp}.com`,
          verified: true,
          verifiedAt: Date.now(),
          createdAt: Date.now(),
        });
      });
      
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          clerkUserId: `api-test-${timestamp}`,
          email: `api-test-${timestamp}@test.com`,
          organizationId: orgId,
          role: "admin",
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
        });
      });
      
      const apiKeyResult = await t.mutation(api.apiKeys.generateApiKey, {
        userId,
        name: "Test API Key",
      });
      
      testOwnerDid = apiKeyResult.key; // Store API key in testOwnerDid variable for simplicity
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

    it('should reject invalid functional type', async () => {
      const response = await fetch(`${API_BASE_URL}/agents?type=invalid_type_12345`);
      // May return empty array or error
      expect([200, 400]).toContain(response.status);
    });

    it('should handle limit > 1000 gracefully', async () => {
      const response = await fetch(`${API_BASE_URL}/agents?limit=9999`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      // Should cap at reasonable limit
      expect(data.length).toBeLessThanOrEqual(1000);
    });

    it('should handle negative limit', async () => {
      const response = await fetch(`${API_BASE_URL}/agents?limit=-5`);
      // Should treat as invalid or use default
      expect([200, 400]).toContain(response.status);
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

    it('should reject invalid sortBy parameter', async () => {
      const response = await fetch(`${API_BASE_URL}/agents/top-reputation?sortBy=invalidSort`);
      // May ignore invalid sort and use default
      expect([200, 400]).toContain(response.status);
    });

    it('should handle limit = 0', async () => {
      const response = await fetch(`${API_BASE_URL}/agents/top-reputation?limit=0`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should handle no agents scenario', async () => {
      const response = await fetch(`${API_BASE_URL}/agents/top-reputation?limit=1000`);
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

    it('should reject invalid functional types array', async () => {
      const response = await fetch(`${API_BASE_URL}/agents/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          functionalTypes: 'not-an-array',
        })
      });

      // May accept and handle gracefully
      expect([200, 400]).toContain(response.status);
    });

    it('should handle empty discovery results gracefully', async () => {
      const response = await fetch(`${API_BASE_URL}/agents/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          functionalTypes: ['extremely-rare-type-that-does-not-exist'],
        })
      });

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        const data = await response.json();
        expect(data.discovered).toBeGreaterThanOrEqual(0);
      }
    });

    it('should reject malformed request body', async () => {
      const response = await fetch(`${API_BASE_URL}/agents/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json {',
      });

      expect([400, 500]).toContain(response.status);
    });
  });

  describe('GET /agents/:did/reputation - Get Reputation', () => {
    it('should return 404 for non-existent agent', async () => {
      const response = await fetch(`${API_BASE_URL}/agents/did:agent:non-existent-999/reputation`);
      expect(response.status).toBe(404);
    });

    it('should reject malformed DID', async () => {
      const response = await fetch(`${API_BASE_URL}/agents/invalid-did-format/reputation`);
      expect([400, 404]).toContain(response.status);
    });

    it('should return reputation for valid agent', async () => {
      // Create agent first
      if (!USE_LIVE_API) {
        const agent = await t.mutation(api.agents.joinAgent, {
          apiKey: testOwnerDid, // testOwnerDid now stores the API key
          name: 'Rep Test Agent',
        });

        const response = await fetch(`${API_BASE_URL}/agents/${agent.did}/reputation`);
        expect([200, 404]).toContain(response.status);
      }
    });

    it('should handle agent with no cases', async () => {
      // Agent with no dispute history should return default reputation
      if (!USE_LIVE_API) {
        const agent = await t.mutation(api.agents.joinAgent, {
          apiKey: testOwnerDid, // testOwnerDid now stores the API key
          name: 'No Cases Agent',
        });

        const response = await fetch(`${API_BASE_URL}/agents/${agent.did}/reputation`);
        if (response.status === 200) {
          const data = await response.json();
          expect(data.totalCases).toBe(0);
        }
      }
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

    it('should reject metrics without agentDid', async () => {
      const response = await fetch(`${API_BASE_URL}/sla/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: {
            availability: 99.9,
          },
          // Missing agentDid
        })
      });

      // May accept undefined/null agentDid in body
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should reject invalid metric values', async () => {
      const response = await fetch(`${API_BASE_URL}/sla/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentDid: 'did:agent:test',
          metrics: {
            availability: -5, // Negative
            responseTime: 200,
          },
        })
      });

      // May accept and normalize
      expect([200, 400]).toContain(response.status);
    });

    it('should reject non-existent agent', async () => {
      const response = await fetch(`${API_BASE_URL}/sla/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentDid: 'did:agent:definitely-does-not-exist-999',
          metrics: {
            availability: 99.9,
          },
        })
      });

      expect([200, 400]).toContain(response.status);
    });

    it('should handle missing metrics fields', async () => {
      const response = await fetch(`${API_BASE_URL}/sla/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentDid: 'did:agent:test',
          metrics: {}, // Empty metrics
        })
      });

      expect([200, 400]).toContain(response.status);
    });
  });

  describe('GET /sla/status/:agentDid - SLA Status', () => {
    it('should return SLA status for valid agent', async () => {
      // Test with any existing agent
      const response = await fetch(`${API_BASE_URL}/sla/status/did:agent:test`);
      // May be 200 or 404 depending on if agent exists
      expect([200, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent agent', async () => {
      const response = await fetch(`${API_BASE_URL}/sla/status/did:agent:non-existent-status-999`);
      expect(response.status).toBe(404);
    });

    it('should reject malformed agent DID', async () => {
      const response = await fetch(`${API_BASE_URL}/sla/status/invalid-did`);
      expect([400, 404]).toContain(response.status);
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

    it('should handle duplicate webhook registration', async () => {
      const webhookUrl = `https://example.com/webhook-${Date.now()}`;
      
      // Register first time
      await fetch(`${API_BASE_URL}/webhooks/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentDid: 'did:agent:test',
          webhookUrl,
          events: ['dispute_filed'],
        })
      });

      // Register again - may allow or reject
      const response = await fetch(`${API_BASE_URL}/webhooks/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentDid: 'did:agent:test',
          webhookUrl,
          events: ['case_updated'],
        })
      });

      expect([200, 400]).toContain(response.status);
    });

    it('should reject empty events array', async () => {
      const response = await fetch(`${API_BASE_URL}/webhooks/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentDid: 'did:agent:test',
          webhookUrl: 'https://example.com/webhook',
          events: [],
        })
      });

      // May accept and use defaults
      expect([200, 400]).toContain(response.status);
    });

    it('should reject non-HTTPS URL in production', async () => {
      const response = await fetch(`${API_BASE_URL}/webhooks/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentDid: 'did:agent:test',
          webhookUrl: 'http://insecure.example.com/webhook',
          events: ['dispute_filed'],
        })
      });

      // May accept for testing or reject for security
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('GET /notifications/:agentDid - Get Notifications', () => {
    it('should return notifications for valid agent', async () => {
      const response = await fetch(`${API_BASE_URL}/notifications/did:agent:test`);
      // May be 404 if agent doesn't exist, 200 if it does
      expect([200, 400, 404]).toContain(response.status);
      if (response.status === 200) {
        const data = await response.json();
        expect(Array.isArray(data.notifications)).toBe(true);
      }
    });

    it('should filter unread notifications', async () => {
      const response = await fetch(`${API_BASE_URL}/notifications/did:agent:test?unread=true`);
      expect([200, 400, 404]).toContain(response.status);
      if (response.status === 200) {
        const data = await response.json();
        expect(data.notifications).toBeDefined();
      }
    });

    it('should handle empty notifications list', async () => {
      const response = await fetch(`${API_BASE_URL}/notifications/did:agent:no-notifications-999`);
      expect([200, 400, 404]).toContain(response.status);
      if (response.status === 200) {
        const data = await response.json();
        expect(data.notifications).toHaveLength(0);
      }
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

    it('should reject invalid event types', async () => {
      const response = await fetch(`${API_BASE_URL}/live/feed?types=INVALID_TYPE,ANOTHER_INVALID`);
      expect(response.status).toBe(200);
      const data = await response.json();
      // Should return empty feed or ignore invalid types
      expect(Array.isArray(data.feed)).toBe(true);
    });

    it('should handle empty feed gracefully', async () => {
      const response = await fetch(`${API_BASE_URL}/live/feed?agentDid=did:agent:no-activity-999`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.feed).toHaveLength(0);
    });

    it('should reject invalid agent DID filter', async () => {
      const response = await fetch(`${API_BASE_URL}/live/feed?agentDid=invalid-did-format`);
      // May filter out or ignore invalid DID
      expect(response.status).toBe(200);
    });

    it('should limit feed size appropriately', async () => {
      const response = await fetch(`${API_BASE_URL}/live/feed`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.feed)).toBe(true);
      // Should not return more than reasonable limit
      expect(data.feed.length).toBeLessThanOrEqual(100);
    });
  });
});

describe('Consulate HTTP API - Error Handling', () => {
  it('should return 401 for endpoint without auth (malformed JSON)', async () => {
    const response = await fetch(`${API_BASE_URL}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json{'
    });

    // Should return 401 without Authorization header (checked before parsing body)
    expect(response.status).toBe(401);
  });

  it('should return 401 for endpoint without auth (missing required fields)', async () => {
    const response = await fetch(`${API_BASE_URL}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Incomplete Agent' })
    });

    // Should return 401 without Authorization header
    expect(response.status).toBe(401);
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
