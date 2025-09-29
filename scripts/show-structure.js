#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function countFiles(dirPath, extensions = []) {
  let count = 0;
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const item of items) {
      if (item.name.startsWith('.')) continue;
      
      const itemPath = path.join(dirPath, item.name);
      if (item.isDirectory()) {
        count += countFiles(itemPath, extensions);
      } else if (item.isFile()) {
        if (extensions.length === 0) {
          count++;
        } else {
          const ext = path.extname(item.name);
          if (extensions.includes(ext)) {
            count++;
          }
        }
      }
    }
  } catch (err) {
    // Directory might not exist or be accessible
  }
  return count;
}

function directoryExists(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

function showProjectStructure() {
  const rootDir = process.cwd();
  
  console.log(colorize('\n🏗️  Consulate AI - Project Structure', 'bright'));
  console.log(colorize('========================================', 'dim'));
  
  const structure = [
    {
      name: 'apps/dashboard/',
      description: 'Next.js Frontend Application',
      color: 'cyan',
      icon: '⚛️',
      details: [
        'Next.js 13+ with App Router',
        'React components and pages',
        'Tailwind CSS + shadcn/ui',
        'TypeScript frontend code'
      ],
      keyFiles: [
        'src/app/page.tsx - Main application entry',
        'src/components/ - Reusable UI components',
        'src/hooks/ - Custom React hooks',
        'src/lib/ - Frontend utilities'
      ],
      fileCount: {
        total: countFiles(path.join(rootDir, 'apps/dashboard/src')),
        ts: countFiles(path.join(rootDir, 'apps/dashboard/src'), ['.ts', '.tsx'])
      }
    },
    {
      name: 'convex/',
      description: 'Serverless Backend Functions',
      color: 'green',
      icon: '⚡',
      details: [
        'Convex serverless functions',
        'Database schema and queries',
        'AI dispute resolution framework',
        'Automated arbitration system'
      ],
      keyFiles: [
        'schema.ts - Database schema',
        'agents.ts - AI agent management',
        'cases.ts - Dispute resolution framework',
        'courtEngine.ts - Decision engine'
      ],
      fileCount: {
        total: countFiles(path.join(rootDir, 'convex')),
        ts: countFiles(path.join(rootDir, 'convex'), ['.ts'])
      }
    },
    {
      name: 'packages/config/',
      description: 'Shared Configuration',
      color: 'yellow',
      icon: '⚙️',
      details: [
        'ESLint configuration',
        'TypeScript configuration',
        'Shared build settings',
        'Monorepo utilities'
      ],
      keyFiles: [
        'src/eslint.ts - ESLint config',
        'src/typescript.ts - TypeScript config'
      ],
      fileCount: {
        total: countFiles(path.join(rootDir, 'packages/config/src')),
        ts: countFiles(path.join(rootDir, 'packages/config/src'), ['.ts'])
      }
    },
    {
      name: 'test/',
      description: 'Test Suites',
      color: 'magenta',
      icon: '🧪',
      details: [
        'Vitest test framework',
        'API endpoint testing',
        'Integration tests',
        'Convex function testing'
      ],
      keyFiles: [
        'agents.test.ts - Agent system tests',
        'courtEngine.test.ts - Court engine tests',
        'cases.test.ts - Case management tests'
      ],
      fileCount: {
        total: countFiles(path.join(rootDir, 'test')),
        ts: countFiles(path.join(rootDir, 'test'), ['.ts'])
      }
    },
    {
      name: 'scripts/',
      description: 'Automation & Utilities',
      color: 'blue',
      icon: '🔧',
      details: [
        'Deployment automation',
        'Monitoring scripts',
        'Dispute resolution utilities',
        'Development tools'
      ],
      keyFiles: [
        'deploy-*.js - Deployment scripts',
        'monitoring.js - System monitoring utilities',
        'monitor.js - System monitoring'
      ],
      fileCount: {
        total: countFiles(path.join(rootDir, 'scripts')),
        js: countFiles(path.join(rootDir, 'scripts'), ['.js'])
      }
    },
    {
      name: 'docs/',
      description: 'Project Documentation',
      color: 'white',
      icon: '📚',
      details: [
        'Architecture documentation',
        'API specifications',
        'Compliance guides',
        'Deployment guides'
      ],
      keyFiles: [
        'architecture/ - Technical architecture',
        'specs/ - API and system specs',
        'compliance/ - Legal compliance'
      ],
      fileCount: {
        total: countFiles(path.join(rootDir, 'docs')),
        md: countFiles(path.join(rootDir, 'docs'), ['.md'])
      }
    },
    {
      name: 'infra/',
      description: 'Infrastructure & Deployment',
      color: 'red',
      icon: '🚀',
      details: [
        'Deployment configurations',
        'Infrastructure templates',
        'Environment setups',
        'CI/CD configurations'
      ],
      keyFiles: [
        'deployment/ - Deployment configs',
        'templates/ - Infrastructure templates'
      ],
      fileCount: {
        total: countFiles(path.join(rootDir, 'infra')),
        yml: countFiles(path.join(rootDir, 'infra'), ['.yml', '.yaml'])
      }
    }
  ];

  structure.forEach((dir, index) => {
    if (!directoryExists(path.join(rootDir, dir.name))) {
      return; // Skip if directory doesn't exist
    }

    console.log(`\n${dir.icon} ${colorize(dir.name, dir.color)}`);
    console.log(`   ${colorize(dir.description, 'bright')}`);
    
    if (dir.fileCount.total > 0) {
      const counts = [];
      if (dir.fileCount.ts) counts.push(`${dir.fileCount.ts} TS files`);
      if (dir.fileCount.js) counts.push(`${dir.fileCount.js} JS files`);
      if (dir.fileCount.md) counts.push(`${dir.fileCount.md} MD files`);
      if (dir.fileCount.yml) counts.push(`${dir.fileCount.yml} YAML files`);
      
      if (counts.length === 0) {
        counts.push(`${dir.fileCount.total} files`);
      }
      
      console.log(`   ${colorize(`(${counts.join(', ')})`, 'dim')}`);
    }
    
    dir.details.forEach(detail => {
      console.log(`   ${colorize('•', 'dim')} ${detail}`);
    });
    
    if (dir.keyFiles && dir.keyFiles.length > 0) {
      console.log(`   ${colorize('Key files:', 'dim')}`);
      dir.keyFiles.forEach(file => {
        console.log(`     ${colorize('→', 'dim')} ${file}`);
      });
    }
  });

  console.log(`\n${colorize('📊 Quick Stats', 'bright')}`);
  console.log(colorize('==============', 'dim'));
  
  const stats = [
    { label: 'Frontend Components', count: countFiles(path.join(rootDir, 'apps/dashboard/src/components'), ['.tsx']) },
    { label: 'Backend Functions', count: countFiles(path.join(rootDir, 'convex'), ['.ts']) - 1 }, // Exclude schema.ts
    { label: 'Test Files', count: countFiles(path.join(rootDir, 'test'), ['.ts']) },
    { label: 'Documentation Files', count: countFiles(path.join(rootDir, 'docs'), ['.md']) },
    { label: 'Automation Scripts', count: countFiles(path.join(rootDir, 'scripts'), ['.js']) }
  ];

  stats.forEach(stat => {
    if (stat.count > 0) {
      console.log(`${stat.label}: ${colorize(stat.count, 'green')}`);
    }
  });

  console.log(`\n${colorize('🚀 Common Commands', 'bright')}`);
  console.log(colorize('=================', 'dim'));
  console.log(`${colorize('pnpm dev', 'green')}        - Start development server`);
  console.log(`${colorize('pnpm test', 'green')}       - Run all tests`);
  console.log(`${colorize('pnpm build', 'green')}      - Build the project`);
  console.log(`${colorize('pnpm deploy', 'green')}     - Deploy to production`);
  console.log(`${colorize('pnpm structure', 'green')}  - Show this structure view`);
  console.log(`${colorize('pnpm docs', 'green')}       - Open documentation`);

  console.log(`\n${colorize('📖 Learn More', 'bright')}`);
  console.log(colorize('=============', 'dim'));
  console.log(`${colorize('Architecture:', 'cyan')} docs/architecture/project-structure.md`);
  console.log(`${colorize('API Specs:', 'cyan')}    docs/specs/`);
  console.log(`${colorize('Compliance:', 'cyan')}   docs/compliance/`);
  
  console.log(colorize('\n✨ Happy coding!\n', 'bright'));
}

// Run if called directly
if (require.main === module) {
  showProjectStructure();
}

module.exports = { showProjectStructure };
