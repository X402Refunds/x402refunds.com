import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * API Key Management for Organization Authentication
 * 
 * Organizations use API keys (csk_live_* or csk_test_*) to authenticate agents
 * for autonomous registration. This is the Stripe-style authentication approach.
 */

// Generate a secure API key string with proper prefix
function createApiKeyString(prefix: "csk_live_" | "csk_test_"): string {
  const random = crypto.randomUUID().replace(/-/g, '');
  return `${prefix}${random}`;
}

// Validate and get API key record (helper for other mutations)
export async function validateApiKey(ctx: any, key: string) {
  // Try new key field first, then fall back to old token field
  let apiKey = await ctx.db
    .query("apiKeys")
    .withIndex("by_key", (q: any) => q.eq("key", key))
    .first();
  
  if (!apiKey) {
    // Try old token field for backwards compatibility
    const allKeys = await ctx.db.query("apiKeys").collect();
    apiKey = allKeys.find((k: any) => k.token === key);
  }

  if (!apiKey) {
    throw new Error("Invalid API key");
  }

  // Check status (handle both old 'active' field and new 'status' field)
  const isRevoked = apiKey.status === "revoked" || (apiKey.active !== undefined && !apiKey.active);
  if (isRevoked) {
    throw new Error("API key has been revoked");
  }

  if (apiKey.expiresAt && apiKey.expiresAt < Date.now()) {
    throw new Error("API key has expired");
  }

  return apiKey;
}

