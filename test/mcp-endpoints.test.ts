import { describe, it, expect, beforeAll } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../convex/_generated/api';
import schema from '../convex/schema';
import { API_BASE_URL, USE_LIVE_API } from './fixtures';
import { Id } from '../convex/_generated/dataModel';

/**
 * MCP (Model Context Protocol) Endpoints Tests
 * 
 * Tests for MCP integration endpoints:
 * - GET /.well-known/mcp.json (discovery)
 * - POST /mcp/invoke (tool invocation with API key auth)
 * 
 * Authentication: API Keys (Bearer tokens)
 * 
 * All 8 MCP tools tested via discovery endpoint and invocation.
 */

describe('MCP Protocol - Tool Discovery', () => {
  describe('GET /.well-known/mcp.json', () => {
    it('should return MCP tool manifest', async () => {
      const response = await fetch(`${API_BASE_URL}/.well-known/mcp.json`);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
      
      const manifest = await response.json();
      expect(manifest.tools).toBeDefined();
      expect(Array.isArray(manifest.tools)).toBe(true);
    });

    it('should include tool metadata', async () => {
      const response = await fetch(`${API_BASE_URL}/.well-known/mcp.json`);
      const manifest = await response.json();
      
      expect(manifest.protocol).toBe('mcp');
      expect(manifest.version).toBeDefined();
      expect(manifest.server).toBeDefined();
      expect(manifest.server.name).toBe('Consulate Dispute Resolution Platform');
    });

    it('should list all 8 MCP tools', async () => {
      const response = await fetch(`${API_BASE_URL}/.well-known/mcp.json`);
      const manifest = await response.json();
      
      const toolNames = manifest.tools.map((t: any) => t.name);
      const expectedTools = [
        'consulate_file_dispute',
        'consulate_submit_evidence',
        'consulate_check_case_status',
        'consulate_register_agent',
        'consulate_list_my_cases',
        'consulate_get_sla_status',
        'consulate_lookup_agent',
        'consulate_request_vendor_registration',
      ];
      
      expect(manifest.tools.length).toBe(8);
      for (const expectedTool of expectedTools) {
        expect(toolNames).toContain(expectedTool);
      }
    });

    it('should include tool descriptions', async () => {
      const response = await fetch(`${API_BASE_URL}/.well-known/mcp.json`);
      const manifest = await response.json();
      
      const allHaveDescriptions = manifest.tools.every(
        (tool: any) => tool.description && tool.description.length > 0
      );
      expect(allHaveDescriptions).toBe(true);
    });

    it('should define tool input schemas', async () => {
      const response = await fetch(`${API_BASE_URL}/.well-known/mcp.json`);
      const manifest = await response.json();
      
      const allHaveSchemas = manifest.tools.every(
        (tool: any) => tool.input_schema && 
          (tool.input_schema.type || tool.input_schema.properties)
      );
      expect(allHaveSchemas).toBe(true);
    });

    it('should specify authentication requirements', async () => {
      const response = await fetch(`${API_BASE_URL}/.well-known/mcp.json`);
      const manifest = await response.json();
      
      expect(manifest.authentication).toBeDefined();
      expect(manifest.authentication.type).toBe('signature');
      expect(manifest.authentication.algorithm).toBe('Ed25519');
      expect(manifest.authentication.description).toContain('Cryptographic signature');
    });

    it('should include CORS headers', async () => {
      const response = await fetch(`${API_BASE_URL}/.well-known/mcp.json`);
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });
  });
});

