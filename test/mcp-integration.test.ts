import { describe, it, expect, beforeEach } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../convex/_generated/api';
import schema from '../convex/schema';

/**
 * MCP Integration Tests (Unit)
 * 
 * Tests MCP tool definitions and integration logic without HTTP:
 * - Tool discovery
 * - Tool schema validation
 * - Agent registration via MCP
 * - Case filing via MCP
 */

describe('MCP - Tool Definitions', () => {
  it('should export 3 simplified MCP tools', async () => {
    const { MCP_TOOLS } = await import('../convex/mcp');
    
    expect(MCP_TOOLS).toBeDefined();
    expect(Array.isArray(MCP_TOOLS)).toBe(true);
    expect(MCP_TOOLS.length).toBe(3); // Simplified: file_dispute, list_my_cases, check_case_status
  });

  it('should have valid tool schemas', async () => {
    const { MCP_TOOLS } = await import('../convex/mcp');
    
    for (const tool of MCP_TOOLS) {
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('input_schema');
      expect(tool.input_schema).toHaveProperty('type', 'object');
      expect(tool.input_schema).toHaveProperty('properties');
      expect(tool.input_schema).toHaveProperty('required');
      expect(Array.isArray(tool.input_schema.required)).toBe(true);
    }
  });

  it('should include consulate_file_dispute tool with improved schema', async () => {
    const { MCP_TOOLS } = await import('../convex/mcp');
    
    const tool = MCP_TOOLS.find(t => t.name === 'consulate_file_dispute');
    expect(tool).toBeDefined();
    expect(tool?.description).toContain('payment dispute');
    
    // Check for X-402 ultra-minimal schema (8 required fields)
    expect(tool?.input_schema.required).toContain('plaintiff');  // Ethereum address
    expect(tool?.input_schema.required).toContain('defendant');  // Ethereum address
    expect(tool?.input_schema.required).toContain('disputeUrl');
    expect(tool?.input_schema.required).toContain('description');
    expect(tool?.input_schema.required).toContain('request');  // Object
    expect(tool?.input_schema.required).toContain('response');  // Object
    expect(tool?.input_schema.required).toContain('transactionHash');
    expect(tool?.input_schema.required).toContain('blockchain');
    
    // These are now derived from blockchain or optional
    expect(tool?.input_schema.required).not.toContain('amountUsd');
    expect(tool?.input_schema.required).not.toContain('currency');
    expect(tool?.input_schema.required).not.toContain('fromAddress');
    expect(tool?.input_schema.required).not.toContain('toAddress');
    
    // Check for Ethereum address validation
    expect(tool?.input_schema.properties.plaintiff.pattern).toContain('0x');
    expect(tool?.input_schema.properties.defendant.pattern).toContain('0x');
    expect(tool?.input_schema.properties.blockchain.enum).toBeDefined(); // Enum validation
    expect(tool?.input_schema.properties.dryRun).toBeDefined();
    expect(tool?.returns).toBeDefined();
  });

  it('should include consulate_check_case_status tool', async () => {
    const { MCP_TOOLS } = await import('../convex/mcp');
    
    const tool = MCP_TOOLS.find(t => t.name === 'consulate_check_case_status');
    expect(tool).toBeDefined();
    expect(tool?.input_schema.required).toContain('caseId');
  });

  it('should include consulate_list_my_cases tool', async () => {
    const { MCP_TOOLS } = await import('../convex/mcp');
    
    const tool = MCP_TOOLS.find(t => t.name === 'consulate_list_my_cases');
    expect(tool).toBeDefined();
    expect(tool?.input_schema.required).toContain('walletAddress');
  });
});

