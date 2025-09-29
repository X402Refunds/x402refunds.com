# Project Structure

This document provides a comprehensive overview of the Consulate monorepo structure and organization.

## Overview

Consulate follows a well-organized monorepo structure with clear separation of concerns. The project is designed around a production architecture with a Vercel-deployed Next.js frontend and Convex backend, supported by shared configuration packages and comprehensive tooling.

## Directory Structure

```
consulate/
├── dashboard/               # Next.js frontend application
│   ├── src/
│   │   ├── app/             # Next.js 13+ app router
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   └── lib/             # Frontend utilities
│   ├── public/              # Static assets
│   └── package.json         # Frontend dependencies
├── convex/                  # Serverless backend (Convex functions)
│   ├── _generated/          # Auto-generated Convex files
│   ├── agents.ts            # AI agent management
│   ├── cases.ts             # Case management system
│   ├── constitution.ts      # Constitutional framework
│   ├── courtEngine.ts       # Court decision engine
│   ├── judges.ts            # Judge panel system
│   ├── compliance/          # Legal compliance modules
│   ├── federation/          # International cooperation
│   ├── governance/          # Constitutional governance
│   ├── humanOverride/       # Human authority controls
│   ├── institutionalAgents/ # Specialized AI agents
│   ├── prompts/             # AI prompt templates
│   ├── sovereignty/         # National sovereignty controls
│   └── schema.ts            # Database schema
├── packages/                # Shared packages
│   └── config/              # Shared configuration
│       ├── src/
│       │   ├── eslint.ts    # ESLint configuration
│       │   └── typescript.ts # TypeScript configuration
│       └── package.json     # Config package dependencies
├── docs/                    # Project documentation
│   ├── architecture/        # Technical architecture docs
│   ├── compliance/          # Legal and compliance docs
│   ├── operations/          # Deployment and operations
│   ├── product/             # Product strategy docs
│   └── specs/               # Technical specifications
├── scripts/                 # Automation and utility scripts
│   ├── lib/                 # Script utilities
│   ├── deploy-*.js          # Deployment scripts
│   ├── governance.js        # Governance utilities
│   └── monitor.js           # Monitoring scripts
├── test/                    # Test suites
│   ├── agents.test.ts       # Agent system tests
│   ├── cases.test.ts        # Case management tests
│   ├── courtEngine.test.ts  # Court engine tests
│   ├── evidence.test.ts     # Evidence handling tests
│   └── judges.test.ts       # Judge system tests
├── infra/                   # Infrastructure and deployment
│   └── deployment/          # Deployment configurations
│       ├── basic/           # Basic deployment setup
│       ├── enterprise/      # Enterprise deployment
│       └── federation/      # International federation setup
└── package.json             # Root package configuration
```

## Key Directories Explained

### `dashboard/` - Frontend Application
- **Purpose**: Vercel-deployed Next.js web interface for the Consulate system
- **Technology**: Next.js 13+ with App Router, React, TypeScript
- **Entry Point**: `src/app/page.tsx`
- **Components**: Reusable UI components in `src/components/`
- **Styling**: Tailwind CSS with shadcn/ui components

### `convex/` - Backend Functions
- **Purpose**: Convex production backend functions handling all business logic
- **Technology**: Convex (production serverless TypeScript functions)
- **Key Systems**:
  - Agent dispute resolution framework
  - Automated arbitration engine and judge panel system
  - Agent lifecycle management
  - Evidence and case processing
  - Enterprise integration APIs

### `packages/config/` - Shared Configuration
- **Purpose**: Centralized configuration for linting, TypeScript, and build tools
- **Contents**: ESLint and TypeScript configurations used across the monorepo
- **Usage**: Imported by applications and packages for consistent tooling

### `docs/` - Documentation
- **Purpose**: Comprehensive project documentation
- **Structure**:
  - `architecture/`: Technical design and structure
  - `compliance/`: Legal and regulatory documentation
  - `operations/`: Deployment and operational guides
  - `product/`: Product strategy and market analysis
  - `specs/`: Technical specifications

### `scripts/` - Automation
- **Purpose**: Automation scripts for deployment, monitoring, and utilities
- **Key Scripts**:
  - Deployment automation for various environments
  - Governance system utilities
  - Monitoring and logging tools
  - AI agent management scripts

### `test/` - Testing
- **Purpose**: Comprehensive test suites for all backend functions
- **Technology**: Vitest with custom Convex testing setup
- **Coverage**: Unit and integration tests for all major systems

### `infra/` - Infrastructure
- **Purpose**: Deployment configurations and infrastructure as code
- **Contents**: YAML configurations for different deployment scenarios
- **Environments**: Basic, enterprise, and federation deployment setups

## Development Workflows

### Frontend Development
- Work in `dashboard/src/`
- Start development: `pnpm dev` (Vercel dev mode)
- Deploy to production: `pnpm deploy:frontend`
- Components in `src/components/`
- Pages in `src/app/`

### Backend Development
- Work in `convex/`
- Deploy to production: `pnpm deploy`
- Functions run in Convex production environment
- Schema defined in `schema.ts`

### Shared Configuration
- Modify `packages/config/src/`
- Changes affect all applications
- ESLint and TypeScript configs

### Documentation
- Add to appropriate `docs/` subdirectory
- Follow existing structure and format
- Link between related documents

## File Placement Guidelines

| File Type | Location | Examples |
|-----------|----------|----------|
| React Components | `dashboard/src/components/` | Button.tsx, Modal.tsx |
| Next.js Pages | `dashboard/src/app/` | page.tsx, layout.tsx |
| Convex Functions | `convex/` | mutations.ts, queries.ts |
| Database Schema | `convex/schema.ts` | Table definitions |
| Test Files | `test/` | *.test.ts |
| Automation Scripts | `scripts/` | *.js |
| Documentation | `docs/` | *.md |
| Configuration | `packages/config/src/` | *.ts |
| Infrastructure | `infra/` | *.yml |

## Commands and Scripts

### Project Structure Exploration
```bash
# Show visual project structure
pnpm structure

# Open architecture documentation
pnpm docs
```

### Development
```bash
# Start full development environment
pnpm dev

# Start backend only
convex dev

# Run tests
pnpm test
```

### Deployment
```bash
# Deploy backend to Convex production
pnpm deploy

# Deploy frontend to Vercel production  
pnpm deploy:frontend
```

## Adding New Components

### New Frontend Feature
1. Create components in `dashboard/src/components/`
2. Add pages in `dashboard/src/app/`
3. Update imports and routing as needed

### New Backend Function
1. Create function in appropriate `convex/` subdirectory
2. Update `schema.ts` if database changes needed
3. Add tests in `test/`

### New Shared Utility
1. Add to `packages/config/src/` if configuration-related
2. Consider `scripts/` for automation utilities
3. Update documentation in `docs/`

## Monorepo Benefits

This structure provides several advantages:
- **Clear Separation**: Frontend and backend are clearly separated
- **Shared Configuration**: Consistent tooling across all packages
- **Centralized Documentation**: All docs in one place
- **Atomic Changes**: Related changes across frontend/backend can be deployed together
- **Type Safety**: Shared types between frontend and backend
- **Efficient Development**: Single repository for the entire system

## Questions or Issues

If you're unsure where to place a file or how to organize new functionality:
1. Check this documentation
2. Look for similar existing files
3. Run `pnpm structure` to visualize the current layout
4. Follow the established patterns in each directory
