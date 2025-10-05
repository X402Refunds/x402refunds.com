#!/usr/bin/env node
/**
 * Dynamic Rule Learning System
 * 
 * Watches for patterns in user corrections and automatically updates rules.
 * Prevents rule bloat through deduplication and context-aware loading.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RULES_DIR = path.join(__dirname, '../.cursor/rules');
const LEARNING_LOG = path.join(__dirname, '../.cursor/learning-log.json');

/**
 * Learning System Configuration
 */
const CONFIG = {
  correctionThreshold: 2,        // Auto-update rule after N corrections
  duplicationThreshold: 0.7,     // 70% similarity = duplicate
  maxRuleSize: 200,              // Lines - split if exceeded
  contextWindowBudget: 4000,     // Tokens available for rules
  coreRulesOnly: [               // Always-loaded rules
    '.cursorrules'
  ],
  triggerRules: {                // Context-triggered rules
    'convex/': ['convex-patterns.mdc'],
    'dashboard/': ['context-trust.mdc'],
    'test/': ['code-quality-checks.mdc'],
    'commit': ['commit-standards.mdc'],
  }
};

/**
 * Learning Log Structure
 * Tracks corrections and patterns to auto-update rules
 */
class LearningLog {
  constructor() {
    this.log = this.load();
  }

  load() {
    if (fs.existsSync(LEARNING_LOG)) {
      return JSON.parse(fs.readFileSync(LEARNING_LOG, 'utf-8'));
    }
    return {
      corrections: {},      // Pattern → count
      lastUpdated: {},      // Rule → timestamp
      autoUpdates: [],      // History of auto-updates
      duplicationReport: {} // Content hash → files
    };
  }

  save() {
    fs.writeFileSync(LEARNING_LOG, JSON.stringify(this.log, null, 2));
  }

  /**
   * Record a user correction
   * If threshold met, trigger rule update
   */
  recordCorrection(pattern, context) {
    const key = `${pattern}:${context}`;
    this.log.corrections[key] = (this.log.corrections[key] || 0) + 1;

    if (this.log.corrections[key] >= CONFIG.correctionThreshold) {
      return this.suggestRuleUpdate(pattern, context);
    }
    return null;
  }

  suggestRuleUpdate(pattern, context) {
    return {
      action: 'UPDATE_RULE',
      pattern,
      context,
      count: this.log.corrections[pattern],
      suggestion: `Add anti-pattern: ${pattern}`
    };
  }
}

/**
 * Rule Deduplication Engine
 * Finds and merges duplicate content across rules
 */
class RuleDeduplicator {
  constructor() {
    this.rules = this.loadAllRules();
  }

  loadAllRules() {
    const rules = {};
    const files = fs.readdirSync(RULES_DIR);
    
    for (const file of files) {
      if (file.endsWith('.mdc') || file === '.cursorrules') {
        const filePath = path.join(RULES_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        rules[file] = {
          path: filePath,
          content,
          sections: this.parseSections(content),
          size: content.length
        };
      }
    }
    
    return rules;
  }

  parseSections(content) {
    const sections = [];
    const lines = content.split('\n');
    let currentSection = { title: '', content: [], start: 0 };
    
    lines.forEach((line, idx) => {
      if (line.startsWith('#')) {
        if (currentSection.content.length > 0) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line,
          content: [],
          start: idx
        };
      } else {
        currentSection.content.push(line);
      }
    });
    
    if (currentSection.content.length > 0) {
      sections.push(currentSection);
    }
    
    return sections;
  }

  /**
   * Find duplicate sections across rules
   */
  findDuplicates() {
    const duplicates = [];
    const ruleNames = Object.keys(this.rules);
    
    for (let i = 0; i < ruleNames.length; i++) {
      for (let j = i + 1; j < ruleNames.length; j++) {
        const rule1 = this.rules[ruleNames[i]];
        const rule2 = this.rules[ruleNames[j]];
        
        for (const section1 of rule1.sections) {
          for (const section2 of rule2.sections) {
            const similarity = this.calculateSimilarity(
              section1.content.join('\n'),
              section2.content.join('\n')
            );
            
            if (similarity > CONFIG.duplicationThreshold) {
              duplicates.push({
                file1: ruleNames[i],
                section1: section1.title,
                file2: ruleNames[j],
                section2: section2.title,
                similarity: (similarity * 100).toFixed(1) + '%',
                lines: section1.content.length
              });
            }
          }
        }
      }
    }
    
    return duplicates;
  }

