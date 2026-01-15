import { describe, it, expect } from 'vitest';
import { FRONTEND_BASE_URL } from './fixtures';

/**
 * Link Relation Pages Tests
 * 
 * Tests for the Link relation identifier pages:
 * - GET /rel/refund-contact
 * - GET /rel/refund-request
 * 
 * These pages explain the Link relation types used in X-402 refund request discovery.
 * 
 * Note: These tests require FRONTEND_BASE_URL to point to the Next.js frontend
 * (e.g., https://x402refunds.com or a Vercel preview URL), not the Convex API.
 * 
 * To test against production: FRONTEND_BASE_URL=https://x402refunds.com pnpm test:run test/link-relation-pages.test.ts
 */

// Check if FRONTEND_BASE_URL looks like a frontend URL (not a .convex.site API URL)
const isFrontendUrl = !FRONTEND_BASE_URL.includes('.convex.site') && 
                      (FRONTEND_BASE_URL.includes('x402refunds.com') || 
                       FRONTEND_BASE_URL.includes('vercel.app') ||
                       FRONTEND_BASE_URL.includes('localhost'));

describe('Link Relation Pages', () => {
  describe('GET /rel/refund-contact', () => {
    it.skipIf(!isFrontendUrl)('should return 200 and HTML content', async () => {
      const response = await fetch(`${FRONTEND_BASE_URL}/rel/refund-contact`, {
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');
    });

    it.skipIf(!isFrontendUrl)('should contain expected content about refund-contact', async () => {
      const response = await fetch(`${FRONTEND_BASE_URL}/rel/refund-contact`);
      const html = await response.text();

      expect(html).toContain('refund-contact');
      expect(html).toContain('Link relation');
      expect(html).toContain('RFC 8288');
    });

    it.skipIf(!isFrontendUrl)('should include example Link header', async () => {
      const response = await fetch(`${FRONTEND_BASE_URL}/rel/refund-contact`);
      const html = await response.text();

      expect(html).toContain('mailto:refunds@yourdomain.com');
      expect(html).toContain('x402refunds.com/rel/refund-contact');
    });
  });

  describe('GET /rel/refund-request', () => {
    it.skipIf(!isFrontendUrl)('should return 200 and HTML content', async () => {
      const response = await fetch(`${FRONTEND_BASE_URL}/rel/refund-request`, {
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');
    });

    it.skipIf(!isFrontendUrl)('should contain expected content about refund-request', async () => {
      const response = await fetch(`${FRONTEND_BASE_URL}/rel/refund-request`);
      const html = await response.text();

      expect(html).toContain('refund-request');
      expect(html).toContain('Link relation');
      expect(html).toContain('RFC 8288');
    });

    it.skipIf(!isFrontendUrl)('should include example Link header', async () => {
      const response = await fetch(`${FRONTEND_BASE_URL}/rel/refund-request`);
      const html = await response.text();

      expect(html).toContain('api.x402refunds.com/v1/refunds');
      expect(html).toContain('x402refunds.com/rel/refund-request');
    });
  });
});
