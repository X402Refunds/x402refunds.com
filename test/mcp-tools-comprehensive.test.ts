import { describe, it, expect, beforeAll } from 'vitest';
import { API_BASE_URL } from './fixtures';

/**
 * Comprehensive MCP Tools Test Suite - HTTP Endpoint Testing
 *
 * Tests all 8 MCP server tools via HTTP endpoints:
 * 1. consulate_register_agent - Register a new agent
 * 2. consulate_file_dispute - File a payment dispute
 * 3. consulate_submit_evidence - Submit evidence for a case
 * 4. consulate_check_case_status - Check case status
 * 5. consulate_get_agent_reputation - Get agent reputation (via lookup)
 * 6. consulate_discover_agents - Discover agents by capability (via lookup)
 * 7. consulate_get_case_history - Get case history for an agent (via list_my_cases)
 * 8. consulate_list_recent_cases - List recent cases (via list_my_cases)
 *
 * IMPORTANT: These tests use real HTTP endpoints, not in-memory convex-test.
 * This ensures we're testing the actual MCP protocol implementation.
 */

/**
 * NOTE: This test suite tests MCP tools via HTTP endpoints.
 * Authentication is now optional - tools work without API keys.
 *
 * Run against PREVIEW with:
 *   API_BASE_URL=https://youthful-orca-358.convex.site pnpm test:run mcp-tools-comprehensive
 *
 * Run against PRODUCTION with:
 *   API_BASE_URL=https://api.consulatehq.com pnpm test:run mcp-tools-comprehensive
 */

