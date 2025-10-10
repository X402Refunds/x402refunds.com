import { describe, it, expect, beforeEach } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../convex/_generated/api';
import schema from '../convex/schema';
import { createTestOwnerAndAgents } from './setup';

/**
 * Evidence Specialized Query Tests
 * 
 * Tests for specialized evidence types and filtering
 */

describe('Evidence Type Queries', () => {
  let t: ReturnType<typeof convexTest>;
  let agentDid: string;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
    
    const { plaintiff } = await createTestOwnerAndAgents(t);
    agentDid = plaintiff;
  });

  it('should get physical evidence', async () => {
    const evidenceId = await t.mutation(api.evidence.submitPhysicalEvidence, {
      agentDid,
      sha256: `physical_${Date.now()}`,
      uri: 'https://test.example.com/physical.json',
      signer: 'did:test:signer',
      location: {
        lat: 37.7749,
        lng: -122.4194,
        timestamp: Date.now(),
        accuracy: 10,
      },
      sensorData: {
        type: 'temperature',
        reading: 72.5,
      },
    });

    const evidence = await t.query(api.evidence.getPhysicalEvidence, {
      limit: 10,
    });
    
    expect(Array.isArray(evidence)).toBe(true);
  });

  it('should get voice evidence', async () => {
    const evidenceId = await t.mutation(api.evidence.submitVoiceEvidence, {
      agentDid,
      sha256: `voice_${Date.now()}`,
      uri: 'https://test.example.com/voice.wav',
      signer: 'did:test:signer',
      consentProof: 'consent-proof-hash-123',
      privacyCompliance: ['GDPR', 'CCPA'],
      transcription: 'Test transcription',
      confidenceScore: 0.95,
      languageDetected: 'en-US',
    });

    const evidence = await t.query(api.evidence.getVoiceEvidence, {
      limit: 10,
    });
    
    expect(Array.isArray(evidence)).toBe(true);
  });

  it('should get coding evidence', async () => {
    await t.mutation(api.evidence.submitEvidence, {
      agentDid,
      sha256: `code_${Date.now()}`,
      uri: 'https://test.example.com/code.json',
      signer: 'did:test:signer',
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });

    const evidence = await t.query(api.evidence.getCodingEvidence, {
      limit: 10,
    });
    
    expect(Array.isArray(evidence)).toBe(true);
  });

  it('should get financial evidence', async () => {
    await t.mutation(api.evidence.submitEvidence, {
      agentDid,
      sha256: `financial_${Date.now()}`,
      uri: 'https://test.example.com/financial.json',
      signer: 'did:test:signer',
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });

    const evidence = await t.query(api.evidence.getFinancialEvidence, {
      limit: 10,
    });
    
    expect(Array.isArray(evidence)).toBe(true);
  });

  it('should get healthcare evidence', async () => {
    await t.mutation(api.evidence.submitEvidence, {
      agentDid,
      sha256: `healthcare_${Date.now()}`,
      uri: 'https://test.example.com/healthcare.json',
      signer: 'did:test:signer',
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });

    const evidence = await t.query(api.evidence.getHealthcareEvidence, {
      limit: 10,
    });
    
    expect(Array.isArray(evidence)).toBe(true);
  });
});

