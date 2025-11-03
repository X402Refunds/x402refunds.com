#!/usr/bin/env node

/**
 * Git Hooks Installer
 * 
 * Automatically installs git hooks that keep the codebase context up-to-date.
 * This runs via postinstall script to ensure hooks are always present.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = process.cwd();
const HOOKS_DIR = path.join(ROOT_DIR, '.git/hooks');

// Define hooks
const HOOKS = {
  'pre-commit': `#!/bin/bash
# Pre-commit checks: lint (including warnings) and context updates

echo "🔍 Running pre-commit checks..."

# Run linting (will fail on warnings due to --max-warnings=0 in package.json)
echo "📋 Checking for lint errors and warnings..."
if ! pnpm lint; then
  echo ""
  echo "❌ Lint check failed!"
  echo "   Please fix all lint warnings before committing."
  echo "   Run 'pnpm lint' to see details."
  exit 1
fi
echo "✅ Lint passed (no errors or warnings)"

echo ""
echo "📊 Updating codebase context..."

# Generate context graph
if node scripts/generate-context-graph.js; then
  # Add the generated context file to this commit
  git add .cursor/rules/codebase-context.mdc
  echo "✅ Context updated and staged"
else
  echo "⚠️  Context generation failed (continuing commit)"
fi

# Check if arbitration rules files are being committed
if git diff --cached --name-only | grep -q "docs/standards/consulate-arbitration-rules-v.*\\.md"; then
  echo ""
  echo "🔐 Hashing and timestamping arbitration rules..."
  
  # Run hash and timestamp script
  if node scripts/hash-and-timestamp-rules.js; then
    # Stage updated files (with hash/timestamp)
    git add docs/standards/consulate-arbitration-rules-v*.md
    git add docs/standards/.timestamps/*.tsr 2>/dev/null || true
    echo "✅ Arbitration rules hashed and timestamped"
  else
    echo "⚠️  Hashing/timestamping failed (continuing commit)"
  fi
fi
`,

  'post-merge': `#!/bin/bash
# Regenerate context after pulling changes

echo "🔄 Regenerating codebase context after merge..."

# Generate context graph
if node scripts/generate-context-graph.js; then
  echo "✅ Context regenerated"
else
  echo "⚠️  Context regeneration failed"
fi
`,

  'post-checkout': `#!/bin/bash
# Regenerate context after checkout (branch switching)

# Only run if we're switching branches (not individual files)
if [ "$3" = "1" ]; then
  echo "🔄 Regenerating codebase context after branch switch..."
  
  if node scripts/generate-context-graph.js; then
    echo "✅ Context regenerated"
  else
    echo "⚠️  Context regeneration failed"
  fi
fi
`
};

/**
 * Install a git hook
 */
function installHook(hookName, hookContent) {
  const hookPath = path.join(HOOKS_DIR, hookName);
  
  try {
    // Write hook file
    fs.writeFileSync(hookPath, hookContent, 'utf-8');
    
    // Make executable (Unix systems)
    try {
      fs.chmodSync(hookPath, '755');
    } catch (e) {
      // Windows doesn't need chmod
    }
    
    console.log(`✅ Installed ${hookName} hook`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to install ${hookName}:`, error.message);
    return false;
  }
}

/**
 * Check if .git directory exists
 */
function gitExists() {
  return fs.existsSync(path.join(ROOT_DIR, '.git'));
}

/**
 * Main execution
 */
function main() {
  console.log('🔧 Installing git hooks for auto-context generation...\n');
  
  // Check if we're in a git repository
  if (!gitExists()) {
    console.log('⚠️  Not a git repository - skipping hook installation');
    console.log('   (This is normal for npm package installs)');
    return;
  }
  
  // Ensure hooks directory exists
  if (!fs.existsSync(HOOKS_DIR)) {
    fs.mkdirSync(HOOKS_DIR, { recursive: true });
  }
  
  // Install each hook
  let installedCount = 0;
  for (const [hookName, hookContent] of Object.entries(HOOKS)) {
    if (installHook(hookName, hookContent)) {
      installedCount++;
    }
  }
  
  console.log(`\n✨ Installed ${installedCount}/${Object.keys(HOOKS).length} git hooks`);
  console.log('\nHooks will automatically:');
  console.log('  • Update context on every commit');
  console.log('  • Regenerate context after pulls/merges');
  console.log('  • Keep context fresh on branch switching');
  console.log('\nContext file: .cursor/rules/codebase-context.mdc');
}

// Run if called directly (ES module check)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { installHook, main };
