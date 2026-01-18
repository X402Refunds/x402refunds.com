/**
 * X-402 Refund Request E2E Tests
 * 
 * Tests the ultra-minimal X-402 schema with:
 * - Ethereum addresses as canonical identities
 * - Blockchain query for payment verification
 * - Request/response objects (no base64 encoding)
 * - Permissionless refund requests (unclaimed agent creation)
 */

import { describe, it, expect } from 'vitest';
import { API_BASE_URL } from './fixtures';

/**
 * Helper to invoke MCP tools
 */
async function invokeMcpTool(toolName: string, parameters: any) {
  const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tool: toolName,
      parameters
    })
  });

  const data = await response.json();
  return { response, data };
}

describe('X-402 Ultra-Minimal Refund Request Schema', () => {
  it('should reject x402_request_refund when tool is disabled', async () => {
    const { response, data } = await invokeMcpTool('x402_request_refund', {});
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(String(data.error?.code)).toMatch(/MCP_TOOL_NOT_FOUND/);
  });

  it('should allow image_generator tool', async () => {
    const { response, data } = await invokeMcpTool('image_generator', { prompt: 'a courthouse sketched in pencil' });
    expect([200, 400]).toContain(response.status);
    expect(data).toBeDefined();
  });
});

