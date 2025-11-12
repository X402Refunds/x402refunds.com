/**
 * Test cleanup helper for HTTP tests
 * Cleans up test data created during HTTP test runs
 */

import { API_BASE_URL } from './index';

/**
 * Global test run ID - shared across all tests in a run
 */
export const testRunId = Date.now();

/**
 * Track created test data for cleanup
 */
interface TestDataTracker {
  agents: string[]; // agent DIDs
  cases: string[]; // case IDs
  evidence: string[]; // evidence IDs
}

export const createdTestData: TestDataTracker = {
  agents: [],
  cases: [],
  evidence: [],
};

/**
 * Clean up test data created during tests
 * Call this in afterAll() hooks
 */
export async function cleanupTestData(testRunIdToClean: number = testRunId): Promise<void> {
  try {
    console.log(`\n🧹 Cleaning up test data from run ${testRunIdToClean}...`);
    
    // Call Convex cleanup function via HTTP
    // Note: This requires the testing.ts functions to be deployed
    const response = await fetch(`${API_BASE_URL}/testing/cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        testRunId: testRunIdToClean,
        dryRun: false,
      }),
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Cleanup complete: ${result.deleted || 0} items deleted`);
    } else {
      console.log(`⚠️  Cleanup endpoint not available (${response.status})`);
      console.log(`   Test data may need manual cleanup`);
    }
  } catch (error) {
    console.log(`⚠️  Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.log(`   Test data may need manual cleanup`);
  }
}

/**
 * Clean up test data by pattern matching (fallback when cleanup endpoint unavailable)
 * This calls the ConvexHttpClient directly
 */
export async function cleanupTestDataDirect(convexUrl: string): Promise<void> {
  try {
    const { ConvexHttpClient } = await import('convex/browser');
    const { api } = await import('../../convex/_generated/api.js');
    
    const client = new ConvexHttpClient(convexUrl);
    
    console.log(`\n🧹 Running direct cleanup on ${convexUrl}...`);
    
    // Run cleanup mutation
    const result = await client.mutation(api.testing.runTestCleanup, {
      dryRun: false,
    });
    
    console.log(`✅ Cleanup complete: ${result.deleted || 0} items deleted`);
  } catch (error) {
    console.log(`⚠️  Direct cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

