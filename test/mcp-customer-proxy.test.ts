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
    
    // Verify required fields (unified tool - universal fields only)
    expect(fileDisputeTool.input_schema.required).toContain('amount');
    expect(fileDisputeTool.input_schema.required).toContain('plaintiff');
    expect(fileDisputeTool.input_schema.required).toContain('description');
    expect(fileDisputeTool.input_schema.required).toContain('defendant');
    
    // Payment-specific fields are OPTIONAL (not all disputes are payment)
    expect(fileDisputeTool.input_schema.required).not.toContain('transactionId');
    expect(fileDisputeTool.input_schema.required).not.toContain('disputeReason');
    expect(fileDisputeTool.input_schema.required).not.toContain('paymentProtocol');
    
    // General dispute fields are also OPTIONAL
    expect(fileDisputeTool.input_schema.required).not.toContain('category');
    
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
    // Unified tool - transactionId is OPTIONAL
    expect(fileDispute.input_schema.required).toContain('plaintiff');
    expect(fileDispute.input_schema.required).toContain('amount');
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
    expect(renamedTool.input_schema.properties.transactionId).toBeDefined();
    expect(renamedTool.input_schema.properties.amount).toBeDefined();
    expect(renamedTool.input_schema.properties.disputeReason).toBeDefined();
  }, 30000);

  it('should include pricing information in schema', async () => {
    const response = await fetch(`${CONSULATE_API_URL}/.well-known/mcp.json`);
    const schema = await response.json();
    
    // Verify pricing is documented
    expect(schema.server.pricing).toBeDefined();
    expect(schema.server.pricing.micro).toBeDefined();
    expect(schema.server.pricing.small).toBeDefined();
    expect(schema.server.pricing.medium).toBeDefined();
    expect(schema.server.pricing.large).toBeDefined();
    expect(schema.server.pricing.enterprise).toBeDefined();
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
    const disputeReasonProperty = fileDisputeTool.input_schema.properties.disputeReason;
    
    expect(disputeReasonProperty.enum).toBeDefined();
    expect(disputeReasonProperty.enum).toContain('service_not_rendered');
    expect(disputeReasonProperty.enum).toContain('api_timeout');
    expect(disputeReasonProperty.enum).toContain('amount_incorrect');
    expect(disputeReasonProperty.enum).toContain('duplicate_charge');
    expect(disputeReasonProperty.enum).toContain('fraud');
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

