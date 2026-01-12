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
  evidenceId: Id<'evidenceManifests'>;
}

/**
 * Setup test agents with public keys
 */
export async function setupTestAgents(t: ReturnType<typeof convexTest>) {
  const timestamp = Date.now();
  const testPublicKey = "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk";
  const defendantPublicKey = "ZGVmZW5kYW50X3B1YmxpY19rZXlfMzJfYnl0ZXNfYmFzZTY0X2VuY29kZWQ";
  
  // Create plaintiff agent
  const plaintiff = await t.mutation(api.agents.joinAgent, {
    name: 'API Test Plaintiff',
    publicKey: testPublicKey,
    organizationName: `Plaintiff Corp ${timestamp}`,
    functionalType: 'general',
  });
  
  // Create defendant agent
  const defendant = await t.mutation(api.agents.joinAgent, {
    name: 'API Test Defendant',
    publicKey: defendantPublicKey,
    organizationName: `Defendant Corp ${timestamp}`,
    functionalType: 'api',
  });
  
  const ownerDid = `did:owner:org-plaintiff-corp-${timestamp}`; // For backwards compatibility
  
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

// -----------------------------------------------------------------------------
// Wallet-first (canonical) HTTP helpers
// -----------------------------------------------------------------------------

type WalletFirstRefundCreateArgs = {
  blockchain?: "base" | "solana";
  transactionHash: string;
  sellerEndpointUrl: string;
  description: string;
  evidenceUrls?: string[];
  sourceTransferLogIndex?: number;
};

export async function httpPostV1Refunds(args: WalletFirstRefundCreateArgs): Promise<{
  status: number;
  json: any;
}> {
  const base = process.env.API_BASE_URL || "https://youthful-orca-358.convex.site";
  const res = await fetch(`${base}/v1/refunds`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      blockchain: args.blockchain ?? "base",
      transactionHash: args.transactionHash,
      sellerEndpointUrl: args.sellerEndpointUrl,
      description: args.description,
      evidenceUrls: Array.isArray(args.evidenceUrls) ? args.evidenceUrls : [],
      ...(typeof args.sourceTransferLogIndex === "number" ? { sourceTransferLogIndex: args.sourceTransferLogIndex } : {}),
    }),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

export async function httpGetV1Refund(caseId: string): Promise<{
  status: number;
  json: any;
}> {
  const base = process.env.API_BASE_URL || "https://youthful-orca-358.convex.site";
  const res = await fetch(`${base}/v1/refund?id=${encodeURIComponent(caseId)}`, {
    method: "GET",
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
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

