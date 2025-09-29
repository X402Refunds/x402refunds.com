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