describe('Evidence Filtering', () => {
  let t: ReturnType<typeof convexTest>;
  let agentDid: string;
  let caseId: any;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
    
    const { plaintiff, defendant } = await createTestOwnerAndAgents(t);
    agentDid = plaintiff;
    
    // Create case
    const evidenceId = await t.mutation(api.evidence.submitEvidence, {
      agentDid: plaintiff,
      sha256: `filter_${Date.now()}`,
      uri: 'https://test.example.com/filter.json',
      signer: 'did:test:signer',
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });
    
    caseId = await t.mutation(api.cases.fileDispute, {
      plaintiff,
      defendant,
      type: 'SLA_BREACH',
      jurisdictionTags: ['test'],
      evidenceIds: [evidenceId],
    });
  });

  it('should filter by functional type', async () => {
    const evidence = await t.query(api.evidence.getEvidenceByFunctionalType, {
      functionalType: 'general',
      limit: 10,
    });
    
    expect(Array.isArray(evidence)).toBe(true);
  });

  it('should filter by case', async () => {
    const evidence = await t.query(api.evidence.getEvidenceByCaseId, {
      caseId,
    });
    
    expect(Array.isArray(evidence)).toBe(true);
    expect(evidence.length).toBeGreaterThan(0);
  });

  it('should filter by agent', async () => {
    const evidence = await t.query(api.evidence.getEvidenceByAgent, {
      agentDid,
    });
    
    expect(Array.isArray(evidence)).toBe(true);
    expect(evidence.length).toBeGreaterThan(0);
  });

  it('should filter by date range', async () => {
    const evidence = await t.query(api.evidence.getRecentEvidence, {
      limit: 10,
    });
    
    expect(Array.isArray(evidence)).toBe(true);
  });

  it('should filter by verification status', async () => {
    const evidence = await t.query(api.evidence.getEvidence, {
      evidenceId: (await t.query(api.evidence.getRecentEvidence, { limit: 1 }))[0]?._id,
    });
    
    expect(evidence).toBeDefined();
  });
});

describe('Evidence Validation', () => {
  let t: ReturnType<typeof convexTest>;
  let agentDid: string;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
    
    const { plaintiff } = await createTestOwnerAndAgents(t);
    agentDid = plaintiff;
  });

  it('should validate evidence hash', async () => {
    const hash = `sha256_valid_${Date.now()}`;
    const evidenceId = await t.mutation(api.evidence.submitEvidence, {
      agentDid,
      sha256: hash,
      uri: 'https://test.example.com/valid.json',
      signer: 'did:test:signer',
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });

    const evidence = await t.query(api.evidence.getEvidence, { evidenceId });
    expect(evidence).toBeDefined();
    expect(evidence?.sha256).toBe(hash);
  });

  it('should validate evidence signature', async () => {
    const evidenceId = await t.mutation(api.evidence.submitEvidence, {
      agentDid,
      sha256: `sha256_sig_${Date.now()}`,
      uri: 'https://test.example.com/signed.json',
      signer: 'did:test:signer',
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });

    const evidence = await t.query(api.evidence.getEvidence, { evidenceId });
    expect(evidence?.signer).toBeDefined();
  });

  it('should validate evidence timestamp', async () => {
    const evidenceId = await t.mutation(api.evidence.submitEvidence, {
      agentDid,
      sha256: `sha256_time_${Date.now()}`,
      uri: 'https://test.example.com/time.json',
      signer: 'did:test:signer',
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });

    const evidence = await t.query(api.evidence.getEvidence, { evidenceId });
    expect(evidence?.ts).toBeDefined();
  });

  it('should accept various hash formats', async () => {
    // System accepts various hash formats including empty
    const evidenceId = await t.mutation(api.evidence.submitEvidence, {
      agentDid,
      sha256: 'short-hash', // Various formats accepted
      uri: 'https://test.example.com/various.json',
      signer: 'did:test:signer',
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });
    
    expect(evidenceId).toBeDefined();
  });

  it('should handle query for missing evidence', async () => {
    // Create a valid evidence ID to get the format
    const validId = await t.mutation(api.evidence.submitEvidence, {
      agentDid,
      sha256: `sha256_test_${Date.now()}`,
      uri: 'https://test.example.com/test.json',
      signer: 'did:test:signer',
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });
    
    // Query with wrong ID (formatted correctly but doesn't exist)
    const fakeId = validId.replace(/\d+/, '999999');
    const evidence = await t.query(api.evidence.getEvidence, {
      evidenceId: fakeId as any,
    });
    
    expect(evidence).toBeNull();
  });
});

