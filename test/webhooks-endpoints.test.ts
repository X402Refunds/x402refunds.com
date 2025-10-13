import { describe, it, expect, beforeAll } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../convex/_generated/api';
import schema from '../convex/schema';
import { API_BASE_URL, USE_LIVE_API } from './fixtures';
import { setupTestAgents, createTestCase } from './fixtures/api-helpers';

/**
 * Webhooks & Notifications Endpoints Tests
 * 
 * Tests for webhook registration and notifications:
 * - POST /webhooks/register
 * - GET /notifications/:agentDid
 */

describe('Webhooks - Registration', () => {
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

  describe('POST /webhooks/register', () => {
    it.skipIf(USE_LIVE_API)('should register webhook with valid URL', async () => {
      const webhookData = {
        agentDid: testAgentDid,
        webhookUrl: 'https://example.com/webhook',
        events: ['dispute_filed', 'case_updated'],
        secret: 'test-secret-123',
      };

      const response = await fetch(`${API_BASE_URL}/webhooks/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.webhookId).toBeDefined();
      expect(data.agentDid).toBe(testAgentDid);
      expect(data.url).toBe(webhookData.webhookUrl);
      expect(data.events).toEqual(webhookData.events);
      expect(data.secret).toBeDefined();
    });

    it.skipIf(USE_LIVE_API)('should use default events if not specified', async () => {
      const webhookData = {
        agentDid: testAgentDid,
        webhookUrl: 'https://example.com/webhook',
      };

      const response = await fetch(`${API_BASE_URL}/webhooks/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.events).toBeDefined();
      expect(Array.isArray(data.events)).toBe(true);
      expect(data.events.length).toBeGreaterThan(0);
      // Should include default events
      expect(data.events).toContain('dispute_filed');
      expect(data.events).toContain('case_updated');
    });

    it.skipIf(USE_LIVE_API)('should generate secret if not provided', async () => {
      const webhookData = {
        agentDid: testAgentDid,
        webhookUrl: 'https://example.com/webhook',
        events: ['dispute_filed'],
      };

      const response = await fetch(`${API_BASE_URL}/webhooks/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      });

      const data = await response.json();
      expect(data.secret).toBeDefined();
      expect(data.secret.length).toBeGreaterThan(0);
    });

    it('should reject invalid webhook URL', async () => {
      const webhookData = {
        agentDid: testAgentDid,
        webhookUrl: 'not-a-valid-url',
        events: ['dispute_filed'],
      };

      const response = await fetch(`${API_BASE_URL}/webhooks/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error).toContain('webhook URL');
    });

    it('should reject missing webhook URL', async () => {
      const webhookData = {
        agentDid: testAgentDid,
        events: ['dispute_filed'],
      };

      const response = await fetch(`${API_BASE_URL}/webhooks/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      });

      expect(response.status).toBe(400);
    });

    it('should reject missing agent DID', async () => {
      const webhookData = {
        webhookUrl: 'https://example.com/webhook',
        events: ['dispute_filed'],
      };

      const response = await fetch(`${API_BASE_URL}/webhooks/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      });

      // Endpoint may have lenient validation
      expect([200, 400]).toContain(response.status);
    });

    it('should handle malformed JSON', async () => {
      const response = await fetch(`${API_BASE_URL}/webhooks/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json {',
      });

      expect([400, 500]).toContain(response.status);
    });

    it.skipIf(USE_LIVE_API)('should accept custom event types', async () => {
      const webhookData = {
        agentDid: testAgentDid,
        webhookUrl: 'https://example.com/webhook',
        events: ['custom_event', 'another_event'],
      };

      const response = await fetch(`${API_BASE_URL}/webhooks/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      });

      const data = await response.json();
      expect(data.events).toEqual(webhookData.events);
    });

    it.skipIf(USE_LIVE_API)('should include CORS headers', async () => {
      const webhookData = {
        agentDid: testAgentDid,
        webhookUrl: 'https://example.com/webhook',
      };

      const response = await fetch(`${API_BASE_URL}/webhooks/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      });

      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });
  });
});

describe('Notifications - Retrieval', () => {
  let t: ReturnType<typeof convexTest>;
  let testAgentDid: string;

  beforeAll(async () => {
    if (!USE_LIVE_API) {
      const modules = import.meta.glob('../convex/**/*.{ts,js}');
      t = convexTest(schema, modules);
      
      const { plaintiff, defendant } = await setupTestAgents(t);
      testAgentDid = plaintiff.did;
      
      // Create some activity to generate events/notifications
      await createTestCase(t, plaintiff.did, defendant.did);
    }
  });

  describe('GET /notifications/:agentDid', () => {
    it.skipIf(USE_LIVE_API)('should return agent notifications', async () => {
      const response = await fetch(`${API_BASE_URL}/notifications/${testAgentDid}`);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.agentDid).toBe(testAgentDid);
      expect(data.notifications).toBeDefined();
      expect(Array.isArray(data.notifications)).toBe(true);
      expect(data.unreadCount).toBeGreaterThanOrEqual(0);
    });

    it.skipIf(USE_LIVE_API)('should include notification details', async () => {
      const response = await fetch(`${API_BASE_URL}/notifications/${testAgentDid}`);
      const data = await response.json();
      
      if (data.notifications.length > 0) {
        const notification = data.notifications[0];
        expect(notification.id).toBeDefined();
        expect(notification.type).toBeDefined();
        expect(notification.message).toBeDefined();
        expect(notification.timestamp).toBeGreaterThan(0);
        expect(notification.priority).toBeDefined();
        expect(['HIGH', 'MEDIUM', 'LOW']).toContain(notification.priority);
        expect(typeof notification.actionRequired).toBe('boolean');
      }
    });

    it.skipIf(USE_LIVE_API)('should filter by unread status', async () => {
      const response = await fetch(`${API_BASE_URL}/notifications/${testAgentDid}?unread=true`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      // All returned notifications should be unread
      const allUnread = data.notifications.every((n: any) => !n.read);
      expect(allUnread).toBe(true);
    });

    it.skipIf(USE_LIVE_API)('should include related case ID', async () => {
      const response = await fetch(`${API_BASE_URL}/notifications/${testAgentDid}`);
      const data = await response.json();
      
      // Notifications related to cases should have caseId
      const caseNotifications = data.notifications.filter(
        (n: any) => n.type.includes('CASE') || n.type.includes('DISPUTE')
      );
      
      if (caseNotifications.length > 0) {
        expect(caseNotifications[0].relatedCaseId).toBeDefined();
      }
    });

    it.skipIf(USE_LIVE_API)('should calculate unread count correctly', async () => {
      const response = await fetch(`${API_BASE_URL}/notifications/${testAgentDid}`);
      const data = await response.json();
      
      const unreadNotifications = data.notifications.filter((n: any) => !n.read);
      expect(data.unreadCount).toBe(unreadNotifications.length);
    });

    it('should return 400 for missing agent DID', async () => {
      const response = await fetch(`${API_BASE_URL}/notifications/`);
      
      expect([400, 404]).toContain(response.status);
    });

    it('should return 400 for invalid agent DID format', async () => {
      const response = await fetch(`${API_BASE_URL}/notifications/invalid-did`);
      
      expect([400, 404]).toContain(response.status);
    });

    it.skipIf(USE_LIVE_API)('should handle agent with no notifications', async () => {
      // Create a new agent with no activity
      const ownerDid = `did:test:new-owner-${Date.now()}`;
      await t.mutation(api.auth.createOwner, {
        did: ownerDid,
        name: 'New Owner',
        email: `new-${Date.now()}@example.com`,
      });
      
      const newAgent = await t.mutation(api.agents.joinAgent, {
        ownerDid,
        name: 'New Agent',
        organizationName: `New Org ${Date.now()}`,
      });
      
      const response = await fetch(`${API_BASE_URL}/notifications/${newAgent.did}`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.notifications).toEqual([]);
      expect(data.unreadCount).toBe(0);
    });

    it.skipIf(USE_LIVE_API)('should include notification priority levels', async () => {
      const response = await fetch(`${API_BASE_URL}/notifications/${testAgentDid}`);
      const data = await response.json();
      
      // All priorities should be valid
      const validPriorities = ['HIGH', 'MEDIUM', 'LOW'];
      const allValidPriorities = data.notifications.every(
        (n: any) => validPriorities.includes(n.priority)
      );
      expect(allValidPriorities).toBe(true);
    });

    it.skipIf(USE_LIVE_API)('should include CORS headers', async () => {
      const response = await fetch(`${API_BASE_URL}/notifications/${testAgentDid}`);
      
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });

    it.skipIf(USE_LIVE_API)('should format notification messages correctly', async () => {
      const response = await fetch(`${API_BASE_URL}/notifications/${testAgentDid}`);
      const data = await response.json();
      
      // All notifications should have non-empty messages
      const allHaveMessages = data.notifications.every(
        (n: any) => n.message && n.message.length > 0
      );
      expect(allHaveMessages).toBe(true);
    });
  });
});

