import { describe, it, expect, beforeEach } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../convex/_generated/api';
import schema from '../convex/schema';
import { Id } from '../convex/_generated/dataModel';

describe('API Keys Management', () => {
  let t: ReturnType<typeof convexTest>;
  let testUserId: Id<"users">;
  let testOrgId: Id<"organizations">;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);

    // Create test organization
    testOrgId = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Test Org",
        domain: "test.com",
        verified: true,
        verifiedAt: Date.now(),
        createdAt: Date.now(),
      });
    });

    // Create test user
    testUserId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkUserId: "test-user-123",
        email: "test@test.com",
        name: "Test User",
        organizationId: testOrgId,
        role: "admin",
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      });
    });
  });

  describe('API Key Generation', () => {
    it('should generate a valid API key', async () => {
      const result = await t.mutation(api.apiKeys.generateApiKey, {
        userId: testUserId,
        name: "Test Key",
      });

      expect(result.key).toBeDefined();
      expect(result.key).toMatch(/^csk_live_[a-f0-9]{32}$/);
      expect(result.name).toBe("Test Key");
      expect(result.keyId).toBeDefined();
      expect(result.createdAt).toBeDefined();
    });

    it('should generate API key with expiration', async () => {
      const result = await t.mutation(api.apiKeys.generateApiKey, {
        userId: testUserId,
        name: "Expiring Key",
        expiresIn: 30, // 30 days
      });

      expect(result.expiresAt).toBeDefined();
      expect(result.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should fail for user without organization', async () => {
      // Create user without org
      const userWithoutOrg = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          clerkUserId: "no-org-user",
          email: "noorg@test.com",
          role: "member",
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
        });
      });

      await expect(
        t.mutation(api.apiKeys.generateApiKey, {
          userId: userWithoutOrg,
          name: "Should Fail",
        })
      ).rejects.toThrow("not part of an organization");
    });
  });

  describe('API Key Listing', () => {
    it('should list all keys for organization', async () => {
      // Generate multiple keys
      await t.mutation(api.apiKeys.generateApiKey, {
        userId: testUserId,
        name: "Key 1",
      });
      await t.mutation(api.apiKeys.generateApiKey, {
        userId: testUserId,
        name: "Key 2",
      });

      const keys = await t.query(api.apiKeys.listApiKeys, {
        organizationId: testOrgId,
      });

      expect(keys).toHaveLength(2);
      expect(keys[0].name).toBe("Key 1");
      expect(keys[1].name).toBe("Key 2");
      
      // Should not expose full key (first 12 chars including prefix, then ..., then last 4)
      expect(keys[0].keyPreview).toMatch(/^csk_live_[a-f0-9]{3}\.\.\.[a-f0-9]{4}$/);
    });

    it('should show key status', async () => {
      const result = await t.mutation(api.apiKeys.generateApiKey, {
        userId: testUserId,
        name: "Status Test",
      });

      const keys = await t.query(api.apiKeys.listApiKeys, {
        organizationId: testOrgId,
      });

      expect(keys[0].status).toBe("active");
      expect(keys[0]._id).toEqual(result.keyId);
    });
  });

  describe('API Key Revocation', () => {
    it('should revoke an API key', async () => {
      const result = await t.mutation(api.apiKeys.generateApiKey, {
        userId: testUserId,
        name: "To Revoke",
      });

      await t.mutation(api.apiKeys.revokeApiKey, {
        keyId: result.keyId,
        userId: testUserId,
      });

      const keys = await t.query(api.apiKeys.listApiKeys, {
        organizationId: testOrgId,
      });

      const revokedKey = keys.find(k => k._id === result.keyId);
      expect(revokedKey?.status).toBe("revoked");
    });

    it('should fail to revoke key from different organization', async () => {
      // Create another org and user
      const otherOrgId = await t.run(async (ctx) => {
        return await ctx.db.insert("organizations", {
          name: "Other Org",
          domain: "other.com",
          verified: true,
          verifiedAt: Date.now(),
          createdAt: Date.now(),
        });
      });

      const otherUserId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          clerkUserId: "other-user",
          email: "other@other.com",
          organizationId: otherOrgId,
          role: "admin",
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
        });
      });

      // Generate key for first org
      const result = await t.mutation(api.apiKeys.generateApiKey, {
        userId: testUserId,
        name: "Protected Key",
      });

      // Try to revoke with user from different org
      await expect(
        t.mutation(api.apiKeys.revokeApiKey, {
          keyId: result.keyId,
          userId: otherUserId,
        })
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe('API Key Validation', () => {
    it('should validate active API key', async () => {
      const result = await t.mutation(api.apiKeys.generateApiKey, {
        userId: testUserId,
        name: "Valid Key",
      });

      // Validate by using it (through validateApiKey helper)
      const validated = await t.run(async (ctx) => {
        const { validateApiKey } = await import('../convex/apiKeys');
        return await validateApiKey(ctx, result.key);
      });

      expect(validated).toBeDefined();
      expect(validated.organizationId).toEqual(testOrgId);
      expect(validated.status).toBe("active");
    });

    it('should reject invalid API key', async () => {
      await expect(
        t.run(async (ctx) => {
          const { validateApiKey } = await import('../convex/apiKeys');
          return await validateApiKey(ctx, "csk_live_invalid");
        })
      ).rejects.toThrow("Invalid API key");
    });

    it('should reject revoked API key', async () => {
      const result = await t.mutation(api.apiKeys.generateApiKey, {
        userId: testUserId,
        name: "To Be Revoked",
      });

      // Revoke it
      await t.mutation(api.apiKeys.revokeApiKey, {
        keyId: result.keyId,
        userId: testUserId,
      });

      // Try to validate
      await expect(
        t.run(async (ctx) => {
          const { validateApiKey } = await import('../convex/apiKeys');
          return await validateApiKey(ctx, result.key);
        })
      ).rejects.toThrow("revoked");
    });

    it('should reject expired API key', async () => {
      // Generate key that already expired
      const result = await t.mutation(api.apiKeys.generateApiKey, {
        userId: testUserId,
        name: "Expired Key",
        expiresIn: -1, // Already expired (negative time)
      });

      // Try to validate
      await expect(
        t.run(async (ctx) => {
          const { validateApiKey } = await import('../convex/apiKeys');
          return await validateApiKey(ctx, result.key);
        })
      ).rejects.toThrow("expired");
    });
  });

  describe('API Key Usage Tracking', () => {
    it('should update lastUsedAt when key is used', async () => {
      const result = await t.mutation(api.apiKeys.generateApiKey, {
        userId: testUserId,
        name: "Usage Track",
      });

      // Use the key (via agent registration)
      await t.mutation(api.agents.joinAgent, {
        apiKey: result.key,
        name: "Test Agent",
        functionalType: "general",
      });

      // Check that lastUsedAt was updated
      const keys = await t.query(api.apiKeys.listApiKeys, {
        organizationId: testOrgId,
      });

      const usedKey = keys.find(k => k._id === result.keyId);
      expect(usedKey?.lastUsedAt).toBeDefined();
      expect(usedKey?.lastUsedAt).toBeGreaterThan(result.createdAt);
    });
  });

  describe('Multiple Keys per Organization', () => {
    it('should allow multiple active keys', async () => {
      const key1 = await t.mutation(api.apiKeys.generateApiKey, {
        userId: testUserId,
        name: "Production Key",
      });

      const key2 = await t.mutation(api.apiKeys.generateApiKey, {
        userId: testUserId,
        name: "CI/CD Key",
      });

      const key3 = await t.mutation(api.apiKeys.generateApiKey, {
        userId: testUserId,
        name: "Development Key",
      });

      const keys = await t.query(api.apiKeys.listApiKeys, {
        organizationId: testOrgId,
      });

      expect(keys).toHaveLength(3);
      expect(keys.every(k => k.status === "active")).toBe(true);
    });

    it('should allow revoking one key while others remain active', async () => {
      const key1 = await t.mutation(api.apiKeys.generateApiKey, {
        userId: testUserId,
        name: "Keep Active",
      });

      const key2 = await t.mutation(api.apiKeys.generateApiKey, {
        userId: testUserId,
        name: "To Revoke",
      });

      // Revoke key2
      await t.mutation(api.apiKeys.revokeApiKey, {
        keyId: key2.keyId,
        userId: testUserId,
      });

      const keys = await t.query(api.apiKeys.listApiKeys, {
        organizationId: testOrgId,
      });

      const activeKeys = keys.filter(k => k.status === "active");
      const revokedKeys = keys.filter(k => k.status === "revoked");

      expect(activeKeys).toHaveLength(1);
      expect(revokedKeys).toHaveLength(1);
      expect(activeKeys[0]._id).toEqual(key1.keyId);
    });
  });
});

