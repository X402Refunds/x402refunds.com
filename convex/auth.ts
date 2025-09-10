export interface AuthContext {
  agentDid: string;
  signature: string;
  timestamp: number;
}

export async function verifySignature(
  message: string,
  signature: string,
  publicKey: string
): Promise<boolean> {
  // For now, we'll implement basic signature verification
  // In production, you'd use Web Crypto API or similar
  try {
    // Simple validation - in real implementation use proper crypto
    return signature.length > 0 && publicKey.length > 0;
  } catch (error) {
    console.error("Signature verification failed:", error);
    return false;
  }
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
    return false;
  }

  // Get agent's public key
  const agent = await ctx.db
    .query("agents")
    .withIndex("by_did", (q: any) => q.eq("did", authContext.agentDid))
    .first();

  if (!agent) {
    return false;
  }

  // Get owner's public keys
  const owner = await ctx.db
    .query("owners")
    .withIndex("by_did", (q: any) => q.eq("did", agent.ownerDid))
    .first();

  if (!owner || owner.pubkeys.length === 0) {
    return false;
  }

  // Create message to verify
  const message = createAuthMessage(method, path, body, authContext.timestamp);

  // Try each public key
  for (const pubkey of owner.pubkeys) {
    if (await verifySignature(message, authContext.signature, pubkey)) {
      return true;
    }
  }

  return false;
}
