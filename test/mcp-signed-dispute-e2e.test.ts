/**
 * End-to-End Test: Filing Signed Disputes via MCP
 * 
 * Tests the complete signed dispute flow:
 * 1. Create payload (seller signs API response)
 * 2. Sign with Ed25519 private key
 * 3. Register vendor with public key
 * 4. File dispute via MCP API with signed evidence
 * 5. Verify cryptographic signature verification
 */

import { describe, it, expect } from 'vitest';
import { API_BASE_URL } from './fixtures';
import crypto from 'crypto';

// Test Ed25519 key pair
const PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIKDjC/C8ZbbD2tdMC1Y6++bdimcGrYJpH8NSRp4qo4TM
-----END PRIVATE KEY-----`;

/**
 * Extract public key from private key
 */
function extractPublicKey(privateKeyPem: string): string {
  const privateKey = crypto.createPrivateKey({
    key: privateKeyPem,
    format: 'pem',
    type: 'pkcs8'
  });
  
  const publicKey = crypto.createPublicKey(privateKey);
  const publicKeyDer = publicKey.export({ type: 'spki', format: 'der' });
  
  // Ed25519 public key is the last 32 bytes of the DER format
  const publicKeyRaw = publicKeyDer.slice(-32);
  return publicKeyRaw.toString('base64');
}

/**
 * Create test payload (what seller would sign)
 */
function createTestPayload(amountUsd: number = 0.25) {
  return {
    request: {
      method: "POST",
      path: "/v1/chat/completions",
      headers: {
        "content-type": "application/json",
        "authorization": "Bearer sk_test_***"
      },
      body: {
        model: "gpt-4",
        messages: [{ role: "user", content: "Hello!" }]
      }
    },
    response: {
      status: 500,
      headers: {
        "content-type": "application/json"
      },
      body: '{"error": "Internal server error"}'
    },
    amountUsd,
    x402paymentDetails: {
      transactionHash: `0x${Date.now()}abc123def456`,
      blockchain: "ethereum",
      currency: "USDC",
      fromAddress: "0xBuyer123",
      toAddress: "0xSeller456"
    }
  };
}

/**
 * Sign payload with Ed25519 private key
 */
function signPayload(payload: any, privateKeyPem: string) {
  const payloadString = JSON.stringify(payload);
  
  // Import private key
  const privateKey = crypto.createPrivateKey({
    key: privateKeyPem,
    format: 'pem',
    type: 'pkcs8'
  });
  
  // Sign the payload
  const signature = crypto.sign(null, Buffer.from(payloadString, 'utf-8'), privateKey);
  
  // Convert to base64
  const signatureBase64 = signature.toString('base64');
  
  return {
    payloadString,
    signatureBase64,
    payloadBase64: Buffer.from(payloadString, 'utf-8').toString('base64')
  };
}

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

describe('MCP Signed Dispute E2E', () => {
  it('should file dispute with cryptographically signed evidence', async () => {
    const timestamp = Date.now();
    
    // 1. Extract public key from private key
    const publicKeyBase64 = extractPublicKey(PRIVATE_KEY_PEM);
    console.log("✅ Public key extracted:", publicKeyBase64.substring(0, 20) + "...");
    
    // 2. Register vendor with public key (via HTTP, not MCP since tool removed)
    const registerResponse = await fetch(`${API_BASE_URL}/agents/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `test-seller-${timestamp}`,
        publicKey: publicKeyBase64,
        organizationName: `Test Seller Org ${timestamp}`,
        functionalType: 'api'
      })
    });
    
    const registerData = await registerResponse.json();
    expect(registerResponse.status).toBe(200);
    expect(registerData.success).toBe(true);
    expect(registerData.agentDid).toBeDefined();
    
    const vendorDid = registerData.agentDid;
    console.log("✅ Vendor registered:", vendorDid);
    
    // 3. Create test payload
    const payload = createTestPayload(0.25);
    
    // 4. Sign the payload
    const { payloadBase64, signatureBase64 } = signPayload(payload, PRIVATE_KEY_PEM);
    console.log("✅ Payload signed (signature length:", signatureBase64.length, "chars)");
    
    // 5. Construct dispute URL
    const disputeUrl = `https://api.consulatehq.com/disputes/claim?vendor=${vendorDid}`;
    
    // 6. File dispute via MCP with signed evidence
    const { response: disputeResponse, data: disputeData } = await invokeMcpTool('consulate_file_dispute', {
      plaintiff: "buyer:alice@example.com",
      disputeUrl: disputeUrl,
      description: "API returned 500 error after payment was processed",
      evidencePayload: payloadBase64,
      signature: signatureBase64,
      callbackUrl: "https://example.com/webhook"
    });
    
    console.log("📥 Dispute response:", JSON.stringify(disputeData, null, 2));
    
    // Verify dispute filed successfully
    expect(disputeResponse.status).toBe(200);
    expect(disputeData.success).toBe(true);
    expect(disputeData.caseId).toBeDefined();
    expect(disputeData.trackingUrl).toContain('/cases/');
    expect(disputeData.disputeFee).toBe(0.05);
    
    console.log("✅ Dispute filed successfully!");
    console.log("   Case ID:", disputeData.caseId);
    console.log("   Tracking URL:", disputeData.trackingUrl);
  });

  it('should validate plaintiff format with structured error', async () => {
    const timestamp = Date.now();
    
    // Register vendor
    const publicKeyBase64 = extractPublicKey(PRIVATE_KEY_PEM);
    const registerResponse = await fetch(`${API_BASE_URL}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `validation-test-${timestamp}`,
        publicKey: publicKeyBase64,
        organizationName: `Validation Test ${timestamp}`,
        functionalType: 'api'
      })
    });
    const registerData = await registerResponse.json();
    const vendorDid = registerData.agentDid;
    
    // Create and sign payload
    const payload = createTestPayload(0.50);
    const { payloadBase64, signatureBase64 } = signPayload(payload, PRIVATE_KEY_PEM);
    
    // Try to file with WRONG plaintiff format (DID instead of buyer:/wallet:/user:)
    const { data } = await invokeMcpTool('consulate_file_dispute', {
      plaintiff: "did:agent:buyer-wrong-format", // ❌ Wrong format
      disputeUrl: `https://api.consulatehq.com/disputes/claim?vendor=${vendorDid}`,
      description: "Testing plaintiff validation",
      evidencePayload: payloadBase64,
      signature: signatureBase64
    });
    
    // Verify structured error response
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('INVALID_PLAINTIFF_FORMAT');
    expect(data.error.field).toBe('plaintiff');
    expect(data.error.received).toContain('did:agent:');
    expect(data.error.expected).toBeDefined();
    expect(data.error.suggestion).toContain('DO NOT use DID format');
    
    console.log("✅ Structured error validated:", JSON.stringify(data.error, null, 2));
  });

  it('should support dryRun parameter for validation without filing', async () => {
    const timestamp = Date.now();
    
    // Register vendor
    const publicKeyBase64 = extractPublicKey(PRIVATE_KEY_PEM);
    const registerResponse = await fetch(`${API_BASE_URL}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `dryrun-test-${timestamp}`,
        publicKey: publicKeyBase64,
        organizationName: `DryRun Test ${timestamp}`,
        functionalType: 'api'
      })
    });
    const registerData = await registerResponse.json();
    const vendorDid = registerData.agentDid;
    
    // Create and sign payload
    const payload = createTestPayload(0.75);
    const { payloadBase64, signatureBase64 } = signPayload(payload, PRIVATE_KEY_PEM);
    
    // Test with dryRun = true
    const { data } = await invokeMcpTool('consulate_file_dispute', {
      plaintiff: "buyer:bob@example.com",
      disputeUrl: `https://api.consulatehq.com/disputes/claim?vendor=${vendorDid}`,
      description: "Testing dryRun validation",
      evidencePayload: payloadBase64,
      signature: signatureBase64,
      dryRun: true // ← Test mode
    });
    
    // Verify dryRun response
    expect(data.success).toBe(true);
    expect(data.dryRun).toBe(true);
    expect(data.wouldExecute).toBeDefined();
    expect(data.wouldExecute.action).toBe('file_payment_dispute');
    expect(data.wouldExecute.plaintiff).toBe('buyer:bob@example.com');
    expect(data.wouldExecute.defendant).toBe(vendorDid);
    expect(data.wouldExecute.amount).toBe(0.75);
    expect(data.validations).toBeDefined();
    expect(data.validations.signature).toBeDefined(); // Check the actual key name
    expect(data.nextSteps).toBeDefined();
    
    console.log("✅ DryRun validation complete:", JSON.stringify(data.validations, null, 2));
  });

  it('should reject invalid base64 evidencePayload with helpful error', async () => {
    const timestamp = Date.now();
    
    // Register vendor
    const publicKeyBase64 = extractPublicKey(PRIVATE_KEY_PEM);
    const registerResponse = await fetch(`${API_BASE_URL}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `base64-test-${timestamp}`,
        publicKey: publicKeyBase64,
        organizationName: `Base64 Test ${timestamp}`,
        functionalType: 'api'
      })
    });
    const registerData = await registerResponse.json();
    const vendorDid = registerData.agentDid;
    
    // Try with invalid base64
    const { data } = await invokeMcpTool('consulate_file_dispute', {
      plaintiff: "buyer:charlie@example.com",
      disputeUrl: `https://api.consulatehq.com/disputes/claim?vendor=${vendorDid}`,
      description: "Testing base64 validation",
      evidencePayload: "not-valid-base64!@#$", // ❌ Invalid
      signature: "fake-signature"
    });
    
    // Verify structured error
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INVALID_BASE64');
    expect(data.error.field).toBe('evidencePayload');
    expect(data.error.suggestion).toContain('Do NOT decode');
    
    console.log("✅ Base64 error validated:", data.error.message);
  });

  it('should reject disputes for unregistered vendors', async () => {
    // Try to file against non-existent vendor
    const payload = createTestPayload(1.00);
    const { payloadBase64, signatureBase64 } = signPayload(payload, PRIVATE_KEY_PEM);
    
    const { data } = await invokeMcpTool('consulate_file_dispute', {
      plaintiff: "buyer:diana@example.com",
      disputeUrl: "https://api.consulatehq.com/disputes/claim?vendor=did:agent:nonexistent-vendor-999",
      description: "Testing vendor verification",
      evidencePayload: payloadBase64,
      signature: signatureBase64
    });
    
    // Verify structured error
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VENDOR_NOT_FOUND');
    expect(data.error.field).toBe('disputeUrl');
    expect(data.error.suggestion).toContain('not registered');
    
    console.log("✅ Vendor not found error validated:", data.error.message);
  });
});

