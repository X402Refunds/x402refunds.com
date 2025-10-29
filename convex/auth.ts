import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export interface AuthContext {
  agentDid: string;
  signature: string;
  timestamp: number;
}

/**
 * Verify Ed25519 signature
 * 
 * Expects:
 * - message: UTF-8 string to verify
 * - signature: Hex-encoded signature (128 chars = 64 bytes)
 * - publicKey: Hex-encoded public key (64 chars = 32 bytes)
 * 
 * Returns true if signature is valid, false otherwise
 */
export async function verifySignature(
  message: string,
  signature: string,
  publicKey: string
): Promise<boolean> {
  try {
    // Validate input formats
    if (!signature || !publicKey || !message) {
      console.error("Missing required parameters for signature verification");
      return false;
    }
    
    // Ed25519 signatures are 64 bytes (128 hex chars)
    if (signature.length !== 128) {
      console.error(`Invalid signature length: ${signature.length}, expected 128`);
      return false;
    }
    
    // Ed25519 public keys are 32 bytes (64 hex chars)
    if (publicKey.length !== 64) {
      console.error(`Invalid public key length: ${publicKey.length}, expected 64`);
      return false;
    }
    
    // Convert hex strings to Uint8Arrays
    const signatureBytes = hexToBytes(signature);
    const publicKeyBytes = hexToBytes(publicKey);
    const messageBytes = new TextEncoder().encode(message);
    
    // Use Web Crypto API for Ed25519 verification
    // Note: Convex runtime supports crypto.subtle
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      publicKeyBytes as BufferSource,
      {
        name: "Ed25519",
        namedCurve: "Ed25519"
      } as any, // Ed25519 params aren't fully typed in all environments
      false,
      ["verify"]
    );
    
    const isValid = await crypto.subtle.verify(
      "Ed25519" as any,
      cryptoKey,
      signatureBytes as BufferSource,
      messageBytes as BufferSource
    );
    
    return isValid;
  } catch (error) {
    console.error("Signature verification failed:", error);
    return false;
  }
}

// Helper: Convert hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

export function extractAuthFromHeaders(headers: Headers): AuthContext | null {
  const agentDid = headers.get("x-agent-did");
  const signature = headers.get("x-signature");
  const timestamp = headers.get("x-timestamp");

  if (!agentDid || !signature || !timestamp) {
    return null;
  }

  return {
    agentDid,
    signature,
    timestamp: parseInt(timestamp, 10),
  };
}

export function createAuthMessage(
  method: string,
  path: string,
  body: string,
  timestamp: number
): string {
  return `${method}:${path}:${body}:${timestamp}`;
}

/**
 * Validate signature-based authentication
 * 
 * Verifies that the agent's signature matches their registered public key
 * Uses Ed25519 cryptographic signatures for non-repudiation
 */
export async function validateAuth(
  ctx: any,
  authContext: AuthContext,
  method: string,
  path: string,
  body: string
): Promise<boolean> {
  // Check timestamp (within 5 minutes)
  const now = Date.now();
  if (Math.abs(now - authContext.timestamp) > 5 * 60 * 1000) {
    console.error("Timestamp outside valid window (5 minutes)");
    return false;
  }

  // Get agent by DID
  const agent = await ctx.db
    .query("agents")
    .withIndex("by_did", (q: any) => q.eq("did", authContext.agentDid))
    .first();

  if (!agent) {
    console.error(`Agent not found: ${authContext.agentDid}`);
    return false;
  }

  // Check if agent has public key registered
  if (!agent.publicKey) {
    console.error(`Agent ${authContext.agentDid} has no public key registered`);
    return false;
  }

  // Verify agent is active
  if (agent.status !== "active") {
    console.error(`Agent ${authContext.agentDid} is not active (status: ${agent.status})`);
    return false;
  }

  // Create message to verify (standard format for all requests)
  const message = createAuthMessage(method, path, body, authContext.timestamp);

  // Verify signature against agent's public key
  const isValid = await verifySignature(message, authContext.signature, agent.publicKey);
  
  if (!isValid) {
    console.error(`Signature verification failed for agent: ${authContext.agentDid}`);
  }
  
  return isValid;
}


// DEPRECATED: Owners table removed - ownerDid is now stored directly in agents table
// Keeping this as a stub for backward compatibility with old code references
export const createOwner = mutation({
  args: {
    did: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    verificationTier: v.optional(v.union(v.literal("basic"), v.literal("verified"), v.literal("premium"))),
    pubkeys: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    console.warn(`DEPRECATED: createOwner called for ${args.did}. Owners table no longer exists. OwnerDid is stored directly in agents table.`);
    throw new Error("DEPRECATED: Owners table removed. OwnerDid is now stored directly in agents table.");
  },
});
