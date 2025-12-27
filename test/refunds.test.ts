/**
 * Automated Refund System Tests
 * 
 * Tests for Solana refund execution, balance management, and CAIP-10 identifiers
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { convexTest } from "convex-test";
import { api, internal } from "../convex/_generated/api";
import schema from "../convex/schema";
import { parseCaip10, extractAddress, isSolana, isEvm, normalizeToCaip10, formatCaip10 } from "../convex/lib/caip10";

describe("CAIP-10 Utilities", () => {
  it("should parse CAIP-10 Solana identifier", () => {
    const identifier = "solana:5eykt4GNfsw7SU33zdhhrELoMu3gFmT33EpFdpEfmgbf:7xYZ123";
    const parsed = parseCaip10(identifier);
    
    expect(parsed.namespace).toBe("solana");
    expect(parsed.chainId).toBe("5eykt4GNfsw7SU33zdhhrELoMu3gFmT33EpFdpEfmgbf");
    expect(parsed.address).toBe("7xYZ123");
  });

  it("should parse CAIP-10 Ethereum identifier", () => {
    const identifier = "eip155:1:0x1234567890123456789012345678901234567890";
    const parsed = parseCaip10(identifier);
    
    expect(parsed.namespace).toBe("eip155");
    expect(parsed.chainId).toBe("1");
    expect(parsed.address).toBe("0x1234567890123456789012345678901234567890");
  });

  it("should parse legacy Ethereum address", () => {
    const address = "0x1234567890123456789012345678901234567890";
    const parsed = parseCaip10(address);
    
    expect(parsed.namespace).toBe("eip155");
    expect(parsed.address).toBe(address);
  });

  it("should detect Solana identifiers", () => {
    expect(isSolana("solana:5eykt:7xYZ123")).toBe(true);
    expect(isSolana("eip155:1:0x1234")).toBe(false);
  });

  it("should detect EVM identifiers", () => {
    expect(isEvm("eip155:1:0x1234")).toBe(true);
    expect(isEvm("solana:5eykt:7xYZ123")).toBe(false);
  });

  it("should extract address from CAIP-10", () => {
    expect(extractAddress("solana:5eykt:7xYZ123")).toBe("7xYZ123");
    expect(extractAddress("eip155:1:0xABC")).toBe("0xABC");
  });

  it("should format CAIP-10 identifier", () => {
    const formatted = formatCaip10("solana", "5eykt", "7xYZ123");
    expect(formatted).toBe("solana:5eykt:7xYZ123");
  });

  it("should normalize address to CAIP-10", () => {
    // Already CAIP-10
    expect(normalizeToCaip10("solana:5eykt:7xYZ123")).toBe("solana:5eykt:7xYZ123");
    
    // Legacy format - should be converted
    const normalized = normalizeToCaip10("7xYZ123abc");
    expect(normalized).toContain("solana:");
    expect(normalized).toContain("7xYZ123abc");
  });
});

describe("Refund System - Unit Tests", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("organizations", {
        name: "Test Merchant Org",
        createdAt: Date.now(),
      });
    });
  });

  it("should create merchant balance with CAIP-10 wallet", async () => {
    const walletAddress = "solana:5eykt4GNfsw7SU33zdhhrELoMu3gFmT33EpFdpEfmgbf:TEST_MERCHANT_123";
    
    const balanceId = await t.run(async (ctx) => {
      return await ctx.db.insert("merchantBalances", {
        walletAddress,
        currency: "USDC",
        availableBalance: 1000,
        lockedBalance: 0,
        totalDeposited: 1000,
        totalRefunded: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const balance = await t.run(async (ctx) => {
      return await ctx.db.get(balanceId);
    });

    expect(balance).toBeDefined();
    expect(balance?.walletAddress).toBe(walletAddress);
    expect(balance?.availableBalance).toBe(1000);
    expect(balance?.currency).toBe("USDC");
  });

  it("should create merchant settings with auto-refund enabled", async () => {
    const walletAddress = "solana:5eykt4GNfsw7SU33zdhhrELoMu3gFmT33EpFdpEfmgbf:TEST_MERCHANT_456";
    
    const settingsId = await t.run(async (ctx) => {
      return await ctx.db.insert("merchantSettings", {
        walletAddress,
        autoRefundEnabled: true,
        autoRefundThreshold: 100,
        requireApprovalOver: 500,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const settings = await t.run(async (ctx) => {
      return await ctx.db.get(settingsId);
    });

    expect(settings).toBeDefined();
    expect(settings?.autoRefundEnabled).toBe(true);
    expect(settings?.autoRefundThreshold).toBe(100);
  });

  it("should query balance by wallet and currency", async () => {
    const walletAddress = "solana:5eykt4GNfsw7SU33zdhhrELoMu3gFmT33EpFdpEfmgbf:TEST_MERCHANT_789";
    
    await t.run(async (ctx) => {
      await ctx.db.insert("merchantBalances", {
        walletAddress,
        currency: "USDC",
        availableBalance: 500,
        lockedBalance: 0,
        totalDeposited: 500,
        totalRefunded: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const balance = await t.run(async (ctx) => {
      return await ctx.db
        .query("merchantBalances")
        .withIndex("by_wallet_currency", q =>
          q.eq("walletAddress", walletAddress).eq("currency", "USDC")
        )
        .first();
    });

    expect(balance).toBeDefined();
    expect(balance?.availableBalance).toBe(500);
  });
});

describe("Refund System - Integration Tests", () => {
  let t: ReturnType<typeof convexTest>;
  let merchantWallet: string;
  let consumerWallet: string;
  let organizationId: any;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
    merchantWallet = `solana:5eykt4GNfsw7SU33zdhhrELoMu3gFmT33EpFdpEfmgbf:MERCHANT_${Date.now()}`;
    consumerWallet = `solana:5eykt4GNfsw7SU33zdhhrELoMu3gFmT33EpFdpEfmgbf:CONSUMER_${Date.now()}`;

    // Create organization and user for testing
    organizationId = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Test Merchant Org",
        createdAt: Date.now(),
      });
    });

    // Create merchant balance
    await t.run(async (ctx) => {
      await ctx.db.insert("merchantBalances", {
        walletAddress: merchantWallet,
        currency: "USDC",
        availableBalance: 1000,
        lockedBalance: 0,
        totalDeposited: 1000,
        totalRefunded: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    // Create merchant settings with auto-refund enabled
    await t.run(async (ctx) => {
      await ctx.db.insert("merchantSettings", {
        walletAddress: merchantWallet,
        organizationId,
        autoRefundEnabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });
  });

  it("should skip refund if verdict is not CONSUMER_WINS", async () => {
    const caseId = await t.run(async (ctx) => {
      return await ctx.db.insert("cases", {
        plaintiff: consumerWallet,
        defendant: merchantWallet,
        status: "DECIDED",
        type: "GENERAL",
        filedAt: Date.now(),
        description: "Test dispute",
        amount: 10,
        currency: "USDC",
        evidenceIds: [],
        finalVerdict: "MERCHANT_WINS",
        decidedAt: Date.now(),
        mock: false,
        humanReviewRequired: false,
        createdAt: Date.now(),
      });
    });

    const result = await t.mutation(internal.refunds.executeAutomatedRefund, {
      caseId,
    });

    expect(result.status).toBe("NOT_APPLICABLE");
    expect(result.reason).toBe("Verdict not CONSUMER_WINS");
  });

  it("should skip refund if auto-refund is disabled", async () => {
    // Update settings to disable auto-refund
    await t.run(async (ctx) => {
      const settings = await ctx.db
        .query("merchantSettings")
        .withIndex("by_wallet", q => q.eq("walletAddress", merchantWallet))
        .first();
      
      if (settings) {
        await ctx.db.patch(settings._id, {
          autoRefundEnabled: false,
        });
      }
    });

    const caseId = await t.run(async (ctx) => {
      return await ctx.db.insert("cases", {
        plaintiff: consumerWallet,
        defendant: merchantWallet,
        status: "DECIDED",
        type: "GENERAL",
        filedAt: Date.now(),
        description: "Test dispute",
        amount: 10,
        currency: "USDC",
        evidenceIds: [],
        finalVerdict: "CONSUMER_WINS",
        decidedAt: Date.now(),
        mock: false,
        humanReviewRequired: false,
        createdAt: Date.now(),
      });
    });

    const result = await t.mutation(internal.refunds.executeAutomatedRefund, {
      caseId,
    });

    expect(result.status).toBe("AWAITING_APPROVAL");
    expect(result.reason).toBe("Auto-refund not enabled");
  });

  it("should skip refund if amount exceeds threshold", async () => {
    // Set threshold at $50
    await t.run(async (ctx) => {
      const settings = await ctx.db
        .query("merchantSettings")
        .withIndex("by_wallet", q => q.eq("walletAddress", merchantWallet))
        .first();
      
      if (settings) {
        await ctx.db.patch(settings._id, {
          requireApprovalOver: 50,
        });
      }
    });

    const caseId = await t.run(async (ctx) => {
      return await ctx.db.insert("cases", {
        plaintiff: consumerWallet,
        defendant: merchantWallet,
        status: "DECIDED",
        type: "GENERAL",
        filedAt: Date.now(),
        description: "Test high-value dispute",
        amount: 100,  // Exceeds threshold
        currency: "USDC",
        evidenceIds: [],
        finalVerdict: "CONSUMER_WINS",
        decidedAt: Date.now(),
        mock: false,
        humanReviewRequired: false,
        createdAt: Date.now(),
      });
    });

    const result = await t.mutation(internal.refunds.executeAutomatedRefund, {
      caseId,
    });

    expect(result.status).toBe("AWAITING_APPROVAL");
    expect(result.reason).toBe("Amount exceeds threshold");
  });

  it("should fail if merchant has insufficient balance", async () => {
    const caseId = await t.run(async (ctx) => {
      return await ctx.db.insert("cases", {
        plaintiff: consumerWallet,
        defendant: merchantWallet,
        status: "DECIDED",
        type: "GENERAL",
        filedAt: Date.now(),
        description: "Test dispute",
        amount: 2000,  // More than available balance (1000)
        currency: "USDC",
        evidenceIds: [],
        finalVerdict: "CONSUMER_WINS",
        decidedAt: Date.now(),
        mock: false,
        humanReviewRequired: false,
        createdAt: Date.now(),
      });
    });

    const result = await t.mutation(internal.refunds.executeAutomatedRefund, {
      caseId,
    });

    expect(result.status).toBe("INSUFFICIENT_BALANCE");
    expect(result.available).toBe(1000);
    expect(result.required).toBe(2000);
  });

  it("should create pending refund transaction when conditions met", async () => {
    const caseId = await t.run(async (ctx) => {
      return await ctx.db.insert("cases", {
        plaintiff: consumerWallet,
        defendant: merchantWallet,
        status: "DECIDED",
        type: "GENERAL",
        filedAt: Date.now(),
        description: "Test dispute - API timeout",
        amount: 10,
        currency: "USDC",
        evidenceIds: [],
        finalVerdict: "CONSUMER_WINS",
        decidedAt: Date.now(),
        mock: false,
        humanReviewRequired: false,
        createdAt: Date.now(),
      });
    });

    const result = await t.mutation(internal.refunds.executeAutomatedRefund, {
      caseId,
    });

    expect(result.status).toBe("SCHEDULED");
    expect(result.refundId).toBeDefined();

    // Verify refund transaction was created
    const refund = await t.run(async (ctx) => {
      return await ctx.db
        .query("refundTransactions")
        .withIndex("by_case", q => q.eq("caseId", caseId))
        .first();
    });

    expect(refund).toBeDefined();
    expect(refund?.fromWallet).toBe(merchantWallet);
    expect(refund?.toWallet).toBe(consumerWallet);
    expect(refund?.amount).toBe(10);
    expect(refund?.currency).toBe("USDC");
    expect(refund?.blockchain).toBe("solana");
    expect(refund?.status).toBe("PENDING");
  });

  it("should prevent duplicate refunds", async () => {
    const caseId = await t.run(async (ctx) => {
      return await ctx.db.insert("cases", {
        plaintiff: consumerWallet,
        defendant: merchantWallet,
        status: "DECIDED",
        type: "GENERAL",
        filedAt: Date.now(),
        description: "Test dispute",
        amount: 10,
        currency: "USDC",
        evidenceIds: [],
        finalVerdict: "CONSUMER_WINS",
        decidedAt: Date.now(),
        mock: false,
        humanReviewRequired: false,
        createdAt: Date.now(),
      });
    });

    // First refund
    const result1 = await t.mutation(internal.refunds.executeAutomatedRefund, {
      caseId,
    });
    expect(result1.status).toBe("SCHEDULED");

    // Second refund attempt
    const result2 = await t.mutation(internal.refunds.executeAutomatedRefund, {
      caseId,
    });
    expect(result2.status).toBe("ALREADY_REFUNDED");
  });

  it("should get refund status for case", async () => {
    const caseId = await t.run(async (ctx) => {
      return await ctx.db.insert("cases", {
        plaintiff: consumerWallet,
        defendant: merchantWallet,
        status: "DECIDED",
        type: "GENERAL",
        filedAt: Date.now(),
        description: "Test dispute",
        amount: 10,
        currency: "USDC",
        evidenceIds: [],
        finalVerdict: "CONSUMER_WINS",
        decidedAt: Date.now(),
        mock: false,
        humanReviewRequired: false,
        createdAt: Date.now(),
      });
    });

    // Create refund
    await t.mutation(internal.refunds.executeAutomatedRefund, {
      caseId,
    });

    // Query refund status
    const refundStatus = await t.query(api.refunds.getRefundStatus, {
      caseId,
    });

    expect(refundStatus).toBeDefined();
    expect(refundStatus?.caseId).toBe(caseId);
    expect(refundStatus?.status).toBe("PENDING");
  });

  it("should schedule refund execution and create transaction record", async () => {
    const caseId = await t.run(async (ctx) => {
      return await ctx.db.insert("cases", {
        plaintiff: consumerWallet,
        defendant: merchantWallet,
        status: "DECIDED",
        type: "GENERAL",
        filedAt: Date.now(),
        description: "Test dispute",
        amount: 10,
        currency: "USDC",
        evidenceIds: [],
        finalVerdict: "CONSUMER_WINS",
        decidedAt: Date.now(),
        mock: false,
        humanReviewRequired: false,
        createdAt: Date.now(),
      });
    });

    // Schedule refund
    const scheduleResult = await t.mutation(internal.refunds.executeAutomatedRefund, {
      caseId,
    });
    expect(scheduleResult.status).toBe("SCHEDULED");
    expect(scheduleResult.refundId).toBeDefined();

    const refundId = scheduleResult.refundId;

    // Verify refund transaction was created
    const refund = await t.run(async (ctx) => {
      return await ctx.db.get(refundId);
    });

    expect(refund).toBeDefined();
    expect(refund?.status).toBe("PENDING");
    expect(refund?.fromWallet).toBe(merchantWallet);
    expect(refund?.toWallet).toBe(consumerWallet);
    expect(refund?.amount).toBe(10);
    expect(refund?.currency).toBe("USDC");
    expect(refund?.blockchain).toBe("solana");
    
    // Note: Full execution test with balance updates and events
    // requires action support which isn't available in convex-test
    // Production execution is tested via integration tests
  });

  it("should support multiple currencies per merchant", async () => {
    const wallet = `solana:5eykt4GNfsw7SU33zdhhrELoMu3gFmT33EpFdpEfmgbf:MULTI_CURRENCY_${Date.now()}`;

    // Create USDC balance
    await t.run(async (ctx) => {
      await ctx.db.insert("merchantBalances", {
        walletAddress: wallet,
        currency: "USDC",
        availableBalance: 1000,
        lockedBalance: 0,
        totalDeposited: 1000,
        totalRefunded: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    // Create SOL balance
    await t.run(async (ctx) => {
      await ctx.db.insert("merchantBalances", {
        walletAddress: wallet,
        currency: "SOL",
        availableBalance: 50,
        lockedBalance: 0,
        totalDeposited: 50,
        totalRefunded: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    // Query USDC balance
    const usdcBalance = await t.run(async (ctx) => {
      return await ctx.db
        .query("merchantBalances")
        .withIndex("by_wallet_currency", q =>
          q.eq("walletAddress", wallet).eq("currency", "USDC")
        )
        .first();
    });

    // Query SOL balance
    const solBalance = await t.run(async (ctx) => {
      return await ctx.db
        .query("merchantBalances")
        .withIndex("by_wallet_currency", q =>
          q.eq("walletAddress", wallet).eq("currency", "SOL")
        )
        .first();
    });

    expect(usdcBalance?.availableBalance).toBe(1000);
    expect(solBalance?.availableBalance).toBe(50);
  });

  it("should handle manual refund approval bypassing auto-refund setting", async () => {
    // Disable auto-refund for merchant
    await t.run(async (ctx) => {
      const settings = await ctx.db
        .query("merchantSettings")
        .withIndex("by_wallet", q => q.eq("walletAddress", merchantWallet))
        .first();
      
      if (settings) {
        await ctx.db.patch(settings._id, {
          autoRefundEnabled: false,
        });
      }
    });

    // Create user for approval
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkUserId: "test_user_123",
        email: "test@example.com",
        organizationId,
        role: "admin",
        createdAt: Date.now(),
      });
    });

    // Create case
    const caseId = await t.run(async (ctx) => {
      return await ctx.db.insert("cases", {
        plaintiff: consumerWallet,
        defendant: merchantWallet,
        status: "DECIDED",
        type: "GENERAL",
        filedAt: Date.now(),
        description: "Test manual approval",
        amount: 10,
        currency: "USDC",
        evidenceIds: [],
        finalVerdict: "CONSUMER_WINS",
        decidedAt: Date.now(),
        reviewerOrganizationId: organizationId,
        mock: false,
        humanReviewRequired: false,
        createdAt: Date.now(),
      });
    });

    // Call manualApproveRefund (which calls executeAutomatedRefund internally)
    // Even if auto-refund is disabled, manual approval should force the refund.
    const result = await t.mutation(api.refunds.manualApproveRefund, {
      caseId,
      approvedByUserId: userId,
    });

    expect(result.status).toBe("SCHEDULED");

    const refund = await t.run(async (ctx) => {
      return await ctx.db
        .query("refundTransactions")
        .withIndex("by_case", q => q.eq("caseId", caseId))
        .first();
    });

    expect(refund).toBeTruthy();
    expect(refund?.status).toBe("PENDING");
  });

  it("should surface an executed refund for duplicate cases filed against the same source transfer", async () => {
    // Create two PAYMENT cases with identical (chain, txHash, logIndex), simulating duplicate filing.
    const now = Date.now();
    const txHash = `0x${"a".repeat(64)}`;

    const caseId1 = await t.run(async (ctx) => {
      return await ctx.db.insert("cases", {
        plaintiff: consumerWallet,
        defendant: merchantWallet,
        status: "DECIDED",
        type: "PAYMENT",
        filedAt: now,
        description: "Duplicate case 1",
        amount: 0.01,
        currency: "USDC",
        evidenceIds: [],
        finalVerdict: "CONSUMER_WINS",
        decidedAt: now,
        reviewerOrganizationId: organizationId,
        paymentDetails: {
          transactionId: txHash,
          blockchain: "base",
          transactionHash: txHash,
          sourceTransferLogIndex: 7,
          amountMicrousdc: 10_000,
          amountUnit: "microusdc",
          disputeReason: "quality_issue",
          regulationEDeadline: now + 10 * 24 * 60 * 60 * 1000,
          disputeFee: 0.05,
        },
        mock: false,
        humanReviewRequired: false,
        createdAt: now,
      });
    });

    const caseId2 = await t.run(async (ctx) => {
      return await ctx.db.insert("cases", {
        plaintiff: consumerWallet,
        defendant: merchantWallet,
        status: "DECIDED",
        type: "PAYMENT",
        filedAt: now + 1,
        description: "Duplicate case 2",
        amount: 0.01,
        currency: "USDC",
        evidenceIds: [],
        finalVerdict: "CONSUMER_WINS",
        decidedAt: now + 1,
        reviewerOrganizationId: organizationId,
        paymentDetails: {
          transactionId: txHash,
          blockchain: "base",
          transactionHash: txHash,
          sourceTransferLogIndex: 7,
          amountMicrousdc: 10_000,
          amountUnit: "microusdc",
          disputeReason: "quality_issue",
          regulationEDeadline: now + 10 * 24 * 60 * 60 * 1000,
          disputeFee: 0.05,
        },
        mock: false,
        humanReviewRequired: false,
        createdAt: now + 1,
      });
    });

    // Insert a refund record attached to the first case (as if it executed already).
    const refundId = await t.run(async (ctx) => {
      return await ctx.db.insert("refundTransactions", {
        caseId: caseId1,
        fromWallet: "platform",
        toWallet: consumerWallet,
        amount: 0.01,
        currency: "USDC",
        blockchain: "base",
        status: "EXECUTED",
        createdAt: now,
        executedAt: now,
        sourceChain: "base",
        sourceTxHash: txHash,
        sourceTransferLogIndex: 7,
        amountMicrousdc: 10_000,
        refundToAddress: "0xabc",
        provider: "coinbase",
        providerTransferId: `0x${"b".repeat(64)}`,
      });
    });

    // getRefundStatus for case 2 should still return the executed refund via source-triplet fallback.
    const refund2 = await t.query(api.refunds.getRefundStatus, { caseId: caseId2 });
    expect(refund2?._id).toBe(refundId);
    expect(refund2?.status).toBe("EXECUTED");

    // And attempting an automated refund for case 2 should be idempotent and not create a new record.
    const res = await t.mutation(internal.refunds.executeAutomatedRefund, { caseId: caseId2, force: true });
    expect(res.status).toBe("ALREADY_REFUNDED");
  });
});

describe("Refund System - Edge Cases", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(async () => {
    const modules = import.meta.glob('../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);
  });

  it("should handle missing merchant settings", async () => {
    const merchantWallet = `solana:5eykt4GNfsw7SU33zdhhrELoMu3gFmT33EpFdpEfmgbf:NO_SETTINGS_${Date.now()}`;
    const consumerWallet = `solana:5eykt4GNfsw7SU33zdhhrELoMu3gFmT33EpFdpEfmgbf:CONSUMER_${Date.now()}`;

    const caseId = await t.run(async (ctx) => {
      return await ctx.db.insert("cases", {
        plaintiff: consumerWallet,
        defendant: merchantWallet,
        status: "DECIDED",
        type: "GENERAL",
        filedAt: Date.now(),
        description: "Test dispute",
        amount: 10,
        currency: "USDC",
        evidenceIds: [],
        finalVerdict: "CONSUMER_WINS",
        decidedAt: Date.now(),
        mock: false,
        humanReviewRequired: false,
        createdAt: Date.now(),
      });
    });

    const result = await t.mutation(internal.refunds.executeAutomatedRefund, {
      caseId,
    });

    expect(result.status).toBe("AWAITING_APPROVAL");
    expect(result.reason).toBe("Auto-refund not enabled");
  });

  it("should handle missing merchant balance", async () => {
    const merchantWallet = `solana:5eykt4GNfsw7SU33zdhhrELoMu3gFmT33EpFdpEfmgbf:NO_BALANCE_${Date.now()}`;
    const consumerWallet = `solana:5eykt4GNfsw7SU33zdhhrELoMu3gFmT33EpFdpEfmgbf:CONSUMER_${Date.now()}`;

    // Create settings but no balance
    await t.run(async (ctx) => {
      await ctx.db.insert("merchantSettings", {
        walletAddress: merchantWallet,
        autoRefundEnabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const caseId = await t.run(async (ctx) => {
      return await ctx.db.insert("cases", {
        plaintiff: consumerWallet,
        defendant: merchantWallet,
        status: "DECIDED",
        type: "GENERAL",
        filedAt: Date.now(),
        description: "Test dispute",
        amount: 10,
        currency: "USDC",
        evidenceIds: [],
        finalVerdict: "CONSUMER_WINS",
        decidedAt: Date.now(),
        mock: false,
        humanReviewRequired: false,
        createdAt: Date.now(),
      });
    });

    const result = await t.mutation(internal.refunds.executeAutomatedRefund, {
      caseId,
    });

    expect(result.status).toBe("INSUFFICIENT_BALANCE");
    expect(result.available).toBe(0);
  });

  it("should detect non-Solana blockchain using CAIP-10", async () => {
    const ethMerchant = "eip155:1:0x1234567890123456789012345678901234567890";
    const ethConsumer = "eip155:1:0xABCDEF1234567890123456789012345678901234";

    // Verify CAIP-10 parsing correctly identifies non-Solana
    expect(isSolana(ethMerchant)).toBe(false);
    expect(isEvm(ethMerchant)).toBe(true);
    
    // Create balance and settings
    await t.run(async (ctx) => {
      await ctx.db.insert("merchantBalances", {
        walletAddress: ethMerchant,
        currency: "USDC",
        availableBalance: 1000,
        lockedBalance: 0,
        totalDeposited: 1000,
        totalRefunded: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await ctx.db.insert("merchantSettings", {
        walletAddress: ethMerchant,
        autoRefundEnabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const caseId = await t.run(async (ctx) => {
      return await ctx.db.insert("cases", {
        plaintiff: ethConsumer,
        defendant: ethMerchant,
        status: "DECIDED",
        type: "GENERAL",
        filedAt: Date.now(),
        description: "Test Ethereum dispute",
        amount: 10,
        currency: "USDC",
        evidenceIds: [],
        finalVerdict: "CONSUMER_WINS",
        decidedAt: Date.now(),
        mock: false,
        humanReviewRequired: false,
        createdAt: Date.now(),
      });
    });

    // Schedule refund (should work)
    const scheduleResult = await t.mutation(internal.refunds.executeAutomatedRefund, {
      caseId,
    });
    
    expect(scheduleResult.status).toBe("SCHEDULED");
    expect(scheduleResult.refundId).toBeDefined();
    
    // Verify refund transaction was created with EVM address
    const refund = await t.run(async (ctx) => {
      return await ctx.db.get(scheduleResult.refundId);
    });

    expect(refund?.fromWallet).toBe(ethMerchant);
    expect(refund?.status).toBe("PENDING");
    
    // Note: Full execution would fail in production with "Unsupported blockchain"
    // but that's tested in integration tests with actual Solana endpoint
  });
});

console.log("✅ Refund system test suite created");

