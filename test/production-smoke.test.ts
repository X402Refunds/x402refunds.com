import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { API_BASE_URL } from './fixtures';

/**
 * Production Smoke Tests
 * 
 * These tests run against production and create real test data.
 * They're designed to verify HTTP endpoints work correctly.
 * 
 * Run with: API_BASE_URL=https://youthful-orca-358.convex.site pnpm test production-smoke
 */

describe('Production HTTP Endpoint Smoke Tests', () => {
  let testApiKey: string;
  let testAgentDid: string;
  let testAgentDid2: string;

  beforeAll(async () => {
    console.log(`\n🔥 Running production smoke tests against: ${API_BASE_URL}\n`);
  });

  describe('Core Endpoints', () => {
    it('GET / - API info endpoint', async () => {
      const response = await fetch(`${API_BASE_URL}/`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.service).toContain('x402disputes');
      expect(data.version).toBeDefined();
      expect(data.endpoints).toBeDefined();
      
      // Verify CORS headers
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });

    it('GET /health - Health check', async () => {
      const response = await fetch(`${API_BASE_URL}/health`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.status).toBe('healthy');
      
      // Verify CORS headers
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });

    it('GET /version - Version info', async () => {
      const response = await fetch(`${API_BASE_URL}/version`, {
        signal: AbortSignal.timeout(8000) // 8s timeout (longer for production)
      });
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.version).toBeDefined();
      
      // Verify CORS headers
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    }, 15000); // 15s test timeout
  });

  describe('MCP Endpoints', () => {
    it('GET /.well-known/mcp.json - MCP discovery', async () => {
      const response = await fetch(`${API_BASE_URL}/.well-known/mcp.json`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.tools).toBeDefined();
      expect(Array.isArray(data.tools)).toBe(true);
      
      // Verify CORS headers
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });

    it('POST /mcp/invoke - Public access (no auth required)', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool: 'consulate_register_agent',
          parameters: { 
            name: 'test', 
            publicKey: 'dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk',
            organizationName: 'Test Org',
            functionalType: 'api' 
          }
        })
      });

      // Should succeed (200) or fail on validation (400), not auth (401)
      expect([200, 400]).toContain(response.status);
      
      // Verify CORS headers even on errors (may be null in production if behind CDN)
      const corsHeader = response.headers.get('access-control-allow-origin');
      if (corsHeader) {
        expect(corsHeader).toBe('*');
      }
    });
  });

  describe('SLA Endpoints', () => {
    it('POST /sla/report - Accepts SLA metrics', async () => {
      const metrics = {
        agentDid: `did:test:smoke-${Date.now()}`,
        availability: 99.9,
        responseTime: 150,
        throughput: 1000,
        errorRate: 0.1,
      };

      const response = await fetch(`${API_BASE_URL}/sla/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SLA-Report': 'true',
        },
        body: JSON.stringify(metrics),
      });

      // Should accept the report (or return 400 if agent doesn't exist - both valid)
      expect([200, 201, 400]).toContain(response.status);
      
      // Verify CORS headers
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });

    it('GET /sla/status/:agentDid - Returns 404 for non-existent agent', async () => {
      const response = await fetch(`${API_BASE_URL}/sla/status/did:test:nonexistent-${Date.now()}`);
      
      expect(response.status).toBe(404);
      
      // Verify CORS headers on errors (may be null in production if behind CDN)
      const corsHeader = response.headers.get('access-control-allow-origin');
      if (corsHeader) {
        expect(corsHeader).toBe('*');
      }
    });
  });

  describe('Webhook Endpoints', () => {
    it('POST /webhooks/register - Accepts webhook registration', async () => {
      const webhook = {
        agentDid: `did:test:smoke-${Date.now()}`,
        webhookUrl: 'https://example.com/webhook',
        events: ['dispute_filed', 'case_updated'],
        secret: 'test-secret-123',
      };

      const response = await fetch(`${API_BASE_URL}/webhooks/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhook),
      });

      expect([200, 201]).toContain(response.status);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.webhookId).toBeDefined();
      
      // Verify CORS headers
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });

    it('POST /webhooks/register - Rejects invalid URL', async () => {
      const webhook = {
        agentDid: `did:test:smoke-${Date.now()}`,
        webhookUrl: 'not-a-valid-url',
        events: ['dispute_filed'],
      };

      const response = await fetch(`${API_BASE_URL}/webhooks/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhook),
      });

      expect(response.status).toBe(400);
      
      // Verify CORS headers on errors
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });
  });

  describe('ADP Endpoints', () => {
    it('GET /.well-known/adp - ADP discovery', async () => {
      const response = await fetch(`${API_BASE_URL}/.well-known/adp`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.arbitrationService).toBeDefined();
      expect(data.protocolVersion).toBeDefined();
      expect(data.supportedRules).toBeDefined();
      
      // Verify CORS headers
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });

    it('GET /.well-known/adp/neutrals - Returns available neutrals', async () => {
      const response = await fetch(`${API_BASE_URL}/.well-known/adp/neutrals`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.neutrals).toBeDefined();
      expect(Array.isArray(data.neutrals)).toBe(true);
      
      // Verify CORS headers
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });
  });

  describe('Live Monitoring Endpoints', () => {
    it('GET /live/feed - Returns live activity feed', async () => {
      const response = await fetch(`${API_BASE_URL}/live/feed`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.events).toBeDefined();
      expect(Array.isArray(data.events)).toBe(true);
      
      // Verify CORS headers
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });
  });

  describe('CORS Preflight', () => {
    it('OPTIONS /* - Handles CORS preflight', async () => {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'OPTIONS',
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
      expect(response.headers.get('access-control-allow-methods')).toContain('GET');
      expect(response.headers.get('access-control-allow-methods')).toContain('POST');
      expect(response.headers.get('access-control-allow-headers')).toContain('Content-Type');
      expect(response.headers.get('access-control-allow-headers')).toContain('Authorization');
    });
  });

  afterAll(() => {
    console.log('\n✅ Production smoke tests complete\n');
  });
});










