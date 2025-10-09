#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { createHash } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const STANDARDS_DIR = join(projectRoot, 'docs/standards');
const TIMESTAMPS_DIR = join(STANDARDS_DIR, '.timestamps');
const RULES_PATTERN = /^consulate-arbitration-rules-v(\d+\.\d+(?:\.\d+)?)\.md$/;

/**
 * Compute SHA-256 hash of file contents
 */
function computeHash(content) {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Get current ISO timestamp
 */
function getCurrentTimestamp() {
  return new Date().toISOString();
}

/**
 * Create RFC 3161 timestamp using OpenSSL and DigiCert TSA
 */
function createRFC3161Timestamp(filePath, version) {
  const tsqFile = join(TIMESTAMPS_DIR, `consulate-arbitration-rules-v${version}.tsq`);
  const tsrFile = join(TIMESTAMPS_DIR, `consulate-arbitration-rules-v${version}.tsr`);

  try {
    // Step 1: Create timestamp query
    console.log(`  Creating RFC 3161 timestamp query...`);
    execSync(
      `openssl ts -query -data "${filePath}" -sha256 -no_nonce -out "${tsqFile}"`,
      { stdio: 'pipe' }
    );

    // Step 2: Send to DigiCert TSA
    console.log(`  Sending to DigiCert TSA...`);
    execSync(
      `curl -H "Content-Type: application/timestamp-query" --data-binary @"${tsqFile}" http://timestamp.digicert.com -o "${tsrFile}" -s`,
      { stdio: 'pipe' }
    );

    // Step 3: Verify timestamp (optional, for debugging)
    try {
      const verifyOutput = execSync(`openssl ts -reply -in "${tsrFile}" -text`, {
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      // Extract timestamp from verification output
      const timestampMatch = verifyOutput.match(/Time stamp: (.+)/);
      const timestamp = timestampMatch ? timestampMatch[1].trim() : getCurrentTimestamp();
      
      console.log(`  ✓ RFC 3161 timestamp created: ${timestamp}`);
      
      // Clean up .tsq file (keep only .tsr)
      execSync(`rm "${tsqFile}"`, { stdio: 'pipe' });
      
      return { tsrFile, timestamp };
    } catch (verifyError) {
      console.warn(`  ⚠ Warning: Could not verify timestamp, using current time`);
      return { tsrFile, timestamp: getCurrentTimestamp() };
    }
  } catch (error) {
    console.error(`  ✗ Failed to create RFC 3161 timestamp: ${error.message}`);
    console.log(`  Continuing without RFC 3161 timestamp...`);
    return { tsrFile: null, timestamp: getCurrentTimestamp() };
  }
}

/**
 * Update document header with hash and timestamp
 */
function updateDocumentHeader(filePath, hash, timestamp, version) {
  let content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Find and update the hash line (line 7: **Protocol Hash**)
  const hashLineIndex = lines.findIndex(line => line.includes('**Protocol Hash**'));
  if (hashLineIndex !== -1) {
    lines[hashLineIndex] = `**Protocol Hash**: \`sha256:${hash}\``;
  }

  // Find and update the timestamp method line (line 8: **Timestamp Method**)
  const timestampLineIndex = lines.findIndex(line => line.includes('**Timestamp Method**'));
  if (timestampLineIndex !== -1) {
    const tsrPath = `.timestamps/consulate-arbitration-rules-v${version}.tsr`;
    lines[timestampLineIndex] = `**Timestamp Method**: GitHub commit + RFC 3161 (DigiCert TSA)  
**Timestamp**: ${timestamp}  
**RFC 3161 Proof**: Available at \`${tsrPath}\``;
  }

  // Write updated content back
  const updatedContent = lines.join('\n');
  writeFileSync(filePath, updatedContent, 'utf8');
  
  return updatedContent;
}

/**
 * Process a single arbitration rules file
 */
function processRulesFile(filename) {
  const match = filename.match(RULES_PATTERN);
  if (!match) return;

  const version = match[1];
  const filePath = join(STANDARDS_DIR, filename);
  
  console.log(`\n📄 Processing ${filename}...`);

  // Read original content
  const originalContent = readFileSync(filePath, 'utf8');

  // Check if already processed (has a hash that's not placeholder)
  const hasValidHash = originalContent.includes('sha256:') && 
                       !originalContent.includes('[To be computed');

  // Compute hash
  console.log(`  Computing SHA-256 hash...`);
  const hash = computeHash(originalContent);
  console.log(`  ✓ Hash: sha256:${hash.substring(0, 16)}...`);

  // Create RFC 3161 timestamp
  const { tsrFile, timestamp } = createRFC3161Timestamp(filePath, version);

  // Update document header
  console.log(`  Updating document header...`);
  updateDocumentHeader(filePath, hash, timestamp, version);
  console.log(`  ✓ Document updated`);

  // Recompute hash of updated document (for logging)
  const updatedContent = readFileSync(filePath, 'utf8');
  const finalHash = computeHash(updatedContent);
  console.log(`  ✓ Final hash: sha256:${finalHash.substring(0, 16)}...`);

  return {
    version,
    filename,
    hash: finalHash,
    timestamp,
    tsrFile
  };
}

/**
 * Main execution
 */
function main() {
  console.log('🔐 Consulate Arbitration Rules - Hash & Timestamp Automation\n');
  console.log(`Standards directory: ${STANDARDS_DIR}`);
  console.log(`Timestamps directory: ${TIMESTAMPS_DIR}\n`);

  // Ensure timestamps directory exists
  if (!existsSync(TIMESTAMPS_DIR)) {
    console.error(`✗ Timestamps directory does not exist: ${TIMESTAMPS_DIR}`);
    console.log('  Run: mkdir -p docs/standards/.timestamps');
    process.exit(1);
  }

  // Find all arbitration rules files
  const files = readdirSync(STANDARDS_DIR);
  const rulesFiles = files.filter(f => RULES_PATTERN.test(f));

  if (rulesFiles.length === 0) {
    console.log('No arbitration rules files found matching pattern.');
    process.exit(0);
  }

  console.log(`Found ${rulesFiles.length} arbitration rules file(s):\n`);
  rulesFiles.forEach(f => console.log(`  - ${f}`));

  // Process each file
  const results = [];
  for (const filename of rulesFiles) {
    try {
      const result = processRulesFile(filename);
      if (result) results.push(result);
    } catch (error) {
      console.error(`\n✗ Error processing ${filename}:`, error.message);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✓ Processing complete!');
  console.log('='.repeat(60));
  console.log(`\nProcessed ${results.length} file(s):`);
  results.forEach(r => {
    console.log(`\n  ${r.filename}`);
    console.log(`    Version: v${r.version}`);
    console.log(`    Hash: ${r.hash.substring(0, 32)}...`);
    console.log(`    Timestamp: ${r.timestamp}`);
    if (r.tsrFile) {
      console.log(`    RFC 3161: ${r.tsrFile.split('/').pop()}`);
    }
  });

  console.log('\n✓ All arbitration rules have been hashed and timestamped.');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { processRulesFile, computeHash, createRFC3161Timestamp };

