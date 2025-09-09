import * as ed25519 from '@noble/ed25519';
import { createHash } from 'crypto';

/**
 * Generate a new Ed25519 key pair
 */
export async function generateKeys(): Promise<{ privateKey: string; publicKey: string }> {
  const privateKey = ed25519.utils.randomPrivateKey();
  const publicKey = await ed25519.getPublicKey(privateKey);
  
  return {
    privateKey: Buffer.from(privateKey).toString('hex'),
    publicKey: Buffer.from(publicKey).toString('hex'),
  };
}

/**
 * Load keys from hex strings
 */
export async function loadKeys(privateKeyHex: string): Promise<{ privateKey: Uint8Array; publicKey: Uint8Array }> {
  const privateKey = Buffer.from(privateKeyHex, 'hex');
  const publicKey = await ed25519.getPublicKey(privateKey);
  
  return {
    privateKey,
    publicKey,
  };
}

/**
 * Sign data with Ed25519 private key
 */
export async function sign(data: string | Uint8Array, privateKey: string | Uint8Array): Promise<string> {
  const message = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const key = typeof privateKey === 'string' ? Buffer.from(privateKey, 'hex') : privateKey;
  
  const signature = await ed25519.sign(message, key);
  return Buffer.from(signature).toString('base64');
}

/**
 * Verify Ed25519 signature
 */
export async function verify(
  data: string | Uint8Array,
  signature: string,
  publicKey: string | Uint8Array
): Promise<boolean> {
  try {
    const message = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const sig = Buffer.from(signature, 'base64');
    const key = typeof publicKey === 'string' ? Buffer.from(publicKey, 'hex') : publicKey;
    
    return await ed25519.verify(sig, message, key);
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Compute SHA-256 hash
 */
export function sha256(data: string | Uint8Array): string {
  const input = typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data);
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Compute SHA-256 hash of JSON object (deterministic)
 */
export function sha256Json(obj: any): string {
  const json = JSON.stringify(obj, Object.keys(obj).sort());
  return sha256(json);
}

/**
 * Create authentication headers for API requests
 */
export async function createAuthHeaders(
  method: string,
  path: string,
  body: string,
  agentDid: string,
  privateKey: string
): Promise<Record<string, string>> {
  const timestamp = Date.now();
  const message = `${method}:${path}:${body}:${timestamp}`;
  const signature = await sign(message, privateKey);
  
  return {
    'x-agent-did': agentDid,
    'x-signature': signature,
    'x-timestamp': timestamp.toString(),
    'content-type': 'application/json',
  };
}
