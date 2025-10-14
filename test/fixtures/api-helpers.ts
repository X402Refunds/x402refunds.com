import { convexTest } from 'convex-test';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

/**
 * Shared test utilities for API endpoint testing
 */

export interface TestAgent {
  did: string;
  _id: Id<'agents'>;
  ownerDid: string;
}

export interface TestCase {
  caseId: Id<'cases'>;
  plaintiff: string;
  defendant: string;
  evidenceId: Id<'evidence'>;
}

/**
 * Setup test agents with owners
 */
export async function setupTestAgents(t: ReturnType<typeof convexTest>) {
  const timestamp = Date.now();
  
  // Create owner
  const ownerDid = `did:test:api-owner-${timestamp}`;
  await t.mutation(api.auth.createOwner, {
    did: ownerDid,
    name: 'API Test Owner',
    email: `api-test-${timestamp}@example.com`,
  });
  
  // Create plaintiff agent
  const plaintiff = await t.mutation(api.agents.joinAgent, {
    ownerDid,
    name: 'API Test Plaintiff',
    organizationName: `Plaintiff Corp ${timestamp}`,
    functionalType: 'general',
  });
  
  // Create defendant agent
  const defendant = await t.mutation(api.agents.joinAgent, {
    ownerDid,
    name: 'API Test Defendant',
    organizationName: `Defendant Corp ${timestamp}`,
    functionalType: 'api',
  });
  
  return {
    ownerDid,
    plaintiff: {
      did: plaintiff.did,
      _id: (await t.query(api.agents.getAgent, { did: plaintiff.did }))!._id,
      ownerDid,
    } as TestAgent,
    defendant: {
      did: defendant.did,
      _id: (await t.query(api.agents.getAgent, { did: defendant.did }))!._id,
      ownerDid,
    } as TestAgent,
  };
}

/**
 * Create a test dispute case with evidence
 */
export async function createTestCase(
  t: ReturnType<typeof convexTest>,
  plaintiff: string,
  defendant: string
): Promise<TestCase> {
  // Submit evidence
  const evidenceId = await t.mutation(api.evidence.submitEvidence, {
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
  
  // File dispute
  const caseId = await t.mutation(api.cases.fileDispute, {
    plaintiff,
    defendant,
    type: 'SLA_BREACH',
    jurisdictionTags: ['test'],
    evidenceIds: [evidenceId],
    description: 'Test dispute for API testing',
  });
  
  return {
    caseId,
    plaintiff,
    defendant,
    evidenceId,
  };
}

/**
 * Validate response matches AAP spec format
 */
export function validateAAPFormat(response: any, expectedFields: string[]) {
  for (const field of expectedFields) {
    if (!(field in response)) {
      throw new Error(`Missing required AAP field: ${field}`);
    }
  }
  return true;
}

/**
 * Validate AAP service manifest format
 */
export function validateADPManifest(manifest: any) {
  const requiredFields = [
    'arbitrationService',
    'protocolVersion',
    'supportedRules',
    'supportedEvidenceTypes',
    'features',
    'endpoints',
  ];
  
  validateAAPFormat(manifest, requiredFields);
  
  // Validate features object
  if (typeof manifest.features !== 'object') {
    throw new Error('features must be an object');
  }
  
  // Validate endpoints object
  if (typeof manifest.endpoints !== 'object') {
    throw new Error('endpoints must be an object');
  }
  
  return true;
}

/**
 * Validate chain of custody format
 */
export function validateCustodyChain(chain: any) {
  const requiredFields = ['caseId', 'case', 'evidence', 'events', 'verification'];
  validateAAPFormat(chain, requiredFields);
  
  // Validate case object
  if (!chain.case.plaintiff || !chain.case.defendant) {
    throw new Error('case must contain plaintiff and defendant');
  }
  
  // Validate evidence array
  if (!Array.isArray(chain.evidence)) {
    throw new Error('evidence must be an array');
  }
  
  // Validate events array
  if (!Array.isArray(chain.events)) {
    throw new Error('events must be an array');
  }
  
  // Validate verification object
  if (!chain.verification.chainValid) {
    throw new Error('custody chain must be valid');
  }
  
  return true;
}

/**
 * Create test event
 */
export async function createTestEvent(
  t: ReturnType<typeof convexTest>,
  type: string,
  agentDid: string,
  payload?: any
) {
  // Events are created automatically by the system, but we can trigger them
  // by performing actions that create events
  return { type, agentDid, payload };
}

/**
 * Wait for condition with timeout
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Generate random test data
 */
export function generateTestData() {
  const timestamp = Date.now();
  return {
    did: `did:test:${timestamp}`,
    organizationName: `Test Org ${timestamp}`,
    email: `test-${timestamp}@example.com`,
    sha256: `sha256_${timestamp}_${Math.random().toString(36).substring(7)}`,
    uri: `https://test.example.com/evidence-${timestamp}.json`,
  };
}

