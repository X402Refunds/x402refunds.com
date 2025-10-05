#!/usr/bin/env node
/**
 * LLM-Powered Rule System Optimizer
 * 
 * Uses Claude API to intelligently:
 * - Detect semantic duplications across rules
 * - Merge related content
 * - Learn from git commit history (user corrections)
 * - Rewrite rules for clarity and conciseness
 * - Detect contradictions and outdated content
 */

import Anthropic from 'anthropic';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RULES_DIR = path.join(__dirname, '../.cursor/rules');
const CURSORRULES_PATH = path.join(__dirname, '../.cursorrules');

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Load all rule files
 */
function loadAllRules() {
  const rules = {
    core: fs.readFileSync(CURSORRULES_PATH, 'utf-8'),
    files: {}
  };
  
  const ruleFiles = fs.readdirSync(RULES_DIR)
    .filter(f => f.endsWith('.mdc') || f.endsWith('.md'));
  
  for (const file of ruleFiles) {
    const filePath = path.join(RULES_DIR, file);
    rules.files[file] = fs.readFileSync(filePath, 'utf-8');
  }
  
  return rules;
}

/**
 * Analyze git history for correction patterns
 */
function analyzeGitHistory() {
  try {
    // Get last 50 commits mentioning rules
    const log = execSync(
      `git log -50 --all --grep="rule" --grep="fix" --grep="refactor" --grep="chore" --oneline`,
      { encoding: 'utf-8' }
    );
    
    // Get detailed diffs for rule-related commits
    const ruleDiffs = execSync(
      `git log -10 --all -p -- .cursor/rules/ .cursorrules`,
      { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 10 }
    );
    
    return {
      recentCommits: log,
      ruleDiffs: ruleDiffs.slice(0, 10000)  // Limit to 10KB
    };
  } catch (error) {
    console.error('Warning: Could not analyze git history:', error.message);
    return {
      recentCommits: '',
      ruleDiffs: ''
    };
  }
}

/**
 * Call Claude API to optimize rules
 */
async function optimizeRulesWithLLM(rules, gitHistory) {
  console.log('🤖 Calling Claude to optimize rule system...\n');
  
  const prompt = `You are an expert at maintaining clean, efficient rule systems for AI coding assistants.

TASK: Analyze and optimize the Cursor rule system to eliminate bloat while preserving essential information.

RULES YOU HAVE ACCESS TO:

=== CORE RULES (.cursorrules) ===
${rules.core}

=== RULE FILES (.cursor/rules/) ===
${Object.entries(rules.files).map(([name, content]) => `
--- ${name} ---
${content}
`).join('\n')}

=== RECENT GIT HISTORY (Learn from corrections) ===
${gitHistory.recentCommits}

${gitHistory.ruleDiffs ? `
=== RECENT RULE CHANGES (Detailed) ===
${gitHistory.ruleDiffs}
` : ''}

YOUR ANALYSIS SHOULD:

1. **Detect Semantic Duplications**
   - Find content that says the same thing in different words
   - Identify overlapping concepts across files
   - Note command/example duplications

2. **Learn from Git History**
   - What corrections were made repeatedly?
   - What rules were added/removed and why?
   - What patterns emerge from recent changes?

3. **Identify Contradictions**
   - Do any rules conflict?
   - Are there outdated patterns still referenced?

4. **Suggest Improvements**
   - What can be merged?
   - What can be compressed?
   - What's missing?
   - What's outdated?

5. **Propose Concrete Changes**
   - Specific file edits
   - Content to merge/delete
   - Rewrites for clarity

OUTPUT FORMAT:

\`\`\`json
{
  "analysis": {
    "duplications": [
      {
        "files": ["file1.mdc", "file2.mdc"],
        "issue": "Both define quality check commands",
        "recommendation": "Merge into file1.mdc, delete from file2.mdc"
      }
    ],
    "contradictions": [
      {
        "issue": "Description of contradiction",
        "files": ["file1.mdc"],
        "recommendation": "How to resolve"
      }
    ],
    "learnings": [
      {
        "pattern": "User corrected X multiple times",
        "recommendation": "Strengthen rule about X"
      }
    ],
    "outdated": [
      {
        "file": "file.mdc",
        "content": "Outdated content",
        "recommendation": "Remove or update"
      }
    ]
  },
  "changes": [
    {
      "file": ".cursorrules or .cursor/rules/filename.mdc",
      "action": "update|delete|create",
      "reasoning": "Why this change is needed",
      "content": "New content (if update/create)"
    }
  ],
  "summary": {
    "duplicationsRemoved": 5,
    "contradictionsResolved": 2,
    "filesDeleted": 1,
    "filesUpdated": 3,
    "estimatedContextReduction": "20%"
  }
}
\`\`\`

IMPORTANT CONSTRAINTS:
- Preserve all essential information
- Don't delete rules about deployment safety, quality checks, or architecture
- Be aggressive about removing duplication but cautious about removing unique content
- Prioritize clarity and conciseness
- Learn from git history patterns`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    temperature: 0.2,  // Low temp for consistency
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  const responseText = message.content[0].text;
  
  // Extract JSON from markdown code blocks if present
  const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                    responseText.match(/```\n([\s\S]*?)\n```/);
  
  const jsonText = jsonMatch ? jsonMatch[1] : responseText;
  
  try {
    return JSON.parse(jsonText);
  } catch (error) {
    console.error('Failed to parse LLM response as JSON:', error.message);
    console.error('Response was:', responseText);
    throw error;
  }
}

