import { describe, it, expect } from 'vitest';
import { API_BASE_URL } from './fixtures';

/**
 * System & Discovery Endpoints Tests
 * 
 * Tests for system health, discovery, and monitoring:
 * - GET /health
 * - GET /version
 * - GET /
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
      // Warm-up request to reduce cold-start noise (Convex/edge can occasionally exceed 1s on first hit).
      await fetch(`${API_BASE_URL}/health`);

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

describe("Removed endpoints: /agents/*", () => {
  it("POST /agents/discover should be removed (404)", async () => {
    const response = await fetch(`${API_BASE_URL}/agents/discover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ functionalTypes: ["general"] }),
    });
    expect(response.status).toBe(404);
  });

  it("GET /agents/top-reputation should be removed (404)", async () => {
    const response = await fetch(`${API_BASE_URL}/agents/top-reputation`);
    expect(response.status).toBe(404);
  });
});

describe('Live Monitoring', () => {
  describe('GET /live/feed', () => {
    it('should return cases-based registry feed', async () => {
      const response = await fetch(`${API_BASE_URL}/live/feed`);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(Array.isArray(data.cases)).toBe(true);
      expect(Array.isArray(data.feed)).toBe(true); // compatibility alias
      expect(data.lastUpdate).toBeGreaterThan(0);
    });

    it('should include CORS headers', async () => {
      const response = await fetch(`${API_BASE_URL}/live/feed`);
      
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });

    it('should limit feed to reasonable size', async () => {
      const response = await fetch(`${API_BASE_URL}/live/feed`);
      const data = await response.json();
      
      // Default limit is 20; allow some slack for legacy aliases.
      expect(data.cases.length).toBeLessThanOrEqual(50);
    });
  });
});

