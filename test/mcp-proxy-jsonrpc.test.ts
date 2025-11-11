/**
 * MCP Proxy JSON-RPC Protocol Compliance Tests
 *
 * These tests verify that the MCP proxy correctly implements JSON-RPC 2.0 spec,
 * particularly around notifications (which must NOT receive responses).
 *
 * Critical for Claude Desktop integration.
 */

import { describe, it, expect } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';

const PROXY_SCRIPT = join(process.cwd(), 'scripts', 'claude-desktop-mcp-proxy.js');
const TEST_API_KEY = process.env.TEST_API_KEY || 'csk_test_placeholder';
const API_BASE_URL = process.env.API_BASE_URL || 'https://youthful-orca-358.convex.site';

interface ProxyResult {
  stdout: string;
  stderr: string;
  responses: any[];
}

/**
 * Helper: Run proxy with given requests and return responses
 */
async function runProxyWithRequests(requests: any[], timeout = 3000): Promise<ProxyResult> {
  return new Promise((resolve, reject) => {
    const proxy = spawn('node', [PROXY_SCRIPT], {
      env: {
        ...process.env,
        CONSULATE_API_KEY: TEST_API_KEY,
        CONSULATE_API_URL: API_BASE_URL,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    const responses: any[] = [];

    proxy.stdout.on('data', (data) => {
      stdout += data.toString();
      const lines = data.toString().split('\n').filter(line => line.trim());
      for (const line of lines) {
        try {
          responses.push(JSON.parse(line));
        } catch {
          // Not JSON, skip
        }
      }
    });

    proxy.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proxy.on('error', reject);

    // Send all requests
    for (const request of requests) {
      proxy.stdin.write(JSON.stringify(request) + '\n');
    }

    // Wait for responses, then kill
    setTimeout(() => {
      proxy.kill('SIGTERM');
      resolve({ stdout, stderr, responses });
    }, timeout);
  });
}

describe('MCP Proxy - JSON-RPC 2.0 Compliance', () => {
  describe('Requests (with id) - MUST get response', () => {
    it('should respond to initialize request with proper JSON-RPC format', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          clientInfo: { name: 'test', version: '1.0' }
        }
      };

      const { responses } = await runProxyWithRequests([request]);

      expect(responses).toHaveLength(1);
      expect(responses[0]).toMatchObject({
        jsonrpc: '2.0',
        id: 1,
        result: expect.objectContaining({
          protocolVersion: '2024-11-05',
          serverInfo: expect.any(Object),
          capabilities: expect.any(Object)
        })
      });
    });

    it('should respond to tools/list request', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {}
      };

      const { responses } = await runProxyWithRequests([request]);

      expect(responses).toHaveLength(1);
      expect(responses[0]).toMatchObject({
        jsonrpc: '2.0',
        id: 2,
        result: expect.objectContaining({
          tools: expect.arrayContaining([
            expect.objectContaining({
              name: expect.stringMatching(/^x402_/),
              description: expect.any(String)
            })
          ])
        })
      });
    });

    it('should include id in error responses', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 3,
        method: 'unknown_method',
        params: {}
      };

      const { responses } = await runProxyWithRequests([request]);

      expect(responses).toHaveLength(1);
      expect(responses[0]).toMatchObject({
        jsonrpc: '2.0',
        id: 3,
        error: expect.objectContaining({
          code: -32601,
          message: expect.stringContaining('Method not found')
        })
      });
    });

    it('should handle numeric ids', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 42,
        method: 'initialize',
        params: { protocolVersion: '2024-11-05' }
      };

      const { responses } = await runProxyWithRequests([request]);

      expect(responses).toHaveLength(1);
      expect(responses[0].id).toBe(42);
    });

    it('should handle string ids', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 'test-request-123',
        method: 'initialize',
        params: { protocolVersion: '2024-11-05' }
      };

      const { responses } = await runProxyWithRequests([request]);

      expect(responses).toHaveLength(1);
      expect(responses[0].id).toBe('test-request-123');
    });
  });

  describe('Notifications (no id) - MUST NOT get response', () => {
    it('should NOT respond to notifications/initialized', async () => {
      const notification = {
        jsonrpc: '2.0',
        method: 'notifications/initialized'
      };

      const { responses } = await runProxyWithRequests([notification]);

      // CRITICAL: Notifications must not receive responses
      expect(responses).toHaveLength(0);
    });

    it('should NOT respond to notifications/cancelled', async () => {
      const notification = {
        jsonrpc: '2.0',
        method: 'notifications/cancelled',
        params: { requestId: 'some-id' }
      };

      const { responses } = await runProxyWithRequests([notification]);

      expect(responses).toHaveLength(0);
    });

    it('should NOT respond to custom notifications', async () => {
      const notification = {
        jsonrpc: '2.0',
        method: 'custom/notification',
        params: { data: 'test' }
      };

      const { responses } = await runProxyWithRequests([notification]);

      expect(responses).toHaveLength(0);
    });

    it('should handle multiple notifications without responses', async () => {
      const notifications = [
        { jsonrpc: '2.0', method: 'notification1' },
        { jsonrpc: '2.0', method: 'notification2' },
        { jsonrpc: '2.0', method: 'notification3' }
      ];

      const { responses } = await runProxyWithRequests(notifications);

      // CRITICAL: No responses for any notifications
      expect(responses).toHaveLength(0);
    });
  });

  describe('Mixed requests and notifications', () => {
    it('should respond only to requests, not notifications', async () => {
      const messages = [
        { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05' } },
        { jsonrpc: '2.0', method: 'notifications/initialized' },
        { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
        { jsonrpc: '2.0', method: 'notifications/progress', params: { token: 'test' } }
      ];

      const { responses } = await runProxyWithRequests(messages);

      // Should get exactly 2 responses (for the 2 requests)
      expect(responses).toHaveLength(2);
      expect(responses[0].id).toBe(1);
      expect(responses[1].id).toBe(2);
    });
  });

  describe('Parse errors', () => {
    it('should return parse error for invalid JSON', async () => {
      return new Promise<void>((resolve, reject) => {
        const proxy = spawn('node', [PROXY_SCRIPT], {
          env: {
            ...process.env,
            CONSULATE_API_KEY: TEST_API_KEY,
            CONSULATE_API_URL: API_BASE_URL,
          },
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        let responses: any[] = [];

        proxy.stdout.on('data', (data) => {
          const lines = data.toString().split('\n').filter(line => line.trim());
          for (const line of lines) {
            try {
              responses.push(JSON.parse(line));
            } catch {
              // Not JSON
            }
          }
        });

        // Send invalid JSON
        proxy.stdin.write('{invalid json}\n');

        setTimeout(() => {
          proxy.kill('SIGTERM');

          // Should get parse error response
          expect(responses).toHaveLength(1);
          expect(responses[0]).toMatchObject({
            jsonrpc: '2.0',
            id: null, // Cannot determine id from invalid JSON
            error: expect.objectContaining({
              code: -32700,
              message: 'Parse error'
            })
          });

          resolve();
        }, 2000);
      });
    });
  });

  describe('Response format validation', () => {
    it('should never return response with undefined id', async () => {
      const requests = [
        { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05' } },
        { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }
      ];

      const { responses } = await runProxyWithRequests(requests);

      for (const response of responses) {
        // CRITICAL: id must be defined (never undefined)
        expect(response.id).toBeDefined();
        expect(response.id).not.toBe(undefined);
      }
    });

    it('should never include method field in responses', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: { protocolVersion: '2024-11-05' }
      };

      const { responses } = await runProxyWithRequests([request]);

      // CRITICAL: Responses must not have 'method' field
      expect(responses[0]).not.toHaveProperty('method');
    });

    it('should always include jsonrpc field', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: { protocolVersion: '2024-11-05' }
      };

      const { responses } = await runProxyWithRequests([request]);

      expect(responses[0].jsonrpc).toBe('2.0');
    });

    it('should have either result or error, never both', async () => {
      const requests = [
        { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05' } },
        { jsonrpc: '2.0', id: 2, method: 'unknown_method', params: {} }
      ];

      const { responses } = await runProxyWithRequests(requests);

      for (const response of responses) {
        const hasResult = response.hasOwnProperty('result');
        const hasError = response.hasOwnProperty('error');

        // CRITICAL: Must have exactly one of result or error
        expect(hasResult !== hasError).toBe(true);
      }
    });
  });
});