/**
 * Apply changes recommended by LLM
 */
function applyChanges(optimization) {
  console.log('\n📝 Applying LLM-recommended changes...\n');
  
  const changes = optimization.changes || [];
  let changesApplied = 0;
  
  for (const change of changes) {
    try {
      const filePath = change.file.startsWith('.cursorrules')
        ? CURSORRULES_PATH
        : path.join(RULES_DIR, change.file.replace('.cursor/rules/', ''));
      
      switch (change.action) {
        case 'delete':
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`   ❌ Deleted: ${change.file}`);
            console.log(`      Reason: ${change.reasoning}\n`);
            changesApplied++;
          }
          break;
          
        case 'update':
        case 'create':
          fs.writeFileSync(filePath, change.content, 'utf-8');
          console.log(`   ✏️  ${change.action === 'create' ? 'Created' : 'Updated'}: ${change.file}`);
          console.log(`      Reason: ${change.reasoning}\n`);
          changesApplied++;
          break;
          
        default:
          console.log(`   ⚠️  Unknown action: ${change.action} for ${change.file}\n`);
      }
    } catch (error) {
      console.error(`   ❌ Failed to apply change to ${change.file}:`, error.message);
    }
  }
  
  return changesApplied;
}

/**
 * Generate optimization report
 */
function generateReport(optimization) {
  const report = `# Rule System Optimization Report

**Generated**: ${new Date().toISOString()}
**Model**: Claude Sonnet 4.0

## Analysis Summary

### Duplications Found
${optimization.analysis.duplications?.map(d => 
  `- **${d.files.join(' + ')}**: ${d.issue}\n  → ${d.recommendation}`
).join('\n') || 'None detected'}

### Contradictions Resolved
${optimization.analysis.contradictions?.map(c => 
  `- **${c.files.join(', ')}**: ${c.issue}\n  → ${c.recommendation}`
).join('\n') || 'None detected'}

### Learnings from Git History
${optimization.analysis.learnings?.map(l => 
  `- **Pattern**: ${l.pattern}\n  → ${l.recommendation}`
).join('\n') || 'No patterns detected'}

### Outdated Content
${optimization.analysis.outdated?.map(o => 
  `- **${o.file}**: ${o.content}\n  → ${o.recommendation}`
).join('\n') || 'None detected'}

## Changes Applied

${optimization.changes?.map(c => 
  `### ${c.action.toUpperCase()}: ${c.file}
**Reasoning**: ${c.reasoning}
`).join('\n') || 'No changes applied'}

## Impact Summary

- **Duplications Removed**: ${optimization.summary?.duplicationsRemoved || 0}
- **Contradictions Resolved**: ${optimization.summary?.contradictionsResolved || 0}
- **Files Deleted**: ${optimization.summary?.filesDeleted || 0}
- **Files Updated**: ${optimization.summary?.filesUpdated || 0}
- **Estimated Context Reduction**: ${optimization.summary?.estimatedContextReduction || 'N/A'}

---

*This optimization was performed automatically by Claude via GitHub Actions.*
*Review the changes carefully before merging.*`;

  fs.writeFileSync(
    path.join(__dirname, '../RULE_OPTIMIZATION_REPORT.md'),
    report,
    'utf-8'
  );
  
  console.log('\n📊 Report generated: RULE_OPTIMIZATION_REPORT.md\n');
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🔍 Loading all rules...');
    const rules = loadAllRules();
    console.log(`   Found ${Object.keys(rules.files).length} rule files\n`);
    
    console.log('📜 Analyzing git history...');
    const gitHistory = analyzeGitHistory();
    console.log(`   Analyzed ${gitHistory.recentCommits.split('\n').length} commits\n`);
    
    console.log('🤖 Optimizing rules with Claude...');
    const optimization = await optimizeRulesWithLLM(rules, gitHistory);
    
    console.log('\n✨ LLM Analysis Complete!\n');
    console.log('━'.repeat(60));
    console.log(`Duplications found: ${optimization.analysis.duplications?.length || 0}`);
    console.log(`Contradictions found: ${optimization.analysis.contradictions?.length || 0}`);
    console.log(`Learnings extracted: ${optimization.analysis.learnings?.length || 0}`);
    console.log(`Changes recommended: ${optimization.changes?.length || 0}`);
    console.log('━'.repeat(60));
    
    const changesApplied = applyChanges(optimization);
    
    console.log(`\n✅ Applied ${changesApplied} changes successfully\n`);
    
    generateReport(optimization);
    
    console.log('✨ Rule optimization complete!\n');
    console.log('Next steps:');
    console.log('1. Review changes in git diff');
    console.log('2. Check RULE_OPTIMIZATION_REPORT.md');
    console.log('3. Approve/reject the auto-generated PR\n');
    
  } catch (error) {
    console.error('❌ Optimization failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
