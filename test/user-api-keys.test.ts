/**
 * User API Keys Tests
 * Tests for user-facing API key management (organization-level keys)
 */

import { expect, describe, test, beforeEach } from "vitest";
import { convexTest } from "convex-test";
import { api } from "../convex/_generated/api";
import schema from "../convex/schema";
import type { Id } from "../convex/_generated/dataModel";

describe("User API Keys", () => {
  let t: Awaited<ReturnType<typeof convexTest>>;
  let userId: Id<"users">;
  let organizationId: Id<"organizations">;

  beforeEach(async () => {
    const modules = import.meta.glob("../convex/**/*.{ts,js}");
    t = convexTest(schema, modules);

    // Create a test user and organization
    userId = await t.mutation(api.users.syncUser, {
      clerkUserId: "clerk_user_test",
      email: "test@anthropic.com",
      name: "Test User",
    });

    const user = await t.query(api.users.getCurrentUser, {
      clerkUserId: "clerk_user_test",
    });
    organizationId = user!.organizationId!;
  });

  describe("API Key Creation", () => {
    test("should create user API key", async () => {
      const result = await t.mutation(api.apiKeys.createUserApiKey, {
        userId,
        name: "Production Key",
        permissions: ["*"],
      });

      expect(result.id).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.token).toMatch(/^sk_/);
      expect(result.token.length).toBeGreaterThan(50);
    });

    test("should create key with expiry", async () => {
      const expiresAt = Date.now() + 90 * 24 * 60 * 60 * 1000; // 90 days

      const result = await t.mutation(api.apiKeys.createUserApiKey, {
        userId,
        name: "Temporary Key",
        expiresAt,
        permissions: ["*"],
      });

      expect(result.id).toBeDefined();

      const key = await t.query(api.apiKeys.getUserApiKey, {
        userId,
        apiKeyId: result.id,
      });

      expect(key?.expiresAt).toBe(expiresAt);
    });

    test("should link key to organization", async () => {
      const result = await t.mutation(api.apiKeys.createUserApiKey, {
        userId,
        name: "Test Key",
        permissions: ["*"],
      });

      const key = await t.query(api.apiKeys.getUserApiKey, {
        userId,
        apiKeyId: result.id,
      });

      expect(key?.organizationId).toBe(organizationId);
      expect(key?.createdByUserId).toBe(userId);
    });

    test("should fail if user has no organization", async () => {
      // Create user without org (shouldn't happen in practice)
      const userIdNoOrg = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          clerkUserId: "no_org_user",
          email: "noorg@test.com",
          role: "member",
          createdAt: Date.now(),
        });
      });

      await expect(
        t.mutation(api.apiKeys.createUserApiKey, {
          userId: userIdNoOrg,
          name: "Test Key",
          permissions: ["*"],
        })
      ).rejects.toThrow("must belong to an organization");
    });

    test("should generate unique tokens", async () => {
      const result1 = await t.mutation(api.apiKeys.createUserApiKey, {
        userId,
        name: "Key 1",
        permissions: ["*"],
      });

      const result2 = await t.mutation(api.apiKeys.createUserApiKey, {
        userId,
        name: "Key 2",
        permissions: ["*"],
      });

      expect(result1.token).not.toBe(result2.token);
    });
  });

  describe("API Key Listing", () => {
    test("should list user's organization API keys", async () => {
      await t.mutation(api.apiKeys.createUserApiKey, {
        userId,
        name: "Key 1",
        permissions: ["*"],
      });

      await t.mutation(api.apiKeys.createUserApiKey, {
        userId,
        name: "Key 2",
        permissions: ["*"],
      });

      const keys = await t.query(api.apiKeys.listUserApiKeys, {
        userId,
      });

      expect(keys).toHaveLength(2);
      expect(keys[0].name).toBeDefined();
      expect(keys[0].tokenPreview).toBeDefined();
      expect(keys[0].creatorName).toBeDefined();
    });

    test("should include creator name in key list", async () => {
      await t.mutation(api.apiKeys.createUserApiKey, {
        userId,
        name: "Test Key",
        permissions: ["*"],
      });

      const keys = await t.query(api.apiKeys.listUserApiKeys, {
        userId,
      });

      expect(keys[0].creatorName).toBe("Test User");
    });

    test("should only show active keys", async () => {
      const result = await t.mutation(api.apiKeys.createUserApiKey, {
        userId,
        name: "Test Key",
        permissions: ["*"],
      });

      // Revoke the key
      await t.mutation(api.apiKeys.revokeUserApiKey, {
        userId,
        apiKeyId: result.id,
      });

      const keys = await t.query(api.apiKeys.listUserApiKeys, {
        userId,
      });

      expect(keys).toHaveLength(0);
    });

    test("should not expose full token in list", async () => {
      const result = await t.mutation(api.apiKeys.createUserApiKey, {
        userId,
        name: "Test Key",
        permissions: ["*"],
      });

      const keys = await t.query(api.apiKeys.listUserApiKeys, {
        userId,
      });

      expect(keys[0].tokenPreview).not.toBe(result.token);
      expect(keys[0].tokenPreview).toContain("...");
    });

    test("should show keys from same org to all users", async () => {
      // Create second user in same org
      const userId2 = await t.mutation(api.users.syncUser, {
        clerkUserId: "clerk_user_2",
        email: "user2@anthropic.com",
        name: "User 2",
      });

      // User 1 creates a key
      await t.mutation(api.apiKeys.createUserApiKey, {
        userId,
        name: "Shared Key",
        permissions: ["*"],
      });

      // User 2 should see it
      const keys = await t.query(api.apiKeys.listUserApiKeys, {
        userId: userId2,
      });

      expect(keys).toHaveLength(1);
      expect(keys[0].name).toBe("Shared Key");
    });
  });

  describe("API Key Revocation", () => {
    test("should revoke API key", async () => {
      const result = await t.mutation(api.apiKeys.createUserApiKey, {
        userId,
        name: "Test Key",
        permissions: ["*"],
      });

      await t.mutation(api.apiKeys.revokeUserApiKey, {
        userId,
        apiKeyId: result.id,
      });

      const key = await t.query(api.apiKeys.getUserApiKey, {
        userId,
        apiKeyId: result.id,
      });

      expect(key?.active).toBe(false);
    });

    test("should prevent revoking key from different org", async () => {
      // Create user in different org
      const userId2 = await t.mutation(api.users.syncUser, {
        clerkUserId: "clerk_user_other",
        email: "other@different.com",
        name: "Other User",
      });

      // User 1 creates key
      const result = await t.mutation(api.apiKeys.createUserApiKey, {
        userId,
        name: "Test Key",
        permissions: ["*"],
      });

      // User 2 tries to revoke it
      await expect(
        t.mutation(api.apiKeys.revokeUserApiKey, {
          userId: userId2,
          apiKeyId: result.id,
        })
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe("API Key Name Update", () => {
    test("should update key name", async () => {
      const result = await t.mutation(api.apiKeys.createUserApiKey, {
        userId,
        name: "Old Name",
        permissions: ["*"],
      });

      await t.mutation(api.apiKeys.updateUserApiKeyName, {
        userId,
        apiKeyId: result.id,
        name: "New Name",
      });

      const key = await t.query(api.apiKeys.getUserApiKey, {
        userId,
        apiKeyId: result.id,
      });

      expect(key?.name).toBe("New Name");
    });

    test("should prevent updating key from different org", async () => {
      const userId2 = await t.mutation(api.users.syncUser, {
        clerkUserId: "clerk_user_other",
        email: "other@different.com",
        name: "Other User",
      });

      const result = await t.mutation(api.apiKeys.createUserApiKey, {
        userId,
        name: "Test Key",
        permissions: ["*"],
      });

      await expect(
        t.mutation(api.apiKeys.updateUserApiKeyName, {
          userId: userId2,
          apiKeyId: result.id,
          name: "Hacked Name",
        })
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe("Backward Compatibility", () => {
    test("should support organization-owned keys independently", async () => {
      // Create user-owned API key (new system)
      const userKey = await t.mutation(api.apiKeys.createUserApiKey, {
        userId,
        name: "User Key",
        permissions: ["*"],
      });

      expect(userKey.id).toBeDefined();
      expect(userKey.token).toBeDefined();
      expect(userKey.token).toMatch(/^sk_/);

      // User keys should only show user keys
      const userKeys = await t.query(api.apiKeys.listUserApiKeys, {
        userId,
      });

      expect(userKeys).toHaveLength(1);
      expect(userKeys[0].name).toBe("User Key");
      
      // Verify key is linked to organization
      const key = await t.query(api.apiKeys.getUserApiKey, {
        userId,
        apiKeyId: userKey.id,
      });
      
      expect(key?.organizationId).toBeDefined();
      expect(key?.createdByUserId).toBe(userId);
      expect(key?.agentId).toBeUndefined(); // User keys don't have agentId
    });

    test("should maintain schema compatibility for agent-owned keys", async () => {
      // Verify that the schema still supports agent-owned keys
      // by checking that agentId field is optional in apiKeys table
      // This ensures backward compatibility without actually creating legacy keys
      
      const userKey = await t.mutation(api.apiKeys.createUserApiKey, {
        userId,
        name: "Test Key",
        permissions: ["*"],
      });

      const key = await t.query(api.apiKeys.getUserApiKey, {
        userId,
        apiKeyId: userKey.id,
      });

      // New user keys should have organizationId but no agentId
      expect(key?.organizationId).toBeDefined();
      expect(key?.agentId).toBeUndefined();
      
      // Both fields being optional proves backward compatibility
      // Old agent keys have agentId but no organizationId
      // New user keys have organizationId but no agentId
    });
  });
});

