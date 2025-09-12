export interface AuthContext {
  agentDid: string;
  signature: string;
  timestamp: number;
}

export interface BearerAuthResult {
  valid: boolean;
  agentDid?: string;
  agentType?: string;
  permissions: string[];
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

// Generate API key for agents
export function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'ak_live_';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Extract Bearer token from Authorization header
export function extractBearerToken(headers: Headers): string | null {
  const auth = headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7);
  }
  return null;
}

// Validate Bearer token authentication
export async function validateBearerAuth(
  ctx: any,
  token: string
): Promise<BearerAuthResult> {
  try {
    // Look up API key in database
    const apiKey = await ctx.db
      .query("apiKeys")
      .withIndex("by_token", (q: any) => q.eq("token", token))
      .first();
    
    if (!apiKey || !apiKey.active) {
      return { valid: false, permissions: [] };
    }
    
    // Check expiration
    if (apiKey.expiresAt && apiKey.expiresAt < Date.now()) {
      return { valid: false, permissions: [] };
    }
    
    // Get agent info
    const agent = await ctx.db.get(apiKey.agentId);
    if (!agent || agent.status !== "active") {
      return { valid: false, permissions: [] };
    }
    
    // Return permissions based on agent type
    const permissions = getPermissionsForAgentType(agent.agentType);
    
    return {
      valid: true,
      agentDid: agent.did,
      agentType: agent.agentType,
      permissions
    };
  } catch (error) {
    console.error("Bearer auth validation error:", error);
    return { valid: false, permissions: [] };
  }
}

// Get permissions based on agent type
function getPermissionsForAgentType(agentType: string): string[] {
  const permissions = {
    session: ["evidence", "disputes", "cases"],
    ephemeral: ["evidence", "disputes", "cases", "voting"],
    physical: ["evidence", "disputes", "cases", "voting", "location"],
    verified: ["evidence", "disputes", "cases", "voting", "proposals"],
    premium: ["evidence", "disputes", "cases", "voting", "proposals", "emergency"]
  };
  
  return permissions[agentType as keyof typeof permissions] || ["evidence"];
}

// Unified auth validation - supports both Bearer tokens and Ed25519
export async function validateUnifiedAuth(
  ctx: any,
  request: Request,
  method: string,
  path: string,
  body: string
): Promise<{ valid: boolean; agentDid?: string; agentType?: string; permissions: string[] }> {
  // Try Bearer token first
  const bearerToken = extractBearerToken(request.headers);
  if (bearerToken) {
    return await validateBearerAuth(ctx, bearerToken);
  }
  
  // Fall back to Ed25519 signature
  const authContext = extractAuthFromHeaders(request.headers);
  if (authContext) {
    const isValid = await validateAuth(ctx, authContext, method, path, body);
    if (isValid) {
      // Get agent info for Ed25519 auth
      const agent = await ctx.db
        .query("agents")
        .withIndex("by_did", (q: any) => q.eq("did", authContext.agentDid))
        .first();
      
      return {
        valid: true,
        agentDid: authContext.agentDid,
        agentType: agent?.agentType || "verified",
        permissions: getPermissionsForAgentType(agent?.agentType || "verified")
      };
    }
  }
  
  return { valid: false, permissions: [] };
}
