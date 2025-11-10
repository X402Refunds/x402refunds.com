/**
 * Agent Claiming HTTP Endpoint Tests
 * Tests POST /agents/claim with various scenarios
 */

import { describe, it, expect } from 'vitest';
import { API_BASE_URL } from './fixtures';

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
});

