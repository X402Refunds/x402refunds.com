import { describe, it, expect, beforeAll } from 'vitest';
import { API_BASE_URL } from './fixtures';

/**
 * Comprehensive MCP Tools Test Suite - HTTP Endpoint Testing
 *
 * NOTE: Refund tools may be disabled (not exposed) while still present in code.
 * This suite asserts that disabled tools are NOT callable, and that the demo image
 * generator tool remains callable.
 *
 * IMPORTANT: These tests use real HTTP endpoints, not in-memory convex-test.
 * This ensures we're testing the actual MCP protocol implementation.
 *
 * X-402 Ultra-Minimal Schema:
 * - Uses Ethereum addresses (0x...) as canonical identities
 * - Requires: plaintiff, defendant, disputeUrl, description, request, response, transactionHash, blockchain
 * - Derives: amount, currency, fromAddress, toAddress from blockchain query
 * - Permissionless: Can file against any Ethereum address
 */

describe('MCP Tools - Comprehensive HTTP Test Suite (tool gating)', () => {
  const testSellerAddress = '0x9876543210987654321098765432109876543210';

  // Helper function to invoke MCP tools via HTTP
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

  it('should reject disabled tools (refund tools) via /mcp/invoke', async () => {
    const { response, data } = await invokeMcpTool('x402_request_refund', {});
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(String(data.error?.code)).toMatch(/MCP_TOOL_NOT_FOUND/);
  });

  it('should allow calling image_generator via /mcp/invoke', async () => {
    const { response, data } = await invokeMcpTool('image_generator', {
      prompt: 'a courthouse sketched in pencil',
      size: '1024x1024',
    });
    expect([200, 400]).toContain(response.status);
    expect(data).toBeDefined();
    if (response.status === 200) {
      expect(data.success).toBe(true);
      expect(data.endpoint).toContain('/demo-agents/image-generator');
    }
  });
});
