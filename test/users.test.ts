/**
 * User Management Tests
 * Tests for user sync, organization creation, and user queries
 */

import { expect, describe, test, beforeEach } from "vitest";
import { convexTest } from "convex-test";
import { api } from "../convex/_generated/api";
import schema from "../convex/schema";

describe("User Management", () => {
  let t: Awaited<ReturnType<typeof convexTest>>;

  beforeEach(async () => {
    const modules = import.meta.glob("../convex/**/*.{ts,js}");
    t = convexTest(schema, modules);
  });

  describe("User Sync", () => {
    test("should create new user and organization on first login", async () => {
      const userId = await t.mutation(api.users.syncUser, {
        clerkUserId: "clerk_user_123",
        email: "alice@anthropic.com",
        name: "Alice Smith",
      });

      expect(userId).toBeDefined();

      // Verify user was created
      const user = await t.query(api.users.getCurrentUser, {
        clerkUserId: "clerk_user_123",
      });

      expect(user).toBeDefined();
      expect(user?.email).toBe("alice@anthropic.com");
      expect(user?.name).toBe("Alice Smith");
      expect(user?.role).toBe("member");
      expect(user?.organizationId).toBeDefined();
    });

    test("should auto-create organization from email domain", async () => {
      await t.mutation(api.users.syncUser, {
        clerkUserId: "clerk_user_123",
        email: "alice@anthropic.com",
        name: "Alice Smith",
      });

      const user = await t.query(api.users.getCurrentUser, {
        clerkUserId: "clerk_user_123",
      });

      expect(user?.organizationId).toBeDefined();

      const org = await t.query(api.users.getOrganization, {
        organizationId: user!.organizationId!,
      });

      expect(org).toBeDefined();
      expect(org?.domain).toBe("anthropic.com");
      expect(org?.name).toBe("anthropic.com"); // Default to domain
    });

    test("should reuse existing organization for same domain", async () => {
      // First user creates org
      await t.mutation(api.users.syncUser, {
        clerkUserId: "clerk_user_1",
        email: "alice@anthropic.com",
        name: "Alice",
      });

      const user1 = await t.query(api.users.getCurrentUser, {
        clerkUserId: "clerk_user_1",
      });

      // Second user joins same org
      await t.mutation(api.users.syncUser, {
        clerkUserId: "clerk_user_2",
        email: "bob@anthropic.com",
        name: "Bob",
      });

      const user2 = await t.query(api.users.getCurrentUser, {
        clerkUserId: "clerk_user_2",
      });

      // Both users should be in the same org
      expect(user1?.organizationId).toBe(user2?.organizationId);
    });

    test("should update lastLoginAt on subsequent logins", async () => {
      // First login
      await t.mutation(api.users.syncUser, {
        clerkUserId: "clerk_user_123",
        email: "alice@anthropic.com",
        name: "Alice",
      });

      const user1 = await t.query(api.users.getCurrentUser, {
        clerkUserId: "clerk_user_123",
      });
      const firstLogin = user1?.lastLoginAt;

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Second login
      await t.mutation(api.users.syncUser, {
        clerkUserId: "clerk_user_123",
        email: "alice@anthropic.com",
        name: "Alice Updated",
      });

      const user2 = await t.query(api.users.getCurrentUser, {
        clerkUserId: "clerk_user_123",
      });

      expect(user2?.lastLoginAt).toBeGreaterThan(firstLogin!);
      expect(user2?.name).toBe("Alice Updated");
    });

    test("should handle invalid email format", async () => {
      await expect(
        t.mutation(api.users.syncUser, {
          clerkUserId: "clerk_user_123",
          email: "invalid-email",
          name: "Alice",
        })
      ).rejects.toThrow();
    });
  });

  describe("User Queries", () => {
    test("should get user by clerk ID", async () => {
      await t.mutation(api.users.syncUser, {
        clerkUserId: "clerk_user_123",
        email: "alice@anthropic.com",
        name: "Alice",
      });

      const user = await t.query(api.users.getCurrentUser, {
        clerkUserId: "clerk_user_123",
      });

      expect(user).toBeDefined();
      expect(user?.clerkUserId).toBe("clerk_user_123");
    });

    test("should get user's organization", async () => {
      await t.mutation(api.users.syncUser, {
        clerkUserId: "clerk_user_123",
        email: "alice@anthropic.com",
        name: "Alice",
      });

      const user = await t.query(api.users.getCurrentUser, {
        clerkUserId: "clerk_user_123",
      });

      const org = await t.query(api.users.getUserOrganization, {
        userId: user!._id,
      });

      expect(org).toBeDefined();
      expect(org?.domain).toBe("anthropic.com");
    });

    test("should list users in organization", async () => {
      // Create multiple users in same org
      await t.mutation(api.users.syncUser, {
        clerkUserId: "clerk_user_1",
        email: "alice@anthropic.com",
        name: "Alice",
      });

      await t.mutation(api.users.syncUser, {
        clerkUserId: "clerk_user_2",
        email: "bob@anthropic.com",
        name: "Bob",
      });

      const user1 = await t.query(api.users.getCurrentUser, {
        clerkUserId: "clerk_user_1",
      });

      const orgUsers = await t.query(api.users.listOrganizationUsers, {
        organizationId: user1!.organizationId!,
      });

      expect(orgUsers).toHaveLength(2);
      expect(orgUsers.map((u) => u.name)).toContain("Alice");
      expect(orgUsers.map((u) => u.name)).toContain("Bob");
    });
  });

  describe("Organization Management", () => {
    test("should update organization details", async () => {
      await t.mutation(api.users.syncUser, {
        clerkUserId: "clerk_user_123",
        email: "alice@anthropic.com",
        name: "Alice",
      });

      const user = await t.query(api.users.getCurrentUser, {
        clerkUserId: "clerk_user_123",
      });

      await t.mutation(api.users.updateOrganization, {
        organizationId: user!.organizationId!,
        name: "Anthropic, Inc.",
        billingEmail: "billing@anthropic.com",
      });

      const org = await t.query(api.users.getOrganization, {
        organizationId: user!.organizationId!,
      });

      expect(org?.name).toBe("Anthropic, Inc.");
      expect(org?.billingEmail).toBe("billing@anthropic.com");
      expect(org?.updatedAt).toBeDefined();
    });

    test("should promote user to admin", async () => {
      await t.mutation(api.users.syncUser, {
        clerkUserId: "clerk_user_123",
        email: "alice@anthropic.com",
        name: "Alice",
      });

      const user = await t.query(api.users.getCurrentUser, {
        clerkUserId: "clerk_user_123",
      });

      expect(user?.role).toBe("member");

      await t.mutation(api.users.promoteToAdmin, {
        userId: user!._id,
      });

      const updatedUser = await t.query(api.users.getUser, {
        userId: user!._id,
      });

      expect(updatedUser?.role).toBe("admin");
    });

    test("should get organization stats", async () => {
      // Create users
      await t.mutation(api.users.syncUser, {
        clerkUserId: "clerk_user_1",
        email: "alice@anthropic.com",
        name: "Alice",
      });

      await t.mutation(api.users.syncUser, {
        clerkUserId: "clerk_user_2",
        email: "bob@anthropic.com",
        name: "Bob",
      });

      const user = await t.query(api.users.getCurrentUser, {
        clerkUserId: "clerk_user_1",
      });

      const stats = await t.query(api.users.getOrganizationStats, {
        organizationId: user!.organizationId!,
      });

      expect(stats.totalUsers).toBe(2);
      expect(stats.adminUsers).toBe(0);
      expect(stats.totalAgents).toBe(0);
      // API keys removed - signature-based auth only
    });
  });
});

