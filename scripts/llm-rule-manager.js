#!/usr/bin/env node
/**
 * LLM-Powered Rule Management System
 * 
 * Uses Claude/OpenAI to:
 * 1. Semantically detect duplicate concepts across rules
 * 2. Learn from user corrections and auto-update rules
 * 3. Compress verbose rules while preserving meaning
 * 4. Merge related rules intelligently
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RULES_DIR = path.join(__dirname, '../.cursor/rules');
const LEARNING_LOG = path.join(__dirname, '../.cursor/learning-log.json');
const CONFIG_FILE = path.join(__dirname, '../.cursor/learning-config.json');

// Load config
const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));

/**
 * LLM Provider Interface
 * Supports: Claude (Anthropic), OpenAI, or local models
 */
class LLMProvider {
  constructor(provider = 'anthropic') {
    this.provider = provider;
    this.apiKey = this.getApiKey(provider);
    this.baseURL = this.getBaseURL(provider);
  }

  getApiKey(provider) {
    const envVars = {
      anthropic: 'ANTHROPIC_API_KEY',
      openai: 'OPENAI_API_KEY',
      local: null // No key needed for local
    };
    
    const envVar = envVars[provider];
    if (!envVar) return null;
    
    const key = process.env[envVar];
    if (!key && provider !== 'local') {
      console.error(`❌ ${envVar} not found. Set it in your environment.`);
      process.exit(1);
    }
    return key;
  }

  getBaseURL(provider) {
    const urls = {
      anthropic: 'https://api.anthropic.com/v1/messages',
      openai: 'https://api.openai.com/v1/chat/completions',
      local: 'http://localhost:1234/v1/chat/completions' // LM Studio default
    };
    return urls[provider];
  }

  async chat(messages, options = {}) {
    const defaultOptions = {
      model: this.provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4',
      temperature: 0.3,
      max_tokens: 4096
    };

    const mergedOptions = { ...defaultOptions, ...options };

    if (this.provider === 'anthropic') {
      return this.anthropicChat(messages, mergedOptions);
    } else {
      return this.openaiChat(messages, mergedOptions);
    }
  }

  async anthropicChat(messages, options) {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: options.model,
        max_tokens: options.max_tokens,
        temperature: options.temperature,
        messages: messages
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  async openaiChat(messages, options) {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: options.model,
        temperature: options.temperature,
        max_tokens: options.max_tokens,
        messages: messages
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
}

/**
 * Rule Manager with LLM Intelligence
 */
class LLMRuleManager {
  constructor(provider = 'anthropic') {
    this.llm = new LLMProvider(provider);
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
          lines: content.split('\n').length,
          size: content.length
        };
      }
    }
    
