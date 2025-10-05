# Rule System Redesign - Real-Time Learning Architecture

## Problem Statement

**Current State**: 14 rule files, 57 duplicate sections, ~6 rules loaded per chat
**Result**: Context bloat → Model hallucination, wasted tokens, slow responses

## Solution Architecture

### Phase 1: Immediate Deduplication (Today)

#### 1.1 Compress Core Rules

**`.cursorrules`** - Reduce from 467 lines to ~100 lines:
- Remove ALL quality check details → Reference only: "Run `pnpm lint && pnpm type-check && pnpm build`"
- Remove ALL deployment details → Keep only: "NEVER auto-deploy"
- Remove ALL architecture details → Keep only: "Backend: convex/, Frontend: dashboard/"
- Remove ALL testing workflows → Reference only: "Tests required before commit"

**Savings**: 367 lines removed = ~1500 tokens saved per chat

#### 1.2 Delete Redundant Rules

**Delete these files** (content absorbed elsewhere):
- ❌ `code-quality-checks.mdc` → 460 lines, 100% duplicate of `.cursorrules`
- ❌ `rule-enforcement.mdc` → Meta-rule, enforcement through learning system instead
- ❌ `context-trust.mdc` → 180 lines, merge key points into `.cursorrules`

**Savings**: ~800 lines removed = ~3200 tokens saved per chat

#### 1.3 Consolidate Related Rules

**Merge these pairs**:
- `ci-cd-workflow.mdc` + `commit-standards.mdc` → **`git-and-ci.mdc`** (focus on actionable commands only)
- `agent-coordination.mdc` + `prompt-architecture.mdc` → **`agent-patterns.mdc`** (both about agent architecture)
- `legal-compliance.mdc` + `constitutional-governance.mdc` → **`compliance.mdc`** (both about legal compliance)

**Result**: 14 files → 9 files

#### 1.4 Context Budget Allocation

| Rule File | Size (lines) | Tokens (~) | When Loaded |
|-----------|--------------|------------|-------------|
| `.cursorrules` | 100 | 400 | Always |
| `codebase-context.mdc` | 291 | 1200 | Always |
| Context-triggered rules | ~150 each | ~600 | On demand |
| **Total per chat** | **~400** | **~1600** | **60% reduction** |

---

### Phase 2: Context-Aware Rule Loading (Week 1)

#### 2.1 Trigger-Based Rule System

**Implement smart loading** based on:

```typescript
// .cursor/rule-triggers.json
{
  "triggers": {
    "filePatterns": {
      "convex/**/*.ts": ["convex-patterns.mdc"],
      "dashboard/**/*.tsx": [],
      ".github/workflows/**": ["git-and-ci.mdc"],
      "test/**/*.test.ts": []
    },
    
    "commandPatterns": {
      "commit": ["git-and-ci.mdc"],
      "deploy": ["convex-patterns.mdc"],
      "quality": [] // Already in core rules
    },
    
    "intentPatterns": {
      "agent.*coordination": ["agent-patterns.mdc"],
      "legal|compliance|constitutional": ["compliance.mdc"],
      "package.*architecture": ["package-architecture.mdc"]
    }
  },
  
  "loadingPolicy": {
    "maxRulesPerChat": 3,
    "alwaysLoadCore": true,
    "prioritizeRecent": true
  }
}
```

**Implementation**: Modify Cursor's rule loading (if possible) or add context hints in core rules.

#### 2.2 Rule Reference System

**Instead of duplicating**, use references:

```markdown
<!-- In .cursorrules -->
## Quality Checks
After code changes, run: `pnpm lint && pnpm type-check && pnpm build`

See `quality-checks-reference.md` for troubleshooting.
<!-- NOT loaded by default, only when errors occur -->
```

---

### Phase 3: Real-Time Learning Loop (Week 2)

#### 3.1 Correction Tracking System

**Automatic pattern detection**:

```javascript
// scripts/rule-learning-system.js (already created)

// When user says: "Stop creating summary documents"
// System detects: correction_pattern = "create documents"
// Action: Update rule to add anti-pattern

// After 2 corrections of same pattern:
// → Auto-update .cursorrules with strengthened language
// → Add to "NEVER do X" section
// → Log update for user review
```

**Learning triggers**:
- User says "I told you before" → Detect pattern, update rule
- User corrects same mistake 2+ times → Auto-strengthen rule
- User says "never do X" → Add to anti-patterns immediately

#### 3.2 Auto-Deduplication Cron

**Weekly automated cleanup**:

```bash
# Add to package.json
"rules:weekly-cleanup": "node scripts/rule-learning-system.js deduplicate --auto"

# Runs via git hook or cron:
1. Detect duplicate sections (> 70% similarity)
2. Merge duplicates into canonical location
3. Update references
4. Create PR with changes for review
```

#### 3.3 Rule Evolution Dashboard

