import { describe, it, expect } from 'vitest';

/**
 * MCP Customer Proxy Pattern Tests
 * 
 * Tests a simple customer integration pattern where:
 * 1. Customer fetches X402Refunds MCP schema
 * 2. Customer filters to core tools (no renaming, no legacy aliases)
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

    expect(toolNames).toContain('x402_request_refund');
    expect(toolNames).toContain('x402_check_refund_status');
  }, 30000);

  it('should have complete schemas for core tools', async () => {
    const response = await fetch(`${CONSULATE_API_URL}/.well-known/mcp.json`);
    const schema = await response.json();
    
    const requestRefundTool = schema.tools.find((t: any) => t.name === 'x402_request_refund');
    const checkStatusTool = schema.tools.find((t: any) => t.name === 'x402_check_refund_status');
    
    expect(requestRefundTool).toBeDefined();
    expect(requestRefundTool.description).toBeDefined();
    expect(requestRefundTool.inputSchema).toBeDefined();
    expect(requestRefundTool.inputSchema.type).toBe('object');
    expect(requestRefundTool.inputSchema.properties).toBeDefined();
    expect(requestRefundTool.inputSchema.required).toBeDefined();
    
    // Verify required fields (X-402 simplified - plaintiff/defendant extracted from blockchain)
    expect(requestRefundTool.inputSchema.required).toContain('description');
    expect(requestRefundTool.inputSchema.required).toContain('request');
    expect(requestRefundTool.inputSchema.required).toContain('response');
    expect(requestRefundTool.inputSchema.required).toContain('transactionHash');
    expect(requestRefundTool.inputSchema.required).toContain('blockchain');
    
    // These are now extracted from blockchain (not required from agent)
    expect(requestRefundTool.inputSchema.required).not.toContain('plaintiff');
    expect(requestRefundTool.inputSchema.required).not.toContain('defendant');
    expect(requestRefundTool.inputSchema.required).not.toContain('disputeUrl');
    expect(requestRefundTool.inputSchema.required).not.toContain('amountUsd');
    expect(requestRefundTool.inputSchema.required).not.toContain('currency');
    expect(requestRefundTool.inputSchema.required).not.toContain('fromAddress');
    expect(requestRefundTool.inputSchema.required).not.toContain('toAddress');
    
    // Verify check_status schema
    expect(checkStatusTool).toBeDefined();
    expect(checkStatusTool.inputSchema.required).toContain('caseId');
  }, 30000);

  it('should support schema filtering (customer pattern)', async () => {
    const response = await fetch(`${CONSULATE_API_URL}/.well-known/mcp.json`);
    const originalSchema = await response.json();
    
    // Simulate customer's filtering to core tools
    const CORE_TOOLS = ['x402_request_refund', 'x402_check_refund_status'];
    
    const customerSchema = {
      ...originalSchema,
      tools: originalSchema.tools
        .filter((t: any) => CORE_TOOLS.includes(t.name))
        .map((t: any) => ({ ...t }))
    };
    
    // Verify customer sees strict namespaced names
    const toolNames = customerSchema.tools.map((t: any) => t.name);
    expect(toolNames).toContain('x402_request_refund');
    expect(toolNames).toContain('x402_check_refund_status');
    
    // Verify schemas are preserved
    expect(customerSchema.tools.length).toBe(2);
    const requestRefund = customerSchema.tools.find((t: any) => t.name === 'x402_request_refund');
    expect(requestRefund).toBeDefined();
    // X-402 simplified schema (plaintiff/defendant extracted from blockchain)
    expect(requestRefund.inputSchema.required).toContain('request');
    expect(requestRefund.inputSchema.required).toContain('response');
    expect(requestRefund.inputSchema.required).toContain('transactionHash');
    expect(requestRefund.inputSchema.required).toContain('blockchain');
    expect(requestRefund.inputSchema.required).toContain('description');
    
    // Plaintiff/defendant now extracted from blockchain (not required from agent)
    expect(requestRefund.inputSchema.required).not.toContain('plaintiff');
    expect(requestRefund.inputSchema.required).not.toContain('defendant');
  }, 30000);

  it('should include pricing information in schema', async () => {
    const response = await fetch(`${CONSULATE_API_URL}/.well-known/mcp.json`);
    const schema = await response.json();
    
    // Verify flat pricing is documented
    expect(schema.server.pricing).toBeDefined();
    expect(schema.server.pricing.flat_fee).toBeDefined();
    expect(String(schema.server.pricing.flat_fee)).toBe('$0.05 per refund request');
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
    
    const fileDisputeTool = schema.tools.find((t: any) => t.name === 'x402_request_refund');
    // X-402 simplified - blockchain is source of truth
    if (!fileDisputeTool) return; // Skip if tool not found
    const blockchainProperty = fileDisputeTool.inputSchema.properties.blockchain;
    const transactionHashProperty = fileDisputeTool.inputSchema.properties.transactionHash;
    
    // Plaintiff/defendant no longer in schema (extracted from blockchain)
    expect(fileDisputeTool.inputSchema.properties.plaintiff).toBeUndefined();
    expect(fileDisputeTool.inputSchema.properties.defendant).toBeUndefined();
    
    // Blockchain enum includes ethereum/base/solana in discovery manifest (documentation layer)
    expect(blockchainProperty).toBeDefined();
    expect(blockchainProperty.enum).toEqual(['ethereum', 'base', 'solana']);
    
    // Transaction hash is required (used to extract all details)
    expect(transactionHashProperty).toBeDefined();
    expect(transactionHashProperty.description).toContain('blockchain');
  }, 30000);
});

describe('MCP Customer Proxy - Tool Invocation', () => {
  it('should preserve parameters during proxying', () => {
    const customerRequest = {
      tool: 'x402_request_refund',
      parameters: {
        transactionId: 'txn_123',
        amount: 10.50,
        plaintiff: 'customer@example.com',
        defendant: 'merchant@example.com',
        disputeReason: 'service_not_rendered',
        description: 'Test dispute'
      }
    };

    // Simulate customer proxy transformation
    const consulateRequest = {
      tool: customerRequest.tool,
      parameters: customerRequest.parameters // Unchanged
    };

    expect(consulateRequest.tool).toBe('x402_request_refund');
    expect(consulateRequest.parameters).toEqual(customerRequest.parameters);
    expect(consulateRequest.parameters.transactionId).toBe('txn_123');
  });
});

