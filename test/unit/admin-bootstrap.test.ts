import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";
import schema from "../../convex/schema";

describe("admin bootstrap (unit)", () => {
  const prevToken = process.env.ADMIN_SETUP_TOKEN;
  const TOKEN = "test-admin-token";

  beforeEach(() => {
    process.env.ADMIN_SETUP_TOKEN = TOKEN;
  });

  afterEach(() => {
    process.env.ADMIN_SETUP_TOKEN = prevToken;
  });

  it("rejects org creation with bad token", async () => {
    const modules = import.meta.glob("../../convex/**/*.{ts,js}");
    const t = convexTest(schema, modules);

    const mCreateOrg = makeFunctionReference<"mutation">("admin:adminCreateOrganization");
    await expect(
      t.mutation(mCreateOrg, {
        adminToken: "nope",
        name: "Acme",
        domain: "acme.com",
        initialCreditUsdc: 10,
      } as any),
    ).rejects.toThrow("UNAUTHORIZED");
  });

  it("creates an org, enables credits, and creates API keys", async () => {
    const modules = import.meta.glob("../../convex/**/*.{ts,js}");
    const t = convexTest(schema, modules);

    const mCreateOrg = makeFunctionReference<"mutation">("admin:adminCreateOrganization");
    const created: any = await t.mutation(mCreateOrg, {
      adminToken: TOKEN,
      name: "Acme Inc",
      domain: "acme.com",
      billingEmail: "billing@acme.com",
      initialCreditUsdc: 25,
    } as any);

    expect(created?.ok).toBe(true);
    expect(typeof created?.organizationId).toBe("string");
    expect(typeof created?.apiKeys?.production).toBe("string");
    expect(typeof created?.apiKeys?.development).toBe("string");

    const orgId = created.organizationId;

    const credits = await t.run(async (ctx) => {
      return await ctx.db
        .query("orgRefundCredits")
        .withIndex("by_organization", (q) => q.eq("organizationId", orgId as any))
        .first();
    });
    expect(credits).toBeTruthy();
    expect(credits!.enabled).toBe(true);
    expect(credits!.topUpMicrousdc || 0).toBe(25_000_000);

    const apiKeys = await t.run(async (ctx) => {
      return await ctx.db
        .query("apiKeys")
        .withIndex("by_organization", (q) => q.eq("organizationId", orgId as any))
        .collect();
    });
    expect(apiKeys.length).toBe(2);
    expect(apiKeys.every((k) => k.status === "active")).toBe(true);
  });

  it("grants additional credits to an org (off-chain)", async () => {
    const modules = import.meta.glob("../../convex/**/*.{ts,js}");
    const t = convexTest(schema, modules);

    const mCreateOrg = makeFunctionReference<"mutation">("admin:adminCreateOrganization");
    const mGrant = makeFunctionReference<"mutation">("admin:adminGrantOrganizationCredits");

    const created: any = await t.mutation(mCreateOrg, {
      adminToken: TOKEN,
      name: "WidgetCo",
      domain: "widget.co",
      initialCreditUsdc: 1,
    } as any);
    const orgId = created.organizationId;

    const granted: any = await t.mutation(mGrant, {
      adminToken: TOKEN,
      organizationId: orgId,
      amountUsdc: 7,
      note: "seed credits",
    } as any);
    expect(granted?.ok).toBe(true);

    const credits = await t.run(async (ctx) => {
      return await ctx.db
        .query("orgRefundCredits")
        .withIndex("by_organization", (q) => q.eq("organizationId", orgId as any))
        .first();
    });
    expect(credits).toBeTruthy();
    expect(credits!.enabled).toBe(true);
    expect(credits!.topUpMicrousdc || 0).toBe(8_000_000);
  });
});