describe('MCP - Schema Improvements', () => {
  it('should have Ethereum address validation for plaintiff/defendant fields', async () => {
    const { MCP_TOOLS } = await import('../convex/mcp');

    const fileDisputeTool = MCP_TOOLS.find(t => t.name === 'consulate_file_dispute');
    const plaintiff = fileDisputeTool?.input_schema.properties.plaintiff;
    const defendant = fileDisputeTool?.input_schema.properties.defendant;

    expect(plaintiff).toBeDefined();
    expect(defendant).toBeDefined();
    expect(plaintiff?.pattern).toContain('0x[a-fA-F0-9]{40}');
    expect(defendant?.pattern).toContain('0x[a-fA-F0-9]{40}');
    expect(plaintiff?.examples).toBeDefined();
    expect(plaintiff?.examples?.length).toBeGreaterThan(0);
  });

  it('should have contentEncoding for optional sellerXSignature field', async () => {
    const { MCP_TOOLS } = await import('../convex/mcp');
    
    const fileDisputeTool = MCP_TOOLS.find(t => t.name === 'consulate_file_dispute');
    const sellerXSignature = fileDisputeTool?.input_schema.properties.sellerXSignature;
    
    expect(sellerXSignature).toBeDefined();
    expect(sellerXSignature?.contentEncoding).toBe('base64');
    expect(sellerXSignature?.examples).toBeDefined();
    
    // sellerXSignature is optional (not required)
    expect(fileDisputeTool?.input_schema.required).not.toContain('sellerXSignature');
  });

  it('should have dryRun parameter for testing', async () => {
    const { MCP_TOOLS } = await import('../convex/mcp');
    
    const fileDisputeTool = MCP_TOOLS.find(t => t.name === 'consulate_file_dispute');
    const dryRun = fileDisputeTool?.input_schema.properties.dryRun;
    
    expect(dryRun).toBeDefined();
    expect(dryRun?.type).toBe('boolean');
    expect(dryRun?.default).toBe(false);
    expect(dryRun?.description).toContain('validates');
  });
});

