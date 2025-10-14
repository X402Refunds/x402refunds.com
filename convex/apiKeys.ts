import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create API key for agent
export const createApiKey = mutation({
  args: {
    token: v.string(),
    agentId: v.id("agents"),
    expiresAt: v.optional(v.number()),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Creating API key for agent ${args.agentId}`);
      
      const now = Date.now();
      
      const apiKeyId = await ctx.db.insert("apiKeys", {
        token: args.token,
        agentId: args.agentId,
        active: true,
        expiresAt: args.expiresAt,
        permissions: args.permissions,
        createdAt: now,
      });
      
      console.info(`API key created: ${apiKeyId} for agent ${args.agentId}`);
      return apiKeyId;
      
    } catch (error) {
      console.error(`API key creation failed for agent ${args.agentId}:`, error);
      throw new Error(`API key creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Get API key by token
export const getApiKey = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    return await ctx.db
      .query("apiKeys")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
  },
});

// List API keys for an agent
export const listApiKeys = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, { agentId }) => {
    return await ctx.db
      .query("apiKeys")
      .withIndex("by_agent", (q) => q.eq("agentId", agentId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();
  },
});

// Deactivate API key
export const deactivateApiKey = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    try {
      const apiKey = await ctx.db
        .query("apiKeys")
        .withIndex("by_token", (q) => q.eq("token", token))
        .first();
      
      if (!apiKey) {
        throw new Error("API key not found");
      }
      
      await ctx.db.patch(apiKey._id, { active: false });
      
      console.info(`API key deactivated: ${token}`);
      return true;
      
    } catch (error) {
      console.error(`API key deactivation failed for ${token}:`, error);
      throw new Error(`API key deactivation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Update last used timestamp
export const updateLastUsed = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const apiKey = await ctx.db
      .query("apiKeys")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
    
    if (apiKey) {
      await ctx.db.patch(apiKey._id, { lastUsed: Date.now() });
    }
  },
});

// ============================================================================
// USER-FACING API KEY MANAGEMENT
// For dashboard users creating organization-level API keys
// ============================================================================

// Generate a secure random token
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create API key for user's organization
export const createUserApiKey = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    expiresAt: v.optional(v.number()),
    permissions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Creating API key for user: ${args.userId}`);
      
      // Get user and verify organization
      const user = await ctx.db.get(args.userId);
      if (!user) {
        throw new Error("User not found");
      }
      
      if (!user.organizationId) {
        throw new Error("User must belong to an organization");
      }
      
      // Generate secure token with prefix
      const token = `sk_${generateRandomString(48)}`;
      
      // Default permissions (full access)
      const permissions = args.permissions || ["*"];
      
      // Create API key linked to organization
      const apiKeyId = await ctx.db.insert("apiKeys", {
        token,
        organizationId: user.organizationId,
        createdByUserId: args.userId,
        name: args.name,
        active: true,
        expiresAt: args.expiresAt,
        permissions,
        createdAt: Date.now(),
      });
      
      console.info(`API key created: ${apiKeyId} for organization: ${user.organizationId}`);
      
      // Return the key ID and token (token only shown once)
      return { id: apiKeyId, token };
      
    } catch (error) {
      console.error(`API key creation failed for user ${args.userId}:`, error);
      throw new Error(`API key creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// List user's organization API keys
export const listUserApiKeys = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user?.organizationId) return [];
    
    const keys = await ctx.db
      .query("apiKeys")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();
    
    // Map to include creator info
    const keysWithCreator = await Promise.all(
      keys.map(async (key) => {
        let creatorName = "System";
        if (key.createdByUserId) {
          const creator = await ctx.db.get(key.createdByUserId);
          creatorName = creator?.name || creator?.email || "Unknown";
        }
        
        return {
          ...key,
          // Don't return the full token, just a preview
          tokenPreview: `${key.token.substring(0, 12)}...${key.token.substring(key.token.length - 4)}`,
          creatorName,
        };
      })
    );
    
    return keysWithCreator;
  },
});

// Get single API key details (without token)
export const getUserApiKey = query({
  args: { 
    userId: v.id("users"),
    apiKeyId: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    const apiKey = await ctx.db.get(args.apiKeyId);
    
    // Verify user owns this API key (via organization)
    if (apiKey?.organizationId !== user?.organizationId) {
      throw new Error("Unauthorized");
    }
    
    return apiKey;
  },
});

// Revoke API key
export const revokeUserApiKey = mutation({
  args: {
    userId: v.id("users"),
    apiKeyId: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    try {
      const user = await ctx.db.get(args.userId);
      const apiKey = await ctx.db.get(args.apiKeyId);
      
      // Verify user owns this API key (via organization)
      if (apiKey?.organizationId !== user?.organizationId) {
        throw new Error("Unauthorized: API key does not belong to your organization");
      }
      
      await ctx.db.patch(args.apiKeyId, { active: false });
      
      console.info(`API key revoked: ${args.apiKeyId} by user: ${args.userId}`);
      return true;
      
    } catch (error) {
      console.error(`API key revocation failed:`, error);
      throw new Error(`API key revocation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Update API key name
export const updateUserApiKeyName = mutation({
  args: {
    userId: v.id("users"),
    apiKeyId: v.id("apiKeys"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const user = await ctx.db.get(args.userId);
      const apiKey = await ctx.db.get(args.apiKeyId);
      
      // Verify user owns this API key (via organization)
      if (apiKey?.organizationId !== user?.organizationId) {
        throw new Error("Unauthorized: API key does not belong to your organization");
      }
      
      await ctx.db.patch(args.apiKeyId, { name: args.name });
      
      console.info(`API key name updated: ${args.apiKeyId}`);
      return true;
      
    } catch (error) {
      console.error(`API key name update failed:`, error);
      throw new Error(`API key name update failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

