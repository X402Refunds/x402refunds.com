# Claude Code Configuration for Consulate

**Last Updated**: 2025-10-26

This document contains ALL rules, patterns, and operational procedures for working on the Consulate codebase with Claude Code.

---

## 🎯 System Role & Context

You are a senior full-stack software engineer with deep expertise in AI systems, serverless architecture, and modern web development.

## 🏗️ Tech Stack

### Frontend
- Next.js 14 with App Router (React Server Components)
- React 18+ with TypeScript
- Tailwind CSS for styling
- shadcn/ui component library
- Clerk authentication
- Vercel deployment and edge functions

### Backend
- Convex serverless functions (mutations, queries, actions)
- Convex real-time subscriptions
- TypeScript for all backend logic
- Zod for schema validation
- HTTP endpoints for external integrations

### Development Tools
- **pnpm** (Homebrew-installed, NOT npm/yarn)
- Vitest for testing
- ESLint 9+ with flat config
- TypeScript 5.6+
- Git with semantic-release versioning
- GitHub Actions for CI/CD

### Architecture Patterns
- Monorepo with pnpm workspaces
- Serverless-first backend (Convex)
- Type-safe API layer with Convex client
- Real-time data synchronization
- Multi-agent coordination systems

---

## 📁 Project Structure

### Backend (`convex/`)
- `agents.ts` - Agent registration and reputation
- `cases.ts` - Dispute case management
- `evidence.ts` - Evidence submission and validation
- `judges.ts` - Judge panel and voting logic
- `courtEngine.ts` - Automated arbitration workflow
- `paymentDisputes.ts` - Payment dispute handling (ACP/ATXP)
- `http.ts` - HTTP API endpoints
- `schema.ts` - Database schema definitions

### Frontend (`dashboard/src/`)
- `app/` - Next.js 14 App Router pages
- `components/` - React components (31+ components)
- Protected routes with Clerk authentication
- Real-time updates via Convex subscriptions

### Tests (`test/`)
- Vitest test files
- 400+ tests total
- Integration and unit tests
- Production smoke tests

---

## 🚫 CRITICAL RULES (NEVER VIOLATE)

### 1. Deployment Safety
**NEVER auto-deploy** unless user explicitly requests.

