#!/usr/bin/env node

/**
 * Fully Automatic Architecture Update System
 * Updates ALL cursor rules, configs, and docs automatically when architecture changes
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { parse } from 'yaml';
import { join, extname } from 'path';

const ARCHITECTURE_MAP = '.architecture/map.yaml';

function loadArchitectureMap() {
  try {
    const content = readFileSync(ARCHITECTURE_MAP, 'utf8');
    return parse(content);
  } catch (error) {
    console.error('❌ Failed to load architecture map:', error.message);
    process.exit(1);
  }
}

function findAllFiles(dirs, extensions) {
  const files = [];
  
  for (const dir of dirs) {
    try {
      const items = readdirSync(dir);
      
      for (const item of items) {
        const fullPath = join(dir, item);
        
        try {
          const stat = statSync(fullPath);
          
          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            files.push(...findAllFiles([fullPath], extensions));
          } else if (stat.isFile() && extensions.includes(extname(item))) {
            files.push(fullPath);
          }
        } catch (error) {
          // Skip files/dirs that can't be accessed
        }
      }
    } catch (error) {
      // Skip directories that don't exist
    }
  }
  
  return files;
}

function createReplacementMap(map) {
  const replacements = new Map();
  
  // Add location replacements
  if (map.deprecated?.locations) {
    for (const deprecated of map.deprecated.locations) {
      const current = findCurrentLocationFor(deprecated, map);
      if (current) {
        replacements.set(deprecated, current);
      }
    }
  }
  
  // Add command replacements  
  if (map.deprecated?.commands) {
    for (const deprecated of map.deprecated.commands) {
      const current = findCurrentCommandFor(deprecated, map);
      if (current) {
        replacements.set(deprecated, current);
      }
    }
  }
  
  // Add pattern replacements
  if (map.deprecated?.patterns) {
    for (const deprecated of map.deprecated.patterns) {
      const current = findCurrentPatternFor(deprecated, map);
      if (current) {
        replacements.set(deprecated, current);
      }
    }
  }
  
  return replacements;
}

function findCurrentLocationFor(deprecated, map) {
  const locationMap = {
    'apps/convex/': map.current.locations.backend,
    'apps/': map.current.locations.root_config,
    'packages/': null, // No replacement - packages were removed
    'infra/': null // No replacement - infra was removed
  };
  
  return locationMap[deprecated] || null;
}

function findCurrentCommandFor(deprecated, map) {
  const commandMap = {
    'cd apps && pnpm dev': map.current.commands.dev,
    'cd apps && pnpm deploy': map.current.commands.deploy,
    'cd apps && npx convex deploy': map.current.commands.convex_deploy
  };
  
  return commandMap[deprecated] || null;
}

function findCurrentPatternFor(deprecated, map) {
  const patternMap = {
    'apps/convex/*.ts': map.current.patterns.backend_files,
    'packages/sdk-js': null, // Removed
    'apps/package.json': map.current.patterns.config_files
  };
  
  return patternMap[deprecated] || null;
}

function updateFileContent(filePath, content, replacements) {
  let updatedContent = content;
  let changeCount = 0;
  
  // Skip auto-generated files - they'll be regenerated
  if (content.includes('generated: true') || content.includes('auto-generated')) {
    return { content: updatedContent, changeCount };
  }
  
  // Apply all replacements
  for (const [oldValue, newValue] of replacements.entries()) {
    if (newValue && updatedContent.includes(oldValue)) {
      const beforeCount = (updatedContent.match(new RegExp(escapeRegExp(oldValue), 'g')) || []).length;
      updatedContent = updatedContent.replace(new RegExp(escapeRegExp(oldValue), 'g'), newValue);
      const afterCount = (updatedContent.match(new RegExp(escapeRegExp(oldValue), 'g')) || []).length;
      changeCount += beforeCount - afterCount;
    }
  }
  
  return { content: updatedContent, changeCount };
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function shouldUpdateFile(filePath) {
  // Update these file types
  const updatableExtensions = ['.md', '.mdc', '.yml', '.yaml', '.js', '.ts', '.json'];
  const ext = extname(filePath);
  
  if (!updatableExtensions.includes(ext)) {
    return false;
  }
  
  // Skip certain directories/files
  const skipPatterns = [
    'node_modules/',
    '.git/',
    '_generated/',
    'pnpm-lock.yaml',
    'package-lock.json'
  ];
  
  return !skipPatterns.some(pattern => filePath.includes(pattern));
}

function updateAllFiles(map) {
  console.log('🔄 Auto-updating all architecture references...\n');
  
  // Find all updatable files
  const searchDirs = ['.cursor', '.github', 'scripts', '.'];
  const extensions = ['.md', '.mdc', '.yml', '.yaml', '.js', '.ts', '.json'];
  const allFiles = findAllFiles(searchDirs, extensions);
  
  // Create replacement map
  const replacements = createReplacementMap(map);
  
  if (replacements.size === 0) {
    console.log('ℹ️  No deprecated patterns found - nothing to update');
    return { updatedFiles: 0, totalChanges: 0 };
  }
  
  console.log('📋 Replacement map:');
  for (const [old, current] of replacements.entries()) {
    if (current) {
      console.log(`   "${old}" → "${current}"`);
    } else {
      console.log(`   "${old}" → (removed)`);
    }
  }
  console.log('');
  
  let updatedFiles = 0;
  let totalChanges = 0;
  
  // Update each file
  for (const filePath of allFiles) {
    if (!shouldUpdateFile(filePath)) {
      continue;
    }
    
    try {
      const content = readFileSync(filePath, 'utf8');
      const { content: updatedContent, changeCount } = updateFileContent(filePath, content, replacements);
      
      if (changeCount > 0) {
        writeFileSync(filePath, updatedContent);
        console.log(`✅ ${filePath} (${changeCount} changes)`);
        updatedFiles++;
        totalChanges += changeCount;
      }
    } catch (error) {
      console.log(`⚠️  Skipped ${filePath}: ${error.message}`);
    }
  }
  
  return { updatedFiles, totalChanges };
}

async function main() {
  console.log('🤖 FULLY AUTOMATIC ARCHITECTURE UPDATE');
  console.log('=====================================\n');
  
  const map = loadArchitectureMap();
  
  // Update all files automatically
  const { updatedFiles, totalChanges } = updateAllFiles(map);
  
  console.log('\n🏗️  Regenerating auto-generated cursor rules...');
  
  // Regenerate auto-generated rules
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    await execAsync('node scripts/arch-generate-rules.js');
    console.log('✅ Auto-generated rules updated');
  } catch (error) {
    console.error('❌ Failed to regenerate rules:', error.message);
  }
  
  console.log('\n🎉 AUTOMATIC UPDATE COMPLETE!');
  console.log(`📊 Summary:`);
  console.log(`   - Files updated: ${updatedFiles}`);
  console.log(`   - Total changes: ${totalChanges}`);
  console.log(`   - Architecture version: ${map.version}`);
  
  if (updatedFiles === 0) {
    console.log('\n💡 All files are already up to date!');
  } else {
    console.log('\n✨ All architecture references are now consistent!');
  }
}

// Support both ES modules and CommonJS
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { updateAllFiles, createReplacementMap };
