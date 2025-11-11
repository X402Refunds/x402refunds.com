import { describe, it, expect } from 'vitest';
import { API_BASE_URL, USE_LIVE_API } from './fixtures';

/**
 * MCP (Model Context Protocol) Endpoints Tests - Pure HTTP Testing
 *
 * Tests for MCP integration endpoints:
 * - GET /.well-known/mcp.json (discovery)
 * - POST /mcp/invoke (authentication and error handling)
 *
 * IMPORTANT: These are pure HTTP tests that validate error responses and discovery.
 * They do NOT use convex-test (in-memory database) because that creates a separate database
 * from the deployed HTTP endpoints. All tests hit real HTTP endpoints directly.
 *
 * Tests focus on:
 * - MCP protocol compliance (discovery manifest)
 * - Authentication failures (401 errors)
 * - Error handling (400/500 errors)
 *
 * Note: Testing successful tool invocations requires valid API keys and test data,
 * which would require hybrid testing. Those tests are in unit tests instead.
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
      expect(manifest.server.name).toBe('x402disputes.com - Permissionless X-402 Dispute Resolution');
      expect(manifest.server.dispute_types).toContain('Payment disputes only');
      expect(manifest.server.pricing).toBeDefined();
      expect(manifest.server.pricing.flat_fee).toBe('$0.05 per dispute');
    });

    it('should list all 3 X-402 MCP tools', async () => {
      const response = await fetch(`${API_BASE_URL}/.well-known/mcp.json`);
      const manifest = await response.json();
      
      const toolNames = manifest.tools.map((t: any) => t.name);
      const expectedTools = [
        "x402_file_dispute",
        "x402_list_my_cases",
        "x402_check_case_status"
      ];
      
      expect(manifest.tools.length).toBe(3);
      // Check for the 3 X-402 tools
      for (const expectedTool of expectedTools) {
        expect(toolNames).toContain(expectedTool);
      }
      // Verify old tools are removed
      expect(toolNames).not.toContain('consulate_file_general_dispute');
      expect(toolNames).not.toContain('consulate_file_dispute');
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
      expect(manifest.authentication.type).toBe('optional');
      expect(manifest.authentication.description).toContain('optional');
      expect(manifest.authentication.optional_auth).toBeDefined();
      expect(manifest.authentication.optional_auth.type).toBe('signature');
      expect(manifest.authentication.optional_auth.algorithm).toBe('Ed25519');
    });

    it('should include CORS headers', async () => {
      const response = await fetch(`${API_BASE_URL}/.well-known/mcp.json`);
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });
  });
});

describe('MCP Protocol - Authentication', () => {
  // MCP endpoints are publicly accessible - authentication is optional
  // Agent identity is verified via Ed25519 signatures on signed evidence

  describe('POST /mcp/invoke - Public Access', () => {
    it('should allow public access without Authorization header', async () => {
      const testPublicKey = "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk";
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'x402_file_dispute', // Using x402_file_dispute instead of non-existent register tool
          parameters: {
            name: 'Test Agent',
            publicKey: testPublicKey,
            organizationName: 'Test Org',
            functionalType: 'api'
          },
        }),
      });

      // Should succeed (200) or fail on validation (400), not auth (401)
      expect([200, 400]).toContain(response.status);
      const data = await response.json();
      expect(data).toBeDefined();
      // Should not be auth error
      if (data.error) {
        expect(data.error.code).not.toBe('MCP_AUTH_REQUIRED');
        expect(data.error.code).not.toBe('MCP_AUTH_FAILED');
      }
    });

    // Note: consulate_register_agent tool was removed - registration now via HTTP endpoint /agents/register

    it('should allow public tools without any auth', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'x402_check_case_status',
          parameters: { caseId: 'test-case-id' },
        }),
      });

      // Public tool should work without auth (may return 500 if case not found internally)
      expect([200, 400, 404, 500]).toContain(response.status);
      const data = await response.json();
      expect(data).toBeDefined();
    });
  });
});

describe('MCP Protocol - Tool Invocation Error Handling', () => {
  // Pure HTTP tests - validate error responses without valid API keys
  // Note: Testing successful tool invocations requires valid API keys and test data,
  // which would require hybrid testing (convex-test + HTTP). We test error cases only.

  describe('Error Handling', () => {
    it('should reject unknown tool', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool: 'nonexistent_tool_xyz',
          parameters: {},
        }),
      });

      // Should fail on tool validation (400), not auth (401)
      expect([400, 404]).toContain(response.status);
      const data = await response.json();
      if (data.error) {
        expect(data.error.code).not.toBe('MCP_AUTH_REQUIRED');
      }
    });

    it('should handle malformed JSON', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json {{{',
      });

      // Should fail on JSON parsing (400/500), not auth (401)
      expect([400, 500]).toContain(response.status);
    });

    it('should reject request with missing tool field', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Missing tool field
          parameters: {},
        }),
      });

      // Should fail on validation (400), not auth (401)
      expect(response.status).toBe(400);
      const data = await response.json();
      if (data.error) {
        expect(data.error.code).not.toBe('MCP_AUTH_REQUIRED');
      }
    });

  });
});
