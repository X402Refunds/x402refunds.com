import { describe, it, expect, beforeEach } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../convex/_generated/api';
import schema from '../convex/schema';
import { createTestAgent, createTestEvidence } from './setup';

describe('Evidence APIs', () => {
  let t: ReturnType<typeof convexTest>;
  let testAgentDid: string;
  let testCaseId: any;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
    
    // Create test owner and agents
    await t.mutation(api.auth.createOwner, {
      did: 'did:test:evidenceowner',
      name: 'Evidence Test Owner',
      email: 'evidence@example.com',
    });

    const agent1Result = await t.mutation(api.agents.joinAgent, {
      ownerDid: 'did:test:evidenceowner',
      name: 'Evidence Agent',
      organizationName: 'Evidence Corp',
      mock: false,
      functionalType: 'general' as const,
    });
    testAgentDid = agent1Result.did;

    // Create second agent for case parties
    const agent2Result = await t.mutation(api.agents.joinAgent, {
      ownerDid: 'did:test:evidenceowner',
      name: 'Other Agent',
      organizationName: 'Other Corp',
      mock: false,
      functionalType: 'general' as const,
    });

    // Create a test case for evidence linking
    testCaseId = await t.mutation(api.cases.fileDispute, {
      plaintiff: testAgentDid,
      defendant: agent2Result.did,
      type: 'SLA_MISS',
      jurisdictionTags: ['AI_AGENTS'],
      evidenceIds: [], // No evidence initially
    });
  });

  describe('submitEvidence - Core Evidence Submission', () => {
    it('should submit evidence successfully', async () => {
      const evidenceData = {
        agentDid: testAgentDid,
        sha256: 'sha256_test_evidence_123',
        uri: 'https://example.com/evidence/test123.json',
        signer: 'did:test:signer',
        model: {
          provider: 'anthropic',
          name: 'claude-3.5-sonnet',
          version: '20241022',
          seed: 12345,
          temp: 0.7,
        },
        tool: 'court-evidence-tool',
      };

      const evidenceId = await t.mutation(api.evidence.submitEvidence, evidenceData);
      expect(evidenceId).toBeDefined();

      // Verify evidence was created correctly
      const evidence = await t.query(api.evidence.getEvidence, { evidenceId });
      expect(evidence).toMatchObject({
        agentDid: evidenceData.agentDid,
        sha256: evidenceData.sha256,
        uri: evidenceData.uri,
        signer: evidenceData.signer,
        model: evidenceData.model,
        tool: evidenceData.tool,
      });
      expect(evidence?.ts).toBeDefined();
    });

    it('should submit evidence linked to a case', async () => {
      const evidenceData = {
        agentDid: testAgentDid,
        sha256: 'sha256_case_linked_456',
        uri: 'https://example.com/evidence/case-linked.json',
        signer: 'did:test:signer',
        model: {
          provider: 'openai',
          name: 'gpt-4',
          version: 'gpt-4-1106-preview',
        },
        caseId: testCaseId,
      };

      const evidenceId = await t.mutation(api.evidence.submitEvidence, evidenceData);
      expect(evidenceId).toBeDefined();

      const evidence = await t.query(api.evidence.getEvidence, { evidenceId });
      expect(evidence?.caseId).toBe(testCaseId);
    });

    it('should submit minimal evidence with required fields only', async () => {
      const evidenceData = {
        agentDid: testAgentDid,
        sha256: 'sha256_minimal_789',
        uri: 'https://example.com/evidence/minimal.json',
        signer: 'did:test:minimal-signer',
        model: {
          provider: 'local',
          name: 'llama-2',
          version: '13b',
        },
      };

      const evidenceId = await t.mutation(api.evidence.submitEvidence, evidenceData);
      expect(evidenceId).toBeDefined();

      const evidence = await t.query(api.evidence.getEvidence, { evidenceId });
      expect(evidence).toMatchObject({
        agentDid: evidenceData.agentDid,
        sha256: evidenceData.sha256,
        uri: evidenceData.uri,
        model: evidenceData.model,
      });
      expect(evidence?.tool).toBeUndefined();
      expect(evidence?.caseId).toBeUndefined();
    });
  });

  describe('Evidence Validation', () => {
    it('should reject evidence from non-existent agent', async () => {
      await expect(t.mutation(api.evidence.submitEvidence, {
        agentDid: 'did:test:nonexistent',
        sha256: 'sha256_invalid_agent',
        uri: 'https://example.com/evidence/invalid.json',
        signer: 'did:test:signer',
        model: {
          provider: 'test',
          name: 'test-model',
          version: '1.0',
        },
      })).rejects.toThrow('Agent not found or not active');
    });

    it('should reject evidence from inactive agent', async () => {
      // Create an inactive agent
      const inactiveAgentDid = 'did:test:inactive';
      const agentId = await t.mutation(api.agents.joinAgent, {
        did: inactiveAgentDid,
        ownerDid: 'did:test:evidenceowner',
        citizenshipTier: 'session' as const,
        functionalType: 'general' as const,
      });

      // Mark agent as inactive
      await t.mutation(api.agents.updateAgentStatus, {
        agentId,
        status: 'suspended',
      });

      await expect(t.mutation(api.evidence.submitEvidence, {
        agentDid: inactiveAgentDid,
        sha256: 'sha256_inactive_agent',
        uri: 'https://example.com/evidence/inactive.json',
        signer: 'did:test:signer',
        model: {
          provider: 'test',
          name: 'test-model',
          version: '1.0',
        },
      })).rejects.toThrow('Agent not found or not active');
    });

    it('should reject duplicate evidence (same sha256)', async () => {
      const evidenceData = {
        agentDid: testAgentDid,
        sha256: 'sha256_duplicate_test',
        uri: 'https://example.com/evidence/original.json',
        signer: 'did:test:signer',
        model: {
          provider: 'test',
          name: 'test-model',
          version: '1.0',
        },
      };

      // Submit first time - should succeed
      await t.mutation(api.evidence.submitEvidence, evidenceData);

      // Submit second time with same sha256 - should fail
      await expect(t.mutation(api.evidence.submitEvidence, {
        ...evidenceData,
        uri: 'https://example.com/evidence/duplicate.json', // different URI, same hash
      })).rejects.toThrow('Evidence with this hash already exists');
    });
  });

  describe('Evidence Retrieval Queries', () => {
    beforeEach(async () => {
      // Create multiple evidence records for testing queries
      const evidenceItems = [
        {
          agentDid: testAgentDid,
          sha256: 'sha256_query_test_1',
          uri: 'https://example.com/evidence/query1.json',
          signer: 'did:test:signer1',
          model: { provider: 'anthropic', name: 'claude-3', version: '1.0' },
          caseId: testCaseId,
        },
        {
          agentDid: testAgentDid,
          sha256: 'sha256_query_test_2',
          uri: 'https://example.com/evidence/query2.json',
          signer: 'did:test:signer2',
          model: { provider: 'openai', name: 'gpt-4', version: '1.0' },
        },
        {
          agentDid: 'did:test:otherapent',
          sha256: 'sha256_query_test_3',
          uri: 'https://example.com/evidence/query3.json',
          signer: 'did:test:signer3',
          model: { provider: 'local', name: 'llama-2', version: '7b' },
          caseId: testCaseId,
        },
      ];

      // Create the other agent first
      await t.mutation(api.agents.joinAgent, {
        did: 'did:test:otherapent',
        ownerDid: 'did:test:evidenceowner',
        citizenshipTier: 'ephemeral' as const,
        functionalType: 'general' as const,
        agentType: 'ephemeral' as const,
        sponsor: testAgentDid, // Use our test agent as sponsor
      });

      for (const evidence of evidenceItems) {
        await t.mutation(api.evidence.submitEvidence, evidence);
      }
    });

    it('should get evidence by ID', async () => {
      // Submit a specific evidence item
      const specificEvidenceId = await t.mutation(api.evidence.submitEvidence, {
        agentDid: testAgentDid,
        sha256: 'sha256_specific_get',
        uri: 'https://example.com/evidence/specific.json',
        signer: 'did:test:specific-signer',
        model: { provider: 'test', name: 'test-model', version: '1.0' },
      });

      const evidence = await t.query(api.evidence.getEvidence, { 
        evidenceId: specificEvidenceId 
      });
      
      expect(evidence).toBeDefined();
      expect(evidence?.sha256).toBe('sha256_specific_get');
      expect(evidence?.agentDid).toBe(testAgentDid);
    });

    it('should get evidence by case ID', async () => {
      const caseEvidence = await t.query(api.evidence.getEvidenceByCase, { 
        caseId: testCaseId 
      });
      
      expect(caseEvidence).toHaveLength(2); // Two items linked to testCaseId
      expect(caseEvidence.every(e => e.caseId === testCaseId)).toBe(true);
      
      const hashes = caseEvidence.map(e => e.sha256);
      expect(hashes).toContain('sha256_query_test_1');
      expect(hashes).toContain('sha256_query_test_3');
    });

    it('should get evidence by agent DID', async () => {
      const agentEvidence = await t.query(api.evidence.getEvidenceByAgent, { 
        agentDid: testAgentDid 
      });
      
      expect(agentEvidence.length).toBeGreaterThanOrEqual(2);
      expect(agentEvidence.every(e => e.agentDid === testAgentDid)).toBe(true);
      
      const hashes = agentEvidence.map(e => e.sha256);
      expect(hashes).toContain('sha256_query_test_1');
      expect(hashes).toContain('sha256_query_test_2');
    });

    it('should get recent evidence with default limit', async () => {
      const recentEvidence = await t.query(api.evidence.getRecentEvidence, {});
      
      expect(recentEvidence.length).toBeGreaterThan(0);
      expect(recentEvidence.length).toBeLessThanOrEqual(50); // Default limit
      
      // Should be ordered by timestamp descending
      if (recentEvidence.length > 1) {
        expect(recentEvidence[0]?.ts).toBeGreaterThanOrEqual(recentEvidence[1]?.ts || 0);
      }
    });

    it('should get recent evidence with custom limit', async () => {
      const limitedEvidence = await t.query(api.evidence.getRecentEvidence, { 
        limit: 2 
      });
      
      expect(limitedEvidence).toHaveLength(2);
    });

    it('should return empty array for non-existent case evidence', async () => {
      // Create a real case ID first, then test with a different real case
      const otherCaseId = await t.mutation(api.cases.fileDispute, {
        parties: [testAgentDid, 'did:test:other'],
        type: 'OTHER_CASE',
        jurisdictionTags: ['AI_AGENTS'],
        evidenceIds: [],
      });
      
      const caseEvidence = await t.query(api.evidence.getEvidenceByCase, { 
        caseId: otherCaseId 
      });
      
      expect(caseEvidence).toHaveLength(0);
    });

    it('should return empty array for non-existent agent evidence', async () => {
      const agentEvidence = await t.query(api.evidence.getEvidenceByAgent, { 
        agentDid: 'did:test:nonexistent' 
      });
      
      expect(agentEvidence).toHaveLength(0);
    });
  });

  describe('Evidence Event Logging', () => {
    it('should log evidence submission events', async () => {
      const evidenceData = {
        agentDid: testAgentDid,
        sha256: 'sha256_event_logging',
        uri: 'https://example.com/evidence/event-test.json',
        signer: 'did:test:event-signer',
        model: {
          provider: 'test',
          name: 'event-model',
          version: '1.0',
        },
        caseId: testCaseId,
      };

      const evidenceId = await t.mutation(api.evidence.submitEvidence, evidenceData);

      // Check that event was logged
      const events = await t.query(api.transparency.getRecentEvents, { 
        eventType: 'EVIDENCE_SUBMITTED',
        limit: 10,
      });
      
      const evidenceEvent = events.find(e => e.payload?.evidenceId === evidenceId);
      expect(evidenceEvent).toBeDefined();
      expect(evidenceEvent?.type).toBe('EVIDENCE_SUBMITTED');
      expect(evidenceEvent?.payload).toMatchObject({
        evidenceId,
        agentDid: testAgentDid,
        sha256: 'sha256_event_logging',
        caseId: testCaseId,
      });
    });

    it('should log events for evidence without case linkage', async () => {
      const evidenceData = {
        agentDid: testAgentDid,
        sha256: 'sha256_no_case_event',
        uri: 'https://example.com/evidence/no-case.json',
        signer: 'did:test:no-case-signer',
        model: {
          provider: 'test',
          name: 'no-case-model',
          version: '1.0',
        },
      };

      const evidenceId = await t.mutation(api.evidence.submitEvidence, evidenceData);

      const events = await t.query(api.transparency.getRecentEvents, { 
        eventType: 'EVIDENCE_SUBMITTED',
        limit: 10,
      });
      
      const evidenceEvent = events.find(e => e.payload?.evidenceId === evidenceId);
      expect(evidenceEvent).toBeDefined();
      expect(evidenceEvent?.payload?.caseId).toBeUndefined();
    });
  });

  describe('Model Metadata Validation', () => {
    it('should accept various AI model providers', async () => {
      const providers = [
        { provider: 'anthropic', name: 'claude-3.5-sonnet', version: '20241022' },
        { provider: 'openai', name: 'gpt-4', version: 'gpt-4-1106-preview' },
        { provider: 'google', name: 'gemini-pro', version: '1.0' },
        { provider: 'local', name: 'llama-2', version: '13b' },
        { provider: 'huggingface', name: 'mistral-7b', version: 'v0.1' },
      ];

      for (const [index, model] of providers.entries()) {
        const evidenceId = await t.mutation(api.evidence.submitEvidence, {
          agentDid: testAgentDid,
          sha256: `sha256_provider_${index}`,
          uri: `https://example.com/evidence/provider-${index}.json`,
          signer: `did:test:provider-${index}`,
          model,
        });

        const evidence = await t.query(api.evidence.getEvidence, { evidenceId });
        expect(evidence?.model).toMatchObject(model);
      }
    });

    it('should store optional model parameters', async () => {
      const evidenceData = {
        agentDid: testAgentDid,
        sha256: 'sha256_model_params',
        uri: 'https://example.com/evidence/model-params.json',
        signer: 'did:test:model-params',
        model: {
          provider: 'anthropic',
          name: 'claude-3.5-sonnet',
          version: '20241022',
          seed: 42,
          temp: 0.8,
        },
      };

      const evidenceId = await t.mutation(api.evidence.submitEvidence, evidenceData);
      const evidence = await t.query(api.evidence.getEvidence, { evidenceId });

      expect(evidence?.model.seed).toBe(42);
      expect(evidence?.model.temp).toBe(0.8);
    });

    it('should handle model without optional parameters', async () => {
      const evidenceData = {
        agentDid: testAgentDid,
        sha256: 'sha256_minimal_model',
        uri: 'https://example.com/evidence/minimal-model.json',
        signer: 'did:test:minimal-model',
        model: {
          provider: 'test',
          name: 'test-model',
          version: '1.0',
        },
      };

      const evidenceId = await t.mutation(api.evidence.submitEvidence, evidenceData);
      const evidence = await t.query(api.evidence.getEvidence, { evidenceId });

      expect(evidence?.model.seed).toBeUndefined();
      expect(evidence?.model.temp).toBeUndefined();
      expect(evidence?.model.provider).toBe('test');
      expect(evidence?.model.name).toBe('test-model');
      expect(evidence?.model.version).toBe('1.0');
    });
  });

  describe('Cryptographic Evidence Integrity', () => {
    it('should store and retrieve evidence with cryptographic hashes', async () => {
      // Simulate different hash formats
      const hashFormats = [
        'sha256_standard_64_char_hash_abcdef1234567890abcdef1234567890abcdef12',
        'sha3-256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        'blake2b:fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
      ];

      for (const [index, hash] of hashFormats.entries()) {
        const evidenceId = await t.mutation(api.evidence.submitEvidence, {
          agentDid: testAgentDid,
          sha256: hash,
          uri: `https://example.com/evidence/crypto-${index}.json`,
          signer: `did:test:crypto-${index}`,
          model: {
            provider: 'test',
            name: 'crypto-model',
            version: '1.0',
          },
        });

        const evidence = await t.query(api.evidence.getEvidence, { evidenceId });
        expect(evidence?.sha256).toBe(hash);
      }
    });

    it('should ensure evidence immutability through timestamps', async () => {
      const beforeSubmission = Date.now();
      
      const evidenceId = await t.mutation(api.evidence.submitEvidence, {
        agentDid: testAgentDid,
        sha256: 'sha256_immutable_timestamp',
        uri: 'https://example.com/evidence/immutable.json',
        signer: 'did:test:immutable',
        model: {
          provider: 'test',
          name: 'immutable-model',
          version: '1.0',
        },
      });

      const afterSubmission = Date.now();
      const evidence = await t.query(api.evidence.getEvidence, { evidenceId });

      expect(evidence?.ts).toBeGreaterThanOrEqual(beforeSubmission);
      expect(evidence?.ts).toBeLessThanOrEqual(afterSubmission);
    });
  });
});
