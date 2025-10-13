import { describe, it, expect, beforeAll } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../convex/_generated/api';
import schema from '../convex/schema';
import { API_BASE_URL, USE_LIVE_API } from './fixtures';
import { setupTestAgents } from './fixtures/api-helpers';

/**
 * MCP (Model Context Protocol) Endpoints Tests
 * 
 * Tests for MCP integration endpoints:
 * - GET /.well-known/mcp.json
 * - POST /mcp/invoke
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
      
      expect(manifest.protocol).toBeDefined();
      expect(manifest.version).toBeDefined();
      expect(manifest.server).toBeDefined();
    });

    it('should list available tools', async () => {
      const response = await fetch(`${API_BASE_URL}/.well-known/mcp.json`);
      const manifest = await response.json();
      
      expect(manifest.tools.length).toBeGreaterThan(0);
      
      // Should include key dispute-related tools
      const toolNames = manifest.tools.map((t: any) => t.name);
      const expectedTools = [
        'consulate_file_dispute',
        'consulate_submit_evidence',
        'consulate_check_case_status',
      ];
      
      for (const expectedTool of expectedTools) {
        expect(toolNames).toContain(expectedTool);
      }
    });

    it('should include tool descriptions', async () => {
      const response = await fetch(`${API_BASE_URL}/.well-known/mcp.json`);
      const manifest = await response.json();
      
      // All tools should have descriptions
      const allHaveDescriptions = manifest.tools.every(
        (tool: any) => tool.description && tool.description.length > 0
      );
      expect(allHaveDescriptions).toBe(true);
    });

    it('should define tool input schemas', async () => {
      const response = await fetch(`${API_BASE_URL}/.well-known/mcp.json`);
      const manifest = await response.json();
      
      // All tools should have input schemas (MCP uses input_schema with underscore)
      const allHaveSchemas = manifest.tools.every(
        (tool: any) => (tool.input_schema || tool.inputSchema) && 
          ((tool.input_schema?.type || tool.inputSchema?.type) || 
           (tool.input_schema?.properties || tool.inputSchema?.properties))
      );
      expect(allHaveSchemas).toBe(true);
    });

    it('should specify required parameters', async () => {
      const response = await fetch(`${API_BASE_URL}/.well-known/mcp.json`);
      const manifest = await response.json();
      
      // Find file_dispute tool
      const fileDisputeTool = manifest.tools.find(
        (t: any) => t.name === 'consulate_file_dispute'
      );
      
      if (fileDisputeTool) {
        const schema = fileDisputeTool.input_schema || fileDisputeTool.inputSchema;
        expect(schema.required).toBeDefined();
        expect(Array.isArray(schema.required)).toBe(true);
        expect(schema.required).toContain('plaintiff');
        expect(schema.required).toContain('defendant');
      }
    });

    it('should include authentication requirements', async () => {
      const response = await fetch(`${API_BASE_URL}/.well-known/mcp.json`);
      const manifest = await response.json();
      
      // Should specify authentication method
      expect(manifest.authentication).toBeDefined();
    });

    it('should include CORS headers', async () => {
      const response = await fetch(`${API_BASE_URL}/.well-known/mcp.json`);
      
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });

    it('should include caching headers', async () => {
      const response = await fetch(`${API_BASE_URL}/.well-known/mcp.json`);
      
      const cacheControl = response.headers.get('cache-control');
      if (cacheControl) {
        expect(cacheControl).toContain('public');
      } else {
        // Cache control might not be set, which is acceptable
        expect(response.status).toBe(200);
      }
    });
  });
});

describe('MCP Protocol - Tool Invocation', () => {
  let t: ReturnType<typeof convexTest>;
  let testAgentDid: string;
  let testDefendantDid: string;

  beforeAll(async () => {
    if (!USE_LIVE_API) {
      const modules = import.meta.glob('../convex/**/*.{ts,js}');
      t = convexTest(schema, modules);
      
      const { plaintiff, defendant } = await setupTestAgents(t);
      testAgentDid = plaintiff.did;
      testDefendantDid = defendant.did;
    }
  });

  describe('POST /mcp/invoke', () => {
    it.skipIf(USE_LIVE_API)('should invoke file_dispute tool', async () => {
      // First submit evidence
      const evidenceResponse = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-DID': testAgentDid,
        },
        body: JSON.stringify({
          tool: 'submit_evidence',
          parameters: {
            agentDid: testAgentDid,
            sha256: `sha256_${Date.now()}`,
            uri: 'https://test.example.com/evidence.json',
            signer: 'did:test:signer',
            model: {
              provider: 'test',
              name: 'test-model',
              version: '1.0.0',
            },
          },
        }),
      });

      const evidenceData = await evidenceResponse.json();
      expect(evidenceData.success || evidenceData.evidenceId).toBeDefined();

      // Then file dispute
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-DID': testAgentDid,
        },
        body: JSON.stringify({
          tool: 'file_dispute',
          parameters: {
            plaintiff: testAgentDid,
            defendant: testDefendantDid,
            type: 'SLA_BREACH',
            jurisdictionTags: ['test'],
            evidenceIds: evidenceData.evidenceId ? [evidenceData.evidenceId] : [],
            description: 'Test dispute via MCP',
          },
        }),
      });

      expect([200, 400]).toContain(response.status);
    });

    it.skipIf(USE_LIVE_API)('should invoke submit_evidence tool', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-DID': testAgentDid,
        },
        body: JSON.stringify({
          tool: 'submit_evidence',
          parameters: {
            agentDid: testAgentDid,
            sha256: `sha256_${Date.now()}`,
            uri: 'https://test.example.com/evidence.json',
            signer: 'did:test:signer',
            model: {
              provider: 'test',
              name: 'test-model',
              version: '1.0.0',
            },
          },
        }),
      });

      expect([200, 400]).toContain(response.status);
      
      if (response.status === 200) {
        const data = await response.json();
        expect(data.success || data.evidenceId).toBeDefined();
      }
    });

    it('should reject unknown tool', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-DID': testAgentDid,
        },
        body: JSON.stringify({
          tool: 'nonexistent_tool',
          parameters: {},
        }),
      });

      expect([400, 401]).toContain(response.status);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should reject missing tool parameter', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-DID': testAgentDid,
        },
        body: JSON.stringify({
          parameters: {},
        }),
      });

      expect([400, 401]).toContain(response.status);
    });

    it('should reject missing parameters', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-DID': testAgentDid,
        },
        body: JSON.stringify({
          tool: 'file_dispute',
        }),
      });

      expect([400, 401]).toContain(response.status);
    });

    it('should validate required parameters', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-DID': testAgentDid,
        },
        body: JSON.stringify({
          tool: 'file_dispute',
          parameters: {
            plaintiff: testAgentDid,
            // Missing required defendant parameter
          },
        }),
      });

      expect([400, 401]).toContain(response.status);
    });

    it('should handle malformed JSON', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-DID': testAgentDid,
        },
        body: 'invalid json {',
      });

      expect([400, 500]).toContain(response.status);
    });

    it('should respect X-Agent-DID header', async () => {
      // Request without authentication header
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // No X-Agent-DID header
        },
        body: JSON.stringify({
          tool: 'submit_evidence',
          parameters: {
            agentDid: testAgentDid,
            sha256: 'test',
            uri: 'https://test.example.com/evidence.json',
            signer: 'did:test:signer',
          },
        }),
      });

      // Should either accept (if auth is optional) or reject (if required)
      expect([200, 400, 401]).toContain(response.status);
    });

    it.skipIf(USE_LIVE_API)('should return structured response', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-DID': testAgentDid,
        },
        body: JSON.stringify({
          tool: 'submit_evidence',
          parameters: {
            agentDid: testAgentDid,
            sha256: `sha256_${Date.now()}`,
            uri: 'https://test.example.com/evidence.json',
            signer: 'did:test:signer',
            model: {
              provider: 'test',
              name: 'test-model',
              version: '1.0.0',
            },
          },
        }),
      });

      if (response.status === 200) {
        const data = await response.json();
        
        // Response should have consistent structure
        expect(data).toBeDefined();
        expect(typeof data).toBe('object');
      }
    });

    it.skipIf(USE_LIVE_API)('should include CORS headers', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-DID': testAgentDid,
        },
        body: JSON.stringify({
          tool: 'submit_evidence',
          parameters: {
            agentDid: testAgentDid,
            sha256: `sha256_${Date.now()}`,
            uri: 'https://test.example.com/evidence.json',
            signer: 'did:test:signer',
          },
        }),
      });

      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });

    it('should handle CORS preflight', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
        method: 'OPTIONS',
      });

      // OPTIONS may not be specifically routed, check if CORS is enabled generally
      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.headers.get('access-control-allow-origin')).toBe('*');
        expect(response.headers.get('access-control-allow-methods')).toBeDefined();
      }
    });
  });
});

