#!/usr/bin/env node

/**
 * Architecture Rule Generator
 * Reads .architecture/map.yaml and generates cursor rules automatically
 */

import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'yaml';
import { join } from 'path';

const ARCHITECTURE_MAP = '.architecture/map.yaml';
const CURSOR_RULES_DIR = '.cursor/rules';

function loadArchitectureMap() {
  try {
    const content = readFileSync(ARCHITECTURE_MAP, 'utf8');
    return parse(content);
  } catch (error) {
    console.error('❌ Failed to load architecture map:', error.message);
    process.exit(1);
  }
}

function generateArchitectureRules(map) {
  const timestamp = new Date().toISOString();
  
  return `---
alwaysApply: true
generated: true
generatedAt: "${timestamp}"
---

# 🤖 Auto-Generated Architecture Rules

**⚠️ This file is auto-generated from [.architecture/map.yaml](mdc:.architecture/map.yaml)**  
**Do not edit manually - run \`pnpm arch:update\` to regenerate**

## 📍 Current File Locations

${Object.entries(map.current.locations).map(([name, path]) => 
  `- **${name}**: \`${path}\``
).join('\n')}

## ⚡ Current Commands

${Object.entries(map.current.commands).map(([name, cmd]) => 
  `- **${name}**: \`${cmd}\``
).join('\n')}

## 📁 Current Patterns

${Object.entries(map.current.patterns).map(([name, pattern]) => 
  `- **${name}**: \`${pattern}\``
).join('\n')}

## ❌ Forbidden Patterns (Deprecated)

**Never suggest these outdated patterns:**

### Locations:
${map.deprecated.locations.map(location => 
  `- ❌ \`${location}\``
).join('\n')}

### Commands:
${map.deprecated.commands.map(command => 
  `- ❌ \`${command}\``
).join('\n')}

### Patterns:
${map.deprecated.patterns.map(pattern => 
  `- ❌ \`${pattern}\``
).join('\n')}

## 🔄 Quick Reference

**Backend files**: Use \`${map.current.patterns.backend_files}\`  
**Development**: Use \`${map.current.commands.dev}\`  
**Deployment**: Use \`${map.current.commands.deploy}\`  

## 🏗️ Architecture Principles

${map.principles.map(principle => `- ${principle}`).join('\n')}

---
*Generated from architecture map version ${map.version}*
*Last updated: ${map.last_updated}*`;
}

function generateValidationRules(map) {
  const timestamp = new Date().toISOString();
  
  return `---
alwaysApply: true
generated: true
generatedAt: "${timestamp}"
---

# 🔍 Architecture Validation Rules

**⚠️ Auto-generated from [.architecture/map.yaml](mdc:.architecture/map.yaml)**

## Pre-Suggestion Validation

Before suggesting any code changes, validate:

### File Path Validation
\`\`\`javascript
// Check if path uses current architecture
const currentPaths = ${JSON.stringify(map.current.locations, null, 2)};
const deprecatedPaths = ${JSON.stringify(map.deprecated.locations, null, 2)};

function isValidPath(path) {
  return !deprecatedPaths.some(deprecated => path.includes(deprecated));
}
\`\`\`

### Command Validation
\`\`\`javascript
// Check if command uses current patterns
const currentCommands = ${JSON.stringify(map.current.commands, null, 2)};
const deprecatedCommands = ${JSON.stringify(map.deprecated.commands, null, 2)};

function isValidCommand(command) {
  return !deprecatedCommands.some(deprecated => command.includes(deprecated));
}
\`\`\`

## Impact Analysis

When suggesting architecture changes, consider these dependencies:

${Object.entries(map.dependency_graph).map(([component, deps]) => `
### ${component}
${deps.description}
**Affected files:**
${deps.affects.map(file => `- ${file.file} (${file.type})`).join('\n')}
`).join('\n')}

---
*Validation rules generated: ${timestamp}*`;
}

function main() {
  console.log('🏗️  Generating architecture-aware cursor rules...');
  
  const map = loadArchitectureMap();
  
  // Generate main architecture rules
  const architectureRules = generateArchitectureRules(map);
  const architectureRulesPath = join(CURSOR_RULES_DIR, '01-auto-architecture.mdc');
  writeFileSync(architectureRulesPath, architectureRules);
  console.log('✅ Generated:', architectureRulesPath);
  
  // Generate validation rules
  const validationRules = generateValidationRules(map);
  const validationRulesPath = join(CURSOR_RULES_DIR, '02-auto-validation.mdc');
  writeFileSync(validationRulesPath, validationRules);
  console.log('✅ Generated:', validationRulesPath);
  
  console.log('🎉 Architecture rules generated successfully!');
  console.log('📋 Summary:');
  console.log(`   - Architecture version: ${map.version}`);
  console.log(`   - Current locations: ${Object.keys(map.current.locations).length}`);
  console.log(`   - Current commands: ${Object.keys(map.current.commands).length}`);
  console.log(`   - Deprecated patterns: ${map.deprecated.locations.length + map.deprecated.commands.length}`);
  console.log('');
  console.log('💡 Cursor will now use these patterns automatically!');
}

// Support both ES modules and CommonJS
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateArchitectureRules, generateValidationRules, loadArchitectureMap };
