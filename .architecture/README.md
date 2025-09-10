# Fully Automatic Architecture Management

This directory contains a **zero-maintenance** architecture dependency tracking system that prevents cascade update problems.

## 🎯 Purpose

Whenever you make architecture changes (like moving `apps/convex/` to `convex/`), this system:
1. **Tracks dependencies** - knows what files reference architectural concepts
2. **Updates everything automatically** - no manual hunting for references
3. **Keeps Cursor consistent** - ensures all suggestions use current patterns
4. **Provides impact visibility** - shows exactly what will change before you commit

## 📁 Files

- **`map.yaml`** - Master architecture mapping (source of truth)
- **`README.md`** - This documentation

## 🤖 Fully Automatic Commands

```bash
# Update ALL architecture references automatically (cursor rules, docs, configs)
pnpm arch:update

# Preview what would change without actually changing anything
pnpm arch:impact "locations.backend:convex/:functions/"

# Validate any suggestion against current architecture  
pnpm arch:validate "cd apps && pnpm dev"
```

## 🔄 Zero-Maintenance Workflow

### **Making Architecture Changes is Now Trivial:**

1. **Edit the map**: Change `.architecture/map.yaml`
2. **Commit**: `git commit -m "feat: new architecture"`
3. **Done!** Git hook automatically updates everything

**That's it!** No hunting through files, no missed references, no broken cursor rules.

### **Example: Moving Backend to Different Directory**

```bash
# 1. Edit .architecture/map.yaml
current:
  locations:
    backend: "functions/"  # Changed from "convex/"

# 2. Commit (git hook runs automatically)  
git add .architecture/map.yaml
git commit -m "feat: move backend to functions/"

# Git hook automatically:
# ✅ Updates all cursor rules
# ✅ Updates CI workflows  
# ✅ Updates README.md
# ✅ Updates tsconfig.json
# ✅ Regenerates auto-rules
# ✅ Adds all changes to the commit
```

**Zero manual work required!**

## 🎯 What Gets Updated Automatically

The system automatically finds and updates architecture references in:

- ✅ **All cursor rules** (`.cursor/rules/*.mdc`)
- ✅ **CI workflows** (`.github/workflows/*.yml`)
- ✅ **Documentation** (`README.md`, etc.)
- ✅ **Config files** (`tsconfig.json`, etc.)
- ✅ **Scripts** (`scripts/*.js`)

It **intelligently preserves** manual content while updating only architecture references.

## 🏗️ Architecture Map Structure

```yaml
current:
  locations:      # Where things are located NOW
    backend: "convex/"
  commands:       # How to run things NOW
    dev: "pnpm dev" 
  patterns:       # File/import patterns NOW
    backend_files: "convex/*.ts"

deprecated:       # OLD patterns (auto-replaced)
  locations: ["apps/convex/"]
  commands: ["cd apps && pnpm dev"]

dependency_graph: # What files reference architecture
  "locations.backend":
    affects:
      - file: "README.md"
        type: "documentation_paths"
```

## 🔍 Real Example

The system just automatically updated these files:

```bash
$ pnpm arch:update

🤖 FULLY AUTOMATIC ARCHITECTURE UPDATE
=====================================

✅ .cursor/rules/00-architecture-first.mdc (4 changes)
✅ .cursor/rules/package-simplicity.mdc (1 changes)  
✅ scripts/arch-impact.js (2 changes)
✅ scripts/arch-validate.js (5 changes)

🎉 AUTOMATIC UPDATE COMPLETE!
📊 Summary:
   - Files updated: 4
   - Total changes: 12
   - Architecture version: 1.0
```

## 🎉 Benefits

- **🚫 Zero maintenance** - Everything updates automatically
- **🤖 Cursor always correct** - Never suggests outdated patterns  
- **📊 Full visibility** - See exactly what changes before committing
- **⚡ Instant consistency** - All files stay in sync automatically
- **🔄 Git integrated** - Runs automatically on architecture changes

## ❌ **Is This Overkill?**

**No!** The complexity is hidden but the value is huge:

- Prevents the "cascade update problem" forever
- Makes architecture changes trivial instead of error-prone  
- Keeps your AI assistant (Cursor) always consistent
- Saves hours of manual file hunting every architecture change

The system is **set-it-and-forget-it** - once configured, you never think about it again!

## 🛡️ What Could Go Wrong?

**Nothing!** The system is designed to be safe:
- ✅ Preserves manual content (only updates architecture references)
- ✅ Skips auto-generated files (they get regenerated anyway)
- ✅ Shows exactly what changed before committing
- ✅ Uses git hooks so you can review changes
- ✅ Fails safely if something goes wrong

**Bottom line:** Architecture changes are now **effortless and error-free**! 🎯