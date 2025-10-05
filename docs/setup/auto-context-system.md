# Auto-Context System

Complete guide to the hybrid context system that ensures Cursor always knows your codebase structure.

## System Overview

The system uses **two complementary layers**:

### Layer 1: Static Context Graph (Always On)
- **File**: `.cursor/rules/codebase-context.mdc`
- **Auto-loaded**: By Cursor at every inference
- **Updated**: Every commit, merge, branch switch
- **Speed**: Instant (pre-loaded)
- **Coverage**: High-level structure, file locations, commands
- **Best for**: "Where is X?", "List all Y", multi-task queries

### Layer 2: Supabase RAG (On-Demand)
- **Backend**: Supabase PostgreSQL + pgvector
- **Accessed**: Via MCP server during inference
- **Updated**: Every commit (incremental)
- **Speed**: 50-100ms per query
- **Coverage**: Deep file contents, semantic relationships
- **Best for**: "How does X work?", "Show similar to Y"

## How They Work Together

```
New Chat Starts
    ↓
Layer 1 (Static) loads instantly:
  - File locations
  - Asset inventory  
  - Commands
  - High-level structure
    ↓
User asks: "Add auth to Header AND update favicons"
    ↓
Cursor uses static context:
  - Header at: dashboard/src/components/Header.tsx
  - Favicons at: dashboard/public/*.png
    ↓
Cursor asks Supabase (Layer 2):
  "Show me authentication implementation details"
    ↓
Supabase returns:
  - convex/auth.ts (full content)
  - Related files, dependencies
    ↓
Cursor has complete context:
  - Broad map (static)
  - Deep understanding (RAG)
    ↓
Makes both changes correctly
```

## Quick Start

### Phase 1: Static Context (Required)

**Already done!** Git hooks are installed and context is generated.

Verify it's working:
1. Make a code change
2. Commit: `git add . && git commit -m "test"`
3. Check: `.cursor/rules/codebase-context.mdc` updated
4. New chat: Ask "where are the favicons?"

### Phase 2: Supabase RAG (Optional Enhancement)

Follow: `docs/setup/supabase-rag-setup.md`

## File Structure

```
consulate/
├── .cursor/
│   ├── rules/
│   │   ├── codebase-context.mdc        # Auto-generated (Layer 1)
│   │   └── documentation-discipline.mdc # Rules for docs
│   └── mcp.json                         # Supabase MCP config
├── scripts/
│   ├── generate-context-graph.js       # Layer 1 generator
│   ├── index-to-supabase.js           # Layer 2 indexer
│   ├── install-hooks.js               # Git hooks installer
│   └── supabase-schema.sql            # Database schema
├── .git/hooks/
│   ├── pre-commit                     # Update context on commit
│   ├── post-merge                     # Update after pull
│   └── post-checkout                  # Update on branch switch
└── .env.local                         # Supabase credentials (Phase 2)
```

## Available Commands

### Static Context (Layer 1)
```bash
# Manual context update (rarely needed)
pnpm update-context

# Reinstall git hooks (if needed)
pnpm postinstall
```

### Supabase RAG (Layer 2)
```bash
# Full codebase index
pnpm index-supabase --full

# Incremental update (only changed files)
pnpm index-supabase
```

## Automatic Updates

### What Triggers Context Regeneration

**Static Context:**
- Every `git commit` (pre-commit hook)
- Every `git pull` / `git merge` (post-merge hook)
- Every branch switch (post-checkout hook)
- Manual: `pnpm update-context`

**Supabase RAG:**
- Currently manual: `pnpm index-supabase`
- Recommended: Run after major changes
- Can add to git hooks if desired

## Example Queries

### Static Context Answers

**File Locations:**
- "Where are the favicons?" → `dashboard/public/favicon*.png`
- "Show me all components" → Lists `dashboard/src/components/`
- "What tests exist?" → Lists `test/*.test.ts`

**Commands:**
- "How do I run tests?" → `pnpm test`
- "Deploy command?" → `pnpm deploy` (backend), `pnpm deploy:frontend`

**Structure:**
- "Frontend vs backend?" → `dashboard/` vs `convex/`
- "Where is configuration?" → `package.json`, `tsconfig.json`, etc.

### Supabase RAG Answers

**Implementation Details:**
- "How does authentication work?" → Full `convex/auth.ts` content
- "Show Header component code" → Complete component with imports

**Semantic Search:**
- "Find components similar to Header" → Related UI components
- "Show all files about cases" → Cases, evidence, related files

**Dependency Queries:**
- "What imports Header?" → Dependency graph
- "What does CaseForm depend on?" → Import chain

## Troubleshooting