describe('MCP Tools - Comprehensive HTTP Test Suite', () => {
  let testAgentDid: string;
  let testCaseId: string;

  // Helper function to invoke MCP tools via HTTP
  async function invokeMcpTool(toolName: string, parameters: any) {
    const response = await fetch(`${API_BASE_URL}/mcp/invoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Auth is optional - no Authorization header needed
      },
      body: JSON.stringify({
        tool: toolName,
        parameters
      })
    });

    const data = await response.json();
    return { response, data };
  }

  describe('1. consulate_register_agent', () => {
    it('should register a new agent successfully', async () => {
      const timestamp = Date.now();
      const testPublicKey = "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk";
      const { response, data } = await invokeMcpTool('consulate_register_agent', {
        name: `Test MCP Agent ${timestamp}`,
        publicKey: testPublicKey,
        organizationName: `Test Org ${timestamp}`,
        functionalType: 'general'
      });

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.agentDid).toBeDefined();
      expect(data.agentDid).toContain('did:agent:');
      expect(data.message).toContain('registered successfully');

      // Save for later tests
      testAgentDid = data.agentDid;
    });

    it('should fail to register agent without public key', async () => {
      const { response, data } = await invokeMcpTool('consulate_register_agent', {
        name: 'Invalid Agent',
        organizationName: 'Test Org',
        functionalType: 'general'
        // Missing publicKey
      });

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
      expect(data.error.message).toContain('publicKey');
    });

    it('should allow registering agents with same name (different DIDs)', async () => {
      const timestamp = Date.now();

      const testPublicKey1 = "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk";
      const testPublicKey2 = "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVkXzI";
      const { data: data1 } = await invokeMcpTool('consulate_register_agent', {
        name: `Duplicate Test ${timestamp}`,
        publicKey: testPublicKey1,
        organizationName: `Test Org ${timestamp}`,
        functionalType: 'general'
      });

      const { response: response2, data: data2 } = await invokeMcpTool('consulate_register_agent', {
        name: `Duplicate Test ${timestamp}`,
        publicKey: testPublicKey2,
        organizationName: `Test Org ${timestamp}`,
        functionalType: 'general'
      });

      expect(response2.status).toBe(200);
      expect(data2.success).toBe(true);
      expect(data2.agentDid).toBeDefined();
      expect(data2.agentDid).not.toBe(data1.agentDid); // Different DIDs
    });
  });

  describe('2. consulate_file_dispute', () => {
    it('should file a payment dispute successfully', async () => {
      const timestamp = Date.now();
      const { response, data } = await invokeMcpTool('consulate_file_dispute', {
        transactionId: `txn_test_${timestamp}`,
        amount: 1.50,
        currency: 'USD',
        paymentProtocol: 'ACP',
        plaintiff: 'consumer:test@example.com',
        defendant: 'merchant:api-provider@example.com',
        disputeReason: 'api_timeout',
        description: 'API request timed out after 30 seconds',
        evidenceUrls: ['https://logs.example.com/timeout.json']
      });

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.caseId).toBeDefined();
      expect(data.paymentDisputeId).toBeDefined();
      expect(data.status).toBeDefined();
      expect(data.disputeFee).toBeDefined();
      expect(data.pricingTier).toBeDefined();

      // Save for later tests
      testCaseId = data.caseId;
    });

    it('should calculate correct fee for micro-dispute', async () => {
      const timestamp = Date.now();
      const { response, data } = await invokeMcpTool('consulate_file_dispute', {
        transactionId: `txn_micro_${timestamp}`,
        amount: 0.50, // Micro-dispute
        currency: 'USD',
        paymentProtocol: 'ACP',
        plaintiff: 'consumer:micro@example.com',
        defendant: 'merchant:api@example.com',
        disputeReason: 'fraud',
        description: 'Unauthorized micro-transaction'
      });

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.isMicroDispute).toBe(true);
      expect(data.pricingTier).toBe('micro');
      expect(data.disputeFee).toBe(0.10);
    });

    it('should calculate correct fee for small dispute', async () => {
      const timestamp = Date.now();
      const { response, data } = await invokeMcpTool('consulate_file_dispute', {
        transactionId: `txn_small_${timestamp}`,
        amount: 5.00, // Small dispute
        currency: 'USD',
        paymentProtocol: 'ATXP',
        plaintiff: 'consumer:small@example.com',
        defendant: 'merchant:api@example.com',
        disputeReason: 'quality_issue',
        description: 'API returned incorrect data'
      });

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.pricingTier).toBe('small');
      expect(data.disputeFee).toBe(0.25);
    });

    it('should file a crypto non-custodial dispute with blockchain details', async () => {
      const timestamp = Date.now();
      const { response, data } = await invokeMcpTool('consulate_file_dispute', {
        transactionId: `0x${timestamp.toString(16)}`,
        amount: 50.00,
        currency: 'USD',
        paymentType: 'non_custodial',
        plaintiff: 'consumer:crypto@example.com',
        defendant: 'merchant:api@example.com',
        disputeReason: 'service_not_rendered',
        description: 'Paid 50 USDC but API failed',
        crypto: {
          currency: 'USDC',
          blockchain: 'base',
          layer: 'L2',
          fromAddress: '0xAlice123',
          toAddress: '0xMerchant456',
          transactionHash: `0x${timestamp.toString(16)}`,
          contractAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          explorerUrl: 'https://basescan.org/tx/0x123'
        },
        metadata: {
          customerId: 'cus_crypto_123',
          orderId: 'ord_2024_001'
        }
      });

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.caseId).toBeDefined();
    });

    it('should file a custodial crypto dispute', async () => {
      const timestamp = Date.now();
      const { response, data } = await invokeMcpTool('consulate_file_dispute', {
        transactionId: `custodial_${timestamp}`,
        amount: 25.00,
        currency: 'USD',
        paymentType: 'custodial',
        plaintiff: 'consumer:custodial@example.com',
        defendant: 'merchant:api@example.com',
        disputeReason: 'service_not_rendered',
        description: 'Exchange transaction but service failed',
        custodial: {
          platform: 'coinbase',
          platformTransactionId: `cb_txn_${timestamp}`,
          isOnChain: true
        },
        metadata: {
          exchangeOrderId: 'order_coinbase_123'
        }
      });

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.caseId).toBeDefined();
    });

    it('should file a traditional payment dispute (Stripe)', async () => {
      const timestamp = Date.now();
      const { response, data } = await invokeMcpTool('consulate_file_dispute', {
        transactionId: `ch_stripe_${timestamp}`,
        amount: 29.99,
        currency: 'USD',
        paymentType: 'traditional',
        plaintiff: 'consumer:stripe@example.com',
        defendant: 'merchant:api@example.com',
        disputeReason: 'service_not_rendered',
        description: 'Charged but service failed',
        traditional: {
          paymentMethod: 'stripe',
          processor: 'stripe',
          processorTransactionId: `ch_3ABC${timestamp}`,
          cardBrand: 'visa',
          lastFourDigits: '4242',
          cardType: 'credit'
        },
        metadata: {
          customerId: 'cus_stripe_123',
          subscriptionId: 'sub_annual_2024'
        }
      });

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.caseId).toBeDefined();
    });

    it('should file a general dispute (SLA violation) via unified endpoint', async () => {
      const timestamp = Date.now();
      // Register agent first (required for filing disputes)
      const testPublicKey = "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk";
      const { data: agentData } = await invokeMcpTool('consulate_register_agent', {
        name: `General Dispute Agent ${timestamp}`,
        publicKey: testPublicKey,
        organizationName: `General Dispute Org ${timestamp}`,
        functionalType: 'general'
      });
      const plaintiffDid = agentData.agentDid;
      
      const { response, data } = await invokeMcpTool('consulate_file_dispute', {
        plaintiff: plaintiffDid,
        defendant: 'openai-api',
        amount: 5000,
        currency: 'USD',
        description: 'API uptime was 97.2% instead of guaranteed 99.9%',
        category: 'sla_violation',
        priority: 'high',
        breachDetails: {
          duration: '72 hours',
          slaRequirement: '99.9% uptime',
          actualPerformance: '97.2% uptime',
          impactLevel: 'high',
          affectedUsers: 1000
        },
        evidenceUrls: [
          'https://monitoring.acme.com/uptime-report.json'
        ],
        metadata: {
          contractId: 'contract_2024_openai',
          monitoringDashboard: 'https://status.acme.com'
        }
      });

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.caseId).toBeDefined();
      // General disputes don't have paymentDisputeId
      expect(data.paymentDisputeId).toBeUndefined();
    });
  });

  describe('3. consulate_submit_evidence', () => {
    let evidenceAgentDid: string;
    let evidenceCaseId: string;

    beforeAll(async () => {
      const timestamp = Date.now();

      // Register an agent for evidence submission
      const testPublicKey = "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk";
      const { data: agentData } = await invokeMcpTool('consulate_register_agent', {
        name: `Evidence Agent ${timestamp}`,
        publicKey: testPublicKey,
        organizationName: `Evidence Test Org ${timestamp}`,
        functionalType: 'general'
      });
      evidenceAgentDid = agentData.agentDid;

      // Create a case for evidence
      const { data: disputeData } = await invokeMcpTool('consulate_file_dispute', {
        transactionId: `txn_evidence_setup_${timestamp}`,
        amount: 1.00,
        currency: 'USD',
        paymentProtocol: 'ACP',
        plaintiff: evidenceAgentDid, // Use DID directly
        defendant: 'merchant:evidence@example.com',
        disputeReason: 'api_timeout',
        description: 'Setup case for evidence tests'
      });
      evidenceCaseId = disputeData.caseId;
      testCaseId = evidenceCaseId; // Set for other tests
    });

    it('should submit evidence successfully', async () => {
      // Generate unique SHA256 hash to avoid duplicate detection
      const uniqueHash = Date.now().toString(16).padStart(64, '0');

      const { response, data } = await invokeMcpTool('consulate_submit_evidence', {
        agentDid: evidenceAgentDid,
        caseId: evidenceCaseId,
        evidenceUrl: 'https://logs.example.com/evidence.json',
        sha256: uniqueHash,
        description: 'Server timeout logs showing API failure'
      });

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.evidenceId).toBeDefined();
      expect(data.message).toContain('Evidence submitted');
    });

    it('should accept evidence with any SHA256 format', async () => {
      // NOTE: Current implementation doesn't validate SHA256 length/format
      // This test documents current behavior - validation could be added later
      const uniqueHash = `short_${Date.now()}`;

      const { response, data } = await invokeMcpTool('consulate_submit_evidence', {
        agentDid: evidenceAgentDid,
        caseId: evidenceCaseId,
        evidenceUrl: 'https://logs.example.com/evidence2.json',
        sha256: uniqueHash, // Currently accepts any string
        description: 'Evidence with non-standard hash'
      });

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('4. consulate_check_case_status', () => {
    it('should get case status', async () => {
      if (!testCaseId) {
        // Create a case first
        const timestamp = Date.now();
        const { data: disputeData } = await invokeMcpTool('consulate_file_dispute', {
          transactionId: `txn_status_${timestamp}`,
          amount: 2.00,
          currency: 'USD',
          paymentProtocol: 'ACP',
          plaintiff: 'consumer:status@example.com',
          defendant: 'merchant:status@example.com',
          disputeReason: 'fraud',
          description: 'Check status test'
        });
        testCaseId = disputeData.caseId;
      }

      const { response, data } = await invokeMcpTool('consulate_check_case_status', {
        caseId: testCaseId
      });

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.case).toBeDefined();
      expect(data.case.status).toBeDefined();
      // Type could be "PAYMENT" or "PAYMENT_DISPUTE" depending on implementation
      expect(data.case.type).toMatch(/PAYMENT/);
    });

    it('should return error for non-existent case', async () => {
      const fakeCaseId = 'k17xm47xm47xm47xm47xm47xm47xm4';
      const { response, data } = await invokeMcpTool('consulate_check_case_status', {
        caseId: fakeCaseId
      });

      // Either 404 or 200 with null/undefined case
      if (response.status === 404) {
        expect(data.success).toBe(false);
      } else {
        expect(data.case).toBeFalsy(); // null or undefined
      }
    });
  });

  describe('5. consulate_lookup_agent (search agents by query)', () => {
    it('should lookup agent by organization name', async () => {
      // Register an agent first to ensure we have something to find
      const timestamp = Date.now();
      const orgName = `LookupTestOrg${timestamp}`;
      const testPublicKey = "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk";
      await invokeMcpTool('consulate_register_agent', {
        name: `${orgName} Agent`,
        publicKey: testPublicKey,
        organizationName: orgName,
        functionalType: 'api'
      });

      // Now search for it
      const { response, data } = await invokeMcpTool('consulate_lookup_agent', {
        query: orgName
      });

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.matches).toBeDefined();
      expect(Array.isArray(data.matches)).toBe(true);
      expect(data.matches.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent organization', async () => {
      const { response, data } = await invokeMcpTool('consulate_lookup_agent', {
        query: 'NonExistentOrganization999999'
      });

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });
  });

  describe('6. consulate_lookup_agent (discover agents by functional type)', () => {
    it('should filter agents by functional type', async () => {
      // Register an API agent first
      const timestamp = Date.now();
      const testPublicKey = "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk";
      await invokeMcpTool('consulate_register_agent', {
        name: `API Test ${timestamp}`,
        publicKey: testPublicKey,
        organizationName: `API Test Org ${timestamp}`,
        functionalType: 'api'
      });

      const { response, data } = await invokeMcpTool('consulate_lookup_agent', {
        query: `Test ${timestamp}`,
        functionalType: 'api'
      });

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.matches).toBeDefined();
      // Should find the agent we just registered
      if (data.matches.length > 0) {
        expect(data.matches.every((m: any) => m.functionalType === 'api')).toBe(true);
      }
    });

    it('should search across all functional types', async () => {
      // Register an agent
      const timestamp = Date.now();
      const testPublicKey = "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk";
      await invokeMcpTool('consulate_register_agent', {
        name: `General Test ${timestamp}`,
        publicKey: testPublicKey,
        organizationName: `General Test Org ${timestamp}`,
        functionalType: 'general'
      });

      const { response, data } = await invokeMcpTool('consulate_lookup_agent', {
        query: `General Test ${timestamp}`
      });

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.matches).toBeDefined();
    });
  });

  describe('7. consulate_list_my_cases (get case history)', () => {
    it('should list cases for an agent', async () => {
      // Create an agent and file a dispute
      const timestamp = Date.now();
      const testPublicKey = "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk";
      const { data: agentData } = await invokeMcpTool('consulate_register_agent', {
        name: `Cases Test ${timestamp}`,
        publicKey: testPublicKey,
        organizationName: `Cases Test Org ${timestamp}`,
        functionalType: 'general'
      });

      await invokeMcpTool('consulate_file_dispute', {
        transactionId: `txn_list_${timestamp}`,
        amount: 1.00,
        currency: 'USD',
        paymentProtocol: 'ACP',
        plaintiff: agentData.agentDid, // Use DID directly, not with prefix
        defendant: 'merchant:test@example.com',
        disputeReason: 'fraud',
        description: 'Test dispute for list_my_cases'
      });

      const { response, data } = await invokeMcpTool('consulate_list_my_cases', {
        agentDid: agentData.agentDid
      });

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.cases).toBeDefined();
      expect(Array.isArray(data.cases)).toBe(true);
      expect(data.cases.length).toBeGreaterThan(0);
    });

    it('should filter by status', async () => {
      // Create an agent
      const timestamp = Date.now();
      const testPublicKey = "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk";
      const { data: agentData } = await invokeMcpTool('consulate_register_agent', {
        name: `Status Filter Test ${timestamp}`,
        publicKey: testPublicKey,
        organizationName: `Status Filter Org ${timestamp}`,
        functionalType: 'general'
      });

      const { response, data } = await invokeMcpTool('consulate_list_my_cases', {
        agentDid: agentData.agentDid,
        status: 'FILED'
      });

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.cases).toBeDefined();
      expect(Array.isArray(data.cases)).toBe(true);
    });
  });

  describe('8. consulate_list_my_cases (list recent cases)', () => {
    it('should list all cases for an agent', async () => {
      // Create an agent
      const timestamp = Date.now();
      const testPublicKey = "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk";
      const { data: agentData } = await invokeMcpTool('consulate_register_agent', {
        name: `Recent Cases Test ${timestamp}`,
        publicKey: testPublicKey,
        organizationName: `Recent Cases Org ${timestamp}`,
        functionalType: 'general'
      });

      const { response, data } = await invokeMcpTool('consulate_list_my_cases', {
        agentDid: agentData.agentDid
      });

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.cases).toBeDefined();
      expect(Array.isArray(data.cases)).toBe(true);
    });

    it('should include case metadata when cases exist', async () => {
      // Create an agent and a dispute
      const timestamp = Date.now();
      const testPublicKey = "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk";
      const { data: agentData } = await invokeMcpTool('consulate_register_agent', {
        name: `Metadata Test ${timestamp}`,
        publicKey: testPublicKey,
        organizationName: `Metadata Test Org ${timestamp}`,
        functionalType: 'general'
      });

      await invokeMcpTool('consulate_file_dispute', {
        transactionId: `txn_metadata_${timestamp}`,
        amount: 1.00,
        currency: 'USD',
        paymentProtocol: 'ACP',
        plaintiff: agentData.agentDid, // Use DID directly
        defendant: 'merchant:test@example.com',
        disputeReason: 'fraud',
        description: 'Test for metadata'
      });

      const { response, data } = await invokeMcpTool('consulate_list_my_cases', {
        agentDid: agentData.agentDid
      });

      expect(response.status).toBe(200);
      expect(data.cases).toBeDefined();
      if (data.cases && data.cases.length > 0) {
        const case1 = data.cases[0];
        expect(case1._id).toBeDefined();
        expect(case1.status).toBeDefined();
        expect(case1.filedAt || case1.createdAt).toBeDefined();
      }
    });
  });

  describe('Integration: Full Dispute Flow via MCP', () => {
    it('should complete full dispute lifecycle via MCP tools', async () => {
      const timestamp = Date.now();

      // 1. Register consumer agent
      const testPublicKey = "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk";
      const { data: consumerData } = await invokeMcpTool('consulate_register_agent', {
        name: `Consumer Agent ${timestamp}`,
        publicKey: testPublicKey,
        organizationName: `Consumer Org ${timestamp}`,
        functionalType: 'general'
      });
      expect(consumerData.success).toBe(true);
      const consumerDid = consumerData.agentDid;

      // 2. Register merchant agent
      const merchantPublicKey = "ZGVmZW5kYW50X3B1YmxpY19rZXlfMzJfYnl0ZXNfYmFzZTY0X2VuY29kZWQ";
      const { data: merchantData } = await invokeMcpTool('consulate_register_agent', {
        name: `Merchant Agent ${timestamp}`,
        publicKey: merchantPublicKey,
        organizationName: `Merchant Org ${timestamp}`,
        functionalType: 'api'
      });
      expect(merchantData.success).toBe(true);
      const merchantDid = merchantData.agentDid;

      // 3. File dispute
      const { data: disputeData } = await invokeMcpTool('consulate_file_dispute', {
        transactionId: `txn_integration_${timestamp}`,
        amount: 10.00,
        currency: 'USD',
        paymentProtocol: 'ACP',
        plaintiff: consumerDid, // Use DID directly
        defendant: merchantDid, // Use DID directly
        disputeReason: 'service_not_rendered',
        description: 'API service never responded'
      });
      expect(disputeData.success).toBe(true);
      const caseId = disputeData.caseId;

      // 4. Submit evidence
      const uniqueHash = timestamp.toString(16).padStart(64, '0');
      const { data: evidenceData } = await invokeMcpTool('consulate_submit_evidence', {
        agentDid: consumerDid,
        caseId: caseId,
        evidenceUrl: `https://logs.example.com/integration-${timestamp}.json`,
        sha256: uniqueHash, // Unique hash based on timestamp
        description: 'Request logs showing no response'
      });
      expect(evidenceData.success).toBe(true);

      // 5. Check case status
      const { data: statusData } = await invokeMcpTool('consulate_check_case_status', {
        caseId: caseId
      });
      expect(statusData.success).toBe(true);
      expect(statusData.case).toBeDefined();
      expect(statusData.case.status).toBeDefined();

      // 6. Verify cases can be listed
      const { data: casesData } = await invokeMcpTool('consulate_list_my_cases', {
        agentDid: consumerDid
      });
      expect(casesData.success).toBe(true);
      expect(casesData.cases).toBeDefined();
      expect(casesData.cases.length).toBeGreaterThan(0);
    });
  });
});
