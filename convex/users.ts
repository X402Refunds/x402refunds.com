import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * User Management for Dashboard Users
 * 
 * Handles Clerk user sync, organization management, and user lookups.
 * Users are automatically associated with organizations based on email domain.
 */

// Sync user from Clerk on first login or update existing user
export const syncUser = mutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Syncing user: ${args.email} (${args.clerkUserId})`);
      
      // Check if user exists
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
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
      
      // Create user
      const userId = await ctx.db.insert("users", {
        clerkUserId: args.clerkUserId,
        email: args.email,
        name: args.name,
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

// Get current user by Clerk user ID
export const getCurrentUser = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
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

// Get user's organization
export const getUserOrganization = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user?.organizationId) return null;
    return await ctx.db.get(user.organizationId);
  },
});

// Get organization by ID
export const getOrganization = query({
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
  },
  handler: async (ctx, args) => {
    const { organizationId, ...updates } = args;
    
    await ctx.db.patch(organizationId, {
      ...updates,
      updatedAt: Date.now(),
    });
    
    console.info(`Updated organization: ${organizationId}`);
    return true;
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

