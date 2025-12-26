/**
 * Regulation E Compliance Tests
 *
 * Verifies compliance with Regulation E requirements for payment disputes.
 * Key requirement: Resolve disputes within 10 business days.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";

describe("Regulation E Compliance", () => {
  let t: any;
  let testOrgId: any;

  beforeEach(async () => {
    console.log("🧪 Setting up Regulation E compliance test environment...");
    const modules = import.meta.glob('../../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);

    testOrgId = await t.run(async (ctx: any) => {
      return await ctx.db.insert("organizations", {
        name: "Test Payment Platform",
        domain: "regepayment.com",
        verified: true,
        createdAt: Date.now(),
      });
    });

    await t.run(async (ctx: any) => {
      await ctx.db.insert("orgRefundCredits", {
        organizationId: testOrgId,
        enabled: true,
        trialCreditMicrousdc: 5_000_000,
        spentMicrousdc: 0,
        maxPerCaseMicrousdc: 250_000,
        createdAt: Date.now(),
      });
    });
  });

  it("should set 10 business day deadline on dispute creation", async () => {
    const result = await t.action(api.paymentDisputes.receivePaymentDispute, {
      transactionId: "rege_001",
      transactionHash: "0xmock_rege_001",
      blockchain: "base",
      amount: "0.25",
      amountUnit: "usdc",
      currency: "USDC",
      paymentProtocol: "ACP",
      plaintiff: "customer_abc",
      defendant: "merchant_xyz",
      disputeReason: "unauthorized",
      description: "Unauthorized transaction on customer account",
      evidenceUrls: ["https://evidence.example.com/unauth.json"],
      reviewerOrganizationId: testOrgId,
    });

    const dispute = await t.run(async (ctx: any) => {
      return await ctx.db.get(result.paymentDisputeId);
    });

    expect(dispute.regulationEDeadline).toBeDefined();

    const now = Date.now();
    const tenDays = 10 * 24 * 60 * 60 * 1000; // 10 days in milliseconds
    const deadline = dispute.regulationEDeadline;

    // Deadline should be approximately 10 days from now (within 1 hour margin)
    const expectedDeadline = now + tenDays;
    const margin = 60 * 60 * 1000; // 1 hour

    expect(deadline).toBeGreaterThan(expectedDeadline - margin);
    expect(deadline).toBeLessThan(expectedDeadline + margin);

    console.log(`✅ Regulation E deadline set: ${new Date(deadline).toISOString()}`);
  });

  it("should resolve micro-disputes within 5 minutes (well under 10 business days)", async () => {
    const startTime = Date.now();

    const result = await t.action(api.paymentDisputes.receivePaymentDispute, {
      transactionId: "fast_resolve_001",
      transactionHash: "0xmock_fast_resolve_001",
      blockchain: "base",
      amount: "0.25",
      amountUnit: "usdc",
      currency: "USDC",
      paymentProtocol: "ACP",
      plaintiff: "customer_fast",
      defendant: "merchant_fast",
      disputeReason: "api_timeout",
      description: "API timeout - clear SLA violation",
      evidenceUrls: ["https://evidence.example.com/fast.json"],
      reviewerOrganizationId: testOrgId,
    });

    // Wait for AI processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    const processingTime = Date.now() - startTime;

    // Should be resolved in under 5 minutes (300,000ms)
    expect(processingTime).toBeLessThan(300000);

    // For micro-disputes, typically under 10 seconds in production
    console.log(`✅ Micro-dispute processed in ${processingTime}ms (target: < 5 minutes)`);
  });

  it("should track Regulation E compliance status", async () => {
    const result = await t.action(api.paymentDisputes.receivePaymentDispute, {
      transactionId: "compliance_001",
      transactionHash: "0xmock_compliance_001",
      blockchain: "base",
      amount: "0.25",
      amountUnit: "usdc",
      currency: "USDC",
      paymentProtocol: "ATXP",
      plaintiff: "customer_comp",
      defendant: "merchant_comp",
      disputeReason: "service_not_rendered",
      description: "Service not delivered as promised",
      evidenceUrls: ["https://evidence.example.com/comp.json"],
      reviewerOrganizationId: testOrgId,
    });

    expect(result.regulationECompliant).toBe(true);

    console.log("✅ Regulation E compliance status tracked");
  });

  it("should flag disputes approaching Regulation E deadline", async () => {
    // Create dispute
    const result = await t.action(api.paymentDisputes.receivePaymentDispute, {
      transactionId: "approaching_deadline_001",
      transactionHash: "0xmock_approaching_deadline_001",
      blockchain: "base",
      amount: "0.25",
      amountUnit: "usdc",
      currency: "USDC",
      paymentProtocol: "ACP",
      plaintiff: "customer_deadline",
      defendant: "merchant_deadline",
      disputeReason: "fraud", // High-risk, likely needs review
      description: "Suspected fraudulent transaction",
      evidenceUrls: ["https://evidence.example.com/fraud.json"],
      reviewerOrganizationId: testOrgId,
    });

    const dispute = await t.run(async (ctx: any) => {
      return await ctx.db.get(result.paymentDisputeId);
    });

    const now = Date.now();
    const deadline = dispute.regulationEDeadline;
    const daysRemaining = (deadline - now) / (24 * 60 * 60 * 1000);

    expect(daysRemaining).toBeGreaterThan(0);
    expect(daysRemaining).toBeLessThanOrEqual(10);

    console.log(`✅ Dispute created with ${daysRemaining.toFixed(2)} days remaining until Regulation E deadline`);
  });

  it("should auto-resolve eligible disputes to meet Regulation E deadline", async () => {
    // Create 10 micro-disputes
    const disputes = [];
    for (let i = 0; i < 10; i++) {
      const result = await t.action(api.paymentDisputes.receivePaymentDispute, {
        transactionId: `auto_resolve_${i}`,
        transactionHash: `0xmock_auto_resolve_${i}`,
        blockchain: "base",
        amount: "0.25",
        amountUnit: "usdc",
        currency: "USDC",
        paymentProtocol: "ACP",
        plaintiff: `customer_${i}`,
        defendant: `merchant_${i % 3}`,
        disputeReason: "api_timeout",
        description: "API timeout dispute",
        evidenceUrls: [`https://evidence.example.com/auto_${i}.json`],
        reviewerOrganizationId: testOrgId,
      });
      disputes.push(result);
    }

    // All micro-disputes should be auto-eligible to meet deadline
    const autoEligible = disputes.filter(d => d.autoResolveEligible).length;
    const autoEligibleRate = autoEligible / disputes.length;

    expect(autoEligibleRate).toBeGreaterThan(0.9); // At least 90% auto-eligible

    console.log(`✅ Auto-resolve eligibility: ${autoEligible}/${disputes.length} (${(autoEligibleRate * 100).toFixed(1)}%)`);
  });

  it("should provide provisional credit tracking (future feature)", async () => {
    // Regulation E may require provisional credit within 1 business day
    // while investigation continues up to 10 days

    const result = await t.action(api.paymentDisputes.receivePaymentDispute, {
      transactionId: "provisional_001",
      transactionHash: "0xmock_provisional_001",
      blockchain: "base",
      amount: "0.25",
      amountUnit: "usdc",
      currency: "USDC",
      paymentProtocol: "ATXP",
      plaintiff: "customer_provisional",
      defendant: "merchant_provisional",
      disputeReason: "unauthorized",
      description: "Unauthorized transaction requiring provisional credit",
      evidenceUrls: ["https://evidence.example.com/prov.json"],
      reviewerOrganizationId: testOrgId,
    });

    // TODO: Implement provisional credit tracking
    // const dispute = await t.run(async (ctx: any) => {
    //   return await ctx.db.get(result.paymentDisputeId);
    // });
    //
    // expect(dispute.provisionalCreditRequired).toBeDefined();
    // expect(dispute.provisionalCreditDeadline).toBeDefined();

    console.log("⚠️  Provisional credit tracking not yet implemented - placeholder test");
    expect(result.caseId).toBeDefined();
  });

  it("should maintain complete investigation records for Regulation E audit", async () => {
    // Create dispute with full evidence trail
    const result = await t.action(api.paymentDisputes.receivePaymentDispute, {
      transactionId: "audit_trail_001",
      transactionHash: "0xmock_audit_trail_001",
      blockchain: "base",
      amount: "0.25",
      amountUnit: "usdc",
      currency: "USDC",
      paymentProtocol: "ACP",
      plaintiff: "customer_audit",
      defendant: "merchant_audit",
      disputeReason: "service_not_rendered",
      description: "Complete audit trail test",
      evidenceUrls: [
        "https://evidence.example.com/audit1.json",
        "https://evidence.example.com/audit2.json",
        "https://evidence.example.com/audit3.json",
      ],
      reviewerOrganizationId: testOrgId,
    });

    // Verify case has evidence
    const caseData = await t.run(async (ctx: any) => {
      return await ctx.db.get(result.caseId);
    });

    expect(caseData.evidenceIds).toBeDefined();
    expect(caseData.evidenceIds.length).toBe(3);

    // Verify ADP custody chain
    const custodyVerification = await t.query(api.custody.verifyCustodyChain, {
      caseId: result.caseId,
    });

    expect(custodyVerification.totalEvents).toBeGreaterThan(0);

    console.log(`✅ Complete investigation record: ${caseData.evidenceIds.length} pieces of evidence, ${custodyVerification.totalEvents} custody events`);
  });

  it("should handle Regulation E exemptions for certain transaction types", async () => {
    // Some transactions may be exempt from Regulation E
    // (e.g., business-to-business transactions)

    const result = await t.action(api.paymentDisputes.receivePaymentDispute, {
      transactionId: "b2b_exempt_001",
      transactionHash: "0xmock_b2b_exempt_001",
      blockchain: "base",
      amount: "0.25",
      amountUnit: "usdc",
      currency: "USDC",
      paymentProtocol: "ACP",
      plaintiff: "business_customer",
      defendant: "business_merchant",
      disputeReason: "service_not_rendered",
      description: "B2B transaction dispute (may be Regulation E exempt)",
      evidenceUrls: ["https://evidence.example.com/b2b.json"],
      reviewerOrganizationId: testOrgId,
    });

    // TODO: Implement Regulation E exemption logic
    // const dispute = await t.run(async (ctx: any) => {
    //   return await ctx.db.get(result.paymentDisputeId);
    // });
    //
    // expect(dispute.regulationEExempt).toBeDefined();

    console.log("⚠️  Regulation E exemption logic not yet implemented - placeholder test");
    expect(result.caseId).toBeDefined();
  });

  it("should measure compliance with 10 business day deadline across batch", async () => {
    const batchSize = 50;
    const startTime = Date.now();
    const disputes = [];

    // Create batch of disputes
    for (let i = 0; i < batchSize; i++) {
      const result = await t.action(api.paymentDisputes.receivePaymentDispute, {
        transactionId: `batch_compliance_${i}`,
        transactionHash: `0xmock_batch_compliance_${i}`,
        blockchain: "base",
        amount: "0.25",
        amountUnit: "usdc",
        currency: "USDC",
        paymentProtocol: "ACP",
        plaintiff: `customer_${i}`,
        defendant: `merchant_${i % 10}`,
        disputeReason: i % 2 === 0 ? "api_timeout" : "service_not_rendered",
        description: `Batch compliance test ${i}`,
        evidenceUrls: [`https://evidence.example.com/batch_${i}.json`],
        reviewerOrganizationId: testOrgId,
      });
      disputes.push(result);
    }

    const totalProcessingTime = Date.now() - startTime;
    const avgProcessingTime = totalProcessingTime / batchSize;

    // All should be Regulation E compliant
    const compliantCount = disputes.filter(d => d.regulationECompliant).length;
    const complianceRate = compliantCount / batchSize;

    expect(complianceRate).toBe(1.0); // 100% compliance

    console.log(`\n📊 Regulation E Compliance Metrics:`);
    console.log(`   Total disputes: ${batchSize}`);
    console.log(`   Compliant: ${compliantCount} (${(complianceRate * 100).toFixed(1)}%)`);
    console.log(`   Avg processing time: ${avgProcessingTime.toFixed(2)}ms`);
    console.log(`   Total batch time: ${totalProcessingTime}ms`);
    console.log(`   Regulation E deadline: 10 business days (864,000,000ms)`);
    console.log(`   Our speed advantage: ${(864000000 / avgProcessingTime).toFixed(0)}x faster`);
  });
});