    return rules;
  }

  /**
   * Semantic Duplication Detection
   * Uses LLM to find conceptually duplicate content
   */
  async detectSemanticDuplicates() {
    console.log('🤖 Using LLM to detect semantic duplicates...\n');

    const rulesList = Object.entries(this.rules).map(([name, data]) => ({
      name,
      preview: data.content.substring(0, 500) + '...',
      lines: data.lines
    }));

    const prompt = `You are a rule deduplication expert. Analyze these Cursor rules and identify SEMANTIC duplicates - rules that cover the same concepts even if worded differently.

Rules to analyze:
${JSON.stringify(rulesList, null, 2)}

Full rule contents:
${Object.entries(this.rules).map(([name, data]) => `
=== ${name} ===
${data.content}
`).join('\n')}

Identify:
1. Rules that cover the SAME concepts (e.g., "quality checks" = "validation workflow")
2. Sections within rules that are conceptually duplicate
3. Rules that should be merged
4. Verbose content that can be compressed

Return JSON:
{
  "duplicates": [
    {
      "files": ["file1.mdc", "file2.mdc"],
      "concept": "Quality validation workflow",
      "reason": "Both describe the same lint/type-check/build process",
      "recommendation": "Merge into single reference in core rules"
    }
  ],
  "compressionCandidates": [
    {
      "file": "file.mdc",
      "section": "Examples",
      "reason": "15 examples when 3 would suffice",
      "estimatedSavings": "300 lines"
    }
  ],
  "mergeRecommendations": [
    {
      "files": ["file1.mdc", "file2.mdc"],
      "newName": "merged-concept.mdc",
      "reason": "Both cover related concepts that belong together"
    }
  ]
}`;

    const messages = [
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await this.llm.chat(messages);
    
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ LLM did not return valid JSON');
      return null;
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    // Display results
    console.log('📊 Semantic Duplication Analysis\n');
    console.log('━'.repeat(60));
    
    if (analysis.duplicates?.length > 0) {
      console.log('\n🔄 SEMANTIC DUPLICATES FOUND:\n');
      for (const dup of analysis.duplicates) {
        console.log(`📝 Concept: ${dup.concept}`);
        console.log(`   Files: ${dup.files.join(', ')}`);
        console.log(`   Reason: ${dup.reason}`);
        console.log(`   💡 ${dup.recommendation}\n`);
      }
    }

    if (analysis.compressionCandidates?.length > 0) {
      console.log('\n🗜️  COMPRESSION OPPORTUNITIES:\n');
      for (const comp of analysis.compressionCandidates) {
        console.log(`📄 ${comp.file} - ${comp.section}`);
        console.log(`   Reason: ${comp.reason}`);
        console.log(`   Savings: ${comp.estimatedSavings}\n`);
      }
    }

    if (analysis.mergeRecommendations?.length > 0) {
      console.log('\n🔗 MERGE RECOMMENDATIONS:\n');
      for (const merge of analysis.mergeRecommendations) {
        console.log(`📦 ${merge.files.join(' + ')}`);
        console.log(`   → ${merge.newName}`);
        console.log(`   Reason: ${merge.reason}\n`);
      }
    }

    return analysis;
  }

  /**
   * Intelligent Rule Compression
   * LLM rewrites verbose rules to be concise while preserving meaning
   */
  async compressRule(ruleName) {
    console.log(`🗜️  Compressing ${ruleName} using LLM...\n`);

    const rule = this.rules[ruleName];
    if (!rule) {
      console.error(`❌ Rule ${ruleName} not found`);
      return;
    }

    const prompt = `You are a technical writing expert. Compress this Cursor rule to be maximally concise while preserving ALL critical information.

Rule: ${ruleName}
Current size: ${rule.lines} lines

${rule.content}

Requirements:
1. Keep ALL actionable guidance
2. Remove verbose explanations
3. Compress examples to 2-3 max
4. Use bullet points over paragraphs
5. Keep critical "NEVER" and "ALWAYS" statements
6. Preserve code examples if essential
7. Target: 50% size reduction

Return the compressed rule content ONLY (no explanations).`;

    const messages = [
      {
        role: 'user',
        content: prompt
      }
    ];

    const compressed = await this.llm.chat(messages);

    const originalLines = rule.lines;
    const compressedLines = compressed.split('\n').length;
    const reduction = ((originalLines - compressedLines) / originalLines * 100).toFixed(1);

    console.log(`📊 Compression Results:`);
    console.log(`   Original: ${originalLines} lines`);
    console.log(`   Compressed: ${compressedLines} lines`);
    console.log(`   Reduction: ${reduction}%\n`);

    // Save compressed version
    const backupPath = rule.path + '.backup';
    fs.writeFileSync(backupPath, rule.content); // Backup original
    fs.writeFileSync(rule.path, compressed);

    console.log(`✅ Compressed rule saved`);
    console.log(`📦 Backup at: ${backupPath}`);

    return compressed;
  }

  /**
   * Learn from User Correction
   * LLM analyzes correction and updates relevant rules
   */
  async learnFromCorrection(correction, context = '') {
    console.log('🧠 Learning from correction using LLM...\n');

    const prompt = `You are a rule learning system. A user made this correction:

CORRECTION: "${correction}"
CONTEXT: "${context}"

Current rules:
${Object.entries(this.rules).map(([name, data]) => `
=== ${name} ===
${data.content.substring(0, 300)}...
`).join('\n')}

Analyze:
1. Which rule(s) should be updated based on this correction?
2. What specific changes should be made?
3. Should this create a new rule or strengthen an existing one?
4. What's the pattern to avoid in the future?

Return JSON:
{
  "ruleToUpdate": "filename.mdc",
  "changeType": "strengthen|add|create",
  "specificChange": "Add to NEVER section: Never X",
  "pattern": "Description of pattern to avoid",
  "updatedSection": "The actual text to add/update in the rule"
}`;

    const messages = [
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await this.llm.chat(messages);
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ LLM did not return valid JSON');
      return null;
    }

    const update = JSON.parse(jsonMatch[0]);

    console.log('📝 Learning Analysis:\n');
    console.log(`Rule to update: ${update.ruleToUpdate}`);
    console.log(`Change type: ${update.changeType}`);
    console.log(`Pattern: ${update.pattern}\n`);
    console.log(`Specific change:\n${update.specificChange}\n`);

    // Log to learning log
    this.logCorrection(correction, update);

    return update;
  }

  logCorrection(correction, update) {
    let log = { corrections: [], updates: [] };
    
    if (fs.existsSync(LEARNING_LOG)) {
      log = JSON.parse(fs.readFileSync(LEARNING_LOG, 'utf-8'));
    }

    log.corrections.push({
      timestamp: new Date().toISOString(),
      correction,
      update
    });

    fs.writeFileSync(LEARNING_LOG, JSON.stringify(log, null, 2));
  }

  /**
   * Intelligent Rule Merge
   * LLM merges two rules preserving the best of both
   */
  async mergeRules(file1, file2, newName) {
    console.log(`🔗 Merging ${file1} + ${file2} → ${newName}\n`);

    const rule1 = this.rules[file1];
    const rule2 = this.rules[file2];

    if (!rule1 || !rule2) {
      console.error('❌ One or both rules not found');
      return;
    }

    const prompt = `You are a technical documentation expert. Merge these two Cursor rules into a single, cohesive rule.

Rule 1: ${file1}
${rule1.content}

Rule 2: ${file2}
${rule2.content}

Requirements:
1. Preserve ALL critical information from both
2. Eliminate redundancy
3. Organize logically by topic
4. Keep the most concise phrasing
5. Maintain YAML frontmatter with combined globs
6. Target: Smaller than both rules combined

Return the merged rule content ONLY.`;

    const messages = [
      {
        role: 'user',
        content: prompt
      }
    ];

    const merged = await this.llm.chat(messages);

    const newPath = path.join(RULES_DIR, newName);
    fs.writeFileSync(newPath, merged);

    console.log(`✅ Merged rule created: ${newName}`);
    console.log(`📊 Size: ${merged.split('\n').length} lines`);

    return merged;
  }
}

