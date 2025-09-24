# Deployment Guide

This guide explains the simplified deployment process for the Consulate Agent Governance OS using a single Convex-based deployment.

## Overview

The system now uses a simplified structure with single-command deployment:
- **Frontend**: Dashboard (Next.js static export)
- **Backend**: Convex serverless functions  
- **Deployment**: Single `pnpm deploy` command handles both frontend and backend

## Repository Structure

```
consulate/
├── dashboard/          # Frontend Next.js application
├── convex/            # Backend serverless functions
├── packages/          # Shared configuration
└── test/              # Test files
```

## Development Workflow

### Setup
1. Install Homebrew PNPM: `brew install pnpm`
2. Install dependencies: `pnpm install`
3. Start development: `pnpm dev`

### Development Commands
- **Start dev environment**: `pnpm dev` - Runs both Convex backend and dashboard frontend
- **Build project**: `pnpm build` - Builds all components
- **Run tests**: `pnpm test:run` - Executes test suite
- **Type checking**: `pnpm type-check` - Validates TypeScript

## Deployment Process

### Single Command Deployment
```bash
pnpm deploy
```

This single command:
1. Automatically builds the dashboard as static files (via `predeploy` hook) 
2. Deploys Convex backend functions with fresh dashboard assets
3. Configures Convex to serve the dashboard static files
4. Handles both development and production deployments

The `predeploy` hook ensures the dashboard is built before `convex deploy` runs, guaranteeing that Convex serves the latest static assets.

### How It Works
- **Dashboard**: Built as static export in `dashboard/out/`
- **Static serving**: Convex serves dashboard files via `httpMounts` configuration
- **API integration**: Dashboard uses Convex client for backend communication
- **Routing**: Convex handles both API requests and static file serving

## Environment Configuration

Development and production environments are configured via:
- `convex.json` - Convex configuration with static file serving
- `dashboard/next.config.ts` - Next.js static export configuration
- Environment variables set in Convex dashboard

## Troubleshooting

### Common Issues
- **Build failures**: Run `pnpm build` locally first to test
- **Static export issues**: Check `dashboard/next.config.ts` configuration
- **Convex deployment**: Verify authentication with `convex auth`
- **PNPM issues**: Ensure using Homebrew PNPM (`which pnpm`)

### Verification
- **PNPM source**: `which pnpm` should show `/opt/homebrew/bin/pnpm`
- **Local build**: `pnpm build` should complete without errors
- **Development**: `pnpm dev` should start both services
- **Tests**: `pnpm test:run` should pass all tests
