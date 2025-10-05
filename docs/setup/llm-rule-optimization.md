# LLM-Powered Rule Optimization

Automated rule system optimization using Claude API to intelligently detect duplications, learn from corrections, and maintain clean rules.

## 🤖 How It Works

### Weekly Automated Optimization

1. **GitHub Actions cron** runs every Sunday at 2 AM UTC
2. **Claude Sonnet 4** analyzes:
   - All rule files for semantic duplications
   - Git commit history to learn from your corrections
   - Contradictions and outdated content
3. **Creates a PR** with recommended changes
4. **You review & merge** (or reject)

### What Claude Analyzes

- **Semantic Duplications**: Not just text matching - understands concepts
- **Correction Patterns**: Learns from your git history (what you fix repeatedly)
- **Contradictions**: Finds rules that conflict
- **Outdated Content**: Detects patterns no longer used
- **Clarity**: Rewrites verbose rules to be concise

### What Gets Optimized

✅ Detects duplicate concepts across files  
✅ Merges related content intelligently  
✅ Removes outdated patterns  
✅ Resolves contradictions  
✅ Learns from your correction history  
✅ Compresses verbose explanations  

---

## 🚀 Setup

### 1. Get Claude API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an API key
3. Copy the key (starts with `sk-ant-...`)

### 2. Add to GitHub Secrets

1. Go to your repo: **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `ANTHROPIC_API_KEY`
4. Value: Your Claude API key
5. Click **Add secret**

### 3. Enable Workflow Permissions

1. Go to: **Settings → Actions → General**
2. Under **Workflow permissions**, select:
   - ✅ **Read and write permissions**
   - ✅ **Allow GitHub Actions to create and approve pull requests**
3. Click **Save**

---

## 🧪 Manual Testing

Test locally before waiting for the weekly cron:

```bash
# Install Anthropic SDK
npm install anthropic

# Set your API key
export ANTHROPIC_API_KEY="sk-ant-..."

# Run optimizer locally
pnpm rules:optimize
```

**What happens:**
1. Loads all rule files
2. Analyzes git history
3. Calls Claude API
4. Shows recommended changes
5. Applies changes locally
6. Generates `RULE_OPTIMIZATION_REPORT.md`

**Review the changes:**
```bash
git diff  # See what changed
cat RULE_OPTIMIZATION_REPORT.md  # Read reasoning
```

If satisfied, commit:
```bash
git add .
git commit -m "chore: apply LLM rule optimization"
git push
```

If not, discard:
```bash
git reset --hard HEAD
```

---

## 🔄 How the Automation Works

### Workflow Trigger

**Automatic**: Every Sunday at 2 AM UTC  
**Manual**: Go to **Actions → Rule System Optimization → Run workflow**

### Workflow Steps

1. **Checkout repo** with full git history
2. **Install Anthropic SDK**
3. **Run optimizer** (`scripts/llm-rule-optimizer.js`)
4. **Create PR** with changes (if any)

### PR Contents

- **Title**: 🤖 Weekly Rule System Optimization
- **Body**: Summary of changes with reasoning
- **Files**: Modified rule files + optimization report
- **Branch**: `llm-rule-optimization`

### Review Checklist

When PR is created:

- [ ] Read `RULE_OPTIMIZATION_REPORT.md`
- [ ] Check duplications removed make sense
- [ ] Verify merged content is accurate
- [ ] Ensure no critical rules lost
- [ ] Confirm contradictions properly resolved

**Merge** if satisfied, or **close** if not.

---

## 📊 What Gets Reported

Each optimization generates `RULE_OPTIMIZATION_REPORT.md` with:

### Analysis Summary
- Duplications found and how to fix them
- Contradictions detected and resolutions
- Learnings from git history (patterns in corrections)
- Outdated content identified

### Changes Applied
- Files deleted/updated/created
- Reasoning for each change
- Content diffs

### Impact Metrics
- Duplications removed
- Contradictions resolved
- Files modified
- Estimated context reduction

---

## 🎯 Configuration

Edit `.github/workflows/rule-optimization.yml`:

```yaml
# Change schedule (default: weekly Sunday 2 AM)
schedule:
  - cron: '0 2 * * 0'  # Min Hour Day Month DayOfWeek

# Examples:
# Daily: '0 2 * * *'
# Monthly: '0 2 1 * *'
# Bi-weekly: '0 2 */14 * *'
```

Edit `scripts/llm-rule-optimizer.js`:

```javascript
// Change model (default: claude-sonnet-4)
model: 'claude-sonnet-4-20250514',

// Adjust creativity (default: 0.2 for consistency)
temperature: 0.2,

// Increase output length if needed (default: 8000)
max_tokens: 8000,
```

---

## 💰 Cost Estimate

**Claude Sonnet 4 Pricing** (as of 2025):
- Input: $3 per million tokens
- Output: $15 per million tokens

**Estimated per run:**
- Input: ~20K tokens (all rules + git history) = $0.06
- Output: ~5K tokens (changes) = $0.075
- **Total: ~$0.135 per optimization**

**Monthly cost** (weekly runs): ~$0.54/month

**Yearly cost**: ~$6.50/year

Very cheap for automated maintenance!

---

## 🔧 Troubleshooting

### "Anthropic API error"
- Check API key is correct in GitHub secrets
- Verify key has sufficient credits
- Check Anthropic service status

### "PR not created"
- Ensure workflow permissions are enabled
- Check Actions logs for errors
- Verify no changes were needed (LLM found nothing to optimize)

### "Changes look wrong"
- Just close the PR - nothing is merged automatically
- Rules are version-controlled, can always revert
- Test manually first with `pnpm rules:optimize`

### "Want more aggressive optimization"
Lower the temperature in `llm-rule-optimizer.js`:
```javascript
temperature: 0.1,  // More consistent, less creative
```

### "Want more conservative optimization"
Add to the prompt:
```javascript
// In llm-rule-optimizer.js, add to prompt:
IMPORTANT: Be VERY conservative. Only remove obvious duplicates.
```

---

## 🎓 Learning Over Time

The LLM learns from:

1. **Your corrections** in git commits
   - Sees what rules you added/removed
   - Patterns in commit messages
   - Diffs showing how rules evolved

2. **Duplication patterns**
   - Semantic understanding, not just text matching
   - Context-aware merging

3. **Usage patterns**
   - What rules reference each other
   - Which files trigger which rules

**Result**: Rules get smarter over time as the LLM learns your preferences.

---

## 🚀 Advanced: Real-Time Learning

For real-time learning (not just weekly):

**Option 1: Git Hook** (after every commit)
```bash
# .git/hooks/post-commit
#!/bin/bash
if [[ $(git log -1 --pretty=%B) =~ "rule" ]]; then
  pnpm rules:optimize
fi
```

**Option 2: Cursor Extension** (after corrections)
Could integrate with Cursor to trigger optimization when you correct the AI multiple times.

**Option 3: Manual Trigger**
Just run `pnpm rules:optimize` anytime you want.

---

## 📚 Further Reading

- [Anthropic API Docs](https://docs.anthropic.com/)
- [GitHub Actions Cron Syntax](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [Create Pull Request Action](https://github.com/peter-evans/create-pull-request)

---

**The goal**: Let AI maintain the AI's rules. You review and approve, but don't manually deduplicate anymore.
