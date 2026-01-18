import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { internal } from "../../convex/_generated/api";

describe("merchant wallet mapping (unit)", () => {
  it("upserts a wallet mapping and reuses profile by org+email", async () => {
    const modules = import.meta.glob("../../convex/**/*.{ts,js}");
    const t = convexTest(schema, modules);

    const now = Date.now();
    const orgId = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Test Org",
        domain: "test.example",
        createdAt: now,
      } as any);
    });

    const wallet1 = "solana:5eykt4GNfsw7SU33zdhhrELoMu3gFmT33EpFdpEfmgbf:FiZy3ch8QSDVWhJfZJYA75ZvDQgu4FJY4NfesZhbda4N";
    const wallet2 = "eip155:8453:0x00000000000000000000000000000000000000aa";
    const email = "seller@example.com";

    const first = await t.mutation((internal as any).merchantWallets.upsertMerchantProfileAndWallet, {
      liableOrganizationId: orgId,
      walletCaip10: wallet1,
      notificationEmail: email,
      name: "Seller A",
      isPrimary: true,
    });
    expect(first.ok).toBe(true);
    expect(first.created).toBe(true);

    const second = await t.mutation((internal as any).merchantWallets.upsertMerchantProfileAndWallet, {
      liableOrganizationId: orgId,
      walletCaip10: wallet2,
      notificationEmail: email,
      name: "Seller A",
      isPrimary: false,
    });
    expect(second.ok).toBe(true);
    expect(second.merchantProfileId).toBe(first.merchantProfileId);
  });
});

