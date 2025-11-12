#!/usr/bin/env node
/**
 * Production Test Data Cleanup
 * PRODUCTION ENVIRONMENT: perceptive-lyrebird-89
 * 
 * Run with: node scripts/cleanup-production.js [--dry-run]
 */

import { cleanupTestData } from "./cleanup-test-data.js";

const PRODUCTION_URL = "https://perceptive-lyrebird-89.convex.cloud";

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  console.log('⚠️  PRODUCTION CLEANUP');
  console.log('   Environment: perceptive-lyrebird-89 (PRODUCTION)');
  console.log('   URL: https://perceptive-lyrebird-89.convex.cloud\n');
  
  if (!dryRun) {
    console.log('🚨 WARNING: This will DELETE test data from PRODUCTION!');
    console.log('   Press Ctrl+C within 5 seconds to cancel...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  try {
    const result = await cleanupTestData(PRODUCTION_URL, {
      dryRun,
      verbose: true
    });
    
    if (dryRun) {
      console.log('\n💡 To actually delete, run: node scripts/cleanup-production.js');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