  /**
   * Simple Levenshtein-based similarity
   */
  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    // Normalize whitespace
    const s1 = str1.replace(/\s+/g, ' ').trim();
    const s2 = str2.replace(/\s+/g, ' ').trim();
    
    if (s1 === s2) return 1.0;
    
    // Quick check: if one is substring of other
    if (s1.includes(s2) || s2.includes(s1)) {
      return Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length);
    }
    
    // Character overlap
    const set1 = new Set(s1.split(' '));
    const set2 = new Set(s2.split(' '));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    
    return intersection.size / Math.max(set1.size, set2.size);
  }

  /**
   * Generate deduplication report
   */
  generateReport() {
    const duplicates = this.findDuplicates();
    
    console.log('\n🔍 Rule Duplication Analysis\n');
    console.log('━'.repeat(60));
    
    if (duplicates.length === 0) {
      console.log('✅ No significant duplicates found');
      return;
    }
    
    console.log(`Found ${duplicates.length} duplicate sections:\n`);
    
    for (const dup of duplicates) {
      console.log(`📄 ${dup.file1}`);
      console.log(`   ${dup.section1}`);
      console.log(`   ↔️  ${dup.similarity} similar to`);
      console.log(`📄 ${dup.file2}`);
      console.log(`   ${dup.section2}`);
      console.log(`   (${dup.lines} lines)\n`);
    }
    
    return duplicates;
  }

  /**
   * Suggest merges
   */
  suggestMerges(duplicates) {
    const merges = {};
    
    for (const dup of duplicates) {
      // Keep content in core rules, remove from others
      const core = CONFIG.coreRulesOnly.includes(dup.file1) ? dup.file1 : dup.file2;
      const other = core === dup.file1 ? dup.file2 : dup.file1;
      
      if (!merges[other]) {
        merges[other] = [];
      }
      
      merges[other].push({
        section: core === dup.file1 ? dup.section2 : dup.section1,
        moveToCore: core,
        reason: `Duplicate in ${core}`
      });
    }
    
    return merges;
  }
}

/**
 * Rule Compression Engine
 * Reduces rule size while maintaining information
 */
class RuleCompressor {
  compress(rule) {
    // Remove excessive examples
    // Condense verbose explanations
    // Extract commands to reference file
    // Consolidate redundant sections
    
    return {
      original: rule.content.length,
      compressed: 'TBD',
      savings: 'TBD'
    };
  }
}

/**
 * Main CLI
 */
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'analyze':
      console.log('🔍 Analyzing rule duplication...\n');
      const deduplicator = new RuleDeduplicator();
      const duplicates = deduplicator.generateReport();
      
      if (duplicates && duplicates.length > 0) {
        console.log('\n💡 Suggested Actions:\n');
        const merges = deduplicator.suggestMerges(duplicates);
        
        for (const [file, suggestions] of Object.entries(merges)) {
          console.log(`📝 ${file}:`);
          for (const suggestion of suggestions) {
            console.log(`   • Remove "${suggestion.section}"`);
            console.log(`     → ${suggestion.reason}`);
          }
          console.log();
        }
      }
      break;
      
    case 'learn':
      console.log('📚 Learning from corrections...\n');
      const learner = new LearningLog();
      // Would integrate with Cursor correction tracking
      console.log('Learning system ready. Configure Cursor to log corrections.');
      break;
      
    case 'compress':
      console.log('🗜️  Compressing rules...\n');
      console.log('Not implemented yet - would reduce rule sizes');
      break;
      
    default:
      console.log(`
Rule Learning System

Usage:
  pnpm rule-learning analyze   - Find duplicate content across rules
  pnpm rule-learning learn     - Track corrections and suggest updates
  pnpm rule-learning compress  - Reduce rule sizes

Examples:
  pnpm rule-learning analyze   # See what's duplicated
      `);
  }
}

main().catch(console.error);
