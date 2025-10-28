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
  // Pure HTTP tests - validate error responses without test data

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
          'Authorization': 'Bearer csk_test_invalid_fake_12345',
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

    it.skipIf(!process.env.TEST_API_KEY)('should accept valid API key and execute tool', async () => {
      // This test requires TEST_API_KEY environment variable to be set
      // This ensures validateApiKey works correctly in httpAction context
      const testApiKey = process.env.TEST_API_KEY!;

      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          tool: 'consulate_lookup_agent',
          parameters: { query: 'test' },
        }),
      });

      // Should NOT return 401 - auth should pass
      expect(response.status).not.toBe(401);

      // Should return 200 with tool response (even if no results found)
      const data = await response.json();
      expect(data).toBeDefined();

      // If it's a "not found" response, that's still success (auth worked)
      if (response.status === 200 && data.success === false) {
        expect(data.error).toContain('No agents found');
      }
    });
  });
});

describe('MCP Protocol - Tool Invocation Error Handling', () => {
  // Pure HTTP tests - validate error responses without valid API keys
  // Note: Testing successful tool invocations requires valid API keys and test data,
  // which would require hybrid testing (convex-test + HTTP). We test error cases only.

  describe('Error Handling', () => {
    it.skipIf(USE_LIVE_API)('should reject unknown tool without authentication', async () => {
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

      // Should fail on authentication, not tool validation
      expect(response.status).toBe(401);
    });

    it.skipIf(USE_LIVE_API)('should handle malformed JSON without authentication', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json {{{',
      });

      // Should fail on authentication (401) or JSON parsing (500)
      expect([401, 500]).toContain(response.status);
    });

    it.skipIf(USE_LIVE_API)('should reject request with missing tool field', async () => {
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

      // Should fail on authentication
      expect(response.status).toBe(401);
    });
  });
});
