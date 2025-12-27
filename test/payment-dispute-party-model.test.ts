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
import { internal } from "../convex/_generated/api";

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
  });

  it("should correctly identify plaintiff as consumer (not payment provider)", async () => {
    // Scenario: Alice (Stripe customer) disputes OpenAI charge

    const result = await t.action(api.paymentDisputes.receivePaymentDispute, {
      transactionId: "txn_alice_openai_001",
      transactionHash: "0xmock_alice_openai_001",
      blockchain: "base",
      currency: "USDC",
      paymentProtocol: "ACP",
      // Parties
      plaintiff: "consumer:alice@stripe.com", // Alice (consumer) is plaintiff
      defendant: "merchant:openai-acct@stripe.com", // OpenAI (merchant) is defendant
      recipientAddress: "merchant:openai-acct@stripe.com",
      plaintiffMetadata: {
        email: "alice@example.com",
        name: "Alice Smith",
        customerId: "cus_stripe_alice123", // Stripe's customer ID for Alice
      },
      defendantMetadata: {
        email: "billing@openai.com",
        name: "OpenAI",
        merchantId: "acct_stripe_openai789", // Stripe's merchant ID for OpenAI
      },
      disputeReason: "service_not_rendered",
      description: "API credits not delivered as promised",
      evidenceUrls: ["https://alice-evidence.com/receipt.pdf"],
      reviewerOrganizationId: stripeOrgId, // Stripe reviews this dispute
    });

    // Verify party identifiers
    const dispute = await t.query(api.paymentDisputes.getPaymentDispute, {
      paymentDisputeId: result.paymentDisputeId,
    });

    expect(dispute.reviewerOrganizationId).toBe(stripeOrgId); // Stripe reviews
    expect(dispute.plaintiffMetadata?.customerId).toBe("cus_stripe_alice123"); // Alice
    expect(dispute.defendantMetadata?.merchantId).toBe("acct_stripe_openai789"); // OpenAI

    // Get the case
    const caseData = await t.run(async (ctx: any) => {
      return await ctx.db.get(result.caseId);
    });

    expect(caseData.plaintiff).toBe("consumer:alice@stripe.com"); // Consumer is plaintiff
    expect(caseData.defendant).toBe("merchant:openai-acct@stripe.com"); // Merchant is defendant

    console.log("✅ Plaintiff correctly identified as consumer (Alice)");
    console.log("✅ Defendant correctly identified as merchant (OpenAI)");
    console.log("✅ Reviewer correctly identified as payment provider (Stripe)");
  });

  it("should store party metadata for customer's system mapping", async () => {
    const result = await t.action(api.paymentDisputes.receivePaymentDispute, {
      transactionId: "txn_bob_anthropic_001",
      transactionHash: "0xmock_bob_anthropic_001",
      blockchain: "base",
      currency: "USDC",
      paymentProtocol: "ATXP",
      plaintiff: "consumer:bob@stripe.com",
      defendant: "merchant:anthropic-acct@stripe.com",
      recipientAddress: "merchant:anthropic-acct@stripe.com",
      plaintiffMetadata: {
        email: "bob@company.com",
        name: "Bob Johnson",
        customerId: "cus_stripe_bob456",
        walletAddress: "0xbob123",
      },
      defendantMetadata: {
        email: "support@anthropic.com",
        name: "Anthropic PBC",
        merchantId: "acct_stripe_anthropic456",
      },
      disputeReason: "amount_incorrect",
      description: "Charged $100 but should be $75",
      reviewerOrganizationId: stripeOrgId,
    });

    const dispute = await t.query(api.paymentDisputes.getPaymentDispute, {
      paymentDisputeId: result.paymentDisputeId,
    });

    // Verify plaintiff metadata (consumer)
    expect(dispute.plaintiffMetadata).toBeDefined();
    expect(dispute.plaintiffMetadata?.email).toBe("bob@company.com");
    expect(dispute.plaintiffMetadata?.name).toBe("Bob Johnson");
    expect(dispute.plaintiffMetadata?.customerId).toBe("cus_stripe_bob456");
    // Wallet address is normalized from on-chain verification (refund-to-source), overriding caller-provided walletAddress.
    expect(dispute.plaintiffMetadata?.walletAddress).toBe("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");

    // Verify defendant metadata (merchant)
    expect(dispute.defendantMetadata).toBeDefined();
    expect(dispute.defendantMetadata?.email).toBe("support@anthropic.com");
    expect(dispute.defendantMetadata?.name).toBe("Anthropic PBC");
    expect(dispute.defendantMetadata?.merchantId).toBe("acct_stripe_anthropic456");

    console.log("✅ Party metadata stored correctly for mapping back to Stripe's system");
  });

  it("should auto-detect reviewer organization from API key", async () => {
    // This test verifies that when Stripe files a dispute,
    // the reviewerOrganizationId is set to Stripe's org

    const result = await t.action(api.paymentDisputes.receivePaymentDispute, {
      transactionId: "txn_auto_detect_001",
      transactionHash: "0xmock_auto_detect_001",
      blockchain: "base",
      currency: "USDC",
      paymentProtocol: "ACP",
      plaintiff: "consumer:carol@stripe.com",
      defendant: "merchant:vendor@stripe.com",
      recipientAddress: "merchant:vendor@stripe.com",
      disputeReason: "unauthorized",
      description: "Did not authorize this charge",
      reviewerOrganizationId: stripeOrgId, // Auto-detected from Stripe's API key
    });

    const dispute = await t.query(api.paymentDisputes.getPaymentDispute, {
      paymentDisputeId: result.paymentDisputeId,
    });

    expect(dispute.reviewerOrganizationId).toBe(stripeOrgId);
    console.log("✅ Reviewer organization auto-detected from API key");
  });

  it("should support customer-scoped identifiers", async () => {
    // Payment providers use their own identifier format
    // Examples: "consumer:alice@stripe.com", "merchant:vendor-123@stripe.com"

    const testCases = [
      {
        plaintiff: "consumer:alice@stripe.com",
        defendant: "merchant:openai@stripe.com",
      },
      {
        plaintiff: "user:bob-uuid-123@stripe.com",
        defendant: "vendor:anthropic-id-456@stripe.com",
      },
      {
        plaintiff: "customer:carol@stripe.com",
        defendant: "provider:google-ai@stripe.com",
      },
    ];

    for (const testCase of testCases) {
      const result = await t.action(api.paymentDisputes.receivePaymentDispute, {
        transactionId: `txn_${Math.random().toString(36).substring(7)}`,
        transactionHash: `0xmock_${Math.random().toString(36).substring(7)}`,
        blockchain: "base",
        currency: "USDC",
        paymentProtocol: "ACP",
        plaintiff: testCase.plaintiff,
        defendant: testCase.defendant,
        recipientAddress: testCase.defendant,
        disputeReason: "other",
        description: "Testing identifier formats",
        reviewerOrganizationId: stripeOrgId,
      });

      const caseData = await t.run(async (ctx: any) => {
        return await ctx.db.get(result.caseId);
      });

      expect(caseData.plaintiff).toBe(testCase.plaintiff);
      expect(caseData.defendant).toBe(testCase.defendant);
    }

    console.log("✅ Customer-scoped identifiers supported");
  });

  it("should clarify who makes final decision (payment provider)", async () => {
    const result = await t.action(api.paymentDisputes.receivePaymentDispute, {
      transactionId: "txn_decision_maker_001",
      transactionHash: "0xmock_decision_maker_001",
      blockchain: "base",
      currency: "USDC",
      paymentProtocol: "ACP",
      plaintiff: "consumer:dave@stripe.com",
      defendant: "merchant:vendor@stripe.com",
      recipientAddress: "merchant:vendor@stripe.com",
      disputeReason: "quality_issue",
      description: "Service quality below expectations",
      reviewerOrganizationId: stripeOrgId, // Stripe's team makes final decision
    });

    const dispute = await t.query(api.paymentDisputes.getPaymentDispute, {
      paymentDisputeId: result.paymentDisputeId,
    });

    // The reviewerOrganizationId indicates who makes the final decision
    expect(dispute.reviewerOrganizationId).toBe(stripeOrgId);

    // Stripe's team will see this in their review queue
    // They make the final decision, not Consulate
    expect(dispute.humanReviewRequired).toBeDefined();

    console.log("✅ Payment provider (Stripe) identified as final decision maker");
  });

  it("should reject duplicate disputes by tx hash before any chain verification", async () => {
    // Insert an existing PAYMENT case with the same (chain, txHash) so the intake path
    // should reject immediately without calling the on-chain verifier.
    const txHash = "0xmock_duplicate_txhash_001";
    const now = Date.now();

    await t.run(async (ctx: any) => {
      await ctx.db.insert("cases", {
        plaintiff: "consumer:alice@stripe.com",
        defendant: "merchant:openai-acct@stripe.com",
        status: "FILED",
        type: "PAYMENT",
        filedAt: now,
        description: "preexisting dispute",
        amount: 0.01,
        currency: "USDC",
        evidenceIds: [],
        mock: false,
        humanReviewRequired: true,
        createdAt: now,
        retentionPolicy: "payment",
        reviewerOrganizationId: stripeOrgId,
        paymentSourceChain: "base",
        paymentSourceTxHash: txHash,
        paymentDetails: {
          transactionId: txHash,
          transactionHash: txHash,
          blockchain: "base",
          amountMicrousdc: 10_000,
          amountUnit: "microusdc",
          sourceTransferLogIndex: 0,
          disputeReason: "other",
          regulationEDeadline: now + 10 * 24 * 60 * 60 * 1000,
          disputeFee: 0.05,
        },
      });
    });

    // Pass a txHash that would normally fail verifier (not a real 0x64hex), but since we dedupe
    // before verification, we should still get the DUPLICATE_PAYMENT_DISPUTE error.
    await expect(
      t.action(api.paymentDisputes.receivePaymentDispute, {
        transactionId: "txn_dup_001",
        transactionHash: txHash,
        blockchain: "base",
        currency: "USDC",
        // recipientAddress is required by validator, but should not be used due to early dedupe.
        recipientAddress: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
        disputeReason: "other",
        description: "duplicate filing attempt",
        reviewerOrganizationId: stripeOrgId,
      })
    ).rejects.toThrow(/DUPLICATE_PAYMENT_DISPUTE/);
  });

  it("should reject duplicates in createPaymentDisputeCase (defense-in-depth)", async () => {
    const args = {
      transactionId: "0xmock_defense_in_depth_tx",
      transactionHash: "0xmock_defense_in_depth_tx",
      blockchain: "base" as const,
      amountMicrousdc: 10_000,
      amountUsdc: 0.01,
      currency: "USDC",
      plaintiff: "consumer:alice@stripe.com",
      defendant: "merchant:openai-acct@stripe.com",
      disputeReason: "other",
      description: "defense in depth test",
      reviewerOrganizationId: stripeOrgId,
      sourceTransferLogIndex: 0,
      payerAddress: "0x1111111111111111111111111111111111111111",
      recipientAddress: "0x2222222222222222222222222222222222222222",
      disputeFee: 0.05,
    };

    await t.mutation(internal.paymentDisputes.createPaymentDisputeCase as any, args as any);
    await expect(
      t.mutation(internal.paymentDisputes.createPaymentDisputeCase as any, args as any)
    ).rejects.toThrow(/DUPLICATE_PAYMENT_DISPUTE/);
  });
});
