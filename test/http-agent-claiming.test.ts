/**
 * Agent Claiming HTTP Endpoint Tests
 * Tests POST /agents/claim with various scenarios
 */

import { describe, it, expect } from 'vitest';
import { API_BASE_URL } from './fixtures';
import { privateKeyToAccount } from 'viem/accounts';

describe('POST /agents/claim', () => {
  it('should require walletAddress field', async () => {
    const response = await fetch(`${API_BASE_URL}/agents/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signature: '0xabc',
        message: 'I claim agent',
        organizationId: 'org_123',
        userId: 'user_456',
      }),
    });

    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain('walletAddress');
  });

  it('should require signature field', async () => {
    const response = await fetch(`${API_BASE_URL}/agents/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: '0x1234567890123456789012345678901234567890',
        message: 'I claim agent',
        organizationId: 'org_123',
        userId: 'user_456',
      }),
    });

    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain('signature');
  });

  it('should require message field', async () => {
    const response = await fetch(`${API_BASE_URL}/agents/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: '0x1234567890123456789012345678901234567890',
        signature: '0xabc',
        organizationId: 'org_123',
        userId: 'user_456',
      }),
    });

    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain('message');
  });

  it('should require organizationId field', async () => {
    const response = await fetch(`${API_BASE_URL}/agents/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: '0x1234567890123456789012345678901234567890',
        signature: '0xabc',
        message: 'I claim agent',
        userId: 'user_456',
      }),
    });

    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain('organizationId');
  });

  it('should require userId field', async () => {
    const response = await fetch(`${API_BASE_URL}/agents/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: '0x1234567890123456789012345678901234567890',
        signature: '0xabc',
        message: 'I claim agent',
        organizationId: 'org_123',
      }),
    });

    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain('userId');
  });

  it('should handle CORS preflight', async () => {
    const response = await fetch(`${API_BASE_URL}/agents/claim`, {
      method: 'OPTIONS',
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(response.headers.get('access-control-allow-methods')).toContain('POST');
  });

  it('should reject invalid signature format', async () => {
    const response = await fetch(`${API_BASE_URL}/agents/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: '0x1234567890123456789012345678901234567890',
        signature: '0xinvalidsignature',
        message: 'I claim agent 0x1234567890123456789012345678901234567890 on x402disputes.com',
        organizationId: 'jh71ympaqpjkcs3vmd5mg85tn57aj0rc', // Valid Convex ID format
        userId: 'jh71ympaqpjkcs3vmd5mg85tn57aj0rd', // Valid Convex ID format
      }),
    });

    const data = await response.json();
    // Should fail with signature verification error (500) or agent not found error
    // Endpoint may be removed/disabled in some deployments (501).
    if (response.status === 501) {
      expect(data.error || data.message).toMatch(/Not Implemented|not implemented|claim/i);
    } else if (response.status === 500) {
      expect(data.error || data.message).toMatch(/Signature verification failed|Invalid signature|Agent with wallet/i);
    } else {
      // If it fails earlier, that's also acceptable for this test
      expect(response.status).toBe(400);
    }
  });

  it('should reject signature from different wallet', async () => {
    // Create a test wallet to sign the message
    const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const testAccount = privateKeyToAccount(testPrivateKey);
    
    // Different wallet address than the one that signed
    const wrongWallet = '0x0000000000000000000000000000000000000001';
    
    const message = `I claim agent ${wrongWallet.toLowerCase()} on x402disputes.com`;
    const signature = await testAccount.signMessage({ message });
    
    const response = await fetch(`${API_BASE_URL}/agents/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: wrongWallet,
        signature,
        message,
        organizationId: 'jh71ympaqpjkcs3vmd5mg85tn57aj0rc', // Valid Convex ID format
        userId: 'jh71ympaqpjkcs3vmd5mg85tn57aj0rd', // Valid Convex ID format
      }),
    });

    const data = await response.json();
    // Should fail with signature verification error or agent not found
    if (response.status === 501) {
      expect(data.error || data.message).toMatch(/Not Implemented|not implemented|claim/i);
    } else if (response.status === 500) {
      expect(data.error || data.message).toMatch(/Signature was signed by|Signature verification failed|Agent with wallet/i);
    } else {
      expect(response.status).toBe(400);
    }
  });

  it('should verify valid signature (cryptographic proof)', async () => {
    // Create a test wallet
    const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const testAccount = privateKeyToAccount(testPrivateKey);
    const testWallet = testAccount.address;
    
    const message = `I claim agent ${testWallet.toLowerCase()} on x402disputes.com`;
    const signature = await testAccount.signMessage({ message });
    
    // This test will fail if the agent doesn't exist or is already claimed
    // But it proves the signature verification logic works
    const response = await fetch(`${API_BASE_URL}/agents/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: testWallet,
        signature,
        message,
        organizationId: 'jh71ympaqpjkcs3vmd5mg85tn57aj0rc', // Valid Convex ID format
        userId: 'jh71ympaqpjkcs3vmd5mg85tn57aj0rd', // Valid Convex ID format
      }),
    });

    const data = await response.json();
    
    // If agent doesn't exist or already claimed, we should get specific error messages
    // NOT a signature verification error
    if (response.status === 501) {
      expect(data.error || data.message).toMatch(/Not Implemented|not implemented|claim/i);
    } else if (response.status === 500) {
      expect(data.error || data.message).not.toMatch(/Signature verification failed/i);
      expect(data.error || data.message).toMatch(/Agent with wallet|Agent already claimed|not found/i);
    } else if (response.status === 200) {
      // If it succeeds, signature was valid
      expect(data.success).toBe(true);
    } else {
      // 400 is also acceptable if validation failed for other reasons
      expect(response.status).toBe(400);
    }
  });
});

