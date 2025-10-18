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

  describe('API Key Revocation (SOC2/PCI Compliance)', () => {
    it('should revoke active key successfully', async () => {
      const result = await t.mutation(api.apiKeys.generateApiKey, {
        userId: testUserId,
        name: "Test Key",
      });

      const revocation = await t.mutation(api.apiKeys.revokeApiKey, {
        keyId: result.keyId,
        userId: testUserId,
      });

      expect(revocation.success).toBe(true);
      expect(revocation.revokedAt).toBeDefined();

      // Verify key status updated
      const keys = await t.query(api.apiKeys.listApiKeys, {
        organizationId: testOrgId,
      });

      const revokedKey = keys.find(k => k._id === result.keyId);
      expect(revokedKey?.status).toBe("revoked");
    });

    it('should set revokedAt timestamp and revokedBy user', async () => {
      const result = await t.mutation(api.apiKeys.generateApiKey, {
        userId: testUserId,
        name: "Test Key",
      });

      await t.mutation(api.apiKeys.revokeApiKey, {
        keyId: result.keyId,
        userId: testUserId,
      });

      // Check database directly for audit fields
      const key = await t.run(async (ctx) => {
        return await ctx.db.get(result.keyId);
      });

      expect(key?.revokedAt).toBeDefined();
      expect(key?.revokedBy).toEqual(testUserId);
    });

    it('should create audit event for revocation', async () => {
      const result = await t.mutation(api.apiKeys.generateApiKey, {
        userId: testUserId,
        name: "Test Key",
      });

      await t.mutation(api.apiKeys.revokeApiKey, {
        keyId: result.keyId,
        userId: testUserId,
      });

      // Check events table for audit trail
      const events = await t.run(async (ctx) => {
        return await ctx.db.query("events").collect();
      });

      const revocationEvent = events.find(e => e.type === "API_KEY_REVOKED");
      expect(revocationEvent).toBeDefined();
      expect(revocationEvent?.payload).toMatchObject({
        keyId: result.keyId,
        keyName: "Test Key",
      });
    });

    it('should fail to revoke already revoked key', async () => {
      const result = await t.mutation(api.apiKeys.generateApiKey, {
        userId: testUserId,
        name: "Test Key",
      });

      // First revocation succeeds
      await t.mutation(api.apiKeys.revokeApiKey, {
        keyId: result.keyId,
        userId: testUserId,
      });

      // Second revocation should fail
      await expect(
        t.mutation(api.apiKeys.revokeApiKey, {
          keyId: result.keyId,
          userId: testUserId,
        })
      ).rejects.toThrow("already revoked");
    });

    it('should fail for unauthorized user (different org)', async () => {
      const result = await t.mutation(api.apiKeys.generateApiKey, {
        userId: testUserId,
        name: "Test Key",
      });

      // Create user from different org
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
          clerkUserId: "other-user-123",
          email: "other@test.com",
          name: "Other User",
          organizationId: otherOrgId,
          role: "admin",
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
        });
      });

      // Should fail - different org
      await expect(
        t.mutation(api.apiKeys.revokeApiKey, {
          keyId: result.keyId,
          userId: otherUserId,
        })
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe('API Key Deletion (Admin-only, 90-day cooling period)', () => {
    it('should delete key after 90-day cooling period', async () => {
      const result = await t.mutation(api.apiKeys.generateApiKey, {
        userId: testUserId,
        name: "Test Key",
      });

      // Revoke key
      await t.mutation(api.apiKeys.revokeApiKey, {
        keyId: result.keyId,
        userId: testUserId,
      });

      // Manually set revokedAt to 91 days ago
      await t.run(async (ctx) => {
        await ctx.db.patch(result.keyId, {
          revokedAt: Date.now() - (91 * 24 * 60 * 60 * 1000),
        });
      });

      // Delete should succeed
      const deletion = await t.mutation(api.apiKeys.deleteApiKey, {
        keyId: result.keyId,
        userId: testUserId,
      });

      expect(deletion.success).toBe(true);

      // Verify key is deleted
      const key = await t.run(async (ctx) => {
        return await ctx.db.get(result.keyId);
      });

      expect(key).toBeNull();
    });

    it('should fail if not admin', async () => {
      // Create non-admin user
      const nonAdminUserId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          clerkUserId: "non-admin-user",
          email: "nonadmin@test.com",
          name: "Non Admin",
          organizationId: testOrgId,
          role: "member",
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
        });
      });

      const result = await t.mutation(api.apiKeys.generateApiKey, {
        userId: testUserId,
        name: "Test Key",
      });

      await t.mutation(api.apiKeys.revokeApiKey, {
        keyId: result.keyId,
        userId: testUserId,
      });

      // Set revoked 91 days ago
      await t.run(async (ctx) => {
        await ctx.db.patch(result.keyId, {
          revokedAt: Date.now() - (91 * 24 * 60 * 60 * 1000),
        });
      });

      // Should fail - not admin
      await expect(
        t.mutation(api.apiKeys.deleteApiKey, {
          keyId: result.keyId,
          userId: nonAdminUserId,
        })
      ).rejects.toThrow("Admin access required");
    });

    it('should fail if key not revoked first', async () => {
      const result = await t.mutation(api.apiKeys.generateApiKey, {
        userId: testUserId,
        name: "Test Key",
      });

      // Try to delete without revoking first
      await expect(
        t.mutation(api.apiKeys.deleteApiKey, {
          keyId: result.keyId,
          userId: testUserId,
        })
      ).rejects.toThrow("must be revoked before permanent deletion");
    });

    it('should fail if cooling period not elapsed', async () => {
      const result = await t.mutation(api.apiKeys.generateApiKey, {
        userId: testUserId,
        name: "Test Key",
      });

      await t.mutation(api.apiKeys.revokeApiKey, {
        keyId: result.keyId,
        userId: testUserId,
      });

      // Try to delete immediately (cooling period not elapsed)
      await expect(
        t.mutation(api.apiKeys.deleteApiKey, {
          keyId: result.keyId,
          userId: testUserId,
        })
      ).rejects.toThrow("90 days before permanent deletion");
    });

    it('should create deletion audit event', async () => {
      const result = await t.mutation(api.apiKeys.generateApiKey, {
        userId: testUserId,
        name: "Test Key",
      });

      await t.mutation(api.apiKeys.revokeApiKey, {
        keyId: result.keyId,
        userId: testUserId,
      });

      // Set revoked 91 days ago
      await t.run(async (ctx) => {
        await ctx.db.patch(result.keyId, {
          revokedAt: Date.now() - (91 * 24 * 60 * 60 * 1000),
        });
      });

      await t.mutation(api.apiKeys.deleteApiKey, {
        keyId: result.keyId,
        userId: testUserId,
      });

      // Check for deletion event
      const events = await t.run(async (ctx) => {
        return await ctx.db.query("events").collect();
      });

      const deletionEvent = events.find(e => e.type === "API_KEY_DELETED_PERMANENT");
      expect(deletionEvent).toBeDefined();
      expect(deletionEvent?.payload).toMatchObject({
        keyId: result.keyId,
        keyName: "Test Key",
      });
    });
  });

  describe('API Key Audit Trail', () => {
    it('should return all events for specific key', async () => {
      const result = await t.mutation(api.apiKeys.generateApiKey, {
        userId: testUserId,
        name: "Test Key",
      });

      await t.mutation(api.apiKeys.revokeApiKey, {
        keyId: result.keyId,
        userId: testUserId,
      });

      const auditLog = await t.query(api.apiKeys.getApiKeyAuditLog, {
        keyId: result.keyId,
        userId: testUserId,
      });

      expect(auditLog.length).toBeGreaterThan(0);
      const types = auditLog.map(e => e.type);
      expect(types).toContain("API_KEY_REVOKED");
    });

    it('should be ordered by timestamp descending', async () => {
      const result = await t.mutation(api.apiKeys.generateApiKey, {
        userId: testUserId,
        name: "Test Key",
      });

      await t.mutation(api.apiKeys.revokeApiKey, {
        keyId: result.keyId,
        userId: testUserId,
      });

      const auditLog = await t.query(api.apiKeys.getApiKeyAuditLog, {
        keyId: result.keyId,
        userId: testUserId,
      });

      // Verify descending order (newest first)
      for (let i = 1; i < auditLog.length; i++) {
        expect(auditLog[i - 1].timestamp).toBeGreaterThanOrEqual(auditLog[i].timestamp);
      }
    });
  });

  describe('Backwards Compatibility', () => {
    it('should handle keys with old token field', async () => {
      // Create key with old token field directly
      const oldKeyId = await t.run(async (ctx) => {
        return await ctx.db.insert("apiKeys", {
          token: "old_token_abc123",
          organizationId: testOrgId,
          name: "Old Key",
          createdBy: testUserId,
          status: "active",
          createdAt: Date.now(),
        } as any);
      });

      const keys = await t.query(api.apiKeys.listApiKeys, {
        organizationId: testOrgId,
      });

      const oldKey = keys.find(k => k._id === oldKeyId);
      expect(oldKey).toBeDefined();
      expect(oldKey?.keyPreview).toBeDefined();
      expect(oldKey?.keyPreview).not.toBe('N/A');
    });

    it('should handle keys without revokedAt/revokedBy', async () => {
      // Create revoked key without audit fields
      const legacyKeyId = await t.run(async (ctx) => {
        return await ctx.db.insert("apiKeys", {
          key: "csk_live_legacy123456789012345678901234",
          organizationId: testOrgId,
          name: "Legacy Revoked Key",
          createdBy: testUserId,
          status: "revoked",
          createdAt: Date.now(),
        } as any);
      });

      const keys = await t.query(api.apiKeys.listApiKeys, {
        organizationId: testOrgId,
      });

      const legacyKey = keys.find(k => k._id === legacyKeyId);
      expect(legacyKey).toBeDefined();
      expect(legacyKey?.status).toBe("revoked");
    });
  });
});

