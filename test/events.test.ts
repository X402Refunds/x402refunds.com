import { describe, it, expect, beforeEach } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../convex/_generated/api';
import schema from '../convex/schema';
import { createTestOwnerAndAgents, createTestCaseWithEvidence } from './setup';

/**
 * Event Tracking Tests
 * 
 * Tests for event creation, queries, and system statistics
 */

describe('Event Creation', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
  });

  it('should create events for case lifecycle', async () => {
    const { plaintiff, defendant } = await createTestOwnerAndAgents(t);
    const { caseId } = await createTestCaseWithEvidence(t, plaintiff, defendant, 1);

    const events = await t.query(api.events.getEventsByCase, { caseId });
    expect(events.length).toBeGreaterThan(0);
  });

  it('should create events for agent actions', async () => {
    const { plaintiff } = await createTestOwnerAndAgents(t);
    
    await t.mutation(api.evidence.submitEvidence, {
      agentDid: plaintiff,
      sha256: `sha256_${Date.now()}`,
      uri: 'https://test.example.com/evidence.json',
      signer: 'did:test:signer',
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });

    const events = await t.query(api.events.getEventsByAgent, {
      agentDid: plaintiff,
      limit: 10,
    });
    expect(events.length).toBeGreaterThan(0);
  });

  it('should create events for system actions', async () => {
    const events = await t.query(api.events.getRecentEvents, { limit: 10 });
    expect(Array.isArray(events)).toBe(true);
  });
});

describe('Event Queries', () => {
  let t: ReturnType<typeof convexTest>;
  let caseId: any;
  let plaintiff: string;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
    
    const agents = await createTestOwnerAndAgents(t);
    plaintiff = agents.plaintiff;
    const result = await createTestCaseWithEvidence(t, agents.plaintiff, agents.defendant, 2);
    caseId = result.caseId;
  });

  it('should get events by type', async () => {
    const events = await t.query(api.events.getEventsByType, {
      type: 'DISPUTE_FILED',
      limit: 10,
    });
    
    expect(Array.isArray(events)).toBe(true);
  });

  it('should get events by agent', async () => {
    const events = await t.query(api.events.getEventsByAgent, {
      agentDid: plaintiff,
      limit: 10,
    });
    
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);
  });

  it('should get events by case', async () => {
    const events = await t.query(api.events.getEventsByCase, {
      caseId,
    });
    
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);
  });

  it('should get event timeline', async () => {
    const timeline = await t.query(api.events.getEventTimeline, {
      hoursBack: 24,
      bucketMinutes: 60,
    });
    
    expect(Array.isArray(timeline)).toBe(true);
  });
});

describe('System Stats', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
  });

  it('should calculate system statistics', async () => {
    const stats = await t.query(api.events.getSystemStats, {});
    
    expect(stats).toBeDefined();
    expect(stats.totalEvents).toBeGreaterThanOrEqual(0);
    expect(stats.disputesFiled).toBeGreaterThanOrEqual(0);
    expect(stats.agentRegistrations).toBeGreaterThanOrEqual(0);
  });

  it('should track case resolution metrics', async () => {
    const { plaintiff, defendant } = await createTestOwnerAndAgents(t);
    await createTestCaseWithEvidence(t, plaintiff, defendant, 1);

    const stats = await t.query(api.events.getSystemStats, {});
    expect(stats.disputesFiled).toBeGreaterThan(0);
  });

  it('should monitor agent activity metrics', async () => {
    await createTestOwnerAndAgents(t);
    
    const stats = await t.query(api.events.getSystemStats, {});
    expect(stats.agentRegistrations).toBeGreaterThan(0);
  });
});

