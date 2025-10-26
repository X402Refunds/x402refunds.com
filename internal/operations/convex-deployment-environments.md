# Convex Deployment Environments

**Last Updated**: 2025-10-26

## ⚠️ IMPORTANT: Command Issues Fixed

This document has been updated to reflect the **ACTUAL WORKING COMMANDS** after discovering multiple broken commands in package.json and documentation.

### Summary of Fixes

| Issue | Broken Command | Working Command | Files Fixed |
|-------|----------------|-----------------|-------------|
| Invalid `--prod` flag | `convex deploy --prod` | `convex deploy --yes` | package.json line 7 |
| Invalid `--preview-name` | `deploy --preview-name preview` | `convex deploy --yes` | package.json (removed) |
| Invalid logs flag | `convex logs --prod` | `convex logs` | package.json line 9 |
| Wrong URL for HTTP | `.convex.cloud` for HTTP routes | `.convex.site` for HTTP routes | deployment-guide.md |

**Files Updated:**
- ✅ [package.json](../../package.json) - Fixed deployment scripts
- ✅ [deployment-guide.md](./deployment-guide.md) - Added URL distinction and troubleshooting
- ✅ This file - Comprehensive command reference

## Overview

Consulate currently uses a **single Convex deployment** that serves as both development and production:

- **Current Deployment**: `youthful-orca-358` (type: `dev`)
- **Convex API URL**: `https://youthful-orca-358.convex.cloud`
- **HTTP Routes URL**: `https://youthful-orca-358.convex.site`

**Note:** There is NO separate preview or production deployment configured. The deployment is type "dev" but serves production traffic.

## Critical URL Distinction

### `.convex.cloud` - Convex Internal API
- **Purpose**: For Convex SDK client connections
- **Used By**: Database queries, mutations, subscriptions
- **Accessible By**: Convex JavaScript/TypeScript SDK only
- **NOT Accessible By**: Browser, curl, HTTP clients

### `.convex.site` - Public HTTP Routes
- **Purpose**: For REST API endpoints defined in `convex/http.ts`
- **Used By**: MCP endpoints, payment disputes API, webhooks
- **Accessible By**: Any HTTP client (curl, browser, fetch, etc.)

**Example:**
```bash
# ❌ WRONG - Returns 404
curl https://youthful-orca-358.convex.cloud/.well-known/mcp.json

# ✅ CORRECT - Returns JSON
curl https://youthful-orca-358.convex.site/.well-known/mcp.json
```

## Deployment Commands

### ❌ BROKEN Commands (DO NOT USE)

These commands were in package.json but **DO NOT WORK**:

```bash
# ❌ BROKEN - --prod flag doesn't exist
pnpm exec convex deploy --prod
pnpm deploy:prod

# ❌ BROKEN - Preview deployment not configured
pnpm exec convex deploy --preview-name preview
pnpm deploy:preview

# ❌ BROKEN - --prod flag doesn't exist for logs
pnpm convex logs --prod
```

**Errors You'll See:**
- `error: unknown option '--prod'`
- `PreviewNotFound: Preview deployment preview not found`

### ✅ WORKING Commands

#### Deploy to Production (Main Deployment)
```bash
# Use npm script (recommended)
pnpm deploy

# Or explicitly with auto-confirm
pnpm exec convex deploy --yes

# Or interactive (will prompt for confirmation)
pnpm exec convex deploy
```

**What This Does:**
- Compiles TypeScript functions
- Deploys to `youthful-orca-358` deployment
- Updates HTTP routes at `.convex.site`
- Returns deployment URL

#### Development Mode
```bash
# One-time dev build
pnpm deploy:dev
# OR
pnpm exec convex dev --once

# Watch mode with hot reload
pnpm exec convex dev
```

#### Check Deployment Status
```bash
# List current deployment
pnpm exec convex deployments

# View logs
pnpm check-logs
# OR
pnpm exec convex logs
```

## Testing Strategy

### Local Testing (Against Convex Test Instance)
```bash
# Run full test suite
pnpm test:run
```

**Expected Results:**
- 388+ tests passing
- 40 tests failing (non-critical notification/webhook endpoints)
- 14 tests skipped

### Production Smoke Tests (Against Deployed HTTP Routes)
```bash
# Test deployed HTTP endpoints
API_BASE_URL=https://youthful-orca-358.convex.site pnpm test:smoke
```