**Track learning metrics**:
```bash
pnpm rules:stats

📊 Rule System Health
━━━━━━━━━━━━━━━━━━━━━━
Total Rules: 9 files
Total Size: 1,200 lines (60% reduction)
Avg Load per Chat: 1.8 rules
Duplicates Detected: 0
Context Budget: 1600/4000 tokens (40%)

📈 Learning Stats (Last 7 Days)
━━━━━━━━━━━━━━━━━━━━━━
Corrections Tracked: 3
Auto-Updates: 1
Rules Strengthened: 1
Dedup Runs: 1
```

---

### Phase 4: Advanced Learning (Future)

#### 4.1 Correction → Rule Pipeline

```mermaid
User Correction
    ↓
Pattern Detection (NLP)
    ↓
Check Frequency (>= 2?)
    ↓ YES
Rule Update Candidate
    ↓
Similarity Check (existing rule?)
    ↓ YES → Strengthen
    ↓ NO → Create New
Auto-Commit + Notify User
```

#### 4.2 Context Window Optimization

**Dynamic compression**:
- Large rules auto-summarize when context is tight
- Examples removed if not relevant to current task
- Verbose explanations compressed to bullet points
- Load only essential sections, not entire files

#### 4.3 Rule Versioning

**Track rule evolution**:
```bash
git log .cursor/rules/

# See rule changes over time
# Revert if a rule update causes issues
# A/B test rule effectiveness
```

---

## Implementation Plan

### Today (Immediate - 1 hour)

1. ✅ Create `rule-learning-system.js` script (done)
2. ✅ Run duplication analysis (done)
3. ⏳ Compress `.cursorrules` to 100 lines
4. ⏳ Delete `code-quality-checks.mdc`
5. ⏳ Delete `rule-enforcement.mdc`
6. ⏳ Delete `context-trust.mdc`
7. ⏳ Test reduced context load

**Expected Result**: Context load reduced from ~4000 tokens to ~1600 tokens (60% reduction)

### This Week (Phase 2 - 2 hours)

1. Merge related rule files (6 merges)
2. Create `rule-triggers.json` for context-aware loading
3. Add reference system for large rule content
4. Implement weekly dedup cron

**Expected Result**: Rules only load when relevant to current task

### Next Week (Phase 3 - 3 hours)

1. Implement correction tracking in learning system
2. Add auto-update logic (2+ corrections → rule update)
3. Create `rules:stats` dashboard command
4. Set up auto-deduplication weekly run

**Expected Result**: Rules self-update based on your corrections

---

## Success Metrics

### Before (Current State)
- 14 rule files
- 57 duplicate sections
- ~4000 tokens per chat
- 6 rules always loaded
- Manual updates only
- Frequent hallucinations

### After (Target State)
- 9 rule files (-36%)
- 0 duplicates (-100%)
- ~1600 tokens per chat (-60%)
- 1-3 rules context-loaded (-50%)
- Auto-learning from corrections
- Reduced hallucinations

---

## Key Architectural Decisions

### 1. **Lean Core, Rich Context**
- Core rules: Ultra-minimal, always loaded
- Contextual rules: Rich details, loaded on demand

### 2. **Learn, Don't Repeat**
- Track corrections automatically
- Update rules after 2+ repeated corrections
- Strengthen language based on frequency

### 3. **Deduplicate Continuously**
- Weekly automated dedup runs
- Merge similar content
- Reference instead of duplicate

### 4. **Context Budget First**
- Always respect token limits
- Compress when needed
- Prioritize actionable over verbose

---

## Next Steps for You

### Option 1: Aggressive Cleanup (Recommended)
```bash
# I immediately compress .cursorrules and delete redundant files
# Risk: Low
# Benefit: Immediate 60% context reduction
# Time: 15 minutes
```

### Option 2: Safe Incremental
```bash
# I compress one rule at a time, you review each
# Risk: None
# Benefit: Gradual improvement
# Time: 1-2 hours over several days
```

### Option 3: Full Implementation
```bash
# I implement entire Phase 1-3 system today
# Risk: Medium (needs testing)
# Benefit: Complete solution in one go
# Time: 2-3 hours
```

---

## My Recommendation

**Do Option 1 (Aggressive Cleanup) RIGHT NOW**:

1. Compress `.cursorrules` from 467 → 100 lines
2. Delete 3 redundant rule files
3. Merge 3 pairs of related rules
4. **Result**: Context load drops 60% immediately

Then **gradually implement learning system** (Phase 2-3) over next week as we work together.

**This gives you immediate relief from context bloat while building the foundation for real-time learning.**

---

## The Big Picture

You're building a **self-improving AI assistant** that:
- ✅ Learns from your corrections in real-time
- ✅ Updates its own rules automatically
- ✅ Deduplicates content continuously
- ✅ Loads only relevant context per task
- ✅ Respects context window budgets
- ✅ Gets better with every interaction

**This is the antidote to rule bloat and hallucination.**

---

What do you want to do? Aggressive cleanup now, or incremental approach?
