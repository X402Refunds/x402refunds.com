#!/usr/bin/env node
/**
 * Dev Test Data Cleanup
 * DEV ENVIRONMENT: youthful-orca-358
 * 
 * Run with: node scripts/cleanup-dev.js [--dry-run]
 */

import { cleanupTestData } from "./cleanup-test-data.js";

const DEV_URL = "https://youthful-orca-358.convex.cloud";

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  console.log('🔧 DEV ENVIRONMENT CLEANUP');
  console.log('   Environment: youthful-orca-358 (DEV)');
  console.log('   URL: https://youthful-orca-358.convex.cloud\n');
  
  if (!dryRun) {
    console.log('⏳ Starting cleanup in 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  try {
    const result = await cleanupTestData(DEV_URL, {
      dryRun,
      verbose: true
    });
    
    if (dryRun) {
      console.log('\n💡 To actually delete, run: node scripts/cleanup-dev.js');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

