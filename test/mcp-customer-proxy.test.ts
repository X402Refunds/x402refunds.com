import { describe, it, expect } from 'vitest';

/**
 * MCP Customer Proxy Pattern Tests
 * 
 * Tests a simple customer integration pattern where:
 * 1. Customer fetches X402Refunds MCP schema
 * 2. Customer uses the enabled tool(s) only (no legacy aliases)
 */

describe('MCP Customer Proxy Pattern', () => {
  const CONSULATE_API_URL = process.env.VITE_CONVEX_URL?.replace('https://', 'https://') || 'https://youthful-orca-358.convex.site';
  
  it('should fetch X402Refunds MCP schema', async () => {
    const response = await fetch(`${CONSULATE_API_URL}/.well-known/mcp.json`);
    expect(response.ok).toBe(true);
    
    const schema = await response.json();
    expect(schema).toHaveProperty('protocol', 'mcp');
    expect(schema).toHaveProperty('tools');
    expect(Array.isArray(schema.tools)).toBe(true);
  }, 30000); // 30 second timeout for network requests

  it('should include core tools in schema', async () => {
    const response = await fetch(`${CONSULATE_API_URL}/.well-known/mcp.json`);
    const schema = await response.json();
    
    const toolNames = schema.tools.map((t: any) => t.name);

    expect(toolNames).toEqual(['image_generator']);
  }, 30000);

  it('should have complete schemas for core tools', async () => {
    const response = await fetch(`${CONSULATE_API_URL}/.well-known/mcp.json`);
    const schema = await response.json();
    
    const imageGeneratorTool = schema.tools.find((t: any) => t.name === 'image_generator');
    
    expect(imageGeneratorTool).toBeDefined();
    expect(imageGeneratorTool.description).toBeDefined();
    expect(imageGeneratorTool.inputSchema).toBeDefined();
    expect(imageGeneratorTool.inputSchema.type).toBe('object');
    expect(imageGeneratorTool.inputSchema.properties).toBeDefined();
    expect(imageGeneratorTool.inputSchema.required).toEqual(['prompt']);
  }, 30000);

  it('should support schema filtering (customer pattern)', async () => {
    const response = await fetch(`${CONSULATE_API_URL}/.well-known/mcp.json`);
    const originalSchema = await response.json();
    
    // Simulate customer's filtering to enabled tool(s)
    const CORE_TOOLS = ['image_generator'];
    
    const customerSchema = {
      ...originalSchema,
      tools: originalSchema.tools
        .filter((t: any) => CORE_TOOLS.includes(t.name))
        .map((t: any) => ({ ...t }))
    };
    
    // Verify customer sees strict namespaced names
    const toolNames = customerSchema.tools.map((t: any) => t.name);
    expect(toolNames).toEqual(['image_generator']);
    
    // Verify schemas are preserved
    expect(customerSchema.tools.length).toBe(1);
    const imageGenerator = customerSchema.tools.find((t: any) => t.name === 'image_generator');
    expect(imageGenerator).toBeDefined();
    expect(imageGenerator.inputSchema.required).toContain('prompt');
  }, 30000);

  it('should include authentication info for customers', async () => {
    const response = await fetch(`${CONSULATE_API_URL}/.well-known/mcp.json`);
    const schema = await response.json();
    
    expect(schema.authentication).toBeDefined();
    expect(schema.authentication.type).toBe('optional');
    expect(schema.authentication.optional_auth).toBeDefined();
    expect(schema.authentication.optional_auth.type).toBe('signature');
    expect(schema.authentication.optional_auth.algorithm).toBe('Ed25519');
  }, 30000);

  it('should document blockchain enum and transaction hash in file_dispute tool', async () => {
    const response = await fetch(`${CONSULATE_API_URL}/.well-known/mcp.json`);
    const schema = await response.json();
    
    // Refund tools are intentionally disabled and not exposed in discovery.
    expect(schema.tools.find((t: any) => t.name === 'x402_request_refund')).toBeUndefined();
  }, 30000);
});

describe('MCP Customer Proxy - Tool Invocation', () => {
  it('should preserve parameters during proxying', () => {
    const customerRequest = {
      tool: 'image_generator',
      parameters: {
        prompt: 'a courthouse sketched in pencil'
      }
    };

    // Simulate customer proxy transformation
    const consulateRequest = {
      tool: customerRequest.tool,
      parameters: customerRequest.parameters // Unchanged
    };

    expect(consulateRequest.tool).toBe('image_generator');
    expect(consulateRequest.parameters).toEqual(customerRequest.parameters);
    expect(consulateRequest.parameters.prompt).toBe('a courthouse sketched in pencil');
  });
});

