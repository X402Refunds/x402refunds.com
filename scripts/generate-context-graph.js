#!/usr/bin/env node

/**
 * Codebase Context Graph Generator
 * 
 * Scans the entire codebase and generates a comprehensive context file
 * that Cursor automatically loads at every inference run.
 * 
 * This file is regenerated on every commit via git hooks.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = process.cwd();
const OUTPUT_FILE = path.join(ROOT_DIR, '.cursor/rules/codebase-context.mdc');

// Directories to scan
const SCAN_DIRS = {
  backend: 'convex',
  frontend: 'dashboard/src',
  components: 'dashboard/src/components',
  publicAssets: 'dashboard/public',
  scripts: 'scripts',
  tests: 'test',
  docs: 'docs',
  packages: 'packages'
};

// File patterns to identify
const FILE_PATTERNS = {
  components: /\.tsx$/,
  apis: /convex\/.*\.ts$/,
  tests: /\.test\.ts$/,
  configs: /(package\.json|tsconfig\.json|convex\.json|vercel\.json|vitest\.config\.ts)$/,
  assets: /\.(png|jpg|jpeg|svg|ico|webp)$/,
  docs: /\.md$/
};

/**
 * Recursively scan directory and return file list
 */
function scanDirectory(dirPath, relativeTo = ROOT_DIR) {
  const files = [];
  
  try {
    if (!fs.existsSync(dirPath)) return files;
    
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      // Skip common ignore patterns
      if (item.name.startsWith('.') || 
          item.name === 'node_modules' || 
          item.name === 'dist' ||
          item.name === '_generated' ||
          item.name === 'tsconfig.tsbuildinfo') {
        continue;
      }
      
      const fullPath = path.join(dirPath, item.name);
      const relativePath = path.relative(relativeTo, fullPath);
      
      if (item.isDirectory()) {
        files.push(...scanDirectory(fullPath, relativeTo));
      } else if (item.isFile()) {
        files.push({
          path: relativePath,
          name: item.name,
          fullPath: fullPath,
          size: fs.statSync(fullPath).size
        });
      }
    }
  } catch (err) {
    // Skip directories we can't read
  }
  
  return files;
}

/**
 * Extract exports from a TypeScript file (simple regex approach)
 */
function extractExports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const exports = [];
    
    // Match export const/function/class declarations
    const exportMatches = content.matchAll(/export\s+(?:const|function|class)\s+(\w+)/g);
    for (const match of exportMatches) {
      exports.push(match[1]);
    }
    
    return exports;
  } catch {
    return [];
  }
}

/**
 * Get package.json scripts
 */
