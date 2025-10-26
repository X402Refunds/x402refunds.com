# Deployment Guide

This guide explains the deployment process for the Consulate micro-dispute resolution platform using Convex backend.

## Overview

The system uses a single Convex deployment:
- **Backend**: Convex serverless functions and HTTP routes
- **API Base URL**: `https://youthful-orca-358.convex.site`
- **Convex URL**: `https://youthful-orca-358.convex.cloud`
- **Deployment Type**: Single deployment (currently `dev` type, serves as production)

## Repository Structure

```
consulate/
├── convex/            # Backend serverless functions and HTTP routes
├── test/              # Test files
└── internal/          # Internal documentation
```

## Development Workflow

### Setup
1. Install dependencies: `pnpm install`
2. Authenticate with Convex: `pnpm exec convex dev` (first time)
3. Development mode: `pnpm exec convex dev`

### Available Commands
- **Deploy to production**: `pnpm deploy` - Deploys to Convex (auto-confirms)
- **Development mode**: `pnpm deploy:dev` - One-time dev build
- **Run all tests**: `pnpm test:run` - Full test suite
- **Run production smoke tests**: `API_BASE_URL=https://youthful-orca-358.convex.site pnpm test:smoke`
- **Type checking**: `pnpm type-check` - Validates TypeScript
- **Check logs**: `pnpm check-logs` - View Convex logs

## Deployment Process

### ✅ CORRECT Deployment Commands

#### Deploy to Production
```bash
pnpm deploy
# OR
pnpm exec convex deploy --yes
```

**What this does:**
- Compiles TypeScript functions
- Deploys to your configured Convex deployment
- Updates HTTP routes
- Returns deployment URL

#### Development Build
```bash
pnpm deploy:dev
# OR
pnpm exec convex dev --once
```

### ❌ INCORRECT Commands (DO NOT USE)

These commands **DO NOT WORK** and will cause errors:

```bash
# ❌ WRONG - --prod flag doesn't exist
pnpm exec convex deploy --prod

# ❌ WRONG - --preview-name requires preview deployment setup
pnpm exec convex deploy --preview-name preview

# ❌ WRONG - --prod flag doesn't exist for logs
pnpm convex logs --prod
```

### Understanding Convex URLs

**IMPORTANT:** Convex has TWO different URL formats:

1. **`.convex.cloud` - Internal Convex API** (for Convex client connections)
   - Example: `https://youthful-orca-358.convex.cloud`
   - Used by: Convex client SDK, database queries
   - NOT accessible via browser/curl for HTTP routes

2. **`.convex.site` - Public HTTP Routes** (for API endpoints)
   - Example: `https://youthful-orca-358.convex.site`
   - Used by: MCP endpoints, payment dispute API, webhooks
   - Accessible via browser/curl/HTTP clients

### How It Works
- **HTTP Routes**: Defined in `convex/http.ts`, deployed to `.convex.site`
- **Convex Functions**: Mutations/queries in `convex/*.ts`, accessed via Convex client
- **MCP Discovery**: `https://youthful-orca-358.convex.site/.well-known/mcp.json`
- **Payment Disputes API**: `https://youthful-orca-358.convex.site/api/payment-disputes`

## Environment Configuration

Configuration files:
- `convex.json` - Convex configuration with HTTP action support
- `.env.local` - Contains `CONVEX_URL=https://youthful-orca-358.convex.cloud`
- Environment variables set in Convex dashboard

## Testing

### Local Testing (Recommended)
```bash
# Run all tests against local Convex instance
pnpm test:run
```

### Production Smoke Tests
```bash
# Test against deployed HTTP endpoints
API_BASE_URL=https://youthful-orca-358.convex.site pnpm test:smoke
```

**Expected Results:**
- 388+ tests passing
- Production smoke tests: 13/13 passing
- Some notification/webhook tests may fail (non-critical endpoints)

## Troubleshooting

### Common Issues

#### 1. HTTP Routes Return 404
**Problem:** Testing `https://youthful-orca-358.convex.cloud/.well-known/mcp.json` returns 404

**Solution:** Use `.convex.site` domain instead:
```bash
curl https://youthful-orca-358.convex.site/.well-known/mcp.json
```

#### 2. Preview Deployment Fails
**Problem:** `pnpm run deploy:preview` returns "PreviewNotFound"

**Solution:** Preview deployments aren't configured. Use main deployment:
```bash
pnpm deploy
```

#### 3. Deploy Command Fails with "unknown option --prod"
**Problem:** `pnpm exec convex deploy --prod` fails

**Solution:** The `--prod` flag doesn't exist. Use:
```bash
pnpm exec convex deploy --yes
```

#### 4. Tests Pass Locally But API Returns Errors
**Problem:** Tests pass but HTTP endpoints fail

**Solution:** Check you're testing the right URL:
- Tests use Convex client (`.convex.cloud`)
- HTTP routes use `.convex.site`

### Verification Checklist

- ✅ **Deployment successful**: `pnpm deploy` completes without errors
- ✅ **MCP endpoint works**: `curl https://youthful-orca-358.convex.site/.well-known/mcp.json` returns JSON
- ✅ **Tests passing**: `pnpm test:run` shows 388+ passing tests
- ✅ **Smoke tests pass**: Production smoke tests show 13/13 passing
- ✅ **Logs accessible**: `pnpm check-logs` shows recent activity

### Quick Reference

| Task | Command | Notes |
|------|---------|-------|
| Deploy | `pnpm deploy` | Deploys to production |
| Dev mode | `pnpm exec convex dev` | Watch mode with hot reload |
| Test all | `pnpm test:run` | Run full test suite |
| Smoke tests | `API_BASE_URL=https://youthful-orca-358.convex.site pnpm test:smoke` | Test HTTP endpoints |
| View logs | `pnpm check-logs` | View Convex logs |
| Type check | `pnpm type-check` | Validate TypeScript |
