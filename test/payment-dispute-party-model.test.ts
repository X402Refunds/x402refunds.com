/**
 * Payment Dispute Party Model Tests
 *
 * Verifies the THREE-PARTY infrastructure model:
 * 1. Payment Provider (Customer) - Files disputes, makes final decisions
 * 2. Consumer (Plaintiff) - The customer's end-user disputing a charge
 * 3. Merchant (Defendant) - The service provider who charged the consumer
 *
 * Tests ensure:
 * - Plaintiff is consumer identifier (not payment provider)
 * - Defendant is merchant identifier
 * - reviewerOrganizationId is auto-detected from API key
 * - Party metadata is stored correctly for mapping back to customer's system
 */

import { describe, it, expect, beforeEach } from "vitest";
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { api } from "../convex/_generated/api";

describe("Payment Dispute Three-Party Model", () => {
  let t: any;
  let stripeOrgId: any; // Payment Provider (Consulate customer)
  let stripeApiKey: string;

  beforeEach(async () => {
    console.log("🧪 Setting up three-party model test environment...");
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);

    // Create Stripe (Payment Provider) organization
    stripeOrgId = await t.run(async (ctx: any) => {
      return await ctx.db.insert("organizations", {
        name: "Stripe (Test Payment Provider)",
        domain: "stripe.com",
        verified: true,
        createdAt: Date.now(),
      });
    });

    // Create Stripe admin user
    const stripeAdminId = await t.run(async (ctx: any) => {
      return await ctx.db.insert("users", {
        clerkUserId: "clerk_stripe_admin",
        email: "admin@stripe.com",
        organizationId: stripeOrgId,
        role: "admin",
        createdAt: Date.now(),
      });
    });

    // Note: API keys removed - using public key authentication instead
    const testPublicKey = "dGVzdF9wdWJsaWNfa2V5XzMyX2J5dGVzX2Jhc2U2NF9lbmNvZGVk";
    stripeApiKey = testPublicKey; // For backwards compatibility in tests

    // Seed org refund credits (required for fee charging + AI gating)
    await t.run(async (ctx: any) => {
      await ctx.db.insert("orgRefundCredits", {
        organizationId: stripeOrgId,
        enabled: true,
        trialCreditMicrousdc: 5_000_000,
        spentMicrousdc: 0,
        maxPerCaseMicrousdc: 250_000,
        createdAt: Date.now(),
      });
    });

    console.log("✅ Stripe (payment provider) organization created");

    // Create a merchant agent record with a wallet address so wallet-first filing can
    // auto-assign reviewerOrganizationId via agent wallet match.
    await t.run(async (ctx: any) => {
      await ctx.db.insert("agents", {
        did: `did:test:merchant-agent-${Date.now()}`,
        ownerDid: `did:test:owner-${Date.now()}`,
        name: "Test Merchant Agent",
        organizationName: "Test Merchant Co",
        organizationId: stripeOrgId,
        status: "active",
        createdAt: Date.now(),
        walletAddress: "eip155:8453:0x0000000000000000000000000000000000000001",
      });
    });
  });

  it("should use CAIP-10 payer/merchant as plaintiff/defendant (wallet-first)", async () => {
    const created = await t.mutation(api.pool.cases_fileWalletPaymentDispute, {
      blockchain: "base",
      transactionHash: "0xmock_alice_openai_001",
      sellerEndpointUrl: "https://merchant.example/v1/paid",
      origin: "https://merchant.example",
      payer: "eip155:8453:0x00000000000000000000000000000000000000aa",
      merchant: "eip155:8453:0x0000000000000000000000000000000000000001",
      amountMicrousdc: 250_000,
      sourceTransferLogIndex: 0,
      description: "test: wallet-first party model",
      evidenceUrls: ["https://alice-evidence.com/receipt.pdf"],
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const caseData = await t.run(async (ctx: any) => ctx.db.get(created.disputeId));
    expect(caseData.plaintiff).toBe("eip155:8453:0x00000000000000000000000000000000000000aa");
    expect(caseData.defendant).toBe("eip155:8453:0x0000000000000000000000000000000000000001");
    expect(caseData.reviewerOrganizationId).toBe(stripeOrgId);
  });

  it("should store wallet addresses + merchant origin in paymentDetails metadata (wallet-first)", async () => {
    const created = await t.mutation(api.pool.cases_fileWalletPaymentDispute, {
      blockchain: "base",
      transactionHash: "0xmock_meta_001",
      sellerEndpointUrl: "https://merchant.example/v1/paid",
      origin: "https://merchant.example",
      payer: "eip155:8453:0x00000000000000000000000000000000000000aa",
      merchant: "eip155:8453:0x0000000000000000000000000000000000000001",
      amountMicrousdc: 250_000,
      sourceTransferLogIndex: 0,
      description: "test: wallet-first metadata",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const dispute = await t.query(api.paymentDisputes.getPaymentDispute, { paymentDisputeId: created.disputeId });
    expect(dispute.paymentDetails?.plaintiffMetadata?.walletAddress).toBe("0x00000000000000000000000000000000000000aa");
    expect(dispute.paymentDetails?.defendantMetadata?.walletAddress).toBe("0x0000000000000000000000000000000000000001");
    expect(dispute.paymentDetails?.defendantMetadata?.merchantOrigin).toBe("https://merchant.example");
  });

  it("should auto-assign reviewerOrganizationId from merchant agent wallet", async () => {
    const created = await t.mutation(api.pool.cases_fileWalletPaymentDispute, {
      blockchain: "base",
      transactionHash: "0xmock_auto_detect_001",
      sellerEndpointUrl: "https://merchant.example/v1/paid",
      origin: "https://merchant.example",
      payer: "eip155:8453:0x00000000000000000000000000000000000000aa",
      merchant: "eip155:8453:0x0000000000000000000000000000000000000001",
      amountMicrousdc: 250_000,
      sourceTransferLogIndex: 0,
      description: "test: auto-assign reviewer org",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const dispute = await t.query(api.paymentDisputes.getPaymentDispute, { paymentDisputeId: created.disputeId });
    expect(dispute.reviewerOrganizationId).toBe(stripeOrgId);
  });

  it("should clarify who makes final decision (reviewerOrganizationId)", async () => {
    const created = await t.mutation(api.pool.cases_fileWalletPaymentDispute, {
      blockchain: "base",
      transactionHash: "0xmock_decision_maker_001",
      sellerEndpointUrl: "https://merchant.example/v1/paid",
      origin: "https://merchant.example",
      payer: "eip155:8453:0x00000000000000000000000000000000000000aa",
      merchant: "eip155:8453:0x0000000000000000000000000000000000000001",
      amountMicrousdc: 2_500_000,
      sourceTransferLogIndex: 0,
      description: "test: decision maker",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const dispute = await t.query(api.paymentDisputes.getPaymentDispute, { paymentDisputeId: created.disputeId });
    expect(dispute.reviewerOrganizationId).toBe(stripeOrgId);
    expect(dispute.humanReviewRequired).toBe(true);
  });

  it("should be idempotent by (chain, txHash) for wallet-first filing", async () => {
    const txHash = "0xmock_duplicate_txhash_001";
    const first = await t.mutation(api.pool.cases_fileWalletPaymentDispute, {
      blockchain: "base",
      transactionHash: txHash,
      sellerEndpointUrl: "https://merchant.example/v1/paid",
      origin: "https://merchant.example",
      payer: "eip155:8453:0x00000000000000000000000000000000000000aa",
      merchant: "eip155:8453:0x0000000000000000000000000000000000000001",
      amountMicrousdc: 250_000,
      sourceTransferLogIndex: 0,
      description: "test: duplicate idempotency",
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const second = await t.mutation(api.pool.cases_fileWalletPaymentDispute, {
      blockchain: "base",
      transactionHash: txHash,
      sellerEndpointUrl: "https://merchant.example/v1/paid",
      origin: "https://merchant.example",
      payer: "eip155:8453:0x00000000000000000000000000000000000000aa",
      merchant: "eip155:8453:0x0000000000000000000000000000000000000001",
      amountMicrousdc: 250_000,
      sourceTransferLogIndex: 0,
      description: "test: duplicate idempotency (second)",
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.disputeId).toBe(first.disputeId);
  });
});