describe('MCP - Tool Workflows', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
  });

  it('should support agent registration workflow', async () => {
    const timestamp = Date.now();
    
    // Setup organization and API key
    const orgId = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "MCP Test Org",
        domain: `mcp-test-${timestamp}.com`,
        createdAt: Date.now(),
      });
    });
    
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkUserId: `mcp-test-${timestamp}`,
        email: `mcp-test-${timestamp}@test.com`,
        organizationId: orgId,
        role: "admin",
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      });
    });
    
    const testPublicKey = "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk";
    
    // Register agent (simulating MCP tool invocation)
    const agent = await t.mutation(api.agents.joinAgent, {
      name: 'MCP Test Agent',
      publicKey: testPublicKey,
      organizationName: `MCP Test Org ${Date.now()}`,
      functionalType: 'api',
      mock: false,
    });
    
    expect(agent.did).toBeDefined();
    expect(agent.did).toMatch(/^did:agent:/);
    
    // Verify agent was created
    const fetchedAgent = await t.query(api.agents.getAgent, { did: agent.did });
    expect(fetchedAgent).toBeDefined();
    expect(fetchedAgent?.name).toBe('MCP Test Agent');
  });

  it('should support evidence submission workflow', async () => {
    const timestamp = Date.now();
    
    // Setup
    const orgId = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Evidence Org",
        domain: `evidence-${timestamp}.com`,
        createdAt: Date.now(),
      });
    });
    
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkUserId: `evidence-${timestamp}`,
        email: `evidence-${timestamp}@test.com`,
        organizationId: orgId,
        role: "admin",
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      });
    });
    
    const testPublicKey = "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk";
    
    const agent = await t.mutation(api.agents.joinAgent, {
      name: 'Evidence Agent',
      publicKey: testPublicKey,
      organizationName: `MCP Evidence Org ${Date.now()}`,
      functionalType: 'api',
    });
    
    // Submit evidence (simulating MCP tool)
    const evidenceId = await t.mutation(api.evidence.submitEvidence, {
      agentDid: agent.did,
      sha256: `mcp_evidence_${timestamp}`,
      uri: 'https://example.com/evidence.json',
      signer: agent.did,
      model: {
        provider: 'mcp-test',
        name: 'test-model',
        version: '1.0.0',
      },
    });
    
    expect(evidenceId).toBeDefined();
    
    // Verify evidence
    const evidence = await t.query(api.evidence.getEvidence, { evidenceId });
    expect(evidence).toBeDefined();
    expect(evidence?.agentDid).toBe(agent.did);
  });

  it('should support case filing workflow', async () => {
    const timestamp = Date.now();
    
    // Setup plaintiff
    const plaintiffOrgId = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Plaintiff Org",
        domain: `plaintiff-${timestamp}.com`,
        createdAt: Date.now(),
      });
    });
    
    const plaintiffUserId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkUserId: `plaintiff-${timestamp}`,
        email: `plaintiff-${timestamp}@test.com`,
        organizationId: plaintiffOrgId,
        role: "admin",
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      });
    });
    
    const testPublicKey = "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk";
    
    const plaintiff = await t.mutation(api.agents.joinAgent, {
      name: 'Plaintiff Agent',
      publicKey: testPublicKey,
      organizationName: `MCP Plaintiff Org ${Date.now()}`,
      functionalType: 'api',
    });
    
    // Setup defendant
    const defendantOrgId = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Defendant Org",
        domain: `defendant-${timestamp}.com`,
        createdAt: Date.now(),
      });
    });
    
    const defendantUserId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkUserId: `defendant-${timestamp}`,
        email: `defendant-${timestamp}@test.com`,
        organizationId: defendantOrgId,
        role: "admin",
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      });
    });
    
    const defendantPublicKey = "ZGVmZW5kYW50X3B1YmxpY19rZXlfMzJfYnl0ZXNfYmFzZTY0X2VuY29kZWQ";
    
    const defendant = await t.mutation(api.agents.joinAgent, {
      name: 'Defendant Agent',
      publicKey: defendantPublicKey,
      organizationName: `MCP Defendant Org ${Date.now()}`,
      functionalType: 'api',
    });
    
    // Submit evidence
    const evidenceId = await t.mutation(api.evidence.submitEvidence, {
      agentDid: plaintiff.did,
      sha256: `case_evidence_${timestamp}`,
      uri: 'https://example.com/case-evidence.json',
      signer: plaintiff.did,
      model: {
        provider: 'test',
        name: 'test-model',
        version: '1.0.0',
      },
    });
    
    // File dispute (simulating MCP tool)
    const caseResult = await t.mutation(api.cases.fileDispute, {
      plaintiff: plaintiff.did,
      defendant: defendant.did,
      type: 'SLA_BREACH',
      jurisdictionTags: ['MCP_TEST'],
      evidenceIds: [evidenceId],
      description: 'MCP test dispute case',
      claimedDamages: 10000,
    });
    const caseId = caseResult.caseId;
    
    expect(caseId).toBeDefined();
    
    // Check case status (simulating MCP tool)
    const case_ = await t.query(api.cases.getCaseById, { caseId });
    expect(case_).toBeDefined();
    expect(case_?.plaintiff).toBe(plaintiff.did);
    expect(case_?.defendant).toBe(defendant.did);
    expect(case_?.status).toBe('FILED');
  });

  it('should support list my cases workflow', async () => {
    const timestamp = Date.now();
    
    // Setup
    const orgId = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Cases Org",
        domain: `cases-${timestamp}.com`,
        createdAt: Date.now(),
      });
    });
    
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkUserId: `cases-${timestamp}`,
        email: `cases-${timestamp}@test.com`,
        organizationId: orgId,
        role: "admin",
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      });
    });
    
    const testPublicKey = "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk";
    
    const agent = await t.mutation(api.agents.joinAgent, {
      name: 'Cases Agent',
      publicKey: testPublicKey,
      organizationName: `MCP Cases Org ${Date.now()}`,
      functionalType: 'api',
    });
    
    // List cases (simulating MCP tool)
    const cases = await t.query(api.cases.getCasesByParty, {
      agentDid: agent.did,
    });
    
    expect(Array.isArray(cases)).toBe(true);
    // New agent should have no cases
    expect(cases.length).toBe(0);
  });

  it('should support agent lookup workflow', async () => {
    const timestamp = Date.now();
    
    // Create an agent to lookup
    const orgId = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Lookup Test Corp",
        domain: `lookup-${timestamp}.com`,
        createdAt: Date.now(),
      });
    });
    
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkUserId: `lookup-${timestamp}`,
        email: `lookup-${timestamp}@test.com`,
        organizationId: orgId,
        role: "admin",
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      });
    });
    
    const testPublicKey = "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk";
    
    await t.mutation(api.agents.joinAgent, {
      name: 'Lookup Test Agent',
      publicKey: testPublicKey,
      organizationName: `MCP Lookup Org ${Date.now()}`,
      functionalType: 'api',
    });
    
    // Lookup agents (simulating MCP tool)
    const agents = await t.query(api.agents.listAgents, { limit: 100 });
    
    expect(Array.isArray(agents)).toBe(true);
    expect(agents.length).toBeGreaterThan(0);
    
    // Find our agent
    const foundAgent = agents.find(a => a.name === 'Lookup Test Agent');
    expect(foundAgent).toBeDefined();
    expect(foundAgent?.functionalType).toBe('api');
  });
});