function getPackageScripts() {
  try {
    const pkgPath = path.join(ROOT_DIR, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return pkg.scripts || {};
  } catch {
    return {};
  }
}

/**
 * Get dashboard package.json scripts
 */
function getDashboardScripts() {
  try {
    const pkgPath = path.join(ROOT_DIR, 'dashboard/package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return pkg.scripts || {};
  } catch {
    return {};
  }
}

/**
 * Get dependencies from package.json
 */
function getDependencies() {
  try {
    const pkgPath = path.join(ROOT_DIR, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return {
      dependencies: pkg.dependencies || {},
      devDependencies: pkg.devDependencies || {}
    };
  } catch {
    return { dependencies: {}, devDependencies: {} };
  }
}

/**
 * Generate the context file
 */
function generateContext() {
  console.log('🔍 Scanning codebase...');
  
  // Scan all files
  const allFiles = scanDirectory(ROOT_DIR);
  
  // Categorize files
  const components = allFiles.filter(f => f.path.includes('dashboard/src/components') && FILE_PATTERNS.components.test(f.name));
  const convexFiles = allFiles.filter(f => f.path.startsWith('convex/') && f.path.endsWith('.ts') && !f.path.includes('_generated'));
  const testFiles = allFiles.filter(f => FILE_PATTERNS.tests.test(f.name));
  const assets = allFiles.filter(f => FILE_PATTERNS.assets.test(f.name));
  const docs = allFiles.filter(f => FILE_PATTERNS.docs.test(f.name));
  
  // Get package info
  const rootScripts = getPackageScripts();
  const dashboardScripts = getDashboardScripts();
  const deps = getDependencies();
  
  // Generate MDC content
  const content = `---
alwaysApply: true
---

# Codebase Context Graph

**Auto-generated on**: ${new Date().toISOString()}

This file is automatically regenerated on every commit. It provides a comprehensive map of the codebase structure, file locations, and common operations.

## 🚨 CRITICAL: YOU ALREADY KNOW THIS PROJECT

**DO NOT "understand the project structure first" - you ALREADY KNOW IT:**

- ✅ **Next.js 14** project with **App Router** in \`dashboard/src/app/\`
- ✅ **Vercel** deployment (configured in \`vercel.json\`)
- ✅ **Convex** serverless backend in \`convex/\`
- ✅ **React** components in \`dashboard/src/components/\`
- ✅ **TypeScript** monorepo with \`pnpm\` workspaces

**DO NOT read files to "check structure" - USE THIS CONTEXT IMMEDIATELY.**

## 📁 Project Structure

### Core Directories
- **convex/** - Serverless backend functions (Convex)
- **dashboard/** - Next.js frontend application (Vercel)
- **dashboard/src/app/** - Next.js app router pages
- **dashboard/src/components/** - React UI components
- **dashboard/public/** - Static assets (favicons, images, etc.)
- **packages/config/** - Shared ESLint & TypeScript configuration
- **scripts/** - Automation and utility scripts
- **test/** - Vitest test suites
- **docs/** - Project documentation

### Workspace Layout
\`\`\`
consulate/
├── convex/           # Backend (Convex serverless)
├── dashboard/        # Frontend (Next.js + React)
├── packages/config/  # Shared config
├── scripts/          # Automation
├── test/            # Tests
└── docs/            # Documentation
\`\`\`

## 🎨 Common Assets

### Favicons (dashboard/public/)
${assets.filter(f => f.name.includes('favicon') || f.name.includes('apple-touch-icon')).map(f => `- ${f.path}`).join('\n') || '- (no favicons found)'}

### Logos (public/)
${assets.filter(f => f.path.startsWith('public/') && f.name.includes('logo')).map(f => `- ${f.path}`).join('\n') || '- (no logos found)'}

### Other Images
${assets.filter(f => !f.name.includes('favicon') && !f.name.includes('logo')).slice(0, 10).map(f => `- ${f.path}`).join('\n') || '- (no images found)'}

## ⚡ Backend API (Convex Functions)

### Convex Files (${convexFiles.length} files)
${convexFiles.map(f => {
  const exports = extractExports(f.fullPath);
  return `- **${f.name}** - ${exports.length > 0 ? exports.join(', ') : 'Core logic'}`;
}).join('\n')}

### Key Backend Functions
- **agents.ts** - Agent registration & management (joinAgent, listAgents, etc.)
- **cases.ts** - Case filing & dispute resolution
- **evidence.ts** - Evidence submission & validation
- **courtEngine.ts** - Automated arbitration logic
- **judges.ts** - Judge panel & voting system
- **http.ts** - HTTP API endpoints for external integrations
- **schema.ts** - Database schema definitions

### HTTP Endpoints (convex/http.ts)
Common HTTP routes exposed:
- GET /health - Health check
- GET /version - API version
- GET /mcp/tools - MCP tool discovery
- POST /evidence - Submit evidence
- POST /disputes - File disputes

## ⚛️ Frontend Components

### React Components (${components.length} components)
${components.slice(0, 20).map(f => `- ${f.name.replace('.tsx', '')}`).join('\n')}
${components.length > 20 ? `\n... and ${components.length - 20} more` : ''}

### Component Categories
- **Layout**: Header, Footer, Navigation
- **Forms**: Case forms, Evidence upload
- **Display**: Case lists, Agent cards, Stats
- **UI**: Buttons, Cards, Dialogs (shadcn/ui)

## 🧪 Test Files

### Test Suites (${testFiles.length} test files)
${testFiles.map(f => `- ${f.path}`).join('\n')}

## 📦 Package Scripts

### Root Package Commands
${Object.entries(rootScripts).map(([cmd, script]) => `- \`pnpm ${cmd}\` - ${script.split(' ')[0]}`).join('\n')}

### Dashboard Commands
${Object.entries(dashboardScripts).map(([cmd, script]) => `- \`pnpm --filter dashboard ${cmd}\``).join('\n')}

### Common Workflows
- **Development**: \`pnpm dev\` - Start dev server (Convex + Next.js)
- **Build**: \`pnpm build\` - Build all packages
- **Test**: \`pnpm test\` or \`pnpm test:run\` - Run tests
- **Deploy Backend**: \`pnpm deploy\` - Deploy Convex functions
- **Deploy Frontend**: \`git push\` - Auto-deploys to Vercel via GitHub integration
- **Type Check**: \`pnpm type-check\` - Validate TypeScript
- **Lint**: \`pnpm lint\` - Run ESLint

## 📚 Documentation Files

### Documentation (${docs.length} files)
${docs.slice(0, 15).map(f => `- ${f.path}`).join('\n')}
${docs.length > 15 ? `\n... and ${docs.length - 15} more in docs/` : ''}

## 🔧 Configuration Files

- **package.json** - Root workspace configuration
- **pnpm-workspace.yaml** - Monorepo workspace definition
- **tsconfig.json** - Root TypeScript configuration
- **convex.json** - Convex backend configuration
- **dashboard/package.json** - Frontend dependencies
- **dashboard/next.config.ts** - Next.js configuration
- **dashboard/tsconfig.json** - Frontend TypeScript config
- **vercel.json** - Vercel deployment settings
- **vitest.config.ts** - Test configuration

## 📦 Dependencies

### Production Dependencies (${Object.keys(deps.dependencies).length})
${Object.entries(deps.dependencies).slice(0, 10).map(([name, version]) => `- ${name}@${version}`).join('\n')}

### Dev Dependencies (${Object.keys(deps.devDependencies).length})
${Object.entries(deps.devDependencies).slice(0, 10).map(([name, version]) => `- ${name}@${version}`).join('\n')}

## 🚀 Quick Reference

### When working with...

**Favicons/Icons**: Look in \`dashboard/public/\`
- favicon.ico, favicon-192.png, favicon-512.png, apple-touch-icon.png

**React Components**: Look in \`dashboard/src/components/\`
- ${components.length} components organized by feature

**Backend Logic**: Look in \`convex/\`
- ${convexFiles.length} TypeScript files with serverless functions

**API Endpoints**: Check \`convex/http.ts\`
- HTTP actions for external integrations

**Tests**: Look in \`test/\`
- ${testFiles.length} test files using Vitest

**Scripts**: Look in \`scripts/\`
- Automation, deployment, and utility scripts

**Documentation**: Look in \`docs/\`
- Architecture, specs, compliance guides

### Common Questions Answered

**Q: Where are the favicons?**
A: \`dashboard/public/favicon*.png\` and \`dashboard/public/apple-touch-icon.png\`

**Q: How do I add a new React component?**
A: Create in \`dashboard/src/components/YourComponent.tsx\`

**Q: Where is authentication handled?**
A: \`convex/auth.ts\` for backend, check \`convex/apiKeys.ts\` for API key auth

**Q: How do I add a new API endpoint?**
A: Add HTTP action in \`convex/http.ts\` or mutation/query in relevant \`convex/*.ts\` file

**Q: Where are the tests?**
A: \`test/*.test.ts\` - Run with \`pnpm test\`

**Q: How do I deploy?**
A: \`pnpm deploy\` (backend), \`git push\` (frontend auto-deploys via Vercel)

## 🔄 Last Updated

Generated: ${new Date().toLocaleString()}
Files scanned: ${allFiles.length}
`;

  return content;
}

/**
 * Main execution
 */
function main() {
  try {
    const context = generateContext();
    
    // Ensure directory exists
    const dir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write context file
    fs.writeFileSync(OUTPUT_FILE, context, 'utf-8');
    
    console.log('✅ Codebase context generated:', OUTPUT_FILE);
    console.log('   This file will be automatically loaded by Cursor at every inference.');
  } catch (error) {
    console.error('❌ Failed to generate context:', error.message);
    process.exit(1);
  }
}

// Run if called directly (ES module check)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateContext, main };