### Static Context Not Updating

**Check git hooks:**
```bash
ls -la .git/hooks/
# Should show: pre-commit, post-merge, post-checkout
```

**Reinstall hooks:**
```bash
pnpm postinstall
```

**Manual update:**
```bash
pnpm update-context
```

### Context File Not Loading

**Verify file exists:**
```bash
ls -la .cursor/rules/codebase-context.mdc
```

**Check file is recent:**
```bash
# Should show today's date
head -3 .cursor/rules/codebase-context.mdc
```

**Restart Cursor:**
```bash
# Completely quit and reopen
# Cmd+Q on Mac, then reopen
```

### Supabase Not Working

See: `docs/setup/supabase-rag-setup.md` troubleshooting section

## Performance

### Static Context
- **Load time**: 0ms (pre-loaded in rules)
- **File size**: ~20-50KB
- **Update time**: 200-500ms on commit
- **No external dependencies**

### Supabase RAG
- **Query time**: 50-100ms
- **Index time**: 5-10 min (full), 10-30s (incremental)
- **Storage**: ~5-10MB per 1000 files
- **Requires**: Internet, Supabase account

## Best Practices

### Do's ✅
- Commit frequently (keeps context fresh)
- Use static context for multi-task queries
- Use Supabase for deep understanding
- Trust the system (don't manual grep)

### Don'ts ❌
- Don't create random .md files (see documentation-discipline.mdc)
- Don't edit codebase-context.mdc manually (auto-generated)
- Don't skip commits to avoid updates (happens in milliseconds)
- Don't bypass git hooks (`--no-verify`)

## Benefits

### For Solo Development
- Never forget where files are
- Instant context in new chats
- No repeated grepping
- Faster AI responses

### For Teams
- Shared context across team
- Consistent file organization
- Onboarding assistance
- Reduces "where is X?" questions

### For Large Codebases
- Scales to 10,000+ files
- Performance stays constant
- No manual maintenance
- Always up-to-date

## What's Next

After setup:
1. Test with simple queries ("where are favicons?")
2. Try multi-task requests
3. Optionally set up Supabase RAG
4. Enjoy never grepping again!

## Comparison: Before vs After

### Before (Manual Grepping)
```
User: "Add auth to Header"
    ↓
AI: "Let me search for Header..."
    ↓
grep -r "Header" --include="*.tsx"
    ↓
(20+ matches, need to grep more)
    ↓
grep -r "export.*Header"
    ↓
Found it! Now for auth...
    ↓
grep -r "auth" convex/
    ↓
(Many matches, which is right?)
    ↓
Total time: 30-60 seconds
```

### After (Auto-Context)
```
User: "Add auth to Header"
    ↓
AI: (Already knows from context)
  - Header: dashboard/src/components/Header.tsx
  - Auth: convex/auth.ts
    ↓
Makes changes immediately
    ↓
Total time: 0 seconds
```

## Support

Questions or issues?
- Check this guide
- See: `docs/setup/supabase-rag-setup.md`
- Review: `.cursor/rules/documentation-discipline.mdc`

## Technical Details

### Static Context Generation
- Language: Node.js (ES modules)
- Scans: All files except node_modules, dist, _generated
- Extracts: Exports, file types, sizes
- Format: Markdown (MDC)
- Output: `.cursor/rules/codebase-context.mdc`

### Supabase RAG
- Database: PostgreSQL with pgvector
- Embeddings: OpenAI text-embedding-ada-002 (1536 dims)
- Search: Cosine similarity (HNSW index)
- Updates: Incremental (git diff)
- Chunks: 2000 chars per chunk

### Git Hooks
- pre-commit: Update context before commit
- post-merge: Regenerate after pull
- post-checkout: Update on branch switch
- All hooks: Silent on success, error on failure

## Customization

### Adjust Context Granularity

Edit `scripts/generate-context-graph.js`:

```javascript
// Show more/fewer files
components.slice(0, 20)  // Change 20 to desired count

// Add custom sections
## Custom Section
${customFiles.map(f => `- ${f.path}`).join('\n')}
```

### Add Custom Patterns

```javascript
const FILE_PATTERNS = {
  components: /\.tsx$/,
  apis: /convex\/.*\.ts$/,
  // Add your patterns:
  styles: /\.css$/,
  utilities: /utils\/.*\.ts$/
};
```

### Change Update Triggers

Edit `.git/hooks/pre-commit` to skip on certain conditions:

```bash
# Only update if certain files changed
if git diff --cached --name-only | grep -q "\.ts\|\.tsx"; then
  node scripts/generate-context-graph.js
fi
```

Happy coding with full context! 🚀