describe('MCP Protocol - Authentication', () => {
  let t: ReturnType<typeof convexTest>;
  let validApiKey: string;
  let testOrgId: Id<"organizations">;
  let testUserId: Id<"users">;

  beforeAll(async () => {
    if (!USE_LIVE_API) {
      const modules = import.meta.glob('../convex/**/*.{ts,js}');
      t = convexTest(schema, modules);
      
      // Create organization
      testOrgId = await t.run(async (ctx) => {
        return await ctx.db.insert("organizations", {
          name: "MCP Test Org",
          domain: "mcptest.com",
          createdAt: Date.now(),
        });
      });

      // Create user
      testUserId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          clerkId: `clerk_mcp_${Date.now()}`,
          email: "mcp@test.com",
          name: "MCP Test User",
          organizationId: testOrgId,
          role: "admin",
          createdAt: Date.now(),
        });
      });

      // Create API key
      const apiKeyResult = await t.mutation(api.apiKeys.generateApiKey, {
        userId: testUserId,
        name: "MCP Test Key",
      });
      validApiKey = apiKeyResult.key;
    }
  });

  describe('POST /mcp/invoke - Auth', () => {
    it.skipIf(USE_LIVE_API)('should reject missing Authorization header', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'consulate_check_case_status',
          parameters: { caseId: '123' },
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Authentication required');
    });

    it.skipIf(USE_LIVE_API)('should reject invalid Bearer token format', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic invalid-format',
        },
        body: JSON.stringify({
          tool: 'consulate_check_case_status',
          parameters: { caseId: '123' },
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Authentication required');
    });

    it.skipIf(USE_LIVE_API)('should reject invalid API key', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer fake_invalid_key_12345',
        },
        body: JSON.stringify({
          tool: 'consulate_check_case_status',
          parameters: { caseId: '123' },
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Invalid or expired API key');
    });

    it.skipIf(USE_LIVE_API)('should accept valid Bearer token', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validApiKey}`,
        },
        body: JSON.stringify({
          tool: 'consulate_list_my_cases',
          parameters: { 
            agentDid: 'did:agent:test-12345' 
          },
        }),
      });

      // Should succeed (200) or fail for business logic reasons (400/404), not auth (401)
      expect(response.status).not.toBe(401);
    });
  });
});

describe('MCP Protocol - Tool Invocation', () => {
  let t: ReturnType<typeof convexTest>;
  let validApiKey: string;
  let testAgentDid: string;
  let testDefendantDid: string;
  let plaintiffApiKey: string;
  let defendantApiKey: string;
  let testCaseId: Id<"cases"> | null = null;

  beforeAll(async () => {
    if (!USE_LIVE_API) {
      const modules = import.meta.glob('../convex/**/*.{ts,js}');
      t = convexTest(schema, modules);
      
      // Create plaintiff organization
      const plaintiffOrgId = await t.run(async (ctx) => {
        return await ctx.db.insert("organizations", {
          name: "MCP Plaintiff Org",
          domain: "mcpplaintiff.com",
          createdAt: Date.now(),
        });
      });

      // Create plaintiff user
      const plaintiffUserId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          clerkId: `clerk_plaintiff_${Date.now()}`,
          email: "plaintiff@mcptest.com",
          name: "Plaintiff User",
          organizationId: plaintiffOrgId,
          role: "admin",
          createdAt: Date.now(),
        });
      });

      // Create plaintiff API key
      const plaintiffKeyResult = await t.mutation(api.apiKeys.generateApiKey, {
        userId: plaintiffUserId,
        name: "Plaintiff Test Key",
      });
      plaintiffApiKey = plaintiffKeyResult.key;
      validApiKey = plaintiffApiKey;

      // Register plaintiff agent
      const plaintiffResult = await t.mutation(api.agents.joinAgent, {
        apiKey: plaintiffApiKey,
        name: 'MCP Plaintiff Agent',
        functionalType: 'ai_consumer',
        mock: false,
      });
      testAgentDid = plaintiffResult.did;

      // Create defendant organization
      const defendantOrgId = await t.run(async (ctx) => {
        return await ctx.db.insert("organizations", {
          name: "MCP Defendant Org",
          domain: "mcpdefendant.com",
          createdAt: Date.now(),
        });
      });

      // Create defendant user
      const defendantUserId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          clerkId: `clerk_defendant_${Date.now()}`,
          email: "defendant@mcptest.com",
          name: "Defendant User",
          organizationId: defendantOrgId,
          role: "admin",
          createdAt: Date.now(),
        });
      });

      // Create defendant API key
      const defendantKeyResult = await t.mutation(api.apiKeys.generateApiKey, {
        userId: defendantUserId,
        name: "Defendant Test Key",
      });
      defendantApiKey = defendantKeyResult.key;

      // Register defendant agent
      const defendantResult = await t.mutation(api.agents.joinAgent, {
        apiKey: defendantApiKey,
        name: 'MCP Defendant Agent',
        functionalType: 'ai_provider',
        mock: false,
      });
      testDefendantDid = defendantResult.did;
    }
  });

  describe('consulate_register_agent', () => {
    it.skipIf(USE_LIVE_API)('should register new agent', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validApiKey}`,
        },
        body: JSON.stringify({
          tool: 'consulate_register_agent',
          parameters: {
            name: `MCP New Agent ${Date.now()}`,
            functionalType: 'monitoring',
          },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.agentDid).toBeDefined();
      expect(data.agentId).toBeDefined();
      expect(data.message).toContain('registered successfully');
    });
  });

  describe('consulate_submit_evidence', () => {
    it.skipIf(USE_LIVE_API)('should submit evidence', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validApiKey}`,
        },
        body: JSON.stringify({
          tool: 'consulate_submit_evidence',
          parameters: {
            agentDid: testAgentDid,
            sha256: `sha256_mcp_test_${Date.now()}`,
            evidenceUrl: 'https://example.com/evidence.json',
            caseId: 'optional-case-id',
          },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.evidenceId).toBeDefined();
    });
  });

  describe('consulate_file_dispute', () => {
    it.skipIf(USE_LIVE_API)('should file dispute', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validApiKey}`,
        },
        body: JSON.stringify({
          tool: 'consulate_file_dispute',
          parameters: {
            plaintiff: testAgentDid,
            defendant: testDefendantDid,
            disputeType: 'SLA_BREACH',
            claim: 'API latency exceeded 500ms SLA threshold',
            claimAmount: 1000,
            jurisdiction: 'US',
          },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.caseId).toBeDefined();
      expect(data.trackingUrl).toContain('/cases/');
      
      // Save for later tests
      testCaseId = data.caseId;
    });
  });

  describe('consulate_check_case_status', () => {
    it.skipIf(USE_LIVE_API)('should check case status', async () => {
      // First file a case
      const fileResponse = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validApiKey}`,
        },
        body: JSON.stringify({
          tool: 'consulate_file_dispute',
          parameters: {
            plaintiff: testAgentDid,
            defendant: testDefendantDid,
            disputeType: 'CONTRACT_BREACH',
            claim: 'Test claim for status check',
            claimAmount: 500,
          },
        }),
      });
      const fileData = await fileResponse.json();
      const caseId = fileData.caseId;

      // Then check status
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validApiKey}`,
        },
        body: JSON.stringify({
          tool: 'consulate_check_case_status',
          parameters: { caseId },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.case).toBeDefined();
      expect(data.case._id).toBe(caseId);
    });
  });

  describe('consulate_list_my_cases', () => {
    it.skipIf(USE_LIVE_API)('should list agent cases', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validApiKey}`,
        },
        body: JSON.stringify({
          tool: 'consulate_list_my_cases',
          parameters: {
            agentDid: testAgentDid,
            status: 'all',
          },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.agentDid).toBe(testAgentDid);
      expect(data.totalCases).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(data.cases)).toBe(true);
    });

    it.skipIf(USE_LIVE_API)('should filter cases by status', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validApiKey}`,
        },
        body: JSON.stringify({
          tool: 'consulate_list_my_cases',
          parameters: {
            agentDid: testAgentDid,
            status: 'FILED',
          },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.cases)).toBe(true);
    });
  });

  describe('consulate_get_sla_status', () => {
    it.skipIf(USE_LIVE_API)('should get SLA status', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validApiKey}`,
        },
        body: JSON.stringify({
          tool: 'consulate_get_sla_status',
          parameters: { agentDid: testAgentDid },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.agentDid).toBe(testAgentDid);
      expect(data.slaStatus).toBeDefined();
      expect(data.slaStatus.currentStanding).toBeDefined();
      expect(data.slaStatus.totalDisputes).toBeGreaterThanOrEqual(0);
    });

    it.skipIf(USE_LIVE_API)('should return 404 for non-existent agent', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validApiKey}`,
        },
        body: JSON.stringify({
          tool: 'consulate_get_sla_status',
          parameters: { agentDid: 'did:agent:nonexistent-999999' },
        }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('not found');
    });
  });

  describe('consulate_lookup_agent', () => {
    it.skipIf(USE_LIVE_API)('should find agents by organization', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validApiKey}`,
        },
        body: JSON.stringify({
          tool: 'consulate_lookup_agent',
          parameters: {
            query: 'MCP Plaintiff',
            functionalType: 'ai_consumer',
          },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.matches).toBeDefined();
      expect(Array.isArray(data.matches)).toBe(true);
      expect(data.matches.length).toBeGreaterThan(0);
    });

    it.skipIf(USE_LIVE_API)('should return helpful suggestions when no match', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validApiKey}`,
        },
        body: JSON.stringify({
          tool: 'consulate_lookup_agent',
          parameters: {
            query: 'Nonexistent Company XYZ 99999',
          },
        }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('No agents found');
      expect(data.suggestions).toBeDefined();
      expect(Array.isArray(data.suggestions)).toBe(true);
    });
  });

  describe('consulate_request_vendor_registration', () => {
    it.skipIf(USE_LIVE_API)('should submit vendor registration request', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validApiKey}`,
        },
        body: JSON.stringify({
          tool: 'consulate_request_vendor_registration',
          parameters: {
            vendorName: 'Test AI Vendor Corp',
            domain: 'testaivendor.com',
            serviceType: 'LLM API',
            reasonForRequest: 'Need to file SLA breach dispute',
            urgency: 'high',
          },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.requestId).toBeDefined();
      expect(data.requestId).toMatch(/^vr_/);
      expect(data.message).toContain('registration request submitted');
      expect(data.expectedResponseTime).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it.skipIf(USE_LIVE_API)('should reject unknown tool', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validApiKey}`,
        },
        body: JSON.stringify({
          tool: 'nonexistent_tool_xyz',
          parameters: {},
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Unknown tool');
      expect(data.availableTools).toBeDefined();
      expect(Array.isArray(data.availableTools)).toBe(true);
    });

    it.skipIf(USE_LIVE_API)('should handle malformed JSON', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validApiKey}`,
        },
        body: 'invalid json {{{',
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it.skipIf(USE_LIVE_API)('should handle missing parameters', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validApiKey}`,
        },
        body: JSON.stringify({
          tool: 'consulate_file_dispute',
          parameters: {
            // Missing required fields
            plaintiff: testAgentDid,
          },
        }),
      });

      expect([400, 500]).toContain(response.status);
    });
  });
});
