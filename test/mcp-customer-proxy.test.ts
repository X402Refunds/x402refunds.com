import { describe, it, expect } from 'vitest';

/**
 * MCP Customer Proxy Pattern Tests
 * 
 * Tests the customer integration pattern where:
 * 1. Customer fetches Consulate's MCP schema
 * 2. Customer filters to core tools
 * 3. Customer strips 'consulate_' prefix
 * 4. Customer proxies tool calls with their API key
 */

describe('MCP Customer Proxy Pattern', () => {
  const CONSULATE_API_URL = process.env.VITE_CONVEX_URL?.replace('https://', 'https://') || 'https://youthful-orca-358.convex.site';
  
  it('should fetch Consulate MCP schema', async () => {
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
    
    expect(toolNames).toContain('consulate_file_dispute');
    expect(toolNames).toContain('consulate_check_case_status');
  }, 30000);

  it('should have complete schemas for core tools', async () => {
    const response = await fetch(`${CONSULATE_API_URL}/.well-known/mcp.json`);
    const schema = await response.json();
    
    const fileDisputeTool = schema.tools.find((t: any) => t.name === 'consulate_file_dispute');
    const checkStatusTool = schema.tools.find((t: any) => t.name === 'consulate_check_case_status');
    
    // Verify file_dispute schema
    expect(fileDisputeTool).toBeDefined();
    expect(fileDisputeTool.description).toBeDefined();
    expect(fileDisputeTool.input_schema).toBeDefined();
    expect(fileDisputeTool.input_schema.type).toBe('object');
    expect(fileDisputeTool.input_schema.properties).toBeDefined();
    expect(fileDisputeTool.input_schema.required).toBeDefined();
    
    // Verify required fields (X402 with pre-signed payload)
    expect(fileDisputeTool.input_schema.required).toContain('plaintiff');
    expect(fileDisputeTool.input_schema.required).toContain('disputeUrl');
    expect(fileDisputeTool.input_schema.required).toContain('description');
    expect(fileDisputeTool.input_schema.required).toContain('evidencePayload');
    expect(fileDisputeTool.input_schema.required).toContain('signature');
    
    // These are auto-extracted from evidencePayload
    expect(fileDisputeTool.input_schema.required).not.toContain('amount');
    expect(fileDisputeTool.input_schema.required).not.toContain('defendant');
    
    // Verify check_status schema
    expect(checkStatusTool).toBeDefined();
    expect(checkStatusTool.input_schema.required).toContain('caseId');
  }, 30000);

  it('should support schema filtering and renaming (customer pattern)', async () => {
    const response = await fetch(`${CONSULATE_API_URL}/.well-known/mcp.json`);
    const originalSchema = await response.json();
    
    // Simulate customer's filtering and renaming
    const CORE_TOOLS = ['consulate_file_dispute', 'consulate_check_case_status'];
    
    const customerSchema = {
      ...originalSchema,
      tools: originalSchema.tools
        .filter((t: any) => CORE_TOOLS.includes(t.name))
        .map((t: any) => ({
          ...t,
          name: t.name.replace('consulate_', '') // Strip prefix
        }))
    };
    
    // Verify customer sees clean names
    const toolNames = customerSchema.tools.map((t: any) => t.name);
    expect(toolNames).toContain('file_dispute');
    expect(toolNames).toContain('check_case_status');
    expect(toolNames).not.toContain('consulate_file_dispute');
    
    // Verify schemas are preserved
    expect(customerSchema.tools.length).toBe(2);
    const fileDispute = customerSchema.tools.find((t: any) => t.name === 'file_dispute');
    // X402 payment disputes - pre-signed payload approach
    expect(fileDispute.input_schema.required).toContain('plaintiff');
    expect(fileDispute.input_schema.required).toContain('disputeUrl');
    expect(fileDispute.input_schema.required).toContain('evidencePayload');
    expect(fileDispute.input_schema.required).toContain('signature');
  }, 30000);

  it('should preserve all schema properties when renaming', async () => {
    const response = await fetch(`${CONSULATE_API_URL}/.well-known/mcp.json`);
    const schema = await response.json();
    
    const originalTool = schema.tools.find((t: any) => t.name === 'consulate_file_dispute');
    
    // Simulate customer rename
    const renamedTool = {
      ...originalTool,
      name: originalTool.name.replace('consulate_', '')
    };
    
    // Verify all properties preserved
    expect(renamedTool.name).toBe('file_dispute');
    expect(renamedTool.description).toBe(originalTool.description);
    expect(renamedTool.input_schema).toEqual(originalTool.input_schema);
    expect(renamedTool.input_schema.properties.plaintiff).toBeDefined();
    expect(renamedTool.input_schema.properties.disputeUrl).toBeDefined();
    expect(renamedTool.input_schema.properties.evidencePayload).toBeDefined();
    expect(renamedTool.input_schema.properties.signature).toBeDefined();
  }, 30000);

  it('should include pricing information in schema', async () => {
    const response = await fetch(`${CONSULATE_API_URL}/.well-known/mcp.json`);
    const schema = await response.json();
    
    // Verify flat pricing is documented
    expect(schema.server.pricing).toBeDefined();
    expect(schema.server.pricing.flat_fee).toBeDefined();
    expect(schema.server.pricing.flat_fee).toBe("$0.05 per dispute");
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

  it('should document dispute reasons in file_dispute tool', async () => {
    const response = await fetch(`${CONSULATE_API_URL}/.well-known/mcp.json`);
    const schema = await response.json();
    
    const fileDisputeTool = schema.tools.find((t: any) => t.name === 'consulate_file_dispute');
    // X402 payment disputes use pre-signed payload approach
    const evidencePayloadProperty = fileDisputeTool.input_schema.properties.evidencePayload;
    const signatureProperty = fileDisputeTool.input_schema.properties.signature;
    
    expect(evidencePayloadProperty).toBeDefined();
    expect(signatureProperty).toBeDefined();
    expect(evidencePayloadProperty.description.toLowerCase()).toContain('base64');
    expect(signatureProperty.description).toContain('Ed25519');
  }, 30000);
});

describe('MCP Customer Proxy - Tool Invocation', () => {
  it('should support tool name mapping (file_dispute → consulate_file_dispute)', () => {
    // Simulate customer's proxy logic
    const customerToolName = 'file_dispute';
    const consulateToolName = 'consulate_' + customerToolName;
    
    expect(consulateToolName).toBe('consulate_file_dispute');
  });

  it('should support reverse mapping (consulate_check_status → check_status)', () => {
    const consulateToolName = 'consulate_check_status';
    const customerToolName = consulateToolName.replace('consulate_', '');
    
    expect(customerToolName).toBe('check_status');
  });

  it('should preserve parameters during proxying', () => {
    const customerRequest = {
      tool: 'file_dispute',
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
      tool: 'consulate_' + customerRequest.tool,
      parameters: customerRequest.parameters // Unchanged
    };

    expect(consulateRequest.tool).toBe('consulate_file_dispute');
    expect(consulateRequest.parameters).toEqual(customerRequest.parameters);
    expect(consulateRequest.parameters.transactionId).toBe('txn_123');
  });
});

