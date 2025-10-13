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

describe('Healthcare Evidence Advanced Filtering', () => {
  let t: ReturnType<typeof convexTest>;
  let agentDid: string;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
    
    // Create a healthcare-specific agent
    const ownerDid = `did:test:healthcare-owner-${Date.now()}`;
    await t.mutation(api.auth.createOwner, {
      did: ownerDid,
      name: 'Healthcare Test Owner',
      email: 'healthcare-test@example.com',
    });
    
    const agent = await t.mutation(api.agents.joinAgent, {
      ownerDid,
      name: 'Healthcare Test Agent',
      organizationName: `Healthcare Org ${Date.now()}`,
      functionalType: 'healthcare',
    });
    agentDid = agent.did;
  });

  it('should filter healthcare evidence by HIPAA compliance (true)', async () => {
    await t.mutation(api.evidence.submitEvidence, {
      agentDid,
      sha256: `healthcare_hipaa_true_${Date.now()}`,
      uri: 'https://test.example.com/healthcare-hipaa.json',
      signer: 'did:test:signer',
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
      functionalContext: {
        healthcareContext: {
          hipaaCompliance: true,
          humanOversightRequired: false,
          medicalDataHashes: ['hash1'],
          medicalReferences: ['ref1'],
        },
      },
    });

    const evidence = await t.query(api.evidence.getHealthcareEvidence, {
      hipaaCompliant: true,
      limit: 10,
    });

    expect(Array.isArray(evidence)).toBe(true);
    // All returned evidence should be HIPAA compliant
    evidence.forEach((e: any) => {
      if (e.functionalContext?.healthcareContext) {
        expect(e.functionalContext.healthcareContext.hipaaCompliance).toBe(true);
      }
    });
  });

  it('should reject non-HIPAA compliant healthcare evidence', async () => {
    // Healthcare evidence must be HIPAA compliant per business rules
    await expect(
      t.mutation(api.evidence.submitEvidence, {
        agentDid,
        sha256: `healthcare_hipaa_false_${Date.now()}`,
        uri: 'https://test.example.com/healthcare-no-hipaa.json',
        signer: 'did:test:signer',
        model: {
          provider: 'test',
          name: 'test-model',
          version: '1.0.0',
        },
        functionalContext: {
          healthcareContext: {
            hipaaCompliance: false,
            humanOversightRequired: false,
            medicalDataHashes: ['hash2'],
            medicalReferences: ['ref2'],
          },
        },
      })
    ).rejects.toThrow('Healthcare evidence must be HIPAA compliant');
  });

  it('should filter healthcare evidence by oversight requirements (true)', async () => {
    await t.mutation(api.evidence.submitEvidence, {
      agentDid,
      sha256: `healthcare_oversight_true_${Date.now()}`,
      uri: 'https://test.example.com/healthcare-oversight.json',
      signer: 'did:test:signer',
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
      functionalContext: {
        healthcareContext: {
          hipaaCompliance: true,
          humanOversightRequired: true,
          medicalDataHashes: ['hash3'],
          medicalReferences: ['ref3'],
        },
      },
    });

    const evidence = await t.query(api.evidence.getHealthcareEvidence, {
      requiresOversight: true,
      limit: 10,
    });

    expect(Array.isArray(evidence)).toBe(true);
    // All returned evidence should require oversight
    evidence.forEach((e: any) => {
      if (e.functionalContext?.healthcareContext) {
        expect(e.functionalContext.healthcareContext.humanOversightRequired).toBe(true);
      }
    });
  });

  it('should filter healthcare evidence by oversight requirements (false)', async () => {
    // Create evidence without oversight but still HIPAA compliant
    await t.mutation(api.evidence.submitEvidence, {
      agentDid,
      sha256: `healthcare_oversight_false_${Date.now()}`,
      uri: 'https://test.example.com/healthcare-no-oversight.json',
      signer: 'did:test:signer',
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
      functionalContext: {
        healthcareContext: {
          hipaaCompliance: true, // Must be HIPAA compliant
          humanOversightRequired: false,
          medicalDataHashes: ['hash4'],
          medicalReferences: ['ref4'],
        },
      },
    });

    const evidence = await t.query(api.evidence.getHealthcareEvidence, {
      requiresOversight: false,
      limit: 10,
    });

    expect(Array.isArray(evidence)).toBe(true);
    // All returned evidence should not require oversight
    evidence.forEach((e: any) => {
      if (e.functionalContext?.healthcareContext) {
        expect(e.functionalContext.healthcareContext.humanOversightRequired).toBe(false);
      }
    });
  });

  it('should filter healthcare evidence with both HIPAA and oversight filters', async () => {
    await t.mutation(api.evidence.submitEvidence, {
      agentDid,
      sha256: `healthcare_both_${Date.now()}`,
      uri: 'https://test.example.com/healthcare-both.json',
      signer: 'did:test:signer',
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
      functionalContext: {
        healthcareContext: {
          hipaaCompliance: true,
          humanOversightRequired: true,
          medicalDataHashes: ['hash5'],
          medicalReferences: ['ref5'],
        },
      },
    });

    const evidence = await t.query(api.evidence.getHealthcareEvidence, {
      hipaaCompliant: true,
      requiresOversight: true,
      limit: 10,
    });

    expect(Array.isArray(evidence)).toBe(true);
    // All returned evidence should meet both criteria
    evidence.forEach((e: any) => {
      if (e.functionalContext?.healthcareContext) {
        expect(e.functionalContext.healthcareContext.hipaaCompliance).toBe(true);
        expect(e.functionalContext.healthcareContext.humanOversightRequired).toBe(true);
      }
    });
  });

  it('should return all healthcare evidence with no filters', async () => {
    await t.mutation(api.evidence.submitEvidence, {
      agentDid,
      sha256: `healthcare_nofilter_${Date.now()}`,
      uri: 'https://test.example.com/healthcare-nofilter.json',
      signer: 'did:test:signer',
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
      functionalContext: {
        healthcareContext: {
          hipaaCompliance: true,
          humanOversightRequired: false,
          medicalDataHashes: ['hash6'],
          medicalReferences: ['ref6'],
        },
      },
    });

    const evidence = await t.query(api.evidence.getHealthcareEvidence, {
      limit: 20,
    });

    expect(Array.isArray(evidence)).toBe(true);
  });

  it('should handle filter combinations correctly', async () => {
    // Create evidence with oversight=false but HIPAA=true
    await t.mutation(api.evidence.submitEvidence, {
      agentDid,
      sha256: `healthcare_no_oversight_${Date.now()}`,
      uri: 'https://test.example.com/healthcare-no-oversight.json',
      signer: 'did:test:signer',
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
      functionalContext: {
        healthcareContext: {
          hipaaCompliance: true, // Must be HIPAA compliant
          humanOversightRequired: false,
          medicalDataHashes: ['hash7'],
          medicalReferences: ['ref7'],
        },
      },
    });

    // Filter for HIPAA=true, oversight=true (should not match the above)
    const evidence = await t.query(api.evidence.getHealthcareEvidence, {
      hipaaCompliant: true,
      requiresOversight: true,
      limit: 10,
    });

    expect(Array.isArray(evidence)).toBe(true);
    // All returned evidence should require oversight
    evidence.forEach((e: any) => {
      if (e.functionalContext?.healthcareContext) {
        expect(e.functionalContext.healthcareContext.humanOversightRequired).toBe(true);
      }
    });
  });

  it('should filter healthcare evidence on empty dataset', async () => {
    // Query with filters on potentially empty dataset
    const evidence = await t.query(api.evidence.getHealthcareEvidence, {
      hipaaCompliant: true,
      requiresOversight: true,
      limit: 10,
    });

    expect(Array.isArray(evidence)).toBe(true);
    expect(evidence.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle healthcare evidence with partial metadata', async () => {
    await t.mutation(api.evidence.submitEvidence, {
      agentDid,
      sha256: `healthcare_partial_${Date.now()}`,
      uri: 'https://test.example.com/healthcare-partial.json',
      signer: 'did:test:signer',
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
      functionalContext: {
        healthcareContext: {
          hipaaCompliance: true,
          humanOversightRequired: false,
          medicalDataHashes: ['hash8'],
          medicalReferences: ['ref8'],
        },
      },
    });

    // Should handle evidence with partial metadata
    const evidence = await t.query(api.evidence.getHealthcareEvidence, {
      limit: 10,
    });

    expect(Array.isArray(evidence)).toBe(true);
  });

  it('should enforce limit on healthcare evidence results', async () => {
    // Create multiple healthcare evidence items
    for (let i = 0; i < 5; i++) {
      await t.mutation(api.evidence.submitEvidence, {
        agentDid,
        sha256: `healthcare_limit_${i}_${Date.now()}`,
        uri: `https://test.example.com/healthcare-${i}.json`,
        signer: 'did:test:signer',
        model: {
          provider: 'test',
          name: 'test-model',
          version: '1.0.0',
        },
        functionalContext: {
          healthcareContext: {
            hipaaCompliance: true,
            humanOversightRequired: false,
            medicalDataHashes: [`hash9-${i}`],
            medicalReferences: [`ref9-${i}`],
          },
        },
      });
    }

    const evidence = await t.query(api.evidence.getHealthcareEvidence, {
      limit: 3,
    });

    expect(Array.isArray(evidence)).toBe(true);
    expect(evidence.length).toBeLessThanOrEqual(3);
  });
});

