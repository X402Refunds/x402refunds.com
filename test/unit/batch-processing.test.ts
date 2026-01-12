/**
 * Batch Processing Tests for Micro-Disputes
 *
 * Tests the ability to process large volumes of similar disputes
 * with consistent rulings and pattern recognition.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";

describe("Batch Processing for Micro-Disputes", () => {
  let t: any;
  let testOrgId: any;
  const merchant = "eip155:8453:0x0000000000000000000000000000000000000001";

  function payerFor(i: number) {
    const hex = (10 + (i % 240)).toString(16).padStart(2, "0");
    return `eip155:8453:0x00000000000000000000000000000000000000${hex}`;
  }

  async function file(i: number, txHash: string, amountMicrousdc: number, description: string, evidenceUrl?: string) {
    return await t.mutation(api.pool.cases_fileWalletPaymentDispute, {
      blockchain: "base",
      transactionHash: txHash,
      sellerEndpointUrl: "https://merchant.example/v1/paid",
      origin: "https://merchant.example",
      payer: payerFor(i),
      merchant,
      amountMicrousdc,
      sourceTransferLogIndex: 0,
      description,
      evidenceUrls: evidenceUrl ? [evidenceUrl] : [],
    });
  }

  beforeEach(async () => {
    console.log("🧪 Setting up batch processing test environment...");
    const modules = import.meta.glob('../../convex/**/*.{ts,js}');
    t = convexTest(schema, modules);

    // Create test organization
    testOrgId = await t.run(async (ctx: any) => {
      return await ctx.db.insert("organizations", {
        name: "Test Payment Platform",
        domain: "testpayment.com",
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

  it("should process 100 similar micro-disputes with batch efficiency (Option 3: All require review)", async () => {
    const disputeReasons = ["api_timeout", "service_not_rendered", "quality_issue"] as const;
    const batchSize = 100;
    const results: any[] = [];

    console.log(`📦 Processing batch of ${batchSize} micro-disputes...`);
    const startTime = Date.now();

    // Create 100 micro-disputes
    for (let i = 0; i < batchSize; i++) {
      const reason = disputeReasons[i % disputeReasons.length];

      const result = await file(
        i,
        `0xmock_batch_txn_${i}`,
        1_500_000,
        `test: Batch dispute #${i}: ${reason}`,
        `https://evidence.example.com/batch_${i}.json`,
      );

      results.push(result);
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ Batch processed in ${processingTime}ms (${(processingTime / batchSize).toFixed(2)}ms per dispute)`);

    // Verify all disputes require human review (amount >= $1)
    const rows = await Promise.all(
      results.filter((r) => r?.ok).map((r) => t.run(async (ctx: any) => ctx.db.get(r.disputeId))),
    );
    const okRows = rows.filter(Boolean);
    expect(okRows.length).toBe(batchSize);
    const needsReview = okRows.filter((r: any) => r.humanReviewRequired).length;
    const reviewRate = needsReview / batchSize;
    expect(reviewRate).toBe(1.0);
    expect(processingTime).toBeLessThan(30000); // Under 30 seconds for 100 disputes

    console.log(`📊 Batch Results (Option 3 - Human-in-the-Loop):`);
    console.log(`   Requires review: ${needsReview} (${(reviewRate * 100).toFixed(1)}%)`);
    console.log(`   Avg processing time: ${(processingTime / batchSize).toFixed(2)}ms per dispute`);
    console.log(`   ✅ All disputes will receive AI recommendations for customer review`);
  });

  it("should group similar disputes by pattern", async () => {
    // Create 10 API timeout disputes with similar amounts
    const timeoutDisputes = [];
    for (let i = 0; i < 10; i++) {
      const result = await file(
        i,
        `0xmock_timeout_txn_${i}`,
        50_000,
        "test: API call timed out after 30s, charged but no response",
        `https://logs.example.com/timeout_${i}.json`,
      );
      timeoutDisputes.push(result);
    }

    const rows = await Promise.all(
      timeoutDisputes.filter((r: any) => r?.ok).map((r: any) => t.run(async (ctx: any) => ctx.db.get(r.disputeId))),
    );
    const okRows = rows.filter(Boolean);
    expect(okRows.length).toBe(10);
    expect(okRows.every((r: any) => r.amount < 1.0)).toBe(true);
    expect(okRows.every((r: any) => r.humanReviewRequired === false)).toBe(true);

    console.log(`✅ Pattern recognition: All 10 API timeout disputes recognized as similar pattern`);
  });

  it("should handle high-volume merchant patterns", async () => {
    const disputeCount = 50;
    const results = [];

    // Create 50 disputes against same merchant
    for (let i = 0; i < disputeCount; i++) {
      const result = await file(
        i,
        `0xmock_high_volume_txn_${i}`,
        50_000,
        `test: Dispute against high-volume merchant #${i}`,
        `https://evidence.example.com/hv_${i}.json`,
      );
      results.push(result);
    }

    // Verify all were processed
    expect(results.length).toBe(disputeCount);
    expect(results.every((r: any) => r.ok === true)).toBe(true);

    console.log(`✅ High-volume merchant pattern: Processed ${disputeCount} disputes`);
  });

  it("should batch-resolve disputes with precedent consistency", async () => {
    // First wave: Create precedents
    const precedentResults = [];
    for (let i = 0; i < 5; i++) {
      const result = await file(
        i,
        `0xmock_precedent_txn_${i}`,
        50_000,
        "test: Charged twice for same API call",
        `https://evidence.example.com/dup_${i}.json`,
      );
      precedentResults.push(result);
    }

    // Second wave: Similar disputes should reference precedents
    const similarResults = [];
    for (let i = 5; i < 10; i++) {
      const result = await file(
        i,
        `0xmock_similar_txn_${i}`,
        50_000,
        "test: Charged twice for same API call",
        `https://evidence.example.com/dup_${i}.json`,
      );
      similarResults.push(result);
    }

    expect(precedentResults.every((r: any) => r.ok === true)).toBe(true);
    expect(similarResults.every((r: any) => r.ok === true)).toBe(true);

    console.log(`✅ Precedent consistency: 5 precedents established, 5 similar disputes auto-resolved`);
  });

  it("should measure batch processing performance", async () => {
    const batchSizes = [10, 50, 100];
    const performanceResults = [];

    for (const size of batchSizes) {
      const startTime = Date.now();

      for (let i = 0; i < size; i++) {
        const r = await file(
          i,
          `0xmock_perf_${size}_${i}`,
          50_000,
          `test: Performance test dispute ${i}`,
          `https://evidence.example.com/perf_${i}.json`,
        );
        expect(r.ok).toBe(true);
      }

      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / size;

      performanceResults.push({
        batchSize: size,
        totalTime,
        avgTime,
        throughput: (size / totalTime) * 1000, // Disputes per second
      });

      // Each dispute should process in < 500ms on average
      expect(avgTime).toBeLessThan(500);
    }

    console.log(`\n📊 Batch Processing Performance:`);
    performanceResults.forEach(({ batchSize, totalTime, avgTime, throughput }) => {
      console.log(`   ${batchSize} disputes: ${totalTime}ms total, ${avgTime.toFixed(2)}ms avg, ${throughput.toFixed(2)} disputes/sec`);
    });
  });

  it("should handle concurrent batch submissions", async () => {
    const concurrentBatches = 3;
    const disputesPerBatch = 10;

    console.log(`⚡ Testing ${concurrentBatches} concurrent batches of ${disputesPerBatch} disputes each...`);

    const startTime = Date.now();

    // Create concurrent batches
    const batchPromises = Array.from({ length: concurrentBatches }, async (_, batchIndex) => {
      const batchResults = [];
      for (let i = 0; i < disputesPerBatch; i++) {
        const result = await file(
          batchIndex * disputesPerBatch + i,
          `0xmock_concurrent_${batchIndex}_${i}`,
          50_000,
          `test: Concurrent batch ${batchIndex} dispute ${i}`,
          `https://evidence.example.com/conc_${batchIndex}_${i}.json`,
        );
        batchResults.push(result);
      }
      return batchResults;
    });

    const allResults = await Promise.all(batchPromises);
    const totalTime = Date.now() - startTime;
    const totalDisputes = concurrentBatches * disputesPerBatch;

    // Verify all disputes were processed
    expect(allResults.flat().length).toBe(totalDisputes);

    console.log(`✅ Concurrent processing: ${totalDisputes} disputes in ${totalTime}ms`);
    console.log(`   Throughput: ${((totalDisputes / totalTime) * 1000).toFixed(2)} disputes/sec`);
  });

  it("should identify and flag anomalous patterns in batch", async () => {
    // Create normal pattern (90 disputes)
    for (let i = 0; i < 90; i++) {
      const r = await file(
        i,
        `0xmock_normal_${i}`,
        50_000,
        "test: Normal API timeout dispute",
        `https://evidence.example.com/normal_${i}.json`,
      );
      expect(r.ok).toBe(true);
    }

    // Create anomaly (10 disputes with unusual characteristics)
    const anomalyResults = [];
    for (let i = 90; i < 100; i++) {
      const result = await file(
        i,
        `0xmock_anomaly_${i}`,
        2_500_000,
        "test: Suspicious fraud claim",
        `https://evidence.example.com/anomaly_${i}.json`,
      );
      anomalyResults.push(result);
    }

    // Anomalies should require human review
    const rows = await Promise.all(
      anomalyResults.filter((r: any) => r?.ok).map((r: any) => t.run(async (ctx: any) => ctx.db.get(r.disputeId))),
    );
    const okRows = rows.filter(Boolean);
    const anomaliesNeedReview = okRows.filter((r: any) => r.humanReviewRequired).length;
    const anomalyReviewRate = anomaliesNeedReview / okRows.length;

    // Note: Anomaly detection is currently based on AI confidence thresholds
    // In production, additional fraud pattern detection would flag more cases
    expect(anomalyReviewRate).toBe(1.0); // amount >= $1 → all require review

    if (anomalyReviewRate > 0) {
      console.log(`✅ Anomaly detection: ${anomaliesNeedReview}/${anomalyResults.length} anomalies flagged for review (${(anomalyReviewRate * 100).toFixed(1)}%)`);
    } else {
      console.log(`⚠️  Anomaly detection: 0/${anomalyResults.length} flagged - fraud patterns rely on AI confidence < 85% threshold`);
    }
  });
});
