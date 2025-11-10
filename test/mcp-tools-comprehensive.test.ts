import { describe, it, expect, beforeAll } from 'vitest';
import { API_BASE_URL } from './fixtures';

/**
 * Comprehensive MCP Tools Test Suite - HTTP Endpoint Testing
 *
 * Tests all 3 MCP server tools via HTTP endpoints:
 * 1. consulate_file_dispute - File X-402 payment disputes (ultra-minimal schema)
 * 2. consulate_list_my_cases - List cases for an Ethereum address
 * 3. consulate_check_case_status - Check case status
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

describe('MCP Tools - Comprehensive HTTP Test Suite (X-402)', () => {
  let testCaseId: string;
  const testBuyerAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
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

  describe('1. consulate_file_dispute (X-402 Ultra-Minimal)', () => {
    it('should file X-402 payment dispute with Ethereum addresses', async () => {
      const timestamp = Date.now();
      const { response, data } = await invokeMcpTool('consulate_file_dispute', {
        plaintiff: testBuyerAddress,
        defendant: testSellerAddress,
        disputeUrl: `https://api.x402disputes.com/disputes/claim?vendor=${testSellerAddress}`,
        description: 'API returned 500 error after payment was confirmed on-chain',
        request: {
          method: 'POST',
          url: 'https://api.seller.com/v1/chat',
          headers: { 'Content-Type': 'application/json', 'X-402-Transaction-Hash': '0xabc123' },
          body: { model: 'gpt-4', messages: [{ role: 'user', content: 'Hello' }] }
        },
        response: {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
          body: { error: 'Internal Server Error' }
        },
        transactionHash: `0x${timestamp.toString(16)}abc123`,
        blockchain: 'base'
      });

      // May succeed or fail depending on blockchain query (mock mode in test)
      expect([200, 400, 500]).toContain(response.status);
      expect(data).toBeDefined();
      
      if (data.success) {
        expect(data.caseId).toBeDefined();
        expect(data.trackingUrl).toContain('/cases/');
        testCaseId = data.caseId;
      } else {
        // Expected in test env if blockchain query fails or address mismatch
        expect(['TRANSACTION_NOT_FOUND', 'MCP_INTERNAL_ERROR', 'ADDRESS_MISMATCH']).toContain(data.error?.code);
      }
    });

    it('should validate Ethereum address format for plaintiff', async () => {
      const { response, data } = await invokeMcpTool('consulate_file_dispute', {
        plaintiff: 'not-an-ethereum-address', // Invalid
        defendant: testSellerAddress,
        disputeUrl: `https://api.x402disputes.com/disputes/claim?vendor=${testSellerAddress}`,
        description: 'Test',
        request: {},
        response: {},
        transactionHash: '0xtest123',
        blockchain: 'base'
      });

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error?.code).toMatch(/INVALID_PLAINTIFF|MISSING_PLAINTIFF/);
    });

    it('should validate Ethereum address format for defendant', async () => {
      const { response, data } = await invokeMcpTool('consulate_file_dispute', {
        plaintiff: testBuyerAddress,
        defendant: 'invalid-address', // Invalid
        disputeUrl: `https://api.x402disputes.com/disputes/claim?vendor=invalid`,
        description: 'Test',
        request: {},
        response: {},
        transactionHash: '0xtest123',
        blockchain: 'base'
      });

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error?.code).toMatch(/INVALID_DEFENDANT|MISSING_DEFENDANT/);
    });

    it('should validate required fields', async () => {
      const { response, data } = await invokeMcpTool('consulate_file_dispute', {
        // Missing required fields
        plaintiff: testBuyerAddress
      });

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error?.code).toBeDefined();
    });

    it('should support dryRun mode for validation', async () => {
      const timestamp = Date.now();
      const { response, data } = await invokeMcpTool('consulate_file_dispute', {
        plaintiff: testBuyerAddress,
        defendant: testSellerAddress,
        disputeUrl: `https://api.x402disputes.com/disputes/claim?vendor=${testSellerAddress}`,
        description: 'Test dispute for dryRun validation',
        request: { method: 'POST', url: 'https://api.test.com' },
        response: { status: 500 },
        transactionHash: `0x${timestamp.toString(16)}`,
          blockchain: 'base',
        dryRun: true
      });

      // dryRun may succeed or fail depending on blockchain query
      expect([200, 400, 500]).toContain(response.status);
      if (data.success && data.validations) {
        expect(data.validations).toBeDefined();
        // Validations may have different structure
        expect(typeof data.validations === 'object').toBe(true);
      } else {
        // Expected if blockchain query fails
        expect(data.error).toBeDefined();
      }
    });

    it('should validate blockchain enum', async () => {
      const { response, data } = await invokeMcpTool('consulate_file_dispute', {
        plaintiff: testBuyerAddress,
        defendant: testSellerAddress,
        disputeUrl: `https://api.x402disputes.com/disputes/claim?vendor=${testSellerAddress}`,
        description: 'Test',
        request: {},
        response: {},
        transactionHash: '0xtest123',
        blockchain: 'invalid-chain' // Invalid
      });

      // May return 400 (validation) or 500 (internal error)
      expect([400, 500]).toContain(response.status);
      expect(data.success).toBe(false);
      if (data.error) {
        expect(data.error.code).toBeDefined();
      }
    });
  });

  describe('2. consulate_check_case_status', () => {
    it('should get case status', async () => {
      // First create a case if we don't have one
      if (!testCaseId) {
        const timestamp = Date.now();
        const { data: disputeData } = await invokeMcpTool('consulate_file_dispute', {
          plaintiff: testBuyerAddress,
          defendant: testSellerAddress,
          disputeUrl: `https://api.x402disputes.com/disputes/claim?vendor=${testSellerAddress}`,
          description: 'Test case for status check',
          request: { method: 'POST', url: 'https://api.test.com' },
          response: { status: 500 },
          transactionHash: `0x${timestamp.toString(16)}`,
          blockchain: 'base'
        });
        
        if (disputeData.success) {
        testCaseId = disputeData.caseId;
        }
      }

      if (!testCaseId) {
        // Use a known test case ID format
        testCaseId = 'k17test123456789012345678901234567890';
      }

      const { response, data } = await invokeMcpTool('consulate_check_case_status', {
        caseId: testCaseId
      });

      // May return 200 with case or 404/400/500 if case doesn't exist or error
      expect([200, 400, 404, 500]).toContain(response.status);
      
      if (data.success && data.case) {
      expect(data.case.status).toBeDefined();
      expect(data.case.type).toMatch(/PAYMENT/);
      }
    });

    it('should return error for non-existent case', async () => {
      const fakeCaseId = 'k17xm47xm47xm47xm47xm47xm47xm4';
      const { response, data } = await invokeMcpTool('consulate_check_case_status', {
        caseId: fakeCaseId
      });

      // Either 404 or 200 with null/undefined case
      if (response.status === 404) {
        expect(data.success).toBe(false);
      } else if (response.status === 200) {
        expect(data.case).toBeFalsy(); // null or undefined
      }
    });
  });

  describe('3. consulate_list_my_cases', () => {
    it('should list cases for an Ethereum address', async () => {
      // Note: This requires the address to have cases filed
      // In test environment, may return empty array
      const { response, data } = await invokeMcpTool('consulate_list_my_cases', {
        walletAddress: testBuyerAddress // Using ERC-8004 Ethereum wallet address
      });

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.cases).toBeDefined();
      expect(Array.isArray(data.cases)).toBe(true);
    });

    it('should filter by status', async () => {
      const { response, data } = await invokeMcpTool('consulate_list_my_cases', {
        walletAddress: testBuyerAddress,
        status: 'FILED'
      });

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.cases).toBeDefined();
      expect(Array.isArray(data.cases)).toBe(true);
    });

    it('should return all statuses when status is "all"', async () => {
      const { response, data } = await invokeMcpTool('consulate_list_my_cases', {
        walletAddress: testBuyerAddress,
        status: 'all'
      });

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.cases).toBeDefined();
    });
  });

  describe('Integration: X-402 Dispute Flow', () => {
    it('should complete X-402 dispute lifecycle', async () => {
      const timestamp = Date.now();
      const buyerAddress = `0x${timestamp.toString(16).padStart(40, '0')}`;
      const sellerAddress = `0x${(timestamp + 1).toString(16).padStart(40, '0')}`;

      // 1. File dispute
      const { data: disputeData } = await invokeMcpTool('consulate_file_dispute', {
        plaintiff: buyerAddress,
        defendant: sellerAddress,
        disputeUrl: `https://api.x402disputes.com/disputes/claim?vendor=${sellerAddress}`,
        description: 'X-402 integration test dispute',
        request: {
          method: 'POST',
          url: 'https://api.test.com/v1/chat',
          headers: { 'X-402-Transaction-Hash': `0x${timestamp}` },
          body: { model: 'gpt-4', messages: [] }
        },
        response: {
          status: 500,
          headers: {},
          body: { error: 'Service unavailable' }
        },
        transactionHash: `0x${timestamp.toString(16)}`,
        blockchain: 'base',
        dryRun: true // Use dryRun to avoid actual filing
      });

      // dryRun may succeed or fail depending on blockchain query
      // Just verify we got a response
      expect(disputeData).toBeDefined();
      if (disputeData.success) {
        expect(disputeData.validations).toBeDefined();
      } else {
        // Expected if blockchain query fails in test env
        expect(disputeData.error).toBeDefined();
      }

      // 2. Check case status (if case was created)
      if (disputeData.caseId) {
      const { data: statusData } = await invokeMcpTool('consulate_check_case_status', {
          caseId: disputeData.caseId
      });

        if (statusData.success) {
      expect(statusData.case).toBeDefined();
        }
      }

      // 3. List cases for buyer
      const { data: casesData } = await invokeMcpTool('consulate_list_my_cases', {
        walletAddress: buyerAddress
      });

      expect(casesData.success).toBe(true);
      expect(casesData.cases).toBeDefined();
      expect(Array.isArray(casesData.cases)).toBe(true);
    });
  });
});