/**
 * Main CLI
 */
async function main() {
  const command = process.argv[2];
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];
  
  // Provider selection (default: anthropic)
  const provider = process.env.LLM_PROVIDER || 'anthropic';
  
  const manager = new LLMRuleManager(provider);

  try {
    switch (command) {
      case 'detect':
        console.log(`🤖 Using ${provider.toUpperCase()} for semantic analysis\n`);
        await manager.detectSemanticDuplicates();
        break;

      case 'compress':
        if (!arg1) {
          console.error('Usage: pnpm rules:llm-compress <rule-file>');
          process.exit(1);
        }
        await manager.compressRule(arg1);
        break;

      case 'learn':
        if (!arg1) {
          console.error('Usage: pnpm rules:llm-learn "<correction>" [context]');
          process.exit(1);
        }
        await manager.learnFromCorrection(arg1, arg2 || '');
        break;

      case 'merge':
        if (!arg1 || !arg2) {
          console.error('Usage: pnpm rules:llm-merge <file1> <file2> <new-name>');
          process.exit(1);
        }
        const newName = process.argv[5];
        if (!newName) {
          console.error('Please provide a new name for the merged rule');
          process.exit(1);
        }
        await manager.mergeRules(arg1, arg2, newName);
        break;

      default:
        console.log(`
🤖 LLM-Powered Rule Manager

Usage:
  pnpm rules:llm-detect                     - Semantic duplicate detection
  pnpm rules:llm-compress <file>            - Compress a rule intelligently
  pnpm rules:llm-learn "<correction>"       - Learn from user correction
  pnpm rules:llm-merge <f1> <f2> <new>      - Merge two rules

Environment:
  LLM_PROVIDER=anthropic|openai|local       - Choose provider (default: anthropic)
  ANTHROPIC_API_KEY=sk-...                  - For Claude
  OPENAI_API_KEY=sk-...                     - For OpenAI

Examples:
  # Detect semantic duplicates
  pnpm rules:llm-detect

  # Compress a verbose rule
  pnpm rules:llm-compress convex-patterns.mdc

  # Learn from correction
  pnpm rules:llm-learn "Stop creating summary documents"

  # Merge two rules
  pnpm rules:llm-merge agent-coordination.mdc prompt-architecture.mdc agent-patterns.mdc

Provider Selection:
  export LLM_PROVIDER=anthropic    # Use Claude (default)
  export LLM_PROVIDER=openai       # Use GPT-4
  export LLM_PROVIDER=local        # Use local LM Studio
        `);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
