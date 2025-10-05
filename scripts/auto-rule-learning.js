#!/usr/bin/env node
/**
 * Auto Rule Learning from Git History
 * 
 * Analyzes commit messages and PR comments for user corrections,
 * then automatically updates rules using LLM.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEARNING_LOG = path.join(__dirname, '../.cursor/learning-log.json');

/**
 * Extract corrections from git history
 */
function extractCorrectionsFromGit(days = 7) {
  console.log(`🔍 Scanning last ${days} days of git history...\n`);

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  
  // Get commit messages
  const commits = execSync(
    `git log --since="${since}" --pretty=format:"%H|%s|%b"`,
    { encoding: 'utf-8' }
  ).split('\n').filter(Boolean);

  const corrections = [];
  
  // Patterns that indicate corrections
  const correctionPatterns = [
    /stop (doing|creating|generating|adding)/i,
    /don't (do|create|generate|add)/i,
    /never (do|create|generate|add)/i,
    /always (do|use|follow|check)/i,
    /fix.*wrong/i,
    /correct.*mistake/i,
    /should.*instead/i,
    /revert.*because/i
  ];

  for (const commit of commits) {
    const [hash, subject, body] = commit.split('|');
    const fullMessage = `${subject} ${body}`;

    for (const pattern of correctionPatterns) {
      if (pattern.test(fullMessage)) {
        corrections.push({
          hash: hash.substring(0, 7),
          message: fullMessage,
          timestamp: new Date().toISOString()
        });
        break;
      }
    }
  }

  return corrections;
}

/**
 * Main learning pipeline
 */
async function main() {
  const corrections = extractCorrectionsFromGit(7);

  if (corrections.length === 0) {
    console.log('✅ No corrections found in recent commits');
    return;
  }

  console.log(`📚 Found ${corrections.length} potential corrections:\n`);

  for (const correction of corrections) {
    console.log(`📝 [${correction.hash}] ${correction.message.substring(0, 100)}...`);
  }

  console.log('\n🤖 Processing corrections with LLM...\n');

  // Load existing log
  let log = { corrections: [], updates: [] };
  if (fs.existsSync(LEARNING_LOG)) {
    log = JSON.parse(fs.readFileSync(LEARNING_LOG, 'utf-8'));
  }

  // Check which corrections are new
  const existingHashes = new Set(log.corrections.map(c => c.hash));
  const newCorrections = corrections.filter(c => !existingHashes.has(c.hash));

  if (newCorrections.length === 0) {
    console.log('✅ All corrections already processed');
    return;
  }

  console.log(`🆕 ${newCorrections.length} new corrections to process\n`);

  // TODO: Call llm-rule-manager.js for each correction
  // For now, just log them
  for (const correction of newCorrections) {
    log.corrections.push(correction);
    
    console.log(`💡 Suggestion: Run manually:`);
    console.log(`   pnpm rules:llm-learn "${correction.message}"\n`);
  }

  // Save updated log
  fs.writeFileSync(LEARNING_LOG, JSON.stringify(log, null, 2));

  console.log('📊 Learning log updated');
  console.log(`   Total corrections tracked: ${log.corrections.length}`);
}

main().catch(console.error);