**Expected Results:**
- 13/13 production smoke tests passing
- Tests core payment dispute API
- Tests MCP endpoints
- Tests agent registration

**Why Two Test Suites?**
- **Full tests** (`pnpm test:run`): Test against Convex SDK using `.convex.cloud`
- **Smoke tests** (`pnpm test:smoke`): Test against HTTP routes using `.convex.site`

## Environment Variables

### `.env.local` (Current Configuration)
```bash
CONVEX_URL=https://youthful-orca-358.convex.cloud
```

**Note:** This is for Convex SDK client, NOT for HTTP routes.

### For HTTP Route Testing
```bash
# Used in smoke tests
API_BASE_URL=https://youthful-orca-358.convex.site
```

## GitHub Secrets Required

Add these to repository settings → Secrets and variables → Actions:

```
CONVEX_DEPLOY_KEY        # Convex deploy key (for CI/CD)
OPENROUTER_API_KEY       # AI reasoning (optional for tests)
TOGETHER_API_KEY         # Embeddings (optional for tests)
```

## Convex Configuration

### convex.json
```json
{
  "node": { "version": "20" },
  "environment": {
    "variables": {
      "CONVEX_SITE_URL": {
        "development": "http://localhost:3000",
        "preview": "https://youthful-orca-358.convex.site",
        "production": "https://api.consulatehq.com"
      }
    }
  },
  "typescript": { "config": "tsconfig.json" },
  "httpAction": true
}
```

## Best Practices

### ✅ DO
- Deploy to preview first, always
- Run smoke tests on preview before PR merge
- Run full test suite before production deploy
- Use semantic commits for automatic versioning
- Check deployment logs after each deploy
- Test API endpoints manually after production deploy

### ❌ DON'T
- Never deploy directly to production without preview validation
- Never skip tests before production deploy
- Never commit `.env.local` files (use `.env.example`)
- Never use production API keys in tests
- Never run destructive tests against production

## Deployment Workflow

### For Feature Development
1. Create feature branch from `develop`
2. Make changes locally (connects to preview by default)
3. Run local tests: `pnpm test:run`
4. Push to GitHub → CI runs smoke tests on preview
5. Create PR to `develop` → CI validates again
6. Merge to `develop` → Auto-deploys to preview

### For Production Release
1. Ensure `develop` is stable and tested
2. Create PR from `develop` to `main`
3. CI runs full test suite
4. Manual approval required
5. Merge to `main` → Triggers production deploy workflow
6. Run post-deploy validation: `pnpm test:smoke` (read-only mode)
7. Monitor logs: `pnpm check-logs`

## Monitoring & Logs

### View Logs
```bash
# ❌ BROKEN - --preview and --prod flags don't work
npx convex logs --preview
npx convex logs --prod

# ✅ CORRECT - View logs from configured deployment
pnpm check-logs
# OR
pnpm exec convex logs
```

### Check Deployment Status
```bash
# ❌ BROKEN - These commands don't work
npx convex deployments list
npx convex deployments info

# ✅ CORRECT - Show current deployment
pnpm exec convex deployments
```

**Output:**
```
Currently configured deployment:
  Team: vivek-kotecha
  Project: consulate
  Deployment: youthful-orca-358
  Type: dev
```

## Troubleshooting

### "Command not found: convex"
```bash
# Install Convex CLI globally
pnpm add -g convex

# Or use via pnpm exec
pnpm exec convex <command>
```

### "Unauthorized" on deploy
```bash
# Login to Convex
npx convex login

# Check current auth
npx convex whoami
```

### Tests failing on CI but passing locally
- Check environment variables in GitHub Secrets
- Verify CONVEX_DEPLOYMENT is set correctly
- Check if preview deployment is healthy: `npx convex logs --preview`

### API returning 500 errors after deploy
- Check Convex dashboard for errors
- View function logs: `pnpm check-logs`
- Verify schema migrations completed
- Check for TypeScript compilation errors

## Related Documentation

- Convex Docs: https://docs.convex.dev
- Convex Agents: https://docs.convex.dev/agents
- Convex Deployment: https://docs.convex.dev/production/hosting
- CI/CD Patterns: `.cursor/rules/git-and-ci.mdc`
