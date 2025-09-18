# Architecture Automation

The architecture rules in `.cursor/rules/01-auto-architecture.mdc` and `.cursor/rules/02-auto-validation.mdc` are automatically kept in sync with `.architecture/map.yaml`.

## Automatic Updates

### 🔄 File Watcher (Development)
```bash
# Watch .architecture/map.yaml and auto-regenerate when it changes
npm run arch:watch

# Run both Convex dev server AND architecture watcher
npm run dev:full
```

### 📋 Git Hook (Commit Safety)
Automatically updates architecture files when `.architecture/map.yaml` is modified in a commit.

Setup runs automatically via `postinstall`, but you can also run manually:
```bash
npm run setup:hooks
```

### 🛠️ Manual Update
```bash
# Run manually anytime
npm run arch:update
```

## How It Works

1. **File Watcher**: `chokidar` monitors `.architecture/map.yaml`
2. **Auto-Regeneration**: When the file changes, runs `scripts/arch-auto-update.js`
3. **Git Safety**: Pre-commit hook ensures files are current before commits
4. **Zero Maintenance**: No need to remember to run update commands

## Development Workflow

**Option A: With Auto-Updates**
```bash
npm run dev:full  # Convex + architecture watcher
```

**Option B: Standard (Manual Updates)**
```bash
npm run dev      # Just Convex
npm run arch:update  # When you modify .architecture/map.yaml
```

The automation ensures `.cursor/rules/01-auto-architecture.mdc` and `.cursor/rules/02-auto-validation.mdc` are always current with your architecture changes.