// Generate a new API key for user's organization
export const generateApiKey = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),                        // "Production Key", "CI/CD Key"
    expiresIn: v.optional(v.number()),       // Optional: days until expiration
  },
  handler: async (ctx, args) => {
    try {
      // Get user
      const user = await ctx.db.get(args.userId);
      if (!user || !user.organizationId) {
        throw new Error("User not found or not part of an organization");
      }

      // Get organization
      const org = await ctx.db.get(user.organizationId);
      if (!org) {
        throw new Error("Organization not found");
      }

      const now = Date.now();
      
      // Generate key (always use live keys for now)
      const key = createApiKeyString("csk_live_");
      
      // Calculate expiration if specified
      const expiresAt = args.expiresIn 
        ? now + (args.expiresIn * 24 * 60 * 60 * 1000)
        : undefined;

      // Create API key record
      const apiKeyId = await ctx.db.insert("apiKeys", {
        key,
        organizationId: user.organizationId,
        name: args.name,
        createdBy: args.userId,
        status: "active",
        expiresAt,
        createdAt: now,
      });

      console.info(`Generated API key for org ${org._id}: ${apiKeyId}`);

      return {
        keyId: apiKeyId,
        key,  // IMPORTANT: Only returned once!
        name: args.name,
        expiresAt,
        createdAt: now,
      };
    } catch (error) {
      console.error("Failed to generate API key:", error);
      throw new Error(`Failed to generate API key: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// List all API keys for an organization
export const listApiKeys = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const keys = await ctx.db
      .query("apiKeys")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    // Return keys without the actual key value (security)
    return keys.map(k => {
      // Handle backwards compatibility with old 'token' field
      const keyValue = k.key || (k as any).token;
      const keyPreview = keyValue 
        ? `${keyValue.substring(0, 12)}...${keyValue.substring(keyValue.length - 4)}` 
        : 'N/A';
      
      return {
        _id: k._id,
        name: k.name,
        keyPreview,
        status: k.status || 'active',
        lastUsedAt: k.lastUsedAt,
        expiresAt: k.expiresAt,
        createdAt: k.createdAt,
        createdBy: k.createdBy || k.createdByUserId,
      };
    });
  },
});

// Revoke an API key
export const revokeApiKey = mutation({
  args: {
    keyId: v.id("apiKeys"),
    userId: v.id("users"),  // For authorization check
  },
  handler: async (ctx, args) => {
    try {
      // Get the key
      const apiKey = await ctx.db.get(args.keyId);
      if (!apiKey) {
        throw new Error("API key not found");
      }

      // Verify user belongs to same organization
      const user = await ctx.db.get(args.userId);
      if (!user || user.organizationId !== apiKey.organizationId) {
        throw new Error("Unauthorized to revoke this API key");
      }

      // Revoke the key
      await ctx.db.patch(args.keyId, {
        status: "revoked",
      });

      console.info(`Revoked API key: ${args.keyId}`);
      return { success: true };
    } catch (error) {
      console.error("Failed to revoke API key:", error);
      throw new Error(`Failed to revoke API key: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Get API key information (for validation - doesn't return the key itself)
export const getApiKeyInfo = query({
  args: { keyId: v.id("apiKeys") },
  handler: async (ctx, args) => {
    const apiKey = await ctx.db.get(args.keyId);
    if (!apiKey) {
      return null;
    }

    // Get creator info
    const creatorId = apiKey.createdBy || apiKey.createdByUserId;
    const creator = creatorId ? await ctx.db.get(creatorId) : null;
    
    return {
      _id: apiKey._id,
      name: apiKey.name,
      keyPreview: apiKey.key ? `${apiKey.key.substring(0, 12)}...${apiKey.key.substring(apiKey.key.length - 4)}` : 'N/A',
      status: apiKey.status || 'active',
      lastUsedAt: apiKey.lastUsedAt,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
      createdBy: {
        _id: creator?._id,
        name: creator?.name,
        email: creator?.email,
      },
    };
  },
});

// Update API key last used timestamp (internal helper)
export const updateApiKeyUsage = mutation({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = await ctx.db
      .query("apiKeys")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (apiKey) {
      await ctx.db.patch(apiKey._id, {
        lastUsedAt: Date.now(),
      });
    }
  },
});

// Update API key name/environment label
export const updateApiKeyName = mutation({
  args: {
    keyId: v.id("apiKeys"),
    name: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get user to verify organization
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get API key and verify it belongs to user's organization
    const apiKey = await ctx.db.get(args.keyId);
    if (!apiKey) {
      throw new Error("API key not found");
    }

    if (apiKey.organizationId !== user.organizationId) {
      throw new Error("Unauthorized: API key belongs to different organization");
    }

    // Update the name
    await ctx.db.patch(args.keyId, {
      name: args.name.trim(),
    });

    return { success: true };
  },
});

// Ensure default API keys exist for an organization (Production and Development)
// Used for migration and ensuring existing orgs have the default keys
export const ensureDefaultApiKeys = mutation({
  args: { 
    organizationId: v.id("organizations"),
    createdByUserId: v.optional(v.id("users")), // Optional: first user of org
  },
  handler: async (ctx, args) => {
    try {
      // Check if org exists
      const org = await ctx.db.get(args.organizationId);
      if (!org) {
        throw new Error("Organization not found");
      }

      // Get existing keys for this organization
      const existingKeys = await ctx.db
        .query("apiKeys")
        .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
        .collect();
      
      const now = Date.now();
      const keysCreated: string[] = [];

      // Create Production key if doesn't exist
      if (!existingKeys.some(k => k.name === "Production")) {
        const productionKey = createApiKeyString("csk_live_");
        await ctx.db.insert("apiKeys", {
          key: productionKey,
          organizationId: args.organizationId,
          name: "Production",
          createdBy: args.createdByUserId,
          status: "active",
          createdAt: now,
        });
        keysCreated.push("Production");
      }
      
      // Create Development key if doesn't exist
      if (!existingKeys.some(k => k.name === "Development")) {
        const developmentKey = createApiKeyString("csk_live_");
        await ctx.db.insert("apiKeys", {
          key: developmentKey,
          organizationId: args.organizationId,
          name: "Development",
          createdBy: args.createdByUserId,
          status: "active",
          createdAt: now,
        });
        keysCreated.push("Development");
      }

      console.info(`Ensured default API keys for org ${args.organizationId}. Created: ${keysCreated.join(", ") || "none (already exist)"}`);
      
      return { 
        success: true,
        keysCreated,
        message: keysCreated.length > 0 
          ? `Created ${keysCreated.join(" and ")} API key(s)` 
          : "All default keys already exist"
      };
    } catch (error) {
      console.error("Failed to ensure default API keys:", error);
      throw new Error(`Failed to ensure default API keys: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

