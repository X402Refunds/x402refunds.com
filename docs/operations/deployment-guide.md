# Deployment Guide

This guide explains the production deployment process for the Consulate Vendor Dispute Resolution platform using Vercel frontend and Convex backend.

## Overview

The system uses a production-only architecture:
- **Frontend**: Vercel-deployed Next.js dashboard
- **Backend**: Convex production serverless functions  
- **Deployment**: Separate commands for backend and frontend deployment

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

### Production Commands
- **Start dev environment**: `pnpm dev` - Runs Convex production backend and Vercel dev frontend
- **Build project**: `pnpm build` - Builds all components
- **Run tests**: `pnpm test:run` - Executes test suite against production APIs
- **Type checking**: `pnpm type-check` - Validates TypeScript

## Deployment Process

### Production Deployment Commands

#### Backend Deployment
```bash
pnpm deploy
```

#### Frontend Deployment  
Frontend automatically deploys to Vercel via GitHub integration:
- Push to `main` branch triggers automatic deployment
- Access: https://consulatehq.com
- Vercel dashboard: https://vercel.com/dashboard

The deployment process:
1. Backend deploys to Convex production environment via `pnpm deploy`
2. Frontend deploys automatically to Vercel on git push to main
3. Both services operate in production mode
4. APIs tested against production Convex backend

### How It Works
- **Dashboard**: Deployed to Vercel production
- **Backend**: Deployed to Convex production environment
- **API integration**: Dashboard uses Convex client for backend communication
- **Routing**: Vercel handles frontend routing, Convex handles API requests

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
