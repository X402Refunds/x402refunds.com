#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const STANDARDS_DIR = join(projectRoot, 'docs/standards');

/**
 * Prompt user for input
 */
function prompt(question) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Parse version string (e.g., "1.0" or "1.0.1")
 */
function parseVersion(versionStr) {
  const parts = versionStr.split('.').map(Number);
  return {
    major: parts[0] || 1,
    minor: parts[1] || 0,
    patch: parts[2] || 0
  };
}

/**
 * Increment version based on type
 */
function incrementVersion(version, type) {
  switch (type) {
    case 'major':
      return { major: version.major + 1, minor: 0, patch: 0 };
    case 'minor':
      return { major: version.major, minor: version.minor + 1, patch: 0 };
    case 'patch':
      return { major: version.major, minor: version.minor, patch: version.patch + 1 };
    default:
      throw new Error(`Invalid version type: ${type}`);
  }
}

/**
 * Format version object to string
 */
function formatVersion(version, includePatch = true) {
  if (includePatch || version.patch !== 0) {
    return `${version.major}.${version.minor}.${version.patch}`;
  }
  return `${version.major}.${version.minor}`;
}

/**
 * Find current version of arbitration rules
 */
function findCurrentVersion() {
  // Look for the highest version number
  const pattern = /^consulate-arbitration-rules-v(\d+\.\d+(?:\.\d+)?)\.md$/;
  const fs = require('fs');
  const files = fs.readdirSync(STANDARDS_DIR);
  
  let highestVersion = { major: 1, minor: 0, patch: 0 };
  let currentFile = null;

  for (const file of files) {
    const match = file.match(pattern);
    if (match) {
      const version = parseVersion(match[1]);
      if (
        version.major > highestVersion.major ||
        (version.major === highestVersion.major && version.minor > highestVersion.minor) ||
        (version.major === highestVersion.major && version.minor === highestVersion.minor && version.patch > highestVersion.patch)
      ) {
        highestVersion = version;
        currentFile = file;
      }
    }
  }

  return { version: highestVersion, file: currentFile };
}

/**
 * Update version-specific content in document
 */
function updateDocumentVersion(content, oldVersion, newVersion, newDate) {
  let lines = content.split('\n');

  // Update line 3: Effective Date
  const effectiveDateIndex = lines.findIndex(line => line.startsWith('**Effective Date**'));
  if (effectiveDateIndex !== -1) {
    lines[effectiveDateIndex] = `**Effective Date**: ${newDate}`;
  }

  // Update line 4: Version
  const versionIndex = lines.findIndex(line => line.startsWith('**Version**'));
  if (versionIndex !== -1) {
    lines[versionIndex] = `**Version**: ${newVersion}`;
  }

  // Clear hash and timestamp (lines 7-8)
  const hashIndex = lines.findIndex(line => line.includes('**Protocol Hash**'));
  if (hashIndex !== -1) {
    lines[hashIndex] = `**Protocol Hash**: \`[To be computed after final publication]\``;
  }

  const timestampIndex = lines.findIndex(line => line.includes('**Timestamp Method**'));
  if (timestampIndex !== -1) {
    // Remove any additional timestamp lines
    while (timestampIndex + 1 < lines.length && 
           (lines[timestampIndex + 1].startsWith('**Timestamp:**') || 
            lines[timestampIndex + 1].startsWith('**RFC 3161 Proof:**'))) {
      lines.splice(timestampIndex + 1, 1);
    }
    lines[timestampIndex] = `**Timestamp Method**: GitHub commit + RFC 3161 (DigiCert TSA)`;
  }

  // Add to version history table (find the table and add new row)
  const versionHistoryIndex = lines.findIndex(line => line.includes('## Version History'));
  if (versionHistoryIndex !== -1) {
    // Find the table (should be a few lines after the header)
    let tableIndex = versionHistoryIndex;
    while (tableIndex < lines.length && !lines[tableIndex].startsWith('||')) {
      tableIndex++;
    }
    
    if (tableIndex < lines.length) {
      // Table found, add new row after header row
      const newRow = `|| ${newVersion} | ${newDate} | Version ${newVersion} release | Consulate Standards Committee |`;
      lines.splice(tableIndex + 1, 0, newRow);
    }
  }

  return lines.join('\n');
}

/**
 * Main execution
 */
async function main() {
  console.log('📋 Consulate Arbitration Rules - Version Management\n');

  // Find current version
  const { version: currentVersion, file: currentFile } = findCurrentVersion();
  
  if (!currentFile) {
    console.error('✗ No current arbitration rules file found.');
    console.log('  Expected file matching: consulate-arbitration-rules-v*.md');
    process.exit(1);
  }

  const currentVersionStr = formatVersion(currentVersion, currentVersion.patch !== 0);
  console.log(`Current version: v${currentVersionStr}`);
  console.log(`Current file: ${currentFile}\n`);

  // Prompt for version type
  console.log('What type of version increment?');
  console.log('  1) Major (v2.0) - Breaking changes');
  console.log('  2) Minor (v1.1) - New features, backward compatible');
  console.log('  3) Patch (v1.0.1) - Bug fixes, minor corrections');
  console.log('');

  const choice = await prompt('Enter choice (1/2/3): ');
  
  let versionType;
  switch (choice) {
    case '1':
      versionType = 'major';
      break;
    case '2':
      versionType = 'minor';
      break;
    case '3':
      versionType = 'patch';
      break;
    default:
      console.error('✗ Invalid choice. Exiting.');
      process.exit(1);
  }

  // Calculate new version
  const newVersion = incrementVersion(currentVersion, versionType);
  const newVersionStr = formatVersion(newVersion, newVersion.patch !== 0);
  
  console.log(`\n→ New version will be: v${newVersionStr}`);

  // Confirm
  const confirm = await prompt('\nProceed with creating new version? (y/n): ');
  if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
    console.log('Cancelled.');
    process.exit(0);
  }

  // Create new file
  const newFilename = `consulate-arbitration-rules-v${newVersionStr}.md`;
  const newFilePath = join(STANDARDS_DIR, newFilename);

  if (existsSync(newFilePath)) {
    console.error(`\n✗ File already exists: ${newFilename}`);
    process.exit(1);
  }

  console.log(`\n📄 Creating new version file...`);

  // Copy current file
  const currentFilePath = join(STANDARDS_DIR, currentFile);
  copyFileSync(currentFilePath, newFilePath);
  console.log(`  ✓ Copied ${currentFile} → ${newFilename}`);

  // Read new file content
  const content = readFileSync(newFilePath, 'utf8');

  // Update version-specific content
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const updatedContent = updateDocumentVersion(content, currentVersionStr, newVersionStr, today);

  // Write updated content
  writeFileSync(newFilePath, updatedContent, 'utf8');
  console.log(`  ✓ Updated version references in document`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✓ New version created successfully!');
  console.log('='.repeat(60));
  console.log(`\nFile: ${newFilename}`);
  console.log(`Version: v${newVersionStr}`);
  console.log(`Date: ${today}`);
  console.log('\nNext steps:');
  console.log('  1. Review the new file and make any necessary changes');
  console.log('  2. Run `git add docs/standards/${newFilename}`');
  console.log('  3. Commit the changes - the pre-commit hook will automatically:');
  console.log('     - Compute SHA-256 hash');
  console.log('     - Create RFC 3161 timestamp');
  console.log('     - Update the document header');
  console.log('\n✓ Done!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('✗ Error:', error.message);
    process.exit(1);
  });
}

export { incrementVersion, parseVersion, formatVersion, findCurrentVersion };

