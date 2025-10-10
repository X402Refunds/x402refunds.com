# Auto-Context System

Complete guide to the static context system that ensures Cursor always knows your codebase structure.

## System Overview

### Static Context Graph
- **File**: `.cursor/rules/codebase-context.mdc`
- **Auto-loaded**: By Cursor at every inference
- **Updated**: Every commit, merge, branch switch
- **Speed**: Instant (pre-loaded)
- **Coverage**: Complete file locations, asset inventory, commands, structure
- **Best for**: Everything - file locations, component lists, API endpoints, commands

## How It Works

```
New Chat Starts
    ↓
Static context loads instantly:
  - File locations
  - Asset inventory  
  - Commands
  - Complete structure
    ↓
User asks: "Add auth to Header AND update favicons"
    ↓
Cursor knows immediately:
  - Header at: dashboard/src/components/Header.tsx
  - Favicons at: dashboard/public/*.png
  - Auth handled in: convex/auth.ts
    ↓
Makes both changes correctly
```

## Quick Start

**Already working!** Git hooks are installed and context is auto-generated.

Verify it's working:
1. Make a code change
2. Commit: `git add . && git commit -m "test"`
3. Check: `.cursor/rules/codebase-context.mdc` updated
4. New chat: Ask "where are the favicons?"

## File Structure

```
consulate/
├── .cursor/
│   └── rules/
│       ├── codebase-context.mdc        # Auto-generated context
│       └── documentation-discipline.mdc # Rules for docs
├── scripts/
│   ├── generate-context-graph.js       # Context generator
│   └── install-hooks.js               # Git hooks installer
└── .git/hooks/
    ├── pre-commit                     # Update context on commit
    ├── post-merge                     # Update after pull
    └── post-checkout                  # Update on branch switch
```

## Available Commands

```bash
# Manual context update (rarely needed)
pnpm update-context

# Reinstall git hooks (if needed)
pnpm postinstall
```

## Automatic Updates

### What Triggers Context Regeneration

- Every `git commit` (pre-commit hook)
- Every `git pull` / `git merge` (post-merge hook)
- Every branch switch (post-checkout hook)
- Manual: `pnpm update-context`

## Example Queries

### What Static Context Answers

**File Locations:**
- "Where are the favicons?" → `dashboard/public/favicon*.png`
- "Show me all components" → Lists `dashboard/src/components/`
- "What tests exist?" → Lists `test/*.test.ts`
- "Where is authentication?" → `convex/auth.ts`, `convex/apiKeys.ts`

**Commands:**
- "How do I run tests?" → `pnpm test`
- "Deploy command?" → `pnpm deploy` (backend auto-deploys frontend via Vercel on push)
- "Build command?" → `pnpm build`

**Structure:**
- "Frontend vs backend?" → `dashboard/` vs `convex/`
- "Where is configuration?" → `package.json`, `tsconfig.json`, etc.
- "List all React components" → Full component inventory
- "Show all Convex functions" → Complete API listing

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

## Performance

- **Load time**: 0ms (pre-loaded in rules)
- **File size**: ~20-50KB
- **Update time**: 200-500ms on commit
- **No external dependencies**
- **Works offline**

## Best Practices

### Do's ✅
- Commit frequently (keeps context fresh)
- Trust the system (don't manual grep)
- Use for multi-file changes
- Ask location questions directly

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

## Technical Details

### Static Context Generation
- Language: Node.js (ES modules)
- Scans: All files except node_modules, dist, _generated
- Extracts: Exports, file types, sizes, purposes
- Format: Markdown (MDC)
- Output: `.cursor/rules/codebase-context.mdc`

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