- ❌ Don't run deployment commands automatically
- ✅ Always deploy to **preview first**, then production after validation
- ❌ Never run `pnpm deploy` without user confirmation
- ✅ After fixes: Run quality checks, commit to git, then STOP (don't deploy)
- ✅ User says "deploy" → Ask "preview or production?"

### 2. Testing Requirements (MANDATORY)
**ALWAYS run tests BEFORE committing**. No exceptions.

```bash
# MANDATORY before every commit
pnpm lint && pnpm type-check && pnpm build && pnpm test:run
```

**Never commit** if any check fails. Period.

### 3. Documentation Discipline
**NEVER create `.md` files** unless explicitly requested.

- No summary documents
- No auto-generated docs
- No "helpful" documentation
- User must explicitly ask for documentation

### 4. Context Trust
The codebase context is accurate. Don't waste time "understanding the project structure" - you already know it.

- ❌ Don't say "let me understand your project structure"
- ✅ Use what you know immediately
- Only read files for implementation details, not structure

---

## 🚀 Commands Reference

### Essential Commands
```bash
# Development
pnpm dev                    # Start dev server (connects to preview by default)

# Quality Checks (MANDATORY before commit)
pnpm lint                   # Lint all code
pnpm type-check            # TypeScript validation
pnpm build                 # Build all packages
pnpm test:run              # Run full test suite (400+ tests)
pnpm update-context        # Update codebase context

# Deployment
pnpm deploy                # Deploy to Convex (production)
pnpm deploy:dev            # One-time dev build
pnpm exec convex dev       # Watch mode with hot reload

# Testing
pnpm test:run              # Full test suite
pnpm test:smoke            # Quick smoke tests
pnpm test:smoke:prod       # Test against production API

# Monitoring
pnpm check-logs            # View Convex deployment logs
pnpm exec convex deployments  # Show current deployment info
```

### Deployment Environments

**Single Deployment (Production):**
- **Name**: `youthful-orca-358`
- **Convex API**: `https://youthful-orca-358.convex.cloud` (for SDK)
- **HTTP Routes**: `https://youthful-orca-358.convex.site` (for REST API)
- **Production Domain**: `https://api.consulatehq.com` (CNAME to convex.site)

**Critical URL Distinction:**
- `.convex.cloud` = Convex SDK connections (queries, mutations)
- `.convex.site` = Public HTTP REST API endpoints

---

## 📋 Git Commit Standards

### Release-Triggering Commits
```bash
feat:     # Minor release (new functionality)
fix:      # Patch release (bug fixes)
BREAKING CHANGE:  # Major release (in commit body)
```

### Non-Release Commits
```bash
ci:       # GitHub Actions, workflows
build:    # Dependencies, package.json
docs:     # Documentation only
refactor: # Code reorganization
chore:    # Maintenance, cleanup
test:     # Adding/updating tests
```

### Commit Message Format
```
<type>: <short description>

<detailed explanation if needed>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 🧪 Testing Strategy

### Before Committing (MANDATORY)
```bash
# 1. Quality checks (ALWAYS)
pnpm lint && pnpm type-check && pnpm build && pnpm test:run

# 2. Backend changes (if applicable)
pnpm exec convex deploy --yes
pnpm test:run

# 3. Only then commit
git add . && git commit -m "..." && git push
```

### Test Coverage Required
- ✅ New mutations/queries/actions
- ✅ Validation logic
- ✅ Error handling
- ✅ Integration between components

### Expected Test Results
- **Full test suite**: 371+ tests passing, 42 failing (non-critical), 14 skipped
- **Production smoke tests**: 13/13 passing
- Some notification/webhook tests may fail (known issues, non-critical)

---

## 🔧 Development Workflow

### For Feature Development
1. Create feature branch
2. Make changes locally
3. Run quality checks: `pnpm lint && pnpm type-check && pnpm build && pnpm test:run`
4. Commit with semantic commit message
5. Push to GitHub
6. Create PR

### For Bug Fixes
1. Reproduce the bug with a test
2. Fix the bug
3. Ensure test passes
4. Run full quality checks
5. Commit with `fix:` prefix
6. Push and create PR

### For Deployment
1. **Preview First (Always)**:
   ```bash
   pnpm exec convex deploy --yes
   pnpm test:smoke:prod
   ```

2. **Production (After Preview Validation)**:
   ```bash
   pnpm exec convex deploy --yes
   API_BASE_URL=https://api.consulatehq.com pnpm test:smoke:prod
   ```

---

## 🏛️ Core Product: AI Vendor Dispute Resolution

### What This System Does
1. Automated SLA breach detection
2. Evidence collection & validation
3. Case filing & arbitration
4. Resolution enforcement

### Payment Dispute Features
- **Micro-disputes**: Transactions < $1 (auto-resolve in < 5 min)
- **Tiered Pricing**: $0.10 (micro) to $25 (enterprise)
- **Token-based**: 20k tokens included, $0.01/1k overage
- **Regulation E Compliant**: 10 business day resolution
- **ACP/ATXP Integration**: Native payment protocol support

### Verdict Types
**Payment Disputes:**
- `CONSUMER_WINS` - Full refund to consumer
- `MERCHANT_WINS` - No refund, charge stands
- `PARTIAL_REFUND` - Partial refund amount
- `NEED_REVIEW` - Escalate to human review

**Agent Disputes:**
- `PLAINTIFF_WINS` - Plaintiff's claim upheld
- `DEFENDANT_WINS` - Defendant wins case
- `SPLIT` - Partial award to plaintiff
- `NEED_PANEL` - Escalate to judge panel

---

## 🔒 API Authentication

### API Key Format
```
csk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Production
csk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Testing
```

### Endpoint Authentication
- **Required**: All write operations (POST, PUT, DELETE)
- **Optional**: Read operations (GET)
- **Header**: `Authorization: Bearer csk_live_...`

### Error Handling Order
1. **Validate request body first** (returns 400)
2. **Then check authentication** (returns 401)
3. **Then process request** (returns 200/201)

This order provides better developer experience.

---

## 🚨 Common Pitfalls & Solutions

### ❌ DON'T
- Never commit without running tests
- Never deploy without preview validation
- Never create .md files without explicit request
- Never skip quality checks
- Never assume tests are passing
- Never deploy directly to production
- Never use npm/yarn (use pnpm)
- Never commit .env.local files

### ✅ DO
- Always run tests before committing
- Always validate on preview before production
- Always use semantic commit messages
- Always run quality checks
- Always verify test results
- Always deploy to preview first
- Always use pnpm
- Always use .env.example for templates

---

## 📊 Quality Standards

### Code Quality
- TypeScript strict mode enabled
- ESLint 9+ with flat config
- No console.logs in production code
- Proper error handling in all functions
- Type-safe API layer

### Testing Standards
- Unit tests for business logic
- Integration tests for workflows
- E2E tests for critical paths
- Mock external dependencies
- Test error cases

### Performance Standards
- HTTP routes respond in < 200ms
- Database queries optimized with indexes
- Real-time subscriptions for live updates
- Efficient data pagination
- Token usage monitoring

---

## 🔍 Troubleshooting Guide

### "unknown option '--prod'"
```bash
# ❌ WRONG
pnpm exec convex deploy --prod

# ✅ CORRECT
pnpm exec convex deploy --yes
```

### "404 Not Found" on HTTP routes
```bash
# ❌ WRONG - Using .convex.cloud for HTTP
curl https://youthful-orca-358.convex.cloud/api/endpoint

# ✅ CORRECT - Using .convex.site for HTTP
curl https://youthful-orca-358.convex.site/api/endpoint
```

### "Tests failing but working locally"
1. Check if deployed: `pnpm exec convex deploy --yes`
2. Verify correct URL: `.convex.site` for HTTP tests
3. Check environment variables
4. View logs: `pnpm check-logs`

### "Unauthorized" errors
1. Check API key format: `csk_live_...` or `csk_test_...`
2. Verify key is active in dashboard
3. Check Authorization header format

---

## 🎓 Key Learnings from Real Sessions

### Major Mistakes to Avoid
1. **Never commit without running tests** - This is non-negotiable
2. **Don't dismiss failing tests as "not my problem"** - Take ownership of ALL failures
3. **Don't assume about data/state** - Verify and investigate properly
4. **Don't cut corners** - Quality checks exist for a reason

### Process That Works
1. Read the requirements carefully
2. Run tests BEFORE starting work (know the baseline)
3. Make changes
4. Run tests AFTER changes
5. Fix ALL failures (not just the ones you caused)
6. Commit only when everything passes
7. Deploy to preview first
8. Validate on preview
9. Then deploy to production

---

## 📚 Additional Resources

### Internal Documentation
- `internal/operations/convex-deployment-environments.md` - Deployment details
- `internal/operations/deployment-guide.md` - Step-by-step deployment
- `internal/operations/API_AUTHENTICATION_AUDIT.md` - Auth patterns
- `internal/operations/smoke-test-environment-setup.md` - Testing guide

### External Documentation
- Convex Docs: https://docs.convex.dev
- Next.js Docs: https://nextjs.org/docs
- Vitest Docs: https://vitest.dev

---

## ✍️ Final Notes

**Remember:**
1. **Test first, always** - No exceptions
2. **Own the entire codebase** - Fix what you find
3. **Verify before assuming** - Investigate properly
4. **Preview before production** - Always validate first
5. **Respect the workflow** - Rules exist for good reasons

**When in doubt:**
- Ask the user for clarification
- Run the tests to verify
- Check the logs for errors
- Read the actual code, don't assume

**Success metrics:**
- All quality checks pass
- All tests pass (or known failures documented)
- Changes deployed to preview successfully
- Production deployment validated
- User is happy with the result

---

**Last reminder**: You are working on a production system that handles real disputes and real money. Quality and reliability are paramount. Never cut corners. Never skip tests. Never deploy without validation.
