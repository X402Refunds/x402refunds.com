#!/usr/bin/env node

/**
 * Architecture Impact Analysis Tool
 * Shows what files would be affected by an architecture change
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { parse } from 'yaml';
import { join, extname } from 'path';
import { glob } from 'glob';

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

function analyzeImpact(change, map) {
  const [component, oldValue, newValue] = change.split(':');
  
  if (!component) {
    return {
      error: 'Invalid change format. Use: component:old_value:new_value'
    };
  }

  // Get dependency graph for this component
  const dependencies = map.dependency_graph[component] || { affects: [] };
  
  const impact = {
    component,
    oldValue,
    newValue,
    description: dependencies.description || 'No description available',
    affectedFiles: dependencies.affects || [],
    estimatedFiles: 0,
    searchResults: []
  };

  // If we have old and new values, search for actual references
  if (oldValue && newValue) {
    impact.searchResults = searchForReferences(oldValue);
    impact.estimatedFiles = impact.searchResults.length;
  }

  return impact;
}

function searchForReferences(pattern) {
  const results = [];
  const searchDirs = ['.cursor', '.github', 'scripts'];
  const fileExtensions = ['.md', '.mdc', '.yml', '.yaml', '.js', '.ts', '.json'];
  
  for (const dir of searchDirs) {
    try {
      const files = findFilesRecursively(dir, fileExtensions);
      
      for (const file of files) {
        try {
          const content = readFileSync(file, 'utf8');
          if (content.includes(pattern)) {
            const lines = content.split('\n');
            const matchingLines = lines
              .map((line, index) => ({ line: line.trim(), number: index + 1 }))
              .filter(({ line }) => line.includes(pattern));
            
            results.push({
              file,
              matches: matchingLines.length,
              lines: matchingLines.slice(0, 3) // Show first 3 matches
            });
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
    } catch (error) {
      // Skip directories that don't exist
    }
  }
  
  return results;
}

function findFilesRecursively(dir, extensions) {
  const files = [];
  
  try {
    const items = readdirSync(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files.push(...findFilesRecursively(fullPath, extensions));
      } else if (stat.isFile() && extensions.includes(extname(item))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read
  }
  
  return files;
}

function generateUpdateScript(impact) {
  if (!impact.oldValue || !impact.newValue) {
    return null;
  }

  const script = `#!/bin/bash
# Auto-generated update script for ${impact.component}
# Changes: ${impact.oldValue} → ${impact.newValue}

set -e

echo "🔄 Updating ${impact.component}..."
echo "   From: ${impact.oldValue}"
echo "   To: ${impact.newValue}"
echo ""

# Update affected files
${impact.searchResults.map(result => 
  `echo "📝 Updating ${result.file}..."
sed -i.bak 's|${impact.oldValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${impact.newValue}|g' "${result.file}"
rm "${result.file}.bak"
`).join('')}

echo "✅ Architecture update completed!"
echo "📊 Updated ${impact.estimatedFiles} files"

# Regenerate cursor rules
echo "🤖 Regenerating cursor rules..."
node scripts/arch-generate-rules.js

echo "🎉 All done! Architecture change applied successfully."
`;

  return script;
}

function formatImpactReport(impact) {
  let output = `🔍 ARCHITECTURE IMPACT ANALYSIS

📊 Component: ${impact.component}
📝 Change: ${impact.oldValue || 'N/A'} → ${impact.newValue || 'N/A'}
📖 Description: ${impact.description}

`;

  if (impact.affectedFiles.length > 0) {
    output += `📁 KNOWN DEPENDENCIES (${impact.affectedFiles.length}):
${impact.affectedFiles.map(file => 
  `   • ${file.file} (${file.type})`
).join('\n')}

`;
  }

  if (impact.searchResults.length > 0) {
    output += `🔎 ACTUAL REFERENCES FOUND (${impact.searchResults.length}):
${impact.searchResults.map(result => 
  `   📄 ${result.file} (${result.matches} matches)
${result.lines.map(line => 
  `      Line ${line.number}: ${line.line}`
).join('\n')}`
).join('\n')}

`;
  }

  if (impact.estimatedFiles > 0) {
    output += `⚠️  ESTIMATED UPDATE EFFORT:
   Files to update: ${impact.estimatedFiles}
   Complexity: ${impact.estimatedFiles > 10 ? 'HIGH' : impact.estimatedFiles > 5 ? 'MEDIUM' : 'LOW'}
   
`;
  }

  return output;
}

function main() {
  const change = process.argv[2];
  
  if (!change) {
    console.error(`Usage: node scripts/arch-impact.js "<component:old_value:new_value>"

Examples:
  node scripts/arch-impact.js "locations.backend:convex/:convex/"
  node scripts/arch-impact.js "commands.dev:pnpm dev:pnpm dev"
`);
    process.exit(1);
  }

  console.log('📊 Analyzing architecture change impact...\n');
  
  const map = loadArchitectureMap();
  const impact = analyzeImpact(change, map);
  
  if (impact.error) {
    console.error('❌', impact.error);
    process.exit(1);
  }

  console.log(formatImpactReport(impact));
  
  // Generate update script if we have old/new values
  const updateScript = generateUpdateScript(impact);
  if (updateScript) {
    console.log('🔧 AUTO-GENERATED UPDATE SCRIPT:');
    console.log('   Save this to a file and run to apply changes automatically:\n');
    console.log(updateScript);
  }
}

// Support both ES modules and CommonJS
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { analyzeImpact, searchForReferences, generateUpdateScript };
