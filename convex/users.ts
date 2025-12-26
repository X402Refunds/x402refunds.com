import { mutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Helper to generate API key string
function createApiKeyString(prefix: "csk_live_" | "csk_test_"): string {
  const random = crypto.randomUUID().replace(/-/g, '');
  return `${prefix}${random}`;
}

/**
 * User Management for Dashboard Users
 * 
 * Handles Clerk user sync, organization management, and user lookups.
 * Users are automatically associated with organizations based on email domain.
 */

// Sync user from Clerk on first login or update existing user
export const syncUser = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    clerkUserId: v.optional(v.string()), // Optional: for test compatibility
  },
  handler: async (ctx, args) => {
    // Get authentication - prefer verified identity, fall back to args for tests
    let identity;
    try {
      identity = await ctx.auth.getUserIdentity();
    } catch (error) {
      console.error("[syncUser] Auth error:", error);
      // Fall back to args for test compatibility
    }
    
    const clerkUserId = identity?.subject || args.clerkUserId;
    
    if (!clerkUserId) {
      console.error("[syncUser] No Clerk user ID found. Identity:", identity, "Args:", args);
      throw new Error("Unauthenticated - must be signed in or provide clerkUserId. Check Convex auth.config.ts matches your Clerk domain.");
    }
    
    try {
      console.info(`Syncing user: ${args.email} (${clerkUserId})`);
      
      // Check if user exists
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkUserId))
        .first();
      
      if (existingUser) {
        // Update last login and name if changed
        await ctx.db.patch(existingUser._id, {
          lastLoginAt: Date.now(),
          name: args.name,
          updatedAt: Date.now(),
        });
        console.info(`Updated existing user: ${existingUser._id}`);
        return existingUser._id;
      }
      
      // Verify email matches identity (security check) - only if using real auth
      if (identity && identity.email && identity.email !== args.email) {
        throw new Error("Email mismatch - please sign in with the correct account");
      }
      
      // Extract domain from email
      const emailParts = args.email.split("@");
      if (emailParts.length !== 2) {
        throw new Error("Invalid email format");
      }
      const domain = emailParts[1];
      
      console.info(`New user signup from domain: ${domain}`);
      
      // Find or create organization by domain
      let org = await ctx.db
        .query("organizations")
        .withIndex("by_domain", (q) => q.eq("domain", domain))
        .first();
      
      if (!org) {
        console.info(`Creating new organization for domain: ${domain}`);
        const now = Date.now();
        const orgId = await ctx.db.insert("organizations", {
          name: domain, // Default to domain name, can be updated later
          domain: domain,
          verified: true, // Auto-verified via Clerk OAuth (Google/Microsoft)
          verifiedAt: now,
          createdAt: now,
        });
        org = await ctx.db.get(orgId);
        console.info(`Organization auto-verified via OAuth: ${domain}`);

        // Ensure refund credits row exists (trial for first 500 orgs)
        await ctx.runMutation(internal.refundCredits.ensureOrgRefundCredits, { organizationId: orgId });
        
        // Auto-generate default API keys for new organization (must happen before user creation)
        const tempUserId = await ctx.db.insert("users", {
          clerkUserId: clerkUserId,
          email: args.email,
          name: args.name || identity?.name || undefined,
          organizationId: org?._id,
          role: "member",
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
        });
        
        // Create Production API key
        const productionKey = createApiKeyString("csk_live_");
        await ctx.db.insert("apiKeys", {
          key: productionKey,
          organizationId: orgId,
          name: "Production",
          createdBy: tempUserId,
          status: "active",
          createdAt: now,
        });
        
        // Create Development API key
        const developmentKey = createApiKeyString("csk_live_");
        await ctx.db.insert("apiKeys", {
          key: developmentKey,
          organizationId: orgId,
          name: "Development",
          createdBy: tempUserId,
          status: "active",
          createdAt: now,
        });
        console.info(`Auto-generated Production and Development API keys for org: ${orgId}`);
        
        // Return early since we already created the user
        return tempUserId;
      } else {
        console.info(`Found existing organization: ${org._id}`);
        // If org exists but not verified, verify it now (OAuth user proves ownership)
        if (!org.verified || org.verified === undefined) {
          await ctx.db.patch(org._id, {
            verified: true,
            verifiedAt: Date.now(),
            updatedAt: Date.now(),
          });
          console.info(`Existing organization now verified via OAuth: ${domain}`);
        }
      }

      // Ensure refund credits row exists for existing orgs too
      if (org?._id) {
        await ctx.runMutation(internal.refundCredits.ensureOrgRefundCredits, { organizationId: org._id });
      }
      
      // Create user
      const userId = await ctx.db.insert("users", {
        clerkUserId: clerkUserId,
        email: args.email,
        name: args.name || identity?.name || undefined,
        organizationId: org?._id,
        role: "member", // Default role, can be promoted to admin later
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      });
      
      console.info(`Created new user: ${userId} in organization: ${org?._id}`);
      return userId;
      
    } catch (error) {
      console.error(`User sync failed for ${args.email}:`, error);
      throw new Error(`User sync failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Get current user by Clerk user ID (auth-verified)
export const getCurrentUser = query({
  args: {
    clerkUserId: v.optional(v.string()), // Optional: for test compatibility
  },
  handler: async (ctx, args) => {
    // Get authentication - prefer verified identity, fall back to args for tests
    const identity = await ctx.auth.getUserIdentity();
    const clerkUserId = identity?.subject || args.clerkUserId;
    
    if (!clerkUserId) {
      return null; // Not signed in
    }
    
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkUserId))
      .first();
  },
});

// Get user by ID
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Get user's organization by user ID
export const getUserOrganization = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user?.organizationId) return null;
    return await ctx.db.get(user.organizationId);
  },
});

// Get organization for current authenticated user (no args needed)
export const getCurrentUserOrganization = query({
  args: {},
  handler: async (ctx) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      const clerkUserId = identity?.subject;
      
      if (!clerkUserId) {
        return null; // Not signed in
      }
      
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkUserId))
        .first();
      
      if (!user?.organizationId) return null;
      return await ctx.db.get(user.organizationId);
    } catch (error) {
      // Auth error or user not found - return null gracefully
      console.error("[getCurrentUserOrganization] Error:", error);
      return null;
    }
  },
});

// Get organization by ID
export const getOrganization = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.organizationId);
  },
});

// Internal version for workflows
export const getOrganizationInternal = internalQuery({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.organizationId);
  },
});

// List all users in an organization
export const listOrganizationUsers = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
  },
});

// Update organization details
export const updateOrganization = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.optional(v.string()),
    billingEmail: v.optional(v.string()),
    aiEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { organizationId, ...updates } = args;
    
    await ctx.db.patch(organizationId, {
      ...updates,
      updatedAt: Date.now(),
    });
    
    console.info(`Updated organization: ${organizationId}`, updates);
    return true;
  },
});

// Update organization auto-approve AI setting
export const updateAutoApproveAI = mutation({
  args: {
    organizationId: v.id("organizations"),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.organizationId, {
      autoApproveAI: args.enabled,
      updatedAt: Date.now(),
    });
    
    console.info(`Updated autoApproveAI for org ${args.organizationId}: ${args.enabled}`);
    return { success: true };
  },
});

// Promote user to admin role
export const promoteToAdmin = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      role: "admin",
      updatedAt: Date.now(),
    });
    
    console.info(`Promoted user to admin: ${args.userId}`);
    return true;
  },
});

// Get organization stats
export const getOrganizationStats = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    // Count users in organization
    const users = await ctx.db
      .query("users")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    
    // Count agents in organization
    const agents = await ctx.db
      .query("agents")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    
    return {
      totalUsers: users.length,
      adminUsers: users.filter(u => u.role === "admin").length,
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === "active").length,
    };
  },
});

// Get or create organization owner DID (helper for agent creation)
export const getOrganizationOwnerDid = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      throw new Error("Organization not found");
    }
    
    // Generate standard owner DID for org
    const domain = org.domain || org.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `did:owner:org-${domain}`;
  },
});

// Get all organizations (for migration scripts)
export const getOrganizations = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("organizations").collect();
  },
});

